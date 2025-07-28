document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const userId = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    // ↓↓↓↓ ご自身の新しいウェブアプリのURLに書き換えてください ↓↓↓↓
    const gasUrl = 'https://script.google.com/macros/s/AKfycbwliS2nlVfOs5zx6IdQ8bGyGLovRFUeA8PcrrfbFF1Qkckn9sxxiUSFZHgUQJKb5OXh/exec';

    errorMessage.textContent = '';

    try {
        const response = await fetch(gasUrl, {
            method: 'POST',
            body: JSON.stringify({ 
                username: userId,
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