import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Initialize Supabase if keys are provided
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Initial Seeds (exactly matching server.ts SEED_DATA)
const SEED_DATA = {
  users: [
    {
      id: "admin",
      username: "CeliaAdmin",
      email: "celia970105@gmail.com",
      password: "Aa0955283881",
      role: "admin",
      avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=celia&backgroundColor=ffdeeb",
      background: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=1200",
      star_coins: 100
    },
    {
      id: "user_zack",
      username: "ZackLover",
      email: "zack@starry.com",
      password: "password123",
      role: "user",
      avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Zack&backgroundColor=ffe3ec",
      background: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=1200",
      star_coins: 100
    },
    {
      id: "user_jeremy",
      username: "JeremyFan",
      email: "jeremy@starry.com",
      password: "password123",
      role: "user",
      avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Jeremy&backgroundColor=ffd3e2",
      background: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=1200",
      star_coins: 100
    },
    {
      id: "user_star",
      username: "MarshmallowStar",
      email: "star@starry.com",
      password: "password123",
      role: "user",
      avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Star&backgroundColor=ffb3d1",
      background: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=1200",
      star_coins: 100
    }
  ],
  posts_photos: [] as any[],
  posts_videos: [] as any[],
  posts_letters: [] as any[],
  posts_artworks: [] as any[],
  posts_music: [] as any[],
  pets: [] as any[],
  friendships: [] as any[],
  coparent_groups: [] as any[],
  interactions: [] as any[],
  friend_snaps: [] as any[],
  last_hourly_trigger: new Date().toISOString()
};

// Storage bucket & table configurations
// Key names inside 'starry_state'
const DB_KEYS = [
  "users",
  "posts_photos",
  "posts_videos",
  "posts_letters",
  "posts_artworks",
  "posts_music",
  "pets",
  "friendships",
  "coparent_groups",
  "interactions",
  "friend_snaps",
  "last_hourly_trigger"
];

// Helper to read database key
export async function getDbKey(key: string): Promise<any> {
  const defaultValue = (SEED_DATA as any)[key] || [];
  if (!supabase) {
    const local = localStorage.getItem(`starry_local_${key}`);
    return local ? JSON.parse(local) : defaultValue;
  }
  try {
    let result: any = null;
    if (key === "users") {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      result = data;
    } else if (key.startsWith("posts_")) {
      const type = key.replace("posts_", "");
      const { data, error } = await supabase.from("posts").select("*").eq("type", type);
      if (error) throw error;
      result = data;
    } else if (["pets", "friendships", "coparent_groups", "interactions", "friend_snaps"].includes(key)) {
      const { data, error } = await supabase.from(key).select("*");
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from("starry_state")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      if (!error && data) result = data.value;
    }

    if (result === null) {
      await setDbKey(key, defaultValue);
      return defaultValue;
    }

    localStorage.setItem(`starry_local_${key}`, JSON.stringify(result));
    return result;
  } catch (err) {
    console.warn(`Supabase read failed for key ${key}, falling back to local storage`, err);
    const local = localStorage.getItem(`starry_local_${key}`);
    return local ? JSON.parse(local) : defaultValue;
  }
}

// Helper to write database key
export async function setDbKey(key: string, value: any): Promise<void> {
  localStorage.setItem(`starry_local_${key}`, JSON.stringify(value));
  if (!supabase) return;
  try {
    if (key === "users") {
      const cleanUsers = value.map((u: any) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        password: u.password || "password123",
        avatar: u.avatar || "",
        background: u.background || "",
        star_coins: u.star_coins || 100,
        role: u.role || "user",
        bio: u.bio || "",
        is_guest: Boolean(u.is_guest),
        solo_pet: u.solo_pet || null
      }));
      const { error } = await supabase.from("profiles").upsert(cleanUsers);
      if (error) throw error;
    } else if (key.startsWith("posts_")) {
      const type = key.replace("posts_", "");
      const cleanPosts = value.map((p: any) => ({
        id: p.id,
        user_id: p.user_id || "anonymous",
        username: p.username || "Anonymous",
        type: type,
        title: p.title || null,
        image_url: p.image_url || null,
        video_url: p.video_url || null,
        audio_url: p.audio_url || null,
        content: p.content || null,
        category: p.category || null,
        year: p.year || null,
        artist: p.artist || null,
        duration: p.duration || null,
        color_theme: p.color_theme || null,
        is_anonymous: Boolean(p.is_anonymous),
        status: p.status || "pending",
        created_at: p.created_at || new Date().toISOString()
      }));
      const { error } = await supabase.from("posts").upsert(cleanPosts);
      if (error) throw error;
    } else if (["pets", "friendships", "coparent_groups", "interactions", "friend_snaps"].includes(key)) {
      const { error } = await supabase.from(key).upsert(value);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("starry_state")
        .upsert({ key, value });
      if (error) {
        await supabase
          .from("starry_state")
          .update({ value })
          .eq("key", key);
      }
    }
  } catch (err) {
    console.warn(`Supabase write failed for key ${key}:`, err);
  }
}

// Initialize / Sync DB
export async function initializeDatabase() {
  if (!supabase) {
    // If local storage is empty, initialize with seed data
    for (const key of DB_KEYS) {
      if (!localStorage.getItem(`starry_local_${key}`)) {
        localStorage.setItem(`starry_local_${key}`, JSON.stringify((SEED_DATA as any)[key] || []));
      }
    }
    return;
  }

  try {
    // Run hourly passive reward catch-up
    const lastTriggerStr = await getDbKey("last_hourly_trigger");
    const lastTrigger = new Date(lastTriggerStr).getTime();
    const now = Date.now();
    const diffMs = now - lastTrigger;
    const oneHourMs = 60 * 60 * 1000;
    
    if (diffMs >= oneHourMs) {
      const elapsedHours = Math.floor(diffMs / oneHourMs);
      if (elapsedHours > 0) {
        const rewardAmount = elapsedHours * 20;
        const users = await getDbKey("users");
        users.forEach((u: any) => {
          u.star_coins = (u.star_coins || 0) + rewardAmount;
        });
        await setDbKey("users", users);
        await setDbKey("last_hourly_trigger", new Date(lastTrigger + elapsedHours * oneHourMs).toISOString());
        console.log(`[Hourly Catch-up] Distributed ${rewardAmount} coins to all users.`);
      }
    }
  } catch (err) {
    console.error("Database initialization / catch-up failed:", err);
  }
}

