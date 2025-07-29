document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const userId = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    // 入力値検証
    if (!userId.trim() || !password.trim()) {
        errorMessage.textContent = 'ユーザーIDとパスワードを入力してください。';
        return;
    }
    
    errorMessage.textContent = '';
    errorMessage.textContent = 'ログイン中...';

    // JSONPコールバック名
    const callbackName = 'loginCallback_' + Date.now();
    
    // グローバルコールバック関数を作成
    window[callbackName] = function(result) {
        try {
            console.log('ログイン応答:', result);
            
            if (result && result.success) {
                console.log('ログイン成功');
                errorMessage.textContent = 'ログイン成功！リダイレクト中...';
                setTimeout(() => {
                    window.location.href = 'main.html';
                }, 500);
            } else {
                console.log('ログイン失敗:', result);
                errorMessage.textContent = result?.error || 'ユーザーIDまたはパスワードが違います。';
            }
        } catch (error) {
            console.error('ログイン処理エラー:', error);
            errorMessage.textContent = 'ログイン処理中にエラーが発生しました。';
        }
        
        // クリーンアップ
        cleanupScript();
    };

    // スクリプト要素を作成
    const script = document.createElement('script');
    
    // エラーハンドリング
    script.onerror = function(event) {
        console.error('スクリプト読み込みエラー:', event);
        console.error('URL:', script.src);
        errorMessage.textContent = 'サーバーとの通信に失敗しました。しばらく待ってから再試行してください。';
        cleanupScript();
    };

    // タイムアウト処理
    const timeoutId = setTimeout(() => {
        if (window[callbackName]) {
            console.error('ログインタイムアウト');
            errorMessage.textContent = 'ログイン処理がタイムアウトしました。再度お試しください。';
            cleanupScript();
        }
    }, 15000); // 15秒でタイムアウト

    // クリーンアップ関数
    function cleanupScript() {
        try {
            if (script && script.parentNode) {
                document.head.removeChild(script);
            }
        } catch (e) {
            console.warn('スクリプト削除エラー:', e);
        }
        
        if (window[callbackName]) {
            delete window[callbackName];
        }
        
        clearTimeout(timeoutId);
    }

    // Google Apps ScriptのURL（TODO: 新しいデプロイURLに更新してください）
    const gasUrl = 'https://script.google.com/macros/s/AKfycbwcxFGoX4tr187BxSFpsRnbVuo2k9G7OowSF3oD-3dUd7KsA28ioRm5pyJLpr6ZhKdd/exec';
    const url = `${gasUrl}?action=login&callback=${callbackName}&username=${encodeURIComponent(userId)}&password=${encodeURIComponent(password)}`;
    
    console.log('ログインリクエスト URL:', url);
    
    script.src = url;
    document.head.appendChild(script);
});