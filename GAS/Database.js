// Database.gs
function getSpreadsheet() {
  // 使用特定的 Spreadsheet ID
  const ss = SpreadsheetApp.openById('16SHDUU-qN7tJzhWFHtZdn5yFHUO-FFtMt4qLugzGA_k');
  if (!ss) {
    throw new Error('Could not open spreadsheet');
  }
  return ss;
}

// 初始化預約資料表
function initBookingsSheet() {
  const ss = getSpreadsheet();  // 使用上面的函數
  let sheet = ss.getSheetByName('Bookings');

  if (!sheet) {
    sheet = ss.insertSheet('Bookings');
    sheet.getRange('A1:J1').setValues([[
      'bookingId',             // 預約編號（主鍵）
      'name',                 // 預約者姓名
      'email',                 // 預約者信箱
      'phone',                // 預約者電話
      'date',                  // 預約日期
      'timeSlot',             // 預約時段
      'roomId',               // 教室 ID
      'purpose',              // 預約用途
      'status',               // 狀態（pending/confirmed/expired）
      'verifyToken',          // 驗證 Token
      'verifyExpiredAt',      // 驗證期限
      'createdAt'             // 建立時間
    ]]);

    sheet.setFrozenRows(1);
    sheet.getRange('A1:M1').createFilter();
  }
  return sheet;
}

// 新增預約
function createBooking(bookingData) {
  const sheet = initBookingsSheet();
  const now = new Date();
  const verifyToken = Utilities.getUuid();

  function getVerifyAvailableHours(appointmentDateTime) {
    const now = new Date();
    const appointmentTime = new Date(appointmentDateTime);

    // 如果距離預約時間少於 24 小時
    if (appointmentTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      // 過期時間設定為預約時間的前一小時
      return new Date(appointmentTime.getTime() - (1 * 60 * 60 * 1000));
    } else {
      // 過期時間為 24 小時後
      return new Date(now.getTime() + (24 * 60 * 60 * 1000));
    }
  }
  const verifyExpiredAt = getVerifyAvailableHours(bookingData.date + ' ' + bookingData.timeSlot);


  const newRow = [
    Utilities.getUuid(),    // bookingId
    bookingData.name,
    bookingData.email,
    bookingData.phone,
    bookingData.date,
    bookingData.timeSlot,
    bookingData.roomId,
    bookingData.purpose,
    'pending_verify',             // 初始狀態為待驗證
    verifyToken,           // 驗證 Token
    verifyExpiredAt,       // 驗證期限
    now,                    // 建立時間
    now                     // 更新時間

  ];

  sheet.appendRow(newRow);


  // verifyExpiredAt: Wed Nov 20 2024 16:02:05 GMT+0800 (Taipei Standard Time) 
  // 將 verifyExpiredAt 與目前時間相減，取得相差的可用小時數
  const verifyAvailableHours = (verifyExpiredAt - now) / (1000 * 60 * 60);

  // 發送驗證信
  sendVerificationEmail(bookingData.email, newRow[0], verifyToken, verifyExpiredAt, verifyAvailableHours, bookingData);

  return {
    bookingId: newRow[0],
    verifyToken: verifyToken
  };
}

function sendVerificationEmail(email, bookingId, verifyToken, verifyExpiredAt, verifyAvailableHours, bookingData) {
  const scriptUrl = ScriptApp.getService().getUrl();
  const verifyUrl = `${scriptUrl}?page=verify&bookingId=${bookingId}&token=${verifyToken}`;
  const cancelUrl = `${scriptUrl}?page=cancel&bookingId=${bookingId}&token=${verifyToken}`;

  // 解析小時部分並加一個小時
  let hour = parseInt(bookingData.timeSlot.split(':')[0], 10); // 取得小時部分，並轉為數字
  hour = (hour + 1) % 24; // 加一個小時，確保小時不超過 24 小時制
  // 格式化為 HH:00
  const time_1hr = `${hour.toString().padStart(2, '0')}:00`; // 確保小時是兩位數

  function verifyExpiredHoursWithText() {
    if (verifyAvailableHours < 1) {
      return '1 小時內';
    } else if (verifyAvailableHours === 1) {
      return '1 小時後';
    } else if (verifyAvailableHours < 24) {
      const parsedHours = Math.floor(verifyAvailableHours);
      return `${parsedHours} 小時後`;
    } else {
      return `24 小時後`;
    }
  }

  const emailBody = `
      ${bookingData.name} 您好，
      
      請開啟以下連結來驗證預約申請：
      ${verifyUrl}

      如果您沒有進行預約，或是要取消預約，請開啟以下連結：
      ${cancelUrl}
      
      預約資訊摘要：
      日期：${bookingData.date}
      時段：${bookingData.timeSlot} - ${time_1hr}
      教室：${bookingData.roomId}
      用途：${bookingData.purpose}
      
      驗證連結將在 ${verifyExpiredHoursWithText()} 失效，請儘速驗證，系辦才會接續辦理。
      
      謝謝！
    `;

  MailApp.sendEmail({
    to: email,
    subject: `【應數系空間借用 驗證信箱】${bookingData.date} ${bookingData.timeSlot} - ${bookingData.roomId}`,
    body: emailBody
  });
}

