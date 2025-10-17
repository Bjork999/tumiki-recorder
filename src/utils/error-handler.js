/**
 * Error Handling Utilities
 * 統一されたエラーレスポンスとハンドリング機能を提供
 */

/**
 * CORS対応ヘッダー
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

/**
 * 統一されたエラーレスポンスを作成
 * @param {string} message - エラーメッセージ
 * @param {Error|string|Object} details - エラー詳細
 * @param {number} status - HTTPステータスコード
 * @returns {Response} エラーレスポンス
 */
export function createErrorResponse(message, details, status = 500) {
  const errorDetails = details?.message || details?.toString() || details;

  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      details: errorDetails
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * エラーをログ出力し、エラーレスポンスを返す
 * @param {string} context - エラーが発生したコンテキスト
 * @param {Error} error - エラーオブジェクト
 * @param {number} status - HTTPステータスコード
 * @returns {Response} エラーレスポンス
 */
export function logAndReturnError(context, error, status = 500) {
  console.error(`[${context}] エラー:`, error);
  return createErrorResponse(`${context}エラー`, error, status);
}

/**
 * バリデーションエラーレスポンスを作成
 * @param {string} message - エラーメッセージ
 * @param {Object} validationErrors - バリデーションエラーの詳細
 * @returns {Response} エラーレスポンス
 */
export function createValidationError(message, validationErrors = {}) {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      validationErrors
    }),
    {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * 認証エラーレスポンスを作成
 * @param {string} message - エラーメッセージ
 * @returns {Response} エラーレスポンス
 */
export function createAuthError(message = '認証が必要です') {
  return new Response(
    JSON.stringify({
      success: false,
      error: message
    }),
    {
      status: 401,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * 権限エラーレスポンスを作成
 * @param {string} message - エラーメッセージ
 * @returns {Response} エラーレスポンス
 */
export function createPermissionError(message = 'この操作を実行する権限がありません') {
  return new Response(
    JSON.stringify({
      success: false,
      error: message
    }),
    {
      status: 403,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * リソースが見つからないエラーレスポンスを作成
 * @param {string} resource - リソース名
 * @returns {Response} エラーレスポンス
 */
export function createNotFoundError(resource = 'リソース') {
  return new Response(
    JSON.stringify({
      success: false,
      error: `${resource}が見つかりません`
    }),
    {
      status: 404,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * 成功レスポンスを作成
 * @param {Object} data - レスポンスデータ
 * @param {number} status - HTTPステータスコード
 * @returns {Response} 成功レスポンス
 */
export function createSuccessResponse(data, status = 200) {
  return new Response(
    JSON.stringify({
      success: true,
      ...data
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * CORS対応のOPTIONSレスポンスを作成
 * @returns {Response} OPTIONSレスポンス
 */
export function createOptionsResponse() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * CORSヘッダーをエクスポート
 */
export { corsHeaders };
