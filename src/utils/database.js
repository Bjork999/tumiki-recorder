/**
 * Database Utility Functions
 * DatabaseAdapterの初期化と共通操作を提供
 */

import { getDatabaseAdapter } from '../database-adapter.js';

/**
 * DatabaseAdapterを初期化して返す
 * @param {Object} env - 環境変数オブジェクト
 * @returns {Object} 初期化済みのDatabaseAdapterインスタンス
 */
export function initializeDatabase(env) {
  const db = getDatabaseAdapter(env);
  db.initialize();
  return db;
}

/**
 * データベース操作をtry-catchでラップして実行
 * @param {Function} operation - 実行する非同期操作
 * @param {string} context - エラーメッセージ用のコンテキスト
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function executeDatabaseOperation(operation, context = 'Database operation') {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    console.error(`[${context}] データベース操作エラー:`, error);
    return {
      success: false,
      error: error.message || 'データベース操作に失敗しました'
    };
  }
}