function verifyBooking(bookingId, token) {
  const sheet = initBookingsSheet();
  const data = sheet.getDataRange().getValues();

  // 找到對應的預約記錄
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] === bookingId && row[9] === token) { // 檢查 bookingId 和 token
      const now = new Date();
      const expiredAt = new Date(row[8]); // 驗證期限
      const status = row[8];

      // 檢查是否過期
      if (now > expiredAt) {
        throw new Error('驗證連結已過期');
      }

      if (status == 'confirmed') {
        throw new Error('您已經驗證過了。')
      }

      if (status == 'cancelled') {
        const updatedAt = new Date(row[12]).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
        throw new Error(`此預約已於 ${updatedAt} 取消，請重新預約。`)
      }

      // 更新狀態為已確認
      sheet.getRange(i + 1, 8 + 1).setValue('confirmed');

      // 格式化日期和時間
      const formattedDate = Utilities.formatDate(new Date(row[4]), 'Asia/Taipei', 'yyyy-MM-dd');
      const timeSlot = row[5]; // 假設已經是 "HH:00" 格式
      // 發送確認成功信
      sendConfirmationEmail(row[2], { // email 在第二欄
        date: formattedDate,
        timeSlot: timeSlot,
        roomId: row[6],
        purpose: row[7]
      });

      return true;
    }
  }

  throw new Error('無效的驗證資訊');
}

function cancelBooking(bookingId, token) {
  const sheet = initBookingsSheet();
  const data = sheet.getDataRange().getValues();

  // 找到對應的預約記錄
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] === bookingId && row[9] === token) { // 檢查 bookingId 和 token
      
      // 檢查是否已經取消
      const status = row[8];
      if (status == 'cancelled') {
        const updatedAt = new Date(row[12]).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
        throw new Error(`此預約已於 ${updatedAt} 取消，毋需再次取消。`)
      }

      // 更新狀態為已取消
      sheet.getRange(i + 1, 8 + 1).setValue('cancelled');
      // 更新 updatedAt time
      sheet.getRange(i + 1, 12 + 1).setValue(new Date());

      const formattedDate = Utilities.formatDate(new Date(row[4]), 'Asia/Taipei', 'yyyy-MM-dd');
      // 發送取消成功信
      sendCancellationEmail(row[2], { // email 在第二欄
        date: formattedDate,
        timeSlot: row[5],
        roomId: row[6],
        purpose: row[7]
      });

      return true;
    }
  }

  throw new Error('無效的驗證資訊');
}

function sendCancellationEmail(email, bookingData) {
  let displayTimeSlot = bookingData.timeSlot;
  if (bookingData.timeSlot instanceof Date || bookingData.timeSlot.includes('GMT')) {
    const timeDate = new Date(bookingData.timeSlot);
    displayTimeSlot = `${String(timeDate.getHours()).padStart(2, '0')}:00`;
  }

  // 解析小時部分並加一個小時
  let hour = parseInt(displayTimeSlot.split(':')[0], 10); // 取得小時部分，並轉為數字
  hour = (hour + 1) % 24; // 加一個小時，確保小時不超過 24 小時制
  // 格式化為 HH:00
  const time_1hr = `${hour.toString().padStart(2, '0')}:00`; // 確保小時是兩位數

  const emailBody = `
      您好，
      
      您的預約已取消成功！
      
      預約資訊摘要：
      日期：${bookingData.date}
      時段：${displayTimeSlot} - ${time_1hr}
      教室：${bookingData.roomId}
      用途：${bookingData.purpose}
      
      如果有任何問題，請向系辦聯絡。
      
      謝謝！
    `;

  MailApp.sendEmail({
    to: email,
    subject: `【應數系空間借用 取消預約】${bookingData.date} ${displayTimeSlot} - ${bookingData.roomId}`,
    body: emailBody
  });
}

  

