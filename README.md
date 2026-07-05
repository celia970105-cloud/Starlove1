# 🌟 星願應援站 - Starry Wish Support Platform

全球明星應援星空社群平台。結合了應援投稿審核、精緻黑膠唱片播放器、星願專屬信箱、藝廊展示、影片應援區，以及充滿治癒感且具備多人共同守護與好友拜訪互動機制的「星空萌寵互動系統」。

本專案已完全改造成**無伺服器 (Serverless) 的純前端 SPA 架構**，所有資料皆使用 **Supabase** 進行雲端持久化儲存（包含 Auth 帳號認證、Database 資料庫、Storage 檔案上傳儲存），可以極速部署至 **GitHub Pages**、**Cloudflare Pages**、**Vercel** 等任何靜態網頁平台，徹底免除 Render 或其他 Node 伺服器的負擔！

---

## 🚀 專案特色 (Key Features)

1. **📣 應援投稿與審核系統**：粉絲可在應援專區上傳、查看投稿，管理員（預設：`celia970105@gmail.com` / 密碼 `Aa0955283881`）可隨時對投稿進行過濾與審核，維護社群品質。
2. **🎵 復古黑膠音樂播放器**：精緻唱針滑動動畫、自訂播放清單，為愛豆（Idol）點播應援音樂。
3. **✉️ 星願信箱**：傳遞每位粉絲的真摯心願，支援即時卡片發送與留言板。
4. **🎨 應援藝廊與影片區**：視覺化的愛豆照片展覽與熱門影片導流，聚焦最高光的應援舞台。
5. **🌸 萌寵家園系統**（全新進化）：
   - **單人私密小屋**：屬於您的專屬星寵，可餵食、撫摸、自訂家園家具與外觀。
   - **2~6人共同家庭**：與好友一同組建家庭，共同飼養一隻星寵、共享零食箱與家具、合影留念並平分榮耀。
   - **好友拜訪與深度互動**：可以跨房參觀好友個人家園或共同家庭。點擊好友星寵互動，系統將依據您的陪伴時間間隔、頻率自動結算，發放不同檔次的 **星星幣 🪙** 獎勵，好友也能得到加成，實現全星空互助暖心陪伴！

---

## 🛠️ 技術棧 (Tech Stack)

* **前端（Frontend）**：React + TypeScript + Vite + Tailwind CSS + Motion (motion/react) 互動動畫 + Lucide React 圖標庫
* **資料庫與認證（Backend/Database）**：**Supabase** (Auth / Database / Storage)
* **架構模式**：純前端靜態單頁應用 (SPA)，API 呼叫經由統一 Fetch 攔截器，透明切換至 Supabase，完全不需建立 Node Server！

---

## ⚙️ Supabase 資料庫設定

要開始使用 Supabase 進行全功能雲端儲存，請在 [Supabase 官網](https://supabase.com) 建立一個新專案，並完成以下兩步設定：

### 1. 建立資料庫資料表
在您的 Supabase 專案中，前往 **SQL Editor**，貼上並執行以下 SQL 指令來建立 `starry_state` 資料表：

```sql
-- 建立統一的 key-value 持久化儲存表
create table public.starry_state (
  key text primary key,
  value jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 開啟 Row Level Security (RLS) 並允許公開存取 (若需要進一步限制安全，可在後續調整 rules)
alter table public.starry_state enable row level security;

create policy "Allow public read access"
  on public.starry_state for select
  using (true);

create policy "Allow public write/upsert access"
  on public.starry_state for all
  using (true)
  with check (true);
```

### 2. 建立 Storage 儲存桶 (Bucket)
在您的 Supabase 專案中，前往 **Storage**，建立一個名為 **`starry_assets`** 的儲存桶，並將其設定為 **Public (公開存取)**。如此一來，上傳的投稿照片與個人頭像便能自動上傳至雲端，並取得永久的 CDN 公開網址！

---

## 💻 本地快速開發 (Local Development)

### 1. 安裝依賴
```bash
npm install
```

### 2. 環境變數設定
請在根目錄建立 `.env` 檔案，並填入您的 Supabase 專案憑證：
```env
# 您的 Supabase 專案網址與 Anon Key (在專案設定的 API 區塊可以找到)
VITE_SUPABASE_URL="https://your-supabase-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```
> 💡 *小提示：如果 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 為空或未配置，本專案將會**全自動無縫降級為本地 localStorage 模擬資料庫**。即便不配置 Supabase，專案也能完全流暢、正常地運行所有功能，為開發與示範帶來極大便利！*

### 3. 啟動開發伺服器
```bash
npm run dev
```
啟動後，打開 [http://localhost:3000](http://localhost:3000) 即可開始體驗。

---

## 🌐 雲端部署指南 (Cloud Deployment Guide)

本專案為 100% 純前端靜態網頁架構，可以直接部署至任何靜態託管平台。

### 🚀 方案 A：部署到 Cloudflare Pages (強烈推薦)
Cloudflare Pages 提供高速、無限流量且免費的靜態網頁託管。

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)。
2. 前往 **Workers & Pages** -> **Create** -> **Pages (Connect to Git)**。
3. 連結您的 GitHub 帳戶並選擇此專案的 Repository。
4. 設定編譯設定：
   - **Framework Preset**: `Vite` (或保持預設 `None`)
   - **Build Command**: `npm run build`
   - **Build output directory**: `dist`
5. 設定環境變數：
   - 前往 **Environment Variables (環境變數)** 區塊，新增兩個環境變數：
     - `VITE_SUPABASE_URL` = `您的 Supabase Project URL`
     - `VITE_SUPABASE_ANON_KEY` = `您的 Supabase Anon Key`
6. 點擊 **Save and Deploy** 即可完成！

---

### 🚀 方案 B：部署到 GitHub Pages (自動化 Actions 部署)
本專案已為您配置好完美的 GitHub Pages 託管流程。

1. 將本專案推送至您的 GitHub 倉庫。
2. 前往 GitHub 網頁版您的 Repository 頁面。
3. 點擊 **Settings** -> **Pages**。
4. 在 **Build and deployment** -> **Source** 選擇 **GitHub Actions**。
5. 每次您推送程式碼到 `main` 分支時，GitHub Actions 都會自動建置並部署至 `https://您的用戶名.github.io/您的倉庫名`。
6. *注意：您需要在 GitHub 專案的 **Settings** -> **Secrets and variables** -> **Actions** 內新增 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_ANON_KEY` 的 Repository Secrets。*

---

### 🚀 方案 C：部署到 Vercel
1. 登入 [Vercel](https://vercel.com)。
2. 點擊 **Add New Project**，並導入您的 GitHub 專案。
3. 在 Environment Variables 中新增 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_ANON_KEY`。
4. 點擊 **Deploy**，約 30 秒後即可發布成功！
