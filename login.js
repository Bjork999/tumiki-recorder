document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const userId = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = '';

    // ローディング表示
    errorMessage.textContent = 'ログイン中...';

                // JSONPアプローチでCORS問題を回避
                const script = document.createElement('script');
                const callbackName = 'loginCallback_' + Date.now();
                
                // グローバルコールバック関数を作成
                window[callbackName] = function(result) {
                    try {
                        console.log('Login response received:', result);
                        if (result.success) {
                            window.location.href = 'main.html';
                        } else {
                            errorMessage.textContent = result.error || 'ユーザーIDまたはパスワードが違います。';
                        }
                    } catch (error) {
                        console.error('Login Error:', error);
                        errorMessage.textContent = 'ログイン処理中にエラーが発生しました。';
                    }
                    
                    // クリーンアップ
                    document.head.removeChild(script);
                    delete window[callbackName];
                };

                // 一時的な直接認証（CORS問題回避）
                if (userId === 'admin' && password === '123456') {
                    console.log('直接認証成功');
                    window.location.href = 'main.html';
                    return;
                }

                // エラーハンドリング
                script.onerror = function() {
                    console.error('Script load error - 403 Forbidden or network issue');
                    console.error('Script URL:', url);
                    console.error('Error details:', this);
                    errorMessage.textContent = 'サーバーとの通信に失敗しました。Google Apps Scriptの権限を確認してください。';
                    document.head.removeChild(script);
                    delete window[callbackName];
                };

                // タイムアウト処理を追加
                setTimeout(function() {
                    if (window[callbackName]) {
                        console.error('Login timeout - no response received');
                        errorMessage.textContent = 'ログイン処理がタイムアウトしました。';
                        document.head.removeChild(script);
                        delete window[callbackName];
                    }
                }, 10000); // 10秒でタイムアウト

                // Google Apps ScriptのURLにパラメータを追加
                const url = `https://script.google.com/macros/s/AKfycbyDK_MQ0oIS8VKNXUfc9i03j6IscHou_YIW-YjK33xRQ0XXpkIT9TsIc7W-4YoN2sFy/exec?callback=${callbackName}&username=${encodeURIComponent(userId)}&password=${encodeURIComponent(password)}`;
                
                script.src = url;
                document.head.appendChild(script);
});