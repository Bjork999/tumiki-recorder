/**
 * Response Utilities
 * 標準化されたレスポンス生成ヘルパー
 */

import { corsHeaders } from './error-handler.js';

/**
 * JSON レスポンスを作成
 * @param {Object} data - レスポンスデータ
 * @param {number} status - HTTPステータスコード
 * @param {Object} additionalHeaders - 追加ヘッダー
 * @returns {Response} JSONレスポンス
 */
export function createJsonResponse(data, status = 200, additionalHeaders = {}) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        ...additionalHeaders
      }
    }
  );
}

/**
 * 成功レスポンスを作成（success: trueを含む）
 * @param {Object} data - レスポンスデータ
 * @param {number} status - HTTPステータスコード
 * @returns {Response} 成功レスポンス
 */
export function successResponse(data = {}, status = 200) {
  return createJsonResponse(
    {
      success: true,
      ...data
    },
    status
  );
}

/**
 * リストレスポンスを作成
 * @param {Array} items - アイテムの配列
 * @param {number} total - 総数（ページネーション用）
 * @param {Object} meta - メタデータ
 * @returns {Response} リストレスポンス
 */
export function listResponse(items, total = null, meta = {}) {
  return successResponse({
    items,
    count: items.length,
    ...(total !== null && { total }),
    ...meta
  });
}

/**
 * 作成成功レスポンス（201 Created）
 * @param {Object} data - 作成されたリソース
 * @param {string} location - リソースのURL（オプション）
 * @returns {Response} 作成成功レスポンス
 */
export function createdResponse(data, location = null) {
  const headers = location ? { Location: location } : {};
  return createJsonResponse(
    {
      success: true,
      ...data
    },
    201,
    headers
  );
}

/**
 * 更新成功レスポンス
 * @param {Object} data - 更新されたリソース
 * @returns {Response} 更新成功レスポンス
 */
export function updatedResponse(data) {
  return successResponse(data);
}

/**
 * 削除成功レスポンス（204 No Content）
 * @returns {Response} 削除成功レスポンス
 */
export function deletedResponse() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * Not Modified レスポンス（304）
 * @param {string} etag - ETagヘッダー
 * @returns {Response} Not Modifiedレスポンス
 */
export function notModifiedResponse(etag = null) {
  const headers = { ...corsHeaders };
  if (etag) {
    headers['ETag'] = etag;
  }

  return new Response(null, {
    status: 304,
    headers
  });
}

/**
 * テキストレスポンスを作成
 * @param {string} text - レスポンステキスト
 * @param {number} status - HTTPステータスコード
 * @returns {Response} テキストレスポンス
 */
export function textResponse(text, status = 200) {
  return new Response(text, {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}

/**
 * HTMLレスポンスを作成
 * @param {string} html - HTMLコンテンツ
 * @param {number} status - HTTPステータスコード
 * @returns {Response} HTMLレスポンス
 */
export function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}

/**
 * リダイレクトレスポンスを作成
 * @param {string} url - リダイレクト先URL
 * @param {number} status - HTTPステータスコード（301 or 302）
 * @returns {Response} リダイレクトレスポンス
 */
export function redirectResponse(url, status = 302) {
  return new Response(null, {
    status,
    headers: {
      ...corsHeaders,
      'Location': url
    }
  });
}
