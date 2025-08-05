/**
 * スプレッドシート開時にカスタムメニューを追加
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('シート管理ツール')
    .addItem('PDF生成（一括）', 'generateAllUsersPDF')
    .addItem('CSV生成（一括）', 'generateAllUsersCSV')
    .addSeparator()
    //.addItem('全ドキュメント生成', 'generateAllUsersDocuments')
    .addToUi();
}

/**
 * シート設定の定義
 */
const SHEET_CONFIGS_MANAGER = {
  '居宅介護': {
    userCell: 'Z2',  // 利用者名を入力するセル
    userNumberCell: 'H2:Q2',  // 受給者証番号を入力するセル範囲
    prefix: '居宅介護',
    emptyCheckStartRow: 10,
    emptyCheckEndRow: 50,
    csvRange: 'A:Z',
    pdfOrientation: 'portrait',  // 縦向き
    pdfScale: 1  // スケールを最小にして全体を縮小
  },
  '行動援護': {
    userCell: 'V2',  // 利用者名を入力するセル
    userNumberCell: 'F2:O2',  // 受給者証番号を入力するセル範囲
    prefix: '行動援護',
    emptyCheckStartRow: 10,
    emptyCheckEndRow: 50,
    csvRange: 'A:V',
    pdfOrientation: 'portrait',  // 縦向き
    pdfScale: 1  // スケールを最小にして全体を縮小
  },
  '[京都市]移動支援': {
    userCell: 'X2',  // 利用者名を入力するセル
    userNumberCell: 'F2:O2',  // 受給者証番号を入力するセル範囲
    prefix: '京都市移動',
    emptyCheckStartRow: 9,
    emptyCheckEndRow: 49,
    csvRange: 'A:X',
    pdfOrientation: 'portrait',  // 縦向き
    pdfScale: 1  // スケールを最小にして全体を縮小
  },
  '[安雲野市]移動支援': {
    userCell: 'F7',  // 利用者氏名を入力するセル
    prefix: '安雲野市移動',
    emptyCheckStartRow: 12,
    emptyCheckEndRow: 42,
    csvRange: 'A:J',
    pdfOrientation: 'portrait',  // 縦向き
    pdfScale: 1  // スケール調整
  },
  '出勤簿': {
    userCell: 'B3',  // 支援員名を入力するセル
    prefix: '出勤簿',
    emptyCheckStartRow: 7,
    emptyCheckEndRow: 87,
    csvRange: 'A:L',
    pdfOrientation: 'portrait',  // 縦向き
    pdfScale: 1  // スケール調整（多いデータなので小さめ）
  }
};


/**
 * フォルダを作成または取得する関数
 */
function createOrGetFolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return parentFolder.createFolder(folderName);
  }
}

/**
 * 利用者/支援員リストを取得する関数
 */
function getUserList(sheetName, config) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dataSheet = ss.getSheetByName('データ用');
  if (!dataSheet) throw new Error('データ用シートが見つかりません');
  
  if (sheetName === '[安雲野市]移動支援') {
    // 安雲野市移動支援は特定利用者のみ（実際のデータはスプレッドシートから取得）
    return ['安雲野市利用者'];
  } else if (sheetName === '出勤簿') {
    // 出勤簿は支援員データ（C19から右方向）を取得
    const supportersRow = dataSheet.getRange('C19:Z19').getValues()[0];
    return supportersRow.filter(cell => cell && cell.toString().trim() !== '' && cell.toString().trim() !== '-');
  } else if (sheetName === '[京都市]移動支援') {
    // 京都市移動支援は特定利用者を除外
    const usersRow = dataSheet.getRange('C7:Z7').getValues()[0];
    return usersRow.filter(cell => 
      cell && 
      cell.toString().trim() !== '' && 
      cell.toString().trim() !== '-' &&
      cell.toString().trim() !== '安雲野市利用者' &&
      cell.toString().trim() !== '※'
    );
  } else {
    // その他のシート（居宅介護、行動援護）は通常の利用者リスト
    const usersRow = dataSheet.getRange('C7:Z7').getValues()[0];
    return usersRow.filter(cell => 
      cell && 
      cell.toString().trim() !== '' && 
      cell.toString().trim() !== '-' &&
      cell.toString().trim() !== '※'
    );
  }
}

/**
 * PDF一括生成（高速版）
 */
