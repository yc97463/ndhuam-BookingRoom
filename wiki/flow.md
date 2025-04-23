# 空間預約與申請平台專案說明

## 🔧 專案運作模式

本專案為一個由大學系辦管理之空間預約系統，分為「訪客前端」與「系辦後台」兩大區塊，搭配 Cloudflare Pages 部署、Cloudflare D1 作為資料庫。

- 前端框架：Next.js（使用 `next export` 輸出為靜態頁）
- 後端 API：使用 Cloudflare Pages Functions 實作，部署於 `functions/api/*.ts`
- 資料庫：Cloudflare D1（SQL 架構見 schema.sql）
- 部署平台：Cloudflare Pages + Pages Functions
- 後台操作驗證：使用 JWT Token 驗證，避免未授權用戶操作審核功能（Token 可透過後台登入產生，後續 API 呼叫需附帶 Authorization header）

---

## 📁 專案結構

```
ndhuam-BookingRoom/
├── frontend/                # Next.js 前端（已 export 靜態頁）
│   ├── pages/              # 頁面定義
│   ├── out/                # next export 產出靜態頁（build 輸出）
│   └── package.json
├── functions/              # Cloudflare Functions（API）
│   └── api/
│       ├── slots.ts                 # GET 時段清單
│       ├── applications.ts         # GET & POST 申請單
│       ├── applications/[id].ts    # PATCH 審核整張申請
│       ├── slots/[id].ts           # PATCH 審核單一時段
│       ├── auth/login.ts           # POST 登入，簽發 JWT
│       └── utils/verifyToken.ts    # JWT 驗證工具函式
├── schema.sql              # D1 資料庫 schema 定義
├── wrangler.toml           # Cloudflare 設定檔
└── package.json            # 根目錄 scripts 定義
```

---

## 🗃️ 資料表設計

### `rooms` 空間資訊表（v2 格式）

```sql
CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL UNIQUE,
  room_name TEXT NOT NULL,
  location TEXT,
  capacity INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

- `room_id`：如「A205」，作為邏輯識別碼
- `room_name`：教室名稱（如「電腦教室」）
- `location`：描述所在位置（如「理工大樓2樓」）
- `capacity`：容納人數

可再透過 `updated_at` 配合 trigger 實作自動更新

---

## 🔐 JWT 登入與驗證機制

### `/api/auth/login.ts`
提供 POST 介面登入，驗證帳密成功後簽發 JWT：

```ts
POST /api/auth/login
{
  "username": "admin",
  "password": "secret"
}
```

成功回傳：
```json
{
  "token": "<JWT>"
}
```

### `utils/verifyToken.ts`
所有需授權的 API 可引入此函式進行驗證：

```ts
import { verifyToken } from "../utils/verifyToken"

const user = await verifyToken(request)
if (!user) return new Response("Unauthorized", { status: 401 })
```

（簽名密鑰可從環境變數如 `JWT_SECRET` 傳入）

...