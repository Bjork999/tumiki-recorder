document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const userId = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = '';

    // ローディング表示
    errorMessage.textContent = 'ログイン中...';

    // フォーム送信方式でCORS問題を回避
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://script.google.com/macros/s/AKfycbzgClqQUAoOIO-m6wpfgPI66f5RBNBsaB9H2w0V1Ns0HYntWwloG7UIJEJwiOdJ-rtP/exec';
    form.target = 'loginFrame';
    form.style.display = 'none';

    // パラメータを追加
    const usernameInput = document.createElement('input');
    usernameInput.type = 'hidden';
    usernameInput.name = 'username';
    usernameInput.value = userId;
    form.appendChild(usernameInput);

    const passwordInput = document.createElement('input');
    passwordInput.type = 'hidden';
    passwordInput.name = 'password';
    passwordInput.value = password;
    form.appendChild(passwordInput);

    // 隠しiframeを作成
    const iframe = document.createElement('iframe');
    iframe.name = 'loginFrame';
    iframe.style.display = 'none';
    
    // iframeのロード完了を待つ
    iframe.onload = function() {
        setTimeout(function() {
            try {
                // iframeの内容を取得
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const responseText = iframeDoc.body ? iframeDoc.body.textContent || iframeDoc.body.innerText : '';
                
                console.log('Response received:', responseText);
                
                if (responseText && responseText.trim()) {
                    const result = JSON.parse(responseText.trim());
                    if (result.success) {
                        sessionStorage.setItem('userRole', result.role);
                        window.location.href = 'main.html';
                    } else {
                        errorMessage.textContent = result.error || 'ユーザーIDまたはパスワードが違います。';
                    }
                } else {
                    // 認証成功時はリダイレクトするため空の場合もある
                    errorMessage.textContent = 'サーバーからのレスポンスを確認できませんでした。';
                }
            } catch (error) {
                console.error('Login Error:', error);
                errorMessage.textContent = 'ログイン処理中にエラーが発生しました: ' + error.message;
            }
            
            // クリーンアップ
            if (document.body.contains(form)) document.body.removeChild(form);
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 2000); // 2秒待機
    };

    // エラーハンドリング
    iframe.onerror = function() {
        console.error('Iframe load error');
        errorMessage.textContent = 'サーバーとの通信に失敗しました。';
        if (document.body.contains(form)) document.body.removeChild(form);
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
    };

    document.body.appendChild(iframe);
    document.body.appendChild(form);
    form.submit();
});