function generateAllUsersPDF() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const yearStr = ss.getRange('集計表!B2').getValue().toString();
    const monthStr = ss.getRange('集計表!E2').getValue().toString().padStart(2, '0');
    
    // PDFフォルダを作成
    const pdfFolderName = `${yearStr}年${monthStr}月_PDF`;
    const pdfFolder = createOrGetFolder(DriveApp.getRootFolder(), pdfFolderName);
    
    let successCount = 0;
    let errorCount = 0;
    const totalSheets = Object.keys(SHEET_CONFIGS_MANAGER).length;
    let processedSheets = 0;
    
    // 進捗表示
    const ui = SpreadsheetApp.getUi();
    ui.alert('PDF生成開始', `全利用者及び支援員のPDFを生成します。`, ui.ButtonSet.OK);
    
    // 各シートを処理
    for (const [sheetName, config] of Object.entries(SHEET_CONFIGS_MANAGER)) {
      try {
        const sheet = ss.getSheetByName(sheetName);
        if (!sheet) continue;
        
        // シート名のサブフォルダを作成
        const sheetFolder = createOrGetFolder(pdfFolder, sheetName);
        
        // シートに応じた利用者/支援員リストを取得
        const users = getUserList(sheetName, config);
        
        // バッチ処理のための配列
        const pdfPromises = [];
        
        // 各利用者/支援員に対して処理
        for (const user of users) {
          try {
            // ユーザーセルに名前を設定
            sheet.getRange(config.userCell).setValue(user);
            
            // 受給者証番号を設定（該当するシートのみ）
            if (config.userNumberCell && sheetName !== '[安雲野市]移動支援' && sheetName !== '出勤簿') {
              try {
                // データ用シートから該当ユーザーの受給者証番号を取得
                const dataSheet = ss.getSheetByName('データ用');
                const usersRow = dataSheet.getRange('C7:Z7').getValues()[0];
                const numbersRow = dataSheet.getRange('C4:Z4').getValues()[0]; // 受給者番号の行
                
                // ユーザーの位置を検索
                const userIndex = usersRow.findIndex(cell => cell && cell.toString().trim() === user);
                if (userIndex >= 0 && numbersRow[userIndex]) {
                  const userNumber = numbersRow[userIndex].toString().replace(/\D/g, ''); // 数字以外を除去
                  
                  // 受給者証番号を各セルに分割して入力
                  const range = sheet.getRange(config.userNumberCell);
                  const rangeValues = range.getValues();
                  const cells = rangeValues[0];
                  
                  // セルをクリア
                  for (let i = 0; i < cells.length; i++) {
                    cells[i] = '';
                  }
                  
                  // 番号を1文字ずつ分割して入力
                  for (let i = 0; i < cells.length && i < userNumber.length; i++) {
                    cells[i] = userNumber.charAt(i);
                  }
                  range.setValues([cells]);
                }
              } catch (error) {
                console.error(`受給者証番号の設定でエラー: ${error.message}`);
              }
            }
            
            // SpreadsheetApp.flush()を削除してパフォーマンス向上
            
            // PDF生成
            const pdfFileName = `${config.prefix}_${user}_${yearStr}${monthStr}.pdf`;
            
            // 既存ファイルチェック
            const existingFiles = sheetFolder.getFilesByName(pdfFileName);
            if (existingFiles.hasNext()) {
              // 既存ファイルを削除
              existingFiles.next().setTrashed(true);
            }
            
            // PDF出力範囲を設定（各シートのデータ範囲に基づく）
            const lastColumn = sheet.getLastColumn();
            const r1 = 1; // 1行目から全て含める
            const r2 = config.emptyCheckEndRow + 5; // 少し余裕を持たせる
            const c1 = 1; // A列から
            const c2 = lastColumn; // 最終列まで
            
            // 向きとスケールを設定から取得
            const orientation = config.pdfOrientation || 'portrait';
            const isPortrait = orientation === 'portrait';
            const scale = config.pdfScale || 4;
            
            const url = `https://docs.google.com/spreadsheets/d/${ss.getId()}/export?` +
                       `format=pdf&gid=${sheet.getSheetId()}&` +
                       `size=A4&portrait=${isPortrait}&fit=true&` + // ページに合わせる設定
                       `sheetnames=false&printtitle=false&` +
                       `pagenumbers=false&gridlines=false&fzr=false&` +
                       `top_margin=0.5&bottom_margin=0.5&left_margin=1.0&right_margin=1.0&` + // 左右のマージンを1.0に設定
                       ``; // 範囲指定を削除してシート全体を自動判定
            
            const response = UrlFetchApp.fetch(url, {
              headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() },
              muteHttpExceptions: true
            });
            
            if (response.getResponseCode() === 200) {
              sheetFolder.createFile(response.getBlob().setName(pdfFileName));
              successCount++;
            } else {
              console.error(`${user}のPDF生成でエラー: ${response.getContentText()}`);
              errorCount++;
            }
            
          } catch (userError) {
            console.error(`${user}のPDF生成でエラー:`, userError);
            errorCount++;
          }
        }
        
        // 進捗更新
        processedSheets++;
        console.log(`進捗: ${processedSheets}/${totalSheets} シート完了`);
        
      } catch (error) {
        console.error(`シート「${sheetName}」のPDF生成でエラー:`, error);
        errorCount++;
      }
    }
    
    // 完了通知
    const message = `PDF生成完了\n成功: ${successCount}件\nエラー: ${errorCount}件`;
    ui.alert('処理完了', message, ui.ButtonSet.OK);
    
    return message;
    
  } catch (error) {
    throw new Error(`PDF生成エラー: ${error.message}`);
  }
}

