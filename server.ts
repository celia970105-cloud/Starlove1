import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Ensure db.json exists with seed data
const SEED_DATA = {
  users: [
    {
      id: "admin",
      username: "CeliaAdmin",
      email: "celia970105@gmail.com",
      password: "Aa0955283881",
      role: "admin",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=celia",
      background: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1200",
      star_coins: 100
    },
    {
      id: "user_zack",
      username: "ZackLover",
      email: "zack@starry.com",
      password: "password123",
      role: "user",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Zack",
      background: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1200",
      star_coins: 100
    },
    {
      id: "user_jeremy",
      username: "JeremyFan",
      email: "jeremy@starry.com",
      password: "password123",
      role: "user",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jeremy",
      background: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1200",
      star_coins: 100
    },
    {
      id: "user_star",
      username: "MarshmallowStar",
      email: "star@starry.com",
      password: "password123",
      role: "user",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Star",
      background: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1200",
      star_coins: 100
    }
  ],
  posts_photos: [],
  posts_videos: [],
  posts_letters: [],
  posts_artworks: [],
  posts_music: [],
  pets: [],
  friendships: [] as any[],
  coparent_groups: [] as any[],
  interactions: [] as any[],
  last_hourly_trigger: new Date().toISOString()
};

// Database helper functions
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(SEED_DATA, null, 2), "utf8");
      return SEED_DATA;
    }
    const content = fs.readFileSync(DB_FILE, "utf8");
    const data = JSON.parse(content);
    
    // Ensure all tables exist
    let modified = false;
    if (!data.friendships) {
      data.friendships = [];
      modified = true;
    }
    if (!data.coparent_groups) {
      data.coparent_groups = [];
      modified = true;
    }
    if (!data.interactions) {
      data.interactions = [];
      modified = true;
    }
    if (!data.users) {
      data.users = SEED_DATA.users;
      modified = true;
    }

    // Ensure every user has star_coins
    data.users.forEach((u: any) => {
      if (u.star_coins === undefined) {
        u.star_coins = 100;
        modified = true;
      }
    });

    // Hourly reward catch-up logic
    if (!data.last_hourly_trigger) {
      data.last_hourly_trigger = new Date().toISOString();
      modified = true;
    } else {
      const lastTrigger = new Date(data.last_hourly_trigger).getTime();
      const now = Date.now();
      const diffMs = now - lastTrigger;
      const oneHourMs = 60 * 60 * 1000;
      if (diffMs >= oneHourMs) {
        const elapsedHours = Math.floor(diffMs / oneHourMs);
        if (elapsedHours > 0) {
          const rewardAmount = elapsedHours * 20; // 20 star coins per hour
          data.users.forEach((u: any) => {
            u.star_coins = (u.star_coins || 0) + rewardAmount;
          });
          data.last_hourly_trigger = new Date(lastTrigger + elapsedHours * oneHourMs).toISOString();
          modified = true;
          console.log(`[Hourly Catch-up] Distributed ${rewardAmount} star coins to all users for ${elapsedHours} elapsed hours.`);
        }
      }
    }

    // Insert any missing seeded users
    SEED_DATA.users.forEach(seedUser => {
      if (!data.users.some((u: any) => u.email === seedUser.email)) {
        data.users.push(seedUser);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    }
    return data;
  } catch (err) {
    console.error("Error reading database file, resetting to seeds", err);
    return SEED_DATA;
  }
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing database file", err);
  }
}

// Ensure database is initialized at start
readDb();

// Active hourly timer (60 minutes) to reward all active users with +20 star coins passively
setInterval(() => {
  try {
    const db = readDb();
    db.users.forEach((u: any) => {
      u.star_coins = (u.star_coins || 0) + 20;
    });
    db.last_hourly_trigger = new Date().toISOString();
    writeDb(db);
    console.log(`[Hourly Interval Triggered] Distributed 20 star coins passively to all users at ${new Date().toISOString()}`);
  } catch (err) {
    console.error("Failed to run hourly interval star coins reward:", err);
  }
}, 60 * 60 * 1000);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// API Routes

// Debug API to get everything
app.get("/api/db", (req, res) => {
  res.json(readDb());
});

