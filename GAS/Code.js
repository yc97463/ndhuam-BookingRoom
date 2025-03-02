// ✅ 設定 CORS，確保 Next.js 可存取 API
function createResponse(data) {
  const jsonOutput = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);

  const response = jsonOutput;
  response.getHeaders = function () {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST",
      "Access-Control-Allow-Headers": "Content-Type"
    };
  };

  return response;
}


function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === "getRooms") {
      return createResponse(getRooms());
    } else if (action === "getTimeSlots") {
      const selectedDate = e.parameter.date;
      const selectedRoom = e.parameter.room;
      const firstDay = e.parameter.firstDay || "Monday";
      return createResponse(getTimeSlots(selectedDate, selectedRoom, firstDay));
    } else if (action === "verifyGroup") {
      const token = e.parameter.token;
      return processGroupVerification(token);
    }

    return createResponse({ error: "Invalid action" });
  } catch (error) {
    Logger.log("Error in doGet: " + error.message);
    return createResponse({ error: error.message });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // 記錄收到的數據，便於調試
    Logger.log("Received POST data: " + JSON.stringify(data));

    if (data.action === "submitBooking") {
      // 確保多時段預約資訊正確，即使前端沒有設置完整
      if (data.multipleSlots && data.multipleSlots.length > 0) {
        data.isMultipleBooking = true;
      }

      Logger.log("Processing booking with isMultipleBooking: " + data.isMultipleBooking);
      if (data.isMultipleBooking) {
        Logger.log("Multiple slots count: " + (data.multipleSlots ? data.multipleSlots.length : 0));
      }

      return createResponse(processBooking(data));
    }

    return createResponse({ error: "Invalid action" });
  } catch (error) {
    Logger.log("Error in doPost: " + error.message);
    return createResponse({ error: error.message });
  }
}


// ✅ 取得教室清單
function getRooms() {
  try {
    const sheet = getSpreadsheet().getSheetByName("Rooms");
    if (!sheet) throw new Error("Rooms sheet not found");

    const data = sheet.getDataRange().getValues();
    return data.slice(1).map(row => ({
      roomId: row[0],
      roomName: row[1]
    }));
  } catch (error) {
    Logger.log("Error in getRooms: " + error.message);
    return { error: error.message };
  }
}

