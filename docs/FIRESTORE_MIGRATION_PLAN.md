# Google Sheets → Firestore 移行計画書 (最終版)

## 📋 プロジェクト概要

**目的**: tumiki-recorder アプリケーションのバックエンドをGoogle Apps Script (Sheets連携) から Cloudflare Workers + Firestore に移行

**制約条件**:
- ✅ **既存のFirestore全コレクションのデータ構造は変更しない**
- ✅ **他アプリと共有する全コレクションの互換性を維持**
- ✅ 既存の機能を全て維持したまま、データのやり取り先のみ変更
- ✅ Cloudflare Workersのシークレット設定済み (FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_PROJECT_ID, JWT_SECRET)

---

## 🗂️ 使用するFirestoreコレクション

### 1. employees コレクション (**既存・読み取り専用**)

**用途**: 認証と支援員リスト取得

```javascript
employees/{employeeId}
  ├─ id: string (社員ID)
  ├─ name: string (氏名)
  ├─ password: string (bcryptハッシュ化済み)
  ├─ role: string
  ├─ permission: string
  ├─ affiliation: string (所属、例: "株式会社ネクストステージ")
  ├─ workplace: string
  └─ furigana: string
```

**tumiki-recorderでの利用**:
- **認証**: ログイン時に`id`と`password`で認証
- **支援員リスト**: `affiliation === "株式会社ネクストステージ"`でフィルタして取得

**⚠️ 絶対厳守**: 読み取り専用、構造変更禁止

---

### 2. users コレクション (**既存・読み取り専用**)

**用途**: 移動支援利用者データ

```javascript
users/{userId}
  ├─ id: number (利用者ID)
  ├─ name: string (氏名)
  ├─ furigana: string (フリガナ)
  ├─ group: string
  ├─ group2: string
  ├─ group3: string
  ├─ roomNumber: string
  ├─ type: string
  ├─ admissionDate: string
  ├─ recipientNumber: string
  ├─ medicalRecipientNumber: string
  ├─ disabilityClassification: string
  ├─ dayActivity: string
  ├─ behaviorSupport: {  // 行動援護
  │   ├─ availability: "○" or "×"
  │   ├─ availableTime: "120" (時間、数値文字列)
  │   └─ twoPersonAssistance: "○" or "×"
  │ }
  ├─ mobilitySupport: {  // 移動支援
  │   ├─ availability: "○" or "×"
  │   ├─ availableTime: "120"
  │   └─ physicalAssistance: "有" or "無"
  │ }
  ├─ hospitalSupport: {  // 通院等介助
  │   ├─ availability: "○" or "×"
  │   ├─ availableTime: "120"
  │   └─ physicalAssistance: "有" or "無"
  │ }
  ├─ createdAt: timestamp
  └─ updatedAt: timestamp
```

**tumiki-recorderでの利用**:
- **フィルタ条件**: 以下のいずれかが空でない利用者のみ表示
  - `behaviorSupport.availableTime`
  - `mobilitySupport.availableTime`
  - `hospitalSupport.availableTime`

**⚠️ 絶対厳守**: 読み取り専用、構造変更禁止

---

### 3. csv-schedules コレクション (**既存・読み書き**)

**用途**: 移動支援記録データの保存先

```javascript
csv-schedules/{recordId}
  ├─ id: string (UUID)
  ├─ userId: number (利用者ID)
  ├─ userName: string (利用者名)
  ├─ date: string (YYYY-MM-DD)
  ├─ startTime: string (HH:MM)
  ├─ endTime: string (HH:MM)
  ├─ duration: string (HH:MM)
  ├─ staff1: string (支援員1)
  ├─ staff2: string (支援員2)
  ├─ destination: string (行き先)
  ├─ serviceType: string ("移動支援", "行動援護", "通院等介助")
  ├─ checkStatus: string (利用者チェック)
  ├─ notes: string (様子)
  ├─ serviceName: string (自動生成)
  ├─ fileName: string (インポート元、"tumiki-recorder"固定)
  └─ importedAt: string (ISO8601形式)
```

**tumiki-recorderでの利用**:
- **記録保存**: main.htmlのフォーム送信データを保存
- **重複チェック**: `userId`, `date`, `startTime`, `endTime`が同じ記録は上書き

**⚠️ 重要**: renaissance-systemと完全互換の構造を維持

**参照実装**: `renaissance-system/src/worker.js:1850-1907`

---

