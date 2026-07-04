import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Check, X, Trash2, Users, FileText, AlertTriangle, Eye, Sparkles, RefreshCw, Layers } from "lucide-react";
import { AdminPending, AdminAllData, User } from "../types";

interface AdminModuleProps {
  currentUser: User | null;
  onRefreshData?: () => void;
}

export default function AdminModule({ currentUser, onRefreshData }: AdminModuleProps) {
  // Tabs: 'pending' (moderation) | 'global_db' | 'site_text'
  const [activeTab, setActiveTab] = useState<"pending" | "global_db" | "site_text">("pending");
  // Sub-category of moderation: 'photos' | 'videos' | 'letters' | 'artworks' | 'music'
  const [modSubTab, setModSubTab] = useState<"photos" | "videos" | "letters" | "artworks" | "music">("photos");

  const [pendingData, setPendingData] = useState<AdminPending | null>(null);
  const [globalData, setGlobalData] = useState<AdminAllData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Simulated Site Text Configurations
  const [heroTitle, setHeroTitle] = useState("Starry Wish Support Platform");
  const [heroSubtitle, setHeroSubtitle] = useState("星願應援站 - 明星與星光同盟的交界處。");
  const [bannerUrl, setBannerUrl] = useState("https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1200");
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

  const fetchPending = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/pending");
      if (res.ok) {
        const data = await res.json();
        setPendingData(data);
      } else {
        setError("無法讀取待審核資料。");
      }
    } catch (err) {
      setError("讀取伺服器待審資料失敗。");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGlobal = async () => {
    try {
      const res = await fetch("/api/admin/all");
      if (res.ok) {
        const data = await res.json();
        setGlobalData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "admin") {
      fetchPending();
      fetchGlobal();
    }
  }, [currentUser, activeTab]);

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
        fetchPending();
        fetchGlobal();
        if (onRefreshData) {
          onRefreshData();
        }
        setTimeout(() => setMessage(""), 2500);
      } else {
        setError("處理失敗，請確認資料狀態。");
      }
    } catch (err) {
      setError("伺服器回應錯誤。");
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

  // Pending item details
  const getModSubList = () => {
    if (!pendingData) return [];
    if (modSubTab === "photos") return pendingData.photos;
    if (modSubTab === "videos") return pendingData.videos;
    if (modSubTab === "letters") return pendingData.letters;
    if (modSubTab === "artworks") return pendingData.artworks;
    if (modSubTab === "music") return pendingData.music;
    return [];
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
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-light text-[#FF799C] tracking-wide flex items-center gap-2">
          <Shield className="h-6 w-6 text-[#FF799C]" />
          星盟管理控台 <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF799C]/10 text-[#FF799C] border border-[#FF799C]/20 uppercase">ADMIN ACTIVE</span>
        </h2>
        <p className="text-xs text-[#6E4B55]/70 mt-1">控制、發布或剔除投稿項目，管理用戶星寵數據，調整主視覺宣告與文字。</p>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex flex-wrap border-b border-[#FF799C]/10 pb-3 mb-6 gap-2">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${activeTab === "pending" ? "bg-[#FF799C] text-white shadow-md shadow-[#FF799C]/15" : "text-[#6E4B55]/70 bg-[#FF799C]/5 hover:bg-[#FF799C]/10"}`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>待審應援盒 ({modItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("global_db")}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${activeTab === "global_db" ? "bg-[#FF799C] text-white shadow-md shadow-[#FF799C]/15" : "text-[#6E4B55]/70 bg-[#FF799C]/5 hover:bg-[#FF799C]/10"}`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>全局應援庫 (Global DB)</span>
        </button>

        <button
          onClick={() => setActiveTab("site_text")}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${activeTab === "site_text" ? "bg-[#FF799C] text-white shadow-md shadow-[#FF799C]/15" : "text-[#6E4B55]/70 bg-[#FF799C]/5 hover:bg-[#FF799C]/10"}`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>修改網站宣告設定</span>
        </button>
      </div>

      {/* Message alerts */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-emerald-500/15 border border-emerald-500/25 text-emerald-200 text-xs rounded-xl flex items-center gap-2 mb-4"
          >
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{message}</span>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-red-500/15 border border-red-500/25 text-red-200 text-xs rounded-xl flex items-center gap-2 mb-4"
          >
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{error}</span>
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
            {/* Moderation subcategories selector */}
            <div className="flex flex-wrap gap-1 bg-white/5 p-1 rounded-xl">
              {(["photos", "videos", "letters", "artworks", "music"] as const).map((sub) => {
                const names = { photos: "相片", videos: "影片", letters: "信件", artworks: "畫作", music: "音樂" };
                return (
                  <button
                    key={sub}
                    onClick={() => setModSubTab(sub)}
                    className={`flex-1 min-w-[70px] text-center text-xs py-2 rounded-lg font-medium transition-all ${modSubTab === sub ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:text-white"}`}
                  >
                    {names[sub]}
                  </button>
                );
              })}
            </div>

            {/* Sub Feed list */}
            {isLoading ? (
              <p className="text-xs text-white/30 font-mono py-12 text-center animate-pulse">載入星光應援佇列...</p>
            ) : modItems.length === 0 ? (
              <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-2xl">
                <Check className="h-10 w-10 text-[#FF799C] mx-auto mb-2 opacity-50" />
                <p className="text-white/60 font-serif">此類別投稿已全部清空！</p>
                <p className="text-white/30 text-[11px] mt-1">目前沒有任何 pending 項目等待審核。辛苦管理員了！</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {modItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex flex-col md:flex-row items-stretch md:items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all gap-4 text-xs"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Optional thumbnail preview */}
                      {(item.image_url || item.cover_url) && (
                        <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 bg-black/40 border border-white/5">
                          <img src={item.image_url || item.cover_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      
                      {/* Letter / content type indicator */}
                      {item.content && (
                        <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-[#FF799C]/15 border border-[#FF799C]/20 text-[#FFCCDD] shrink-0 font-serif font-bold text-lg">
                          信
                        </div>
                      )}

                      <div className="text-left min-w-0">
                        <h4 className="text-white font-serif font-bold text-sm truncate leading-snug">
                          {item.title || item.content?.substring(0, 30) + "..."}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-white/40 text-[10px] font-mono mt-1">
                          <span>由 @{item.username || item.author_name} 投遞</span>
                          <span>•</span>
                          <span>類別: {item.category || item.color_theme || "應援"}</span>
                          <span>•</span>
                          <span>時間: {new Date(item.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Moderation Actions button bar */}
                    <div className="flex gap-2 shrink-0 self-end md:self-auto">
                      <button
                        onClick={() => handleAction(modSubTab, item.id, "approve")}
                        className="bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 hover:text-white px-3.5 py-2 rounded-xl transition-all flex items-center gap-1 active:scale-95"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>核准公開</span>
                      </button>

                      <button
                        onClick={() => handleAction(modSubTab, item.id, "reject")}
                        className="bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 hover:text-white px-3.5 py-2 rounded-xl transition-all flex items-center gap-1 active:scale-95"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>退回</span>
                      </button>

                      <button
                        onClick={() => handleAction(modSubTab, item.id, "delete")}
                        className="bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-red-300 hover:text-white px-3.5 py-2 rounded-xl transition-all flex items-center gap-1 active:scale-95"
                        title="徹底刪除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
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
            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs text-white/70 leading-relaxed text-left flex gap-3.5 items-start">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-400 block mb-0.5">高風險作業警告 (Global Database Manager)</span>
                此面板為全局物理資料庫。你可以強行物理刪除任何已發布、甚至 pending 的同人畫作、照片、音軌、或一般用戶帳號。物理刪除將不可恢復，請確認操作安全。
              </div>
            </div>

            {globalData ? (
              <div className="space-y-6 pt-2">
                {/* Users Management */}
                <div className="space-y-3">
                  <span className="text-xs font-mono tracking-widest text-white/50 uppercase block text-left">
                    STARRY USERS ({globalData.users.length})
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {globalData.users.map((u) => (
                      <div
                        key={u.id}
                        className="flex justify-between items-center p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img src={u.avatar} alt="" className="h-8 w-8 rounded-full border border-white/10 shrink-0" />
                          <div className="text-left">
                            <p className="font-bold text-white font-serif">{u.username}</p>
                            <p className="text-[10px] text-white/40 font-mono">{u.email} • {u.role}</p>
                          </div>
                        </div>

                        {/* Disable delete for active admin */}
                        {u.username !== "admin" && (
                          <button
                            onClick={() => handleAction("users", u.id, "delete")}
                            className="p-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition-all active:scale-95"
                            title="註銷帳戶"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Star Pets Management */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <span className="text-xs font-mono tracking-widest text-white/50 uppercase block text-left">
                    STAR PETS ({globalData.pets.length})
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {globalData.pets.map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between items-center p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs"
                      >
                        <div className="text-left">
                          <p className="font-bold text-white font-serif">{p.name}</p>
                          <p className="text-[10px] text-white/40 font-mono">
                            主子: @{p.owner_name} • LV.{p.level} • {p.type}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAction("pets", p.id, "delete")}
                          className="p-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition-all active:scale-95"
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
              <p className="text-xs text-white/30 font-mono py-12 text-center animate-pulse">連線星盟主資料庫中...</p>
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
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>網站宣告與各區域顯示文字更新成功！首頁與導航欄已同步重寫。</span>
                </div>
              )}

              {/* CORE HERO SECTION */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-4">
                <span className="text-xs font-mono text-[#FF799C] tracking-widest uppercase font-bold block mb-2 border-b border-white/5 pb-1">
                  🌐 首頁主宣告設定 (Hero Area Settings)
                </span>
                
                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1.5">首頁星空大標題 (Hero Title)</label>
                  <input
                    type="text"
                    required
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-[#FF799C] focus:outline-none text-white text-sm px-3.5 py-2.5 rounded-xl transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#FFCCDD]/60 mb-1.5">首頁副標題與宣告 (Hero Subtitle)</label>
                  <textarea
                    required
                    rows={3}
                    value={heroSubtitle}
                    onChange={(e) => setHeroSubtitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-[#FF799C] focus:outline-none text-white text-sm px-3.5 py-2.5 rounded-xl transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1.5">首頁主視覺大背板網址 (Hero Banner URL)</label>
                  <input
                    type="url"
                    required
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-[#FF799C] focus:outline-none text-white text-sm px-3.5 py-2.5 rounded-xl transition-all font-mono"
                  />
                  <span className="text-[10px] text-white/40 mt-1 block">提示：更改此圖片連結，將在下次網頁整理時覆寫首頁大背板。</span>
                </div>
              </div>

              {/* REGION-SPECIFIC TEXT SETTINGS */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-4">
                <span className="text-xs font-mono text-[#FF799C] tracking-widest uppercase font-bold block mb-2 border-b border-white/5 pb-1">
                  🌸 各功能板塊文字設定 (Region Area Content Settings)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Gallery Section */}
                  <div className="space-y-2 border border-white/5 p-3 rounded-xl bg-white/[0.02]">
                    <span className="text-[11px] font-bold text-white/80 block">📸 圖片相簿區域</span>
                    <div>
                      <label className="block text-[10px] font-mono text-white/50 mb-1">區域標題 (Title)</label>
                      <input
                        type="text"
                        required
                        value={galleryTitle}
                        onChange={(e) => setGalleryTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-[#FF799C] focus:outline-none text-white text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-white/50 mb-1">區域描述 (Description)</label>
                      <input
                        type="text"
                        required
                        value={galleryDesc}
                        onChange={(e) => setGalleryDesc(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-[#FF799C] focus:outline-none text-white text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Video Section */}
                  <div className="space-y-2 border border-white/5 p-3 rounded-xl bg-white/[0.02]">
                    <span className="text-[11px] font-bold text-white/80 block">🎬 影片專區區域</span>
                    <div>
                      <label className="block text-[10px] font-mono text-white/50 mb-1">區域標題 (Title)</label>
                      <input
                        type="text"
                        required
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-[#FF799C] focus:outline-none text-white text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-white/50 mb-1">區域描述 (Description)</label>
                      <input
                        type="text"
                        required
                        value={videoDesc}
                        onChange={(e) => setVideoDesc(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-[#FF799C] focus:outline-none text-white text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Letters Section */}
                  <div className="space-y-2 border border-white/5 p-3 rounded-xl bg-white/[0.02]">
                    <span className="text-[11px] font-bold text-white/80 block">💌 星星星箱區域</span>
                    <div>
                      <label className="block text-[10px] font-mono text-white/50 mb-1">區域標題 (Title)</label>
                      <input
                        type="text"
                        required
                        value={lettersTitle}
                        onChange={(e) => setLettersTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-[#FF799C] focus:outline-none text-white text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-white/50 mb-1">區域描述 (Description)</label>
                      <input
                        type="text"
                        required
                        value={lettersDesc}
                        onChange={(e) => setLettersDesc(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-[#FF799C] focus:outline-none text-white text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Museum Section */}
                  <div className="space-y-2 border border-white/5 p-3 rounded-xl bg-white/[0.02]">
                    <span className="text-[11px] font-bold text-white/80 block">🎨 美術展覽館區域</span>
                    <div>
                      <label className="block text-[10px] font-mono text-white/50 mb-1">區域標題 (Title)</label>
                      <input
                        type="text"
                        required
                        value={museumTitle}
                        onChange={(e) => setMuseumTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-[#FF799C] focus:outline-none text-white text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-white/50 mb-1">區域描述 (Description)</label>
                      <input
                        type="text"
                        required
                        value={museumDesc}
                        onChange={(e) => setMuseumDesc(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-[#FF799C] focus:outline-none text-white text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Music Player Section */}
                  <div className="space-y-2 border border-white/5 p-3 rounded-xl bg-white/[0.02]">
                    <span className="text-[11px] font-bold text-white/80 block">🎵 黑膠播放器區域</span>
                    <div>
                      <label className="block text-[10px] font-mono text-white/50 mb-1">區域標題 (Title)</label>
                      <input
                        type="text"
                        required
                        value={musicTitle}
                        onChange={(e) => setMusicTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-[#FF799C] focus:outline-none text-white text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-white/50 mb-1">區域描述 (Description)</label>
                      <input
                        type="text"
                        required
                        value={musicDesc}
                        onChange={(e) => setMusicDesc(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-[#FF799C] focus:outline-none text-white text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Pets Section */}
                  <div className="space-y-2 border border-white/5 p-3 rounded-xl bg-white/[0.02]">
                    <span className="text-[11px] font-bold text-white/80 block">👾 星寵家園區域</span>
                    <div>
                      <label className="block text-[10px] font-mono text-white/50 mb-1">區域標題 (Title)</label>
                      <input
                        type="text"
                        required
                        value={petsTitle}
                        onChange={(e) => setPetsTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-[#FF799C] focus:outline-none text-white text-xs px-2.5 py-2 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-white/50 mb-1">區域描述 (Description)</label>
                      <input
                        type="text"
                        required
                        value={petsDesc}
                        onChange={(e) => setPetsDesc(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-[#FF799C] focus:outline-none text-white text-xs px-2.5 py-2 rounded-lg"
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
    </div>
  );
}
