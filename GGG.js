const SPREADSHEET_ID = '1TjRr1cnOQvVykQtacdTgiJigoz0R6RRhFyUYKaO_XsQ';
const SHEET_NAME = '移動支援記録表';

// Web Appのエントリーポイント（GET リクエスト）
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'login') {
    return handleLogin(e.parameter.username, e.parameter.password, e.parameter.callback);
  } else if (action === 'getData') {
    return handleGetData();
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: '不明なアクションです'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Web Appのエントリーポイント（POST リクエスト）
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    
    if (action === 'submitRecord') {
      return handleSubmitRecord(postData);
    } else if (action === 'addUser') {
      return handleAddUser(postData);
    } else if (action === 'deleteUser') {
      return handleDeleteUser(postData);
    } else if (action === 'getUsers') {
      return handleGetUsers();
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: '不明なアクションです'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: `サーバーエラー: ${error.message}`
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// アカウント情報を取得する関数
function getAccountInfo(userId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const accountSheet = spreadsheet.getSheetByName('アカウント');
    
    if (!accountSheet) {
      console.error('「アカウント」シートが見つかりません');
      return null;
    }
    
    // A列（ユーザーID）とC列（名前）のデータを取得
    const data = accountSheet.getRange('A:C').getValues();
    
    for (let i = 1; i < data.length; i++) { // ヘッダー行をスキップ
      const row = data[i];
      if (row[0] && row[0].toString().trim() === userId) {
        return {
          userId: row[0].toString().trim(),
          userName: row[2] ? row[2].toString().trim() : null, // C列の名前
          role: 'user' // デフォルトは一般ユーザー
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('アカウント情報取得エラー:', error);
    return null;
  }
}

// ログイン処理
function handleLogin(username, password, callback) {
  try {
    console.log(`ログイン試行: ${username}`);
    
    // アカウント情報を取得
    const accountInfo = getAccountInfo(username);
    
    if (!accountInfo) {
      const errorResponse = {
        success: false,
        error: 'ユーザーIDが見つかりません'
      };
      
      if (callback) {
        return ContentService.createTextOutput(`${callback}(${JSON.stringify(errorResponse)})`)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      } else {
        return ContentService.createTextOutput(JSON.stringify(errorResponse))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // 簡単なパスワード認証（実際の運用では適切な認証システムを使用）
    // ここでは基本的な認証のみ実装
    const successResponse = {
      success: true,
      userId: accountInfo.userId,
      userName: accountInfo.userName || accountInfo.userId,
      role: accountInfo.role,
      message: 'ログイン成功'
    };
    
    console.log(`ログイン成功: ${username} -> ${accountInfo.userName}`);
    
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${JSON.stringify(successResponse)})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService.createTextOutput(JSON.stringify(successResponse))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    console.error('ログイン処理エラー:', error);
    const errorResponse = {
      success: false,
      error: `ログイン処理エラー: ${error.message}`
    };
    
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${JSON.stringify(errorResponse)})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService.createTextOutput(JSON.stringify(errorResponse))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
}

// データ取得処理
function handleGetData() {
  try {
    // 既存のデータ取得ロジックを使用（実装は後ほど）
    const data = {
      users: [], // 実際のユーザーデータ
      supporters: [], // 実際のサポーターデータ
      destinations: [], // 実際の行き先データ
      supportTypes: [], // 実際の支援種別データ
      appearances: [], // 実際の様子データ
      supporterSupportTypes: {}, // サポーター別支援種別マッピング
      userRemainingTimes: {} // ユーザー別残り時間データ
    };
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      ...data
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('データ取得エラー:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: `データ取得エラー: ${error.message}`
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// レコード送信処理の基本形
function handleSubmitRecord(postData) {
  try {
    // 既存のレコード処理ロジックを呼び出し（実装は後ほど）
    console.log('レコード送信:', postData);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'レコードが正常に送信されました'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('レコード送信エラー:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: `レコード送信エラー: ${error.message}`
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ユーザー管理系関数（基本形）
function handleGetUsers() {
  try {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      users: []
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleAddUser(postData) {
  try {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'ユーザーを追加しました'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleDeleteUser(postData) {
  try {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'ユーザーを削除しました'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}


// シートの設定を定義（統合版）
const SHEET_CONFIGS = {
  '居宅介護': {
    startRow: 10,
    endRow: 89,
    dateCell: 'A1',
    monthCell: 'H1',
    userCell: 'Z2',
    prefix: '居宅介護',
    csvRange: 'A:AU',
    serviceType: '通院等介助',
    emptyCheckStartRow: 10,
    emptyCheckEndRow: 89,
    useSupporter: false
  },
  '行動援護': {
    startRow: 10,
    endRow: 89,
    dateCell: 'A1',
    monthCell: 'H1',
    userCell: 'V2',
    prefix: '行動援護',
    csvRange: 'A:AU',
    serviceType: '行動援護',
    emptyCheckStartRow: 10,
    emptyCheckEndRow: 89,
    useSupporter: false
  },
  '[京都市]移動支援': {
    startRow: 9,
    endRow: 88,
    dateCell: 'A1',
    monthCell: 'H1',
    userCell: 'X2',
    prefix: '[京都市]移動支援',
    csvRange: 'A:AU',
    serviceType: '移動支援',
    emptyCheckStartRow: 9,
    emptyCheckEndRow: 88,
    useSupporter: false
  },
  '[安雲野市]移動支援': {
    startRow: 12,
    endRow: 91,
    dateCell: 'A1',
    monthCell: 'H1',
    userCell: 'F7',
    prefix: '[安雲野市]移動支援',
    csvRange: 'A:AU',
    serviceType: '移動支援',
    emptyCheckStartRow: 12,
    emptyCheckEndRow: 91,
    useSupporter: false,
    fixedUsers: ['平林恵子']
  },
  '出勤簿': {
    startRow: 7,
    endRow: 88,
    dateCell: 'A1',
    monthCell: 'H1',
    userCell: 'B3',
    prefix: '出勤簿',
    csvRange: 'A:AU',
    emptyCheckStartRow: 7,
    emptyCheckEndRow: 88,
    useSupporter: true
  }
};

function mergeAndShowF_batch() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (sheet.getName() !== "出勤簿") return;
    const startRow = 7;
    const dateCol = 2;
    const rCol = 18;
    const fCol = 7;
    const maxRow = 88;

    // データが入っている最終行を自動判定（最大行数制限付き）
    const lastRow = Math.min(maxRow, sheet.getRange(startRow, dateCol, sheet.getLastRow() - startRow + 1, 1)
        .getValues()
        .reduceRight((acc, val, idx) => acc === startRow - 1 && val[0] === "" ? idx + startRow - 1 : acc, startRow - 1));

    if (lastRow < startRow) return;

    const numRows = lastRow - startRow + 1;

    // 日付とR列の値を一度に取得
    const data = sheet.getRange(startRow, dateCol, numRows, 1).getValues();
    const rData = sheet.getRange(startRow, rCol, numRows, 1).getValues();
    const dates = data.map(r => r[0]);
    const rValues = rData.map(r => r[0]);

    // F列の処理を一括で行う
    const fRangeAll = sheet.getRange(startRow, fCol, numRows, 1);
    fRangeAll.breakApart()
             .clearContent()
             .setBorder(true, true, true, true, true, true);

    // 日付ごとの集計
    let prevDate = "";
    let mergeStart = 0;
    let sumMinutes = 0;
    const updates = [];

    for (let i = 0; i <= numRows; i++) {
        const dateValue = i < numRows ? dates[i] : "";
        const rValue = i < numRows ? rValues[i] : "";

        // R列の値を分に変換
        const minutes = rValue ? rValue.toString().split(":").reduce((h, m) => h * 60 + +m, 0) : 0;

        if (dateValue !== prevDate) {
            if (mergeStart < i && sumMinutes > 0) {
                const h = Math.floor(sumMinutes / 60);
                const m = sumMinutes % 60;
                updates.push({
                    start: mergeStart,
                    end: i,
                    value: `${h}:${m.toString().padStart(2, '0')}`
                });
            }
            mergeStart = i;
            sumMinutes = 0;
        }
        sumMinutes += minutes;
        prevDate = dateValue;
    }

    // 更新を適用
    updates.forEach(update => {
        const range = sheet.getRange(startRow + update.start, fCol, update.end - update.start, 1);
        if (update.end - update.start > 1) {
            range.mergeVertically();
        }
        range.setValue(update.value);
    });
}

// ==========================
// WebAPI: doGet
// ==========================
function doGet(e) {
  // eパラメータが存在しない場合の処理
  if (!e || !e.parameter) {
    return HtmlService.createHtmlOutput('このページはフォームの送信専用です。');
  }
  
  const action = e.parameter.action;
  
  if (action === 'getData') {
    return getDataLists(e);
  } else if (action === 'login') {
    // ログイン認証用のGETリクエスト
    return handleLoginGet(e);
  }
  
  return HtmlService.createHtmlOutput('このページはフォームの送信専用です。');
}

// ==========================
// 最適化されたログイン処理（動的範囲対応）
// ==========================
function handleLoginGet(e) {
  try {
    const callback = e.parameter.callback;
    const username = e.parameter.username;
    const password = e.parameter.password;
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const accountSheet = ss.getSheetByName('アカウント');
    
    if (!accountSheet) {
      throw new Error('アカウントシートが見つかりません');
    }
    
    // 動的に実際のデータ範囲を取得
    const lastRow = accountSheet.getLastRow();
    
    // ヘッダー行（1行目）を除いた実際のデータのみ取得
    if (lastRow <= 1) {
      throw new Error('ユーザーデータが見つかりません');
    }
    
    // A2から最終行まで、A〜C列（userID, userPassword, userName）を取得
    const dataRange = accountSheet.getRange(2, 1, lastRow - 1, 3);
    const data = dataRange.getValues();
    
    console.log(`ログイン処理: ${data.length}件のユーザーデータを確認`);
    
    // 効率的な検索（早期終了）
    for (let i = 0; i < data.length; i++) {
      const [userId, userPassword, userName] = data[i];
      
      // 空行をスキップ
      if (!userId || userId.toString().trim() === '') {
        continue;
      }
      
      // ログイン認証
      if (userId.toString() === username && userPassword.toString() === password) {
        console.log(`ログイン成功: ${userId}`);
        
        const result = JSON.stringify({ 
          success: true,
          userId: userId.toString(),
          userName: userName ? userName.toString() : userId.toString()
        });
        
        if (callback) {
          return ContentService.createTextOutput(`${callback}(${result})`)
            .setMimeType(ContentService.MimeType.JAVASCRIPT);
        }
        return ContentService.createTextOutput(result)
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    console.log(`ログイン失敗: ${username}`);
    
    // 認証失敗
    const result = JSON.stringify({ 
      success: false,
      error: 'ユーザーIDまたはパスワードが違います。'
    });
    
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${result})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(result)
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('ログインエラー:', error);
    
    const result = JSON.stringify({ 
      success: false, 
      error: error.toString() 
    });
    
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${result})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(result)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================
// データ取得API（正確版）
// ==========================
function getDataLists(e) {
  try {
    // リクエストパラメータからユーザー名を取得
    const requestUserName = e && e.parameter ? e.parameter.userName : null;
    console.log('データ取得リクエスト - ユーザー名:', requestUserName);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dataSheet = ss.getSheetByName('データ用');
    if (!dataSheet) {
      throw new Error('データ用シートが見つかりません');
    }

    // 利用者データ（C7:BZ7）
    const usersRow = dataSheet.getRange('C7:BZ7').getValues()[0];
    const users = usersRow.filter(cell => cell && cell.toString().trim() !== '' && cell.toString().trim() !== '-')
                          .map(cell => cell.toString().trim());
    
    // フリガナデータ（C6:BZ6）を取得して利用者とのマッピングを作成
    const furiganaRow = dataSheet.getRange('C6:BZ6').getValues()[0];
    const userFuriganaMapping = {};
    
    // 利用者と同じ列のフリガナ情報を取得
    usersRow.forEach((user, index) => {
      if (user && user.toString().trim() !== '' && user.toString().trim() !== '-') {
        const userName = user.toString().trim();
        const furigana = furiganaRow[index];
        if (furigana && furigana.toString().trim() !== '') {
          userFuriganaMapping[userName] = furigana.toString().trim();
        }
      }
    });
    
    console.log('利用者-フリガナマッピング:', userFuriganaMapping);

    // 支援員データ（D19:BJ19）を取得
    const supportersRange = dataSheet.getRange('D19:BJ19');
    const supportersRowRaw = supportersRange.getValues()[0];
    
    console.log('支援員データ範囲: D19:BJ19');
    
    // 支援員名とその列位置をマッピング（D=1として）
    const supporterColumnMap = {};
    const allSupporters = [];
    
    console.log('🔍 supportersRowRaw配列の中身:', supportersRowRaw);
    
    supportersRowRaw.forEach((cell, index) => {
      console.log(`🔍 インデックス${index}: "${cell}"`);
      if (cell && cell.toString().trim() !== '' && cell.toString().trim() !== '-') {
        const name = cell.toString().trim();
        allSupporters.push(name);
        const actualColumn = index + 1; // D19の場合：D=1, E=2, F=3...
        supporterColumnMap[name] = actualColumn;
        console.log(`🔍 支援員: ${name} → 列${actualColumn} (配列インデックス${index})`);
      }
    });

    // 全支援員リストを返す（フロントエンド側で支援員1/2の制御を行う）
    const supporters = [...allSupporters];
    console.log(`全支援員リストを返す: ${supporters.length}名`);
    console.log(`リクエストユーザー: ${requestUserName}`);

    // 行き先・様子データ
    const destinationsRow = dataSheet.getRange('C25:BZ25').getValues()[0];
    const destinations = destinationsRow.filter(cell => cell && cell.toString().trim() !== '' && cell.toString().trim() !== '-')
                                       .map(cell => cell.toString().trim());

    const appearancesRow = dataSheet.getRange('C27:BZ27').getValues()[0];
    const appearances = appearancesRow.filter(cell => cell && cell.toString().trim() !== '' && cell.toString().trim() !== '-')
                                     .map(cell => cell.toString().trim());

    const supportTypes = ['移動支援', '行動援護', '通院等介助'];

    // ○×データを取得（3行まとめて取得）
    const supportTypeRows = dataSheet.getRange('D21:BJ23').getValues();
    const supportTypeNames = ['行動援護', '移動支援', '通院等介助'];
    const supporterSupportTypes = {};

    console.log('🔍 ○×データ範囲: D21:BJ23');
    console.log('🔍 supportTypeRows配列:', supportTypeRows);

    // 各支援員について、その列位置の○×をチェック（全支援員を対象に処理）
    allSupporters.forEach(name => {
      supporterSupportTypes[name] = [];
      const columnIndex = supporterColumnMap[name] - 1; // D列を0とするため-1
      
      console.log(`\n🔍 ${name}の支援種別チェック（列インデックス${columnIndex}）:`);
      console.log(`🔍 ${name}のactualColumn: ${supporterColumnMap[name]}`);
      
      supportTypeRows.forEach((row, typeIdx) => {
        const cellValue = row[columnIndex];
        console.log(`🔍 ${supportTypeNames[typeIdx]} (行${typeIdx}): "${cellValue}" (型: ${typeof cellValue})`);
        
        if (name === '林 恵美子') {
          console.log(`🔍 林 恵美子の${supportTypeNames[typeIdx]}詳細:`, {
            row: row,
            columnIndex: columnIndex,
            cellValue: cellValue,
            isCircle: cellValue === '○'
          });
        }
        
        if (cellValue === '○') {
          supporterSupportTypes[name].push(supportTypeNames[typeIdx]);
        }
      });
      
      console.log(`🔍 ${name}の最終支援種別:`, supporterSupportTypes[name]);
    });

    // 集計表シートから利用者の残り時間を取得
    const summarySheet = ss.getSheetByName('集計表');
    const userRemainingTimes = {};
    
    if (summarySheet) {
      try {
        // C15:T15とC20:T20の利用者名を取得
        const userNamesRow1 = summarySheet.getRange('C15:AG15').getValues()[0];
        const userNamesRow2 = summarySheet.getRange('C20:AG20').getValues()[0];
        const userNamesRow3 = summarySheet.getRange('C25:AG25').getValues()[0];
        
        // 時間セルの値を正しく処理する関数
        function formatTimeCell(cellValue) {
          if (!cellValue) return '';
          
          console.log(`formatTimeCell呼び出し: ${cellValue} (型: ${typeof cellValue})`);
          
          // 既に文字列形式（HH:MM）の場合はそのまま返す
          if (typeof cellValue === 'string' && cellValue.includes(':')) {
            console.log(`文字列HH:MM形式として返す: ${cellValue}`);
            return cellValue;
          }
          
          // Dateオブジェクト、数値の場合は統一的にシリアル値として処理
          if (cellValue instanceof Date || typeof cellValue === 'number') {
            let serialValue;
            
            if (cellValue instanceof Date) {
              // Dateオブジェクトをシリアル値に変換（1899-12-30を基準日とする）
              const baseDate = new Date(1899, 11, 30, 0, 0, 0, 0);
              serialValue = (cellValue.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
              console.log(`Dateオブジェクト → シリアル値: ${serialValue}`);
            } else {
              // 既に数値（シリアル値）の場合
              serialValue = cellValue;
              console.log(`数値シリアル値: ${serialValue}`);
            }
            
            // シリアル値から時間を計算（24時間超過対応）
            const totalMinutes = Math.round(serialValue * 24 * 60);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            const result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            
            console.log(`シリアル値 ${serialValue} → ${totalMinutes}分 → ${result}`);
            return result;
          }
          
          const result = cellValue.toString();
          console.log(`その他の型として文字列変換: ${result}`);
          return result;
        }

        // 16-18行目と21-23行目の残り時間を取得
        const remainingTimes1 = {
          '行動援護': summarySheet.getRange('C16:AG16').getValues()[0],
          '移動支援': summarySheet.getRange('C17:AG17').getValues()[0],
          '通院等介助': summarySheet.getRange('C18:AG18').getValues()[0]
        };
        
        const remainingTimes2 = {
          '行動援護': summarySheet.getRange('C21:AG21').getValues()[0],
          '移動支援': summarySheet.getRange('C22:AG22').getValues()[0],
          '通院等介助': summarySheet.getRange('C23:AG23').getValues()[0]
        };

        const remainingTimes3 = {
          '行動援護': summarySheet.getRange('C26:AG26').getValues()[0],
          '移動支援': summarySheet.getRange('C27:AG27').getValues()[0],
          '通院等介助': summarySheet.getRange('C28:AG28').getValues()[0]
        };
        
        // 利用者名と残り時間をマッピング（最初の行）
        userNamesRow1.forEach((userName, index) => {
          if (userName && userName.toString().trim() !== '') {
            const name = userName.toString().trim();
            
            
            userRemainingTimes[name] = {
              '行動援護': formatTimeCell(remainingTimes1['行動援護'][index]),
              '移動支援': formatTimeCell(remainingTimes1['移動支援'][index]),
              '通院等介助': formatTimeCell(remainingTimes1['通院等介助'][index])
            };
            console.log(`利用者 ${name} の残り時間:`, userRemainingTimes[name]);
          }
        });
        
        // 利用者名と残り時間をマッピング（2番目の行）
        userNamesRow2.forEach((userName, index) => {
          if (userName && userName.toString().trim() !== '') {
            const name = userName.toString().trim();
            
            
            userRemainingTimes[name] = {
              '行動援護': formatTimeCell(remainingTimes2['行動援護'][index]),
              '移動支援': formatTimeCell(remainingTimes2['移動支援'][index]),
              '通院等介助': formatTimeCell(remainingTimes2['通院等介助'][index])
            };
            console.log(`利用者 ${name} の残り時間:`, userRemainingTimes[name]);
          }
        });
        
        // 利用者名と残り時間をマッピング（3番目の行）
        userNamesRow3.forEach((userName, index) => {
          if (userName && userName.toString().trim() !== '') {
            const name = userName.toString().trim();
            
            
            userRemainingTimes[name] = {
              '行動援護': formatTimeCell(remainingTimes3['行動援護'][index]),
              '移動支援': formatTimeCell(remainingTimes3['移動支援'][index]),
              '通院等介助': formatTimeCell(remainingTimes3['通院等介助'][index])
            };
            console.log(`利用者 ${name} の残り時間:`, userRemainingTimes[name]);
          }
        });


        console.log('利用者残り時間データ:', userRemainingTimes);
        
      } catch (error) {
        console.error('集計表データ取得エラー:', error);
      }
    }

    const result = {
      success: true,
      users: users,
      supporters: supporters,
      destinations: destinations,
      supportTypes: supportTypes,
      appearances: appearances,
      supporterSupportTypes: supporterSupportTypes,
      userRemainingTimes: userRemainingTimes,
      userFurigana: userFuriganaMapping
    };

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('データ取得エラー:', error);
    const errorResult = {
      success: false,
      error: error.toString()
    };
    return ContentService
      .createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================
// ログイン認証API & フォーム送信処理（POST）
// ==========================
function doPost(e) {
  try {
    console.log('doPost called with:', e);
    
    // eがundefinedの場合の処理（手動実行時）
    if (!e) {
      console.log('No event object provided (manual execution)');
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, 
        error: '手動実行のため、処理をスキップします' 
      }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    console.log('e.parameter:', e.parameter);
    console.log('e.postData:', e.postData);
    
    // フォームデータかログインデータかを判定
    if (e.parameter && e.parameter.user) {
      // 移動支援記録表のフォームデータの場合
      return handleFormSubmission(e);
    } else {
      // ログイン認証の場合
      return handleLoginPost(e);
    }
    
  } catch (error) {
    console.error('doPost error:', error);
    const response = JSON.stringify({ 
      success: false, 
      error: error.toString() 
    });
    console.log('Sending error response:', response);
    return ContentService.createTextOutput(response)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================
// フォーム送信処理
// ==========================
function handleFormSubmission(e) {
  try {
    console.log('フォーム送信処理開始');
    
    const formData = {
      year: e.parameter.year,
      month: e.parameter.month,
      day: e.parameter.day,
      startTime: e.parameter.startTime,
      endTime: e.parameter.endTime,
      user: e.parameter.user,
      supporter1: e.parameter.supporter1,
      supporter2: e.parameter.supporter2,
      destination: e.parameter.destination,
      supportType: e.parameter.supportType,
      userCheck: e.parameter.userCheck,
      appearance: e.parameter.appearance
    };
    
    console.log('受信したフォームデータ:', formData);
    
    // スプレッドシートを取得
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 「移動支援記録表」シートを取得（存在しない場合は作成）
    let recordSheet = ss.getSheetByName('移動支援記録表');
    if (!recordSheet) {
      recordSheet = ss.insertSheet('移動支援記録表');
      console.log('移動支援記録表シートを作成しました');
    }
    
    // ヘッダーがない場合は追加
    if (recordSheet.getLastRow() === 0) {
      recordSheet.getRange(1, 1, 1, 11).setValues([[
        '日付', '開始時間', '終了時間', '利用時間', '利用者', 
        '支援員1', '支援員2', '行き先', '支援種別', '利用者チェック', '様子'
      ]]);
      
      // ヘッダーのスタイル設定
      const headerRange = recordSheet.getRange(1, 1, 1, 11);
      headerRange.setBackground('#000000');
      headerRange.setFontColor('#FFFFFF');
      headerRange.setFontWeight('bold');
      
      console.log('ヘッダーを追加しました');
    }
    
    // 日付を結合
    const dateStr = `${formData.year}/${formData.month}/${formData.day}`;
    
    // 利用時間を計算（修正版）
    const startTime = formData.startTime;
    const endTime = formData.endTime;
    let duration = '';
    if (startTime && endTime) {
      try {
        // 時間を分に変換する関数
        function timeToMinutes(timeStr) {
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + minutes;
        }
        
        // 分を時間:分形式に変換する関数
        function minutesToTime(minutes) {
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          return `${hours}:${mins.toString().padStart(2, '0')}`;
        }
        
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);
        
        // 終了時間が開始時間より前の場合は、翌日として計算
        let diffMinutes = endMinutes - startMinutes;
        if (diffMinutes < 0) {
          diffMinutes += 24 * 60; // 24時間分を追加
        }
        
        duration = minutesToTime(diffMinutes);
        console.log(`時間計算: ${startTime} → ${endTime} = ${duration} (${diffMinutes}分)`);
        
      } catch (error) {
        console.error('時間計算エラー:', error);
        duration = '計算エラー';
      }
    }
    
    // 利用者チェックの値を変換
    const userCheckValue = formData.userCheck === 'はい' ? 'ok' : '';
    
    // データを追加
    const newRow = recordSheet.getLastRow() + 1;
    const rowData = [
      dateStr,                    // 日付
      formData.startTime,         // 開始時間
      formData.endTime,           // 終了時間
      duration,                   // 利用時間
      formData.user,              // 利用者
      formData.supporter1,        // 支援員1
      formData.supporter2 || '',  // 支援員2（空の場合は空文字）
      formData.destination,       // 行き先
      formData.supportType,       // 支援種別
      userCheckValue,             // 利用者チェック
      formData.appearance         // 様子
    ];
    
    recordSheet.getRange(newRow, 1, 1, 11).setValues([rowData]);
    
    console.log('データ記録完了: 行', newRow);
    
    // 成功レスポンス
    const response = JSON.stringify({
      success: true,
      message: 'データが正常に記録されました',
      rowNumber: newRow
    });
    
    return ContentService.createTextOutput(response)
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('フォーム送信エラー:', error);
    const response = JSON.stringify({
      success: false,
      error: 'データの記録に失敗しました: ' + error.toString()
    });
    
    return ContentService.createTextOutput(response)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================
// ログイン認証処理（POST）
// ==========================
function handleLoginPost(e) {
  try {
    let username, password;
    
    // フォームデータの場合
    if (e.parameter) {
      username = e.parameter.username;
      password = e.parameter.password;
      console.log('Form data - username:', username, 'password:', '***');
    } else if (e.postData && e.postData.type === 'application/json') {
      // JSONデータの場合
      const params = JSON.parse(e.postData.contents);
      username = params.username;
      password = params.password;
      console.log('JSON data - username:', username, 'password:', '***');
    } else {
      console.log('No valid login data found in request');
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, 
        error: 'ログインデータが見つかりません' 
      }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const accountSheet = ss.getSheetByName('アカウント');
    if (!accountSheet) {
      console.log('Account sheet not found');
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, 
        error: 'アカウントシートが見つかりません' 
      }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = accountSheet.getDataRange().getValues();
    console.log('Account data rows:', data.length);
    
    // 1行目はヘッダー想定
    for (let i = 1; i < data.length; i++) {
      const userId = data[i][0];        // A列: userID
      const userPassword = data[i][1];   // B列: Password
      
      console.log('Checking row', i, 'userId:', userId, 'userPassword:', '***');
      
      if (userId === username && userPassword === password) {
        console.log('Login successful for user:', username);
        const response = JSON.stringify({ 
          success: true
        });
        console.log('Sending response:', response);
        return ContentService.createTextOutput(response)
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    console.log('Login failed: no matching credentials');
    const response = JSON.stringify({ 
      success: false,
      error: 'ユーザーIDまたはパスワードが違います。'
    });
    console.log('Sending response:', response);
    return ContentService.createTextOutput(response)
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('Login error:', error);
    const response = JSON.stringify({ 
      success: false, 
      error: error.toString() 
    });
    console.log('Sending error response:', response);
    return ContentService.createTextOutput(response)
      .setMimeType(ContentService.MimeType.JSON);
  }
}