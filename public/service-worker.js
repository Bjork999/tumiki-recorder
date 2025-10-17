/**
 * Service Worker - スマートフォン用オフライン対応とキャッシュ戦略
 * モバイル環境での信頼性向上のため
 */

const CACHE_VERSION = 'tumiki-v1.0.3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DATA_CACHE = `${CACHE_VERSION}-data`;

// Service Workerインストール時
self.addEventListener('install', (event) => {
  console.log('[Service Worker] インストール中...');

  // 静的アセットは動的にキャッシュ（インストール時は空）
  // GitHub Pagesとの互換性のため
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] キャッシュ初期化完了');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] インストールエラー:', error);
      })
  );
});

// Service Worker有効化時
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] 有効化中...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 古いバージョンのキャッシュを削除
            if (cacheName !== STATIC_CACHE && cacheName !== DATA_CACHE) {
              console.log('[Service Worker] 古いキャッシュを削除:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] 有効化完了');
        return self.clients.claim();
      })
  );
});

// フェッチリクエストの処理
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // APIリクエストの処理（Network First戦略）
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirstStrategy(request, DATA_CACHE)
    );
    return;
  }

  // 静的アセットの処理（Cache First戦略）
  event.respondWith(
    cacheFirstStrategy(request, STATIC_CACHE)
  );
});

/**
 * Network First戦略（APIリクエスト用）
 * モバイルネットワークが不安定でも動作するように
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    // ネットワークから取得を試みる（リダイレクトを許可）
    const networkResponse = await fetch(request, {
      redirect: 'follow'
    });

    // 成功したらキャッシュに保存（GETリクエストかつHTTP/HTTPSのみ、リダイレクトでない）
    const url = new URL(request.url);
    if (request.method === 'GET' && networkResponse.ok &&
        (url.protocol === 'http:' || url.protocol === 'https:') &&
        networkResponse.type !== 'opaqueredirect') {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;

  } catch (error) {
    console.warn('[Service Worker] ネットワークエラー、キャッシュから取得:', request.url);

    // ネットワークエラー時はキャッシュから取得
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // キャッシュもない場合は、オフライン用のレスポンスを返す
    return new Response(
      JSON.stringify({
        success: false,
        error: 'ネットワーク接続がありません。オンライン時に再度お試しください。',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Cache First戦略（静的アセット用）
 * 高速な読み込みのため
 */
async function cacheFirstStrategy(request, cacheName) {
  // キャッシュから取得を試みる
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // キャッシュになければネットワークから取得（リダイレクトを許可）
  try {
    const networkResponse = await fetch(request, {
      redirect: 'follow'
    });

    // 成功したらキャッシュに保存（HTTPまたはHTTPSのみ、リダイレクトでない）
    const url = new URL(request.url);
    if (networkResponse.ok &&
        (url.protocol === 'http:' || url.protocol === 'https:') &&
        networkResponse.type !== 'opaqueredirect') {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;

  } catch (error) {
    console.error('[Service Worker] ネットワークエラー:', request.url, error);

    // オフライン時の基本的なHTMLレスポンス
    if (request.destination === 'document') {
      return new Response(
        `<!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>オフライン - 積み木</title>
          <style>
            body {
              font-family: 'Noto Sans JP', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #ffe4cc;
            }
            .offline-message {
              text-align: center;
              padding: 20px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .offline-message h1 {
              color: #374151;
              margin-bottom: 10px;
            }
            .offline-message p {
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <h1>📡 オフライン</h1>
            <p>インターネット接続がありません。</p>
            <p>オンライン時に再度お試しください。</p>
          </div>
        </body>
        </html>`,
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    throw error;
  }
}

// プッシュ通知の処理（将来的な拡張用）
self.addEventListener('push', (event) => {
  console.log('[Service Worker] プッシュ通知受信:', event);
  // 現時点では未実装
});

// 同期処理（将来的な拡張用 - オフライン時のデータ同期）
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] バックグラウンド同期:', event.tag);
  // 現時点では未実装
});
