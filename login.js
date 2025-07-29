document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const userId = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = '';

    // ローディング表示
    errorMessage.textContent = 'ログイン中...';

                    // 隠しフォームでPOST送信（CORS回避）
                const iframe = document.createElement('iframe');
                iframe.name = 'hidden-iframe';
                iframe.style.display = 'none';
                document.body.appendChild(iframe);

                const form = document.createElement('form');
                form.method = 'POST';
                form.action = 'https://script.google.com/macros/s/AKfycbyDK_MQ0oIS8VKNXUfc9i03j6IscHou_YIW-YjK33xRQ0XXpkIT9TsIc7W-4YoN2sFy/exec';
                form.target = 'hidden-iframe';

                // ユーザーID
                const usernameInput = document.createElement('input');
                usernameInput.type = 'hidden';
                usernameInput.name = 'username';
                usernameInput.value = userId;
                form.appendChild(usernameInput);

                // パスワード
                const passwordInput = document.createElement('input');
                passwordInput.type = 'hidden';
                passwordInput.name = 'password';
                passwordInput.value = password;
                form.appendChild(passwordInput);

                document.body.appendChild(form);

                // レスポンス処理
                iframe.onload = function() {
                    try {
                        console.log('Iframe loaded, checking response...');
                        
                        // iframeの内容を確認
                        const iframeContent = iframe.contentDocument || iframe.contentWindow.document;
                        console.log('Iframe content:', iframeContent.body ? iframeContent.body.textContent : 'No body');
                        
                        if (iframeContent.body && iframeContent.body.textContent) {
                            const responseText = iframeContent.body.textContent.trim();
                            console.log('Response text:', responseText);
                            
                            try {
                                const result = JSON.parse(responseText);
                                console.log('Parsed response:', result);
                                
                                if (result.success) {
                                    window.location.href = 'main.html';
                                } else {
                                    errorMessage.textContent = result.error || 'ユーザーIDまたはパスワードが違います。';
                                }
                            } catch (parseError) {
                                console.error('JSON parse error:', parseError);
                                errorMessage.textContent = 'レスポンスの解析に失敗しました。';
                            }
                        } else {
                            console.log('Empty response. Iframe content:', iframeContent);
                            errorMessage.textContent = 'サーバーからの応答が空です。';
                        }
                    } catch (error) {
                        console.error('Iframe access error:', error);
                        errorMessage.textContent = 'レスポンスの取得に失敗しました。';
                    }
                    
                    // クリーンアップ
                    setTimeout(() => {
                        document.body.removeChild(form);
                        document.body.removeChild(iframe);
                    }, 1000);
                };

                // エラーハンドリング
                iframe.onerror = function() {
                    console.error('Iframe load error');
                    errorMessage.textContent = 'サーバーとの通信に失敗しました。';
                    document.body.removeChild(form);
                    document.body.removeChild(iframe);
                };

                // フォーム送信
                form.submit();
});