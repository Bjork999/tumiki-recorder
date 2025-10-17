// Cloudflare Workers バックエンドAPI
// 勤怠打刻システム

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORSヘッダー
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // OPTIONSリクエスト（CORS preflight）
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 静的ファイル配信
    if (request.method === 'GET' && !url.searchParams.has('action')) {
      return handleStaticFile(request, env);
    }

    // APIエンドポイント
    try {
      const action = url.searchParams.get('action') ||
                     (request.method === 'POST' ? await getPostAction(request) : null);

      if (action === 'login') {
        return await handleLogin(request, env, corsHeaders);
      } else if (action === 'attendance') {
        return await handleAttendance(request, env, corsHeaders);
      } else if (action === 'getData') {
        return await handleGetData(request, env, corsHeaders);
      }

      return jsonResponse({ success: false, error: '不明なアクション' }, 400, corsHeaders);
    } catch (error) {
      console.error('API Error:', error);
      return jsonResponse({
        success: false,
        error: `サーバーエラー: ${error.message}`
      }, 500, corsHeaders);
    }
  }
};

// POSTリクエストからアクションを取得
async function getPostAction(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await request.json();
      return data.action;
    }
  } catch (error) {
    console.error('POST action parse error:', error);
  }
  return null;
}

// 静的ファイル配信（簡易実装）
async function handleStaticFile(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // デフォルトはindex.html
  if (path === '/' || path === '') {
    return new Response(await getIndexHTML(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // attendance.htmlへのルーティング
  if (path === '/attendance' || path === '/attendance.html') {
    return new Response(await getAttendanceHTML(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  return new Response('Not Found', { status: 404 });
}

// ログイン認証処理
async function handleLogin(request, env, corsHeaders) {
  const url = new URL(request.url);
  const username = url.searchParams.get('username');
  const password = url.searchParams.get('password');
  const callback = url.searchParams.get('callback');

  if (!username || !password) {
    return jsonResponse({ success: false, error: 'ユーザーIDとパスワードが必要です' }, 400, corsHeaders, callback);
  }

  // Cloudflare KVからユーザー情報を取得
  const userKey = `user:${username}`;
  const userData = await env.ATTENDANCE_KV.get(userKey, { type: 'json' });

  if (!userData || userData.password !== password) {
    return jsonResponse({
      success: false,
      error: 'ユーザーIDまたはパスワードが違います。'
    }, 401, corsHeaders, callback);
  }

  return jsonResponse({
    success: true,
    userId: userData.userId,
    userName: userData.userName || userData.userId,
    role: userData.role || 'user'
  }, 200, corsHeaders, callback);
}

// 勤怠打刻処理
async function handleAttendance(request, env, corsHeaders) {
  try {
    const data = await request.json();
    const { userId, userName, date, time, type } = data;

    if (!userId || !date || !time || !type) {
      return jsonResponse({
        success: false,
        error: '必須パラメータが不足しています'
      }, 400, corsHeaders);
    }

    // 打刻タイプの日本語名
    const typeNames = {
      'clock-in': '出勤',
      'break-start': '休憩開始',
      'break-end': '休憩終了',
      'clock-out': '退勤'
    };

    const typeName = typeNames[type] || type;

    // Cloudflare D1に保存（または KV）
    const recordKey = `attendance:${userId}:${date}:${Date.now()}`;
    const record = {
      userId,
      userName,
      date,
      time,
      type,
      typeName,
      timestamp: new Date().toISOString()
    };

    await env.ATTENDANCE_KV.put(recordKey, JSON.stringify(record));

    // D1データベースを使用する場合（オプション）
    if (env.DB) {
      await env.DB.prepare(
        'INSERT INTO attendance (user_id, user_name, date, time, type, type_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(userId, userName, date, time, type, typeName, new Date().toISOString()).run();
    }

    return jsonResponse({
      success: true,
      message: `${typeName}を記録しました`,
      data: record
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Attendance error:', error);
    return jsonResponse({
      success: false,
      error: `勤怠打刻エラー: ${error.message}`
    }, 500, corsHeaders);
  }
}

// データ取得処理
async function handleGetData(request, env, corsHeaders) {
  // ダミーデータを返す（実際の実装ではKVやD1から取得）
  const data = {
    success: true,
    users: [],
    supporters: [],
    destinations: [],
    supportTypes: ['移動支援', '行動援護', '通院等介助'],
    appearances: [],
    supporterSupportTypes: {},
    userRemainingTimes: {},
    userFurigana: {}
  };

  return jsonResponse(data, 200, corsHeaders);
}

// JSONレスポンスヘルパー（JSONP対応）
function jsonResponse(data, status = 200, corsHeaders = {}, callback = null) {
  const headers = {
    ...corsHeaders,
    'Content-Type': callback ? 'application/javascript' : 'application/json'
  };

  const body = callback
    ? `${callback}(${JSON.stringify(data)})`
    : JSON.stringify(data);

  return new Response(body, { status, headers });
}

// HTMLファイル取得（外部ファイルとして管理する場合は、ビルド時にインポート）
async function getIndexHTML() {
  return `<!DOCTYPE html><html><body><h1>勤怠システム</h1><p>静的ファイルを配信するには、Cloudflare Pagesを使用してください。</p></body></html>`;
}

async function getAttendanceHTML() {
  return `<!DOCTYPE html><html><body><h1>勤怠打刻</h1><p>静的ファイルを配信するには、Cloudflare Pagesを使用してください。</p></body></html>`;
}
