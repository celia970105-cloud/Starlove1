# 🌟 星願應援站 - Starry Wish Support Platform

全球明星應援星空社群平台。結合了應援投稿審核、精緻黑膠唱片播放器、星願專屬信箱、藝廊展示、影片應援區，以及充滿治癒感且具備多人共同守護與好友拜訪互動機制的「星空萌寵互動系統」。

---

## 🚀 專案特色 (Key Features)

1. **📣 應援投稿與審核系統**：粉絲可在應援專區上傳、查看投稿，管理員（預設：`CeliaAdmin`）可隨時對投稿進行過濾與審核，維護社群品質。
2. **🎵 復古黑膠音樂播放器**：精緻唱針滑動動畫、自訂播放清單，為愛豆（Idol）點播應援音樂。
3. **✉️ 星願信箱**：傳遞每位粉絲的真摯心願，支援即時卡片發送與留言板。
4. **🎨 應援藝廊與影片區**：視覺化的愛豆照片展覽與熱門影片導流，聚焦最高光的應援舞台。
5. **🌸 萌寵家園系統**（全新進化）：
   - **單人私密小屋**：屬於您的專屬星寵，可餵食、撫摸、自訂家園家具與外觀。
   - **2~6人共同家庭**：與好友一同組建家庭，共同飼養一隻星寵、共享零食箱與家具、合影留念並平分榮耀。
   - **好友拜訪與深度互動**：可以跨房參觀好友個人家園或共同家庭。點擊好友星寵互動，系統將依據您的陪伴時間間隔、頻率自動結算，發放不同檔次的 **星星幣 🪙** 獎勵，好友也能得到加成，實現全星空互助暖心陪伴！

---

## 🛠️ 技術棧 (Tech Stack)

* **前端（Frontend）**：React 19 + TypeScript + Vite 6 + Tailwind CSS 4 + Motion (framer-motion) 互動動畫 + Lucide React 圖標庫
* **後端（Backend）**：Node.js + Express 4 (高能全棧架構)
* **資料庫（Database）**：輕量級本機檔案資料庫 `db.json` (啟動時會自動寫入初始預置資料，包含預設管理員與數隻超萌星寵)

---

## 💻 本地快速開發 (Local Development)

### 1. 安裝依賴
```bash
npm install
```

### 2. 環境變數設定
請複製 `.env.example` 並重新命名為 `.env`：
```bash
cp .env.example .env
```
您可以配置您的 Gemini API Key 來啟用更進階的 AI 特色功能。

### 3. 啟動開發伺服器
```bash
npm run dev
```
啟動後，瀏覽器打開 [http://localhost:3000](http://localhost:3000) 即可開始體驗完整的全棧功能。

### 4. 生產環境打包與編譯
```bash
npm run build
```
此指令會同時使用 Vite 編譯前端靜態資源至 `/dist`，並利用 `esbuild` 將 Node.js 後端伺服器快速打包至單個 `dist/server.cjs` 檔案中，免去複雜的 ESM 相對路徑問題。

### 5. 執行生產環境伺服器
```bash
npm run start
```

---

## 🌐 GitHub 部署與分享指南 (GitHub Deployment Guide)

本專案已為您配置好**完美的 GitHub Repository 結構**、`.gitignore` 以及 **自動化部署腳本**，您可以自由選擇以下任一方案進行部署與分享：

### 📌 準備步驟：將專案 Push 到 GitHub
在您的本地終端機執行以下指令：
```bash
# 1. 初始化 Git 倉庫
git init

# 2. 將所有檔案加入暫存區
git add .

# 3. 提交至本地分支
git commit -m "feat: init Starry Wish Support Platform"

# 4. 在 GitHub 上建立一個新的 Repository，然後連結遠端倉庫
git remote add origin https://github.com/您的用戶名/您的倉庫名.git

# 5. 推送程式碼到 GitHub
git branch -M main
git push -u origin main
```

---

### 🚀 方案 A：全棧雲端主機部署（推薦，100% 完整功能）
由於本專案採用 Node.js + Express + 本地 `db.json` 檔案資料庫作為全棧架構，最完美的部署方式是將後端伺服器託管於支援容器或持久磁碟的主機上。

#### 1. 部署到 Render (https://render.com)
* 註冊/登入 Render 並點擊 **New** -> **Web Service**。
* 連結您的 GitHub 帳戶並選擇此專案的 Repository。
* 設定參數：
  * **Runtime**: `Node`
  * **Build Command**: `npm run build`
  * **Start Command**: `npm run start`
* 在 **Environment Variables** 區塊中，點擊並新增：
  * `NODE_ENV` = `production`
  * `PORT` = `10000`（Render 會自動偵測並綁定）
* 點擊 **Deploy Web Service** 即可完成！
> 💡 *小提示：若需要長期不重設資料庫，可在 Render 中掛載一個 Persistent Disk（持久化硬碟）至 `/` 目錄，使 `db.json` 在每次伺服器重啟時不會被還原。*

#### 2. 部署到 Railway (https://railway.app)
* 登入 Railway，點擊 **New Project** -> **Deploy from GitHub repo**。
* 選擇本 Repository，Railway 將全自動偵測 `package.json` 中的 `build` 與 `start` 指令，並在 1 分鐘內完成全域 HTTPS 網址的發布。

---

### 🚀 方案 B：GitHub Pages（純前端靜態頁面自動部署）
如果您只想向好友展示華麗的應援站介面、黑膠播放器、相簿、信箱外觀（不依賴後端 API 存取），可以直接利用我們為您設定好的 **GitHub Actions 流程**！

#### 啟用步驟：
1. 前往 GitHub 網頁版您的 Repository 頁面。
2. 點擊 **Settings** -> **Pages**。
3. 在 **Build and deployment** 下方的 **Source** 選擇 **GitHub Actions**。
4. 將程式碼 Push 到 `main` 分支後，GitHub Actions 就會自動觸發並完成構建，將靜態前端部署到：`https://您的用戶名.github.io/您的倉庫名`。

> ⚠️ *備註：因 GitHub Pages 僅提供靜態網頁託管，後端 `/api/*` 路由在靜態模式下會失效。若要將前端與後端分離，可參考下方 Vercel 的 Proxy 代理方案。*

---

### 🚀 方案 C：Vercel 託管（前端 SPA 高速 CDN + API 代理）
我們已經在根目錄為您預置了 `vercel.json` 檔案。

1. 登入 Vercel (https://vercel.com) 點擊 **Add New** -> **Project**。
2. 選擇此 GitHub 倉庫。
3. 在 Vercel 的設定中：
   - 專案架構預設選擇 `Vite`。
   - 編譯指令與輸出目錄保持預設即可。
4. **無縫 API 整合**：您可以將後端 API 部署在 Render 上，並編輯 `vercel.json` 裡的 `destination`，將 `/api/(.*)` 轉發到您部署在 Render 的 API 網址：
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://您的Render伺服器網址.com/api/$1"
    }
  ]
}
```
如此一來，Vercel 託管的前端便能安全、無任何跨網域問題 (CORS) 地調用部署在其他主機上的全棧 API！
