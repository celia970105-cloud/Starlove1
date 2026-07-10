import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Send, HelpCircle, Gift, ArrowLeft, RefreshCw, Eye, CheckCircle, X, Compass, User
} from "lucide-react";
import { User as UserType, CandyPost } from "../types";
import SocialInteractiveBlock from "./SocialInteractiveBlock";
import { backupCandyToStorageAndUser } from "../lib/syncHelper";

interface CandyJarModuleProps {
  currentUser: UserType | null;
  onRefreshData?: () => void;
  globalRefreshCount?: number;
}

// Pre-defined candy styles for aesthetic rendering
const CANDY_STYLES = [
  { icon: "🍬", color: "from-pink-400 to-rose-300", wrapper: "🎀", shadow: "shadow-pink-300/40", flavor: "草莓起泡糖 🍓" },
  { icon: "🍭", color: "from-amber-400 to-yellow-300", wrapper: "🌀", shadow: "shadow-yellow-300/40", flavor: "波羅蜜蜜桃棒棒糖 🍑" },
  { icon: "🍬", color: "from-purple-400 to-indigo-300", wrapper: "🔮", shadow: "shadow-indigo-300/40", flavor: "星空桑椹跳跳糖 🌌" },
  { icon: "🍬", color: "from-emerald-400 to-teal-300", wrapper: "🌿", shadow: "shadow-emerald-300/40", flavor: "清爽青蘋果薄荷糖 🍏" },
  { icon: "🍭", color: "from-cyan-400 to-blue-300", wrapper: "❄️", shadow: "shadow-cyan-300/40", flavor: "雪地海鹽汽水糖 🧊" },
  { icon: "🍬", color: "from-orange-400 to-amber-300", wrapper: "🍊", shadow: "shadow-orange-300/40", flavor: "極速暖陽橘子軟糖 ☀️" }
];

