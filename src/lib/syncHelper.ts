import { User } from "../types";

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
      friends: existing.friends || []
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
        friends: backup.friends || []
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