// Upload base64 asset to Supabase Storage
export async function uploadBase64ToStorage(base64: string): Promise<string> {
  if (!supabase) return base64;
  try {
    // If it's already a public URL or not a base64, return as is
    if (!base64.startsWith("data:")) return base64;

    const parts = base64.split(";base64,");
    if (parts.length !== 2) return base64;
    
    const contentType = parts[0].split(":")[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    const blob = new Blob([uInt8Array], { type: contentType });
    
    const ext = contentType.split("/")[1] || "png";
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    
    const { data, error } = await supabase.storage
      .from("starry_assets")
      .upload(filename, blob, {
        contentType,
        cacheControl: "3600",
        upsert: true
      });
      
    if (error) {
      console.warn("Supabase Storage upload failed, keeping base64 payload:", error);
      return base64;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from("starry_assets")
      .getPublicUrl(filename);
      
    return publicUrl;
  } catch (err) {
    console.warn("Supabase Storage upload process error, keeping base64:", err);
    return base64;
  }
}

// Mock Fetch Router implementation to route all API requests straight to Supabase state rows!
export async function handleSupabaseApiCall(url: string, init?: RequestInit): Promise<Response> {
  const urlObj = new URL(url, window.location.origin);
  const pathname = urlObj.pathname;
  const pathParts = pathname.replace(/^\/api\//, "").split("/");
  const method = init?.method || "GET";
  
  let body: any = null;
  if (init?.body) {
    if (typeof init.body === "string") {
      try {
        body = JSON.parse(init.body);
      } catch (e) {
        console.warn("handleSupabaseApiCall: Failed to parse request body as JSON:", e);
      }
    } else {
      body = init.body;
    }
  }

  // Simple Mock helper
  const jsonResponse = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" }
    });
  };

  try {
    const currentUserId = (() => {
      const saved = localStorage.getItem("starry_current_user");
      if (saved) {
        try { return JSON.parse(saved)?.id; } catch (e) {}
      }
      return null;
    })();

    // --- SOCIAL & COMMUNITY EXTENDED API ENDPOINTS ---

    // GET /api/posts/feed/latest OR /api/posts/feed/hot
    if (pathParts[0] === "posts" && pathParts[1] === "feed" && method === "GET") {
      const feedType = pathParts[2]; // latest or hot
      let allPosts = [];
      if (supabase) {
        const { data, error } = await supabase.from("posts").select("*").eq("status", "approved");
        if (!error && data) allPosts = data;
      } else {
        const pTypes = ["photos", "videos", "letters", "artworks", "music"];
        for (const pt of pTypes) {
          const list = await getDbKey(`posts_${pt}`);
          allPosts.push(...list.filter((x: any) => x.status === "approved"));
        }
      }

      // Enhance posts
      const enhanced = await Promise.all(allPosts.map(async (p: any) => {
        let likesCount = 0;
        let favsCount = 0;
        let commentsCount = 0;
        let liked_by_me = false;
        let favorited_by_me = false;

        if (supabase) {
          const [likesRes, favsRes, commentsRes] = await Promise.all([
            supabase.from("post_likes").select("id", { count: "exact" }).eq("post_id", p.id),
            supabase.from("favorites").select("id", { count: "exact" }).eq("post_id", p.id),
            supabase.from("comments").select("id", { count: "exact" }).eq("post_id", p.id)
          ]);
          likesCount = likesRes.count || 0;
          favsCount = favsRes.count || 0;
          commentsCount = commentsRes.count || 0;

          if (currentUserId) {
            const [myLike, myFav] = await Promise.all([
              supabase.from("post_likes").select("id").eq("post_id", p.id).eq("user_id", currentUserId).maybeSingle(),
              supabase.from("favorites").select("id").eq("post_id", p.id).eq("user_id", currentUserId).maybeSingle()
            ]);
            liked_by_me = !!myLike.data;
            favorited_by_me = !!myFav.data;
          }
        } else {
          const localLikes = JSON.parse(localStorage.getItem(`starry_local_likes_${p.id}`) || "[]");
          const localFavs = JSON.parse(localStorage.getItem(`starry_local_favs_${p.id}`) || "[]");
          const localComments = JSON.parse(localStorage.getItem(`starry_local_comments_${p.id}`) || "[]");
          likesCount = localLikes.length;
          favsCount = localFavs.length;
          commentsCount = localComments.length;
          if (currentUserId) {
            liked_by_me = localLikes.includes(currentUserId);
            favorited_by_me = localFavs.includes(currentUserId);
          }
        }

        return {
          ...p,
          likes_count: likesCount,
          favorites_count: favsCount,
          comments_count: commentsCount,
          liked_by_me,
          favorited_by_me
        };
      }));

      if (feedType === "hot") {
        enhanced.sort((a, b) => {
          const scoreA = (a.likes_count || 0) + (a.favorites_count || 0) * 2 + (a.comments_count || 0) * 3;
          const scoreB = (b.likes_count || 0) + (b.favorites_count || 0) * 2 + (b.comments_count || 0) * 3;
          return scoreB - scoreA;
        });
      } else {
        enhanced.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      return jsonResponse(enhanced);
    }

    // POST /api/social/like
    if (pathParts[0] === "social" && pathParts[1] === "like" && method === "POST") {
      const { postId } = body || {};
      if (!currentUserId || !postId) {
        return jsonResponse({ error: "Missing parameter or unauthorized" }, 401);
      }
      let liked = false;
      let count = 0;

      if (supabase) {
        const likeId = `like_${currentUserId}_${postId}`;
        const { data: existing } = await supabase.from("post_likes").select("id").eq("id", likeId).maybeSingle();
        if (existing) {
          await supabase.from("post_likes").delete().eq("id", likeId);
        } else {
          await supabase.from("post_likes").insert({ id: likeId, post_id: postId, user_id: currentUserId });
          liked = true;

          // Notify author
          const { data: post } = await supabase.from("posts").select("user_id, title").eq("id", postId).maybeSingle();
          if (post && post.user_id !== currentUserId) {
            await supabase.from("notifications").insert({
              id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              user_id: post.user_id,
              sender_id: currentUserId,
              type: "like",
              post_id: postId,
              content: `點讚了你的投稿「${post.title || "無標題"}」`
            });
          }
        }
        const { count: c } = await supabase.from("post_likes").select("id", { count: "exact" }).eq("post_id", postId);
        count = c || 0;
      } else {
        const localLikes = JSON.parse(localStorage.getItem(`starry_local_likes_${postId}`) || "[]");
        const idx = localLikes.indexOf(currentUserId);
        if (idx !== -1) {
          localLikes.splice(idx, 1);
        } else {
          localLikes.push(currentUserId);
          liked = true;

          // Trigger local notification for like
          try {
            let postAuthorId = "";
            let postTitle = "無標題";
            let postType = "unknown";
            const pTypes = ["photos", "videos", "letters", "artworks", "music"];
            for (const pt of pTypes) {
              const list = await getDbKey(`posts_${pt}`);
              const found = list.find((x: any) => x.id === postId);
              if (found) {
                postAuthorId = found.user_id;
                postTitle = found.title || "無標題";
                postType = pt;
                break;
              }
            }
            if (postAuthorId && postAuthorId !== currentUserId) {
              const users = await getDbKey("users");
              const senderUser = users.find((u: any) => u.id === currentUserId);
              const newNotif = {
                id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                user_id: postAuthorId,
                sender_id: currentUserId,
                sender_name: senderUser?.username || "未知用戶",
                sender_avatar: senderUser?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Unknown",
                type: "like",
                post_id: postId,
                post_title: postTitle,
                post_type: postType,
                content: `點讚了你的投稿「${postTitle}」`,
                is_read: false,
                created_at: new Date().toISOString()
              };
              const localNotifs = JSON.parse(localStorage.getItem("starry_local_notifications") || "[]");
              localNotifs.unshift(newNotif);
              localStorage.setItem("starry_local_notifications", JSON.stringify(localNotifs));
            }
          } catch (err) {
            console.error("Local notification for like failed:", err);
          }
        }
        localStorage.setItem(`starry_local_likes_${postId}`, JSON.stringify(localLikes));
        count = localLikes.length;
      }

      return jsonResponse({ success: true, liked, likes_count: count });
    }

    // POST /api/social/favorite
    if (pathParts[0] === "social" && pathParts[1] === "favorite" && method === "POST") {
      const { postId } = body || {};
      if (!currentUserId || !postId) {
        return jsonResponse({ error: "Missing parameter or unauthorized" }, 401);
      }
      let favorited = false;
      let count = 0;

      if (supabase) {
        const favId = `fav_${currentUserId}_${postId}`;
        const { data: existing } = await supabase.from("favorites").select("id").eq("id", favId).maybeSingle();
        if (existing) {
          await supabase.from("favorites").delete().eq("id", favId);
        } else {
          await supabase.from("favorites").insert({ id: favId, post_id: postId, user_id: currentUserId });
          favorited = true;

          // Notify author
          const { data: post } = await supabase.from("posts").select("user_id, title").eq("id", postId).maybeSingle();
          if (post && post.user_id !== currentUserId) {
            await supabase.from("notifications").insert({
              id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              user_id: post.user_id,
              sender_id: currentUserId,
              type: "favorite",
              post_id: postId,
              content: `收藏了你的投稿「${post.title || "無標題"}」`
            });
          }
        }
        const { count: c } = await supabase.from("favorites").select("id", { count: "exact" }).eq("post_id", postId);
        count = c || 0;
      } else {
        const localFavs = JSON.parse(localStorage.getItem(`starry_local_favs_${postId}`) || "[]");
        const idx = localFavs.indexOf(currentUserId);
        if (idx !== -1) {
          localFavs.splice(idx, 1);
        } else {
          localFavs.push(currentUserId);
          favorited = true;

          // Trigger local notification for favorite
          try {
            let postAuthorId = "";
            let postTitle = "無標題";
            let postType = "unknown";
            const pTypes = ["photos", "videos", "letters", "artworks", "music"];
            for (const pt of pTypes) {
              const list = await getDbKey(`posts_${pt}`);
              const found = list.find((x: any) => x.id === postId);
              if (found) {
                postAuthorId = found.user_id;
                postTitle = found.title || "無標題";
                postType = pt;
                break;
              }
            }
            if (postAuthorId && postAuthorId !== currentUserId) {
              const users = await getDbKey("users");
              const senderUser = users.find((u: any) => u.id === currentUserId);
              const newNotif = {
                id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                user_id: postAuthorId,
                sender_id: currentUserId,
                sender_name: senderUser?.username || "未知用戶",
                sender_avatar: senderUser?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Unknown",
                type: "favorite",
                post_id: postId,
                post_title: postTitle,
                post_type: postType,
                content: `收藏了你的投稿「${postTitle}」`,
                is_read: false,
                created_at: new Date().toISOString()
              };
              const localNotifs = JSON.parse(localStorage.getItem("starry_local_notifications") || "[]");
              localNotifs.unshift(newNotif);
              localStorage.setItem("starry_local_notifications", JSON.stringify(localNotifs));
            }
          } catch (err) {
            console.error("Local notification for favorite failed:", err);
          }
        }
        localStorage.setItem(`starry_local_favs_${postId}`, JSON.stringify(localFavs));
        count = localFavs.length;
      }

      return jsonResponse({ success: true, favorited, favorites_count: count });
    }

    // GET /api/social/comments/:postId
    if (pathParts[0] === "social" && pathParts[1] === "comments" && method === "GET") {
      const postId = pathParts[2];
      if (supabase) {
        const { data: comments, error } = await supabase
          .from("comments")
          .select("*, profiles(username, avatar)")
          .eq("post_id", postId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        const mapped = (comments || []).map((c: any) => ({
          id: c.id,
          post_id: c.post_id,
          user_id: c.user_id,
          content: c.content,
          created_at: c.created_at,
          username: c.profiles?.username || "未知用戶",
          avatar: c.profiles?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Unknown"
        }));
        return jsonResponse(mapped);
      } else {
        const localComments = JSON.parse(localStorage.getItem(`starry_local_comments_${postId}`) || "[]");
        return jsonResponse(localComments);
      }
    }

    // POST /api/social/comment
    if (pathParts[0] === "social" && pathParts[1] === "comment" && method === "POST") {
      const { postId, content } = body || {};
      if (!currentUserId || !postId || !content) {
        return jsonResponse({ error: "Missing parameters or unauthorized" }, 400);
      }

      if (supabase) {
        const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const { error } = await supabase.from("comments").insert({
          id: commentId,
          post_id: postId,
          user_id: currentUserId,
          content: content
        });
        if (error) throw error;

        // Notify author
        const { data: post } = await supabase.from("posts").select("user_id, title").eq("id", postId).maybeSingle();
        if (post && post.user_id !== currentUserId) {
          await supabase.from("notifications").insert({
            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            user_id: post.user_id,
            sender_id: currentUserId,
            type: "comment",
            post_id: postId,
            content: `在你的投稿「${post.title || "無標題"}」留下了留言：「${content}」`
          });
        }

        // Fetch the newly created comment with profile
        const { data: newComment } = await supabase
          .from("comments")
          .select("*, profiles(username, avatar)")
          .eq("id", commentId)
          .single();

        return jsonResponse({
          success: true,
          comment: {
            id: newComment.id,
            post_id: newComment.post_id,
            user_id: newComment.user_id,
            content: newComment.content,
            created_at: newComment.created_at,
            username: newComment.profiles?.username || "未知用戶",
            avatar: newComment.profiles?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Unknown"
          }
        });
      } else {
        const localComments = JSON.parse(localStorage.getItem(`starry_local_comments_${postId}`) || "[]");
        const users = await getDbKey("users");
        const currentUser = users.find((u: any) => u.id === currentUserId);
        const newC = {
          id: `comment_${Date.now()}`,
          post_id: postId,
          user_id: currentUserId,
          username: currentUser?.username || "Guest",
          avatar: currentUser?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Guest",
          content,
          created_at: new Date().toISOString()
        };
        localComments.push(newC);
        localStorage.setItem(`starry_local_comments_${postId}`, JSON.stringify(localComments));

        // Trigger local notification for comment
        try {
          let postAuthorId = "";
          let postTitle = "無標題";
          let postType = "unknown";
          const pTypes = ["photos", "videos", "letters", "artworks", "music"];
          for (const pt of pTypes) {
            const list = await getDbKey(`posts_${pt}`);
            const found = list.find((x: any) => x.id === postId);
            if (found) {
              postAuthorId = found.user_id;
              postTitle = found.title || "無標題";
              postType = pt;
              break;
            }
          }
          if (postAuthorId && postAuthorId !== currentUserId) {
            const senderUser = users.find((u: any) => u.id === currentUserId);
            const newNotif = {
              id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              user_id: postAuthorId,
              sender_id: currentUserId,
              sender_name: senderUser?.username || "未知用戶",
              sender_avatar: senderUser?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Unknown",
              type: "comment",
              post_id: postId,
              post_title: postTitle,
              post_type: postType,
              content: `在你的投稿「${postTitle}」留下了留言：「${content}」`,
              is_read: false,
              created_at: new Date().toISOString()
            };
            const localNotifs = JSON.parse(localStorage.getItem("starry_local_notifications") || "[]");
            localNotifs.unshift(newNotif);
            localStorage.setItem("starry_local_notifications", JSON.stringify(localNotifs));
          }
        } catch (err) {
          console.error("Local notification for comment failed:", err);
        }

        return jsonResponse({ success: true, comment: newC });
      }
    }

    // DELETE /api/social/comment/:commentId
    if (pathParts[0] === "social" && pathParts[1] === "comment" && method === "DELETE") {
      const commentId = pathParts[2];
      if (!currentUserId || !commentId) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }

      if (supabase) {
        const { data: comment } = await supabase.from("comments").select("user_id").eq("id", commentId).maybeSingle();
        const { data: userProfile } = await supabase.from("profiles").select("role").eq("id", currentUserId).maybeSingle();
        const isAdmin = userProfile?.role === "admin";

        if (comment && (comment.user_id === currentUserId || isAdmin)) {
          const { error } = await supabase.from("comments").delete().eq("id", commentId);
          if (error) throw error;
          return jsonResponse({ success: true });
        } else {
          return jsonResponse({ error: "Forbidden" }, 403);
        }
      } else {
        return jsonResponse({ success: true });
      }
    }

    // GET /api/social/notifications/:userId
    if (pathParts[0] === "social" && pathParts[1] === "notifications" && method === "GET") {
      const userId = pathParts[2];
      if (supabase) {
        const { data: notifications, error } = await supabase
          .from("notifications")
          .select("*, profiles!notifications_sender_id_fkey(username, avatar), posts(title, type)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;

        const mapped = (notifications || []).map((n: any) => ({
          id: n.id,
          user_id: n.user_id,
          sender_id: n.sender_id,
          sender_name: n.profiles?.username || "未知用戶",
          sender_avatar: n.profiles?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Unknown",
          type: n.type,
          post_id: n.post_id,
          post_title: n.posts?.title || "無標題",
          post_type: n.posts?.type || "unknown",
          content: n.content,
          is_read: n.is_read,
          created_at: n.created_at
        }));
        return jsonResponse(mapped);
      } else {
        const localNotifs = JSON.parse(localStorage.getItem("starry_local_notifications") || "[]");
        const filtered = localNotifs.filter((n: any) => n.user_id === userId);
        return jsonResponse(filtered);
      }
    }

    // POST /api/social/notifications/read
    if (pathParts[0] === "social" && pathParts[1] === "notifications" && pathParts[2] === "read" && method === "POST") {
      const { userId } = body || {};
      if (supabase) {
        const { error } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("user_id", userId);
        if (error) throw error;
        return jsonResponse({ success: true });
      } else {
        const localNotifs = JSON.parse(localStorage.getItem("starry_local_notifications") || "[]");
        const updated = localNotifs.map((n: any) => {
          if (n.user_id === userId) {
            return { ...n, is_read: true };
          }
          return n;
        });
        localStorage.setItem("starry_local_notifications", JSON.stringify(updated));
        return jsonResponse({ success: true });
      }
    }

    // GET /api/social/favorites/:userId
    if (pathParts[0] === "social" && pathParts[1] === "favorites" && method === "GET") {
      const userId = pathParts[2];
      if (supabase) {
        const { data: favs, error } = await supabase
          .from("favorites")
          .select("*, posts(*)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;

        const posts = (favs || []).map((f: any) => f.posts).filter(Boolean);

        const enhancedPosts = await Promise.all(posts.map(async (p: any) => {
          const [likesRes, favsRes, commentsRes] = await Promise.all([
            supabase.from("post_likes").select("id", { count: "exact" }).eq("post_id", p.id),
            supabase.from("favorites").select("id", { count: "exact" }).eq("post_id", p.id),
            supabase.from("comments").select("id", { count: "exact" }).eq("post_id", p.id)
          ]);

          let liked_by_me = false;
          let favorited_by_me = false;
          if (currentUserId) {
            const [myLike, myFav] = await Promise.all([
              supabase.from("post_likes").select("id").eq("post_id", p.id).eq("user_id", currentUserId).maybeSingle(),
              supabase.from("favorites").select("id").eq("post_id", p.id).eq("user_id", currentUserId).maybeSingle()
            ]);
            liked_by_me = !!myLike.data;
            favorited_by_me = !!myFav.data;
          }

          return {
            ...p,
            likes_count: likesRes.count || 0,
            favorites_count: favsRes.count || 0,
            comments_count: commentsRes.count || 0,
            liked_by_me,
            favorited_by_me
          };
        }));

        return jsonResponse(enhancedPosts);
      } else {
        return jsonResponse([]);
      }
    }

    // GET /api/social/profile-stats/:userId
    if (pathParts[0] === "social" && pathParts[1] === "profile-stats" && method === "GET") {
      const userId = pathParts[2];
      if (supabase) {
        const { count: postsCount } = await supabase
          .from("posts")
          .select("id", { count: "exact" })
          .eq("user_id", userId)
          .eq("status", "approved");

        const { data: userPosts } = await supabase
          .from("posts")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "approved");

        let totalLikes = 0;
        let totalFavs = 0;

        if (userPosts && userPosts.length > 0) {
          const postIds = userPosts.map((p: any) => p.id);
          const [likesRes, favsRes] = await Promise.all([
            supabase.from("post_likes").select("id", { count: "exact" }).in("post_id", postIds),
            supabase.from("favorites").select("id", { count: "exact" }).in("post_id", postIds)
          ]);
          totalLikes = likesRes.count || 0;
          totalFavs = favsRes.count || 0;
        }

        return jsonResponse({
          posts_count: postsCount || 0,
          likes_received_count: totalLikes,
          favorites_received_count: totalFavs
        });
      } else {
        return jsonResponse({
          posts_count: 0,
          likes_received_count: 0,
          favorites_received_count: 0
        });
      }
    }

    // 1. GET /api/db
    if (pathParts[0] === "db" && method === "GET") {
      const allData: any = {};
      for (const key of DB_KEYS) {
        allData[key] = await getDbKey(key);
      }
      return jsonResponse(allData);
    }

    // 2. POST /api/dev/trigger-hourly-coins
    if (pathParts[0] === "dev" && pathParts[1] === "trigger-hourly-coins" && method === "POST") {
      const users = await getDbKey("users");
      users.forEach((u: any) => {
        u.star_coins = (u.star_coins || 0) + 20;
      });
      await setDbKey("users", users);
      await setDbKey("last_hourly_trigger", new Date().toISOString());
      return jsonResponse({
        success: true,
        message: "🌟 成功手動模擬觸發每小時星星幣收益！所有使用者已獲得 +20 星星幣！",
        users: users.map((u: any) => ({ id: u.id, username: u.username, star_coins: u.star_coins }))
      });
    }

    // 3. POST /api/auth/login
    if (pathParts[0] === "auth" && pathParts[1] === "login" && method === "POST") {
      const { email, password } = body || {};
      if (!email || !password) {
        return jsonResponse({ error: "請填寫信箱/帳號與密碼！" }, 400);
      }
      const users = await getDbKey("users");
      const query = email.trim().toLowerCase();
      const user = users.find((u: any) => 
        (u.email.trim().toLowerCase() === query || u.username.trim().toLowerCase() === query) && 
        u.password === password
      );
      if (!user) {
        return jsonResponse({ error: "帳號、信箱或密碼錯誤，請確認後再試！" }, 410);
      }
      const { password: _, ...userWithoutPassword } = user;
      return jsonResponse({ user: userWithoutPassword });
    }

    // 4. POST /api/auth/register
    if (pathParts[0] === "auth" && pathParts[1] === "register" && method === "POST") {
      const { username, email, password } = body || {};
      if (!username || !email || !password) {
        return jsonResponse({ error: "所有欄位皆為必填！" }, 400);
      }
      const cleanUsername = String(username).trim();
      const cleanEmail = String(email).trim().toLowerCase();
      const cleanPassword = String(password).trim();

      if (cleanUsername.length < 2) {
        return jsonResponse({ error: "用戶名稱長度至少需要 2 個字元！" }, 400);
      }
      if (cleanPassword.length < 6) {
        return jsonResponse({ error: "安全密碼長度至少需要 6 個字元！" }, 400);
      }

      const users = await getDbKey("users");
      if (users.some((u: any) => u.email.trim().toLowerCase() === cleanEmail)) {
        return jsonResponse({ error: "此電子信箱已被註冊使用！" }, 400);
      }
      if (users.some((u: any) => u.username.trim().toLowerCase() === cleanUsername.toLowerCase())) {
        return jsonResponse({ error: "此用戶暱稱已被使用！" }, 400);
      }

      const isFirstAdmin = cleanEmail === "admin@starry.com" || cleanEmail === "celia970105@gmail.com";
      const newUser = {
        id: `user_${Date.now()}`,
        username: cleanUsername,
        email: cleanEmail,
        password: cleanPassword,
        role: isFirstAdmin ? "admin" : "user",
        avatar: `https://api.dicebear.com/7.x/lorelei/svg?seed=${cleanUsername}&backgroundColor=ffdeeb`,
        background: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=1200",
        star_coins: 100
      };

      users.push(newUser);
      await setDbKey("users", users);

      if (!isFirstAdmin) {
        const pets = await getDbKey("pets");
        const starterPet = {
          id: `pet_${Date.now()}`,
          name: `${username}'s Pet`,
          owner_id: newUser.id,
          owner_name: username,
          xp: 0,
          level: 1,
          type: "Star Bunny",
          color: "Pink",
          custom_appearance: { accessory: "None", vibe: "Cute" },
          home_json: { decor: "Stardust", bed: "Cloud Bed" },
          created_at: new Date().toISOString()
        };
        pets.push(starterPet);
        await setDbKey("pets", pets);
      }

      const { password: _, ...userWithoutPassword } = newUser;
      return jsonResponse({ user: userWithoutPassword });
    }

    // 5. POST /api/users/upgrade
    if (pathParts[0] === "users" && pathParts[1] === "upgrade" && method === "POST") {
      const { userId, email, password, username } = body || {};
      if (!userId || !email || !password) {
        return jsonResponse({ error: "所有欄位皆為必填！" }, 400);
      }
      const users = await getDbKey("users");
      const userIdx = users.findIndex((u: any) => u.id === userId);
      if (userIdx === -1) {
        return jsonResponse({ error: "找不到該訪客用戶！" }, 404);
      }
      if (users.some((u: any) => u.id !== userId && u.email === email)) {
        return jsonResponse({ error: "此 Email 已被其他帳號註冊！" }, 400);
      }

      const user = users[userIdx];
      user.email = email;
      user.password = password;
      if (username) {
        user.username = username;
        const pets = await getDbKey("pets");
        pets.forEach((p: any) => {
          if (p.owner_id === userId) {
            p.owner_name = username;
          }
        });
        await setDbKey("pets", pets);
      }
      user.is_guest = false;

      await setDbKey("users", users);
      const { password: _, ...userWithoutPassword } = user;
      return jsonResponse({ success: true, user: userWithoutPassword });
    }

    // 6. POST /api/users/save-solo-pet
    if (pathParts[0] === "users" && pathParts[1] === "save-solo-pet" && method === "POST") {
      const { userId, solo_pet } = body || {};
      if (!userId || !solo_pet) {
        return jsonResponse({ error: "Missing required parameters" }, 400);
      }
      const users = await getDbKey("users");
      const userIdx = users.findIndex((u: any) => u.id === userId);
      if (userIdx === -1) {
        return jsonResponse({ error: "User not found" }, 404);
      }
      users[userIdx].solo_pet = solo_pet;
      await setDbKey("users", users);
      return jsonResponse({ success: true });
    }

    // 7. POST /api/users/update
    if (pathParts[0] === "users" && pathParts[1] === "update" && method === "POST") {
      const { userId, username, avatar, background, bio } = body || {};
      const users = await getDbKey("users");
      const userIdx = users.findIndex((u: any) => u.id === userId);
      if (userIdx === -1) {
        return jsonResponse({ error: "User not found" }, 404);
      }

      if (username) {
        const isTaken = users.some((u: any) => u.id !== userId && u.username.toLowerCase() === username.toLowerCase());
        if (isTaken) {
          return jsonResponse({ error: "Username already taken" }, 400);
        }
        users[userIdx].username = username;
      }
      if (avatar) {
        users[userIdx].avatar = await uploadBase64ToStorage(avatar);
      }
      if (background) {
        users[userIdx].background = await uploadBase64ToStorage(background);
      }
      if (bio !== undefined) {
        users[userIdx].bio = bio;
      }

      await setDbKey("users", users);
      const { password: _, ...userWithoutPassword } = users[userIdx];
      return jsonResponse({ user: userWithoutPassword });
    }

    // 8. POST /api/users/sync-backup
    if (pathParts[0] === "users" && pathParts[1] === "sync-backup" && method === "POST") {
      const { username, email, password, avatar, background, star_coins, solo_pet, friends } = body || {};
      if (!email || !password || !username) {
        return jsonResponse({ error: "Missing required backup details" }, 400);
      }

      const users = await getDbKey("users");
      const cleanEmail = email.trim().toLowerCase();
      let user = users.find((u: any) => u.email.trim().toLowerCase() === cleanEmail);
      let isNew = false;

      if (!user) {
        isNew = true;
        user = {
          id: `user_${Date.now()}`,
          username: username.trim(),
          email: cleanEmail,
          password: password,
          role: "user",
          avatar: avatar || `https://api.dicebear.com/7.x/lorelei/svg?seed=${username}&backgroundColor=ffdeeb`,
          background: background || "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=1200",
          star_coins: star_coins !== undefined ? star_coins : 100,
          solo_pet: solo_pet || null
        };
        users.push(user);
        await setDbKey("users", users);

        if (!solo_pet) {
          const pets = await getDbKey("pets");
          const starterPet = {
            id: `pet_${Date.now()}`,
            name: `${username}'s Pet`,
            owner_id: user.id,
            owner_name: username,
            xp: 0,
            level: 1,
            type: "Star Bunny",
            color: "Pink",
            custom_appearance: { accessory: "None", vibe: "Cute" },
            home_json: { decor: "Stardust", bed: "Cloud Bed" },
            created_at: new Date().toISOString()
          };
          pets.push(starterPet);
          await setDbKey("pets", pets);
        }
      } else {
        if (user.password !== password) {
          return jsonResponse({ error: "Password mismatch" }, 401);
        }
        if (star_coins !== undefined && star_coins > (user.star_coins || 0)) {
          user.star_coins = star_coins;
        }
        if (solo_pet) user.solo_pet = solo_pet;
        if (avatar) user.avatar = avatar;
        if (background) user.background = background;
        await setDbKey("users", users);
      }

      // Add friends backups if available
      if (Array.isArray(friends) && friends.length > 0) {
        const friendships = await getDbKey("friendships");
        for (const friendObj of friends) {
          if (!friendObj || (!friendObj.email && !friendObj.username)) continue;
          const fQuery = (friendObj.email || friendObj.username).toLowerCase().trim();
          const targetFriend = users.find((u: any) => 
            u.email.trim().toLowerCase() === fQuery || 
            u.username.trim().toLowerCase() === fQuery
          );
          if (targetFriend) {
            const exists = friendships.some(
              (f: any) => (f.userId1 === user.id && f.userId2 === targetFriend.id) ||
                          (f.userId1 === targetFriend.id && f.userId2 === user.id)
            );
            if (!exists) {
              friendships.push({ userId1: user.id, userId2: targetFriend.id });
            }
          }
        }
        await setDbKey("friendships", friendships);
      }

      const { password: _, ...userWithoutPassword } = user;
      return jsonResponse({ success: true, isNew, user: userWithoutPassword });
    }

    // 9. GET /api/users/profile/:userId
    if (pathParts[0] === "users" && pathParts[1] === "profile" && method === "GET") {
      const userId = pathParts[2];
      const users = await getDbKey("users");
      const user = users.find((u: any) => u.id === userId);
      if (!user) {
        return jsonResponse({ error: "User not found" }, 404);
      }
      if (user.email?.trim().toLowerCase() === "celia970105@gmail.com") {
        if (user.role !== "admin") {
          user.role = "admin";
          await setDbKey("users", users);
        }
      }
      const { password: _, ...userWithoutPassword } = user;
      return jsonResponse({ user: userWithoutPassword });
    }

    // 10. GET /api/posts/:type
    if (pathParts[0] === "posts" && method === "GET") {
      const type = pathParts[1];
      const collection = await getDbKey(`posts_${type}`);
      const approvedItems = collection.filter((item: any) => item.status === "approved");
      return jsonResponse(approvedItems);
    }

    // 11. POST /api/posts/:type
    if (pathParts[0] === "posts" && method === "POST") {
      const type = pathParts[1];
      const { payload } = body || {};
      if (!payload) {
        return jsonResponse({ error: "Payload is required" }, 400);
      }
      
      const userId = payload.user_id || "anonymous";
      let earnedCoins = 0;
      let coinMessage = "";
      
      if (userId !== "anonymous") {
        const todayStr = new Date().toISOString().split('T')[0];
        const users = await getDbKey("users");
        const uIdx = users.findIndex((u: any) => u.id === userId);
        if (uIdx !== -1) {
          if (!users[uIdx].daily_post_coins) {
            users[uIdx].daily_post_coins = {};
          }
          const currentCount = users[uIdx].daily_post_coins[todayStr] || 0;
          if (currentCount < 3) {
            earnedCoins = 50; // 每次投稿給 50 星星幣
            users[uIdx].star_coins = (users[uIdx].star_coins || 0) + earnedCoins;
            if (users[uIdx].solo_pet) {
              users[uIdx].solo_pet.coins = (users[uIdx].solo_pet.coins || 0) + earnedCoins;
            }
            users[uIdx].daily_post_coins[todayStr] = currentCount + 1;
            await setDbKey("users", users);
            coinMessage = `🎉 投稿成功！獲得星星幣 +${earnedCoins} 🪙 (今日已獲幣投稿 ${currentCount + 1}/3 次)。`;
          } else {
            coinMessage = `✨ 投稿成功！今日投稿獲取星星幣已達上限 (3/3)，你對 Jiyu 的愛意已深深載入星宿！💖`;
          }
        }
      }

      const isUserAdmin = payload.role === "admin" || (payload.email && payload.email === "celia970105@gmail.com");
      const newPostId = `${type.substring(0, 1)}_${Date.now()}`;
      const basePost = {
        id: newPostId,
        user_id: payload.user_id || "anonymous",
        username: payload.username || "Anonymous",
        status: isUserAdmin ? "approved" : "pending",
        created_at: new Date().toISOString()
      };

      const collection = await getDbKey(`posts_${type}`);

      if (type === "photos") {
        const imgUrl = await uploadBase64ToStorage(payload.image_url);
        const post = {
          ...basePost,
          title: payload.title || "Untitled Photo",
          image_url: imgUrl,
          year: payload.year || String(new Date().getFullYear()),
          category: payload.category || "General"
        };
        collection.push(post);
        await setDbKey(`posts_${type}`, collection);
        return jsonResponse({ success: true, post, earnedCoins, coinMessage });
      }

      if (type === "videos") {
        const post = {
          ...basePost,
          title: payload.title || "Untitled Video",
          video_url: payload.video_url,
          category: payload.category || "General"
        };
        collection.push(post);
        await setDbKey(`posts_${type}`, collection);
        return jsonResponse({ success: true, post, earnedCoins, coinMessage });
      }

      if (type === "letters") {
        const post = {
          ...basePost,
          author_name: payload.is_anonymous ? "Anonymous Star" : (payload.author_name || payload.username || "Stardust"),
          content: payload.content || "",
          is_anonymous: Boolean(payload.is_anonymous),
          color_theme: payload.color_theme || "pink"
        };
        collection.push(post);
        await setDbKey(`posts_${type}`, collection);
        return jsonResponse({ success: true, post, earnedCoins, coinMessage });
      }

      if (type === "artworks") {
        const imgUrl = await uploadBase64ToStorage(payload.image_url);
        const post = {
          ...basePost,
          title: payload.title || "Untitled Artwork",
          image_url: imgUrl,
          external_link: payload.external_link || "",
          description: payload.description || ""
        };
        collection.push(post);
        await setDbKey(`posts_${type}`, collection);
        return jsonResponse({ success: true, post, earnedCoins, coinMessage });
      }

      if (type === "music") {
        const title = (payload.title || "").trim();
        if (!title) {
          return jsonResponse({ error: "請填寫音樂名稱！" }, 400);
        }
        if (collection.some((m: any) => m.status !== "rejected" && m.title.trim().toLowerCase() === title.toLowerCase())) {
          return jsonResponse({ error: "此音樂名稱已存在，請使用其他名稱！" }, 400);
        }
        const audioUrl = (payload.audio_url || "").trim();
        const isBili = audioUrl.toLowerCase().includes("bilibili.com") || audioUrl.toLowerCase().includes("b23.tv");
        const isQQ = audioUrl.toLowerCase().includes("qq.com");
        if (!isBili && !isQQ) {
          return jsonResponse({ error: "音樂網址格式錯誤！應援投稿僅限使用 QQ音樂 或 bilibili 網址。" }, 400);
        }
        const coverUrl = await uploadBase64ToStorage(payload.cover_url);
        const post = {
          ...basePost,
          title,
          artist: payload.artist || "Unknown Artist",
          audio_url: audioUrl,
          cover_url: coverUrl,
          duration: payload.duration || "3:30"
        };
        collection.push(post);
        await setDbKey(`posts_${type}`, collection);
        return jsonResponse({ success: true, post, earnedCoins, coinMessage });
      }
    }

    // 12. GET /api/admin/pending
    if (pathParts[0] === "admin" && pathParts[1] === "pending" && method === "GET") {
      const photos = await getDbKey("posts_photos");
      const videos = await getDbKey("posts_videos");
      const letters = await getDbKey("posts_letters");
      const artworks = await getDbKey("posts_artworks");
      const music = await getDbKey("posts_music");

      const pending = {
        photos: photos.filter((p: any) => p.status === "pending"),
        videos: videos.filter((v: any) => v.status === "pending"),
        letters: letters.filter((l: any) => l.status === "pending"),
        artworks: artworks.filter((a: any) => a.status === "pending"),
        music: music.filter((m: any) => m.status === "pending")
      };
      return jsonResponse(pending);
    }

    // 13. GET /api/admin/all
    if (pathParts[0] === "admin" && pathParts[1] === "all" && method === "GET") {
      const photos = await getDbKey("posts_photos");
      const videos = await getDbKey("posts_videos");
      const letters = await getDbKey("posts_letters");
      const artworks = await getDbKey("posts_artworks");
      const music = await getDbKey("posts_music");
      const users = await getDbKey("users");
      const pets = await getDbKey("pets");

      return jsonResponse({
        photos,
        videos,
        letters,
        artworks,
        music,
        users: users.map((u: any) => ({ id: u.id, username: u.username, email: u.email, role: u.role, avatar: u.avatar })),
        pets
      });
    }

    // 14. POST /api/admin/action
    if (pathParts[0] === "admin" && pathParts[1] === "action" && method === "POST") {
      const { type, id, action } = body || {};
      let key = "";
      if (type === "photos" || type === "photo") key = "posts_photos";
      else if (type === "videos" || type === "video") key = "posts_videos";
      else if (type === "letters" || type === "letter") key = "posts_letters";
      else if (type === "artworks" || type === "artwork") key = "posts_artworks";
      else if (type === "music") key = "posts_music";
      else if (type === "users" || type === "user") key = "users";
      else if (type === "pets" || type === "pet") key = "pets";

      if (!key) {
        return jsonResponse({ error: "Invalid item type" }, 400);
      }

      const collection = await getDbKey(key);
      const idx = collection.findIndex((item: any) => item.id === id);
      if (idx === -1) {
        return jsonResponse({ error: "Item not found" }, 404);
      }

      if (action === "approve") {
        const prevStatus = collection[idx].status;
        collection[idx].status = "approved";
        if (prevStatus !== "approved") {
          const postUserId = collection[idx].user_id;
          if (postUserId && postUserId !== "anonymous") {
            const users = await getDbKey("users");
            const uIdx = users.findIndex((u: any) => u.id === postUserId);
            if (uIdx !== -1) {
              users[uIdx].star_coins = (users[uIdx].star_coins || 0) + 50;
              await setDbKey("users", users);
            }
          }
        }
      } else if (action === "reject") {
        collection[idx].status = "rejected";
      } else if (action === "delete") {
        collection.splice(idx, 1);
      } else {
        return jsonResponse({ error: "Invalid action" }, 400);
      }

      await setDbKey(key, collection);
      return jsonResponse({ success: true, message: `Successfully executed ${action} on ${type}` });
    }

    // 15. DELETE /api/admin/delete-item
    if (pathParts[0] === "admin" && pathParts[1] === "delete-item" && method === "DELETE") {
      const { type, id } = body || {};
      let key = "";
      if (type === "photos" || type === "photo") key = "posts_photos";
      else if (type === "videos" || type === "video") key = "posts_videos";
      else if (type === "letters" || type === "letter") key = "posts_letters";
      else if (type === "artworks" || type === "artwork") key = "posts_artworks";
      else if (type === "music") key = "posts_music";
      else if (type === "users" || type === "user") key = "users";
      else if (type === "pets" || type === "pet") key = "pets";

      if (!key) {
        return jsonResponse({ error: "Invalid item type" }, 400);
      }

      const collection = await getDbKey(key);
      const idx = collection.findIndex((item: any) => item.id === id);
      if (idx === -1) {
        return jsonResponse({ error: "Item not found" }, 404);
      }

      collection.splice(idx, 1);
      await setDbKey(key, collection);
      return jsonResponse({ success: true, message: `Successfully deleted ${type} with ID ${id}` });
    }

    // 16. GET /api/pets
    if (pathParts[0] === "pets" && method === "GET") {
      const pets = await getDbKey("pets");
      return jsonResponse(pets);
    }

    // 17. POST /api/pets/interact
    if (pathParts[0] === "pets" && pathParts[1] === "interact" && method === "POST") {
      const { petId, action } = body || {};
      const pets = await getDbKey("pets");
      const idx = pets.findIndex((p: any) => p.id === petId);
      if (idx === -1) {
        return jsonResponse({ error: "Pet not found" }, 404);
      }

      let xpGained = 10;
      if (action === "feed") xpGained = 15;
      else if (action === "play") xpGained = 20;
      else if (action === "train") xpGained = 30;

      const pet = pets[idx];
      pet.xp += xpGained;
      const xpNeeded = pet.level * 100;
      let leveledUp = false;
      if (pet.xp >= xpNeeded) {
        pet.xp -= xpNeeded;
        pet.level += 1;
        leveledUp = true;
      }

      await setDbKey("pets", pets);
      return jsonResponse({ success: true, pet, xpGained, leveledUp });
    }

    // 18. GET /api/users/list
    if (pathParts[0] === "users" && pathParts[1] === "list" && method === "GET") {
      const users = await getDbKey("users");
      const list = users.map((u: any) => ({
        id: u.id,
        username: u.username,
        avatar: u.avatar,
        email: u.email
      }));
      return jsonResponse(list);
    }

    // 19. POST /api/friends/add
    if (pathParts[0] === "friends" && pathParts[1] === "add" && method === "POST") {
      const { userId, targetUsernameOrEmail } = body || {};
      if (!userId || !targetUsernameOrEmail) {
        return jsonResponse({ error: "缺少參數" }, 400);
      }
      const users = await getDbKey("users");
      const query = targetUsernameOrEmail.toLowerCase().trim();
      let targetUser = users.find((u: any) => 
        u.username.trim().toLowerCase() === query || 
        u.email.trim().toLowerCase() === query ||
        u.id.trim().toLowerCase() === query
      );

      if (!targetUser) {
        targetUser = users.find((u: any) => 
          u.username.toLowerCase().includes(query) || 
          u.email.toLowerCase().includes(query)
        );
      }

      if (!targetUser) {
        return jsonResponse({ error: "找不到該用戶，請檢查輸入的用戶名或 Email" }, 404);
      }
      if (targetUser.id === userId) {
        return jsonResponse({ error: "不能加自己為好友喔！" }, 400);
      }

      const friendships = await getDbKey("friendships");
      const alreadyFriends = friendships.some(
        (f: any) => (f.userId1 === userId && f.userId2 === targetUser.id) ||
                    (f.userId1 === targetUser.id && f.userId2 === userId)
      );

      if (alreadyFriends) {
        return jsonResponse({ error: "你們已經是好友囉！" }, 400);
      }

      friendships.push({ userId1: userId, userId2: targetUser.id });
      await setDbKey("friendships", friendships);

      // Reward
      const u1Idx = users.findIndex((u: any) => u.id === userId);
      const u2Idx = users.findIndex((u: any) => u.id === targetUser.id);
      if (u1Idx !== -1) users[u1Idx].star_coins = (users[u1Idx].star_coins || 0) + 30;
      if (u2Idx !== -1) users[u2Idx].star_coins = (users[u2Idx].star_coins || 0) + 30;
      await setDbKey("users", users);

      return jsonResponse({
        success: true,
        friend: { id: targetUser.id, username: targetUser.username, avatar: targetUser.avatar },
        message: `成功添加 ${targetUser.username} 為好友！雙方各獲得 30 星星幣 🪙！`
      });
    }

    // 20. GET /api/friends/:userId
    if (pathParts[0] === "friends" && method === "GET") {
      const userId = pathParts[1];
      const friendships = await getDbKey("friendships");
      const friendIds = friendships
        .filter((f: any) => f.userId1 === userId || f.userId2 === userId)
        .map((f: any) => f.userId1 === userId ? f.userId2 : f.userId1);
      
      const users = await getDbKey("users");
      const friends = users
        .filter((u: any) => friendIds.includes(u.id))
        .map((u: any) => ({ id: u.id, username: u.username, avatar: u.avatar }));
      return jsonResponse(friends);
    }

    // 21. POST /api/friends/interact
    if (pathParts[0] === "friends" && pathParts[1] === "interact" && method === "POST") {
      const { userId, targetId } = body || {};
      const users = await getDbKey("users");
      const sender = users.find((u: any) => u.id === userId);
      const receiver = users.find((u: any) => u.id === targetId);
      if (!sender || !receiver) {
        return jsonResponse({ error: "找不到該用戶" }, 404);
      }

      sender.star_coins = (sender.star_coins || 0) + 15;
      receiver.star_coins = (receiver.star_coins || 0) + 30;

      await setDbKey("users", users);
      return jsonResponse({
        success: true,
        message: `✨ 你與 ${receiver.username} 互動了！你獲得了 15 星星幣 🪙，${receiver.username} 獲得了 30 星星幣 🪙！`,
        sender_coins: sender.star_coins,
        receiver_coins: receiver.star_coins
      });
    }

    // 22. GET /api/friends/snaps
    if (pathParts[0] === "friends" && pathParts[1] === "snaps" && method === "GET") {
      // Parse query string manually from path
      const urlObj = new URL(url, window.location.origin);
      const userId = urlObj.searchParams.get("userId");
      if (!userId) {
        return jsonResponse({ error: "缺少 userId" }, 400);
      }
      const coparentGroups = await getDbKey("coparent_groups");
      const userGroupIds = coparentGroups
        .filter((g: any) => g.member_ids && g.member_ids.includes(userId))
        .map((g: any) => `group_${g.id}`);

      const friendSnaps = await getDbKey("friend_snaps");
      const snaps = friendSnaps.filter(
        (s: any) => s.senderId === userId || s.receiverId === userId || userGroupIds.includes(s.receiverId)
      );
      snaps.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return jsonResponse(snaps);
    }

    // 23. POST /api/friends/send-snap
    if (pathParts[0] === "friends" && pathParts[1] === "send-snap" && method === "POST") {
      const { senderId, receiverId, imageUrl, caption } = body || {};
      if (!senderId || !receiverId || !imageUrl) {
        return jsonResponse({ error: "缺少必要參數" }, 400);
      }
      const users = await getDbKey("users");
      const senderUser = users.find((u: any) => u.id === senderId);
      let receiverName = "";
      
      if (receiverId.startsWith("group_")) {
        const coparentGroups = await getDbKey("coparent_groups");
        const realGroupId = receiverId.replace("group_", "");
        const group = coparentGroups.find((g: any) => g.id === realGroupId);
        receiverName = group?.name || "共同家庭";
      } else {
        const receiverUser = users.find((u: any) => u.id === receiverId);
        receiverName = receiverUser?.username || "好友";
      }

      if (!senderUser) {
        return jsonResponse({ error: "找不到該用戶" }, 404);
      }

      const friendSnaps = await getDbKey("friend_snaps");
      const userSnaps = friendSnaps.filter((s: any) => s.senderId === senderId);
      if (userSnaps.length > 0) {
        userSnaps.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const lastSnap = userSnaps[0];
        const lastTime = new Date(lastSnap.timestamp).getTime();
        const now = Date.now();
        const oneHourMs = 60 * 60 * 1000;
        if (now - lastTime < oneHourMs) {
          const remainingMs = oneHourMs - (now - lastTime);
          const remainingMin = Math.ceil(remainingMs / 60000);
          return jsonResponse({ error: `拍照/上傳冷卻中！每小時限拍/傳一張相片，還需要等待 ${remainingMin} 分鐘 ⏱️` }, 400);
        }
      }

      const imgUrl = await uploadBase64ToStorage(imageUrl);
      const newSnap = {
        id: `snap_${Date.now()}`,
        senderId,
        senderName: senderUser.username,
        receiverId,
        receiverName,
        imageUrl: imgUrl,
        caption: caption || "✨ 跟你分享這張超級可愛的照片！📸",
        timestamp: new Date().toISOString()
      };

      friendSnaps.unshift(newSnap);
      await setDbKey("friend_snaps", friendSnaps);

      senderUser.star_coins = (senderUser.star_coins || 0) + 50;
      await setDbKey("users", users);

      return jsonResponse({
        success: true,
        snap: newSnap,
        message: `✨ 照片成功發送給 ${receiverName}！你獲得了 50 星星幣 🪙！`
      });
    }

    // 24. GET /api/friends/room/:friendId
    if (pathParts[0] === "friends" && pathParts[1] === "room" && method === "GET") {
      const friendId = pathParts[2];
      const users = await getDbKey("users");
      const friend = users.find((u: any) => u.id === friendId);
      if (!friend) {
        return jsonResponse({ error: "找不到該好友" }, 404);
      }
      const pets = await getDbKey("pets");
      let pet = pets.find((p: any) => p.owner_id === friendId);
      if (!pet) {
        pet = {
          id: `pet_${Date.now()}`,
          name: `${friend.username}的萌星`,
          owner_id: friend.id,
          owner_name: friend.username,
          xp: 0,
          level: 1,
          type: "Star Bunny",
          color: "Pink",
          custom_appearance: { accessory: "None", vibe: "Cute" },
          home_json: { decor: "Stardust", bed: "Cloud Bed" },
          created_at: new Date().toISOString()
        };
        pets.push(pet);
        await setDbKey("pets", pets);
      }

      const coparentGroups = await getDbKey("coparent_groups");
      const groups = coparentGroups.filter(
        (g: any) => g.member_ids && g.member_ids.includes(friendId)
      );

      return jsonResponse({
        friend: { id: friend.id, username: friend.username, avatar: friend.avatar, background: friend.background },
        pet,
        coparentGroups: groups
      });
    }

    // 25. POST /api/friends/pet/interact-visit
    if (pathParts[0] === "friends" && pathParts[1] === "pet" && pathParts[2] === "interact-visit" && method === "POST") {
      const { userId, targetId, isGroup } = body || {};
      if (!userId || !targetId) {
        return jsonResponse({ error: "缺少必要參數" }, 400);
      }

      const interactions = await getDbKey("interactions");
      const now = Date.now();
      const nowIso = new Date().toISOString();

      const users = await getDbKey("users");
      const visitor = users.find((u: any) => u.id === userId);
      if (!visitor) {
        return jsonResponse({ error: "找不到訪客用戶數據" }, 404);
      }

      const targetInteractions = interactions.filter(
        (item: any) => item.userId === userId && item.targetId === targetId
      );

      let lastTime = 0;
      if (targetInteractions.length > 0) {
        targetInteractions.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        lastTime = new Date(targetInteractions[0].timestamp).getTime();
      }

      const timeDiffSec = lastTime > 0 ? (now - lastTime) / 1000 : 99999;
      const todayStart = new Date();
      todayStart.setHours(0,0,0,0);
      const todayInteractions = interactions.filter(
        (item: any) => item.userId === userId && new Date(item.timestamp).getTime() > todayStart.getTime()
      );

      let coinsEarned = 0;
      let statusMessage = "";

      if (timeDiffSec < 6) {
        coinsEarned = 1;
        statusMessage = `⏱️ 互動太頻繁囉！(距離上次陪伴僅隔了 ${Math.round(timeDiffSec)} 秒) 小萌星害羞了，本次獲得象徵性的 1 星星幣 🪙。試試看每隔一會再輕輕撫摸牠吧！`;
      } else if (timeDiffSec < 30) {
        coinsEarned = 6;
        statusMessage = `🌸 溫馨陪伴中！(距離上次陪伴隔了 ${Math.round(timeDiffSec)} 秒) 寵物對你感到熟悉了，恭喜獲得 +6 星星幣 🪙！`;
      } else {
        coinsEarned = 16;
        statusMessage = `✨ 深度陪伴獎勵！(距離上次陪伴已過 ${Math.round(timeDiffSec)} 秒) 你在好友家園細心照料小星寵，獲得最高規格 of +16 星星幣 🪙！`;
      }

      if (todayInteractions.length >= 20) {
        coinsEarned = 1;
        statusMessage = `🏆 達今日每日互動上限！您的每日關懷愛心已滿，本次互動僅獲得 1 星星幣 🪙。星寵們為您的溫暖深深感動！`;
      }

      visitor.star_coins = (visitor.star_coins || 0) + coinsEarned;
      await setDbKey("users", users);

      let targetOwnerName = "";
      if (isGroup) {
        const coparentGroups = await getDbKey("coparent_groups");
        const idx = coparentGroups.findIndex((g: any) => g.id === targetId);
        if (idx !== -1) {
          coparentGroups[idx].star_coins = (coparentGroups[idx].star_coins || 0) + 5;
          targetOwnerName = `共同家庭【${coparentGroups[idx].name}】`;
          await setDbKey("coparent_groups", coparentGroups);
        }
      } else {
        const pets = await getDbKey("pets");
        const targetPet = pets.find((p: any) => p.id === targetId || p.owner_id === targetId);
        if (targetPet) {
          const ownerIdx = users.findIndex((u: any) => u.id === targetPet.owner_id);
          if (ownerIdx !== -1) {
            users[ownerIdx].star_coins = (users[ownerIdx].star_coins || 0) + 5;
            targetOwnerName = users[ownerIdx].username;
            await setDbKey("users", users);
          }
        }
      }

      interactions.push({
        id: `inter_${Date.now()}`,
        userId,
        targetId,
        timestamp: nowIso
      });
      await setDbKey("interactions", interactions);

      return jsonResponse({
        success: true,
        coinsEarned,
        message: statusMessage,
        visitorCoins: visitor.star_coins,
        targetOwner: targetOwnerName,
        giftCoins: 5
      });
    }

    // 26. GET /api/coparent/members/:groupId
    if (pathParts[0] === "coparent" && pathParts[1] === "members" && method === "GET") {
      const groupId = pathParts[2];
      const coparentGroups = await getDbKey("coparent_groups");
      const group = coparentGroups.find((g: any) => g.id === groupId);
      if (!group) {
        return jsonResponse({ error: "找不到該共同飼養家庭" }, 404);
      }
      const users = await getDbKey("users");
      const members = users
        .filter((u: any) => group.member_ids && group.member_ids.includes(u.id))
        .map((u: any) => ({ id: u.id, username: u.username, avatar: u.avatar }));
      return jsonResponse(members);
    }

    // 27. GET /api/coparent/groups/:userId
    if (pathParts[0] === "coparent" && pathParts[1] === "groups" && method === "GET") {
      const userId = pathParts[2];
      const coparentGroups = await getDbKey("coparent_groups");
      const userGroups = coparentGroups.filter(
        (g: any) => g.member_ids && g.member_ids.includes(userId)
      );
      userGroups.forEach((g: any) => {
        if (!g.pets_v2) {
          g.pets_v2 = [
            {
              id: "star",
              species: "star",
              name: g.pet?.name || "蜜桃粉萌星",
              level: g.pet?.level || 1,
              exp: g.pet?.exp || 0,
              fullness: g.pet?.fullness || 50,
              love: g.pet?.love || 50,
              customSkin: g.pet?.custom_skin || "",
              currentHome: g.currentHomeId || "home_star"
            }
          ];
        }
        if (!g.currentHomeId) g.currentHomeId = "home_star";
        if (!g.focusedPetId) g.focusedPetId = "star";
      });
      return jsonResponse(userGroups);
    }

    // 28. POST /api/coparent/create
    if (pathParts[0] === "coparent" && pathParts[1] === "create" && method === "POST") {
      const { name, creatorId, memberIds } = body || {};
      if (!name || !creatorId || !memberIds) {
        return jsonResponse({ error: "缺少必要參數" }, 400);
      }
      const users = await getDbKey("users");
      const creator = users.find((u: any) => u.id === creatorId);
      const uniqueMemberIds = Array.from(new Set([creatorId, ...memberIds]));
      if (uniqueMemberIds.length < 2 || uniqueMemberIds.length > 6) {
        return jsonResponse({ error: "共同飼養人數限制為 2 ~ 6 人" }, 400);
      }

      const coparentGroups = await getDbKey("coparent_groups");
      const newGroup = {
        id: `group_${Date.now()}`,
        name,
        member_ids: uniqueMemberIds,
        star_coins: 100,
        pet: {
          name: "蜜桃粉萌星",
          fullness: 50,
          love: 50,
          furni      if (userId && !group.member_ids.includes(userId)) {
        return jsonResponse({ error: "你不是這個共同飼養家庭的成員喔" }, 403);
      }

      if (actionType === "rename") {
        const { newName, petId } = payload;
        const targetId = petId || group.focusedPetId || "star";
        if (group.pets_v2) {
          const p = group.pets_v2.find((x: any) => x.id === targetId);
          if (p) p.name = newName;
        }
        if (targetId === (group.focusedPetId || "star")) {
          group.pet.name = newName;
        }
        message = `成功更改寵物名字為「${newName}」！`;
      }
      else if (actionType === "move-furniture") {
        const { furniture } = payload;
        group.pet.furniture = furniture;
        message = "成功移動家具！";
      }
      else if (actionType === "buy-food") {
        const { foodId, quantity, cost } = payload;
        if ((group.star_coins || 0) < cost) {
          return jsonResponse({ error: "星星幣不足，無法購買食物喔！" }, 400);
        }
        group.star_coins = (group.star_coins || 0) - cost;
        if (!group.refrigerator_food) group.refrigerator_food = {};
        group.refrigerator_food[foodId] = (group.refrigerator_food[foodId] || 0) + quantity;
        message = `採購成功！購入了 ${quantity} 份點心 🧁`;
      }
      else if (actionType === "feed-pet") {
        const { foodId, fullnessVal, loveVal } = payload;
        if (foodId !== "dummy") {
          if (!group.refrigerator_food || !group.refrigerator_food[foodId] || group.refrigerator_food[foodId] <= 0) {
            return jsonResponse({ error: "冰箱裡沒有這個食物了，快去採購吧！🍰" }, 400);
          }
          group.refrigerator_food[foodId] -= 1;
        }

        const targetId = group.focusedPetId || "star";
        if (!group.pets_v2) {
          group.pets_v2 = [
            {
              id: "star",
              species: "star",
              name: group.pet?.name || "蜜桃粉萌星",
              level: group.pet?.level || 1,
              exp: group.pet?.exp || 0,
              fullness: group.pet?.fullness || 50,
              love: group.pet?.love || 50,
              customSkin: group.pet?.custom_skin || "",
              currentHome: group.currentHomeId || "home_star"
            }
          ];
        }
        const p = group.pets_v2.find((x: any) => x.id === targetId);
        if (p) {
          if (foodId !== "dummy" && p.fullness >= 100) {
            return jsonResponse({ error: `${p.name} 已經吃飽飽囉！過一會再餵牠吧～🧸` }, 400);
          }
          p.fullness = Math.min(100, (p.fullness || 0) + fullnessVal);
          p.love = Math.min(100, (p.love || 0) + loveVal);

          const xpGained = foodId === "dummy" ? 5 : 15;
          p.exp = (p.exp || 0) + xpGained;
          const xpNeeded = (p.level || 1) * 100;
          let leveledUp = false;
          if (p.exp >= xpNeeded) {
            p.exp -= xpNeeded;
            p.level = (p.level || 1) + 1;
            leveledUp = true;
          }

          if (targetId === (group.focusedPetId || "star")) {
            group.pet.fullness = p.fullness;
            group.pet.love = p.love;
            group.pet.level = p.level;
            group.pet.exp = p.exp;
          }
          if (leveledUp) {
            message = `🎉 餵食成功！且「${p.name}」升級到 Lv.${p.level} 了！🌟 新形象新光芒！`;
          } else {
            message = foodId === "dummy"
              ? `互動成功！幸福指數 +${loveVal}，經驗值 +${xpGained} 🌸`
              : `成功餵食！飽腹度 +${fullnessVal}，幸福指數 +${loveVal}，經驗值 +${xpGained} 🌸`;
          }
        } else {
          return jsonResponse({ error: "找不到該星寵" }, 404);
        }
      }
      else if (actionType === "share-photo") {
        const { image_url, caption } = payload;
        if (!image_url) {
          return jsonResponse({ error: "上傳的照片不能為空" }, 400);
        }

        if (!group.last_photo_times) group.last_photo_times = {};
        const lastTimeStr = group.last_photo_times[userId];
        if (lastTimeStr) {
          const lastTime = new Date(lastTimeStr).getTime();
          const now = Date.now();
          const diffMs = now - lastTime;
          const oneHourMs = 60 * 60 * 1000;
          if (diffMs < oneHourMs) {
            const remainingMin = Math.ceil((oneHourMs - diffMs) / 60000);
            return jsonResponse({ error: `上傳冷卻中！每小時限傳一張照片，請等待 ${remainingMin} 分鐘 ⏱️` }, 400);
          }
        }

        const coinsEarned = 50;
        group.star_coins = (group.star_coins || 0) + coinsEarned;
        group.last_photo_times[userId] = new Date().toISOString();

        const users = await getDbKey("users");
        const uIdx = users.findIndex((u: any) => u.id === userId);
        if (uIdx !== -1) {
          users[uIdx].star_coins = (users[uIdx].star_coins || 0) + 50;
          await setDbKey("users", users);
        }

        const userObj = users.find((u: any) => u.id === userId);
        const imgUrl = await uploadBase64ToStorage(image_url);
        const newPhoto = {
          id: `photo_${Date.now()}`,
          user_id: userId,
          username: userObj?.username || "成員",
          image_url: imgUrl,
          caption: caption || "✨ 每日打卡粉色小家！📸",
          timestamp: new Date().toISOString()
        };

        if (!group.photos) group.photos = [];
        group.photos.unshift(newPhoto);

        const friendSnaps = await getDbKey("friend_snaps");
        friendSnaps.unshift({
          id: newPhoto.id,
          senderId: userId,
          senderName: userObj?.username || "成員",
          receiverId: `group_${group.id}`,
          receiverName: group.name,
          imageUrl: imgUrl,
          caption: newPhoto.caption,
          timestamp: newPhoto.timestamp
        });
        await setDbKey("friend_snaps", friendSnaps);

        // Earn EXP for pet too!
        const targetId = group.focusedPetId || "star";
        if (!group.pets_v2) {
          group.pets_v2 = [
            {
              id: "star",
              name: group.pet?.name || "蜜桃粉萌星",
              species: "star",
              level: group.pet?.level || 1,
              exp: group.pet?.exp || 0,
              fullness: group.pet?.fullness || 50,
              love: group.pet?.love || 50,
              customSkin: group.pet?.custom_skin || "",
              currentHome: group.currentHomeId || "home_star"
            }
          ];
        }
        const p = group.pets_v2.find((x: any) => x.id === targetId);
        if (p) {
          const xpGained = 30;
          p.exp = (p.exp || 0) + xpGained;
          const xpNeeded = (p.level || 1) * 100;
          let leveledUp = false;
          if (p.exp >= xpNeeded) {
            p.exp -= xpNeeded;
            p.level = (p.level || 1) + 1;
            leveledUp = true;
          }
          if (targetId === (group.focusedPetId || "star")) {
            group.pet.level = p.level;
            group.pet.exp = p.exp;
          }
          if (leveledUp) {
            message = `上傳成功！家庭獲得了 ${coinsEarned} 星星幣 🪙，個人獲得了 50 星星幣 🪙，且星寵「${p.name}」升級到 Lv.${p.level} 了！🌟`;
          } else {
            message = `上傳成功！家庭獲得了 ${coinsEarned} 星星幣 🪙，個人獲得了 50 星星幣 🪙，且「${p.name}」獲得了 ${xpGained} 經驗值！✨`;
          }
        } else {
          message = `上傳成功！家庭獲得了 ${coinsEarned} 星星幣 🪙，個人也獲得了 50 星星幣 🪙！`;
        }
      }��庭獲得了 ${coinsEarned} 星星幣 🪙，個人也獲得了 50 星星幣 🪙！`;
        }
      }��傳的照片不能為空" }, 400);
        }

        if (!group.last_photo_times) group.last_photo_times = {};
        const lastTimeStr = group.last_photo_times[userId];
        if (lastTimeStr) {
          const lastTime = new Date(lastTimeStr).getTime();
          const now = Date.now();
          const diffMs = now - lastTime;
          const oneHourMs = 60 * 60 * 1000;
          if (diffMs < oneHourMs) {
            const remainingMin = Math.ceil((oneHourMs - diffMs) / 60000);
            return jsonResponse({ error: `上傳冷卻中！每小時限傳一張照片，請等待 ${remainingMin} 分鐘 ⏱️` }, 400);
          }
        }

        const coinsEarned = 50;
        group.star_coins = (group.star_coins || 0) + coinsEarned;
        group.last_photo_times[userId] = new Date().toISOString();

        const users = await getDbKey("users");
        const uIdx = users.findIndex((u: any) => u.id === userId);
        if (uIdx !== -1) {
          users[uIdx].star_coins = (users[uIdx].star_coins || 0) + 50;
          await setDbKey("users", users);
        }

        const userObj = users.find((u: any) => u.id === userId);
        const imgUrl = await uploadBase64ToStorage(image_url);
        const newPhoto = {
          id: `photo_${Date.now()}`,
          user_id: userId,
          username: userObj?.username || "成員",
          image_url: imgUrl,
          caption: caption || "✨ 每日打卡粉色小家！📸",
          timestamp: new Date().toISOString()
        };

        if (!group.photos) group.photos = [];
        group.photos.unshift(newPhoto);

        const friendSnaps = await getDbKey("friend_snaps");
        friendSnaps.unshift({
          id: newPhoto.id,
          senderId: userId,
          senderName: userObj?.username || "成員",
          receiverId: `group_${group.id}`,
          receiverName: group.name,
          imageUrl: imgUrl,
          caption: newPhoto.caption,
          timestamp: newPhoto.timestamp
        });
        await setDbKey("friend_snaps", friendSnaps);

        message = `上傳成功！家庭獲得了 ${coinsEarned} 星星幣 🪙，你個人也獲得了 50 星星幣 🪙！`;
      }
      else if (actionType === "save-skin") {
        const { customSkin } = payload;
        const targetId = group.focusedPetId || "star";
        const p = group.pets_v2.find((x: any) => x.id === targetId);
        if (p) {
          p.customSkin = customSkin;
        }
        if (targetId === (group.focusedPetId || "star")) {
          group.pet.custom_skin = customSkin;
        }
        message = "成功保存了寵物的自定義繪製外觀！✨";
      }
      else if (actionType === "hatch-egg") {
        if (group.star_coins < 200) {
          return jsonResponse({ error: "您的家庭共享星星幣不足 200 🪙！" }, 400);
        }
        group.star_coins -= 200;

        const isPig = Math.random() < 0.5;
        const species = isPig ? "pig" : "dog";
        
        const pigNames = ["蜜桃波波", "櫻桃糯米", "年糕胖胖", "粉嫩布丁", "甜心脆脆"];
        const dogNames = ["小椰果凍", "啵啵可可", "旺仔椰椰", "奶糖曲奇", "皮皮球球"];
        const randomName = isPig 
          ? pigNames[Math.floor(Math.random() * pigNames.length)]
          : dogNames[Math.floor(Math.random() * dogNames.length)];

        const newPetId = `${species}_${Date.now()}`;
        const defaultHome = isPig ? "home_pig" : "home_dog";

        const newPet = {
          id: newPetId,
          species,
          name: randomName,
          level: 1,
          exp: 0,
          fullness: 50,
          love: 60,
          customSkin: "",
          currentHome: defaultHome
        };

        group.pets_v2.push(newPet);
        group.currentHomeId = defaultHome;
        group.focusedPetId = newPetId;

        // Sync to legacy
        group.pet.name = newPet.name;
        group.pet.fullness = newPet.fullness;
        group.pet.love = newPet.love;
        group.pet.custom_skin = "";

        message = `成功孵化全新星寵寶寶「${randomName}」！✨`;
        
        coparentGroups[idx] = group;
        await setDbKey("coparent_groups", coparentGroups);
        return jsonResponse({ success: true, group, message, newPet });
      }
      else if (actionType === "move-pet-home") {
        const { petId, targetHomeId } = payload;
        const p = group.pets_v2.find((x: any) => x.id === petId);
        if (p) {
          p.currentHome = targetHomeId;
          if (petId === group.focusedPetId) {
            group.currentHomeId = targetHomeId;
          }
          message = `成功將「${p.name}」移居到新房間！🚚`;
        } else {
          return jsonResponse({ error: "找不到該星寵" }, 404);
        }
      }
      else if (actionType === "switch-home-and-focus") {
        const { homeId, petId } = payload;
        group.currentHomeId = homeId;
        if (petId) {
          group.focusedPetId = petId;
          const p = group.pets_v2.find((x: any) => x.id === petId);
          if (p) {
            group.pet.name = p.name;
            group.pet.fullness = p.fullness;
            group.pet.love = p.love;
            group.pet.custom_skin = p.customSkin;
          }
        }
        message = "切換家園成功！";
      }

      coparentGroups[idx] = group;
      await setDbKey("coparent_groups", coparentGroups);
      return jsonResponse({ success: true, group, message });
    }

    return jsonResponse({ error: `Route not found: ${url}` }, 404);
  } catch (err: any) {
    console.warn("Supabase API Interceptor crashed:", err);
    return jsonResponse({ error: "Internal Server Error", message: err?.message || String(err) }, 500);
  }
}