export default function CandyJarModule({ currentUser, onRefreshData, globalRefreshCount }: CandyJarModuleProps) {
  const [candies, setCandies] = useState<CandyPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"jar" | "submit" | "all">("jar");
  
  // Form State
  const [candyName, setCandyName] = useState("");
  const [analysisContent, setAnalysisContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Preview States
  const [previewTab, setPreviewTab] = useState<"wrapped" | "revealed">("wrapped");
  const [previewStyleIndex, setPreviewStyleIndex] = useState<number | null>(null);

  // Selected candy details
  const [selectedCandy, setSelectedCandy] = useState<CandyPost | null>(null);
  const [isUnwrapping, setIsUnwrapping] = useState(false);
  const [unwrapStep, setUnwrapStep] = useState<"wrapped" | "ripping" | "revealed">("wrapped");

  // Rotating candies inside the jar
  const [displayedCandies, setDisplayedCandies] = useState<CandyPost[]>([]);

  const fetchCandies = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      // Fetch all posts and filter for candies
      const res = await fetch("/api/posts/feed/latest");
      if (res.ok) {
        const data: CandyPost[] = await res.json();
        // The feed returns all posts; let's filter for candies of status === "approved"
        const filtered = data.filter((item: any) => item.type === "candies" && item.status === "approved");
        setCandies(filtered);
        
        // Pick 8 random approved candies to put inside the jar
        updateJarDisplay(filtered);
      } else {
        setErrorMsg("無法讀取糖果罐內容。");
      }
    } catch (err) {
      setErrorMsg("讀取糖果罐失敗，請稍候重試。");
    } finally {
      setIsLoading(false);
    }
  };

  const updateJarDisplay = (allCandies: CandyPost[]) => {
    if (allCandies.length === 0) {
      setDisplayedCandies([]);
      return;
    }
    // Shuffle and slice up to 8 candies
    const shuffled = [...allCandies].sort(() => 0.5 - Math.random());
    setDisplayedCandies(shuffled.slice(0, 8));
  };

  useEffect(() => {
    fetchCandies();
  }, [globalRefreshCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg("");
    setErrorMsg("");

    if (!candyName.trim()) {
      setErrorMsg("請輸入糖果名稱！");
      return;
    }
    if (!analysisContent.trim()) {
      setErrorMsg("請填寫糖點分析內容！");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: candyName,
        content: analysisContent,
        is_anonymous: isAnonymous,
        user_id: currentUser?.id || "anonymous",
        username: currentUser?.username || "Anonymous",
        role: currentUser?.role || "user"
      };

      const res = await fetch("/api/posts/candies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload })
      });

      if (res.ok) {
        const data = await res.json();
        setFeedbackMsg(
          `🎉 糖果投遞成功！${data.coinMessage || "待管理員審核通過後，即可公開於糖果罐中並賺取 50 應援星幣。"}`
        );

        // Synchronize and back up submission content to Supabase Storage and relate inside user data
        if (currentUser && currentUser.email && data.post) {
          try {
            await backupCandyToStorageAndUser(currentUser.email, data.post);
            console.log("🍭 [BACKUP SUCCESS] Candy has been safely backed up to Supabase Storage!");
          } catch (bkErr) {
            console.error("Backup failed during submission:", bkErr);
          }
        }

        setCandyName("");
        setAnalysisContent("");
        setIsAnonymous(false);
        setPreviewStyleIndex(null);
        setPreviewTab("wrapped");
        fetchCandies();
        if (onRefreshData) onRefreshData();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "投遞糖果失敗，請稍後再試。");
      }
    } catch (err) {
      setErrorMsg("連線應援伺服器失敗。");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger candy click and unwrap sequence
  const handleCandyClick = (candy: CandyPost) => {
    setSelectedCandy(candy);
    setIsUnwrapping(true);
    setUnwrapStep("wrapped");

    // Exquisite un-wrapping timing sequences
    setTimeout(() => {
      setUnwrapStep("ripping");
      setTimeout(() => {
        setUnwrapStep("revealed");
      }, 900);
    }, 600);
  };

  const closeUnwrapModal = () => {
    setIsUnwrapping(false);
    setSelectedCandy(null);
    setUnwrapStep("wrapped");
  };

  // Get pseudo-random flavor and visual styles based on candy id hash
  const getCandyStyle = (id: string) => {
    const code = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return CANDY_STYLES[code % CANDY_STYLES.length];
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 text-left text-[#6E4B55]">
      {/* Header Info Card */}
      <div className="glass border border-[#FF799C]/25 rounded-[32px] p-6 md:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#FF799C]/10 rounded-full blur-2xl" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FF799C]/15 rounded-full text-xs font-bold text-[#FF799C]">
              <Gift className="h-3.5 w-3.5" />
              <span>六大應援板塊 • 星願糖果罐</span>
            </div>
            <h2 className="text-3xl font-serif font-black tracking-tight text-[#6E4B55] flex items-center gap-2">
              🍬 糖果罐應援區
            </h2>
            <p className="text-sm text-[#6E4B55]/70 max-w-xl">
              收集少年極與禹的每一顆高甜糖果！在此投遞你發現的舞台、日常甜點細節分析，點擊糖果罐中的繽紛糖果，撕開包裝紙，即可查看同盟們珍藏的心動瞬間。
            </p>
          </div>

          {/* Module navigation pills */}
          <div className="flex p-1 bg-[#FFF6F2] rounded-2xl border border-[#FF799C]/15 shrink-0 self-start md:self-auto shadow-inner">
            <button
              onClick={() => setActiveTab("jar")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === "jar" 
                  ? "bg-[#FF799C] text-white shadow-md shadow-[#FF799C]/20" 
                  : "text-[#6E4B55]/70 hover:text-[#FF799C] hover:bg-[#FF799C]/5"
              }`}
            >
              🏺 打開糖果罐
            </button>
            <button
              onClick={() => setActiveTab("submit")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === "submit" 
                  ? "bg-[#FF799C] text-white shadow-md shadow-[#FF799C]/20" 
                  : "text-[#6E4B55]/70 hover:text-[#FF799C] hover:bg-[#FF799C]/5"
              }`}
            >
              ✍️ 投遞新糖果
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === "all" 
                  ? "bg-[#FF799C] text-white shadow-md shadow-[#FF799C]/20" 
                  : "text-[#6E4B55]/70 hover:text-[#FF799C] hover:bg-[#FF799C]/5"
              }`}
            >
              🔍 所有糖果盒 ({candies.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <AnimatePresence mode="wait">
        {activeTab === "jar" && (
          <motion.div
            key="jar-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center space-y-8"
          >
            {/* The Candy Jar Card */}
            <div className="w-full glass border border-[#FF799C]/20 rounded-[36px] p-8 md:p-12 shadow-lg flex flex-col items-center justify-center relative overflow-hidden">
              {/* Star-lit space backdrop overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDFD]/30 to-[#FFEDEE]/20 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center space-y-6">
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-serif font-bold text-[#6E4B55] flex items-center justify-center gap-1.5">
                    🍭 星願糖果盒
                  </h3>
                  <p className="text-xs text-[#6E4B55]/60">
                    點擊罐子內隨機輪替的彩色糖果，撕開包裝紙，即可查看糖點分析。
                  </p>
                </div>

                {/* Highly Crafted Glass Candy Jar Visualization */}
                <div className="relative flex items-center justify-center p-4">
                  {/* Outer floating sparkles */}
                  <div className="absolute -top-6 -left-6 text-amber-400 text-lg animate-bounce">✨</div>
                  <div className="absolute -bottom-2 -right-4 text-pink-400 text-xl animate-pulse">🌸</div>
                  <div className="absolute top-1/2 -right-8 text-purple-400 text-sm animate-ping">⭐️</div>

                  {/* Glass Jar Body Container */}
                  <div 
                    id="glass-candy-jar"
                    className="relative w-72 h-80 bg-white/25 backdrop-blur-sm rounded-b-[90px] rounded-t-[40px] border-[5px] border-white/95 shadow-2xl flex items-center justify-center overflow-hidden"
                  >
                    {/* Reflective shine overlay */}
                    <div className="absolute top-0 left-4 w-6 h-full bg-white/25 rounded-full blur-[2px] pointer-events-none z-10" />
                    
                    {/* Jar Lid */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-8 bg-gradient-to-r from-pink-400 to-rose-400 rounded-b-xl border-b-[3px] border-white shadow-md z-20 flex items-center justify-center">
                      <div className="w-16 h-2 bg-white/40 rounded-full" />
                    </div>

                    {/* Candies in the jar */}
                    <div className="absolute inset-0 pt-10 pb-4 px-6 flex flex-wrap items-center justify-center content-center gap-4 relative">
                      {displayedCandies.length === 0 ? (
                        <div className="text-center p-4">
                          <p className="text-xs text-[#6E4B55]/40 italic">糖果罐裡目前空空如也，快去投遞第一顆星願糖果吧！🍬</p>
                        </div>
                      ) : (
                        displayedCandies.map((candy, index) => {
                          const style = getCandyStyle(candy.id);
                          // Define randomized bouncing animations
                          const delay = index * 0.15;
                          return (
                            <motion.button
                              key={candy.id}
                              whileHover={{ scale: 1.18, rotate: [0, -6, 6, 0] }}
                              animate={{
                                y: [0, -6, 0],
                                rotate: [0, index % 2 === 0 ? 3 : -3, 0]
                              }}
                              transition={{
                                duration: 3 + (index % 3),
                                repeat: Infinity,
                                repeatType: "reverse",
                                delay: delay
                              }}
                              onClick={() => handleCandyClick(candy)}
                              className={`w-14 h-14 rounded-full bg-gradient-to-br ${style.color} border-2 border-white shadow-md ${style.shadow} flex flex-col items-center justify-center relative cursor-pointer active:scale-90 transition-transform`}
                              title={`糖果名稱: ${candy.title}`}
                            >
                              <span className="text-xl filter drop-shadow">{style.icon}</span>
                              <span className="text-[7px] bg-white/90 border border-[#FF799C]/20 px-1 rounded-full text-[#FF799C] font-mono scale-90 -mt-1 truncate max-w-[48px]">
                                {candy.title}
                              </span>
                              {/* Glitter flare spark */}
                              <span className="absolute top-0.5 right-1 text-[8px] opacity-75">✨</span>
                            </motion.button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Shuffle and Refresh Controls */}
                <div className="flex gap-2 relative z-10">
                  <button
                    type="button"
                    onClick={() => updateJarDisplay(candies)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-pink-50 hover:bg-pink-100 text-[#FF799C] rounded-xl text-xs font-bold border border-pink-100 transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>搖晃糖果罐 (更換糖果)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("submit")}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#FF799C] hover:bg-[#FF799C]/90 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md shadow-[#FF799C]/10"
                  >
                    <span>我要投遞糖果 🍬</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "submit" && (
          <motion.div
            key="submit-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Candy Submission Form */}
            <div className="glass border border-[#FF799C]/20 rounded-[32px] p-6 md:p-8 shadow-lg max-w-5xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab("jar")}
                  className="p-2 rounded-full hover:bg-[#FF799C]/10 text-[#6E4B55]/70 hover:text-[#FF799C] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h3 className="text-lg font-serif font-bold text-[#6E4B55]">🍬 投遞極禹應援糖果</h3>
              </div>

              {feedbackMsg && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-emerald-50 border border-emerald-150 text-emerald-700 text-xs rounded-2xl flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 animate-bounce" />
                  <span>{feedbackMsg}</span>
                </motion.div>
              )}

              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-rose-50 border border-rose-150 text-rose-600 text-xs rounded-2xl flex items-center gap-2"
                >
                  <span className="shrink-0">⚠️</span>
                  <span>{errorMsg}</span>
                </motion.div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Input Form (lg:col-span-7) */}
                <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
                  {/* User Author Name Display */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#6E4B55]/80">投稿者名稱</label>
                    <div className="flex items-center gap-3 bg-[#FFF6F2]/40 border border-[#FF799C]/15 p-3 rounded-xl">
                      <User className="h-4 w-4 text-[#FF799C]" />
                      <div className="text-xs min-w-0 flex-1">
                        {isAnonymous ? (
                          <span className="text-[#6E4B55]/50 italic font-medium">匿名的甜味星星 🍬 (匿名模式)</span>
                        ) : (
                          <span className="font-bold">@{currentUser?.username || "訪客星願支持者"}</span>
                        )}
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold shrink-0 bg-white px-2 py-1 rounded-lg border border-[#FF799C]/10 hover:border-[#FF799C]/30 select-none">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="rounded border-gray-300 text-[#FF799C] focus:ring-[#FF799C] h-3.5 w-3.5"
                        />
                        <span>匿名投遞</span>
                      </label>
                    </div>
                  </div>

                  {/* Candy Title Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#6E4B55]/80">糖果名稱 (Candy Name)</label>
                    <input
                      type="text"
                      value={candyName}
                      onChange={(e) => setCandyName(e.target.value)}
                      placeholder="例如：雙生對唱櫻花爆米花糖、草莓氣泡紙巾糖"
                      className="w-full text-xs p-3.5 bg-white border border-[#FF799C]/15 hover:border-[#FF799C]/30 focus:border-[#FF799C] focus:ring-1 focus:ring-[#FF799C] rounded-xl outline-none transition-all placeholder:text-gray-400"
                      maxLength={40}
                    />
                    <span className="text-[10px] text-[#6E4B55]/40 block text-right font-mono">{candyName.length}/40 字</span>
                  </div>

                  {/* Candy Analysis Content */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#6E4B55]/80">糖點分析內容 (Sugar Analysis Content)</label>
                    <textarea
                      value={analysisContent}
                      onChange={(e) => setAnalysisContent(e.target.value)}
                      placeholder="請詳細寫下極與禹的這顆糖。例如：張極在舞台唱高音對視微笑、澤禹後台吃水果時無比自然的遞紙巾細節... 寫下你的糖點剖析吧！✨"
                      className="w-full text-xs p-3.5 bg-white border border-[#FF799C]/15 hover:border-[#FF799C]/30 focus:border-[#FF799C] focus:ring-1 focus:ring-[#FF799C] rounded-xl outline-none transition-all placeholder:text-gray-400 h-32 resize-none"
                      maxLength={350}
                    />
                    <span className="text-[10px] text-[#6E4B55]/40 block text-right font-mono">{analysisContent.length}/350 字</span>
                  </div>

                  {/* Submission button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#FF799C] hover:bg-[#FF799C]/90 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-[#FF799C]/15 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>將糖果投入罐子 🍬</span>
                  </button>
                </form>

                {/* Right: Live Preview Block (lg:col-span-5) */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-6 lg:border-l lg:border-[#FF799C]/10 lg:pl-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs font-bold text-[#6E4B55]">
                        <Sparkles className="h-4 w-4 text-[#FF799C] animate-pulse" />
                        <span>即時星願預覽</span>
                      </div>
                      
                      {/* Preview tabs */}
                      <div className="flex p-0.5 bg-[#FFF6F2] rounded-lg border border-[#FF799C]/10 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setPreviewTab("wrapped")}
                          className={`px-2.5 py-1 rounded-md transition-all ${
                            previewTab === "wrapped"
                              ? "bg-[#FF799C] text-white shadow-sm"
                              : "text-[#6E4B55]/60 hover:text-[#FF799C]"
                          }`}
                        >
                          🍬 糖果外觀
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewTab("revealed")}
                          className={`px-2.5 py-1 rounded-md transition-all ${
                            previewTab === "revealed"
                              ? "bg-[#FF799C] text-white shadow-sm"
                              : "text-[#6E4B55]/60 hover:text-[#FF799C]"
                          }`}
                        >
                          📖 剝開糖紙
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Candy Style Computation */}
                    {(() => {
                      const activeStyle = previewStyleIndex !== null 
                        ? CANDY_STYLES[previewStyleIndex] 
                        : (() => {
                            if (!candyName.trim()) return CANDY_STYLES[0];
                            const code = candyName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
                            return CANDY_STYLES[code % CANDY_STYLES.length];
                          })();

                      return (
                        <div className="space-y-4">
                          {/* Preview Screen */}
                          <div className="w-full aspect-[4/3] rounded-3xl bg-[#FFF9F9] border border-[#FF799C]/10 flex flex-col items-center justify-center p-6 relative overflow-hidden shadow-inner">
                            {/* Decorative grids for studio mockup vibe */}
                            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#FF799C_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                            
                            <AnimatePresence mode="wait">
                              {previewTab === "wrapped" ? (
                                <motion.div
                                  key="preview-wrapped"
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  className="flex flex-col items-center justify-center space-y-4 text-center z-10"
                                >
                                  {/* Floating wrapper candy */}
                                  <motion.div
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                                    className={`w-20 h-20 rounded-full bg-gradient-to-br ${activeStyle.color} border-4 border-white shadow-xl ${activeStyle.shadow} flex items-center justify-center relative`}
                                  >
                                    <span className="text-4xl filter drop-shadow">{activeStyle.icon}</span>
                                    <span className="absolute top-1 right-2 text-xs">✨</span>
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white/90 border border-pink-100 px-2 py-0.5 rounded-full text-[9px] text-[#FF799C] font-bold shadow-sm shrink-0 whitespace-nowrap">
                                      {activeStyle.flavor.split(" ")[0]}
                                    </div>
                                  </motion.div>

                                  <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-[#6E4B55] max-w-[180px] truncate font-serif">
                                      {candyName.trim() ? `🍬 ${candyName}` : "未命名糖果"}
                                    </h4>
                                    <p className="text-[10px] text-gray-400 italic">
                                      糖果罐中的外觀
                                    </p>
                                  </div>
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="preview-revealed"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="w-full bg-white rounded-2xl p-4 border border-[#FF799C]/10 shadow-md flex flex-col space-y-3 z-10"
                                >
                                  {/* Flavor Tag */}
                                  <div className="flex items-center justify-between border-b border-[#FF799C]/5 pb-2">
                                    <span className="text-[9px] font-mono font-bold text-[#FF799C] bg-[#FF799C]/10 px-2 py-0.5 rounded-full">
                                      {activeStyle.flavor}
                                    </span>
                                    <span className="text-[9px] text-gray-400 font-mono">即時預覽中</span>
                                  </div>

                                  {/* Title */}
                                  <h4 className="text-xs font-black text-[#6E4B55] font-serif">
                                    🍬 {candyName.trim() ? candyName : "星願神秘糖果"}
                                  </h4>

                                  {/* Content */}
                                  <div className="text-[11px] text-[#6E4B55]/80 bg-[#FFFDFD] border border-[#FF799C]/5 p-3 rounded-xl min-h-[64px] max-h-[80px] overflow-y-auto leading-relaxed">
                                    {analysisContent.trim() ? (
                                      <p className="whitespace-pre-line">{analysisContent}</p>
                                    ) : (
                                      <p className="text-gray-400 italic text-[10px]">
                                        請在左側填寫糖點分析，看見甜美字句鋪滿糖紙...🌸
                                      </p>
                                    )}
                                  </div>

                                  {/* Author footer */}
                                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 pt-1 border-t border-[#FF799C]/5">
                                    <span>
                                      @{isAnonymous ? "匿名的星願糖果 🍬" : (currentUser?.username || "訪客星願支持者")}
                                    </span>
                                    <span>Just Now</span>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Flavor Selector */}
                          <div className="space-y-2">
                            <p className="text-[10px] text-[#6E4B55]/60 leading-relaxed">
                              💡 系統預設將依據糖果名稱雜湊生成專屬風味漸層。你也可以在此點選不同風味包裝，手動探索各款包裝質感：
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewStyleIndex(null)}
                                className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                                  previewStyleIndex === null
                                    ? "bg-[#FF799C] text-white border-[#FF799C]"
                                    : "bg-white text-[#6E4B55]/70 border-gray-200 hover:border-[#FF799C]/30"
                                }`}
                              >
                                🪄 名稱自動調配
                              </button>
                              
                              {CANDY_STYLES.map((style, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setPreviewStyleIndex(idx)}
                                  className={`w-6 h-6 rounded-full bg-gradient-to-br ${style.color} border-2 transition-all transform active:scale-90 flex items-center justify-center text-[10px] shadow-sm ${
                                    previewStyleIndex === idx
                                      ? "border-[#6E4B55] scale-110 shadow-md ring-2 ring-[#FF799C]/30"
                                      : "border-white hover:scale-105"
                                  }`}
                                  title={style.flavor}
                                >
                                  {style.icon}
                                </button>
                              ))}
                            </div>
                            {previewStyleIndex !== null && (
                              <p className="text-[9px] text-[#FF799C] font-semibold italic">
                                當前手動切換至：{CANDY_STYLES[previewStyleIndex].flavor}（正式投稿後系統預設仍會採用名稱自動配對的命定風味喔！）
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "all" && (
          <motion.div
            key="all-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* List all approved candies */}
            {candies.length === 0 ? (
              <div className="text-center py-16 bg-[#FFF6F2]/30 border border-dashed border-[#FF799C]/20 rounded-3xl">
                <HelpCircle className="h-10 w-10 text-[#FF799C]/50 mx-auto mb-2 animate-bounce" />
                <p className="text-xs text-[#6E4B55]/50">目前還沒有公開的糖果分析帖。快來投遞第一個好料吧！</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {candies.map((candy) => {
                  const style = getCandyStyle(candy.id);
                  return (
                    <div 
                      key={candy.id}
                      className="glass border border-[#FF799C]/15 hover:border-[#FF799C]/35 rounded-2xl p-5 hover:shadow-md transition-all text-xs flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-[#FF799C] font-bold bg-[#FF799C]/10 px-2 py-0.5 rounded-full">
                            {style.flavor}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {new Date(candy.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 className="text-[#6E4B55] font-serif font-black text-sm">
                          🍬 {candy.title}
                        </h4>

                        <p className="text-[#6E4B55]/80 leading-relaxed line-clamp-3 font-normal">
                          {candy.content}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-[#FF799C]/10 pt-3">
                        <div className="flex items-center gap-1.5 text-gray-500 font-mono text-[10px]">
                          <User className="h-3.5 w-3.5 text-[#FF799C]" />
                          <span>@{candy.is_anonymous ? "匿名的星願糖果 🍬" : candy.username}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCandyClick(candy)}
                          className="text-[#FF799C] font-bold hover:underline flex items-center gap-0.5 text-[10px] cursor-pointer"
                        >
                          <Eye className="h-3 w-3" />
                          <span>剝開糖果</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exquisite Wrapper Ripping / Unwrapping Modal */}
      <AnimatePresence>
        {isUnwrapping && selectedCandy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-lg glass border border-white/60 bg-white/95 rounded-[36px] shadow-2xl p-6 md:p-8 overflow-hidden"
            >
              {/* Top gradient glow bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-400 via-rose-300 to-amber-400" />
              
              {/* Close Button */}
              <button
                type="button"
                onClick={closeUnwrapModal}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-pink-50 text-gray-400 hover:text-[#FF799C] transition-colors z-35 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Ripping Sequence Animations */}
              <AnimatePresence mode="wait">
                {unwrapStep === "wrapped" && (
                  <motion.div
                    key="step-wrapped"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.1, opacity: 0 }}
                    className="py-12 flex flex-col items-center justify-center space-y-4"
                  >
                    <div className="text-6xl animate-pulse">🍬</div>
                    <h4 className="text-base font-serif font-bold text-[#6E4B55]">正在剝開糖果包裝紙...</h4>
                    <p className="text-xs text-[#6E4B55]/50">甜美秘密即將揭曉 🤫</p>
                  </motion.div>
                )}

                {unwrapStep === "ripping" && (
                  <motion.div
                    key="step-ripping"
                    initial={{ rotate: -5, scale: 0.95 }}
                    animate={{ rotate: [5, -5, 5, 0], scale: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="py-12 flex flex-col items-center justify-center space-y-4"
                  >
                    <div className="text-7xl tracking-widest animate-bounce">🎀 ⚡️ 🎀</div>
                    <h4 className="text-sm font-bold text-pink-500 tracking-wider">嘩啦！撕開精美糖果紙！</h4>
                    <p className="text-[10px] text-pink-400 font-mono">RIPPING CANDY WRAPPER...</p>
                  </motion.div>
                )}

                {unwrapStep === "revealed" && (
                  <motion.div
                    key="step-revealed"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5"
                  >
                    {/* Big Reveal Icon */}
                    <div className="flex items-center gap-3 bg-pink-50/70 p-4 rounded-2xl border border-pink-100">
                      <span className="text-4xl filter drop-shadow">🍭</span>
                      <div>
                        <span className="text-[10px] font-mono text-[#FF799C] font-bold bg-[#FF799C]/10 px-2 py-0.5 rounded-full block w-max mb-1">
                          {getCandyStyle(selectedCandy.id).flavor}
                        </span>
                        <h4 className="text-base font-serif font-black text-[#6E4B55]">
                          {selectedCandy.title}
                        </h4>
                      </div>
                    </div>

                    {/* Sugar point analysis Content */}
                    <div className="space-y-2 bg-[#FFF6F2]/30 p-5 rounded-2xl border border-[#FF799C]/10 max-h-48 overflow-y-auto">
                      <p className="text-xs text-[#6E4B55]/90 leading-relaxed font-normal whitespace-pre-line">
                        {selectedCandy.content}
                      </p>
                    </div>

                    {/* Contributor badge */}
                    <div className="flex items-center justify-between text-xs text-gray-500 font-mono border-b border-[#FF799C]/10 pb-3">
                      <div className="flex items-center gap-1.5">
                        <User className="h-4 w-4 text-[#FF799C]" />
                        <span className="font-bold">@{selectedCandy.is_anonymous ? "匿名的星願糖果 🍬" : selectedCandy.username}</span>
                      </div>
                      <span className="text-[11px] text-gray-400">
                        投遞於: {new Date(selectedCandy.created_at).toLocaleString("zh-TW")}
                      </span>
                    </div>

                    {/* Interactive Comments & Likes block */}
                    <div className="p-1 bg-white/70 rounded-2xl">
                      <SocialInteractiveBlock
                        currentUser={currentUser}
                        postId={selectedCandy.id}
                        postType="candies"
                        initialLikes={selectedCandy.likes_count ?? 0}
                        initialFavorites={selectedCandy.favorites_count ?? 0}
                        onUpdateCounts={fetchCandies}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
