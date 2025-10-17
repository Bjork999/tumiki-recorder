/**
 * Logger Utility
 * 環境変数でログレベルを制御可能なロガー
 */

/**
 * ログレベル定義
 */
export const LOG_LEVEL = {
  ERROR: 0,   // エラーのみ
  WARN: 1,    // 警告以上
  INFO: 2,    // 情報以上
  DEBUG: 3    // 全て
};

/**
 * Loggerクラス
 */
export class Logger {
  /**
   * @param {string} context - ログのコンテキスト（例: 'AUTH', 'REPORT'）
   * @param {number} level - ログレベル
   */
  constructor(context, level = LOG_LEVEL.INFO) {
    this.context = context;
    this.level = level;
  }

  /**
   * エラーログ（常に出力）
   * @param {string} message - ログメッセージ
   * @param {...any} args - 追加の引数
   */
  error(message, ...args) {
    if (this.level >= LOG_LEVEL.ERROR) {
      console.error(`[${this.context}] ❌`, message, ...args);
    }
  }

  /**
   * 警告ログ
   * @param {string} message - ログメッセージ
   * @param {...any} args - 追加の引数
   */
  warn(message, ...args) {
    if (this.level >= LOG_LEVEL.WARN) {
      console.warn(`[${this.context}] ⚠️`, message, ...args);
    }
  }

  /**
   * 情報ログ
   * @param {string} message - ログメッセージ
   * @param {...any} args - 追加の引数
   */
  info(message, ...args) {
    if (this.level >= LOG_LEVEL.INFO) {
      console.log(`[${this.context}] ℹ️`, message, ...args);
    }
  }

  /**
   * デバッグログ
   * @param {string} message - ログメッセージ
   * @param {...any} args - 追加の引数
   */
  debug(message, ...args) {
    if (this.level >= LOG_LEVEL.DEBUG) {
      console.log(`[${this.context}] 🔍`, message, ...args);
    }
  }

  /**
   * 成功ログ
   * @param {string} message - ログメッセージ
   * @param {...any} args - 追加の引数
   */
  success(message, ...args) {
    if (this.level >= LOG_LEVEL.INFO) {
      console.log(`[${this.context}] ✅`, message, ...args);
    }
  }
}

/**
 * 環境変数からログレベルを取得
 * @param {Object} env - 環境変数オブジェクト
 * @returns {number} ログレベル
 */
function getLogLevelFromEnv(env) {
  const levelString = env.LOG_LEVEL?.toUpperCase();

  switch (levelString) {
    case 'ERROR':
      return LOG_LEVEL.ERROR;
    case 'WARN':
      return LOG_LEVEL.WARN;
    case 'INFO':
      return LOG_LEVEL.INFO;
    case 'DEBUG':
      return LOG_LEVEL.DEBUG;
    default:
      // 本番環境ではINFO、開発環境ではDEBUG
      return env.ENVIRONMENT === 'production' ? LOG_LEVEL.INFO : LOG_LEVEL.DEBUG;
  }
}

/**
 * 環境変数に基づいてLoggerインスタンスを作成
 * @param {string} context - ログのコンテキスト
 * @param {Object} env - 環境変数オブジェクト
 * @returns {Logger} Loggerインスタンス
 */
export function createLogger(context, env) {
  const level = getLogLevelFromEnv(env);
  return new Logger(context, level);
}

/**
 * グローバルログ関数（後方互換性のため）
 */
let globalLogLevel = LOG_LEVEL.INFO;

export function setGlobalLogLevel(level) {
  globalLogLevel = level;
}

export function logError(message, ...args) {
  if (globalLogLevel >= LOG_LEVEL.ERROR) {
    console.error('❌', message, ...args);
  }
}

export function logInfo(message, ...args) {
  if (globalLogLevel >= LOG_LEVEL.INFO) {
    console.log('ℹ️', message, ...args);
  }
}

export function logDebug(message, ...args) {
  if (globalLogLevel >= LOG_LEVEL.DEBUG) {
    console.log('🔍', message, ...args);
  }
}