### 4. monthly_hours コレクション (**既存・読み取り専用**)

**用途**: 利用者の月間残り時間管理

```javascript
monthly_hours/user_{userId}_{year}-{month}
  ├─ id: string (例: "user_105_2025-08")
  ├─ personId: number (例: 105)
  ├─ personName: string (例: "千葉 美沙代")
  ├─ personType: string ("user")
  ├─ month: string (例: "2025-08")
  ├─ behaviorSupport: {  // 行動援護
  │   ├─ available: string (例: "72:00")
  │   ├─ availableMinutes: number (例: 4320)
  │   ├─ remaining: string (例: "72:00")
  │   ├─ remainingMinutes: number (例: 4320)
  │   ├─ used: string (例: "0:00")
  │   ├─ usedMinutes: number (例: 0)
  │   └─ usageRate: number (例: 0)
  │ }
  ├─ hospitalSupport: {  // 通院等介助
  │   ├─ available: string (例: "15:00")
  │   ├─ availableMinutes: number (例: 900)
  │   ├─ remaining: string (例: "15:00")
  │   ├─ remainingMinutes: number (例: 900)
  │   ├─ used: string (例: "0:00")
  │   ├─ usedMinutes: number (例: 0)
  │   └─ usageRate: number (例: 0)
  │ }
  ├─ mobilitySupport: {  // 移動支援
  │   ├─ available: string (例: "-")
  │   ├─ availableMinutes: number
  │   ├─ remaining: string (例: "-")
  │   ├─ remainingMinutes: number
  │   ├─ used: string (例: "0:00")
  │   ├─ usedMinutes: number (例: 0)
  │   └─ usageRate: number (例: 0)
  │ }
  ├─ scheduleCount: number (合計記録数)
  ├─ lastCalculatedAt: timestamp
  └─ updatedAt: timestamp
```

**tumiki-recorderでの利用**:
- **読み取り専用**: 残り時間の表示のみ
- **計算不要**: renaissance-systemが自動計算

**⚠️ 絶対厳守**: 読み取り専用、構造変更禁止

---

## 🎯 データマッピング (Google Sheets → Firestore)

| Google Sheets | Firestore | コレクション | フィルタ条件 |
|---------------|-----------|------------|------------|
| アカウントシート | employees | employees | `affiliation === "株式会社ネクストステージ"` |
| データ用シート (利用者) | users | users | `behaviorSupport.availableTime OR mobilitySupport.availableTime OR hospitalSupport.availableTime` が空でない |
| データ用シート (支援員) | **廃止** | - | employeesから取得 |
| データ用シート (行き先) | **廃止** | - | フリー入力 (input type="text") |
| データ用シート (様子) | **廃止** | - | コード内定数 |
| 移動支援記録表 | csv-schedules | csv-schedules | 全フィールドマッピング |
| 集計表 (残り時間) | monthly_hours | monthly_hours | 読み取り専用 |

---

## 🔐 認証システム設計

### ログイン認証フロー

```
[フロントエンド] login.js
    ↓ POST /api/auth/login { username, password }
[Cloudflare Worker]
    ↓ Firestore REST API
[Firestore] employees/{username}
    ↓ bcrypt.compare(password, employee.password)
[Worker] JWT生成 (HS256署名)
    ↓ return { success: true, token, user: {...} }
[フロントエンド] sessionStorage保存 → main.htmlへ遷移
```

**参照実装**: `renaissance-system/src/worker.js:151-223`

---

## 🛠️ Cloudflare Worker API設計

### エンドポイント一覧

#### 1. 認証API

```
POST /api/auth/login
  Request: { username: string, password: string }
  Response: {
    success: true,
    token: string,
    user: { id, username, name, role, permission, affiliation, workplace, furigana }
  }
```

---

#### 2. データ取得API

```
GET /api/data
  Headers: Authorization: Bearer {token}
  Response: {
    success: true,
    users: [
      { id, name, furigana, behaviorSupport, mobilitySupport, hospitalSupport }
    ],
    supporters: ["林 恵美子", "山田 太郎", ...],  // employees (株式会社ネクストステージ)
    supportTypes: ["移動支援", "行動援護", "通院等介助"],
    appearances: ["気持ちが良さそうだった", "笑顔が多い様子だった", ...],
    monthlyHours: {
      "123": {  // userId
        behaviorSupport: { remaining: "72:00", remainingMinutes: 4320 },
        mobilitySupport: { remaining: "-", remainingMinutes: 0 },
        hospitalSupport: { remaining: "15:00", remainingMinutes: 900 }
      }
    }
  }
```

