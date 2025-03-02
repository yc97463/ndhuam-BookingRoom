// 在 Code.gs 中加入這個函數，然後執行它
function initializeSystem() {
  // 初始化資料表
  initBookingsSheet();
  
  // 測試是否可以讀取
  Logger.log("System initialized");
  return "System initialized";
}

// Code.gs
function doGet(e) {
  const page = e.parameter.page;
  
  if (page === 'verify') {
    const bookingId = e.parameter.bookingId;
    const token = e.parameter.token;
    
    try {
      verifyBooking(bookingId, token);
      return HtmlService.createHtmlOutput(`
        <h1>預約確認成功</h1>
        <p>您的預約已確認成功，確認信已發送至您的信箱。</p>
        <p>請記得在使用前至系辦領取鑰匙。</p>
      `);
    } catch (error) {
      return HtmlService.createHtmlOutput(`
        <h1>預約確認失敗</h1>
        <p>錯誤訊息：${error.message}</p>
        <p>如有任何疑問，請電洽系辦。</p>
      `);
    }
  }

  if (page === 'cancel') {
    const bookingId = e.parameter.bookingId;
    const token = e.parameter.token;
    
    try {
      cancelBooking(bookingId, token);
      return HtmlService.createHtmlOutput(`
        <h1>預約取消成功</h1>
        <p>您的預約已取消成功。</p>
      `);
    } catch (error) {
      return HtmlService.createHtmlOutput(`
        <h1>預約取消失敗</h1>
        <p>錯誤訊息：${error.message}</p>
        <p>如有任何疑問，請電洽系辦。</p>
      `);
    }
  }
  
  // 原有的預約頁面邏輯
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('應數系空間預約系統')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL) // 允許嵌入
    .setFaviconUrl('https://www.google.com/images/icons/product/calendar-32.png');
}

function getBookedAndPendingSlots(roomId) {
  const sheet = initBookingsSheet();
  const data = sheet.getDataRange().getValues();
  const bookedSlots = {};
  const pendingSlots = {};
  
  // 跳過表頭
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[6] === roomId) { // 確認是同一個教室
      const bookingDate = row[4];  // date 欄位
      const bookingTime = row[5];  // timeSlot 欄位
      const status = row[8];       // status 欄位
      
      // 格式化日期
      const formattedDate = Utilities.formatDate(
        new Date(bookingDate), 
        'Asia/Taipei', 
        'yyyy-MM-dd'
      );

      // 格式化時間 (確保格式為 "HH:00")
      const formattedTime = new Date(bookingTime);
      const timeSlot = `${formattedTime.getHours().toString().padStart(2, '0')}:00`;
      
      // 根據狀態分類
      if (status === 'confirmed') {
        if (!bookedSlots[formattedDate]) {
          bookedSlots[formattedDate] = [];
        }
        bookedSlots[formattedDate].push(timeSlot);
      } else if (status.includes('pending')) {
        if (!pendingSlots[formattedDate]) {
          pendingSlots[formattedDate] = [];
        }
        pendingSlots[formattedDate].push(timeSlot);
      }
    }
  }
  
  Logger.log('Booked slots:', bookedSlots);
  Logger.log('Pending slots:', pendingSlots);
  
  return { bookedSlots, pendingSlots };
}

// 取得時段資料
// 取得時段資料
function getTimeSlots(selectedDate, roomId) {
  try {
    if (!selectedDate) {
      selectedDate = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');
    }

    // 確保有 roomId，如果沒有則使用預設值
    if (!roomId) {
      const rooms = getRooms();
      roomId = rooms.length > 0 ? rooms[0].roomId : 'A205';
    }

    Logger.log('Getting time slots for date: ' + selectedDate + ' and roomId: ' + roomId);

    const days = [];
    const date = new Date(selectedDate);
    
    // 產生七天的日期
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(date);
      currentDate.setDate(date.getDate() + i);
      
      const formattedDate = Utilities.formatDate(currentDate, 'Asia/Taipei', 'yyyy-MM-dd');
      const dayOfWeek = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'][currentDate.getDay()];
      
      days.push({
        date: formattedDate,
        dayOfWeek: dayOfWeek
      });
    }
    
    // 產生時段
    const timeSlots = [];
    for (let hour = 6; hour <= 21; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    
    // 獲取預約時段
    const { bookedSlots, pendingSlots } = getBookedAndPendingSlots(roomId);

    // 確保回傳的物件格式正確
    const result = {
      days: days,
      timeSlots: timeSlots,
      bookedSlots: bookedSlots || {},    // 確保永遠有物件
      pendingSlots: pendingSlots || {},   // 確保永遠有物件
      roomId: roomId
    };

    Logger.log('Returning result:', result); // 除錯用

    // 確保回傳 JSON 格式正確
    return JSON.parse(JSON.stringify(result));

  } catch (error) {
    Logger.log('Error in getTimeSlots: ' + error.message);
    Logger.log('Error stack: ' + error.stack);
    throw new Error('Failed to get time slots: ' + error.message);
  }
}

// 檢查時段是否已被預約的輔助函數
function isTimeSlotBooked(date, timeSlot, roomId) {
  const sheet = initBookingsSheet();
  const data = sheet.getDataRange().getValues();
  
  // 跳過表頭
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[4] === date &&         // 日期
        row[5] === timeSlot &&     // 時段
        row[6] === roomId &&       // 教室
        row[8] === 'confirmed') {  // 狀態
      return true;
    }
  }
  
  return false;
}

// 處理預約請求
function processBooking(data) {
  console.log('Processing booking data:', data); // 除錯用
  
  try {
    // 檢查 Email 網域
    const email = data.email.toLowerCase(); // 轉小寫以統一比較
    if (!email.endsWith('ndhu.edu.tw')) {
      throw new Error('請使用東華大學信箱預約 (@gms.ndhu.edu.tw 或 @*.ndhu.edu.tw)');
    }

    // 檢查時段是否已被預約
    if (isTimeSlotBooked(data.date, data.timeSlot, data.roomId)) {
      throw new Error('此時段已被預約');
    }
    
    // 建立預約
    const bookingResult = createBooking(data);
    
    // 確保回傳資料格式正確
    return JSON.parse(JSON.stringify({
      success: true,
      bookingId: bookingResult.bookingId,
      verifyToken: bookingResult.verifyToken,
      data: {      // 加入原始預約資料
        date: data.date,
        timeSlot: data.timeSlot,
        roomId: data.roomId,
        purpose: data.purpose
      }
    }));
    
  } catch (error) {
    console.error('Booking error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 發送預約確認信
// function sendConfirmationEmail(data) {
//   const emailBody = `
//     您好，
    
//     這是您的預約確認信。
//     預約日期：${data.date}
//     預約時段：${data.timeSlot}
//     預約教室：${data.roomName}
//     預約用途：${data.purpose}
    
//     如需更改預約，請聯繫管理員。
    
//     感謝您的使用！
//   `;
  
//   MailApp.sendEmail({
//     to: data.email,
//     subject: '預約確認通知',
//     body: emailBody
//   });
// }