// ✅ 取得時段清單
function getTimeSlots(selectedDate, roomId, firstDay) {
  try {
    if (!selectedDate) {
      selectedDate = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd");
    }

    Logger.log("🚀 Received selectedDate: " + selectedDate);

    // ✅ 解析 selectedDate，確保是台北時間
    const parts = selectedDate.split("-");
    let startDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

    Logger.log("✅ Parsed startDate (before adjustment): " + startDate);

    if (firstDay === "Monday") {
      // 📌 調整 `startDate` 為當週的「週一」
      const dayOfWeek = startDate.getDay(); // 0=週日, 1=週一, ..., 6=週六
      const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 週日回推 6 天，其他回推到週一
      startDate.setDate(startDate.getDate() + offsetToMonday);
      Logger.log("🗓️ Adjusted to Monday: " + startDate);
    }

    // 產生 7 天的日期
    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const formattedDate = Utilities.formatDate(currentDate, "Asia/Taipei", "yyyy-MM-dd");
      const dayOfWeekName = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"][currentDate.getDay()];
      days.push({ date: formattedDate, dayOfWeek: dayOfWeekName });
    }

    Logger.log("📆 Final generated days: " + JSON.stringify(days));

    const timeSlots = [];
    for (let hour = 6; hour <= 21; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, "0")}:00`);
    }

    const { bookedSlots, pendingSlots } = getBookedAndPendingSlots(roomId);

    return {
      days,
      timeSlots,
      bookedSlots: bookedSlots || {},
      pendingSlots: pendingSlots || {},
      roomId
    };
  } catch (error) {
    Logger.log("❌ Error in getTimeSlots: " + error.message);
    return { error: error.message };
  }
}




// ✅ 處理預約
function processBooking(bookingData) {
  try {
    Logger.log("開始處理預約數據: " + JSON.stringify(bookingData));

    // 檢查是否為多時段預約
    if (bookingData.isMultipleBooking && bookingData.multipleSlots && bookingData.multipleSlots.length > 0) {
      Logger.log("檢測到多時段預約, 時段數量: " + bookingData.multipleSlots.length);

      // 創建預約群組
      const groupId = Utilities.getUuid();
      const verifyToken = Utilities.getUuid();
      const now = new Date();
      const email = bookingData.email.toLowerCase();

      // 驗證郵箱
      if (!email.endsWith("ndhu.edu.tw")) {
        throw new Error("請使用東華大學信箱預約 (@gms.ndhu.edu.tw 或 @*.ndhu.edu.tw)");
      }

      // 處理多時段預約
      const bookingIds = [];
      const failedSlots = [];

      for (let i = 0; i < bookingData.multipleSlots.length; i++) {
        const slot = bookingData.multipleSlots[i];
        Logger.log("處理時段 #" + (i + 1) + ": " + JSON.stringify(slot));

        // 檢查時段是否已被預約
        if (isTimeSlotBooked(slot.date, slot.time, slot.roomId)) {
          failedSlots.push(`${slot.date} ${slot.time}`);
          continue;
        }

        // 創建預約記錄，但標記為群組預約
        const bookingId = createGroupBooking(slot, groupId);
        bookingIds.push(bookingId);
      }

      // 如果有任何時段無法預約
      if (failedSlots.length > 0) {
        return {
          success: false,
          error: `以下時段已被預約，請選擇其他時段: ${failedSlots.join(", ")}`
        };
      }

      // 創建預約群組記錄
      createBookingGroup(groupId, bookingData, verifyToken, bookingIds);

      // 發送單一驗證郵件
      sendGroupVerificationEmail(bookingData, verifyToken, bookingIds.length);

      return {
        success: true,
        message: `已預約 ${bookingIds.length} 個時段，請查收驗證郵件`
      };
    } else {
      // 處理單一時段預約
      Logger.log("處理單一時段預約");
      return processSingleBooking(bookingData);
    }
  } catch (error) {
    Logger.log("處理預約時發生錯誤: " + error.message + "\n" + error.stack);
    return { success: false, error: error.message };
  }
}

// 創建群組預約記錄
function createGroupBooking(data, groupId) {
  const sheet = getSpreadsheet().getSheetByName("Bookings");
  const bookingId = Utilities.getUuid();
  const now = new Date();

  const newRow = [
    bookingId,            // 預約ID
    data.name,            // 姓名
    data.email,           // 郵箱
    data.phone,           // 電話
    data.date,            // 日期
    data.time,        // 時段
    data.roomId,          // 教室
    data.purpose,         // 用途
    "pending_group_verify", // 狀態標記為群組驗證中
    groupId,              // 使用群組ID作為驗證令牌
    now                   // 創建時間
  ];

  sheet.appendRow(newRow);
  return bookingId;
}

// 創建預約群組
function createBookingGroup(groupId, data, verifyToken, bookingIds) {
  const sheet = getSpreadsheet().getSheetByName("BookingGroups");
  // 如果資料表不存在，則創建它
  if (!sheet) {
    createBookingGroupsSheet();
    sheet = getSpreadsheet().getSheetByName("BookingGroups");
  }

  const now = new Date();
  const newRow = [
    groupId,                     // 群組ID
    data.email,                  // 郵箱
    data.name,                   // 姓名
    data.phone,                  // 電話
    data.purpose,                // 用途
    now,                         // 創建時間
    verifyToken,                 // 驗證令牌
    "pending_verify",            // 狀態
    bookingIds.join(",")         // 關聯的預約ID，以逗號分隔
  ];

  sheet.appendRow(newRow);
  return groupId;
}

// 創建 BookingGroups 資料表（如果不存在）
function createBookingGroupsSheet() {
  const ss = getSpreadsheet();
  const sheet = ss.insertSheet("BookingGroups");
  sheet.appendRow([
    "GroupID",
    "Email",
    "Name",
    "Phone",
    "Purpose",
    "CreatedAt",
    "VerifyToken",
    "Status",
    "BookingIDs"
  ]);
  return sheet;
}

// 發送群組驗證郵件
function sendGroupVerificationEmail(data, verifyToken, slotCount) {
  // 使用 Gmail 服務發送郵件
  const subject = "應數系空間預約 - 請驗證您的預約";


  // 生成驗證連結
  const scriptUrl = ScriptApp.getService().getUrl();
  const verifyUrl = `${scriptUrl}?action=verifyGroup&token=${verifyToken}`;

  // 郵件內容
  const body = `${data.name} 您好，

