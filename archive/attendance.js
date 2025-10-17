// Cloudflare Workers API URL
const API_URL = 'https://kintai.runesansu03.workers.dev';

// 認証状態
let isAuthenticated = false;
let currentUser = null;
let html5QrCode = null;
let isQRMode = true;

// DOM要素
const switchAuthButton = document.getElementById('switchAuthButton');
const pageTitle = document.getElementById('pageTitle');
const qrAuthSection = document.getElementById('qrAuthSection');
const passwordAuthSection = document.getElementById('passwordAuthSection');
const attendanceSection = document.getElementById('attendanceSection');
const qrMessage = document.getElementById('qrMessage');
const loginMessage = document.getElementById('loginMessage');
const attendanceMessage = document.getElementById('attendanceMessage');
const loginForm = document.getElementById('loginForm');
const displayUserName = document.getElementById('displayUserName');
const displayUserId = document.getElementById('displayUserId');

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    initializeQRScanner();
    setupEventListeners();
});

// QRコードスキャナーの初期化
function initializeQRScanner() {
    html5QrCode = new Html5Qrcode("qr-reader");

    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };

    html5QrCode.start(
        { facingMode: "environment" },
        config,
        onQRScanSuccess,
        onQRScanError
    ).catch(err => {
        console.error('QRスキャナー起動エラー:', err);
        qrMessage.textContent = 'カメラの起動に失敗しました';
        qrMessage.classList.add('message-error');
    });
}

// QRコード読み取り成功時
function onQRScanSuccess(decodedText, decodedResult) {
    console.log('QRコード読み取り成功:', decodedText);

    // QRコードデータをパース（想定形式: "userId:password" または JSON形式）
    let userId, password;

    try {
        // JSON形式の場合
        const data = JSON.parse(decodedText);
        userId = data.userId;
        password = data.password;
    } catch {
        // コロン区切りの場合
        const parts = decodedText.split(':');
        if (parts.length === 2) {
            userId = parts[0];
            password = parts[1];
        } else {
            qrMessage.textContent = 'QRコード形式が不正です';
            qrMessage.classList.add('message-error');
            return;
        }
    }

    // 認証処理
    authenticateUser(userId, password, true);
}

// QRコード読み取りエラー時
function onQRScanError(error) {
    // エラーは頻繁に発生するため、コンソールログのみ
    // console.warn('QRスキャンエラー:', error);
}

// イベントリスナーの設定
function setupEventListeners() {
    // 認証方法切り替えボタン
    switchAuthButton.addEventListener('click', toggleAuthMode);

    // ID/パスワードログインフォーム
    loginForm.addEventListener('submit', handlePasswordLogin);

    // 打刻ボタン
    const attendanceButtons = document.querySelectorAll('.attendance-button');
    attendanceButtons.forEach(button => {
        button.addEventListener('click', handleAttendancePunch);
    });
}

// 認証方法の切り替え
function toggleAuthMode() {
    isQRMode = !isQRMode;

    if (isQRMode) {
        // QRモードに切り替え
        switchAuthButton.textContent = 'ID/パスワード入力';
        pageTitle.textContent = '勤怠打刻 (QR)';
        qrAuthSection.classList.remove('hidden');
        passwordAuthSection.classList.add('hidden');

        // QRスキャナーを再起動
        if (html5QrCode && !html5QrCode.isScanning) {
            initializeQRScanner();
        }
    } else {
        // ID/パスワードモードに切り替え
        switchAuthButton.textContent = 'QRコード認証';
        pageTitle.textContent = '勤怠打刻 (ID)';
        qrAuthSection.classList.add('hidden');
        passwordAuthSection.classList.remove('hidden');

        // QRスキャナーを停止
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().catch(err => {
                console.error('QRスキャナー停止エラー:', err);
            });
        }
    }
}

// ID/パスワードログイン処理
function handlePasswordLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        showMessage(loginMessage, 'ユーザーIDとパスワードを入力してください', 'error');
        return;
    }

    authenticateUser(username, password, false);
}

