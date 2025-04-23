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

---

## 🚀 部署與開發流程

### 🔧 本機開發

```bash
npm run dev
```
這會觸發：
1. 編譯 Next.js → `frontend/out`
2. 啟動 Cloudflare Pages dev server（含 API）在 `http://localhost:8788`

### 📦 建構 & 部署（部署到 Cloudflare Pages）

```bash
npm run build       # 編譯 frontend (next export)
npm run cf:deploy   # 使用 wrangler 部署到 Pages
```

根目錄 package.json:
```json
{
  "scripts": {
    "dev": "npm run build && npx wrangler pages dev frontend/out --compatibility-flag=nodejs_compat",
    "build": "cd frontend && npm install && npm run build",
    "cf:deploy": "npx wrangler pages deploy frontend/out --project-name=ndhuam-booking"
  }
}
```

### 🧪 可測試的 API（本機 or Pages）

- `GET /api/slots`：列出所有待審時段
- `POST /api/applications`：送出一張申請單（含多個時段）
- `GET /api/applications`：列出所有申請單 + 對應時段（需 JWT）
- `PATCH /api/slots/:id`：核可/拒絕單一時段（需 JWT）
- `PATCH /api/applications/:id`：整筆申請單狀態更新（並自動判斷總狀態，需 JWT）
- `POST /api/auth/login`：取得登入用 JWT（可使用環境變數指定帳密）

...
