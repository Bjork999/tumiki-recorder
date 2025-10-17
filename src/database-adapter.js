/**
 * データベース抽象化レイヤー（Firestore専用）
 *
 * Firestoreを統一インターフェースで扱う
 */

// Firestore REST API
import {
  FirestoreRestClient,
  FIRESTORE_COLLECTIONS,
  createCompositeKey
} from './firestore-rest-client.js';

/**
 * データベースアダプタークラス（Firestore専用）
 */
export class DatabaseAdapter {
  constructor(env) {
    this.env = env;
    this.dbType = 'firestore'; // Firestoreのみサポート
    this.client = null;

    console.log(`📊 DatabaseAdapter初期化 (タイプ: ${this.dbType})`);
  }

  /**
   * データベースクライアントの初期化
   */
  initialize() {
    if (this.client) {
      return this.client;
    }

    try {
      console.log('🔥 Firestore REST API クライアント初期化中...');

      // 必須環境変数チェック
      if (!this.env.FIREBASE_PROJECT_ID) {
        throw new Error('FIREBASE_PROJECT_ID環境変数が設定されていません');
      }
      if (!this.env.FIREBASE_CLIENT_EMAIL) {
        throw new Error('FIREBASE_CLIENT_EMAIL環境変数が設定されていません');
      }
      if (!this.env.FIREBASE_PRIVATE_KEY) {
        throw new Error('FIREBASE_PRIVATE_KEY環境変数が設定されていません');
      }

      this.client = new FirestoreRestClient(this.env);
      console.log('✅ Firestore REST API クライアント初期化完了');

      return this.client;
    } catch (error) {
      console.error('❌ データベースクライアント初期化エラー:', error);
      throw new Error(`データベース初期化失敗: ${error.message}`);
    }
  }

  /**
   * アイテム取得（単一）
   * @param {string} table - コレクション名
   * @param {Object} key - 主キー {id: 'value'} または {userId: 'x', date: 'y'}
   * @returns {Promise<Object|null>} データ
   */
  async getItem(table, key) {
    this.initialize();

    console.log(`🔥 Firestore getItem: collection=${this._getFirestoreCollection(table)}, key=`, key);
    // Firestoreコレクション名に変換
    const collection = this._getFirestoreCollection(table);

    // 複合キーの場合は結合
    const docId = Object.keys(key).length > 1
      ? createCompositeKey(...Object.values(key))
      : Object.values(key)[0];

    const doc = await this.client.getDocument(collection, String(docId));
    console.log(`✅ Firestore getItem結果:`, doc ? 'データ取得成功' : 'データなし');
    return doc;
  }

  /**
   * アイテム一覧取得（スキャン）
   * @param {string} table - コレクション名
   * @param {Object} filters - フィルタ条件
   * @returns {Promise<Array>} データ配列
   */
  async scanItems(table, filters = {}) {
    this.initialize();

    const collection = this._getFirestoreCollection(table);
    const docs = await this.client.getCollection(collection, filters);
    return docs;
  }

  /**
   * アイテム作成・更新
   * @param {string} table - コレクション名
   * @param {Object} item - 保存データ
   * @returns {Promise<Object>} 保存結果
   */
  async putItem(table, item) {
    this.initialize();

    const collection = this._getFirestoreCollection(table);

    // ドキュメントIDの決定
    let docId;
    if (item.userId && item.dateGroup) {
      // v2形式: userId + dateGroup (dateGroup = "YYYY-MM-DD#グループ")
      docId = createCompositeKey(item.userId, item.dateGroup);
    } else if (item.userId && item.date) {
      // v1形式（後方互換性）: userId + date
      docId = createCompositeKey(item.userId, item.date);
    } else if (item.id) {
      // 単一キー
      docId = String(item.id);
    } else {
      throw new Error('ドキュメントIDを特定できません（id または userId+date が必要）');
    }

    // Firestoreに保存（idフィールドは削除）
    const { id, ...dataWithoutId } = item;
    await this.client.setDocument(collection, docId, dataWithoutId);

    return { success: true, id: docId };
  }

  /**
   * アイテム削除
   * @param {string} table - コレクション名
   * @param {Object} key - 主キー
   * @returns {Promise<Object>} 削除結果
   */
  async deleteItem(table, key) {
    this.initialize();

    const collection = this._getFirestoreCollection(table);

    // ドキュメントID決定
    const docId = Object.keys(key).length > 1
      ? createCompositeKey(...Object.values(key))
      : String(Object.values(key)[0]);

    await this.client.deleteDocument(collection, docId);
    return { success: true };
  }

  /**
   * クエリ実行（パーティションキーで検索）
   * @param {string} table - コレクション名
   * @param {string} keyName - キー名
   * @param {string} keyValue - キー値
   * @returns {Promise<Array>} データ配列
   */
  async queryItems(table, keyName, keyValue) {
    this.initialize();

    const collection = this._getFirestoreCollection(table);

    // Firestoreのwhere句を使用
    const docs = await this.client.getCollection(collection, { [keyName]: keyValue });
    return docs;
  }

  /**
   * Firestoreコレクション名の取得
   * @param {string} shortName - 短縮名（例: 'users'）
   * @returns {string} コレクション名
   * @private
   */
  _getFirestoreCollection(shortName) {
    // FIRESTORE_COLLECTIONSマッピングから取得
    const mapping = {
      'users': FIRESTORE_COLLECTIONS.USERS,
      'employees': FIRESTORE_COLLECTIONS.EMPLOYEES,
      'reports': FIRESTORE_COLLECTIONS.REPORTS,
      'daily-reports': FIRESTORE_COLLECTIONS.DAILY_REPORTS,
      'meeting-entries': FIRESTORE_COLLECTIONS.MEETING_ENTRIES,
      'morning-meeting': FIRESTORE_COLLECTIONS.MORNING_MEETING,
      'schedules': FIRESTORE_COLLECTIONS.SCHEDULES,
      'csv-schedules': FIRESTORE_COLLECTIONS.CSV_SCHEDULES,
      'role-permissions': FIRESTORE_COLLECTIONS.ROLE_PERMISSIONS,
      'sidebar-settings': FIRESTORE_COLLECTIONS.SIDEBAR_SETTINGS,
      'chat-conversations': FIRESTORE_COLLECTIONS.CHAT_CONVERSATIONS,
      'chat-messages': FIRESTORE_COLLECTIONS.CHAT_MESSAGES
    };

    return mapping[shortName] || shortName;
  }

  /**
   * データベースタイプを返す
   * @returns {string} 'firestore'
   */
  getType() {
    return this.dbType;
  }
}

/**
 * DatabaseAdapterインスタンスの取得
 * 注意: Cloudflare Workersではリクエストごとに新しいインスタンスを作成する必要がある
 */
export function getDatabaseAdapter(env) {
  return new DatabaseAdapter(env);
}
