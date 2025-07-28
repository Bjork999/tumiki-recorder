document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const userId = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = '';

    // フォームデータを作成
    const formData = new FormData();
    formData.append('username', userId);
    formData.append('password', password);

    // フォーム送信方式でCORS問題を回避
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://script.google.com/macros/s/AKfycbyna0_6rW0Ai8DvjzRq4cZT-E-TzALu8fxFFgP8vmsX_zIXhPdDwF_8z9KL29xxHER7/exec';
    form.target = 'loginFrame';

    // 隠しフィールドを追加
    const usernameField = document.createElement('input');
    usernameField.type = 'hidden';
    usernameField.name = 'username';
    usernameField.value = userId;
    form.appendChild(usernameField);

    const passwordField = document.createElement('input');
    passwordField.type = 'hidden';
    passwordField.name = 'password';
    passwordField.value = password;
    form.appendChild(passwordField);

    // 隠しiframeを作成
    const iframe = document.createElement('iframe');
    iframe.name = 'loginFrame';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // フォームを送信
    document.body.appendChild(form);
    form.submit();

    // レスポンスを処理
    iframe.onload = function() {
        try {
            const response = iframe.contentDocument.body.textContent;
            const result = JSON.parse(response);
            
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
        document.body.removeChild(form);
        document.body.removeChild(iframe);
    };
});