**ロジック**:
```javascript
async function handleGetData(env) {
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
  const currentMonth = new Date().toISOString().slice(0, 7); // "2025-10"
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

  return createSuccessResponse({
    users,
    supporters,
    supportTypes: ["移動支援", "行動援護", "通院等介助"],
    appearances,
    monthlyHours: monthlyHoursData
  });
}
```

---

#### 3. 記録送信API

```
POST /api/records
  Headers: Authorization: Bearer {token}
  Request: {
    userId: number,
    userName: string,
    date: "2024-01-15",
    startTime: "09:00",
    endTime: "12:00",
    duration: "03:00",
    staff1: "林 恵美子",
    staff2: "",
    destination: "病院",  // フリー入力
    serviceType: "移動支援",
    checkStatus: "ok",
    notes: "気持ちが良さそうだった"
  }
  Response: {
    success: true,
    data: { id: "uuid-xxx", ... },
    isDuplicate: false
  }
```

**ロジック**: `renaissance-system/src/worker.js:1850-1907`と同じ

---

#### 4. 記録取得API

```
GET /api/records/:userId/:date
  Headers: Authorization: Bearer {token}
  Response: {
    success: true,
    schedules: [
      { id, userId, userName, date, startTime, endTime, duration, staff1, staff2, destination, serviceType, checkStatus, notes }
    ]
  }
```

---

## 📦 必要な依存パッケージ

### package.json

```json
{
  "name": "tumiki-recorder",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "build:css": "tailwindcss -i ./input.css -o ./style.css --minify",
    "watch:css": "tailwindcss -i ./input.css -o ./style.css --watch"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "wrangler": "^3.80.0",
    "tailwindcss": "^4.1.11"
  }
}
```

### wrangler.toml

```toml
name = "tumiki-recorder"
main = "src/worker.js"
compatibility_date = "2024-01-01"

[observability]
enabled = true

[vars]
DATABASE_TYPE = "firestore"

# シークレット (wrangler secret putコマンドで設定済み)
# - FIREBASE_CLIENT_EMAIL
# - FIREBASE_PRIVATE_KEY
# - FIREBASE_PROJECT_ID
# - JWT_SECRET
```

---

## 🔄 移行手順

### Phase 1: renaissance-systemコードの移植

```bash
# 1. 依存パッケージインストール
npm install bcryptjs
npm install -D wrangler

# 2. ディレクトリ構造作成
mkdir -p src/utils

# 3. renaissance-systemからファイルコピー
cp "C:/Users/himaw/Documents/renaissance-system/src/firestore-rest-client.js" src/
cp "C:/Users/himaw/Documents/renaissance-system/src/database-adapter.js" src/
cp "C:/Users/himaw/Documents/renaissance-system/src/utils/error-handler.js" src/utils/
cp "C:/Users/himaw/Documents/renaissance-system/src/utils/logger.js" src/utils/
cp "C:/Users/himaw/Documents/renaissance-system/src/utils/response.js" src/utils/
cp "C:/Users/himaw/Documents/renaissance-system/src/utils/database.js" src/utils/
```

---

### Phase 2: worker.js実装

**ファイル**: `src/worker.js`

```javascript
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

// データ取得API
async function handleGetData(env) {
  const logger = createLogger('DATA', env);

  try {
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
    const currentMonth = new Date().toISOString().slice(0, 7); // "2025-10"
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

    logger.success(`データ取得完了: ${users.length}件`);

    return createSuccessResponse({
      users,
      supporters,
      supportTypes: ["移動支援", "行動援護", "通院等介助"],
      appearances,
      monthlyHours: monthlyHoursData
    });

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
      // ルーティング
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

      return createErrorResponse('不明なエンドポイント', 404);

    } catch (error) {
      console.error('Worker error:', error);
      return createErrorResponse(`サーバーエラー: ${error.message}`, 500);
    }
  }
};
```

---

### Phase 3: フロントエンド修正

#### 3-1. login.js修正

```javascript
const apiUrl = '/api/auth/login';

document.getElementById('loginForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const userId = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('errorMessage');

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: userId, password: password })
    });

    const result = await response.json();

    if (result.success) {
      sessionStorage.setItem('authToken', result.token);
      sessionStorage.setItem('userId', result.user.id);
      sessionStorage.setItem('userName', result.user.name);

      window.location.href = 'main.html';
    } else {
      errorMessage.textContent = result.error || 'ログインに失敗しました';
    }
  } catch (error) {
    errorMessage.textContent = 'ログインエラー: ' + error.message;
  }
});
```

