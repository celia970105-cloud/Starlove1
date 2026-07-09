-- ========================================================
-- 🌟 Starry Wish - Supabase Permissions, Schema, and RLS Fix SQL
-- ========================================================
--
-- 說明：
-- 1. 由於本機與預覽環境只有 anon 公開金鑰，無法直接對雲端資料庫執行 DDL (例如 ALTER TABLE, CREATE POLICY 等) 權限指令。
-- 2. 您需要【複製以下所有 SQL 指令】，直接貼入您的 Supabase 專案 SQL 編輯器中執行。
--
-- 執行網址：
-- https://supabase.com/dashboard/project/monzjuezyncvdlzqgqmo/sql
--
-- ========================================================

-- --------------------------------------------------------
-- 1. 補齊 posts 資料表缺少的欄位 (重要！修復 Column Not Found 錯誤)
-- --------------------------------------------------------
-- 經檢查，目前資料庫的 posts 資料表缺少了部分前端音樂/影片/同人投稿所需的欄位，
-- 執行以下指令可以安全地補齊所有缺失欄位而不影響現有資料：

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS images text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS videos text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS audio_url text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS year text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS artist text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS duration text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS color_theme text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false;

-- --------------------------------------------------------
-- 2. 基礎模式與資料表權限授權 (解決 42501 Permission Denied 錯誤)
-- --------------------------------------------------------
-- 授權公用角色使用 public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 授權所有資料表的基本讀寫與更新權限
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 預設為未來新增的資料表自動套用授權
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;


-- --------------------------------------------------------
-- 3. 設定 posts 資料表的 RLS 與 Policy 
-- --------------------------------------------------------
-- 確保 posts 啟用 Row Level Security
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 清理可能衝突的舊 RLS Policy
DROP POLICY IF EXISTS "Anyone can insert posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can read posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can update posts" ON public.posts;
DROP POLICY IF EXISTS "Allow public read access to posts" ON public.posts;
DROP POLICY IF EXISTS "Allow any user to insert posts" ON public.posts;
DROP POLICY IF EXISTS "Allow users or admin to update posts" ON public.posts;
DROP POLICY IF EXISTS "Allow users or admin to delete posts" ON public.posts;
DROP POLICY IF EXISTS "Allow users to insert posts" ON public.posts;

-- 建立投稿寫入 Policy
CREATE POLICY "Anyone can insert posts"
ON public.posts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 建立投稿讀取 Policy
CREATE POLICY "Anyone can read posts"
ON public.posts
FOR SELECT
TO anon, authenticated
USING (true);

-- 建立更新 Policy (以利管理員進行審核與狀態變更)
CREATE POLICY "Anyone can update posts"
ON public.posts
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 建立刪除 Policy (以利管理員進行刪除項目操作)
CREATE POLICY "Anyone can delete posts"
ON public.posts
FOR DELETE
TO anon, authenticated
USING (true);


-- --------------------------------------------------------
-- 4. 同步設定 profiles ＆ starry_state 資料表
-- --------------------------------------------------------
-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can insert profiles" ON public.profiles;
CREATE POLICY "Anyone can insert profiles" ON public.profiles FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update profiles" ON public.profiles;
CREATE POLICY "Anyone can update profiles" ON public.profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- starry_state
ALTER TABLE public.starry_state ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.starry_state TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can read starry_state" ON public.starry_state;
CREATE POLICY "Anyone can read starry_state" ON public.starry_state FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can insert starry_state" ON public.starry_state;
CREATE POLICY "Anyone can insert starry_state" ON public.starry_state FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update starry_state" ON public.starry_state;
CREATE POLICY "Anyone can update starry_state" ON public.starry_state FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 通知 Supabase 重新載入快取以利立即使所有欄位生效
NOTIFY pgrst, 'reload schema';
