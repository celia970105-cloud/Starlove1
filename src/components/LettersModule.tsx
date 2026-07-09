import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Eye, X, Mail, CheckCircle, AlertCircle, Heart, Star, Sparkles } from "lucide-react";
import { LetterPost, User } from "../types";
import SocialInteractiveBlock from "./SocialInteractiveBlock";

interface LettersModuleProps {
  currentUser: User | null;
  onRefreshData?: () => void;
  globalRefreshCount?: number;
}

export default function LettersModule({ currentUser, onRefreshData, globalRefreshCount }: LettersModuleProps) {
  const [letters, setLetters] = useState<LetterPost[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<LetterPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Write Letter Form State
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [authorName, setAuthorName] = useState(currentUser?.username || "");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [content, setContent] = useState("");
  const [colorTheme, setColorTheme] = useState("pink");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const themeColors: { [key: string]: { bg: string; border: string; glow: string; text: string; label: string } } = {
    pink: {
      bg: "bg-gradient-to-br from-[#FF799C]/15 to-[#FFCCDD]/5",
      border: "border-[#FF799C]/30",
      glow: "shadow-[0_0_10px_rgba(255,121,156,0.1)]",
      text: "text-[#6E4B55]",
      label: "粉紅星雲 (Pink)"
    },
    indigo: {
      bg: "bg-gradient-to-br from-blue-100/40 to-[#FFF6F2]/30",
      border: "border-blue-200",
      glow: "shadow-[0_0_10px_rgba(99,102,241,0.1)]",
      text: "text-[#6E4B55]",
      label: "溫柔水藍 (Indigo)"
    },
    violet: {
      bg: "bg-gradient-to-br from-violet-100/40 to-[#FFF6F2]/30",
      border: "border-violet-200",
      glow: "shadow-[0_0_10px_rgba(139,92,246,0.1)]",
      text: "text-[#6E4B55]",
      label: "夢境極光 (Violet)"
    },
    amber: {
      bg: "bg-gradient-to-br from-amber-100/40 to-[#FFF6F2]/30",
      border: "border-amber-200",
      glow: "shadow-[0_0_10px_rgba(245,158,11,0.1)]",
      text: "text-[#6E4B55]",
      label: "煦光柔橘 (Amber)"
    },
    emerald: {
      bg: "bg-gradient-to-br from-emerald-100/40 to-[#FFF6F2]/30",
      border: "border-emerald-200",
      glow: "shadow-[0_0_10px_rgba(16,185,129,0.1)]",
      text: "text-[#6E4B55]",
      label: "薄荷微風 (Emerald)"
    }
  };

  const fetchLetters = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/posts/letters");
      if (res.ok) {
        const data = await res.json();
        setLetters(data);
      } else {
        setError("無法載入星願信箱，請稍後重試。");
      }
    } catch (err) {
      setError("無法與伺服器建立連線。");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, [globalRefreshCount]);

  // Set default author name when user state changes
  useEffect(() => {
    if (currentUser) {
      setAuthorName(currentUser.username);
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(false);

    if (!content) {
      setSubmitError("星願信件內容不可為空！");
      return;
    }

    try {
      const payload = {
        author_name: isAnonymous ? "Anonymous Star" : (authorName || "Stardust"),
        content,
        is_anonymous: isAnonymous,
        color_theme: colorTheme,
        user_id: currentUser?.id || "anonymous",
        username: currentUser?.username || "Anonymous",
        role: currentUser?.role || "user"
      };

      const res = await fetch("/api/posts/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload })
      });

      if (res.ok) {
        const data = await res.json();
        setSubmitSuccess(true);
        setContent("");
        setIsAnonymous(false);
        if (currentUser?.role === "admin") {
          fetchLetters();
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
          setShowWriteModal(false);
          setSubmitSuccess(false);
        }, 2000);
      } else {
        const data = await res.json();
        setSubmitError(data.error || "遞交信件失敗，請稍後重試。");
      }
    } catch (err) {
      setSubmitError("伺服器連線中斷。");
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-mono tracking-[0.3em] text-[#FF799C] uppercase block mb-1">
            ZACK • WISH JAR & LETTER BOX • JEREMY
          </span>
          <h2 className="text-3xl font-serif font-light text-[#FF799C] tracking-wide">
            星星應援信箱 <span className="font-sans text-lg text-[#FF799C]/60 ml-1">Letters</span>
          </h2>
        </div>

        <button
          onClick={() => {
            setSubmitError("");
            setShowWriteModal(true);
          }}
          className="bg-gradient-to-r from-[#FF799C] to-[#FFCCDD] hover:opacity-90 text-white px-5 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 shadow-lg shadow-[#FF799C]/25 transition-all active:scale-95 hover:scale-105"
        >
          <Mail className="h-4 w-4" />
          <span>寫一封星光應援信</span>
        </button>
      </div>

      {/* Main Board: Interactive Galaxy Jar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Interactive Star Jar Area (7 Cols) */}
        <div className="lg:col-span-7 bg-white/50 rounded-3xl border border-[#FF799C]/20 p-6 flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden shadow-md">
          {/* Jar Backdrop Graphic */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,121,156,0.1)_0%,transparent_65%)]" />

          {/* Subtitle */}
          <div className="absolute top-4 left-6 flex items-center gap-1.5 text-xs text-[#6E4B55]/70">
            <Sparkles className="h-4.5 w-4.5 text-[#FF799C] animate-pulse" />
            <span className="font-serif">點擊漂浮的星辰閱讀粉絲們的心聲</span>
          </div>

          {/* Star Jar UI container */}
          <div className="relative w-full max-w-[340px] h-[340px] border-4 border-[#FF799C]/30 rounded-b-[100px] rounded-t-[50px] flex items-center justify-center bg-white/60 shadow-[inset_0_0_30px_rgba(255,121,156,0.1)] mt-4">
            {/* Jar Cap */}
            <div className="absolute top-[-16px] left-[25%] right-[25%] h-5 bg-gradient-to-r from-[#FFCCDD] via-[#FF799C] to-[#FFCCDD] rounded-t-xl border-t border-white shadow-md flex items-center justify-center">
              <div className="w-[85%] h-1 bg-white/60 rounded-full top-1 absolute" />
            </div>
            
            {/* Hanging Tag */}
            <div className="absolute top-10 left-[75%] origin-top -rotate-12 px-2 py-1 bg-[#FF799C]/15 border border-[#FF799C]/30 text-[#FFCCDD] rounded text-[9px] font-mono shadow-sm">
              ALL FOR JIYU
            </div>

            {/* Glowing stars inside jar */}
            {isLoading ? (
              <div className="text-center text-xs font-mono text-white/30">星雲信封封裝中...</div>
            ) : letters.length === 0 ? (
              <div className="text-center p-6 text-[#6E4B55]/50 text-xs font-serif max-w-xs leading-relaxed">
                星星罐此時是空的。<br />
                寫下第一封信裝進去，投射到浩瀚的星河吧！
              </div>
            ) : (
              <div className="absolute inset-x-4 inset-y-10">
                {letters.slice(0, 16).map((letter, idx) => {
                  // Standard math deterministic layout inside the jar bounding box
                  const angles = [
                    { t: 15, l: 30 }, { t: 30, l: 65 }, { t: 45, l: 20 }, { t: 55, l: 50 },
                    { t: 70, l: 75 }, { t: 80, l: 35 }, { t: 25, l: 45 }, { t: 62, l: 15 },
                    { t: 40, l: 80 }, { t: 82, l: 60 }, { t: 10, l: 60 }, { t: 48, l: 42 },
                    { t: 72, l: 48 }, { t: 90, l: 48 }, { t: 35, l: 15 }, { t: 65, l: 70 }
                  ];
                  const pos = angles[idx % angles.length];
                  const colorMap: { [key: string]: string } = {
                    pink: "text-[#FF799C] drop-shadow-[0_0_8px_rgba(255,121,156,0.8)]",
                    indigo: "text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]",
                    violet: "text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]",
                    amber: "text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]",
                    emerald: "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                  };
                  const colorClass = colorMap[letter.color_theme] || colorMap.pink;

                  return (
                    <motion.button
                      key={letter.id}
                      onClick={() => setSelectedLetter(letter)}
                      className={`absolute cursor-pointer p-1 rounded-full hover:scale-125 transition-all ${colorClass}`}
                      style={{ top: `${pos.t}%`, left: `${pos.l}%` }}
                      animate={{
                        y: [0, -6, 0],
                        scale: [1, 1.15, 1]
                      }}
                      transition={{
                        duration: 3 + (idx % 3),
                        repeat: Infinity,
                        delay: idx * 0.25,
                        ease: "easeInOut"
                      }}
                      title={letter.is_anonymous ? "匿名信" : `@${letter.author_name} 的信`}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Scrollable Cards Panel (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col h-full space-y-4">
          <div className="bg-white/50 p-5 rounded-3xl border border-[#FF799C]/15 flex-1 flex flex-col min-h-[450px]">
            <span className="text-xs font-mono tracking-widest text-[#6E4B55]/50 text-left block mb-4 uppercase">
              RECENT LETTERS ({letters.length})
            </span>

            <div className="space-y-3 overflow-y-auto max-h-[400px] flex-1 pr-1.5">
              {isLoading ? (
                <div className="text-center py-12 text-xs font-mono text-[#6E4B55]/40">載入信件列表中...</div>
              ) : letters.length === 0 ? (
                <div className="text-center py-12 text-xs font-serif text-[#6E4B55]/40">尚未收到應援來信</div>
              ) : (
                letters.map((letter) => {
                  const theme = themeColors[letter.color_theme] || themeColors.pink;
                  return (
                    <div
                      key={letter.id}
                      onClick={() => setSelectedLetter(letter)}
                      className={`p-4 rounded-2xl border ${theme.bg} ${theme.border} text-left transition-all hover:scale-[1.02] active:scale-98 cursor-pointer relative group`}
                    >
                      {/* Heart accent */}
                      <Heart className="absolute top-4 right-4 h-4 w-4 text-white/20 group-hover:text-[#FF799C]/50 transition-all" />

                      <div className="text-xs text-white/40 font-mono mb-2">
                        {new Date(letter.created_at).toLocaleDateString()}
                      </div>
                      
                      <p className="text-white font-sans text-sm line-clamp-2 leading-relaxed mb-3">
                        {letter.content}
                      </p>

                      <div className="flex justify-between items-center pt-2 border-t border-white/5 text-[11px]">
                        <span className="text-[#FFCCDD] font-medium font-serif">
                          — {letter.is_anonymous ? "匿名星願" : letter.author_name}
                        </span>
                        <span className="text-white/30 text-[10px] uppercase font-mono">
                          read letter
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Letter View Modal */}
      <AnimatePresence>
        {selectedLetter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`w-full max-w-lg p-8 rounded-3xl border ${themeColors[selectedLetter.color_theme]?.bg || themeColors.pink.bg} ${themeColors[selectedLetter.color_theme]?.border || themeColors.pink.border} ${themeColors[selectedLetter.color_theme]?.glow || themeColors.pink.glow} relative text-left shadow-2xl overflow-hidden`}
            >
              {/* Envelope liner pattern */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

              <button
                onClick={() => setSelectedLetter(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 mb-4 text-[#FF799C]">
                <Star className="h-5 w-5 fill-current" />
                <span className="text-xs font-mono tracking-[0.2em] uppercase font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF799C] to-white">
                  ALL FOR JIYU • ZACK & JEREMY
                </span>
              </div>

              {/* Envelope paper content */}
              <div className="bg-white/90 backdrop-blur-md border border-[#FF799C]/20 p-6 rounded-2xl min-h-[160px] flex flex-col justify-between relative shadow-inner text-[#6E4B55] mb-4">
                <p className="text-[#6E4B55] text-sm font-sans leading-relaxed whitespace-pre-wrap font-light">
                  {selectedLetter.content}
                </p>

                <div className="text-right mt-6 pt-4 border-t border-[#FF799C]/10">
                  <span className="text-xs text-[#6E4B55]/50 block font-mono">
                    {new Date(selectedLetter.created_at).toLocaleString()}
                  </span>
                  <span className="text-base font-serif font-semibold text-[#FF799C] italic block mt-1">
                    — {selectedLetter.is_anonymous ? "匿名的星願支持者" : selectedLetter.author_name}
                  </span>
                </div>
              </div>

              {/* Fully integrated live social block */}
              <div className="bg-white/90 backdrop-blur-md border border-[#FF799C]/20 p-4 rounded-2xl">
                <SocialInteractiveBlock
                  currentUser={currentUser}
                  postId={selectedLetter.id}
                  postType="letters"
                  initialLikes={selectedLetter.likes_count ?? 0}
                  initialFavorites={selectedLetter.favorites_count ?? 0}
                  onUpdateCounts={fetchLetters}
                />
              </div>

              <div className="mt-6 flex justify-between items-center text-[10px] font-mono text-[#6E4B55]/40 uppercase tracking-widest">
                <span>STAR WISH PLATFORM</span>
                <span>DESIGN BY AMSS</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Write Letter Modal */}
      <AnimatePresence>
        {showWriteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white/95 text-[#6E4B55] p-6 rounded-3xl border border-[#FF799C]/25 shadow-2xl relative text-left"
            >
              <h3 className="text-xl font-serif font-light text-[#FF799C] mb-2 flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#FF799C]" />
                撰寫星光信封
              </h3>
              <p className="text-xs text-[#6E4B55]/60 mb-6">
                寫下你的祝福，信件將以星願形式寄入漂浮星罐中：
              </p>

              {!currentUser || currentUser.is_guest ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-[#6E4B55] space-y-4">
                  <div className="h-16 w-16 bg-[#FF799C]/10 text-[#FF799C] rounded-full flex items-center justify-center animate-pulse">
                    <Mail className="h-8 w-8" />
                  </div>
                  <p className="text-base font-semibold font-serif text-[#FF799C]">星光同盟限定功能 💖</p>
                  <p className="text-xs text-[#6E4B55]/70 max-w-xs leading-relaxed">
                    親愛的星星同盟，撰寫星光信封僅開放給【已登入使用者】。請先前往「個人中心」註冊或登入您的帳號，即可獲得 50 星星幣並參與星星信箱祝福！✨
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowWriteModal(false)}
                    className="mt-2 px-6 py-2.5 bg-gradient-to-r from-[#FF799C] to-[#FF9EBA] hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    我知道了
                  </button>
                </div>
              ) : submitSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-[#FF799C]">
                  <CheckCircle className="h-16 w-16 mb-4 animate-bounce" />
                  <p className="text-lg font-serif">祝福信件已封裝！</p>
                  <p className="text-xs text-[#6E4B55]/60 mt-2">
                    {currentUser?.role === "admin" ? "已直接放入星星罐中。" : "已送入應援審核箱，審核後星星即會亮起發光。"}
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

                  {/* Author Pen Name */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-mono text-[#6E4B55]/70">信封署名 Pen name</label>
                      <label className="flex items-center gap-1 cursor-pointer text-[10px] text-[#6E4B55]/50 hover:text-[#FF799C]">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="rounded text-[#FF799C] focus:ring-0 h-3 w-3"
                        />
                        <span>匿名投稿 (Anonymous)</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      disabled={isAnonymous}
                      placeholder={isAnonymous ? "匿名星願" : "e.g. 滿天繁星"}
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full bg-[#FFF6F2]/60 border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-sm px-3.5 py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Letter Content */}
                  <div>
                    <label className="block text-xs font-mono text-[#6E4B55]/70 mb-1.5">星願祝福內容 *</label>
                    <textarea
                      required
                      rows={5}
                      maxLength={240}
                      placeholder="寫下給 Zack、Jeremy、Jiyu 的心靈寄語... (240字內)"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full bg-[#FFF6F2]/60 border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-sm px-3.5 py-2.5 rounded-xl transition-all resize-none"
                    />
                    <div className="text-[10px] text-[#6E4B55]/40 text-right mt-1">
                      {content.length}/240 字
                    </div>
                  </div>

                  {/* Nebula Color selection */}
                  <div>
                    <label className="block text-xs font-mono text-[#6E4B55]/70 mb-2">信封星雲色系</label>
                    <div className="grid grid-cols-5 gap-2">
                      {Object.keys(themeColors).map((themeName) => {
                        const theme = themeColors[themeName];
                        const circleColorMap: { [key: string]: string } = {
                          pink: "bg-[#FF799C] shadow-pink-500/25",
                          indigo: "bg-blue-300 shadow-indigo-500/25",
                          violet: "bg-violet-300 shadow-violet-500/25",
                          amber: "bg-amber-300 shadow-amber-500/25",
                          emerald: "bg-emerald-300 shadow-emerald-500/25"
                        };
                        return (
                          <button
                            key={themeName}
                            type="button"
                            onClick={() => setColorTheme(themeName)}
                            className={`h-8 rounded-xl flex items-center justify-center transition-all ${circleColorMap[themeName]} shadow-sm active:scale-90 ${colorTheme === themeName ? "ring-2 ring-[#FF799C] scale-105" : "opacity-70 hover:opacity-100"}`}
                            title={theme.label}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit and Cancel Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowWriteModal(false)}
                      className="flex-1 bg-[#FFF6F2]/80 hover:bg-[#FFF6F2] text-[#6E4B55]/80 hover:text-[#6E4B55] text-sm py-3 rounded-xl transition-all border border-[#FF799C]/10 active:scale-95"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-[#FF799C] to-[#FFCCDD] hover:opacity-90 text-white font-medium text-sm py-3 rounded-xl shadow-lg shadow-[#FF799C]/25 transition-all active:scale-95"
                    >
                      放進星星罐
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