// ユーザー認証
async function authenticateUser(userId, password, isQR) {
    try {
        const messageElement = isQR ? qrMessage : loginMessage;
        showMessage(messageElement, '認証中...', 'info');

        // Cloudflare Workers APIのログイン認証エンドポイントを呼び出し
        const url = `${API_URL}?action=login&username=${encodeURIComponent(userId)}&password=${encodeURIComponent(password)}&callback=handleLoginResponse`;

        // JSONP形式でリクエスト
        const script = document.createElement('script');
        script.src = url;
        document.body.appendChild(script);

        // グローバル関数として定義
        window.handleLoginResponse = function(response) {
            document.body.removeChild(script);

            if (response.success) {
                // 認証成功
                currentUser = {
                    userId: response.userId,
                    userName: response.userName || response.userId
                };
                isAuthenticated = true;

                showAttendanceScreen();
                showMessage(messageElement, '認証成功！', 'success');

                // QRスキャナーを停止
                if (html5QrCode && html5QrCode.isScanning) {
                    html5QrCode.stop().catch(err => {
                        console.error('QRスキャナー停止エラー:', err);
                    });
                }
            } else {
                // 認証失敗
                showMessage(messageElement, response.error || '認証に失敗しました', 'error');
            }
        };

    } catch (error) {
        console.error('認証エラー:', error);
        const messageElement = isQR ? qrMessage : loginMessage;
        showMessage(messageElement, '認証処理でエラーが発生しました', 'error');
    }
}

// 打刻画面を表示
function showAttendanceScreen() {
    qrAuthSection.classList.add('hidden');
    passwordAuthSection.classList.add('hidden');
    attendanceSection.classList.remove('hidden');

    displayUserName.textContent = currentUser.userName;
    displayUserId.textContent = `ID: ${currentUser.userId}`;

    // 切り替えボタンを非表示
    switchAuthButton.classList.add('hidden');
}

// 打刻処理
async function handleAttendancePunch(event) {
    const button = event.currentTarget;
    const attendanceType = button.dataset.type;

    if (!isAuthenticated || !currentUser) {
        showMessage(attendanceMessage, '認証されていません', 'error');
        return;
    }

    try {
        button.disabled = true;
        showMessage(attendanceMessage, '打刻中...', 'info');

        // 現在日時を取得
        const now = new Date();
        const dateStr = formatDate(now);
        const timeStr = formatTime(now);

        // Cloudflare Workers APIに送信するデータ
        const attendanceData = {
            action: 'attendance',
            userId: currentUser.userId,
            userName: currentUser.userName,
            date: dateStr,
            time: timeStr,
            type: attendanceType
        };

        console.log('打刻データ送信:', attendanceData);

        // Cloudflare Workers APIに送信
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(attendanceData)
        });

        const result = await response.json();

        if (result.success) {
            showMessage(attendanceMessage, `${getAttendanceTypeName(attendanceType)}を記録しました`, 'success');
        } else {
            showMessage(attendanceMessage, result.error || '打刻に失敗しました', 'error');
        }

        // 2秒後に画面をリセット
        setTimeout(() => {
            resetToAuthScreen();
        }, 2000);

    } catch (error) {
        console.error('打刻エラー:', error);
        showMessage(attendanceMessage, '打刻に失敗しました', 'error');
    } finally {
        button.disabled = false;
    }
}

// 認証画面にリセット
function resetToAuthScreen() {
    isAuthenticated = false;
    currentUser = null;

    attendanceSection.classList.add('hidden');
    attendanceMessage.textContent = '';

    if (isQRMode) {
        qrAuthSection.classList.remove('hidden');
        qrMessage.textContent = 'QRコードをカメラにかざしてください';
        qrMessage.className = 'message-text';

        // QRスキャナーを再起動
        if (html5QrCode && !html5QrCode.isScanning) {
            initializeQRScanner();
        }
    } else {
        passwordAuthSection.classList.remove('hidden');
        loginMessage.textContent = '';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }

    switchAuthButton.classList.remove('hidden');
}

// メッセージ表示ヘルパー
function showMessage(element, text, type) {
    element.textContent = text;
    element.className = 'message-text';

    if (type === 'error') {
        element.classList.add('message-error');
    } else if (type === 'success') {
        element.classList.add('message-success');
    }
}

// 打刻タイプの日本語名を取得
function getAttendanceTypeName(type) {
    const typeNames = {
        'clock-in': '出勤',
        'break-start': '休憩開始',
        'break-end': '休憩終了',
        'clock-out': '退勤'
    };
    return typeNames[type] || type;
}

// 日付フォーマット（YYYY/MM/DD）
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// 時刻フォーマット（HH:MM）
function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}