/**
 * CSV一括生成（シンプル版）
 */
function generateAllUsersCSV() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const yearStr = ss.getRange('集計表!B2').getValue().toString();
    const monthStr = ss.getRange('集計表!E2').getValue().toString().padStart(2, '0');
    
    // CSVフォルダを作成
    const csvFolderName = `${yearStr}年${monthStr}月_CSV`;
    const csvFolder = createOrGetFolder(DriveApp.getRootFolder(), csvFolderName);
    
    let successCount = 0;
    let errorCount = 0;
    
    // 各シートを処理
    for (const [sheetName, config] of Object.entries(SHEET_CONFIGS_MANAGER)) {
      try {
        const sheet = ss.getSheetByName(sheetName);
        if (!sheet) continue;
        
        // シート名のサブフォルダを作成
        const sheetFolder = createOrGetFolder(csvFolder, sheetName);
        
        // シートに応じた利用者/支援員リストを取得
        const users = getUserList(sheetName, config);
        
        // 各利用者/支援員に対して処理
        for (const user of users) {
          try {
            // ユーザーセルに名前を設定
            sheet.getRange(config.userCell).setValue(user);
            
            // 受給者証番号を設定（該当するシートのみ）
            if (config.userNumberCell && sheetName !== '[安雲野市]移動支援' && sheetName !== '出勤簿') {
              try {
                // データ用シートから該当ユーザーの受給者証番号を取得
                const dataSheet = ss.getSheetByName('データ用');
                const usersRow = dataSheet.getRange('C7:Z7').getValues()[0];
                const numbersRow = dataSheet.getRange('C4:Z4').getValues()[0]; // 受給者番号の行
                
                // ユーザーの位置を検索
                const userIndex = usersRow.findIndex(cell => cell && cell.toString().trim() === user);
                if (userIndex >= 0 && numbersRow[userIndex]) {
                  const userNumber = numbersRow[userIndex].toString().replace(/\D/g, ''); // 数字以外を除去
                  
                  // 受給者証番号を各セルに分割して入力
                  const range = sheet.getRange(config.userNumberCell);
                  const rangeValues = range.getValues();
                  const cells = rangeValues[0];
                  
                  // セルをクリア
                  for (let i = 0; i < cells.length; i++) {
                    cells[i] = '';
                  }
                  
                  // 番号を1文字ずつ分割して入力
                  for (let i = 0; i < cells.length && i < userNumber.length; i++) {
                    cells[i] = userNumber.charAt(i);
                  }
                  range.setValues([cells]);
                }
              } catch (error) {
                console.error(`受給者証番号の設定でエラー: ${error.message}`);
              }
            }
            
            SpreadsheetApp.flush();
          
          // データ取得
          const range = sheet.getRange(config.csvRange + config.emptyCheckStartRow + ":" + 
                                     config.csvRange.split(':')[1] + config.emptyCheckEndRow);
          const values = range.getDisplayValues();
          
          // 空でない行のみ抽出
          const dataRows = values.filter(row => row.some(cell => cell !== ''));
          
          if (dataRows.length > 0) {
            // CSVデータ作成
            const csvData = dataRows.map(row => 
              row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`)
                 .join(',')
            ).join('\n');
            
            // CSVファイル作成
            const csvFileName = `${config.prefix}_${user}_${yearStr}${monthStr}.csv`;
            sheetFolder.createFile(
              Utilities.newBlob(csvData, 'text/csv', csvFileName)
            );
            successCount++;
          }
          } catch (userError) {
            console.error(`${user}のCSV生成でエラー:`, userError);
            errorCount++;
          }
        }
        
      } catch (error) {
        console.error(`シート「${sheetName}」のCSV生成でエラー:`, error);
        errorCount++;
      }
    }
    
    return `CSV生成完了\n成功: ${successCount}件\nエラー: ${errorCount}件`;
    
  } catch (error) {
    throw new Error(`CSV生成エラー: ${error.message}`);
  }
}