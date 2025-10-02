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
    errorMessage.style.color = '#3B82F6'; // 青色でローディング表示

    // JSONPコールバック名
    const callbackName = 'loginCallback_' + Date.now();
    
    // グローバルコールバック関数を作成
    window[callbackName] = function(result) {
        try {
            console.log('ログイン応答:', result);
            
            if (result && result.success) {
                console.log('ログイン成功');
                
                // ログイン情報をセッションストレージに保存
                sessionStorage.setItem('userId', result.userId || userId);
                sessionStorage.setItem('userName', result.userName || result.userId || userId);
                
                console.log('🔍 ログイン応答の詳細:', result);
                console.log('📝 保存されたユーザー情報:', {
                    userId: sessionStorage.getItem('userId'),
                    userName: sessionStorage.getItem('userName')
                });
                
                errorMessage.textContent = 'ログイン成功！リダイレクト中...';
                errorMessage.style.color = '#10B981'; // 緑色で成功表示
                
                // モバイル対応：少し長めの待機時間
                setTimeout(() => {
                    window.location.href = 'main.html';
                }, 1000);
            } else {
                console.log('ログイン失敗:', result);
                errorMessage.textContent = result?.error || 'ユーザーIDまたはパスワードが違います。';
                errorMessage.style.color = '#EF4444'; // 赤色でエラー表示
            }
        } catch (error) {
            console.error('ログイン処理エラー:', error);
            errorMessage.textContent = 'ログイン処理中にエラーが発生しました。';
            errorMessage.style.color = '#EF4444';
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
        errorMessage.style.color = '#EF4444';
        cleanupScript();
    };

    // タイムアウト処理
    const timeoutId = setTimeout(() => {
        if (window[callbackName]) {
            console.error('ログインタイムアウト');
            errorMessage.textContent = 'ログイン処理がタイムアウトしました。再度お試しください。';
            errorMessage.style.color = '#EF4444';
            cleanupScript();
        }
    }, 20000); // モバイル対応：20秒でタイムアウト

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

    // Google Apps ScriptのURL
            const gasUrl = 'https://script.google.com/macros/s/AKfycbyPoY_eSUkljZWPKh0gSy0aVUuT4r-tRyCQxJ-EavaQgqYIMeH9EcLj5AzRA-ynzOuv/exec';
    
    console.log('ユーザーエージェント:', navigator.userAgent);
    console.log('画面サイズ:', window.innerWidth, 'x', window.innerHeight);
    
    // モバイル対応：複数の通信方法を試行
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        console.log('モバイルデバイス検出: 代替通信方法を使用');
        // モバイル用：fetch APIを試行
        tryMobileLogin();
    } else {
        console.log('デスクトップデバイス: JSONPを使用');
        // デスクトップ用：従来のJSONP
        tryJsonpLogin();
    }
    
    // モバイル用のfetch API通信
    async function tryMobileLogin() {
        try {
            const url = `${gasUrl}?action=login&username=${encodeURIComponent(userId)}&password=${encodeURIComponent(password)}`;
            console.log('モバイル用ログインリクエスト URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('モバイル用ログイン応答:', result);
            
            if (result && result.success) {
                console.log('モバイル用ログイン成功');
                console.log('🔍 モバイル用ログイン応答の詳細:', result);
                sessionStorage.setItem('userId', result.userId || userId);
                sessionStorage.setItem('userName', result.userName || result.userId || userId);
                
                console.log('📝 モバイル用保存されたユーザー情報:', {
                    userId: sessionStorage.getItem('userId'),
                    userName: sessionStorage.getItem('userName')
                });
                
                errorMessage.textContent = 'ログイン成功！リダイレクト中...';
                errorMessage.style.color = '#10B981';
                
                setTimeout(() => {
                    window.location.href = 'main.html';
                }, 1000);
            } else {
                console.log('モバイル用ログイン失敗:', result);
                errorMessage.textContent = result?.error || 'ユーザーIDまたはパスワードが違います。';
                errorMessage.style.color = '#EF4444';
            }
        } catch (error) {
            console.error('モバイル用ログインエラー:', error);
            errorMessage.textContent = 'モバイル通信に失敗しました。JSONPを試行中...';
            errorMessage.style.color = '#F59E0B';
            
            // フォールバック：JSONPを試行
            setTimeout(() => {
                tryJsonpLogin();
            }, 1000);
        }
    }
    
    // 従来のJSONP通信
    function tryJsonpLogin() {
        const url = `${gasUrl}?action=login&callback=${callbackName}&username=${encodeURIComponent(userId)}&password=${encodeURIComponent(password)}`;
        console.log('JSONPログインリクエスト URL:', url);
        
        script.src = url;
        document.head.appendChild(script);
    }
});