// This is an Google Apps Script for sending emails to applicants and admins.

// Email templates
const EMAIL_TEMPLATES = {
  // 申請者相關信件
  APPLICANT_SUBMISSION: {
    subject: `【東華應數系空間借用系統】 #{applicationId} 「{applicationSpace}」申請審核中（申請編號：{applicationId}，空間：{applicationSpace}）`,
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .content {
      background-color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      color: #495057;
      font-size: 1.1em;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .application-details {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
      white-space: pre-line;
    }
    .status {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 0.9em;
      font-weight: 500;
      background-color: #e9ecef;
      color: #495057;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
      font-size: 0.9em;
      color: #6c757d;
    }
    a {
      color: #007bff;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>東華應數系空間借用 / 申請審核中（申請編號：{applicationId}，空間：{applicationSpace}）</h2>
  </div>

  <div class="content">
    <p>{organization} {applicantName} 您好：</p>
    
    <p>您申請借用東華應數系管理的空間，系辦將收到通知，請稍等系辦審核。</p>
    
    <div class="section">
      <div class="section-title">申請資訊</div>
      <p>申請編號：<span class="status">{applicationId}</span></p>
      <p>申請空間：<span class="status">{applicationSpace}</span></p>
    </div>

    <div class="section">
      <div class="section-title">申請明細</div>
      <div class="application-details">
{applicationDetails}
      </div>
    </div>

    <div class="section">
      <div class="section-title">接下來的步驟</div>
      <p>系統將於系辦審核完成後，以信件通知您結果。</p>
    </div>
  </div>

  <div class="footer">
    <p>如有任何問題，請聯絡系辦：<br>
    {contactInfo}</p>
    
    <p>應用數學系空間借用系統 https://ndhuam-booking.pages.dev/ </p>
    
    <p style="font-size: 0.8em; color: #adb5bd;">
      此為系統自動發送信件，請勿直接回覆。
    </p>
  </div>
</body>
</html>
`
  },

  // 管理者相關信件
  ADMIN_REVIEW_REMINDER: {
    subject: '【東華應數系空間借用系統】新申請待審核通知',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .content {
      background-color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      color: #495057;
      font-size: 1.1em;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .review-button {
      display: inline-block;
      background-color: #28a745;
      color: white !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 15px 0;
    }
    .review-button:hover {
      background-color: #218838;
      text-decoration: none;
    }
    .application-info {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
      font-size: 0.9em;
      color: #6c757d;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>新申請待審核（編號：{applicationId}，空間：{applicationSpace}）</h2>
  </div>

  <div class="content">
    <p>管理員您好：</p>
    
    <div class="section">
      <div class="section-title">申請資訊</div>
      <div class="application-info">
        <p>申請編號：{applicationId}</p>
        <p>申請人：{applicantName}</p>
        <p>申請單位：{organization}</p>
        <p>送件時間：{submissionTime}</p>
        <p>申請空間：{applicationSpace}</p>
      </div>
    </div>

    <div class="section">
      <div class="section-title">審核操作</div>
      <p>請使用下方按鈕前往審核：</p>
      <a href="{reviewLink}" class="review-button">前往後台審核</a>
    </div>
  </div>

  <div class="footer">
    <p>應用數學系空間借用系統 https://ndhuam-booking.pages.dev/ </p>
    
    <p style="font-size: 0.8em; color: #adb5bd;">
      此為系統自動發送信件，請勿直接回覆。
    </p>
  </div>
</body>
</html>
`
  },

  // 審核結果通知
  // DISABLED FIELD: reviewStatus, reviewComment
  // 審核狀態：{reviewStatus}
  // 審核意見：{reviewComment}
  REVIEW_RESULT: {
    subject: `【東華應數系空間借用系統】 #{applicationId} 「{applicationSpace}」申請審核結果通知（申請編號：{applicationId}，空間：{applicationSpace}）`,
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .content {
      background-color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      color: #495057;
      font-size: 1.1em;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .approved-slots {
      color: #28a745;
      margin-bottom: 15px;
    }
    .rejected-slots {
      color: #dc3545;
      margin-bottom: 15px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
      font-size: 0.9em;
      color: #6c757d;
    }
    a {
      color: #007bff;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>東華應數系空間借用 / 申請審核結果通知（編號：{applicationId}，空間：{applicationSpace}）</h2>
  </div>

  <div class="content">
    <p>{organization} {applicantName} 您好：</p>
    
    <p>您申請借用東華應數系管理的空間（申請編號：{applicationId}）審核結果如下：

    <hr />

    <div class="section">
      <div class="section-title">申請時段明細</div>
      <p>申請編號：<span class="status">{applicationId}</span></p>
      <p>申請空間：<span class="status">{applicationSpace}</span></p>
      
      <div class="approved-slots">
        <strong>已核准時段：</strong><br>
        {approvedSlots}
      </div>

      <div class="rejected-slots">
        <strong>已駁回時段：</strong><br>
        {rejectedSlots}
      </div>
    </div>

    <div class="section">
      <div class="section-title">接下來的步驟</div>
      {nextSteps}
    </div>
  </div>

  <div class="footer">
    <p>如有任何問題，請聯絡系辦：<br>
    {contactInfo}</p>

    <p>應用數學系空間借用系統 https://ndhuam-booking.pages.dev/ </p>
    
    <p style="font-size: 0.8em; color: #adb5bd;">
      此為系統自動發送信件，請勿直接回覆。
    </p>
  </div>
</body>
</html>
`
  },

  // 登入相關信件
  LOGIN_MAGIC_LINK: {
    subject: '【東華應數系空間借用系統】登入連結',
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .content {
      background-color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      color: #495057;
      font-size: 1.1em;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .login-button {
      display: inline-block;
      background-color: #007bff;
      color: white !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 15px 0;
    }
    .login-button:hover {
      background-color: #0056b3;
      text-decoration: none;
    }
    .expiry-notice {
      color: #dc3545;
      font-size: 0.9em;
      margin-top: 10px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
      font-size: 0.9em;
      color: #6c757d;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>東華應數系空間借用系統登入</h2>
  </div>

  <div class="content">
    <p>您好：</p>

    <div class="section">
      <div class="section-title">登入資訊</div>
      <p>
        本次登入資訊如下：
        <ul>
          <li>登入帳號：{loginAccount}</li>
          <li>登入時間：{loginTime}</li>
          <li>登入 IP：{loginIP} （測試中）</li>
          <li>登入瀏覽器：{loginBrowser}</li>
        </ul>
      </p>
    </div>
    
    <div class="section">
      <div class="section-title">使用連結登入</div>
      <p>請使用下方按鈕進行登入：</p>
      <a href="{loginLink}" class="login-button">按這裡來登入系統</a>
      <p class="expiry-notice">此連結將於 {expiryTime} 後失效</p>
    </div>

    <div class="section">
      <div class="section-title">資訊安全提醒</div>
      <p>為確保資訊安全，請遵守：</p>
      <ul>
        <li>請勿將此登入連結分享給他人</li>
        <li>登入完成後請立即關閉此郵件</li>
        <li>如非本人操作，請忽略此郵件</li>
      </ul>
    </div>
  </div>

  <div class="footer">
    <p>應用數學系空間借用系統 https://ndhuam-booking.pages.dev/ </p>
    
    <p style="font-size: 0.8em; color: #adb5bd;">
      此為系統自動發送信件，請勿直接回覆。
    </p>
  </div>
</body>
</html>
`
  },

  // 新增每日彙整通知模板
  //   DAILY_SUMMARY: {
  //     subject: '【東華應數系空間借用系統】每日申請彙整報告',
  //     body: `
  // 管理員您好：

  // 以下是今日（{date}）的東華應數系空間借用申請彙整：

  // 待審核申請：{pendingCount} 筆
  // {applicationsList}

  // 今日核准申請：{approvedCount} 筆
  // 今日駁回申請：{rejectedCount} 筆

  // 請至系統查看詳細資訊：{systemLink}

  // 此為系統自動發送信件，請勿直接回覆。
  // `
  //   }
};

// 寄送郵件函數
function sendEmail(to, templateKey, templateData, cc = '') {
  try {
    const template = EMAIL_TEMPLATES[templateKey];
    if (!template) {
      throw new Error(`Template ${templateKey} not found`);
    }

    // 替換模板中的變數
    let subject = template.subject;
    let body = template.body;

    for (const [key, value] of Object.entries(templateData)) {
      const regex = new RegExp(`{${key}}`, 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    }

    // 寄送郵件
    GmailApp.sendEmail(
      to,
      subject,
      body,
      {
        name: '東華應數系空間借用系統',
        // noReply: true,
        htmlBody: body,
        cc: cc // 加入 CC 收件者
      }
    );

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    // 可以加入錯誤通知機制
    return false;
  }
}

// 範例使用方式
function testSendEmail() {
  const templateData = {
    applicantName: '測試使用者',
    applicationId: 'TEST-2024-001',
    applicationDetails: '測試場地\n時間：2024/01/01 10:00-12:00',
    contactInfo: '系辦電話：12345678\nEmail：office@example.com'
  };

  sendEmail('test@example.com', 'APPLICANT_SUBMISSION', templateData);
}

// API 相關設定
// const API_CONFIG = {
//   baseUrl: 'https://your-api-endpoint.com', // 請替換為實際的 API 端點
//   apiKey: 'your-api-key', // 請替換為實際的 API Key
//   endpoints: {
//     dailyApplications: '/api/applications/daily-summary',
//     adminEmails: '/api/admins/emails'
//   }
// };

// API 呼叫函數
function callApi(endpoint, method = 'GET', data = null) {
  const url = API_CONFIG.baseUrl + endpoint;
  const options = {
    method: method,
    headers: {
      'Authorization': `Bearer ${API_CONFIG.apiKey}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  if (data) {
    options.payload = JSON.stringify(data);
  }

  try {
    const response = UrlFetchApp.fetch(url, options);
    return JSON.parse(response.getContentText());
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

// 修改每日彙整通知相關函數
function getDailyApplications() {
  try {
    const response = callApi(API_CONFIG.endpoints.dailyApplications);
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch daily applications:', error);
    return [];
  }
}

function getAdminEmails() {
  try {
    const response = callApi(API_CONFIG.endpoints.adminEmails);
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch admin emails:', error);
    return ['fallback-admin@example.com']; // 設定一個備用信箱
  }
}

function sendDailySummary() {
  try {
    // 取得當日申請資料
    const applications = getDailyApplications();

    // 計算各狀態數量
    const pendingApplications = applications.filter(app => app.status === 'pending');
    const approvedApplications = applications.filter(app => app.status === 'approved');
    const rejectedApplications = applications.filter(app => app.status === 'rejected');

    // 取得管理員信箱
    const adminEmails = getAdminEmails();

    const templateData = {
      date: Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy/MM/dd'),
      pendingCount: pendingApplications.length,
      approvedCount: approvedApplications.length,
      rejectedCount: rejectedApplications.length,
      applicationsList: generateApplicationsList(pendingApplications),
      systemLink: API_CONFIG.baseUrl // 使用 API 端點作為系統連結
    };

    // 寄送給所有管理員
    adminEmails.forEach(email => {
      sendEmail(email, 'DAILY_SUMMARY', templateData);
    });

    return true;
  } catch (error) {
    console.error('Error sending daily summary:', error);
    return false;
  }
}

// 修改申請清單產生函數
function generateApplicationsList(applications) {
  if (!applications || applications.length === 0) {
    return '今日無待審核申請';
  }

  return applications.map(app => {
    return `- 申請編號：${app.id} | 申請人：${app.applicantName} | 申請時間：${app.submissionTime}`;
  }).join('\n');
}

// 設定每日觸發器
function createDailyTrigger() {
  // 刪除現有的觸發器
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'sendDailySummary') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 建立新的觸發器，設定在每天下午 5 點發送
  ScriptApp.newTrigger('sendDailySummary')
    .timeBased()
    .everyDays(1)
    .atHour(17)
    .create();
}

// 測試用函數
function testDailySummary() {
  sendDailySummary();
}

// 建立 Web API 端點
function doPost(e) {
  try {
    // 檢查是否有 POST 資料
    if (!e.postData || !e.postData.contents) {
      return createResponse(400, {
        success: false,
        message: 'No POST data received'
      });
    }

    // 解析 POST 資料
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseError) {
      return createResponse(400, {
        success: false,
        message: 'Invalid JSON format',
        error: parseError.toString()
      });
    }

    // 驗證必要欄位
    if (!data.templateKey || !data.templateData) {
      return createResponse(400, {
        success: false,
        message: 'Missing required fields: templateKey, templateData'
      });
    }

    // 驗證 email 網域（如果有提供 to 或 cc）
    const validateEmail = (email) => {
      if (!email) return true;
      return email.split(',').every(e => e.trim().endsWith('ndhu.edu.tw'));
    };

    if (!validateEmail(data.to) || !validateEmail(data.cc)) {
      return createResponse(400, {
        success: false,
        message: 'Invalid email domain',
        code: 'INVALID_EMAIL'
      });
    }

    // 寄送郵件
    const result = sendEmail(
      data.to || '',
      data.templateKey,
      data.templateData,
      data.cc || ''
    );

    if (result) {
      return createResponse(200, {
        success: true,
        message: 'Email sent successfully'
      });
    } else {
      return createResponse(500, {
        success: false,
        message: 'Failed to send email'
      });
    }
  } catch (error) {
    console.error('Error in doPost:', error);
    return createResponse(500, {
      success: false,
      message: 'Internal server error',
      error: error.toString()
    });
  }
}

// 建立回應
function createResponse(statusCode, data) {
  const output = ContentService.createTextOutput();
  output.setContent(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// 新增 doGet 函數以處理 CORS
function doGet(e) {
  return createResponse(200, {
    success: true,
    message: 'API is running'
  });
}

// 部署為 Web API 的說明
function getDeploymentInstructions() {
  const scriptId = ScriptApp.getScriptId();
  const deploymentId = ScriptApp.getDeploymentId();

  return {
    instructions: `
1. 部署此腳本為 Web 應用程式：
   - 在 Google Apps Script 編輯器中，點擊「部署」>「新增部署」
   - 選擇「Web 應用程式」
   - 設定以下選項：
     - 執行身份：我（你的帳號）
     - 誰可以存取：所有人
   - 點擊「部署」
   - 複製產生的 Web 應用程式 URL

2. 在你的系統中呼叫此 API：
   POST {Web 應用程式 URL}
   Content-Type: application/json
   
   請求格式：
   {
     "templateKey": "EMAIL_TEMPLATE_KEY",
     "to": "recipient@example.com",
     "templateData": {
       "applicantName": "王小明",
       "applicationId": "APP-2024-001",
       ...
     }
   }

   回應格式：
   {
     "success": true/false,
     "message": "狀態訊息",
     "error": "錯誤訊息（如果有）"
   }
    `,
    scriptId: scriptId,
    deploymentId: deploymentId
  };
}
