document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const userId = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    // 入力値検証
    if (!userId.trim() || !password.trim()) {
        errorMessage.textContent = 'ユーザーIDとパスワードを入力してください。';
        errorMessage.style.color = '#EF4444';
        return;
    }

    errorMessage.textContent = 'ログイン中...';
    errorMessage.style.color = '#3B82F6'; // 青色でローディング表示

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: userId, password: password })
        });

        // HTTPステータスコードチェック（エラー時の無限ループ防止）
        if (!response.ok) {
            if (response.status === 401) {
                errorMessage.textContent = 'ユーザーIDまたはパスワードが違います。';
                errorMessage.style.color = '#EF4444';
                return;
            }
            throw new Error(`サーバーエラー (${response.status})`);
        }

        const result = await response.json();

        if (result.success) {
            console.log('ログイン成功');

            // セッションストレージに保存
            sessionStorage.setItem('authToken', result.token);
            sessionStorage.setItem('userId', result.user.id);
            sessionStorage.setItem('userName', result.user.name);
            sessionStorage.setItem('userRole', result.user.role || 'user');

            console.log('保存されたユーザー情報:', {
                userId: sessionStorage.getItem('userId'),
                userName: sessionStorage.getItem('userName'),
                userRole: sessionStorage.getItem('userRole')
            });

            errorMessage.textContent = 'ログイン成功！リダイレクト中...';
            errorMessage.style.color = '#10B981'; // 緑色で成功表示

            setTimeout(() => {
                window.location.href = 'main.html';
            }, 500);
        } else {
            console.log('ログイン失敗:', result);
            errorMessage.textContent = result.error || 'ユーザーIDまたはパスワードが違います。';
            errorMessage.style.color = '#EF4444'; // 赤色でエラー表示
        }
    } catch (error) {
        console.error('❌ ログインエラー:', error);
        errorMessage.textContent = 'ログインエラーが発生しました。しばらく待ってから再度お試しください。';
        errorMessage.style.color = '#EF4444';
    }
});
