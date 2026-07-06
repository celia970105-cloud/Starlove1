import { User, CandyPost } from "../types";
import { uploadBase64ToStorage } from "./supabase";

export interface BackupUser {
  id?: string;
  username: string;
  email: string;
  password?: string;
  role: "admin" | "user";
  avatar: string;
  background: string;
  star_coins?: number;
  solo_pet?: any;
  friends?: { id: string; username: string; avatar: string; email?: string }[];
  candies?: (CandyPost & { storage_url?: string })[];
}

/**
 * Saves a user's details and credentials to the browser's persistent backup map.
 */
export function saveUserBackup(user: User, password?: string) {
  if (!user || !user.email) return;
  try {
    const backupMapStr = localStorage.getItem("starry_backup_users_map") || "{}";
    let backupMap: Record<string, BackupUser> = {};
    try {
      backupMap = JSON.parse(backupMapStr);
    } catch (e) {}

    const emailKey = user.email.toLowerCase().trim();
    const existing: Partial<BackupUser> = backupMap[emailKey] || {};

    // Keep password if not specified but already exists in backup
    const finalPassword = password || existing.password || localStorage.getItem("starry_saved_password") || "";

    backupMap[emailKey] = {
      id: user.id || existing.id,
      username: user.username,
      email: user.email,
      password: finalPassword,
      role: user.role,
      avatar: user.avatar,
      background: user.background,
      star_coins: user.star_coins !== undefined ? user.star_coins : existing.star_coins,
      solo_pet: user.solo_pet || existing.solo_pet,
      friends: existing.friends || [],
      candies: existing.candies || []
    };

    localStorage.setItem("starry_backup_users_map", JSON.stringify(backupMap));
  } catch (err) {
    console.error("Failed to save user backup:", err);
  }
}

/**
 * Updates the backed up list of friends for a given user email.
 */
export function updateFriendsBackup(email: string, friends: any[]) {
  if (!email || !Array.isArray(friends)) return;
  try {
    const backupMapStr = localStorage.getItem("starry_backup_users_map") || "{}";
    let backupMap: Record<string, BackupUser> = {};
    try {
      backupMap = JSON.parse(backupMapStr);
    } catch (e) {}

    const emailKey = email.toLowerCase().trim();
    if (backupMap[emailKey]) {
      backupMap[emailKey].friends = friends;
      localStorage.setItem("starry_backup_users_map", JSON.stringify(backupMap));
    }
  } catch (err) {
    console.error("Failed to save friends backup:", err);
  }
}

/**
 * Attempts to automatically restore a user's account and friendships
 * on the backend using the local storage backup if the backend database resets.
 */
export async function restoreUserBackup(email: string, password?: string): Promise<User | null> {
  if (!email) return null;
  try {
    const backupMapStr = localStorage.getItem("starry_backup_users_map") || "{}";
    let backupMap: Record<string, BackupUser> = {};
    try {
      backupMap = JSON.parse(backupMapStr);
    } catch (e) {}

    const emailKey = email.toLowerCase().trim();
    const backup = backupMap[emailKey];
    if (!backup) return null;

    const finalPassword = password || backup.password || localStorage.getItem("starry_saved_password") || "";
    if (!finalPassword) return null;

    // POST the backup data to the sync-backup endpoint
    const res = await fetch("/api/users/sync-backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: backup.username,
        email: backup.email,
        password: finalPassword,
        avatar: backup.avatar,
        background: backup.background,
        star_coins: backup.star_coins,
        solo_pet: backup.solo_pet,
        friends: backup.friends || [],
        candies: backup.candies || []
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        console.log("Successfully restored user account and friends from client backup:", data.user);
        // Save the updated user back to localStorage
        saveUserBackup(data.user, finalPassword);
        return data.user;
      }
    }
  } catch (err) {
    console.error("Failed to restore user from backup:", err);
  }
  return null;
}

/**
 * Encodes a string to a UTF-8 base64 string safely.
 */
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Backs up a candy post to Supabase Storage as a structured JSON file, 
 * and associates it within the user's persistent client-side and cloud profile state.
 */
export async function backupCandyToStorageAndUser(email: string, candy: CandyPost): Promise<string | null> {
  if (!email || !candy) return null;
  try {
    const backupMapStr = localStorage.getItem("starry_backup_users_map") || "{}";
    let backupMap: Record<string, BackupUser> = {};
    try {
      backupMap = JSON.parse(backupMapStr);
    } catch (e) {}

    const emailKey = email.toLowerCase().trim();
    if (!backupMap[emailKey]) {
      return null;
    }

    const backupUser = backupMap[emailKey];
    
    // 1. Format the candy details into a JSON payload representing the contribution
    const candyPayload = {
      candy_id: candy.id,
      title: candy.title,
      content: candy.content,
      username: candy.username || backupUser.username,
      email: emailKey,
      is_anonymous: candy.is_anonymous,
      created_at: candy.created_at || new Date().toISOString(),
      status: candy.status || "approved"
    };

    // 2. Base64 encode the JSON payload as UTF-8
    const jsonStr = JSON.stringify(candyPayload, null, 2);
    const base64Str = utf8ToBase64(jsonStr);
    const dataUrl = `data:application/json;base64,${base64Str}`;

    // 3. Upload to Supabase Storage
    console.log("Uploading candy backup to Supabase Storage...");
    const storageUrl = await uploadBase64ToStorage(dataUrl);
    console.log("Candy backup storage URL:", storageUrl);

    // 4. Update local backup association
    const userCandies = backupUser.candies || [];
    const existingIndex = userCandies.findIndex(c => c.id === candy.id);
    const backedUpCandy = {
      ...candy,
      storage_url: storageUrl
    };

    if (existingIndex > -1) {
      userCandies[existingIndex] = backedUpCandy;
    } else {
      userCandies.push(backedUpCandy);
    }

    backupUser.candies = userCandies;
    localStorage.setItem("starry_backup_users_map", JSON.stringify(backupMap));
    
    return storageUrl;
  } catch (err) {
    console.error("Failed to back up candy to Storage and user:", err);
  }
  return null;
}
