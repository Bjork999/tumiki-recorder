/**
 * キャッシュユーティリティ
 * Cloudflare Workersグローバルコンテキスト用のメモリキャッシュ
 * Firestore呼び出しを最小化するための戦略的キャッシュ
 */

// グローバルキャッシュストレージ
const cache = new Map();

/**
 * キャッシュ設定
 * @param {string} key - キャッシュキー
 * @param {any} value - キャッシュする値
 * @param {number} ttl - 有効期限（秒）
 */
export function setCache(key, value, ttl = 300) {
  const expiry = Date.now() + (ttl * 1000);
  cache.set(key, { value, expiry });
}

/**
 * キャッシュ取得
 * @param {string} key - キャッシュキー
 * @returns {any|null} - キャッシュされた値、または期限切れ/未存在ならnull
 */
export function getCache(key) {
  const item = cache.get(key);

  if (!item) {
    return null;
  }

  // 有効期限チェック
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }

  return item.value;
}

/**
 * キャッシュクリア
 * @param {string} key - クリアするキャッシュキー（省略時は全クリア）
 */
export function clearCache(key = null) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * キャッシュキー生成
 * @param {string} prefix - プレフィックス
 * @param  {...any} parts - キーの構成要素
 * @returns {string} - キャッシュキー
 */
export function generateCacheKey(prefix, ...parts) {
  return `${prefix}:${parts.join(':')}`;
}

/**
 * TTL設定のプリセット
 * モバイル環境を考慮して長めに設定（不安定なネットワーク対策）
 */
export const CacheTTL = {
  SHORT: 60,      // 1分 - 頻繁に変更されるデータ
  MEDIUM: 600,    // 10分 - 通常のデータ（モバイル向けに5分→10分に延長）
  LONG: 1800,     // 30分 - あまり変更されないデータ
  VERY_LONG: 3600 // 1時間 - ほとんど変更されないデータ
};
