/**
 * Firestore REST API クライアント
 *
 * Cloudflare Workers互換のFirestoreクライアント
 * Firebase Admin SDKの代わりにREST APIを使用
 */

/**
 * Google OAuth2トークン取得
 */
async function getAccessToken(env) {
  try {
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const claim = {
      iss: env.FIREBASE_CLIENT_EMAIL,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    // JWT生成
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedClaim = base64UrlEncode(JSON.stringify(claim));
    const unsignedToken = `${encodedHeader}.${encodedClaim}`;

    // 署名
    console.log('🔐 Firebase秘密鍵で署名開始');
    const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    const signature = await signJWT(unsignedToken, privateKey);
    const jwt = `${unsignedToken}.${signature}`;

    // トークン取得
    console.log('🌐 Google OAuth2トークン取得リクエスト送信');
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OAuth2トークン取得失敗:', response.status, errorText);
      throw new Error(`OAuth2トークン取得失敗 (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (!data.access_token) {
      console.error('❌ アクセストークンが応答に含まれていません:', data);
      throw new Error('アクセストークンが応答に含まれていません');
    }

    console.log('✅ OAuth2トークン取得成功');
    return data.access_token;
  } catch (error) {
    console.error('❌ getAccessToken エラー:', error);
    throw new Error(`Firebase認証エラー: ${error.message}`);
  }
}

/**
 * JWT署名
 */
async function signJWT(data, privateKey) {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // PEM形式の秘密鍵をインポート
    const pemHeader = '-----BEGIN PRIVATE KEY-----';
    const pemFooter = '-----END PRIVATE KEY-----';
    const pemContents = privateKey
      .replace(pemHeader, '')
      .replace(pemFooter, '')
      .replace(/\s/g, '');

    console.log('🔑 秘密鍵のBase64デコード開始');
    const binaryDer = base64Decode(pemContents);

    console.log('🔒 秘密鍵のインポート開始');
    const key = await crypto.subtle.importKey(
      'pkcs8',
      binaryDer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    console.log('✍️ JWT署名生成開始');
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      dataBuffer
    );

    console.log('✅ JWT署名生成完了');
    return base64UrlEncode(signature);
  } catch (error) {
    console.error('❌ JWT署名エラー:', error);
    throw new Error(`JWT署名失敗: ${error.message}`);
  }
}

/**
 * Base64 URL エンコード
 */
function base64UrlEncode(data) {
  let base64;
  if (typeof data === 'string') {
    base64 = btoa(data);
  } else if (data instanceof ArrayBuffer) {
    const bytes = new Uint8Array(data);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(binary);
  } else {
    throw new Error('Unsupported data type');
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Base64デコード
 */
function base64Decode(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Firestore REST APIクライアント
 */
// グローバルトークンキャッシュ（Cloudflare Workers実行コンテキスト内で共有）
let globalTokenCache = null;
let globalTokenExpiry = 0;

export class FirestoreRestClient {
  constructor(env) {
    this.projectId = env.FIREBASE_PROJECT_ID;
    this.env = env;
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
  }

  /**
   * アクセストークン取得（グローバルキャッシュ使用）
   */
  async getToken() {
    const now = Math.floor(Date.now() / 1000);

    // キャッシュされたトークンが有効期限内であれば再利用（5分マージン）
    if (globalTokenCache && globalTokenExpiry > now + 300) {
      console.log('🔄 Firestore トークン再利用（キャッシュヒット）');
      return globalTokenCache;
    }

    // 新規トークン取得
    console.log('🔑 Firestore 新規トークン取得中...');
    globalTokenCache = await getAccessToken(this.env);
    globalTokenExpiry = now + 3600; // 1時間有効
    console.log('✅ Firestore トークン取得完了（有効期限: 3600秒）');

    return globalTokenCache;
  }

  /**
   * ドキュメント取得
   */
  async getDocument(collection, docId) {
    const token = await this.getToken();
    const url = `${this.baseUrl}/${collection}/${docId}`;

    console.log(`🔍 Firestore getDocument: collection=${collection}, docId=${docId}, URL=${url}`);

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`⚠️ Firestore ドキュメント未検出: ${collection}/${docId}`);
        return null;
      }
      console.error(`❌ Firestore GET失敗: ${response.status} ${response.statusText}`);
      throw new Error(`Firestore GET failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Firestore getDocument成功: ${collection}/${docId}`);
    return this.convertFromFirestore(data);
  }

  /**
   * コレクション取得（フィルタリング対応）
   */
  async getCollection(collection, filters = {}) {
    const token = await this.getToken();
    const url = `${this.baseUrl}:runQuery`;

    // クエリ構築
    const query = {
      structuredQuery: {
        from: [{ collectionId: collection }]
      }
    };

    // フィルタ追加
    if (Object.keys(filters).length > 0) {
      query.structuredQuery.where = {
        compositeFilter: {
          op: 'AND',
          filters: Object.entries(filters).map(([field, value]) => ({
            fieldFilter: {
              field: { fieldPath: field },
              op: 'EQUAL',
              value: this.convertToFirestore(value)
            }
          }))
        }
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(query)
    });

    if (!response.ok) {
      throw new Error(`Firestore Query failed: ${response.statusText}`);
    }

    const results = await response.json();
    if (!results || results.length === 0) return [];

    return results
      .filter(r => r.document)
      .map(r => this.convertFromFirestore(r.document));
  }

  /**
   * ドキュメント作成・更新
   */
  async setDocument(collection, docId, data) {
    const token = await this.getToken();
    const url = `${this.baseUrl}/${collection}/${docId}`;

    const firestoreData = {
      fields: this.convertToFirestoreFields(data)
    };

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(firestoreData)
    });

    if (!response.ok) {
      throw new Error(`Firestore SET failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * ドキュメント削除
   */
  async deleteDocument(collection, docId) {
    const token = await this.getToken();
    const url = `${this.baseUrl}/${collection}/${docId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Firestore DELETE failed: ${response.statusText}`);
    }

    return true;
  }

  /**
   * Firestoreフォーマットに変換
   */
  convertToFirestoreFields(data) {
    const fields = {};
    for (const [key, value] of Object.entries(data)) {
      fields[key] = this.convertToFirestore(value);
    }
    return fields;
  }

  convertToFirestore(value) {
    if (value === null || value === undefined) {
      return { nullValue: null };
    }
    if (typeof value === 'string') {
      return { stringValue: value };
    }
    if (typeof value === 'number') {
      return Number.isInteger(value)
        ? { integerValue: String(value) }
        : { doubleValue: value };
    }
    if (typeof value === 'boolean') {
      return { booleanValue: value };
    }
    if (Array.isArray(value)) {
      return {
        arrayValue: {
          values: value.map(v => this.convertToFirestore(v))
        }
      };
    }
    if (typeof value === 'object') {
      return {
        mapValue: {
          fields: this.convertToFirestoreFields(value)
        }
      };
    }
    return { stringValue: String(value) };
  }

  /**
   * Firestoreフォーマットから変換
   */
  convertFromFirestore(doc) {
    if (!doc || !doc.fields) return null;

    const data = {};
    for (const [key, value] of Object.entries(doc.fields)) {
      data[key] = this.extractValue(value);
    }

    // ドキュメントIDを追加
    if (doc.name) {
      const parts = doc.name.split('/');
      data.id = parts[parts.length - 1];
    }

    return data;
  }

  extractValue(value) {
    if (value.stringValue !== undefined) return value.stringValue;
    if (value.integerValue !== undefined) return parseInt(value.integerValue);
    if (value.doubleValue !== undefined) return value.doubleValue;
    if (value.booleanValue !== undefined) return value.booleanValue;
    if (value.nullValue !== undefined) return null;
    if (value.arrayValue) {
      return value.arrayValue.values?.map(v => this.extractValue(v)) || [];
    }
    if (value.mapValue) {
      const obj = {};
      for (const [k, v] of Object.entries(value.mapValue.fields || {})) {
        obj[k] = this.extractValue(v);
      }
      return obj;
    }
    return null;
  }
}

/**
 * Firestoreコレクション名のマッピング
 */
export const FIRESTORE_COLLECTIONS = {
  EMPLOYEES: 'employees',
  USERS: 'users',
  REPORTS: 'reports',
  DAILY_REPORTS: 'daily-reports',
  MEETING_ENTRIES: 'meeting-entries',
  MORNING_MEETING: 'morning-meeting',
  SCHEDULES: 'schedules',
  ATTENDANCE: 'attendance',
  SHIFTS: 'shifts',
  ROLE_PERMISSIONS: 'role-permissions',
  SIDEBAR_SETTINGS: 'sidebar-settings',
  CSV_SCHEDULES: 'csv-schedules',
  CHAT_CONVERSATIONS: 'chat-conversations',
  CHAT_MESSAGES: 'chat-messages'
};

/**
 * 複合キー生成
 */
export function createCompositeKey(...keys) {
  return keys.filter(k => k !== null && k !== undefined).join('_');
}
