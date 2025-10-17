import bcrypt from 'bcryptjs';
import { getDatabaseAdapter } from './database-adapter.js';
import { createLogger } from './utils/logger.js';
import {
  createErrorResponse,
  createSuccessResponse,
  createAuthError,
  createValidationError,
  corsHeaders
} from './utils/error-handler.js';
import { getCache, setCache, generateCacheKey, CacheTTL } from './utils/cache.js';

// JWT生成 (renaissance-systemから完全コピー)
async function generateJWT(payload, secret) {
  const encoder = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + 24 * 60 * 60,
  };

  function base64url(str) {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(tokenPayload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const signatureBase64 = btoa(
    String.fromCharCode(...new Uint8Array(signature))
  )
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${data}.${signatureBase64}`;
}

// JWT検証
async function verifyJWT(token, secret) {
  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) {
      return null;
    }

    const encoder = new TextEncoder();
    const data = `${header}.${payload}`;

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = Uint8Array.from(
      atob(signature.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      encoder.encode(data)
    );

    if (!valid) {
      return null;
    }

    const decodedPayload = JSON.parse(
      decodeURIComponent(
        escape(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
      )
    );

    // 有効期限チェック
    const now = Math.floor(Date.now() / 1000);
    if (decodedPayload.exp && decodedPayload.exp < now) {
      return null;
    }

    return decodedPayload;
  } catch (error) {
    console.error('JWT検証エラー:', error);
    return null;
  }
}

// 認証ミドルウェア
async function authenticateRequest(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  return payload;
}

// DB初期化
function initializeDatabase(env) {
  const adapter = getDatabaseAdapter(env);
  adapter.initialize();
  return adapter;
}

// 認証ハンドラ
async function handleLogin(request, env) {
  const logger = createLogger('AUTH', env);

  try {
    const db = initializeDatabase(env);
    const { username, password } = await request.json();

    if (!username || !password) {
      return createValidationError('ユーザーIDとパスワードが必要です');
    }

    const employee = await db.getItem('employees', { id: username });

    if (!employee) {
      return createAuthError('ユーザーが見つかりません');
    }

    const isMatch = await bcrypt.compare(password, employee.password);

    if (!isMatch) {
      return createAuthError('パスワードが正しくありません');
    }

    const token = await generateJWT({
      username: employee.id,
      id: employee.id,
      role: employee.role,
      permission: employee.permission
    }, env.JWT_SECRET);

    logger.success('ログイン成功');

    return createSuccessResponse({
      token,
      user: {
        id: employee.id,
        username: employee.id,
        name: employee.name,
        role: employee.role,
        permission: employee.permission,
        affiliation: employee.affiliation,
        workplace: employee.workplace,
        furigana: employee.furigana
      }
    });

  } catch (error) {
    logger.error('ログインエラー:', error);
    return createErrorResponse(`ログインエラー: ${error.message}`, 500);
  }
}

// データ取得API（キャッシュ戦略付き - Firestore呼び出し最小化）
async function handleGetData(env) {
  const logger = createLogger('DATA', env);

  try {
    // キャッシュキー生成（月単位でキャッシュ）
    const currentMonth = new Date().toISOString().slice(0, 7); // "2025-10"
    const cacheKey = generateCacheKey('app-data', currentMonth);

    // キャッシュチェック（5分間有効）- Firestore呼び出しを削減
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      logger.success('データ取得完了（キャッシュヒット - Firestore呼び出しなし）');
      return createSuccessResponse(cachedData);
    }

    // キャッシュミス時のみFirestoreにアクセス
    logger.info('キャッシュミス - Firestoreからデータ取得中...');
    const db = initializeDatabase(env);

    // 1. 利用者取得 (時間フィールドがある人のみ)
    const allUsers = await db.scanItems('users');
    const users = allUsers.filter(user =>
      (user.behaviorSupport?.availableTime && user.behaviorSupport.availableTime !== '') ||
      (user.mobilitySupport?.availableTime && user.mobilitySupport.availableTime !== '') ||
      (user.hospitalSupport?.availableTime && user.hospitalSupport.availableTime !== '')
    );

    // 2. 支援員取得 (株式会社ネクストステージのみ)
    const allEmployees = await db.scanItems('employees');
    const supporters = allEmployees
      .filter(emp => emp.affiliation === '株式会社ネクストステージ')
      .map(emp => emp.name)
      .sort();

    // 3. 様子リスト (定数)
    const appearances = [
      "気持ちが良さそうだった",
      "笑顔が多い様子だった",
      "少し疲れた様子だった",
      "また外出したいと話していた",
      "元気な様子だった",
      "活発に動けた",
      "少し落ち着きがなかった",
      "不安な表情が見えた",
      "コミュニケーションが多かった",
      "無口な時間があった"
    ];

    // 4. 当月の残り時間取得
    const monthlyHoursData = {};

    for (const user of users) {
      const docId = `user_${user.id}_${currentMonth}`;
      const monthlyHour = await db.getItem('monthly_hours', { id: docId });

      if (monthlyHour) {
        monthlyHoursData[user.id] = {
          behaviorSupport: monthlyHour.behaviorSupport || {},
          mobilitySupport: monthlyHour.mobilitySupport || {},
          hospitalSupport: monthlyHour.hospitalSupport || {}
        };
      }
    }

    const responseData = {
      users,
      supporters,
      supportTypes: ["移動支援", "行動援護", "通院等介助"],
      appearances,
      monthlyHours: monthlyHoursData
    };

    // キャッシュに保存（5分間有効）- 次回のFirestore呼び出しを削減
    setCache(cacheKey, responseData, CacheTTL.MEDIUM);

    logger.success(`データ取得完了（Firestoreアクセス）: 利用者=${users.length}件, 支援員=${supporters.length}件`);

    return createSuccessResponse(responseData);

  } catch (error) {
    logger.error('データ取得エラー:', error);
    return createErrorResponse(`データ取得エラー: ${error.message}`, 500);
  }
}

// 記録保存API
async function handleRecordCreate(request, env) {
  const logger = createLogger('RECORD', env);

  try {
    const db = initializeDatabase(env);
    const formData = await request.json();

    // バリデーション
    if (!formData.userId || !formData.date || !formData.startTime || !formData.endTime) {
      return createValidationError('必須フィールドが不足しています');
    }

    // csv-schedulesフォーマットに変換
    const csvData = {
      id: crypto.randomUUID(),
      userId: formData.userId,
      userName: formData.userName,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      duration: formData.duration,
      staff1: formData.staff1,
      staff2: formData.staff2 || '',
      destination: formData.destination,
      serviceType: formData.serviceType,
      checkStatus: formData.checkStatus,
      notes: formData.notes,
      serviceName: `${formData.serviceType} - ${formData.destination}`,
      fileName: 'tumiki-recorder',
      importedAt: new Date().toISOString()
    };

    // 重複チェック
    const allData = await db.scanItems('csv-schedules');
    const existingData = (allData || []).filter(item =>
      item.userId === csvData.userId &&
      item.date === csvData.date &&
      item.startTime === csvData.startTime &&
      item.endTime === csvData.endTime
    );

    if (existingData.length > 0) {
      csvData.id = existingData[0].id; // 既存IDを使用
      logger.debug('重複データ検出、上書き保存');
    }

    await db.putItem('csv-schedules', csvData);

    logger.success(`記録保存完了: ID=${csvData.id}`);

    return createSuccessResponse({
      data: csvData,
      isDuplicate: existingData.length > 0
    });

  } catch (error) {
    logger.error('記録保存エラー:', error);
    return createErrorResponse(`記録保存エラー: ${error.message}`, 500);
  }
}

// 記録取得API
async function handleRecordGet(env, userId, date) {
  const logger = createLogger('RECORD', env);

  try {
    const db = initializeDatabase(env);

    const allSchedules = await db.scanItems('csv-schedules');
    const schedules = allSchedules.filter(s =>
      s.userId === Number(userId) && s.date === date
    );

    logger.success(`記録取得完了: ${schedules.length}件`);

    return createSuccessResponse({ schedules });

  } catch (error) {
    logger.error('記録取得エラー:', error);
    return createErrorResponse(`記録取得エラー: ${error.message}`, 500);
  }
}

// メインハンドラ
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // APIルーティング
      if (url.pathname === '/api/auth/login' && request.method === 'POST') {
        return await handleLogin(request, env);
      }

      if (url.pathname === '/api/data' && request.method === 'GET') {
        return await handleGetData(env);
      }

      if (url.pathname === '/api/records' && request.method === 'POST') {
        return await handleRecordCreate(request, env);
      }

      if (url.pathname.startsWith('/api/records/') && request.method === 'GET') {
        const parts = url.pathname.split('/');
        const userId = parts[3];
        const date = parts[4];
        return await handleRecordGet(env, userId, date);
      }

      // 静的ファイル処理（ASSETS bindingを使用）
      if (env.ASSETS) {
        try {
          // ルートパスの場合はindex.htmlを返す
          if (url.pathname === '/') {
            return await env.ASSETS.fetch(new URL('/index.html', url.origin));
          }

          // その他の静的ファイル
          return await env.ASSETS.fetch(request);
        } catch (e) {
          // ASSETSでファイルが見つからない場合は404
          console.error('Static file not found:', url.pathname, e);
        }
      }

      return createErrorResponse('不明なエンドポイント', 404);

    } catch (error) {
      console.error('Worker error:', error);
      return createErrorResponse(`サーバーエラー: ${error.message}`, 500);
    }
  }
};