function sendConfirmationEmail(email, bookingData) {
  // const displayDate = new Date(bookingData.date).toLocaleDateString('zh-TW', {
  //   year: 'numeric',
  //   month: 'long',
  //   day: 'numeric',
  //   weekday: 'long'
  // });

  // timeSlot 應該已經是 "HH:00" 格式，如果不是，需要轉換
  let displayTimeSlot = bookingData.timeSlot;
  if (bookingData.timeSlot instanceof Date || bookingData.timeSlot.includes('GMT')) {
    const timeDate = new Date(bookingData.timeSlot);
    displayTimeSlot = `${String(timeDate.getHours()).padStart(2, '0')}:00`;
  }

  // 解析小時部分並加一個小時
  let hour = parseInt(displayTimeSlot.split(':')[0], 10); // 取得小時部分，並轉為數字
  hour = (hour + 1) % 24; // 加一個小時，確保小時不超過 24 小時制
  // 格式化為 HH:00
  const time_1hr = `${hour.toString().padStart(2, '0')}:00`; // 確保小時是兩位數

  const formattedDate = Utilities.formatDate(new Date(bookingData.date), 'Asia/Taipei', 'yyyy-MM-dd');
  const emailBody = `
      您好，
      
      您的預約已確認成功！
      
      預約資訊摘要：
      日期：${formattedDate}
      時段：${displayTimeSlot} - ${time_1hr}
      教室：${bookingData.roomId}
      用途：${bookingData.purpose}
      
      請記得在使用前至系辦領取鑰匙。
      
      謝謝！
    `;

  MailApp.sendEmail({
    to: email,
    subject: `【應數系空間借用 等待系辦審核】${formattedDate} ${displayTimeSlot} - ${bookingData.roomId}`,
    body: emailBody
  });
}

// 查詢預約
function getBookings(filters = {}) {
  const sheet = initBookingsSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  return data.slice(1)
    .map(row => {
      const booking = {};
      headers.forEach((header, index) => {
        booking[header] = row[index];
      });
      return booking;
    })
    .filter(booking => {
      for (let key in filters) {
        if (booking[key] !== filters[key]) return false;
      }
      return true;
    });
}

// 在 Database.gs 中新增
function initRoomsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Rooms');

  if (!sheet) {
    sheet = ss.insertSheet('Rooms');
    sheet.getRange('A1:B1').setValues([['roomId', 'roomName']]);

    // 設定表頭樣式
    sheet.getRange('1:1').setBackground('#f3f3f3')
      .setFontWeight('bold');
  }
  return sheet;
}

// 查詢教室列表
function getRooms() {
  try {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName('Rooms');

    // 如果表不存在，創建並添加預設資料
    if (!sheet) {
      sheet = ss.insertSheet('Rooms');
      sheet.getRange('A1:B1').setValues([['roomId', 'roomName']]);
      // 添加預設資料
      sheet.getRange('A2:B3').setValues([
        ['A205', '電腦教室'],
        ['A302', '大講堂教室']
      ]);
    }

    const data = sheet.getDataRange().getValues();

    // 跳過表頭，轉換成物件陣列
    return data.slice(1).map(row => ({
      roomId: row[0],
      roomName: `${row[0]} ${row[1]}`
    }));
  } catch (error) {
    Logger.log('Error in getRooms: ' + error.message);
    return []; // 返回空陣列作為預設值
  }
}

// 檢查時段是否已被預約
function isTimeSlotBooked(date, timeSlot) {
  const bookings = getBookings({
    date: date,
    timeSlot: timeSlot,
    status: 'confirmed'
  });
  return bookings.length > 0;
}

/* disabled
// 取得所有已預約的時段
function getBookedTimeSlots() {
  const sheet = initBookingsSheet();
  const data = sheet.getDataRange().getValues();
  const bookedSlots = {};

  // 跳過表頭
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[7] === 'confirmed') { // status 欄位
      const date = row[3];        // date 欄位
      const timeSlot = row[4];    // timeSlot 欄位

      // 格式化日期
      const formattedDate = Utilities.formatDate(new Date(date), 'Asia/Taipei', 'yyyy-MM-dd');

      // 初始化陣列（如果不存在）
      if (!bookedSlots[formattedDate]) {
        bookedSlots[formattedDate] = [];
      }

      // 直接使用時段字串（例如："12:00"）
      bookedSlots[formattedDate].push(timeSlot);
    }
  }

  // 記錄處理後的資料
  Logger.log('Processed booked slots:');
  Logger.log(JSON.stringify(bookedSlots, null, 2));

  return bookedSlots;
}
*/