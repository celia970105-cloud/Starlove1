import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Filter, Eye, Camera, X, Check, Calendar, Tag, AlertCircle, RefreshCw } from "lucide-react";
import { PhotoPost, User } from "../types";
import SocialInteractiveBlock from "./SocialInteractiveBlock";

interface GalleryModuleProps {
  currentUser: User | null;
  onRefreshData?: () => void;
}

export default function GalleryModule({ currentUser, onRefreshData }: GalleryModuleProps) {
  const [photos, setPhotos] = useState<PhotoPost[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters state
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Form Submission State
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [category, setCategory] = useState("Concert");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isReadingFile, setIsReadingFile] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 15MB
    const limitMB = 15;
    if (file.size > limitMB * 1024 * 1024) {
      setSubmitError(`相片檔案大小不能超過 ${limitMB}MB，請選擇較小的應援相片。`);
      setSelectedFileName("");
      setImageUrl("");
      return;
    }

    setSubmitError("");
    setSelectedFileName(file.name);
    setIsReadingFile(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setImageUrl(base64String);
      setIsReadingFile(false);
    };
    reader.onerror = () => {
      setSubmitError("讀取相片檔案失敗，請再試一次。");
      setIsReadingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const categoryLabels: Record<string, string> = {
    All: "全部類別",
    Concert: "演唱會舞台",
    "Sports Meet": "運動會",
    "External Schedule": "外務",
    "Behind the Scenes": "幕後花絮",
    General: "日常應援",
    Fanart: "同人同好繪"
  };

  const categories = ["All", "Concert", "Sports Meet", "External Schedule", "Behind the Scenes", "General"];
  const years = ["All", "2026", "2025", "2024"];

  const fetchPhotos = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/posts/photos");
      if (res.ok) {
        const data = await res.json();
        setPhotos(data);
      } else {
        setError("無法載入相片庫，請稍後重試。");
      }
    } catch (err) {
      setError("無法連線至伺服器。");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  // Filter photos
  const filteredPhotos = photos.filter((photo) => {
    const matchYear = selectedYear === "All" || photo.year === selectedYear;
    const matchCat = selectedCategory === "All" || photo.category === selectedCategory;
    return matchYear && matchCat;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(false);

    if (isReadingFile) {
      setSubmitError("正在處理相片檔案中，請稍候讀取完成再送出。");
      return;
    }

    if (!title || !imageUrl) {
      setSubmitError("請填寫所有必填欄位 (標題、選擇上傳相片)！");
      return;
    }

    try {
      const payload = {
        title,
        image_url: imageUrl,
        year,
        category,
        user_id: currentUser?.id || "anonymous",
        username: currentUser?.username || "Anonymous Visitor",
        role: currentUser?.role || "user"
      };

      const res = await fetch("/api/posts/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload })
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setTitle("");
        setImageUrl("");
        setSelectedFileName("");
        if (currentUser?.role === "admin") {
          fetchPhotos();
        }
        if (onRefreshData) {
          onRefreshData();
        }
        setTimeout(() => {
          setShowForm(false);
          setSubmitSuccess(false);
        }, 2000);
      } else {
        const data = await res.json();
        setSubmitError(data.error || "投稿失敗，請確認檔案格式與大小。");
      }
    } catch (err) {
      setSubmitError("連線伺服器出錯。");
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title with Decors */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-mono tracking-[0.3em] text-[#FF799C] uppercase block mb-1">
            ZACK • PHOTO ARCHIVE • JEREMY
          </span>
          <h2 className="text-3xl font-serif font-light text-[#FF799C] tracking-wide">
            星光應援相簿 <span className="font-sans text-lg text-[#FF799C]/60 ml-1">Gallery</span>
          </h2>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-[#FF799C] to-[#FFCCDD] hover:opacity-90 text-white px-5 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 shadow-lg shadow-[#FF799C]/25 transition-all active:scale-95 hover:scale-105"
        >
          <Camera className="h-4 w-4" />
          <span>投稿珍藏相片</span>
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white/50 border border-[#FF799C]/15 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-4">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-sans transition-all ${selectedCategory === cat ? "bg-[#FF799C] text-white font-medium" : "bg-white/60 hover:bg-white/90 text-[#6E4B55]/80"}`}
              >
                {categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
        </div>

        {/* Year Filter */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#6E4B55]/70">
          <Calendar className="h-4 w-4 text-[#FF799C]" />
          <span>年份：</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white border border-[#FF799C]/20 focus:border-[#FF799C] text-[#6E4B55] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          >
            {years.map((yr) => (
              <option key={yr} value={yr} className="text-[#6E4B55]">
                {yr === "All" ? "全部年份" : `${yr} 年`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 bg-white/40 border border-[#FF799C]/10 animate-pulse rounded-2xl flex flex-col justify-end p-4">
              <div className="h-4 bg-[#FF799C]/10 rounded w-2/3 mb-2" />
              <div className="h-3 bg-[#FF799C]/10 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white/50 border border-[#FF799C]/15 rounded-2xl">
          <AlertCircle className="h-12 w-12 text-[#FF799C] mx-auto mb-3" />
          <p className="text-[#6E4B55] font-serif">{error}</p>
          <button
            onClick={fetchPhotos}
            className="mt-4 px-4 py-2 rounded-full bg-[#FF799C]/10 border border-[#FF799C]/30 text-[#FF799C] text-xs hover:bg-[#FF799C]/20 transition-all"
          >
            重新整理
          </button>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="text-center py-16 bg-white/50 border border-[#FF799C]/15 rounded-3xl">
          <Tag className="h-12 w-12 text-[#FF799C] mx-auto mb-3 opacity-40" />
          <p className="text-[#6E4B55] font-serif text-lg">沒有找到符合條件的星光相片</p>
          <p className="text-[#6E4B55]/50 text-xs mt-1">快來遞交你的第一張珍藏應援吧！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredPhotos.map((photo) => (
            <motion.div
              layout
              key={photo.id}
              className="group relative overflow-hidden h-72 rounded-2xl border border-[#FF799C]/15 bg-white/40 cursor-pointer shadow-sm hover:shadow-md hover:border-[#FF799C]/40 transition-all duration-300"
              onClick={() => setSelectedPhoto(photo)}
            >
              {/* Image */}
              <img
                src={photo.image_url}
                alt={photo.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />

              {/* Shading overlay (cute light pink glow at bottom) */}
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent opacity-90 group-hover:opacity-100 transition-all" />

              {/* Glass Info panel at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-1 group-hover:translate-y-0 transition-transform">
                <div className="flex gap-2 mb-1.5">
                  <span className="text-[10px] font-mono bg-[#FF799C]/10 border border-[#FF799C]/20 text-[#FF799C] px-2 py-0.5 rounded-full">
                    {categoryLabels[photo.category] || photo.category}
                  </span>
                  <span className="text-[10px] font-mono bg-[#FFF6F2]/80 border border-[#FF799C]/10 text-[#6E4B55]/70 px-2 py-0.5 rounded-full">
                    {photo.year}
                  </span>
                </div>
                <h4 className="text-[#6E4B55] font-semibold font-serif text-base line-clamp-1 truncate group-hover:text-[#FF799C] transition-colors">
                  {photo.title}
                </h4>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#FF799C]/10 text-[10px] text-[#6E4B55]/60">
                  <span>投稿者: @{photo.username}</span>
                  <span className="flex items-center gap-1 text-[#FF799C] font-semibold">
                    <Eye className="h-3 w-3" />
                    查看大圖
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl w-full bg-white/95 text-[#6E4B55] border border-[#FF799C]/25 rounded-3xl overflow-hidden p-3 shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-[#FF799C]/10 text-[#FF799C] hover:bg-[#FF799C]/20 hover:scale-105 active:scale-95 transition-all"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Visual */}
                <div className="md:col-span-8 flex justify-center bg-[#FFF6F2] rounded-2xl overflow-hidden max-h-[70vh]">
                  <img
                    src={selectedPhoto.image_url}
                    alt={selectedPhoto.title}
                    className="object-contain max-h-[70vh] w-full"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Metadata */}
                <div className="md:col-span-4 p-4 text-left space-y-4 flex flex-col h-full justify-between">
                  <div className="space-y-4">
                    <div>
                      <div className="flex gap-2 mb-2">
                        <span className="text-xs font-mono bg-[#FF799C]/10 border border-[#FF799C]/20 text-[#FF799C] px-2.5 py-0.5 rounded-full">
                          {categoryLabels[selectedPhoto.category] || selectedPhoto.category}
                        </span>
                        <span className="text-xs font-mono bg-[#FFCCDD]/20 text-[#6E4B55] px-2.5 py-0.5 rounded-full">
                          {selectedPhoto.year}
                        </span>
                      </div>
                      <h3 className="text-xl font-serif font-light text-[#FF799C] tracking-wide leading-snug">
                        {selectedPhoto.title}
                      </h3>
                    </div>

                    <div className="border-t border-[#FF799C]/15 pt-3 space-y-1">
                      <p className="text-xs text-[#6E4B55]/70">
                        投稿人：<span className="text-[#6E4B55] font-semibold">@{selectedPhoto.username}</span>
                      </p>
                      <p className="text-xs text-[#6E4B55]/70">
                        發布日期：<span className="text-[#6E4B55]">{new Date(selectedPhoto.created_at).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>

                  {/* Fully integrated live social block */}
                  <div className="border-t border-[#FF799C]/15 pt-3">
                    <SocialInteractiveBlock
                      currentUser={currentUser}
                      postId={selectedPhoto.id}
                      postType="photos"
                      initialLikes={selectedPhoto.likes_count ?? 0}
                      initialFavorites={selectedPhoto.favorites_count ?? 0}
                      onUpdateCounts={fetchPhotos}
                    />
                  </div>

                  <div className="border-t border-[#FF799C]/15 pt-3 text-[10px] font-mono text-[#6E4B55]/40 leading-relaxed uppercase">
                    ALL FOR JIYU • ZACK • JEREMY • AMSS
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white/95 text-[#6E4B55] p-6 rounded-3xl border border-[#FF799C]/25 shadow-2xl relative"
            >
              <h3 className="text-xl font-serif font-light text-[#FF799C] mb-2 flex items-center gap-2">
                <Camera className="h-5 w-5 text-[#FF799C]" />
                應援相片投稿
              </h3>
              <p className="text-xs text-[#6E4B55]/60 mb-6">
                {currentUser ? `親愛的 ${currentUser.username}，請分享你的珍貴應援照：` : "分享你珍藏的應援照：(非登入用戶投稿需審核)"}
              </p>

              {submitSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-[#FF799C]">
                  <Check className="h-16 w-16 mb-4 animate-bounce bg-[#FF799C]/10 p-3 rounded-full" />
                  <p className="text-lg font-serif">相片上傳成功！</p>
                  <p className="text-xs text-[#6E4B55]/60 mt-2">
                    {currentUser?.role === "admin" ? "管理員直接發布！" : "已送入星光審核箱，審核後即可公開。"}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                  {submitError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-200 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-mono text-[#6E4B55]/70 mb-1.5">相片標題 *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Zack 星光演唱會現場"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-[#FFF6F2]/60 border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-sm px-3.5 py-2.5 rounded-xl transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#6E4B55]/70 mb-1.5">選擇相片檔案 *</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        required={!imageUrl}
                        onChange={handleFileChange}
                        className="hidden"
                        id="photo-file-upload"
                      />
                      <label
                        htmlFor="photo-file-upload"
                        className="flex flex-col items-center justify-center border-2 border-dashed border-[#FF799C]/30 hover:border-[#FF799C] bg-[#FFF6F2]/40 hover:bg-[#FFF6F2]/70 rounded-2xl p-6 cursor-pointer transition-all text-center gap-2 group"
                      >
                        <Camera className="h-8 w-8 text-[#FF799C] opacity-70 group-hover:opacity-100 transition-opacity" />
                        <span className="text-xs font-medium text-[#6E4B55] max-w-xs truncate px-2">
                          {selectedFileName ? `已選擇：${selectedFileName}` : "點擊此處選擇手機相片上傳"}
                        </span>
                        <span className="text-[10px] text-[#6E4B55]/50">
                          支援 JPG, PNG, GIF, WEBP (最大 15MB)
                        </span>
                      </label>
                    </div>
                    {isReadingFile && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-[#FF799C]">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>正在載入並讀取相片中，請稍候...</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-[#6E4B55]/70 mb-1.5">紀錄年份</label>
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full bg-[#FFF6F2]/60 border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-sm px-3.5 py-2.5 rounded-xl transition-all"
                      >
                        <option value="2026" className="text-[#6E4B55]">2026 年</option>
                        <option value="2025" className="text-[#6E4B55]">2025 年</option>
                        <option value="2024" className="text-[#6E4B55]">2024 年</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-[#6E4B55]/70 mb-1.5">相片類別</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-[#FFF6F2]/60 border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-sm px-3.5 py-2.5 rounded-xl transition-all"
                      >
                        <option value="Concert" className="text-[#6E4B55]">演唱會舞台</option>
                        <option value="Sports Meet" className="text-[#6E4B55]">運動會</option>
                        <option value="External Schedule" className="text-[#6E4B55]">外務</option>
                        <option value="Behind the Scenes" className="text-[#6E4B55]">幕後花絮</option>
                        <option value="General" className="text-[#6E4B55]">日常應援</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 bg-[#FFF6F2]/80 hover:bg-[#FFF6F2] text-[#6E4B55]/80 hover:text-[#6E4B55] text-sm py-3 rounded-xl transition-all border border-[#FF799C]/10 active:scale-95"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-[#FF799C] to-[#FFCCDD] hover:opacity-90 text-white font-medium text-sm py-3 rounded-xl shadow-lg shadow-[#FF799C]/25 transition-all active:scale-95"
                    >
                      送出投稿
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
