document.addEventListener('DOMContentLoaded', function() {
    const userRole = sessionStorage.getItem('userRole');
    if (userRole !== 'admin') {
        // adminでなければメインページにリダイレクト（ログイン画面に戻さない）
        window.location.href = 'main.html';
        return;
    }

    // ↓↓↓↓ ご自身の新しいウェブアプリのURLに書き換えてください ↓↓↓↓
    const gasUrl = 'ここに新しいウェブアプリのURLを貼り付け';
    const userList = document.getElementById('user-list');
    const addUserBtn = document.getElementById('add-user-btn');
    const newUserIdInput = document.getElementById('new-user-id');

    // ユーザーリストを取得して表示
    async function fetchUsers() {
        try {
            const response = await fetch(`${gasUrl}?action=getUsers`);
            const data = await response.json();
            if (data.success) {
                renderUserList(data.users);
            } else {
                alert('エラー: ' + data.error);
            }
        } catch (error) {
            console.error('エラー:', error);
            alert('ユーザーの取得に失敗しました。');
        }
    }

    // ユーザーリストを描画
    function renderUserList(users) {
        userList.innerHTML = '';
        users.forEach(user => {
            // 自分自身(admin)は削除できないようにする
            if (user.userId === 'admin') return;

            const li = document.createElement('li');
            li.className = 'flex justify-between items-center mb-2';
            li.textContent = user.userId;

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '削除';
            deleteBtn.className = 'bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm ml-4';
            deleteBtn.onclick = () => deleteUser(user.userId);
            li.appendChild(deleteBtn);

            userList.appendChild(li);
        });
    }

    // ユーザーを追加
    async function addUser() {
        const userId = newUserIdInput.value.trim();
        if (!userId) {
            alert('ユーザーIDを入力してください。');
            return;
        }

        const password = Math.floor(100000 + Math.random() * 900000).toString();

        try {
            const response = await fetch(gasUrl, {
                method: 'POST',
                body: JSON.stringify({ 
                    action: 'addUser', 
                    userId: userId, 
                    password: password,
                    role: 'user' // 一般ユーザーとして追加
                }),
                headers: { 'Content-Type': 'text/plain' },
            });
            const data = await response.json();
            if (data.success) {
                alert(`ユーザー「${userId}」を追加しました。\nパスワードは ${password} です。`);
                newUserIdInput.value = '';
                fetchUsers(); // リストを更新
            } else {
                alert('追加失敗: ' + data.error);
            }
        } catch (error) {
            console.error('エラー:', error);
            alert('ユーザーの追加処理中にエラーが発生しました。');
        }
    }

    // ユーザーを削除
    async function deleteUser(userId) {
        if (!confirm(`${userId}を削除しますか？`)) {
            return;
        }

        try {
            const response = await fetch(gasUrl, {
                method: 'POST',
                body: JSON.stringify({ action: 'deleteUser', userId: userId }),
                headers: { 'Content-Type': 'text/plain' },
            });
            const data = await response.json();
            if (data.success) {
                fetchUsers(); // リストを更新
            } else {
                alert('削除失敗: ' + data.error);
            }
        } catch (error) {
            console.error('エラー:', error);
            alert('ユーザーの削除処理中にエラーが発生しました。');
        }
    }

    addUserBtn.addEventListener('click', addUser);

    // 初期化
    fetchUsers();
});