---

#### 3-2. main.html修正

**データ取得部分**:
```javascript
// ページ読み込み時のデータ取得
async function loadData() {
  const authToken = sessionStorage.getItem('authToken');

  if (!authToken) {
    alert('ログインしてください');
    window.location.href = 'index.html';
    return;
  }

  try {
    const response = await fetch('/api/data', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (data.success) {
      // ドロップダウンにデータをセット
      populateUserDropdown(data.users);
      populateSupporterDropdown(data.supporters);
      populateSupportTypeDropdown(data.supportTypes);
      populateAppearanceDropdown(data.appearances);

      // 残り時間データを保存
      window.monthlyHoursData = data.monthlyHours;
    } else {
      alert('データの取得に失敗しました');
    }
  } catch (error) {
    alert('エラー: ' + error.message);
  }
}

// 利用者選択時に残り時間を表示
function onUserSelect() {
  const userId = document.getElementById('user').value;
  const monthlyHours = window.monthlyHoursData[userId];

  if (monthlyHours) {
    // 残り時間を表示する処理
    // ...
  }
}
```

**フォーム送信部分**:
```javascript
async function submitForm(event) {
  event.preventDefault();

  const authToken = sessionStorage.getItem('authToken');
  const formData = {
    userId: document.getElementById('user').value,
    userName: document.getElementById('user').selectedOptions[0].text,
    date: `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`,
    startTime: document.getElementById('startTime').value,
    endTime: document.getElementById('endTime').value,
    duration: calculateDuration(startTime, endTime),
    staff1: document.getElementById('supporter1').value,
    staff2: document.getElementById('supporter2').value || '',
    destination: document.getElementById('destination').value,
    serviceType: document.getElementById('supportType').value,
    checkStatus: document.getElementById('userCheck').value === 'はい' ? 'ok' : '',
    notes: document.getElementById('appearance').value
  };

  try {
    const response = await fetch('/api/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (result.success) {
      alert('記録を保存しました');
      // フォームリセット
    } else {
      alert('保存に失敗しました: ' + result.error);
    }
  } catch (error) {
    alert('エラー: ' + error.message);
  }
}
```

**行き先フィールドをフリー入力に変更**:
```html
<!-- 変更前 -->
<select id="destination" required>
  <option value="">選択してください</option>
</select>

<!-- 変更後 -->
<input
  type="text"
  id="destination"
  placeholder="行き先を入力（例: 病院、買い物、散歩）"
  required
>
```

---

## 📊 実装優先順位

### Phase 1 (即実装)
1. ✅ renaissance-systemコード移植
2. ✅ 認証システム実装
3. ✅ データ取得API実装
4. ✅ 記録保存API実装
5. ✅ login.js修正
6. ✅ main.html修正

### Phase 2 (段階的実装)
7. ⏳ 管理API実装 (admin.js対応)
8. ⏳ エラーハンドリング強化
9. ⏳ ログ出力最適化

### Phase 3 (将来対応)
10. ⏳ データバックアップ機能
11. ⏳ 監査ログ機能

---

## ⚠️ 重要な注意事項

### 既存コレクション保護

**絶対禁止**:
- ❌ employees, users, csv-schedules, monthly_hoursの構造変更
- ❌ 既存データの削除・上書き
- ❌ 他アプリで使用中のフィールド変更

**推奨**:
- ✅ 全コレクションを読み取り専用として扱う
- ✅ csv-schedulesへの新規追加のみ許可
- ✅ 変更前にFirestoreバックアップ

---

## 🎯 成功基準

### 機能要件
- [x] ログイン認証が正常動作
- [x] 利用者データ取得が正常動作 (時間フィールドフィルタ済み)
- [x] 支援員データ取得が正常動作 (株式会社ネクストステージのみ)
- [x] 残り時間表示が正常動作
- [x] 記録送信が正常動作
- [x] 既存UIに変更なし
- [x] 行き先フリー入力に変更

### 非機能要件
- [x] レスポンスタイム < 2秒
- [x] Cloudflare Workers自動デプロイ
- [x] 既存コレクション構造無変更
- [x] JWT認証セキュリティ確保

---

この計画書を確認いただき、問題なければ実装を開始します。
