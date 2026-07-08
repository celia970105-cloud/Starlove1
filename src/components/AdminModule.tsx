import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, Check, X, Trash2, Users, FileText, AlertTriangle, 
  Eye, Sparkles, RefreshCw, Layers, Image, Film, MessageSquare, 
  Palette, Music, Play, ExternalLink, CheckCircle, XCircle, Heart, Star, ChevronRight
} from "lucide-react";
import { AdminPending, AdminAllData, User } from "../types";

interface AdminModuleProps {
  currentUser: User | null;
  onRefreshData?: () => void;
  registeredUsers?: User[];
  onRefreshUsers?: () => void;
}

export default function AdminModule({ 
  currentUser, 
  onRefreshData, 
  registeredUsers = [], 
  onRefreshUsers 
}: AdminModuleProps) {
  // Tabs: 'pending' (moderation) | 'global_db' | 'site_text'
  const [activeTab, setActiveTab] = useState<"pending" | "global_db" | "site_text">("pending");
  // Sub-category of moderation: 'all' | 'photos' | 'videos' | 'letters' | 'artworks' | 'music' | 'candies'
  const [modSubTab, setModSubTab] = useState<"all" | "photos" | "videos" | "letters" | "artworks" | "music" | "candies">("all");

  const [pendingData, setPendingData] = useState<AdminPending | null>(null);
  const [globalData, setGlobalData] = useState<AdminAllData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<string>("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Merge registered users from globalData and props to ensure full synchronization
  const displayedUsersMap = new Map<string, any>();
  
  if (Array.isArray(registeredUsers)) {
    registeredUsers.forEach((u) => {
      if (u && u.id) {
        displayedUsersMap.set(u.id, u);
      }
    });
  }

  if (globalData && Array.isArray(globalData.users)) {
    globalData.users.forEach((u) => {
      if (u && u.id) {
        const existing = displayedUsersMap.get(u.id) || {};
        displayedUsersMap.set(u.id, { ...existing, ...u });
      }
    });
  }

  const displayedUsers = Array.from(displayedUsersMap.values());

  // Simulated Site Text Configurations
  const [heroTitle, setHeroTitle] = useState("Starry Wish Support Platform");
  const [heroSubtitle, setHeroSubtitle] = useState("星願應援站 - 明星與星光同盟的交界處。");
  const [bannerUrl, setBannerUrl] = useState("https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=1200");
  const [savedTextSuccess, setSavedTextSuccess] = useState(false);

  // Customizable area titles and descriptions
  const [galleryTitle, setGalleryTitle] = useState("圖片相簿");
  const [galleryDesc, setGalleryDesc] = useState("珍藏高清直拍舞台照");

  const [videoTitle, setVideoTitle] = useState("影片專區");
  const [videoDesc, setVideoDesc] = useState("應援Fancam、直拍、Vlog");

  const [lettersTitle, setLettersTitle] = useState("星星信箱");
  const [lettersDesc, setLettersDesc] = useState("寄語星罐中的心靈密信");

  const [museumTitle, setMuseumTitle] = useState("美術展覽館");
  const [museumDesc, setMuseumDesc] = useState("手繪同好、同人概念設計");

  const [musicTitle, setMusicTitle] = useState("黑膠應援播放器");
  const [musicDesc, setMusicDesc] = useState("來聽聽TOP唯一雙主唱的歌聲吧");

  const [petsTitle, setPetsTitle] = useState("星寵家園");
  const [petsDesc, setPetsDesc] = useState("2~6人共同飼養星寵，共築溫馨港灣");

  useEffect(() => {
    const savedHeroTitle = localStorage.getItem("starry_hero_title");
    const savedHeroSub = localStorage.getItem("starry_hero_sub");
    const savedBanner = localStorage.getItem("starry_hero_banner");
    if (savedHeroTitle) setHeroTitle(savedHeroTitle);
    if (savedHeroSub) setHeroSubtitle(savedHeroSub);
    if (savedBanner) setBannerUrl(savedBanner);

    const savedGalleryTitle = localStorage.getItem("starry_gallery_title");
    const savedGalleryDesc = localStorage.getItem("starry_gallery_desc");
    const savedVideoTitle = localStorage.getItem("starry_video_title");
    const savedVideoDesc = localStorage.getItem("starry_video_desc");
    const savedLettersTitle = localStorage.getItem("starry_letters_title");
    const savedLettersDesc = localStorage.getItem("starry_letters_desc");
    const savedMuseumTitle = localStorage.getItem("starry_museum_title");
    const savedMuseumDesc = localStorage.getItem("starry_museum_desc");
    const savedMusicTitle = localStorage.getItem("starry_music_title");
    const savedMusicDesc = localStorage.getItem("starry_music_desc");
    const savedPetsTitle = localStorage.getItem("starry_pets_title");
    const savedPetsDesc = localStorage.getItem("starry_pets_desc");

    if (savedGalleryTitle) setGalleryTitle(savedGalleryTitle);
    if (savedGalleryDesc) setGalleryDesc(savedGalleryDesc);
    if (savedVideoTitle) setVideoTitle(savedVideoTitle);
    if (savedVideoDesc) setVideoDesc(savedVideoDesc);
    if (savedLettersTitle) setLettersTitle(savedLettersTitle);
    if (savedLettersDesc) setLettersDesc(savedLettersDesc);
    if (savedMuseumTitle) setMuseumTitle(savedMuseumTitle);
    if (savedMuseumDesc) setMuseumDesc(savedMuseumDesc);
    if (savedMusicTitle) setMusicTitle(savedMusicTitle);
    if (savedMusicDesc) setMusicDesc(savedMusicDesc);
    if (savedPetsTitle) setPetsTitle(savedPetsTitle);
    if (savedPetsDesc) setPetsDesc(savedPetsDesc);
  }, []);

  const fetchAllData = async (silent = false) => {
    const isAdmin = currentUser?.role === "admin" || currentUser?.email?.trim().toLowerCase() === "celia970105@gmail.com";
    if (!isAdmin) return;

    if (!silent) {
      setIsLoading(true);
    } else {
      setIsSyncing(true);
    }
    setError("");

    try {
      const [pendingRes, globalRes] = await Promise.all([
        fetch("/api/admin/pending"),
        fetch("/api/admin/all")
      ]);

      if (pendingRes.ok) {
        const pData = await pendingRes.json();
        setPendingData(pData);
      } else if (!silent) {
        setError("無法讀取待審核資料。");
      }

      if (globalRes.ok) {
        const gData = await globalRes.json();
        setGlobalData(gData);
      }
    } catch (err) {
      console.error("Failed to sync admin data:", err);
      if (!silent) {
        setError("讀取伺服器資料失敗。");
      }
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  // Initial fetch on mount or tab active
  useEffect(() => {
    fetchAllData(false);
  }, [currentUser, activeTab]);

  // Real-time auto sync polling interval (5 seconds)
  useEffect(() => {
    const isAdmin = currentUser?.role === "admin" || currentUser?.email?.trim().toLowerCase() === "celia970105@gmail.com";
    if (!isAdmin || !autoSync) return;

    const interval = setInterval(() => {
      fetchAllData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser, autoSync, activeTab]);

  const handleAction = async (type: string, id: string, action: "approve" | "reject" | "delete") => {
    setMessage("");
    try {
      let res;
      if (action === "delete") {
        res = await fetch("/api/admin/delete-item", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, id })
        });
      } else {
        res = await fetch("/api/admin/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, id, action })
        });
      }

      if (res.ok) {
        setMessage(`成功執行 ${action === "approve" ? "核准" : action === "reject" ? "退回" : "刪除"} 作業！`);
        // Refresh feeds
        fetchAllData(true);
        if (onRefreshData) {
          onRefreshData();
        }
        if (onRefreshUsers) {
          onRefreshUsers();
        }
        setTimeout(() => setMessage(""), 2500);
      } else {
        setError("處理失敗，請確認資料狀態。");
      }
    } catch (err) {
      setError("伺服器回應錯誤。");
    }
  };

  const handleBulkApprove = async () => {
    const list = getModSubList();
    if (list.length === 0) return;

    const typeNames: Record<string, string> = {
      all: "全部種類",
      photos: "相片",
      videos: "影片",
      letters: "信件",
      artworks: "畫作",
      music: "音樂",
      candies: "糖果"
    };

    const confirmText = `確定要一鍵【核准並公開】當前「${typeNames[modSubTab]}」分類下的所有 ${list.length} 個待審應援件嗎？這將即時發布至首頁且回饋投稿者各 50 應援星幣。`;

    if (!window.confirm(confirmText)) return;

    setIsBulkProcessing(true);
    setMessage(`正在批次核准 ${list.length} 個投稿件，請稍候...`);
    setError("");

    try {
      const promises = list.map(item => 
        fetch("/api/admin/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: item._categoryKey, id: item.id, action: "approve" })
        })
      );

      const results = await Promise.all(promises);
      const allSuccess = results.every(r => r.ok);

      if (allSuccess) {
        setMessage(`✨ 成功一鍵核准當前類別所有 ${list.length} 個投稿項目！`);
        fetchAllData(true);
        if (onRefreshData) onRefreshData();
      } else {
        setError("部分投稿件處理失敗，請重新整理確認。");
      }
    } catch (err) {
      console.error(err);
      setError("批量核准時連線伺服器失敗。");
    } finally {
      setIsBulkProcessing(false);
      setTimeout(() => setMessage(""), 3500);
    }
  };

  const saveTextConfigs = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedTextSuccess(true);
    // Write configs dynamically into localStorage for client-side persistence
    localStorage.setItem("starry_hero_title", heroTitle);
    localStorage.setItem("starry_hero_sub", heroSubtitle);
    localStorage.setItem("starry_hero_banner", bannerUrl);

    localStorage.setItem("starry_gallery_title", galleryTitle);
    localStorage.setItem("starry_gallery_desc", galleryDesc);
    localStorage.setItem("starry_video_title", videoTitle);
    localStorage.setItem("starry_video_desc", videoDesc);
    localStorage.setItem("starry_letters_title", lettersTitle);
    localStorage.setItem("starry_letters_desc", lettersDesc);
    localStorage.setItem("starry_museum_title", museumTitle);
    localStorage.setItem("starry_museum_desc", museumDesc);
    localStorage.setItem("starry_music_title", musicTitle);
    localStorage.setItem("starry_music_desc", musicDesc);
    localStorage.setItem("starry_pets_title", petsTitle);
    localStorage.setItem("starry_pets_desc", petsDesc);

    if (onRefreshData) {
      onRefreshData();
    }
    setTimeout(() => setSavedTextSuccess(false), 2000);
  };

  // Safe checks
  if (currentUser?.role !== "admin") {
    return (
      <div className="w-full max-w-4xl mx-auto glass p-12 rounded-[28px] border border-[#FF799C]/20 text-center space-y-4 shadow-xl">
        <Shield className="h-16 w-16 text-[#FF799C] mx-auto animate-pulse" />
        <h3 className="text-2xl font-serif font-light text-[#FF799C]">權限不足 (Access Denied)</h3>
        <p className="text-[#6E4B55]/70 text-sm max-w-md mx-auto">
          「管理員控台」為 ZACK, JEREMY 與 Jiyu 應援最高權限人員專屬控制區。請先點選右上方登入，並切換至最高管理員測試帳號登入 (celia970105@gmail.com)。
        </p>
      </div>
    );
  }

  // Pending items classified mapper
  const getModSubList = () => {
    if (!pendingData) return [];
    if (modSubTab === "all") {
      const all: any[] = [];
      if (pendingData.photos) pendingData.photos.forEach(x => all.push({ ...x, _categoryKey: "photos" }));
      if (pendingData.videos) pendingData.videos.forEach(x => all.push({ ...x, _categoryKey: "videos" }));
      if (pendingData.letters) pendingData.letters.forEach(x => all.push({ ...x, _categoryKey: "letters" }));
      if (pendingData.artworks) pendingData.artworks.forEach(x => all.push({ ...x, _categoryKey: "artworks" }));
      if (pendingData.music) pendingData.music.forEach(x => all.push({ ...x, _categoryKey: "music" }));
      if (pendingData.candies) pendingData.candies.forEach(x => all.push({ ...x, _categoryKey: "candies" }));
      
      // Sort by created_at descending
      all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return all;
    }
    
    const rawList = pendingData[modSubTab] || [];
    return rawList.map((x: any) => ({ ...x, _categoryKey: modSubTab }));
  };

  const modItems = getModSubList();

  return (
    <div className="w-full max-w-5xl mx-auto glass border border-[#FF799C]/20 rounded-[32px] p-6 md:p-8 shadow-xl relative text-left text-[#6E4B55]">
      {/* Decorative Branding Line */}
      <div className="absolute top-4 right-6 flex items-center gap-1">
        <Sparkles className="h-3 w-3 text-[#FF799C]" />
        <span className="text-[10px] font-mono text-[#FF799C]/60 tracking-widest uppercase">
          ZACK • CONTROL PANEL • JEREMY
        </span>
      </div>

      {/* Title */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#FF799C]/10 pb-4">
        <div>
          <h2 className="text-2xl font-serif font-light text-[#FF799C] tracking-wide flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#FF799C]" />
            星盟管理控台 <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF799C]/10 text-[#FF799C] border border-[#FF799C]/20 uppercase">ADMIN ACTIVE</span>
          </h2>
          <p className="text-xs text-[#6E4B55]/70 mt-1">控制、發布或剔除投稿項目，管理用戶星寵數據，調整主視覺宣告與文字。</p>
        </div>

        {/* Real-time Sync Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-[#FFF6F2] p-1.5 rounded-2xl border border-[#FF799C]/15 self-start md:self-center">
          <div className="flex items-center gap-1.5 px-2">
            <span className={`h-2 w-2 rounded-full ${autoSync ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
            <span className="text-[11px] font-medium text-[#6E4B55]/80">
              {autoSync ? "即時同步中 (5s)" : "即時同步已暫停"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setAutoSync(!autoSync)}
            className={`px-2 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${autoSync ? "bg-[#FF799C]/10 text-[#FF799C] border border-[#FF799C]/20 hover:bg-[#FF799C]/20" : "bg-[#6E4B55]/10 text-[#6E4B55]/70 hover:bg-[#6E4B55]/20"}`}
            title={autoSync ? "點擊暫停自動即時同步" : "點擊啟動每 5 秒自動同步"}
          >
            {autoSync ? "暫停自動" : "開啟自動"}
          </button>

          <div className="h-4 w-[1px] bg-[#FF799C]/20" />

          <button
            type="button"
            onClick={() => fetchAllData(true)}
            disabled={isSyncing || isLoading}
            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-[#FF799C] to-[#FF9EBA] text-white text-[11px] font-bold rounded-xl shadow-sm hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
            <span>立即同步</span>
          </button>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex flex-wrap border-b border-[#FF799C]/10 pb-3 mb-6 gap-2">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === "pending" ? "bg-[#FF799C] text-white shadow-md shadow-[#FF799C]/15" : "text-[#6E4B55]/70 bg-[#FF799C]/5 hover:bg-[#FF799C]/10"}`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>待審應援盒</span>
        </button>

        <button
          onClick={() => setActiveTab("global_db")}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === "global_db" ? "bg-[#FF799C] text-white shadow-md shadow-[#FF799C]/15" : "text-[#6E4B55]/70 bg-[#FF799C]/5 hover:bg-[#FF799C]/10"}`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>全局應援庫 (Global DB)</span>
        </button>

        <button
          onClick={() => setActiveTab("site_text")}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === "site_text" ? "bg-[#FF799C] text-white shadow-md shadow-[#FF799C]/15" : "text-[#6E4B55]/70 bg-[#FF799C]/5 hover:bg-[#FF799C]/10"}`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>修改網站宣告設定</span>
        </button>
      </div>

      {/* Message alerts with proper readability */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 mb-4 shadow-sm"
          >
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{message}</span>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2 mb-4 shadow-sm"
          >
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {activeTab === "pending" && (
          /* Moderation Tab */
          <motion.div
            key="pending-panel"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            {/* Moderation subcategories selector with badge counts */}
            <div className="flex flex-wrap gap-1 bg-[#FFF6F2] border border-[#FF799C]/15 p-1.5 rounded-2xl shadow-inner">
              {(["all", "photos", "videos", "letters", "artworks", "music", "candies"] as const).map((sub) => {
                const names = { 
                  all: "全部待審", 
                  photos: "📸 相片", 
                  videos: "🎬 影片", 
                  letters: "💌 信件", 
                  artworks: "🎨 畫作", 
                  music: "🎵 音樂",
                  candies: "🍬 糖果"
                };
                
                const count = pendingData ? (
                  sub === "all"
                    ? ((pendingData.photos?.length || 0) + 
                       (pendingData.videos?.length || 0) + 
                       (pendingData.letters?.length || 0) + 
                       (pendingData.artworks?.length || 0) + 
                       (pendingData.music?.length || 0) +
                       (pendingData.candies?.length || 0))
                    : (pendingData[sub]?.length || 0)
                ) : 0;
                
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setModSubTab(sub)}
                    className={`flex-1 min-w-[90px] text-center text-xs py-2 px-1 rounded-xl font-medium transition-all cursor-pointer ${modSubTab === sub ? "bg-[#FF799C] text-white shadow-sm shadow-[#FF799C]/20" : "text-[#6E4B55]/70 hover:text-[#FF799C] hover:bg-[#FF799C]/5"}`}
                  >
                    <span>{names[sub]}</span>
                    {count > 0 && (
                      <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold ${modSubTab === sub ? "bg-white text-[#FF799C]" : "bg-[#FF799C]/10 text-[#FF799C]"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bulk operation header */}
            {modItems.length > 0 && (
              <div className="flex justify-between items-center bg-[#FF799C]/5 p-3 rounded-2xl border border-[#FF799C]/10">
                <div className="text-xs text-[#6E4B55]/80">
                  當前分類共有 <strong className="text-[#FF799C] text-sm">{modItems.length}</strong> 個項目等待審核
                </div>
                <button
                  type="button"
                  onClick={handleBulkApprove}
                  disabled={isBulkProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-emerald-600/10 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>一鍵快速核准本類別</span>
                </button>
              </div>
            )}

            {/* Sub Feed list */}
            {isLoading ? (
              <div className="text-center py-16">
                <RefreshCw className="h-8 w-8 text-[#FF799C] animate-spin mx-auto mb-2" />
                <p className="text-xs text-[#6E4B55]/60 font-mono">載入星光應援佇列中...</p>
              </div>
            ) : modItems.length === 0 ? (
              <div className="text-center py-16 bg-[#FFF6F2]/30 border border-dashed border-[#FF799C]/20 rounded-3xl">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
                  <Check className="h-6 w-6" />
                </div>
                <p className="text-[#6E4B55] font-serif font-bold text-base">此類別投稿已全部審核完畢！</p>
                <p className="text-[#6E4B55]/60 text-xs mt-1.5 max-w-sm mx-auto">目前暫時沒有未處理的稿件盒。感謝您為星光同盟付出的辛勤與愛心！🌟</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {modItems.map((item: any) => {
                  const typeLabelMap: Record<string, string> = {
                    photos: "📸 相片",
                    videos: "🎬 影片",
                    letters: "💌 信件",
                    artworks: "🎨 畫作",
                    music: "🎵 音樂",
                    candies: "🍬 糖果"
                  };
                  const authorUser = item.user_id && item.user_id !== "anonymous"
                    ? displayedUsers.find((u: any) => u.id === item.user_id)
                    : null;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col md:flex-row items-stretch md:items-center justify-between p-4 bg-white hover:bg-[#FFF6F2]/20 border border-[#FF799C]/15 hover:border-[#FF799C]/30 hover:shadow-sm rounded-[24px] transition-all gap-4 text-xs"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Thumbnail image if available */}
                        {(item.image_url || item.cover_url) && (
                          <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 bg-[#FFF6F2] border border-[#FF799C]/10">
                            <img src={item.image_url || item.cover_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        
                        {/* Letter specific block representation */}
                        {item.content && !item.image_url && (
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center border font-serif font-bold text-lg shrink-0 ${
                            item._categoryKey === "candies"
                              ? "bg-pink-100 border-pink-200 text-pink-600 animate-pulse"
                              : "bg-[#FF799C]/10 border-[#FF799C]/20 text-[#FF799C]"
                          }`}>
                            {item._categoryKey === "candies" ? "糖" : "信"}
                          </div>
                        )}

                        <div className="text-left min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[9px] font-mono font-bold bg-[#FF799C]/10 text-[#FF799C] px-1.5 py-0.5 rounded uppercase">
                              {typeLabelMap[item._categoryKey] || "應援項目"}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded font-mono">
                              {item.category || item.color_theme || "一般"}
                            </span>
                          </div>

                          <h4 className="text-[#6E4B55] font-serif font-bold text-sm truncate leading-snug max-w-[280px] md:max-w-[450px]">
                            {item.title || item.content?.substring(0, 30) + "..."}
                          </h4>

                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[#6E4B55]/50 text-[11px] font-mono mt-1">
                            <span>
                              由 @{item.username || item.author_name || "匿名同盟"} 
                              {authorUser ? ` (${authorUser.email})` : ""} 投遞
                            </span>
                            <span>•</span>
                            <span>時間: {new Date(item.created_at).toLocaleString("zh-TW")}</span>
                          </div>
                        </div>
                      </div>

                      {/* Moderation Actions button bar */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto">
                        <button
                          type="button"
                          onClick={() => { setSelectedItem(item); setSelectedItemType(item._categoryKey); }}
                          className="bg-pink-50 hover:bg-pink-100 border border-pink-100 text-[#FF799C] p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                          title="放大檢視 / 詳細審查"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAction(item._categoryKey, item.id, "approve")}
                          className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>核准</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAction(item._categoryKey, item.id, "reject")}
                          className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>退回</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("確定要將此投稿項目從資料庫中物理刪除嗎？這將不可還原！")) {
                              handleAction(item._categoryKey, item.id, "delete");
                            }
                          }}
                          className="bg-red-50 hover:bg-red-100 border border-red-150 text-red-600 p-2 rounded-xl transition-all flex items-center justify-center active:scale-95 cursor-pointer"
                          title="徹底刪除"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "global_db" && (
          /* Global DB Tab (Delete / Cleanup approved posts and users) */
          <motion.div
            key="global-db"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl text-xs text-[#6E4B55] leading-relaxed text-left flex gap-3.5 items-start">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-700 block mb-0.5">高風險作業警告 (Global Database Manager)</span>
                此面板為全局物理資料庫。你可以強行物理刪除任何已發布、甚至 pending 的同人畫作、照片、音軌、或一般用戶帳號。物理刪除將不可恢復，請確認操作安全。
              </div>
            </div>

            {globalData ? (
              <div className="space-y-6 pt-2">
                {/* Users Management */}
                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold tracking-widest text-[#FF799C] uppercase block text-left">
                    STARRY USERS ({displayedUsers.length})
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {displayedUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex justify-between items-center p-3.5 rounded-xl bg-white border border-[#FF799C]/10 text-xs shadow-sm hover:border-[#FF799C]/20 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <img src={u.avatar} alt="" className="h-8 w-8 rounded-full border border-[#FF799C]/15 shrink-0" />
                          <div className="text-left">
                            <p className="font-bold text-[#6E4B55] font-serif">{u.username}</p>
                            <p className="text-[10px] text-[#6E4B55]/60 font-mono">{u.email} • {u.role}</p>
                          </div>
                        </div>

                        {/* Disable delete for active admin */}
                        {u.email?.trim().toLowerCase() !== "celia970105@gmail.com" && u.role !== "admin" && u.id !== "admin" && (
                          <button
                            onClick={() => {
                              if (window.confirm(`確定要完全物理刪除用戶「${u.username}」嗎？此操作將永久註銷其帳號與星寵數據且不可恢復！`)) {
                                handleAction("users", u.id, "delete");
                              }
                            }}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-100 transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                            title="註銷帳戶"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold">刪除</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Star Pets Management */}
                <div className="space-y-3 pt-4 border-t border-[#FF799C]/10">
                  <span className="text-xs font-mono font-bold tracking-widest text-[#FF799C] uppercase block text-left">
                    STAR PETS ({globalData.pets.length})
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {globalData.pets.map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between items-center p-3.5 rounded-xl bg-white border border-[#FF799C]/10 text-xs shadow-sm hover:border-[#FF799C]/20 transition-all"
                      >
                        <div className="text-left">
                          <p className="font-bold text-[#6E4B55] font-serif">{p.name}</p>
                          <p className="text-[10px] text-[#6E4B55]/60 font-mono">
                            主子: @{p.owner_name} • LV.{p.level} • {p.type}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAction("pets", p.id, "delete")}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-100 transition-all active:scale-95 cursor-pointer"
                          title="強行物理清除星寵"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <RefreshCw className="h-6 w-6 text-[#FF799C] animate-spin mx-auto mb-2" />
                <p className="text-xs text-[#6E4B55]/50 font-mono">連線星盟主資料庫中...</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "site_text" && (
          /* Site Text Customizer (修改網站文字與圖片) */
          <motion.div
            key="site-text"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="max-w-2xl w-full"
          >
            <form onSubmit={saveTextConfigs} className="space-y-6">
              {savedTextSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>網站宣告與各區域顯示文字更新成功！首頁與導航欄已同步重寫。</span>
                </div>
              )}

              {/* CORE HERO SECTION */}
              <div className="bg-white border border-[#FF799C]/15 rounded-[24px] p-5 space-y-4 shadow-sm">
                <span className="text-xs font-mono text-[#FF799C] tracking-widest uppercase font-bold block mb-2 border-b border-[#FF799C]/10 pb-1">
                  🌐 首頁主宣告設定 (Hero Area Settings)
                </span>
                
                <div>
                  <label className="block text-xs font-mono text-[#6E4B55]/70 mb-1.5">首頁星空大標題 (Hero Title)</label>
                  <input
                    type="text"
                    required
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    className="w-full bg-white border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-sm px-3.5 py-2.5 rounded-xl transition-all focus:ring-1 focus:ring-[#FF799C]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#6E4B55]/70 mb-1.5">首頁副標題與宣告 (Hero Subtitle)</label>
                  <textarea
                    required
                    rows={3}
                    value={heroSubtitle}
                    onChange={(e) => setHeroSubtitle(e.target.value)}
                    className="w-full bg-white border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-sm px-3.5 py-2.5 rounded-xl transition-all resize-none focus:ring-1 focus:ring-[#FF799C]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#6E4B55]/70 mb-1.5">首頁主視覺大背板網址 (Hero Banner URL)</label>
                  <input
                    type="url"
                    required
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="w-full bg-white border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-sm px-3.5 py-2.5 rounded-xl transition-all font-mono focus:ring-1 focus:ring-[#FF799C]/30"
                  />
                  <span className="text-[10px] text-[#6E4B55]/50 mt-1 block">提示：更改此圖片連結，將在下次網頁整理時覆寫首頁大背板。</span>
                </div>
              </div>

              {/* REGION-SPECIFIC TEXT SETTINGS */}
              <div className="bg-white border border-[#FF799C]/15 rounded-[24px] p-5 space-y-4 shadow-sm">
                <span className="text-xs font-mono text-[#FF799C] tracking-widest uppercase font-bold block mb-2 border-b border-[#FF799C]/10 pb-1">
                  🌸 各功能板塊文字設定 (Region Area Content Settings)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Gallery Section */}
                  <div className="space-y-2 border border-[#FF799C]/10 p-3.5 rounded-xl bg-white/50 shadow-sm hover:border-[#FF799C]/20 transition-all">
                    <span className="text-xs font-bold text-[#6E4B55] block">📸 圖片相簿區域</span>
                    <div>
                      <label className="block text-[10px] font-mono text-[#6E4B55]/60 mb-1">區域標題 (Title)</label>
                      <input
                        type="text"
                        required
                        value={galleryTitle}
                        onChange={(e) => setGalleryTitle(e.target.value)}
                        className="w-full bg-white border border-[#FF799C]/15 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-[#6E4B55]/60 mb-1">區域描述 (Description)</label>
                      <input
                        type="text"
                        required
                        value={galleryDesc}
                        onChange={(e) => setGalleryDesc(e.target.value)}
                        className="w-full bg-white border border-[#FF799C]/15 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Video Section */}
                  <div className="space-y-2 border border-[#FF799C]/10 p-3.5 rounded-xl bg-white/50 shadow-sm hover:border-[#FF799C]/20 transition-all">
                    <span className="text-xs font-bold text-[#6E4B55] block">🎬 影片專區區域</span>
                    <div>
                      <label className="block text-[10px] font-mono text-[#6E4B55]/60 mb-1">區域標題 (Title)</label>
                      <input
                        type="text"
                        required
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        className="w-full bg-white border border-[#FF799C]/15 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-[#6E4B55]/60 mb-1">區域描述 (Description)</label>
                      <input
                        type="text"
                        required
                        value={videoDesc}
                        onChange={(e) => setVideoDesc(e.target.value)}
                        className="w-full bg-white border border-[#FF799C]/15 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Letters Section */}
                  <div className="space-y-2 border border-[#FF799C]/10 p-3.5 rounded-xl bg-white/50 shadow-sm hover:border-[#FF799C]/20 transition-all">
                    <span className="text-xs font-bold text-[#6E4B55] block">💌 星星信箱區域</span>
                    <div>
                      <label className="block text-[10px] font-mono text-[#6E4B55]/60 mb-1">區域標題 (Title)</label>
                      <input
                        type="text"
                        required
                        value={lettersTitle}
                        onChange={(e) => setLettersTitle(e.target.value)}
                        className="w-full bg-white border border-[#FF799C]/15 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-[#6E4B55]/60 mb-1">區域描述 (Description)</label>
                      <input
                        type="text"
                        required
                        value={lettersDesc}
                        onChange={(e) => setLettersDesc(e.target.value)}
                        className="w-full bg-white border border-[#FF799C]/15 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Museum Section */}
                  <div className="space-y-2 border border-[#FF799C]/10 p-3.5 rounded-xl bg-white/50 shadow-sm hover:border-[#FF799C]/20 transition-all">
                    <span className="text-xs font-bold text-[#6E4B55] block">🎨 美術展覽館區域</span>
                    <div>
                      <label className="block text-[10px] font-mono text-[#6E4B55]/60 mb-1">區域標題 (Title)</label>
                      <input
                        type="text"
                        required
                        value={museumTitle}
                        onChange={(e) => setMuseumTitle(e.target.value)}
                        className="w-full bg-white border border-[#FF799C]/15 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-[#6E4B55]/60 mb-1">區域描述 (Description)</label>
                      <input
                        type="text"
                        required
                        value={museumDesc}
                        onChange={(e) => setMuseumDesc(e.target.value)}
                        className="w-full bg-white border border-[#FF799C]/15 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Music Player Section */}
                  <div className="space-y-2 border border-[#FF799C]/10 p-3.5 rounded-xl bg-white/50 shadow-sm hover:border-[#FF799C]/20 transition-all">
                    <span className="text-xs font-bold text-[#6E4B55] block">🎵 黑膠播放器區域</span>
                    <div>
                      <label className="block text-[10px] font-mono text-[#6E4B55]/60 mb-1">區域標題 (Title)</label>
                      <input
                        type="text"
                        required
                        value={musicTitle}
                        onChange={(e) => setMusicTitle(e.target.value)}
                        className="w-full bg-white border border-[#FF799C]/15 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-[#6E4B55]/60 mb-1">區域描述 (Description)</label>
                      <input
                        type="text"
                        required
                        value={musicDesc}
                        onChange={(e) => setMusicDesc(e.target.value)}
                        className="w-full bg-white border border-[#FF799C]/15 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Pets Section */}
                  <div className="space-y-2 border border-[#FF799C]/10 p-3.5 rounded-xl bg-white/50 shadow-sm hover:border-[#FF799C]/20 transition-all">
                    <span className="text-xs font-bold text-[#6E4B55] block">👾 星寵家園區域</span>
                    <div>
                      <label className="block text-[10px] font-mono text-[#6E4B55]/60 mb-1">區域標題 (Title)</label>
                      <input
                        type="text"
                        required
                        value={petsTitle}
                        onChange={(e) => setPetsTitle(e.target.value)}
                        className="w-full bg-white border border-[#FF799C]/15 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-[#6E4B55]/60 mb-1">區域描述 (Description)</label>
                      <input
                        type="text"
                        required
                        value={petsDesc}
                        onChange={(e) => setPetsDesc(e.target.value)}
                        className="w-full bg-white border border-[#FF799C]/15 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit btn */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#FF799C] to-[#9933ff] hover:opacity-90 text-white font-medium text-sm py-3 rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                立刻套用網站宣告配置
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detailed Lightbox/Audit Modal Overlay */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#6E4B55]/40 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white/95 border border-[#FF799C]/25 max-w-lg w-full p-6 rounded-[28px] shadow-2xl relative text-left text-[#6E4B55] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative top rainbow line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF799C] via-[#FFD2DD] to-[#FF799C]" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#FF799C]/15 text-[#6E4B55]/70 hover:text-[#FF799C] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1.5 text-[#FF799C] text-[10px] font-mono font-bold tracking-wider uppercase mb-2">
                <Sparkles className="h-3 w-3 animate-pulse" />
                <span>待審稿件審核 • {
                  selectedItemType === "photos" ? "📸 相片" : 
                  selectedItemType === "videos" ? "🎬 影片" : 
                  selectedItemType === "letters" ? "💌 信件" : 
                  selectedItemType === "artworks" ? "🎨 畫作" : 
                  selectedItemType === "music" ? "🎵 音樂" : 
                  selectedItemType === "candies" ? "🍬 糖果" : "應援項目"
                }</span>
              </div>

              <h4 className="text-lg font-serif font-bold text-[#6E4B55] leading-snug mb-3">
                {selectedItem.title || "星星同盟信件"}
              </h4>

              {/* Image / Artwork Preview */}
              {(selectedItem.image_url || selectedItem.cover_url) && (
                <div className="rounded-2xl overflow-hidden border border-[#FF799C]/20 bg-[#FFF6F2] mb-4 max-h-60 shadow-inner relative group">
                  <img
                    src={selectedItem.image_url || selectedItem.cover_url}
                    alt=""
                    className="w-full h-full object-contain max-h-60 mx-auto"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Letter / Content body */}
              {selectedItem.content && (
                <div className="bg-[#FFF6F2] border-l-4 border-[#FF799C] p-4 rounded-r-2xl text-sm text-[#6E4B55] italic whitespace-pre-wrap leading-relaxed mb-4 max-h-48 overflow-y-auto font-serif">
                  {selectedItem.content}
                </div>
              )}

              {/* Meta Data Panel */}
              {(() => {
                const authorUser = selectedItem && selectedItem.user_id && selectedItem.user_id !== "anonymous"
                  ? displayedUsers.find((u: any) => u.id === selectedItem.user_id)
                  : null;
                return (
                  <div className="bg-[#FFF6F2]/30 rounded-2xl p-3.5 border border-[#FF799C]/10 text-xs space-y-1.5 text-[#6E4B55]/80 mb-5">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-[#6E4B55]/60">投稿用戶:</span>
                      <div className="text-right">
                        <span className="font-semibold block">@{selectedItem.username || selectedItem.author_name || "匿名同盟"}</span>
                        {authorUser && (
                          <span className="block text-[10px] text-[#6E4B55]/60 font-mono mt-0.5">
                            {authorUser.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-[#6E4B55]/60">稿件分類:</span>
                      <span className="font-mono bg-[#FF799C]/10 text-[#FF799C] px-1.5 py-0.2 rounded text-[10px] font-bold">
                        {selectedItem.category || selectedItem.color_theme || "一般應援"}
                      </span>
                    </div>
                    {selectedItem.video_url && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-[#6E4B55]/60">影片網址:</span>
                        <a
                          href={selectedItem.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#FF799C] hover:underline flex items-center gap-1 font-mono text-[11px]"
                        >
                          開啟外部連結 <Play className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    )}
                    {selectedItem.audio_url && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-[#6E4B55]/60">音源網址:</span>
                        <a
                          href={selectedItem.audio_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#FF799C] hover:underline flex items-center gap-1 font-mono text-[11px]"
                        >
                          聽取黑膠音軌 <Play className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    )}
                    {selectedItem.external_link && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-[#6E4B55]/60">外部來源:</span>
                        <a
                          href={selectedItem.external_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#FF799C] hover:underline flex items-center gap-1 font-mono text-[11px]"
                        >
                          連結 <Play className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-medium text-[#6E4B55]/60">投遞時間:</span>
                      <span className="font-mono">{new Date(selectedItem.created_at).toLocaleString("zh-TW")}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await handleAction(selectedItemType, selectedItem.id, "approve");
                    setSelectedItem(null);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-emerald-600/10"
                >
                  <Check className="h-4 w-4" />
                  <span>核准發布 (+50幣)</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await handleAction(selectedItemType, selectedItem.id, "reject");
                    setSelectedItem(null);
                  }}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-amber-500/10"
                >
                  <X className="h-4 w-4" />
                  <span>不通過退回</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm("確定要將此稿件從資料庫物理抹除嗎？")) {
                      await handleAction(selectedItemType, selectedItem.id, "delete");
                      setSelectedItem(null);
                    }
                  }}
                  className="bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-xl transition-all active:scale-95 cursor-pointer border border-red-100"
                  title="徹底刪除"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