// Dev helper to trigger hourly reward manually
app.post("/api/dev/trigger-hourly-coins", (req, res) => {
  const db = readDb();
  db.users.forEach((u: any) => {
    u.star_coins = (u.star_coins || 0) + 20;
  });
  db.last_hourly_trigger = new Date().toISOString();
  writeDb(db);
  res.json({
    success: true,
    message: "🌟 成功手動模擬觸發每小時星星幣收益！所有使用者已獲得 +20 星星幣！",
    users: db.users.map((u: any) => ({ id: u.id, username: u.username, star_coins: u.star_coins }))
  });
});

// Auth API: login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "請填寫信箱/帳號與密碼！" });
  }
  const db = readDb();
  const query = email.trim().toLowerCase();
  const user = db.users.find(u => 
    (u.email.trim().toLowerCase() === query || u.username.trim().toLowerCase() === query) && 
    u.password === password
  );
  if (!user) {
    return res.status(401).json({ error: "帳號、信箱或密碼錯誤，請確認後再試！" });
  }
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

// Auth API: register
app.post("/api/auth/register", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "所有欄位皆為必填！" });
  }

  const cleanUsername = String(username).trim();
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPassword = String(password).trim();

  if (cleanUsername.length < 2) {
    return res.status(400).json({ error: "用戶名稱長度至少需要 2 個字元！" });
  }
  if (cleanPassword.length < 6) {
    return res.status(400).json({ error: "安全密碼長度至少需要 6 個字元！" });
  }

  const db = readDb();
  
  // Case-insensitive check for email duplication
  if (db.users.some(u => u.email.trim().toLowerCase() === cleanEmail)) {
    return res.status(400).json({ error: "此電子信箱已被註冊使用！" });
  }
  
  // Case-insensitive check for username duplication
  if (db.users.some(u => u.username.trim().toLowerCase() === cleanUsername.toLowerCase())) {
    return res.status(400).json({ error: "此用戶暱稱已被使用！" });
  }

  const isFirstAdmin = cleanEmail === "admin@starry.com";
  const newUser = {
    id: String(db.users.length + 1),
    username: cleanUsername,
    email: cleanEmail,
    password: cleanPassword,
    role: isFirstAdmin ? "admin" : "user",
    avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${cleanUsername}`,
    background: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1200"
  };

  db.users.push(newUser);

  // If registering a regular user, also create a starter pet for them!
  if (!isFirstAdmin) {
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
    db.pets.push(starterPet);
  }

  writeDb(db);

  const { password: _, ...userWithoutPassword } = newUser;
  res.json({ user: userWithoutPassword });
});

// Auth API: quick-join (一鍵快速加入) - DISABLED
app.post("/api/auth/quick-join", (req, res) => {
  return res.status(403).json({ error: "快速加入通道已關閉，請使用一般帳號密碼登入或註冊！" });
});

// Auth API: upgrade guest user to permanent user (綁定信箱密碼升級帳號)
app.post("/api/users/upgrade", (req, res) => {
  const { userId, email, password, username } = req.body;
  if (!userId || !email || !password) {
    return res.status(400).json({ error: "所有欄位皆為必填！" });
  }

  const db = readDb();
  const userIdx = db.users.findIndex(u => u.id === userId);
  if (userIdx === -1) {
    return res.status(404).json({ error: "找不到該訪客用戶！" });
  }

  // Check if target email is already taken
  if (db.users.some(u => u.id !== userId && u.email === email)) {
    return res.status(400).json({ error: "此 Email 已被其他帳號註冊！" });
  }

  // Check if target username is already taken
  if (username && db.users.some(u => u.id !== userId && u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ error: "此用戶暱稱已被使用！" });
  }

  const user = db.users[userIdx];
  user.email = email;
  user.password = password;
  if (username) {
    user.username = username;
    // Update owner_name in db.pets as well
    db.pets.forEach((p: any) => {
      if (p.owner_id === userId) {
        p.owner_name = username;
      }
    });
  }
  user.is_guest = false;

  writeDb(db);

  const { password: _, ...userWithoutPassword } = user;
  res.json({ success: true, user: userWithoutPassword });
});

// Solo Pet Sync API: Save solo pet data
app.post("/api/users/save-solo-pet", (req, res) => {
  const { userId, solo_pet } = req.body;
  if (!userId || !solo_pet) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const db = readDb();
  const userIdx = db.users.findIndex(u => u.id === userId);
  if (userIdx === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  db.users[userIdx].solo_pet = solo_pet;
  writeDb(db);
  res.json({ success: true });
});

// User Profile Update
app.post("/api/users/update", (req, res) => {
  const { userId, username, avatar, background } = req.body;
  const db = readDb();
  const userIdx = db.users.findIndex(u => u.id === userId);
  if (userIdx === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  if (username) {
    // Check duplication excluding self
    const isTaken = db.users.some(u => u.id !== userId && u.username.toLowerCase() === username.toLowerCase());
    if (isTaken) {
      return res.status(400).json({ error: "Username already taken" });
    }
    db.users[userIdx].username = username;
  }
  if (avatar) db.users[userIdx].avatar = avatar;
  if (background) db.users[userIdx].background = background;

  writeDb(db);

  const { password: _, ...userWithoutPassword } = db.users[userIdx];
  res.json({ user: userWithoutPassword });
});

// Get User Profile Detail
app.get("/api/users/profile/:userId", (req, res) => {
  const { userId } = req.params;
  const db = readDb();
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

// Submissions GET by type
app.get("/api/posts/:type", (req, res) => {
  const { type } = req.params;
  const db = readDb();
  
  let collection: any[] = [];
  if (type === "photos") collection = db.posts_photos;
  else if (type === "videos") collection = db.posts_videos;
  else if (type === "letters") collection = db.posts_letters;
  else if (type === "artworks") collection = db.posts_artworks;
  else if (type === "music") collection = db.posts_music;
  else {
    return res.status(400).json({ error: "Invalid post type" });
  }

  // Filter approved items for public viewing
  const approvedItems = collection.filter((item: any) => item.status === "approved");
  res.json(approvedItems);
});

// Submissions POST (Submit new content)
app.post("/api/posts/:type", (req, res) => {
  const { type } = req.params;
  const { payload } = req.body;
  const db = readDb();

  if (!payload) {
    return res.status(400).json({ error: "Payload is required" });
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

  if (type === "photos") {
    const post = {
      ...basePost,
      title: payload.title || "Untitled Photo",
      image_url: payload.image_url || "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=800",
      year: payload.year || String(new Date().getFullYear()),
      category: payload.category || "General"
    };
    db.posts_photos.push(post);

    writeDb(db);
    return res.json({ success: true, post });
  } 
  
  if (type === "videos") {
    const post = {
      ...basePost,
      title: payload.title || "Untitled Video",
      video_url: payload.video_url || "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4",
      category: payload.category || "General"
    };
    db.posts_videos.push(post);
    writeDb(db);
    return res.json({ success: true, post });
  }

  if (type === "letters") {
    const post = {
      ...basePost,
      author_name: payload.is_anonymous ? "Anonymous Star" : (payload.author_name || payload.username || "Stardust"),
      content: payload.content || "",
      is_anonymous: Boolean(payload.is_anonymous),
      color_theme: payload.color_theme || "pink"
    };
    db.posts_letters.push(post);
    writeDb(db);
    return res.json({ success: true, post });
  }

  if (type === "artworks") {
    const post = {
      ...basePost,
      title: payload.title || "Untitled Artwork",
      image_url: payload.image_url || "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800",
      external_link: payload.external_link || "",
      description: payload.description || ""
    };
    db.posts_artworks.push(post);
    writeDb(db);
    return res.json({ success: true, post });
  }

  if (type === "music") {
    const title = (payload.title || "").trim();
    if (!title) {
      return res.status(400).json({ error: "請填寫音樂名稱！" });
    }
    const exists = db.posts_music.some((m: any) => m.status !== "rejected" && m.title.trim().toLowerCase() === title.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: "此音樂名稱已存在，請使用其他名稱！" });
    }

    const audioUrl = (payload.audio_url || "").trim();
    const isBili = audioUrl.toLowerCase().includes("bilibili.com") || audioUrl.toLowerCase().includes("b23.tv");
    const isQQ = audioUrl.toLowerCase().includes("qq.com");
    if (!isBili && !isQQ) {
      return res.status(400).json({ error: "音樂網址格式錯誤！應援投稿僅限使用 QQ音樂 或 bilibili 網址。" });
    }

    const post = {
      ...basePost,
      title,
      artist: payload.artist || "Unknown Artist",
      audio_url: audioUrl,
      cover_url: payload.cover_url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500",
      duration: payload.duration || "3:30",
      status: basePost.status
    };
    db.posts_music.push(post);
    writeDb(db);
    return res.json({ success: true, post });
  }

  return res.status(400).json({ error: "Invalid post type" });
});

// Admin Route: Get all pending items for moderation
app.get("/api/admin/pending", (req, res) => {
  const db = readDb();
  const pending = {
    photos: db.posts_photos.filter(p => p.status === "pending"),
    videos: db.posts_videos.filter(v => v.status === "pending"),
    letters: db.posts_letters.filter(l => l.status === "pending"),
    artworks: db.posts_artworks.filter(a => a.status === "pending"),
    music: db.posts_music.filter(m => m.status === "pending")
  };
  res.json(pending);
});

// Admin Route: Get all items of any status (for global deletion/management)
app.get("/api/admin/all", (req, res) => {
  const db = readDb();
  res.json({
    photos: db.posts_photos,
    videos: db.posts_videos,
    letters: db.posts_letters,
    artworks: db.posts_artworks,
    music: db.posts_music,
    users: db.users.map(u => ({ id: u.id, username: u.username, email: u.email, role: u.role, avatar: u.avatar })),
    pets: db.pets
  });
});

// Admin Route: Moderate (Approve/Reject/Delete)
app.post("/api/admin/action", (req, res) => {
  const { type, id, action } = req.body; // action: 'approve' | 'reject' | 'delete'
  const db = readDb();

  let collectionName: "posts_photos" | "posts_videos" | "posts_letters" | "posts_artworks" | "posts_music" | "users" | "pets" | null = null;
  if (type === "photos") collectionName = "posts_photos";
  else if (type === "videos") collectionName = "posts_videos";
  else if (type === "letters") collectionName = "posts_letters";
  else if (type === "artworks") collectionName = "posts_artworks";
  else if (type === "music") collectionName = "posts_music";
  else if (type === "users") collectionName = "users";
  else if (type === "pets") collectionName = "pets";

  if (!collectionName) {
    return res.status(400).json({ error: "Invalid item type" });
  }

  const collection = db[collectionName] as any[];
  const itemIdx = collection.findIndex(item => item.id === id);

  if (itemIdx === -1) {
    return res.status(404).json({ error: "Item not found" });
  }

  if (action === "approve") {
    const prevStatus = collection[itemIdx].status;
    collection[itemIdx].status = "approved";
    // If the post was not previously approved, reward the user with 50 star coins
    if (prevStatus !== "approved") {
      const postUserId = collection[itemIdx].user_id;
      if (postUserId && postUserId !== "anonymous") {
        const userIdx = db.users.findIndex((u: any) => u.id === postUserId);
        if (userIdx !== -1) {
          db.users[userIdx].star_coins = (db.users[userIdx].star_coins || 0) + 50;
        }
      }
    }
  } else if (action === "reject") {
    collection[itemIdx].status = "rejected";
  } else if (action === "delete") {
    collection.splice(itemIdx, 1);
  } else {
    return res.status(400).json({ error: "Invalid action" });
  }

  writeDb(db);
  res.json({ success: true, message: `Successfully executed ${action} on ${type}` });
});

// Admin Route: Reinforce full deletion permission
app.delete("/api/admin/delete-item", (req, res) => {
  const { type, id } = req.body;
  const db = readDb();

  let collectionName: "posts_photos" | "posts_videos" | "posts_letters" | "posts_artworks" | "posts_music" | "users" | "pets" | null = null;
  
  if (type === "photo" || type === "photos") collectionName = "posts_photos";
  else if (type === "video" || type === "videos") collectionName = "posts_videos";
  else if (type === "letter" || type === "letters") collectionName = "posts_letters";
  else if (type === "artwork" || type === "artworks") collectionName = "posts_artworks";
  else if (type === "music") collectionName = "posts_music";
  else if (type === "user" || type === "users") collectionName = "users";
  else if (type === "pet" || type === "pets") collectionName = "pets";

  if (!collectionName) {
    return res.status(400).json({ error: "Invalid item type" });
  }

  const collection = db[collectionName] as any[];
  const itemIdx = collection.findIndex(item => item.id === id);

  if (itemIdx === -1) {
    return res.status(404).json({ error: "Item not found" });
  }

  collection.splice(itemIdx, 1);
  writeDb(db);
  res.json({ success: true, message: `Successfully deleted ${type} with ID ${id}` });
});

// Pets API: Get all pets
app.get("/api/pets", (req, res) => {
  const db = readDb();
  res.json(db.pets);
});

// Pets API: Interact/Train/Feed pet (increases XP and levels up!)
app.post("/api/pets/interact", (req, res) => {
  const { petId, action } = req.body; // action: 'feed' | 'play' | 'train'
  const db = readDb();
  const petIdx = db.pets.findIndex(p => p.id === petId);
  if (petIdx === -1) {
    return res.status(404).json({ error: "Pet not found" });
  }

  let xpGained = 10;
  if (action === "feed") xpGained = 15;
  else if (action === "play") xpGained = 20;
  else if (action === "train") xpGained = 30;

  const pet = db.pets[petIdx];
  pet.xp += xpGained;

  // Level Up logic: each level needs level * 100 XP
  const xpNeeded = pet.level * 100;
  let leveledUp = false;
  if (pet.xp >= xpNeeded) {
    pet.xp -= xpNeeded;
    pet.level += 1;
    leveledUp = true;
  }

  writeDb(db);
  res.json({ success: true, pet, xpGained, leveledUp });
});

// Friends & Co-parenting APIs

// Get all users in the system (public info)
app.get("/api/users/list", (req, res) => {
  const db = readDb();
  const list = db.users.map((u: any) => ({
    id: u.id,
    username: u.username,
    avatar: u.avatar,
    email: u.email
  }));
  res.json(list);
});

// Add Friend
app.post("/api/friends/add", (req, res) => {
  const { userId, targetUsernameOrEmail } = req.body;
  if (!userId || !targetUsernameOrEmail) {
    return res.status(400).json({ error: "缺少參數" });
  }

  const db = readDb();
  const query = targetUsernameOrEmail.toLowerCase().trim();
  
  // Find by exact match (trimmed and lowercased) or direct ID match
  let targetUser = db.users.find(
    (u: any) => 
      u.username.trim().toLowerCase() === query || 
      u.email.trim().toLowerCase() === query ||
      u.id.trim().toLowerCase() === query
  );

  // Fallback: find by partial match if exact match wasn't found
  if (!targetUser) {
    targetUser = db.users.find(
      (u: any) => 
        u.username.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query)
    );
  }

  if (!targetUser) {
    return res.status(404).json({ error: "找不到該用戶，請檢查輸入的用戶名或 Email" });
  }

  if (targetUser.id === userId) {
    return res.status(400).json({ error: "不能加自己為好友喔！" });
  }

  // Check if already friends
  const alreadyFriends = db.friendships.some(
    (f: any) => (f.userId1 === userId && f.userId2 === targetUser.id) ||
                (f.userId1 === targetUser.id && f.userId2 === userId)
  );

  if (alreadyFriends) {
    return res.status(400).json({ error: "你們已經是好友囉！" });
  }

  db.friendships.push({ userId1: userId, userId2: targetUser.id });

  // Reward both users +30 star coins for friend interaction
  const u1Idx = db.users.findIndex((u: any) => u.id === userId);
  const u2Idx = db.users.findIndex((u: any) => u.id === targetUser.id);
  if (u1Idx !== -1) {
    db.users[u1Idx].star_coins = (db.users[u1Idx].star_coins || 0) + 30;
  }
  if (u2Idx !== -1) {
    db.users[u2Idx].star_coins = (db.users[u2Idx].star_coins || 0) + 30;
  }

  writeDb(db);

  res.json({ 
    success: true, 
    friend: { id: targetUser.id, username: targetUser.username, avatar: targetUser.avatar },
    message: `成功添加 ${targetUser.username} 為好友！雙方各獲得 30 星星幣 🪙！`
  });
});

// Get Friends list
app.get("/api/friends/:userId", (req, res) => {
  const { userId } = req.params;
  const db = readDb();
  
  const friendships = db.friendships.filter(
    (f: any) => f.userId1 === userId || f.userId2 === userId
  );

  const friendIds = friendships.map((f: any) => f.userId1 === userId ? f.userId2 : f.userId1);
  const friends = db.users
    .filter((u: any) => friendIds.includes(u.id))
    .map((u: any) => ({ id: u.id, username: u.username, avatar: u.avatar }));

  res.json(friends);
});

// Friends API: Interact (Poke / Send love / Bless)
app.post("/api/friends/interact", (req, res) => {
  const { userId, targetId } = req.body;
  if (!userId || !targetId) {
    return res.status(400).json({ error: "缺少參數" });
  }
  const db = readDb();
  const sender = db.users.find((u: any) => u.id === userId);
  const receiver = db.users.find((u: any) => u.id === targetId);
  if (!sender || !receiver) {
    return res.status(404).json({ error: "找不到該用戶" });
  }
  
  // Reward sender for initiating: +15 star coins
  sender.star_coins = (sender.star_coins || 0) + 15;
  // Reward receiver for being interacted with: +30 star coins!
  receiver.star_coins = (receiver.star_coins || 0) + 30;
  
  writeDb(db);
  res.json({
    success: true,
    message: `✨ 你與 ${receiver.username} 互動了！你獲得了 15 星星幣 🪙，${receiver.username} 獲得了 30 星星幣 🪙！`,
    sender_coins: sender.star_coins,
    receiver_coins: receiver.star_coins
  });
});

// Friends API: Fetch a friend's pet home room details
app.get("/api/friends/room/:friendId", (req, res) => {
  const { friendId } = req.params;
  const db = readDb();
  
  const friend = db.users.find((u: any) => u.id === friendId);
  if (!friend) {
    return res.status(404).json({ error: "找不到該好友" });
  }

  // Find single pet or create a starter if not exists
  let pet = db.pets.find((p: any) => p.owner_id === friendId);
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
    db.pets.push(pet);
    writeDb(db);
  }

  // Find their co-parenting groups to see if they share any homes
  const coparentGroups = db.coparent_groups.filter(
    (g: any) => g.member_ids && g.member_ids.includes(friendId)
  );

  res.json({
    friend: { id: friend.id, username: friend.username, avatar: friend.avatar, background: friend.background },
    pet,
    coparentGroups
  });
});

// Friends API: Interact with friend's pet during visitation
app.post("/api/friends/pet/interact-visit", (req, res) => {
  const { userId, targetId, isGroup } = req.body;
  if (!userId || !targetId) {
    return res.status(400).json({ error: "缺少必要參數" });
  }

  const db = readDb();
  if (!db.interactions) {
    db.interactions = [];
  }

  const now = Date.now();
  const nowIso = new Date().toISOString();

  // Find visitor
  const visitor = db.users.find((u: any) => u.id === userId);
  if (!visitor) {
    return res.status(404).json({ error: "找不到訪客用戶數據" });
  }

  // Get previous interactions of this user with this target pet/group
  const targetInteractions = db.interactions.filter(
    (item: any) => item.userId === userId && item.targetId === targetId
  );

  let lastTime = 0;
  if (targetInteractions.length > 0) {
    targetInteractions.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    lastTime = new Date(targetInteractions[0].timestamp).getTime();
  }

  const timeDiffSec = lastTime > 0 ? (now - lastTime) / 1000 : 99999;

  // Interactions count in last 10 minutes (frequency check)
  const tenMinutesAgo = now - 10 * 60 * 1000;
  const recentCount = targetInteractions.filter((item: any) => new Date(item.timestamp).getTime() > tenMinutesAgo).length;

  let coinsEarned = 0;
  let statusMessage = "";

  if (timeDiffSec < 6) {
    // Too frequent, prevent abuse
    coinsEarned = 1;
    statusMessage = `⏱️ 互動太頻繁囉！(距離上次陪伴僅隔了 ${Math.round(timeDiffSec)} 秒) 小萌星害羞了，本次獲得象徵性的 1 星星幣 🪙。試試看每隔一會再輕輕撫摸牠吧！`;
  } else if (timeDiffSec < 30) {
    // Regular frequency
    coinsEarned = 6;
    statusMessage = `🌸 溫馨陪伴中！(距離上次陪伴隔了 ${Math.round(timeDiffSec)} 秒) 寵物對你感到熟悉了，恭喜獲得 +6 星星幣 🪙！`;
  } else {
    // High quality care, slow frequency (30s+ elapsed)
    coinsEarned = 16;
    statusMessage = `✨ 深度陪伴獎勵！(距離上次陪伴已過 ${Math.round(timeDiffSec)} 秒) 你在好友家園細心照料小星寵，獲得最高規格的 +16 星星幣 🪙！`;
  }

  // Limit visitor earning to 15 transactions a day from friend interaction
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayInteractions = db.interactions.filter(
    (item: any) => item.userId === userId && new Date(item.timestamp).getTime() > todayStart.getTime()
  );

  if (todayInteractions.length >= 20) {
    coinsEarned = 1;
    statusMessage = `🏆 達今日每日互動上限！您的每日關懷愛心已滿，本次互動僅獲得 1 星星幣 🪙。星寵們為您的溫暖深深感動！`;
  }

  // Award coin to visitor
  visitor.star_coins = (visitor.star_coins || 0) + coinsEarned;

  // Award 5 coins to target owner/group
  let targetOwnerName = "";
  if (isGroup) {
    const group = db.coparent_groups.find((g: any) => g.id === targetId);
    if (group) {
      group.star_coins = (group.star_coins || 0) + 5;
      targetOwnerName = `共同家庭【${group.name}】`;
    }
  } else {
    // Single pet
    const targetPet = db.pets.find((p: any) => p.id === targetId || p.owner_id === targetId);
    if (targetPet) {
      const owner = db.users.find((u: any) => u.id === targetPet.owner_id);
      if (owner) {
        owner.star_coins = (owner.star_coins || 0) + 5;
        targetOwnerName = owner.username;
      }
    }
  }

  // Push interaction log
  db.interactions.push({
    id: `inter_${Date.now()}`,
    userId,
    targetId,
    timestamp: nowIso
  });

  writeDb(db);

  res.json({
    success: true,
    coinsEarned,
    message: statusMessage,
    visitorCoins: visitor.star_coins,
    targetOwner: targetOwnerName,
    giftCoins: 5
  });
});

// Co-parent members detail resolver
app.get("/api/coparent/members/:groupId", (req, res) => {
  const { groupId } = req.params;
  const db = readDb();
  
  const group = db.coparent_groups.find((g: any) => g.id === groupId);
  if (!group) {
    return res.status(404).json({ error: "找不到該共同飼養家庭" });
  }

  const members = db.users
    .filter((u: any) => group.member_ids && group.member_ids.includes(u.id))
    .map((u: any) => ({ id: u.id, username: u.username, avatar: u.avatar }));

  res.json(members);
});

// Get Co-parenting Groups
app.get("/api/coparent/groups/:userId", (req, res) => {
  const { userId } = req.params;
  const db = readDb();
  
  const userGroups = db.coparent_groups.filter(
    (g: any) => g.member_ids && g.member_ids.includes(userId)
  );

  res.json(userGroups);
});

// Create Co-parenting Group
app.post("/api/coparent/create", (req, res) => {
  const { name, creatorId, memberIds } = req.body;
  if (!name || !creatorId || !memberIds) {
    return res.status(400).json({ error: "缺少必要參數" });
  }

  const db = readDb();
  const uniqueMemberIds = Array.from(new Set([creatorId, ...memberIds]));
  if (uniqueMemberIds.length < 2 || uniqueMemberIds.length > 6) {
    return res.status(400).json({ error: "共同飼養人數限制為 2 ~ 6 人" });
  }

  const newGroup = {
    id: `group_${Date.now()}`,
    name,
    member_ids: uniqueMemberIds,
    star_coins: 100,
    pet: {
      name: "蜜桃粉萌星",
      fullness: 50,
      love: 50,
      furniture: [
        { id: "bed", name: "棉花糖蓬蓬床", x: 20, y: 150, description: "圓潤香甜的草莓棉花糖大床" },
        { id: "sofa", name: "蜜桃雲朵沙發", x: 190, y: 160, description: "像雲朵般舒適的圓角粉紅小沙發" },
        { id: "fridge", name: "草莓波點冰箱", x: 30, y: 55, description: "可以點擊查看美味食物的粉色小冰箱" }
      ]
    },
    refrigerator_food: {
      cotton_candy: 3,
      peach_juice: 3,
      star_macaron: 2,
      cherry_pudding: 2
    },
    photos: [
      {
        id: `photo_init_${Date.now()}`,
        user_id: creatorId,
        username: db.users.find((u: any) => u.id === creatorId)?.username || "創立者",
        image_url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400",
        caption: "✨ 我們的粉紅小家正式成立啦！🌸",
        timestamp: new Date().toISOString()
      }
    ],
    last_photo_times: {} as any
  };

  db.coparent_groups.push(newGroup);
  writeDb(db);

  res.json({ success: true, group: newGroup });
});

// Execute Co-parenting Action (rename, move-furniture, buy-food, feed-pet, share-photo)
app.post("/api/coparent/action", (req, res) => {
  const { groupId, userId, actionType, payload } = req.body;
  if (!groupId || !actionType) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const db = readDb();
  const groupIdx = db.coparent_groups.findIndex((g: any) => g.id === groupId);
  if (groupIdx === -1) {
    return res.status(404).json({ error: "找不到該共同飼養家庭" });
  }

  const group = db.coparent_groups[groupIdx];

  if (userId && !group.member_ids.includes(userId)) {
    return res.status(403).json({ error: "你不是這個共同飼養家庭的成員喔" });
  }

  let message = "操作成功";

  if (actionType === "rename") {
    const { newName } = payload;
    if (newName && newName.trim()) {
      group.pet.name = newName.trim();
      message = `成功改名字為：${newName}`;
    }
  } 
  else if (actionType === "move-furniture") {
    const { furniture } = payload;
    if (furniture) {
      group.pet.furniture = furniture;
      message = "已更新家具擺放位置";
    }
  } 
  else if (actionType === "buy-food") {
    const { foodId, cost, count } = payload;
    if (group.star_coins < cost) {
      return res.status(400).json({ error: "星星幣不足，快上傳照片賺取吧！🪙" });
    }
    group.star_coins -= cost;
    if (!group.refrigerator_food) group.refrigerator_food = {};
    group.refrigerator_food[foodId] = (group.refrigerator_food[foodId] || 0) + count;
    message = `成功購入食物，已放入草莓冰箱！`;
  } 
  else if (actionType === "feed-pet") {
    const { foodId, fullnessVal, loveVal } = payload;
    if (!group.refrigerator_food || !group.refrigerator_food[foodId] || group.refrigerator_food[foodId] <= 0) {
      return res.status(400).json({ error: "冰箱裡沒有這個食物了，快去採購吧！🍰" });
    }
    
    if (group.pet.fullness >= 100) {
      return res.status(400).json({ error: `${group.pet.name} 已經吃飽飽囉！過一會再餵牠吧～🧸` });
    }

    group.refrigerator_food[foodId] -= 1;
    group.pet.fullness = Math.min(100, (group.pet.fullness || 0) + fullnessVal);
    group.pet.love = Math.min(100, (group.pet.love || 0) + loveVal);
    message = `成功餵食！飽腹度 +${fullnessVal}，幸福指數 +${loveVal} 🌸`;
  } 
  else if (actionType === "share-photo") {
    const { image_url, caption } = payload;
    if (!image_url) {
      return res.status(400).json({ error: "上傳的照片不能為空" });
    }

    // Cooldown check: hourly
    if (!group.last_photo_times) group.last_photo_times = {};
    const lastTimeStr = group.last_photo_times[userId];
    if (lastTimeStr) {
      const lastTime = new Date(lastTimeStr).getTime();
      const now = Date.now();
      const diffMs = now - lastTime;
      const oneHourMs = 60 * 60 * 1000;
      if (diffMs < oneHourMs) {
        const remainingMin = Math.ceil((oneHourMs - diffMs) / 60000);
        return res.status(400).json({ error: `上傳冷卻中！每小時限傳一張照片，請等待 ${remainingMin} 分鐘 ⏱️` });
      }
    }

    const coinsEarned = 50;
    group.star_coins = (group.star_coins || 0) + coinsEarned;
    group.last_photo_times[userId] = new Date().toISOString();

    // Reward individual user +50 star coins
    const uIdx = db.users.findIndex((u: any) => u.id === userId);
    if (uIdx !== -1) {
      db.users[uIdx].star_coins = (db.users[uIdx].star_coins || 0) + 50;
    }

    const userObj = db.users.find((u: any) => u.id === userId);
    const newPhoto = {
      id: `photo_${Date.now()}`,
      user_id: userId,
      username: userObj?.username || "成員",
      image_url,
      caption: caption || "✨ 每日打卡粉色小家！📸",
      timestamp: new Date().toISOString()
    };

    if (!group.photos) group.photos = [];
    group.photos.unshift(newPhoto);

    message = `上傳成功！家庭獲得了 ${coinsEarned} 星星幣 🪙，你個人也獲得了 50 星星幣 🪙！`;
  }
  else if (actionType === "save-skin") {
    const { customSkin } = payload;
    group.pet.custom_skin = customSkin;
    message = "成功保存了寵物的自定義繪製外觀！✨";
  }

  db.coparent_groups[groupIdx] = group;
  writeDb(db);

  res.json({ success: true, group, message });
});

// Mount Vite / Static files
if (process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa"
  }).then((vite) => {
    app.use(vite.middlewares);
    
    // Fallback index.html for SPA router
    app.get("*", (req, res) => {
      const indexHtml = path.join(process.cwd(), "index.html");
      res.sendFile(indexHtml);
    });

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running in development on http://localhost:${PORT}`);
    });
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running in production on http://localhost:${PORT}`);
  });
}
