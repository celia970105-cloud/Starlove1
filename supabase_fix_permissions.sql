-- ========================================================
-- 🌟 Starry Wish - Supabase Permissions & RLS Policies Fix
-- ========================================================
--
-- 說明：
-- 由於本機環境與預覽容器僅持有 anon 公開金鑰，無法直接執行具有 DDL (如 GRANT 或 CREATE POLICY) 
-- 權限之管理指令。您需要直接複製以下 SQL 指令，貼入您的 Supabase 專案 SQL 編輯器中執行。
--
-- 執行網址：
-- https://supabase.com/dashboard/project/monzjuezyncvdlzqgqmo/sql
--
-- ========================================================

-- --------------------------------------------------------
-- 1. 基礎模式與資料表權限授權 (解決 42501 Permission Denied 錯誤)
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
-- 2. 設定 posts 資料表的 RLS 與 Policy 
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

-- 建立使用者指定的投稿寫入 Policy
CREATE POLICY "Anyone can insert posts"
ON public.posts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 建立使用者指定的投稿讀取 Policy
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


-- --------------------------------------------------------
-- 3. 同步設定 profiles ＆ starry_state 資料表
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
