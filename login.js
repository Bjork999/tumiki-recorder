document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    // ↓↓↓↓ ご自身の新しいウェブアプリのURLに書き換えてください ↓↓↓↓
    const gasUrl = 'ここに新しいウェブアプリのURLを貼り付け';

    errorMessage.textContent = '';

    try {
        const response = await fetch(gasUrl, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'login',
                userId: username,
                password: password
            }),
            headers: { 'Content-Type': 'text/plain' }, // GAS特有のヘッダー
        });

        const result = await response.json();

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
});