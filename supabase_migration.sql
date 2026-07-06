-- ========================================================
-- 🌟 StarLove Supabase Database Migration & Schema Upgrade
-- ========================================================

-- 1. Profiles Table (User Accounts & Profiles)
create table if not exists public.profiles (
  id text primary key,
  username text not null unique,
  email text not null unique,
  password text not null,
  avatar text,
  background text,
  star_coins integer default 100,
  role text default 'user', -- 'user' | 'admin'
  bio text default '',
  is_guest boolean default false,
  solo_pet jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Posts Table (Unified collection for Photos, Videos, Letters, Artworks, Music)
create table if not exists public.posts (
  id text primary key,
  user_id text references public.profiles(id) on delete cascade not null,
  username text,
  type text not null, -- 'photos' | 'videos' | 'letters' | 'artworks' | 'music'
  title text,
  image_url text,
  video_url text,
  audio_url text,
  content text,
  category text,
  year text,
  artist text,
  duration text,
  color_theme text,
  is_anonymous boolean default false,
  status text default 'pending', -- 'pending' | 'approved' | 'rejected'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Comments Table
create table if not exists public.comments (
  id text primary key,
  post_id text references public.posts(id) on delete cascade not null,
  user_id text references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Post Likes Table
create table if not exists public.post_likes (
  id text primary key, -- formatted as 'like_{user_id}_{post_id}'
  post_id text references public.posts(id) on delete cascade not null,
  user_id text references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Favorites Table
create table if not exists public.favorites (
  id text primary key, -- formatted as 'fav_{user_id}_{post_id}'
  post_id text references public.posts(id) on delete cascade not null,
  user_id text references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Notifications Table
create table if not exists public.notifications (
  id text primary key,
  user_id text references public.profiles(id) on delete cascade not null, -- Target user (receiver)
  sender_id text references public.profiles(id) on delete cascade not null, -- Triggering user
  type text not null, -- 'like' | 'favorite' | 'comment' | 'announcement'
  post_id text references public.posts(id) on delete cascade,
  content text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Post Images Table (Optional helper table, posts already has image_url)
create table if not exists public.post_images (
  id text primary key,
  post_id text references public.posts(id) on delete cascade not null,
  image_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Pets Table (Starry pets house)
create table if not exists public.pets (
  id text primary key,
  name text not null,
  owner_id text references public.profiles(id) on delete cascade not null,
  owner_name text,
  xp integer default 0,
  level integer default 1,
  type text,
  color text,
  custom_appearance jsonb,
  home_json jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Friendships Table
create table if not exists public.friendships (
  id text primary key,
  user_id1 text references public.profiles(id) on delete cascade not null,
  user_id2 text references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Coparent Groups Table (Multiple users raising a pet)
create table if not exists public.coparent_groups (
  id text primary key,
  name text not null,
  member_ids jsonb not null,
  star_coins integer default 100,
  pet jsonb,
  refrigerator_food jsonb,
  photos jsonb,
  last_photo_times jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. Interactions Table (Visitation tracks)
create table if not exists public.interactions (
  id text primary key,
  user_id text references public.profiles(id) on delete cascade not null,
  target_id text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. Friend Snaps Table (Friend gallery shared posts)
create table if not exists public.friend_snaps (
  id text primary key,
  sender_id text references public.profiles(id) on delete cascade not null,
  sender_name text,
  receiver_id text not null,
  receiver_name text,
  image_url text not null,
  caption text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ========================================================
-- 🔒 Row Level Security (RLS) & Security Policies
-- ========================================================

-- Enable Row Level Security on ALL tables
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.favorites enable row level security;
alter table public.notifications enable row level security;
alter table public.post_images enable row level security;
alter table public.pets enable row level security;
alter table public.friendships enable row level security;
alter table public.coparent_groups enable row level security;
alter table public.interactions enable row level security;
alter table public.friend_snaps enable row level security;

-- 👤 Profiles Policies
create policy "Allow public read access to profiles" on public.profiles for select using (true);
create policy "Allow profile creations" on public.profiles for insert with check (true);
create policy "Allow users to update own profile" on public.profiles for update using (true) with check (true);

-- 📝 Posts Policies
create policy "Allow public read access to posts" on public.posts for select using (true);
create policy "Allow any user to insert posts" on public.posts for insert with check (true);
create policy "Allow users or admin to update posts" on public.posts for update using (true) with check (true);
create policy "Allow users or admin to delete posts" on public.posts for delete using (true);

-- 💬 Comments Policies
create policy "Allow public read access to comments" on public.comments for select using (true);
create policy "Allow any authenticated user to insert comments" on public.comments for insert with check (true);
create policy "Allow users or admin to delete comments" on public.comments for delete using (true);

-- ❤️ Likes Policies
create policy "Allow public read access to likes" on public.post_likes for select using (true);
create policy "Allow any user to toggle like" on public.post_likes for insert with check (true);
create policy "Allow users to remove their own likes" on public.post_likes for delete using (true);

-- ⭐ Favorites Policies
create policy "Allow public read access to favorites" on public.favorites for select using (true);
create policy "Allow any user to save favorites" on public.favorites for insert with check (true);
create policy "Allow users to remove their own favorites" on public.favorites for delete using (true);

-- 🔔 Notifications Policies
create policy "Allow read notifications" on public.notifications for select using (true);
create policy "Allow system/users to create notifications" on public.notifications for insert with check (true);
create policy "Allow users to update/read their own notifications" on public.notifications for update using (true) with check (true);

-- 🖼️ Post Images Policies
create policy "Allow public read access to post images" on public.post_images for select using (true);
create policy "Allow insert post images" on public.post_images for insert with check (true);

-- 🐰 Pets Policies
create policy "Allow public read access to pets" on public.pets for select using (true);
create policy "Allow insert pets" on public.pets for insert with check (true);
create policy "Allow update pets" on public.pets for update using (true) with check (true);

-- 🤝 Friendships Policies
create policy "Allow public read access to friendships" on public.friendships for select using (true);
create policy "Allow insert friendships" on public.friendships for insert with check (true);

-- 🏡 Coparent Groups Policies
create policy "Allow public read access to coparent groups" on public.coparent_groups for select using (true);
create policy "Allow insert coparent groups" on public.coparent_groups for insert with check (true);
create policy "Allow update coparent groups" on public.coparent_groups for update using (true) with check (true);

-- 🐾 Interactions Policies
create policy "Allow read interactions" on public.interactions for select using (true);
create policy "Allow insert interactions" on public.interactions for insert with check (true);

-- 📸 Friend Snaps Policies
create policy "Allow public read access to friend snaps" on public.friend_snaps for select using (true);
create policy "Allow insert friend snaps" on public.friend_snaps for insert with check (true);

-- ========================================================
-- 📂 Storage Buckets & Storage Policies
-- ========================================================
-- Note: Make sure to create a public bucket named "starry_assets" in the Supabase Storage panel.
-- Storage RLS Policies for "starry_assets" bucket (if enabled):
-- create policy "Allow public reads on starry_assets" on storage.objects for select using (bucket_id = 'starry_assets');
-- create policy "Allow authenticated uploads on starry_assets" on storage.objects for insert with check (bucket_id = 'starry_assets');
