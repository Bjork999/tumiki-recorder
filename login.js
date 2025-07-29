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
                sessionStorage.setItem('userRole', result.role);
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

    // エラーハンドリング
    script.onerror = function() {
        console.error('Script load error - 403 Forbidden or network issue');
        errorMessage.textContent = 'サーバーとの通信に失敗しました。Google Apps Scriptの権限を確認してください。';
        document.head.removeChild(script);
        delete window[callbackName];
    };

    // Google Apps ScriptのURLにパラメータを追加
    const url = `https://script.google.com/macros/s/AKfycbzgClqQUAoOIO-m6wpfgPI66f5RBNBsaB9H2w0V1Ns0HYntWwloG7UIJEJwiOdJ-rtP/exec?callback=${callbackName}&username=${encodeURIComponent(userId)}&password=${encodeURIComponent(password)}`;
    
    script.src = url;
    document.head.appendChild(script);
});