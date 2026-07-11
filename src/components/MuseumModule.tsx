import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink, Maximize2, Palette, X, Plus, AlertCircle, Sparkles, Check } from "lucide-react";
import { ArtworkPost, User } from "../types";
import { compressImage } from "../lib/imageCompressor";

interface MuseumModuleProps {
  currentUser: User | null;
  onRefreshData?: () => void;
  globalRefreshCount?: number;
}

export default function MuseumModule({ currentUser, onRefreshData, globalRefreshCount }: MuseumModuleProps) {
  const [artworks, setArtworks] = useState<ArtworkPost[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Submissions state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [category, setCategory] = useState("General");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchArtworks = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [res, catRes] = await Promise.all([
        fetch("/api/posts/artworks"),
        fetch("/api/custom_categories")
      ]);
      if (res.ok) {
        const data = await res.json();
        setArtworks(data);
      } else {
        setError("載入同人美術館失敗，請稍後重試。");
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        const filtered = catData
          .filter((item: any) => item.module === "artworks")
          .map((item: any) => item.category);
        setCustomCategories(filtered);
      }
    } catch (err) {
      setError("連線伺服器失敗。");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedArtwork(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [globalRefreshCount]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setSubmitError("圖片檔案過大，請選擇 10MB 以下的圖片！");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const raw = reader.result as string;
        try {
          const compressed = await compressImage(raw, 1000, 0.75);
          setImageUrl(compressed);
        } catch (err) {
          setImageUrl(raw);
        }
      };
      reader.onerror = () => {
        setSubmitError("讀取圖片檔案失敗，請重試。");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(false);

    if (!title || !imageUrl || !description) {
      setSubmitError("請填寫所有必填欄位 (畫作標題、選擇上傳圖片、創作說明)！");
      return;
    }

    try {
      const finalCategory = isCustomCategory ? (customCategory.trim() || "自定義") : category;
      const payload = {
        title,
        image_url: imageUrl,
        external_link: "",
        description,
        category: finalCategory,
        user_id: currentUser?.id || "anonymous",
        username: currentUser?.username || "Anonymous Visitor",
        role: currentUser?.role || "user"
      };

      const res = await fetch("/api/posts/artworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload })
      });

      if (res.ok) {
        const data = await res.json();
        setSubmitSuccess(true);
        setTitle("");
        setImageUrl("");
        setDescription("");
        setIsCustomCategory(false);
        setCustomCategory("");
        if (currentUser?.role === "admin") {
          fetchArtworks();
        }
        if (onRefreshData) {
          onRefreshData();
        }
        if (data.coinMessage) {
          setTimeout(() => {
            alert(data.coinMessage);
          }, 300);
        }
        setTimeout(() => {
          setShowForm(false);
          setSubmitSuccess(false);
        }, 2000);
      } else {
        const data = await res.json();
        setSubmitError(data.error || "投稿失敗，請確認圖片格式。");
      }
    } catch (err) {
      setSubmitError("伺服器連線中斷。");
    }
  };

  const artworkCategories = Array.from(new Set(["All", "General", ...customCategories]));
  const filteredArtworks = artworks.filter(art => {
    if (selectedCategory === "All") return true;
    return art.category === selectedCategory;
  });

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-mono tracking-[0.3em] text-[#FF799C] uppercase block mb-1">
            ZACK • COELUM ART GALLERY • JEREMY
          </span>
          <h2 className="text-3xl font-serif font-light text-[#FF799C] tracking-wider">
            星願應援美術館 <span className="font-sans text-lg text-[#6E4B55]/50 ml-1">Museum</span>
          </h2>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-[#FF799C] to-[#FFCCDD] hover:opacity-90 text-white px-5 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 shadow-lg shadow-[#FF799C]/25 transition-all active:scale-95 hover:scale-105 cursor-pointer"
        >
          <Palette className="h-4 w-4" />
          <span>投稿手繪同人作品</span>
        </button>
      </div>

      {/* Decorative intro text */}
      <div className="text-left max-w-3xl font-serif italic text-[#6E4B55]/70 border-l-2 border-[#FF799C] pl-4 py-1 text-sm tracking-wide">
        「星願美術館」是由全球粉絲為 Zack、Jeremy 與 Jiyu 共同創作的殿堂。每一幅畫作都是愛與星夜的凝結，帶有浪漫粉嫩的奇幻幻想。
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 pb-2">
        {artworkCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs transition-all ${
              selectedCategory === cat
                ? "bg-[#FF799C] text-white shadow-sm font-semibold"
                : "bg-white/50 hover:bg-white text-[#6E4B55] border border-[#FF799C]/10"
            }`}
          >
            {cat === "All" ? "全部畫作" : cat === "General" ? "一般創作" : cat}
          </button>
        ))}
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-96 bg-[#FFF6F2]/40 border border-[#FF799C]/10 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-[#FFF6F2]/40 border border-[#FF799C]/15 rounded-2xl">
          <AlertCircle className="h-12 w-12 text-[#FF799C] mx-auto mb-3" />
          <p className="text-[#6E4B55] font-serif">{error}</p>
        </div>
      ) : filteredArtworks.length === 0 ? (
        <div className="text-center py-16 bg-[#FFF6F2]/40 border border-[#FF799C]/15 rounded-3xl">
          <Palette className="h-12 w-12 text-[#FF799C] mx-auto mb-3 opacity-40 animate-pulse" />
          <p className="text-[#FF799C] font-serif text-lg">此類別目前空無一物</p>
          <p className="text-[#6E4B55]/60 text-xs mt-1">遞交你的第一幅絕美畫作來裝飾這座浪漫神殿吧！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArtworks.map((art) => (
            <motion.div
              layout
              key={art.id}
              onClick={() => setSelectedArtwork(art)}
              className="group relative flex flex-col p-4 rounded-3xl border border-[#FF799C]/20 hover:border-[#FF799C]/50 transition-all duration-300 bg-white/80 backdrop-blur-md shadow-sm hover:shadow-[0_8px_30px_rgba(255,121,156,0.12)] cursor-pointer"
            >
              {/* Picture Frame with subtle pastel inner glow */}
              <div className="relative overflow-hidden rounded-2xl aspect-[4/3] bg-[#FFF6F2] border-2 border-[#FFCCDD]/40 group-hover:border-[#FF799C]/60 transition-all duration-300">
                <img
                  src={art.image_url}
                  alt={art.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual Trigger Overlay */}
                <div className="absolute inset-0 bg-[#FF799C]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="p-3 rounded-full bg-[#FF799C]/90 text-white shadow-lg transition-transform scale-90 group-hover:scale-100">
                    <Maximize2 className="h-5 w-5" />
                  </span>
                </div>
              </div>

              {/* Title & description preview (Cute Serene style) */}
              <div className="mt-4 text-left flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-serif font-light text-[#6E4B55] tracking-wide line-clamp-1 group-hover:text-[#FF799C] transition-colors">
                    {art.title}
                  </h3>
                  <p className="text-xs text-[#6E4B55]/80 font-sans mt-2 line-clamp-2 leading-relaxed">
                    {art.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#FF799C]/10 flex items-center justify-between text-[11px] text-[#6E4B55]/60">
                  <span className="font-serif italic">畫家: @{art.username}</span>
                  {art.external_link ? (
                    <a
                      href={art.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#FF799C] hover:text-[#FFCCDD] flex items-center gap-1 font-mono hover:underline"
                    >
                      <span>主頁 / Pixiv</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#FF799C]/50">AMSS EXCLUSIVE</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Art Zoom Overlay */}
      <AnimatePresence>
        {selectedArtwork && (
          <div
            onClick={() => setSelectedArtwork(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full bg-white/95 text-[#6E4B55] border border-[#FF799C]/25 rounded-3xl overflow-y-auto max-h-[90vh] md:max-h-[95vh] shadow-2xl p-4 cursor-default scrollbar-thin"
            >
              <button
                onClick={() => setSelectedArtwork(null)}
                className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-[#FFF6F2] text-[#FF799C] hover:bg-[#FF799C]/10 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Artwork display */}
                <div className="md:col-span-7 bg-[#FFF6F2] rounded-2xl overflow-hidden flex items-center justify-center max-h-[75vh] border border-[#FF799C]/10">
                  <img
                    src={selectedArtwork.image_url}
                    alt={selectedArtwork.title}
                    className="object-contain max-h-[75vh] w-full"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Description and Panel */}
                <div className="md:col-span-5 text-left p-4 space-y-5">
                  <div>
                    <h3 className="text-2xl font-serif font-light text-[#FF799C] tracking-wide leading-tight">
                      {selectedArtwork.title}
                    </h3>
                    <div className="h-[2px] w-12 bg-gradient-to-r from-[#FF799C] to-transparent mt-3" />
                  </div>

                  {/* Description text */}
                  <div className="bg-[#FFF6F2]/70 border border-[#FF799C]/10 p-5 rounded-2xl shadow-inner text-[#6E4B55]">
                    <span className="text-[10px] font-mono text-[#FF799C] tracking-widest block mb-2 uppercase">
                      CREATOR DESCRIPTION
                    </span>
                    <p className="text-sm font-sans text-[#6E4B55] leading-relaxed whitespace-pre-wrap font-light">
                      {selectedArtwork.description}
                    </p>
                  </div>

                  {/* Metadata info */}
                  <div className="space-y-2 text-xs text-[#6E4B55]/70 pt-2">
                    <p>創作者：<span className="text-[#6E4B55] font-semibold">@{selectedArtwork.username}</span></p>
                    <p>刊登日期：<span className="text-[#6E4B55]">{new Date(selectedArtwork.created_at).toLocaleDateString()}</span></p>
                    {selectedArtwork.external_link && (
                      <p className="flex items-center gap-1">
                        藝術家個人檔案：
                        <a
                          href={selectedArtwork.external_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#FF799C] hover:underline hover:text-[#FFCCDD] flex items-center gap-0.5 font-mono"
                        >
                          <span>外部連結</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </p>
                    )}
                  </div>



                  <div className="border-t border-[#FF799C]/10 pt-4 text-[10px] font-mono text-[#6E4B55]/40 tracking-widest uppercase">
                    ALL FOR JIYU • ZACK • JEREMY • AMSS GALLERY
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Submission Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white/95 text-[#6E4B55] p-6 rounded-3xl border border-[#FF799C]/25 shadow-2xl relative text-left"
            >
              <h3 className="text-xl font-serif font-light text-[#FF799C] mb-2 flex items-center gap-2">
                <Palette className="h-5 w-5 text-[#FF799C]" />
                同人美術館投稿
              </h3>
              <p className="text-xs text-[#6E4B55]/60 mb-6">
                分享你的同人手繪、手寫企劃、賀圖海報作品：
              </p>

              {!currentUser || currentUser.is_guest ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-[#6E4B55] space-y-4">
                  <div className="h-16 w-16 bg-[#FF799C]/10 text-[#FF799C] rounded-full flex items-center justify-center animate-pulse">
                    <Palette className="h-8 w-8" />
                  </div>
                  <p className="text-base font-semibold font-serif text-[#FF799C]">星光同盟限定功能 💖</p>
                  <p className="text-xs text-[#6E4B55]/70 max-w-xs leading-relaxed">
                    親愛的星星同盟，同人美術館投稿功能僅開放給【已登入使用者】。請先前往「個人中心」註冊或登入您的帳號，即可獲得 50 星星幣並參與星光美術館應援！✨
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="mt-2 px-6 py-2.5 bg-gradient-to-r from-[#FF799C] to-[#FF9EBA] hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    我知道了
                  </button>
                </div>
              ) : submitSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-[#FF799C]">
                  <Check className="h-16 w-16 mb-4 animate-bounce bg-[#FF799C]/10 p-3 rounded-full" />
                  <p className="text-lg font-serif">畫作上傳成功！</p>
                  <p className="text-xs text-[#6E4B55]/60 mt-2">
                    {currentUser?.role === "admin" ? "已直接在美術館登陸掛牆！" : "已送往星光美術館管理部，審核完成後即可正式掛牌。"}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {submitError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-mono text-[#6E4B55]/70 mb-1.5">同人創作標題 *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Zack & Jeremy 的永恆誓言"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-[#FFF6F2]/60 border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-sm px-3.5 py-2.5 rounded-xl transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#6E4B55]/70 mb-1.5">畫作圖片 * (可從相簿上傳，或輸入圖片網址)</label>
                    
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#FF799C]/30 hover:border-[#FF799C] bg-[#FFF6F2]/40 rounded-xl p-4 cursor-pointer transition-all hover:bg-[#FFF6F2]/80 group">
                          <Plus className="h-5 w-5 text-[#FF799C]/70 group-hover:text-[#FF799C] transition-colors" />
                          <span className="text-xs text-[#6E4B55]/70 mt-1">從相簿 / 本機選擇圖片上傳</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6E4B55]/40 text-xs">
                          網址:
                        </div>
                        <input
                          type="text"
                          placeholder="或在此貼上圖片網址..."
                          value={imageUrl.startsWith("data:") ? "" : imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          className="w-full bg-[#FFF6F2]/60 border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-sm pl-11 pr-3.5 py-2.5 rounded-xl transition-all font-mono"
                        />
                      </div>
                    </div>

                    {imageUrl && (
                      <div className="mt-3 relative rounded-xl overflow-hidden border border-[#FF799C]/20 bg-gray-50 h-28 flex items-center justify-center">
                        <img 
                          src={imageUrl} 
                          alt="畫作預覽" 
                          className="h-full w-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => setImageUrl("")}
                          className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all"
                          title="清除圖片"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Category Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-[#6E4B55]/70 mb-1.5">作品分類 *</label>
                      <select
                        value={isCustomCategory ? "Custom" : category}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "Custom") {
                            setIsCustomCategory(true);
                          } else {
                            setIsCustomCategory(false);
                            setCategory(val);
                          }
                        }}
                        className="w-full bg-[#FFF6F2]/60 border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-sm px-3.5 py-2.5 rounded-xl transition-all"
                      >
                        <option value="General">一般創作</option>
                        {customCategories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="Custom">✨ 自定義創作類別 (Custom)</option>
                      </select>
                    </div>

                    {isCustomCategory && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-1.5"
                      >
                        <label className="block text-xs font-mono text-[#6E4B55]/70">請輸入自定義類別名稱</label>
                        <input
                          type="text"
                          required
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          placeholder="例如：同人漫畫、Q版繪圖..."
                          className="w-full bg-[#FFF6F2]/60 border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-xs px-3.5 py-2.5 rounded-xl transition-all"
                        />
                      </motion.div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#6E4B55]/70 mb-1.5">創作說明與設計理念 *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="寫下這幅作品的背景故事、靈感來源、給主唱的寄語... (200字內)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-[#FFF6F2]/60 border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-sm px-3.5 py-2.5 rounded-xl transition-all resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 bg-[#FFF6F2]/80 hover:bg-[#FFF6F2] text-[#6E4B55]/80 hover:text-[#6E4B55] text-sm py-3 rounded-xl transition-all border border-[#FF799C]/10 active:scale-95 cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-[#FF799C] to-[#FFCCDD] hover:opacity-90 text-white font-medium text-sm py-3 rounded-xl shadow-lg shadow-[#FF799C]/25 transition-all active:scale-95 cursor-pointer"
                    >
                      遞交畫作
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
