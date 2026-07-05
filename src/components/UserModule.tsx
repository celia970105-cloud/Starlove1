import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogIn, UserPlus, LogOut, CheckCircle, AlertCircle, Edit3, Image, Shield, Sparkles, FolderHeart, RefreshCw, ExternalLink, FileText, X, Clock } from "lucide-react";
import { User } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { saveUserBackup } from "../lib/syncHelper";

interface UserModuleProps {
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  onLogout: () => void;
  refreshCurrentUser?: () => void;
  onNavigateToAdmin?: () => void;
}

export default function UserModule({ currentUser, onLoginSuccess, onLogout, refreshCurrentUser, onNavigateToAdmin }: UserModuleProps) {
  const { t } = useLanguage();
  // Tabs: 'login' | 'register' | 'profile'
  const [activeTab, setActiveTab] = useState<"login" | "register" | "profile">("login");

  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Register Form States
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Profile Edit States
  const [newUsername, setNewUsername] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const [newBg, setNewBg] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Guest Account Upgrade States
  const [upgradeEmail, setUpgradeEmail] = useState("");
  const [upgradePassword, setUpgradePassword] = useState("");
  const [upgradeUsername, setUpgradeUsername] = useState("");
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");

  // User Submissions list state
  const [userSubmissions, setUserSubmissions] = useState<{ id: string; title: string; type: string; status: string; imageUrl?: string; content?: string; link?: string; timestamp?: string }[]>([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [submissionFilter, setSubmissionFilter] = useState<string>("all");

  // Photo Album choices state
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);
  const [showAlbumForAvatar, setShowAlbumForAvatar] = useState(false);
  const [showAlbumForBg, setShowAlbumForBg] = useState(false);

  const predefinedAvatars = [
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Aria",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Star",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Cosmo",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Nebula",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Dreamer"
  ];

  const predefinedBgs = [
    "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1200",
    "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200",
    "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1200",
    "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200"
  ];

  useEffect(() => {
    if (currentUser) {
      setActiveTab("profile");
      setNewUsername(currentUser.username);
      setNewAvatar(currentUser.avatar);
      setNewBg(currentUser.background);
      setUpgradeUsername(currentUser.username);
      fetchUserSubmissions();
    } else {
      setActiveTab("login");
    }
  }, [currentUser]);

  // Load saved credentials strictly only once on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("starry_saved_email");
    const savedPassword = localStorage.getItem("starry_saved_password");
    if (savedEmail) setLoginEmail(savedEmail);
    if (savedPassword) setLoginPassword(savedPassword);
  }, []);

  useEffect(() => {
    const loadGalleryPhotos = async () => {
      try {
        const res = await fetch("/api/posts/photos");
        if (res.ok) {
          const data = await res.json();
          setGalleryPhotos(data);
        }
      } catch (e) {
        console.error("Error loading gallery photos in user profile module", e);
      }
    };
    loadGalleryPhotos();
  }, [currentUser]);

  const fetchUserSubmissions = async () => {
    if (!currentUser) return;
    setIsSubmissionsLoading(true);
    try {
      const [adminRes, snapsRes] = await Promise.all([
        fetch("/api/admin/all"),
        fetch(`/api/friends/snaps?userId=${currentUser.id}`)
      ]);

      let adminData: any = { photos: [], videos: [], letters: [], artworks: [], music: [] };
      let snapsData: any[] = [];

      if (adminRes.ok) {
        adminData = await adminRes.json();
      }
      if (snapsRes.ok) {
        snapsData = await snapsRes.json();
      }

      const combined: { id: string; title: string; type: string; status: string; imageUrl?: string; content?: string; link?: string; timestamp?: string }[] = [];
      
      // Photos
      if (adminData.photos) {
        adminData.photos.forEach((p: any) => {
          if (p.user_id === currentUser.id) {
            combined.push({
              id: p.id,
              title: p.title || "未命名相片",
              type: "相片",
              status: p.status,
              imageUrl: p.image_url,
              timestamp: p.created_at,
              content: p.category ? `分類: ${p.category}` : ""
            });
          }
        });
      }
      // Videos
      if (adminData.videos) {
        adminData.videos.forEach((v: any) => {
          if (v.user_id === currentUser.id) {
            combined.push({
              id: v.id,
              title: v.title || "未命名影片",
              type: "影片",
              status: v.status,
              link: v.video_url,
              timestamp: v.created_at,
              content: v.category ? `分類: ${v.category}` : ""
            });
          }
        });
      }
      // Letters
      if (adminData.letters) {
        adminData.letters.forEach((l: any) => {
          if (l.user_id === currentUser.id) {
            combined.push({
              id: l.id,
              title: l.content ? (l.content.substring(0, 15) + "...") : "無內容信件",
              type: "信件",
              status: l.status,
              content: l.content,
              timestamp: l.created_at
            });
          }
        });
      }
      // Artworks
      if (adminData.artworks) {
        adminData.artworks.forEach((a: any) => {
          if (a.user_id === currentUser.id) {
            combined.push({
              id: a.id,
              title: a.title || "未命名美術品",
              type: "畫作",
              status: a.status,
              imageUrl: a.image_url,
              link: a.external_link,
              content: a.description,
              timestamp: a.created_at
            });
          }
        });
      }
      // Music
      if (adminData.music) {
        adminData.music.forEach((m: any) => {
          if (m.user_id === currentUser.id) {
            combined.push({
              id: m.id,
              title: m.title || "未命名音樂",
              type: "音樂",
              status: m.status,
              imageUrl: m.cover_url,
              link: m.audio_url,
              timestamp: m.created_at
            });
          }
        });
      }

      // Snaps (與好友共同飼養寵物互相發送的照片)
      snapsData.forEach((s: any) => {
        if (s.senderId === currentUser.id) {
          combined.push({
            id: s.id,
            title: s.caption || "寵物合照",
            type: "寵物相片",
            status: "approved", // Snaps are sent directly and always approved/visible
            imageUrl: s.imageUrl,
            timestamp: s.timestamp,
            content: `發送給: ${s.receiverName}`
          });
        }
      });

      // Sort by timestamp descending
      combined.sort((a, b) => {
        const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tB - tA;
      });

      setUserSubmissions(combined);
    } catch (err) {
      console.error("Error fetching user submissions:", err);
    } finally {
      setIsSubmissionsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      if (res.ok) {
        const data = await res.json();
        onLoginSuccess(data.user);
        // Retain saved login credentials
        localStorage.setItem("starry_saved_email", loginEmail);
        localStorage.setItem("starry_saved_password", loginPassword);
        // Back up user to client-side storage
        saveUserBackup(data.user, loginPassword);
      } else {
        const data = await res.json();
        setLoginError(data.error || "登入失敗，請確認信箱密碼。");
      }
    } catch (err) {
      setLoginError("無法與伺服器取得連線。");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess(false);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regUsername,
          email: regEmail,
          password: regPassword
        })
      });

      if (res.ok) {
        setRegSuccess(true);
        
        // Create an initial backup in local storage
        saveUserBackup({
          id: "",
          username: regUsername,
          email: regEmail,
          role: "user",
          avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${regUsername}`,
          background: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1200",
          star_coins: 100
        }, regPassword);
        
        // Clear login inputs so they must manually type and log in themselves
        setLoginEmail("");
        setLoginPassword("");

        setRegUsername("");
        setRegEmail("");
        setRegPassword("");
        
        setTimeout(() => {
          setActiveTab("login");
          setRegSuccess(false);
        }, 2000);
      } else {
        const data = await res.json();
        setRegError(data.error || "註冊失敗，用戶名或信箱已被使用。");
      }
    } catch (err) {
      setRegError("無法與伺服器取得連線。");
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setNewAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setNewBg(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess(false);

    if (!currentUser) return;
    setIsProfileLoading(true);

    try {
      const res = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          username: newUsername,
          avatar: newAvatar,
          background: newBg
        })
      });

      if (res.ok) {
        const data = await res.json();
        onLoginSuccess(data.user);
        // Save the updated backup!
        saveUserBackup(data.user);
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 2000);
      } else {
        const data = await res.json();
        setProfileError(data.error || "更新設定失敗。");
      }
    } catch (err) {
      setProfileError("與伺服器連線出錯。");
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleUpgradeGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpgradeError("");
    setUpgradeSuccess(false);

    if (!currentUser) return;

    try {
      const res = await fetch("/api/users/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          email: upgradeEmail,
          password: upgradePassword,
          username: upgradeUsername || currentUser.username
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUpgradeSuccess(true);
        onLoginSuccess(data.user);
        // Retain upgraded login credentials
        localStorage.setItem("starry_saved_email", upgradeEmail);
        localStorage.setItem("starry_saved_password", upgradePassword);
        saveUserBackup(data.user, upgradePassword);
        if (refreshCurrentUser) {
          refreshCurrentUser();
        }
        setTimeout(() => {
          setUpgradeSuccess(false);
          setUpgradeEmail("");
          setUpgradePassword("");
        }, 3000);
      } else {
        const data = await res.json();
        setUpgradeError(data.error || "綁定升級帳號失敗。");
      }
    } catch (err) {
      setUpgradeError("無法與伺服器取得連線。");
    }
  };

  const filteredSubmissions = submissionFilter === "all"
    ? userSubmissions
    : userSubmissions.filter(s => s.type === submissionFilter);

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/80 backdrop-blur-md border border-[#FF799C]/20 rounded-[36px] p-6 shadow-xl relative text-left text-[#6E4B55]">
      
      {/* Decorative Y2K Background Sparkle elements */}
      <div className="absolute top-4 right-4 text-[#FF799C]/30 text-xl pointer-events-none">✨✦</div>
      <div className="absolute bottom-4 left-4 text-[#FF799C]/30 text-xl pointer-events-none">✦✨</div>

      {/* Tab Switcher (Only visible when logged out) */}
      {!currentUser && (
        <div className="flex border-b border-[#FF799C]/15 pb-4 mb-6 gap-3">
          <button
            onClick={() => setActiveTab("login")}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === "login" ? "bg-[#FF799C] text-white shadow-md shadow-[#FF799C]/20" : "text-[#6E4B55]/70 hover:text-[#FF799C] bg-[#FFF6F2]/60 hover:bg-[#FFF6F2]"}`}
          >
            {t("login")}
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === "register" ? "bg-[#FF799C] text-white shadow-md shadow-[#FF799C]/20" : "text-[#6E4B55]/70 hover:text-[#FF799C] bg-[#FFF6F2]/60 hover:bg-[#FFF6F2]"}`}
          >
            {t("register")}
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {currentUser ? (
          /* Profile Area */
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start"
          >
            {/* Left: Settings Forms (7 Columns) */}
            <div className="md:col-span-7 space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-[#FF799C]/10">
                <h3 className="text-xl font-serif font-light text-[#FF799C] flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-[#FF799C]" />
                  個人資料設定
                </h3>
                <div className="flex gap-2">
                  {currentUser.role === "admin" && onNavigateToAdmin && (
                    <button
                      type="button"
                      onClick={onNavigateToAdmin}
                      className="text-xs bg-[#FF799C]/10 border border-[#FF799C]/20 text-[#FF799C] hover:bg-[#FF799C]/20 px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer font-bold font-mono tracking-wide"
                    >
                      <Shield className="h-3.5 w-3.5 animate-pulse" />
                      <span>進入管理員控台</span>
                    </button>
                  )}
                  <button
                    onClick={onLogout}
                    className="text-xs bg-red-500/10 border border-red-500/20 text-red-600 hover:bg-red-500/20 px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>登出</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                {profileSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>資料修改成功！</span>
                  </div>
                )}
                {profileError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span>{profileError}</span>
                  </div>
                )}

                {/* Email (Read Only) */}
                <div>
                  <label className="block text-xs font-mono text-[#6E4B55]/60 mb-1.5">信箱 (不可變更)</label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full bg-[#FFF6F2]/30 border border-[#FF799C]/10 text-[#6E4B55]/50 text-sm px-3.5 py-2.5 rounded-xl cursor-not-allowed font-mono"
                  />
                </div>

                {/* Nickname */}
                <div>
                  <label className="block text-xs font-mono text-[#6E4B55]/70 mb-1.5">用戶名 / 署名 *</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-[#FFF6F2]/60 border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-sm px-3.5 py-2.5 rounded-xl transition-all"
                  />
                </div>

                {/* Predefined Avatars Selector & Album selection option */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-mono text-[#6E4B55]/70">個人頭像 (支援手機內建相簿)</label>
                    <div className="flex gap-2">
                      <label className="text-[10px] font-semibold text-[#FF799C] hover:underline cursor-pointer flex items-center gap-1 bg-[#FF799C]/5 border border-[#FF799C]/20 px-2 py-1 rounded-lg">
                        📱 選擇手機相簿
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarFileChange}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAlbumForAvatar(!showAlbumForAvatar);
                          setShowAlbumForBg(false);
                        }}
                        className="text-[10px] font-semibold text-[#6E4B55]/70 hover:underline cursor-pointer flex items-center gap-1 bg-[#FFF6F2] border border-[#FF799C]/10 px-2 py-1 rounded-lg"
                      >
                        📷 {showAlbumForAvatar ? "收起相簿" : "應援相簿選擇"}
                      </button>
                    </div>
                  </div>
                  
                  {showAlbumForAvatar ? (
                    <div className="bg-[#FFF6F2]/70 border border-[#FF799C]/15 rounded-xl p-3 mb-3">
                      <p className="text-[10px] text-[#6E4B55]/60 mb-2 font-mono">點擊應援照片設為頭貼：</p>
                      {galleryPhotos.length === 0 ? (
                        <p className="text-xs text-[#6E4B55]/50 py-3 text-center">目前相簿尚無上傳相片 🌸</p>
                      ) : (
                        <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto pr-1">
                          {galleryPhotos.map((photo) => (
                            <button
                              type="button"
                              key={photo.id}
                              onClick={() => setNewAvatar(photo.image_url)}
                              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 cursor-pointer ${newAvatar === photo.image_url ? "border-[#FF799C] scale-105 ring-2 ring-[#FF799C]/20" : "border-[#FF799C]/10 opacity-70 hover:opacity-100"}`}
                              title={photo.title}
                            >
                              <img src={photo.image_url} alt={photo.title} className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full overflow-hidden border-2 border-[#FF799C] shrink-0 bg-white flex items-center justify-center">
                        {newAvatar ? (
                          <img src={newAvatar} alt="preview" className="h-full w-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#FF799C]/10" />
                        )}
                      </div>
                      <div className="flex gap-2">
                        {predefinedAvatars.map((url) => (
                          <button
                            type="button"
                            key={url}
                            onClick={() => setNewAvatar(url)}
                            className={`h-9 w-9 rounded-full overflow-hidden border-2 transition-all active:scale-95 cursor-pointer ${newAvatar === url ? "border-[#FF799C] scale-105" : "border-[#FF799C]/15 opacity-75 hover:opacity-100"}`}
                          >
                            <img src={url} alt="avatar" className="h-full w-full" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Predefined Header Cover selector & Album selection option */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-mono text-[#6E4B55]/70">星空背景面板 (支援手機內建相簿)</label>
                    <div className="flex gap-2">
                      <label className="text-[10px] font-semibold text-[#FF799C] hover:underline cursor-pointer flex items-center gap-1 bg-[#FF799C]/5 border border-[#FF799C]/20 px-2 py-1 rounded-lg">
                        📱 選擇手機相簿
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleBgFileChange}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAlbumForBg(!showAlbumForBg);
                          setShowAlbumForAvatar(false);
                        }}
                        className="text-[10px] font-semibold text-[#6E4B55]/70 hover:underline cursor-pointer flex items-center gap-1 bg-[#FFF6F2] border border-[#FF799C]/10 px-2 py-1 rounded-lg"
                      >
                        📷 {showAlbumForBg ? "收起相簿" : "應援相簿選擇"}
                      </button>
                    </div>
                  </div>
                  
                  {showAlbumForBg ? (
                    <div className="bg-[#FFF6F2]/70 border border-[#FF799C]/15 rounded-xl p-3 mb-3">
                      <p className="text-[10px] text-[#6E4B55]/60 mb-2 font-mono">點擊應援照片設為背景：</p>
                      {galleryPhotos.length === 0 ? (
                        <p className="text-xs text-[#6E4B55]/50 py-3 text-center">目前相簿尚無上傳相片 🌸</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                          {galleryPhotos.map((photo) => (
                            <button
                              type="button"
                              key={photo.id}
                              onClick={() => setNewBg(photo.image_url)}
                              className={`h-12 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 cursor-pointer ${newBg === photo.image_url ? "border-[#FF799C] scale-105 ring-2 ring-[#FF799C]/20" : "border-[#FF799C]/10 opacity-70 hover:opacity-100"}`}
                              title={photo.title}
                            >
                              <img src={photo.image_url} alt={photo.title} className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {predefinedBgs.map((url, index) => (
                        <button
                          type="button"
                          key={url}
                          onClick={() => setNewBg(url)}
                          className={`h-10 rounded-xl overflow-hidden border-2 transition-all active:scale-95 relative cursor-pointer ${newBg === url ? "border-[#FF799C] scale-[1.03]" : "border-[#FF799C]/15 opacity-60"}`}
                        >
                          <img src={url} alt="cover" className="h-full w-full object-cover" />
                          <span className="absolute bottom-0 right-0 bg-black/60 px-1 text-[8px] font-mono text-white">#{index + 1}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isProfileLoading}
                  className="w-full bg-gradient-to-r from-[#FF799C] to-[#FFCCDD] hover:opacity-90 text-white font-medium text-sm py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProfileLoading ? "更新儲存中... ✦" : "確認修改資料 ✦"}
                </button>
              </form>

              {currentUser.is_guest && (
                <div className="mt-6 bg-gradient-to-br from-violet-500/10 via-pink-500/10 to-amber-500/10 border border-[#FF799C]/30 p-5 rounded-[28px] relative overflow-hidden shadow-md">
                  <div className="absolute top-0 right-0 bg-[#FF799C]/20 border-b border-l border-[#FF799C]/40 text-[#FF799C] text-[8px] font-mono font-bold px-2 py-0.5 rounded-bl-xl uppercase tracking-widest">
                    臨時訪客
                  </div>
                  
                  <h4 className="text-sm font-serif font-bold text-[#FF799C] mb-1 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 animate-bounce text-amber-400" />
                    升級為正式應援帳號 ✦
                  </h4>
                  <p className="text-[11px] text-[#6E4B55]/70 mb-3.5 leading-relaxed">
                    您目前使用<strong>臨時訪客帳號</strong>。為了在清理快取或<strong>更換設備登入</strong>時，所有應援足跡、星星幣和星寵記錄不丟失，請在下方設定信箱與密碼升級：
                  </p>

                  <form onSubmit={handleUpgradeGuest} className="space-y-3 text-xs">
                    {upgradeError && (
                      <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                        <span>{upgradeError}</span>
                      </div>
                    )}

                    {upgradeSuccess && (
                      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>🎉 帳號成功升級！您現在可以在任何設備登入了。</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-mono text-[#6E4B55]/70 mb-1">自訂應援暱稱 Username</label>
                      <input
                        type="text"
                        placeholder={currentUser.username}
                        value={upgradeUsername}
                        onChange={(e) => setUpgradeUsername(e.target.value)}
                        className="w-full bg-white/70 border border-[#FF799C]/15 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] px-3 py-2 rounded-xl transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-[#6E4B55]/70 mb-1">設定正式信箱 Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. yourname@domain.com"
                        value={upgradeEmail}
                        onChange={(e) => setUpgradeEmail(e.target.value)}
                        className="w-full bg-white/70 border border-[#FF799C]/15 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] px-3 py-2 rounded-xl transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-[#6E4B55]/70 mb-1">設定正式密碼 Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="至少 6 位數安全密碼"
                        value={upgradePassword}
                        onChange={(e) => setUpgradePassword(e.target.value)}
                        className="w-full bg-white/70 border border-[#FF799C]/15 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] px-3 py-2 rounded-xl transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-violet-400 to-pink-400 hover:opacity-95 text-white font-medium text-xs py-2.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>綁定信箱密碼，一鍵升級 🚀</span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Right: Submissions Feed (5 Columns) */}
            <div className="md:col-span-5 space-y-6">
              <div className="pb-2 border-b border-[#FF799C]/10">
                <h3 className="text-xl font-serif font-light text-[#FF799C] flex items-center gap-2">
                  <FolderHeart className="h-5 w-5 text-[#FF799C]" />
                  我的應援軌跡
                </h3>
              </div>

              {/* Star Coins Balance Card */}
              <div className="bg-gradient-to-r from-amber-400/15 to-[#FF799C]/15 border border-amber-300/40 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2.5 rounded-xl border border-amber-200/50 animate-pulse">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-xs text-[#6E4B55]/70 font-semibold">✨ 我的專屬星星幣 ✦</h4>
                    <p className="text-2xl font-serif font-bold text-amber-600 flex items-center gap-1.5 mt-0.5">
                      <span>{currentUser.star_coins ?? 100}</span>
                      <span className="text-xs font-sans font-normal text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md">🪙 COINS</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/dev/trigger-hourly-coins", { method: "POST" });
                      if (res.ok) {
                        const data = await res.json();
                        alert(data.message);
                        if (refreshCurrentUser) {
                          refreshCurrentUser();
                        }
                      } else {
                        alert("領取時光收益失敗");
                      }
                    } catch (e) {
                      console.error("Hourly trigger error:", e);
                    }
                  }}
                  className="text-[10px] bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded-xl font-medium transition-all active:scale-95 shadow-sm shadow-amber-500/10 cursor-pointer"
                >
                  ⏱️ 領取時光收益 (+20)
                </button>
              </div>

              {/* Cover Preview header */}
              <div className="relative h-28 rounded-2xl overflow-hidden border border-[#FF799C]/20 bg-[#FFF6F2]">
                {newBg ? (
                  <img src={newBg} alt="cover" className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-[#FFF6F2]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
                <div className="absolute bottom-3 left-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full overflow-hidden border border-[#FF799C]/60 bg-white flex items-center justify-center">
                    {newAvatar ? (
                      <img src={newAvatar} alt="avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#FF799C]/10" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-[#6E4B55] font-serif font-bold text-base flex items-center gap-1">
                      <span>{currentUser.username}</span>
                      {currentUser.role === "admin" && (
                        <span className="bg-[#FF799C]/20 border border-[#FF799C]/40 text-[#FF799C] text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                          <Shield className="h-2 w-2" />
                          ADMIN
                        </span>
                      )}
                    </h4>
                    <p className="text-[#6E4B55]/60 text-[10px] font-mono mt-0.5">{currentUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Submissions queue list / Personal Database */}
              <div className="bg-[#FFF6F2]/50 border border-[#FF799C]/10 p-4 rounded-2xl space-y-3 shadow-inner">
                <div className="flex justify-between items-center pb-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#FF799C] flex items-center gap-1 uppercase">
                    <FolderHeart className="h-3.5 w-3.5 animate-pulse text-[#FF799C]" />
                    我的個人應援數據庫 ({filteredSubmissions.length})
                  </span>
                  <button
                    type="button"
                    onClick={fetchUserSubmissions}
                    disabled={isSubmissionsLoading}
                    className="p-1 rounded-lg hover:bg-[#FF799C]/10 text-[#6E4B55]/70 hover:text-[#FF799C] transition-colors disabled:opacity-50 cursor-pointer"
                    title="重新整理數據"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSubmissionsLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {/* Database filter tabs */}
                <div className="flex gap-1 overflow-x-auto pb-1.5 scrollbar-none">
                  {["all", "相片", "影片", "音樂", "信件", "畫作", "寵物相片"].map((type) => {
                    const count = type === "all" 
                      ? userSubmissions.length 
                      : userSubmissions.filter(s => s.type === type).length;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSubmissionFilter(type)}
                        className={`text-[9px] font-semibold px-2 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${submissionFilter === type ? "bg-[#FF799C] text-white shadow-sm shadow-[#FF799C]/10" : "bg-white/70 text-[#6E4B55]/70 hover:bg-[#FFF6F2] hover:text-[#FF799C]"}`}
                      >
                        {type === "all" ? "全部" : type}({count})
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {isSubmissionsLoading ? (
                    <div className="text-center py-6">
                      <RefreshCw className="h-4 w-4 text-[#FF799C] animate-spin mx-auto mb-1.5" />
                      <p className="text-[10px] text-[#6E4B55]/40 font-mono">載入星光資料庫中...</p>
                    </div>
                  ) : filteredSubmissions.length === 0 ? (
                    <div className="text-center py-8 text-xs font-serif text-[#6E4B55]/50 leading-relaxed bg-white/40 rounded-xl border border-dashed border-[#FF799C]/10">
                      🌸 該分類目前尚無項目。<br />
                      點擊上方對應板塊，馬上上傳你的作品吧！
                    </div>
                  ) : (
                    filteredSubmissions.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedSub(sub)}
                        className="w-full flex justify-between items-center p-2.5 rounded-xl bg-white/80 hover:bg-white border border-[#FF799C]/10 text-xs text-[#6E4B55]/90 hover:border-[#FF799C]/30 hover:shadow-sm transition-all text-left active:scale-[0.99] cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {sub.imageUrl ? (
                            <div className="h-7 w-7 rounded-md overflow-hidden shrink-0 bg-[#FFF6F2] border border-[#FF799C]/10">
                              <img src={sub.imageUrl} alt={sub.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          ) : (
                            <div className="h-7 w-7 rounded-md bg-[#FF799C]/5 border border-[#FF799C]/10 flex items-center justify-center shrink-0">
                              <FileText className="h-3.5 w-3.5 text-[#FF799C]/60" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-[8px] font-mono bg-[#FF799C]/10 text-[#FF799C] px-1 py-0.5 rounded mr-1.5 font-bold">
                              {sub.type}
                            </span>
                            <span className="font-sans font-medium text-[#6E4B55] truncate inline-block align-middle max-w-[120px]">{sub.title}</span>
                          </div>
                        </div>

                        {/* Status tag */}
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-full ${sub.status === "approved" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : sub.status === "rejected" ? "bg-red-500/10 text-red-600 border border-red-500/20" : "bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse"}`}>
                            {sub.status === "approved" ? "已公開" : sub.status === "rejected" ? "退回" : "審核中"}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : activeTab === "login" ? (
          /* Login Tab Form */
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-md mx-auto py-4 text-[#6E4B55]"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-serif font-light text-[#FF799C] tracking-wide">登入星光應援站 ✦</h3>
              <p className="text-xs text-[#6E4B55]/60 mt-1">請填寫信箱密碼，進入最可愛奢華的應援星空圈：</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-[#6E4B55]/70 mb-1.5">信箱 Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@domain.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-[#FFF6F2]/60 border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-sm px-3.5 py-2.5 rounded-xl transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#6E4B55]/70 mb-1.5">密碼 Password *</label>
                <input
                  type="password"
                  required
                  placeholder="輸入您的密碼"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-[#FFF6F2]/60 border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-sm px-3.5 py-2.5 rounded-xl transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#FF799C] to-[#FFCCDD] hover:opacity-90 text-white font-medium text-sm py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>{t("login")}</span>
              </button>
            </form>
          </motion.div>
        ) : (
          /* Register Tab Form */
          <motion.div
            key="register"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-md mx-auto py-4 text-[#6E4B55]"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-serif font-light text-[#FF799C] tracking-wide">註冊加入星應站 ✦</h3>
              <p className="text-xs text-[#6E4B55]/60 mt-1">加入即可獲得一隻專屬「應援小星寵」，並參與寫信與投稿審核：</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {regSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>註冊成功！自動引導至登入面板...</span>
                </div>
              )}
              {regError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span>{regError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-[#6E4B55]/70 mb-1.5">用戶暱稱 Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 璀璨星宿"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full bg-[#FFF6F2]/60 border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-sm px-3.5 py-2.5 rounded-xl transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#6E4B55]/70 mb-1.5">電子信箱 Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. myname@domain.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-[#FFF6F2]/60 border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-sm px-3.5 py-2.5 rounded-xl transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#6E4B55]/70 mb-1.5">安全密碼 Password *</label>
                <input
                  type="password"
                  required
                  placeholder="至少 6 位安全密碼"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-[#FFF6F2]/60 border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-sm px-3.5 py-2.5 rounded-xl transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#FF799C] to-[#FFCCDD] hover:opacity-90 text-white font-medium text-sm py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>立即註冊認領星寵 ✦</span>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detailed Preview Modal overlay */}
      <AnimatePresence>
        {selectedSub && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#6E4B55]/40 backdrop-blur-sm"
            onClick={() => setSelectedSub(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white/95 border border-[#FF799C]/25 max-w-md w-full p-6 rounded-[28px] shadow-2xl relative text-left text-[#6E4B55] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sparkle border decorative */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF799C] via-[#FFD2DD] to-[#FF799C]" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#FF799C]/15 text-[#6E4B55]/70 hover:text-[#FF799C] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1.5 text-[#FF799C] text-[10px] font-mono font-bold tracking-wider uppercase mb-2">
                <Sparkles className="h-3 w-3 animate-pulse text-[#FF799C]" />
                <span>個人應援庫項目 • {selectedSub.type}</span>
              </div>

              <h4 className="text-lg font-serif font-bold text-[#6E4B55] leading-snug mb-3 truncate">
                {selectedSub.title}
              </h4>

              {/* Image Preview if available */}
              {selectedSub.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-[#FF799C]/20 bg-[#FFF6F2] mb-4 max-h-56 shadow-inner relative group">
                  <img
                    src={selectedSub.imageUrl}
                    alt={selectedSub.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <a
                    href={selectedSub.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-2 right-2 bg-[#6E4B55]/80 hover:bg-[#FF799C] text-white text-[10px] font-mono px-2 py-1 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                    <span>查看原圖</span>
                  </a>
                </div>
              )}

              {/* Content description if available */}
              {selectedSub.content && (
                <div className="bg-[#FFF6F2]/40 border-l-4 border-[#FF799C] p-3 rounded-r-xl text-xs text-[#6E4B55] italic whitespace-pre-wrap leading-relaxed mb-4 max-h-40 overflow-y-auto">
                  {selectedSub.content}
                </div>
              )}

              {/* Timestamp and Audit details */}
              <div className="space-y-3 pt-2 border-t border-[#FF799C]/10 text-xs text-[#6E4B55]/70">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-[#FF799C]/70" />
                  <span>提交時間: {selectedSub.timestamp ? new Date(selectedSub.timestamp).toLocaleString("zh-TW") : "時光印記已存檔"}</span>
                </div>

                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {selectedSub.status === "approved" ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    ) : selectedSub.status === "rejected" ? (
                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold block text-[#6E4B55]">
                      應援狀態: {selectedSub.status === "approved" ? "已公開 (Approved)" : selectedSub.status === "rejected" ? "退回 (Rejected)" : "審核中 (Pending Review)"}
                    </span>
                    <p className="text-[10px] text-[#6E4B55]/60 mt-0.5 leading-normal">
                      {selectedSub.status === "approved"
                        ? "恭喜！該應援項目已經核准並即時、永久寫入全局應援數據庫。所有人均可在應援大廳或對應專區看見您的星光足跡。"
                        : selectedSub.status === "rejected"
                        ? "您的項目暫時未通過安全審核，可能涉及敏感或無關內容。如有疑問，請調整後重新投稿。"
                        : "稿件已妥善保存在您的個人專屬帳號資料庫中。待管理員安全稽核通過後，將即時發布至首頁。"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedSub.link && (
                <a
                  href={selectedSub.link}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#FF799C] hover:bg-[#FF799C]/90 text-white font-bold py-2.5 px-4 rounded-xl text-xs w-full flex items-center justify-center gap-1.5 mt-4 shadow-md shadow-[#FF799C]/10 transition-all active:scale-95 text-center"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>開啟連結 ({selectedSub.type === "音樂" ? "聽音樂" : "看影片"})</span>
                </a>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
