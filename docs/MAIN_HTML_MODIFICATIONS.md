# main.html 修正ガイド

## 修正が必要な箇所

### 1. データ取得処理の修正 (行番号: 1404-1450付近)

**変更前**:
```javascript
async function loadDataFromGAS() {
    const userName = sessionStorage.getItem('userName') || sessionStorage.getItem('userId') || '';
    const dataUrl = `https://script.google.com/macros/s/.../exec?action=getData&userName=${encodeURIComponent(userName)}`;

    const response = await fetch(dataUrl);
    const responseText = await response.text();
    const data = JSON.parse(responseText);

    if (data.success) {
        updateSelectOptions('user-input', data.users || []);
        // ...
    }
}
```

**変更後**:
```javascript
async function loadDataFromGAS() {
    const authToken = sessionStorage.getItem('authToken');

    if (!authToken) {
        alert('ログインしてください');
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch('/api/data', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.success) {
            // 利用者リスト更新
            const userNames = data.users.map(u => u.name);
            updateSelectOptions('user-input', userNames);

            // 支援員リスト更新
            updateSelectOptions('supporter1-input', data.supporters);
            updateSelectOptions('supporter2-input', ['', ...data.supporters]);

            // 支援種別リスト更新
            updateSelectOptions('support-type-input', data.supportTypes);

            // 様子リスト更新
            updateSelectOptions('appearance-input', data.appearances);

            // 残り時間データを保存
            window.monthlyHoursData = data.monthlyHours;
            window.usersData = data.users; // フリガナなど追加データ用

            console.log('✅ データ取得完了');
        } else {
            alert('データの取得に失敗しました');
        }
    } catch (error) {
        console.error('データ取得エラー:', error);
        alert('エラー: ' + error.message);
    }
}
```

---

### 2. フォーム送信処理の修正 (submitForm関数)

**検索方法**:
```javascript
// "submitForm" または "送信" で検索
```

**変更前**:
```javascript
async function submitForm() {
    // フォームデータ収集
    const formData = {
        year: ...,
        month: ...,
        // ...
    };

    const response = await fetch(gasUrl, {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: { 'Content-Type': 'text/plain' }
    });
}
```

**変更後**:
```javascript
async function submitForm() {
    const authToken = sessionStorage.getItem('authToken');

    if (!authToken) {
        alert('ログインしてください');
        window.location.href = 'index.html';
        return;
    }

    // フォームデータ収集
    const year = document.getElementById('year-input').value;
    const month = document.getElementById('month-input').value;
    const day = document.getElementById('day-input').value;
    const startTime = document.getElementById('start-time-input').value;
    const endTime = document.getElementById('end-time-input').value;
    const user = document.getElementById('user-input').value;
    const supporter1 = document.getElementById('supporter1-input').value;
    const supporter2 = document.getElementById('supporter2-input').value;
    const destination = document.getElementById('destination-input').value;
    const supportType = document.getElementById('support-type-input').value;
    const userCheck = document.getElementById('user-check-input').value;
    const appearance = document.getElementById('appearance-input').value;

    // 利用者IDを取得
    const selectedUser = window.usersData.find(u => u.name === user);
    if (!selectedUser) {
        alert('利用者が見つかりません');
        return;
    }

    // 時間計算
    const duration = calculateDuration(startTime, endTime);

    const formData = {
        userId: selectedUser.id,
        userName: selectedUser.name,
        date: `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`,
        startTime: startTime,
        endTime: endTime,
        duration: duration,
        staff1: supporter1,
        staff2: supporter2 || '',
        destination: destination,
        serviceType: supportType,
        checkStatus: userCheck === 'はい' ? 'ok' : '',
        notes: appearance
    };

    try {
        const response = await fetch('/api/records', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            alert('記録を保存しました');
            // フォームリセット
            document.getElementById('record-form').reset();
        } else {
            alert('保存に失敗しました: ' + result.error);
        }
    } catch (error) {
        alert('エラー: ' + error.message);
    }
}

// 時間計算関数
function calculateDuration(startTime, endTime) {
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const diff = (end - start) / 1000 / 60; // 分
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
```

---

### 3. 行き先フィールドをフリー入力に変更

**検索方法**:
```html
<!-- "destination" で検索 -->
```

**変更前**:
```html
<select id="destination-input" required>
    <option value="">選択してください</option>
</select>
```

**変更後**:
```html
<input
    type="text"
    id="destination-input"
    placeholder="行き先を入力（例: 病院、買い物、散歩）"
    required
>
```

---

### 4. 残り時間表示の追加 (オプション)

**利用者選択時に残り時間を表示する処理**:

```javascript
// 利用者選択イベント
document.getElementById('user-input').addEventListener('change', function() {
    const userName = this.value;
    const selectedUser = window.usersData.find(u => u.name === userName);

    if (selectedUser && window.monthlyHoursData && window.monthlyHoursData[selectedUser.id]) {
        const monthlyHours = window.monthlyHoursData[selectedUser.id];

        // 残り時間を表示（HTMLに表示エリアがある場合）
        console.log('残り時間:', {
            behaviorSupport: monthlyHours.behaviorSupport?.remaining,
            mobilitySupport: monthlyHours.mobilitySupport?.remaining,
            hospitalSupport: monthlyHours.hospitalSupport?.remaining
        });

        // 必要に応じてUIに表示
        // document.getElementById('remaining-time-display').textContent = ...;
    }
});
```

---

## 修正手順

1. **main.htmlをエディタで開く**
2. **"loadDataFromGAS"で検索** → データ取得処理を上記コードに置き換え
3. **"submitForm"で検索** → フォーム送信処理を上記コードに置き換え
4. **"destination-input"で検索** → selectタグをinputタグに変更
5. **保存してテスト**

---

## 注意事項

- main.htmlは約1500行あるため、検索機能を使って該当箇所を見つけてください
- 既存のコードを完全に置き換えるのではなく、必要な部分のみ修正してください
- テスト前に必ずバックアップを取ってください