您已成功預約了 ${slotCount} 個時段的應數系空間。請點擊以下連結來驗證您的預約：

${verifyUrl}

預約資訊：
- 姓名：${data.name}
- 聯絡信箱：${data.email}
- 聯絡電話：${data.phone}
- 預約用途：${data.purpose}
- 預約時段數量：${slotCount}

此驗證連結將在48小時後失效。如有任何問題，請聯絡應數系辦。

謝謝！
應用數學系`;

  // 發送郵件
  MailApp.sendEmail(data.email, subject, body);
}

// 處理群組驗證
function processGroupVerification(token) {
  try {
    if (!token) {
      return createHtmlResponse("驗證失敗", "缺少驗證令牌，請檢查您的驗證連結。");
    }

    // 查找群組
    const groupsSheet = getSpreadsheet().getSheetByName("BookingGroups");
    if (!groupsSheet) {
      return createHtmlResponse("驗證失敗", "找不到預約群組資料。");
    }

    const groupsData = groupsSheet.getDataRange().getValues();
    let groupRow = -1;
    let groupData = null;

    // 查找匹配的群組
    for (let i = 1; i < groupsData.length; i++) {
      if (groupsData[i][6] === token) {  // VerifyToken 在第7列
        groupRow = i + 1;  // +1 因為索引從0開始，但行號從1開始
        groupData = groupsData[i];
        break;
      }
    }

    if (!groupData) {
      return createHtmlResponse("驗證失敗", "找不到與此令牌相關聯的預約群組。");
    }

    // 檢查狀態
    if (groupData[7] !== "pending_verify") {  // Status 在第8列
      if (groupData[7] === "verified") {
        return createHtmlResponse("已驗證", "此預約群組已經驗證過了。");
      } else {
        return createHtmlResponse("驗證失敗", "此預約群組的狀態不允許驗證。");
      }
    }

    // 更新群組狀態
    groupsSheet.getRange(groupRow, 8).setValue("verified");  // 更新狀態欄位

    // 更新所有關聯的預約
    const bookingIds = groupData[8].split(",");  // BookingIDs 在第9列
    const bookingsSheet = getSpreadsheet().getSheetByName("Bookings");
    const bookingsData = bookingsSheet.getDataRange().getValues();

    for (let i = 1; i < bookingsData.length; i++) {
      if (bookingIds.includes(bookingsData[i][0])) {  // 檢查 BookingID
        bookingsSheet.getRange(i + 1, 9).setValue("confirmed");  // 更新狀態欄位
      }
    }

    // 發送確認郵件
    sendGroupConfirmationEmail(
      groupData[2],  // Name
      groupData[1],  // Email
      bookingIds.length,
      groupData[4]   // Purpose
    );

    return createHtmlResponse(
      "驗證成功",
      `您的 ${bookingIds.length} 個預約時段已成功驗證。確認郵件已發送至您的信箱 ${groupData[1]}。`
    );
  } catch (error) {
    Logger.log("處理群組驗證時發生錯誤: " + error.message);
    return createHtmlResponse("驗證錯誤", "處理您的驗證請求時發生錯誤: " + error.message);
  }
}

// 創建HTML回應頁面
function createHtmlResponse(title, message) {
  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - 應數系空間預約系統</title>
      <style>
        body {
          font-family: "Noto Sans TC", sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f9f9f9;
          color: #333;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .container {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          padding: 30px;
          max-width: 500px;
          width: 100%;
          text-align: center;
        }
        h1 {
          color: #4a6fa5;
          margin-bottom: 20px;
        }
        p {
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          background-color: #4a6fa5;
          color: white;
          padding: 10px 20px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${title}</h1>
        <p>${message}</p>
        <a href="#" class="button" onclick="window.close()">關閉</a>
      </div>
    </body>
  </html>`;

  return HtmlService.createHtmlOutput(html);
}

// 發送群組確認郵件
function sendGroupConfirmationEmail(name, email, slotCount, purpose) {
  const subject = "應數系空間預約 - 預約確認通知";

  const body = `${name} 您好，

您的 ${slotCount} 個時段預約已成功確認。

預約資訊：
- 姓名：${name}
- 聯絡信箱：${email}
- 預約用途：${purpose}
- 預約時段數量：${slotCount}

請於使用時間前往系辦領取鑰匙。如需取消預約，請至少提前24小時通知系辦。

謝謝！
應用數學系`;

  // 發送郵件
  MailApp.sendEmail(email, subject, body);
}




function processSingleBooking(data) {
  try {
    Logger.log("Processing single booking: " + JSON.stringify(data));

    const email = data.email.toLowerCase();
    if (!email.endsWith("ndhu.edu.tw")) {
      throw new Error("請使用東華大學信箱預約 (@gms.ndhu.edu.tw 或 @*.ndhu.edu.tw)");
    }

    if (isTimeSlotBooked(data.date, data.timeSlot, data.roomId)) {
      throw new Error("此時段已被預約");
    }

    // 確保日期和時間格式正確
    if (typeof data.date === 'string' && typeof data.timeSlot === 'string') {
      const bookingResult = createBooking(data);
      return {
        success: true,
        bookingId: bookingResult.bookingId,
        verifyToken: bookingResult.verifyToken
      };
    } else {
      throw new Error("日期或時間格式錯誤");
    }
  } catch (error) {
    Logger.log("Error in processSingleBooking: " + error.message);
    return { success: false, error: error.message };
  }
}

// ✅ 獲取預約狀態
function getBookedAndPendingSlots(roomId) {
  const sheet = getSpreadsheet().getSheetByName("Bookings");
  if (!sheet) return { bookedSlots: {}, pendingSlots: {} };

  const data = sheet.getDataRange().getValues();
  const bookedSlots = {};
  const pendingSlots = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[6] === roomId) {
      const formattedDate = Utilities.formatDate(new Date(row[4]), "Asia/Taipei", "yyyy-MM-dd");
      const timeSlot = `${new Date(row[5]).getHours().toString().padStart(2, "0")}:00`;
      const status = row[8];

      if (status === "confirmed") {
        if (!bookedSlots[formattedDate]) bookedSlots[formattedDate] = [];
        bookedSlots[formattedDate].push(timeSlot);
      } else if (status.includes("pending")) {
        if (!pendingSlots[formattedDate]) pendingSlots[formattedDate] = [];
        pendingSlots[formattedDate].push(timeSlot);
      }
    }
  }

  return { bookedSlots, pendingSlots };
}

// ✅ 檢查時段是否已被預約
function isTimeSlotBooked(date, timeSlot, roomId) {
  const sheet = getSpreadsheet().getSheetByName("Bookings");
  if (!sheet) return false;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][4] === date && data[i][5] === timeSlot && data[i][6] === roomId && data[i][8] === "confirmed") {
      return true;
    }
  }
  return false;
}

// ✅ 取得 Google 試算表
function getSpreadsheet() {
  return SpreadsheetApp.openById("16SHDUU-qN7tJzhWFHtZdn5yFHUO-FFtMt4qLugzGA_k");
}

// ✅ 建立預約
function createBooking(data) {
  const sheet = getSpreadsheet().getSheetByName("Bookings");
  const verifyToken = Utilities.getUuid();
  const now = new Date();

  const newRow = [
    Utilities.getUuid(),
    data.name,
    data.email,
    data.phone,
    data.date,
    data.timeSlot,
    data.roomId,
    data.purpose,
    "pending_verify",
    verifyToken,
    now
  ];

  sheet.appendRow(newRow);

  return { bookingId: newRow[0], verifyToken };
}
