import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Timer, Award, History, Calendar, Flame, Coins, RefreshCw, X, Shield, Star, Sparkles } from "lucide-react";
import { User } from "../types";

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export default function LeaderboardModal({ isOpen, onClose, currentUser }: LeaderboardModalProps) {
  const [activeTab, setActiveTab] = useState<"current" | "alltime" | "history">("current");
  const [currentData, setCurrentData] = useState<{
    date: string;
    leaderboard: any[];
    currentUserStats: any;
  } | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState("");

  // Countdown timer to 00:00 local time
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); // 00:00 tomorrow
      
      const diffMs = tomorrow.getTime() - now.getTime();
      if (diffMs <= 0) {
        setCountdown("00:00:00");
        return;
      }
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      const pad = (n: number) => String(n).padStart(2, "0");
      setCountdown(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchCurrentLeaderboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/leaderboard/current");
      if (res.ok) {
        const data = await res.json();
        setCurrentData(data);
      }
    } catch (err) {
      console.error("Failed to fetch current leaderboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaderboardHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/leaderboard/history");
      if (res.ok) {
        const data = await res.json();
        setHistoryData(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCurrentLeaderboard();
      fetchLeaderboardHistory();
    }
  }, [isOpen]);

  const handleRefresh = () => {
    if (activeTab === "current") {
      fetchCurrentLeaderboard();
    } else if (activeTab === "history") {
      fetchLeaderboardHistory();
    } else {
      fetchCurrentLeaderboard();
      fetchLeaderboardHistory();
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}分${secs}秒` : `${mins}分鐘`;
  };

  // Dynamically calculate the overall All-Time Leaderboard
  const getAllTimeLeaderboard = () => {
    const userMap: Record<string, {
      id: string;
      username: string;
      avatar: string;
      activeSeconds: number;
      submissions: number;
      score: number;
    }> = {};

    // 1. Add current daily data
    if (currentData && currentData.leaderboard) {
      currentData.leaderboard.forEach((u: any) => {
        if (!userMap[u.id]) {
          userMap[u.id] = {
            id: u.id,
            username: u.username,
            avatar: u.avatar || "",
            activeSeconds: 0,
            submissions: 0,
            score: 0,
          };
        }
        userMap[u.id].activeSeconds += (u.activeSeconds || 0);
        userMap[u.id].submissions += (u.submissions || 0);
        userMap[u.id].score += (u.score || 0);
      });
    }

    // 2. Add historical data
    if (historyData) {
      historyData.forEach((day: any) => {
        if (day.topTen) {
          day.topTen.forEach((u: any) => {
            if (!userMap[u.id]) {
              userMap[u.id] = {
                id: u.id,
                username: u.username,
                avatar: u.avatar || "",
                activeSeconds: 0,
                submissions: 0,
                score: 0,
              };
            }
            userMap[u.id].activeSeconds += (u.activeSeconds || 0);
            userMap[u.id].submissions += (u.submissions || 0);
            userMap[u.id].score += (u.score || 0);
            if (u.username) userMap[u.id].username = u.username;
            if (u.avatar) userMap[u.id].avatar = u.avatar;
          });
        }
      });
    }

    // 3. Sort by score
    return Object.values(userMap)
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));
  };

  // Helper to render decorative avatar for Top 3 ranked users
  const renderAvatarWithDecoration = (user: any, rank: number) => {
    let ringClass = "border border-pink-100 bg-pink-50";
    let ornament = null;
    let glowEffect = "";

    if (rank === 1) {
      ringClass = "ring-4 ring-[#FFD700] bg-yellow-50/50 scale-105 z-10";
      glowEffect = "shadow-[0_0_15px_rgba(250,204,21,0.6)]";
      ornament = (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 drop-shadow-md animate-bounce" style={{ animationDuration: "2.5s" }}>
          <span className="text-xl">👑</span>
        </div>
      );
    } else if (rank === 2) {
      ringClass = "ring-4 ring-[#C0C0C0] bg-slate-50/50 scale-102 z-10";
      glowEffect = "shadow-[0_0_12px_rgba(192,192,192,0.5)]";
      ornament = (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 drop-shadow-sm">
          <span className="text-lg">✨</span>
        </div>
      );
    } else if (rank === 3) {
      ringClass = "ring-4 ring-[#CD7F32] bg-amber-50/50 scale-100 z-10";
      glowEffect = "shadow-[0_0_10px_rgba(205,127,50,0.4)]";
      ornament = (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 drop-shadow-sm">
          <span className="text-md">🌟</span>
        </div>
      );
    }

    return (
      <div className="relative">
        {ornament}
        <div className={`h-11 w-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center transition-all ${ringClass} ${glowEffect}`}>
          {user.avatar ? (
            <img src={user.avatar} alt="avatar" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="text-xs font-bold text-[#FF799C] font-mono">🌟</span>
          )}
        </div>
        {rank <= 3 && (
          <div className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-[#FF799C] to-[#FFCCDD] border border-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center text-white shadow-sm">
            {rank}
          </div>
        )}
      </div>
    );
  };

  const allTimeLeaderboard = getAllTimeLeaderboard();
  const myAllTimeItem = currentUser ? allTimeLeaderboard.find(u => u.id === currentUser.id) : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm modal-open-layer">
      {/* Background closer */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-[#FFFDFD] rounded-[36px] border border-[#FF799C]/25 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] text-[#6E4B55] z-10"
      >
        {/* Soft elegant design accent overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#FF799C_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF799C]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-100/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-[#FF799C]/10 flex justify-between items-start shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#FF799C] to-[#FFCCDD] flex items-center justify-center shadow-lg shadow-[#FF799C]/15 text-white">
              <Trophy className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-[0.2em] text-[#FF799C] block font-bold uppercase">
                ACTIVE LEADERBOARD
              </span>
              <h2 className="text-lg font-serif font-semibold tracking-wide text-[#FF799C] flex items-center gap-1">
                <span>極禹星光活躍排行榜</span>
                <span className="text-xs">✦</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 rounded-xl border border-pink-100 bg-white hover:bg-pink-50/50 hover:border-[#FF799C]/30 text-[#FF799C] transition-all disabled:opacity-50 active:scale-95"
              title="重新整理排行"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-gray-100 bg-white hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-500 transition-all active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Daily Countdown Notice */}
        <div className="px-6 py-2.5 bg-gradient-to-r from-[#FFF6F2] to-white border-b border-[#FF799C]/5 flex flex-wrap items-center justify-between text-xs font-medium text-[#6E4B55]/90 shrink-0 gap-2">
          <div className="flex items-center gap-1.5">
            <Timer className="h-4 w-4 text-[#FF799C] shrink-0" />
            <span>每日排行榜於 <span className="font-bold text-[#FF799C]">00:00</span> 結算歸零重計，不可累積</span>
          </div>
          <div className="flex items-center gap-1 bg-[#FF799C]/10 border border-[#FF799C]/20 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold text-[#FF799C]">
            <span>距離結算還剩：</span>
            <span>{countdown}</span>
          </div>
        </div>

        {/* Custom Tab Switcher */}
        <div className="px-6 py-3 border-b border-[#FF799C]/5 flex justify-between items-center bg-[#FFFDFD] shrink-0">
          <div className="flex p-0.5 bg-[#FFF6F2] rounded-xl border border-[#FF799C]/10 text-xs font-bold w-full max-w-md">
            <button
              onClick={() => setActiveTab("current")}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "current"
                  ? "bg-[#FF799C] text-white shadow-md"
                  : "text-[#6E4B55]/60 hover:text-[#FF799C]"
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              <span>本日榜單</span>
            </button>
            <button
              onClick={() => setActiveTab("alltime")}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "alltime"
                  ? "bg-[#FF799C] text-white shadow-md"
                  : "text-[#6E4B55]/60 hover:text-[#FF799C]"
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>歷史總榜</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "history"
                  ? "bg-[#FF799C] text-white shadow-md"
                  : "text-[#6E4B55]/60 hover:text-[#FF799C]"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>歷史殿堂 🏛️</span>
            </button>
          </div>

          <div className="hidden sm:block text-[11px] text-gray-400 italic">
            {activeTab === "current" ? "實時刷新統計 ⚡" : activeTab === "alltime" ? "全體歷史累積 🏆" : "歷史紀錄由 Supabase 妥善保存 🔒"}
          </div>
        </div>

        {/* Modal Scroll Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 bg-[#FFFDFD]">
          {isLoading && !currentData && !historyData.length ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <RefreshCw className="h-8 w-8 text-[#FF799C] animate-spin" />
              <p className="text-xs text-gray-400">正在加載最新星願數據...</p>
            </div>
          ) : activeTab === "current" ? (
            /* --- TODAY'S RANKINGS TAB --- */
            <div className="space-y-4">
              {/* Rewards Information Banner */}
              <div className="bg-[#FFF6F2]/70 border border-[#FF799C]/20 rounded-2xl p-4 text-xs space-y-2 leading-relaxed">
                <div className="font-bold text-[#FF799C] flex items-center gap-1">
                  <Coins className="h-4 w-4" />
                  <span>每日前十名自動獎勵星星幣說明：</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#6E4B55]/80">
                  <div className="bg-white/60 p-2 rounded-lg border border-pink-100/50">🥇 第一名：<span className="font-bold text-[#FF799C]">+1000 🪙</span></div>
                  <div className="bg-white/60 p-2 rounded-lg border border-pink-100/50">🥈 第二名：<span className="font-bold text-[#FF799C]">+800 🪙</span></div>
                  <div className="bg-white/60 p-2 rounded-lg border border-pink-100/50">🥉 第三名：<span className="font-bold text-[#FF799C]">+600 🪙</span></div>
                  <div className="bg-white/60 p-2 rounded-lg border border-pink-100/50">🏅 第4-10名：<span className="font-bold text-[#FF799C]">+400~200 🪙</span></div>
                </div>
                <div className="text-[10px] text-gray-400 mt-1 italic">
                  💡 活跃分 = 網站在線活動秒數 + (今日投稿次數 * 300分)。必須在網頁上有互動（鍵盤、滑鼠、觸控），開著掛機刷時間不予計分！
                </div>
              </div>

              {/* Leaderboard List */}
              <div className="space-y-2.5">
                {!currentData || currentData.leaderboard.length === 0 ? (
                  <div className="text-center py-12 bg-[#FFF6F2]/20 rounded-2xl border border-dashed border-[#FF799C]/20">
                    <p className="text-xs text-gray-400 italic">今日暫無用戶活躍上榜，快去體驗互動並投遞你的首個星願糖果吧！🍬</p>
                  </div>
                ) : (
                  currentData.leaderboard.map((user: any, index: number) => {
                    const isCurrentUser = currentUser && user.id === currentUser.id;
                    const rank = index + 1;
                    return (
                      <div
                        key={user.id}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                          isCurrentUser
                            ? "bg-[#FF799C]/5 border-[#FF799C]/40 shadow-[0_4px_12px_rgba(255,121,156,0.08)]"
                            : "bg-white border-pink-100/40 hover:border-[#FF799C]/20 hover:bg-pink-50/10"
                        }`}
                      >
                        {/* Rank Badge */}
                        <div className="w-8 flex items-center justify-center shrink-0">
                          {rank === 1 ? (
                            <span className="text-2xl filter drop-shadow">🥇</span>
                          ) : rank === 2 ? (
                            <span className="text-2xl filter drop-shadow">🥈</span>
                          ) : rank === 3 ? (
                            <span className="text-2xl filter drop-shadow">🥉</span>
                          ) : (
                            <span className="text-xs font-mono font-black text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                              #{rank}
                            </span>
                          )}
                        </div>

                        {/* Animated & Decorated Avatar */}
                        {renderAvatarWithDecoration(user, rank)}

                        {/* User Details */}
                        <div className="flex-1 min-w-0 ml-1">
                          <h4 className="text-xs font-bold truncate flex items-center gap-1.5">
                            <span className={isCurrentUser ? "text-[#FF799C]" : "text-[#6E4B55]"}>
                              {user.username}
                            </span>
                            {isCurrentUser && (
                              <span className="bg-[#FF799C] text-white text-[8px] font-black px-1.5 py-0.5 rounded-full font-mono scale-90">
                                YOU
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-1 font-mono">
                            <span>🕒 在線活躍：{formatDuration(user.activeSeconds)}</span>
                            <span>✍️ 投稿次數：{user.submissions}</span>
                          </div>
                        </div>

                        {/* Total Score Badge */}
                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-black text-[#FF799C] bg-[#FF799C]/10 border border-[#FF799C]/15 px-3 py-1.5 rounded-xl">
                            {user.score} pts
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : activeTab === "alltime" ? (
            /* --- ALL-TIME ACCUMULATED BOARD TAB --- */
            <div className="space-y-4">
              {/* All-time Stats Information Banner */}
              <div className="bg-gradient-to-r from-yellow-50/70 to-[#FFFDFD] border border-amber-200/50 rounded-2xl p-4 text-xs space-y-2 leading-relaxed">
                <div className="font-bold text-amber-700 flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-amber-500 animate-spin-slow" />
                  <span>星光守護者殿堂「歷史累積總榜」：</span>
                </div>
                <p className="text-[11px] text-[#6E4B55]/80">
                  統計所有已結算的每日歷史記錄與今日即時活躍度。為極禹的璀璨星河奉獻愛意的每一秒、每一次投稿都將被永久累積記錄！
                </p>
              </div>

              {/* All-time list */}
              <div className="space-y-2.5">
                {allTimeLeaderboard.length === 0 ? (
                  <div className="text-center py-12 bg-amber-50/10 rounded-2xl border border-dashed border-amber-200">
                    <p className="text-xs text-gray-400 italic">暫無歷史活躍累積數據。當您開始參與星空互動，數據將在此處累加展示！✨</p>
                  </div>
                ) : (
                  allTimeLeaderboard.map((user: any, index: number) => {
                    const isCurrentUser = currentUser && user.id === currentUser.id;
                    const rank = index + 1;
                    return (
                      <div
                        key={`alltime-${user.id}`}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                          isCurrentUser
                            ? "bg-amber-50/30 border-amber-300 shadow-[0_4px_12px_rgba(245,158,11,0.08)]"
                            : "bg-white border-pink-100/40 hover:border-[#FF799C]/20 hover:bg-pink-50/10"
                        }`}
                      >
                        {/* Rank Badge */}
                        <div className="w-8 flex items-center justify-center shrink-0">
                          {rank === 1 ? (
                            <span className="text-2xl filter drop-shadow">🥇</span>
                          ) : rank === 2 ? (
                            <span className="text-2xl filter drop-shadow">🥈</span>
                          ) : rank === 3 ? (
                            <span className="text-2xl filter drop-shadow">🥉</span>
                          ) : (
                            <span className="text-xs font-mono font-black text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                              #{rank}
                            </span>
                          )}
                        </div>

                        {/* Animated & Decorated Avatar */}
                        {renderAvatarWithDecoration(user, rank)}

                        {/* User Details */}
                        <div className="flex-1 min-w-0 ml-1">
                          <h4 className="text-xs font-bold truncate flex items-center gap-1.5">
                            <span className={isCurrentUser ? "text-[#FF799C]" : "text-[#6E4B55]"}>
                              {user.username}
                            </span>
                            {isCurrentUser && (
                              <span className="bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full font-mono scale-90">
                                YOU
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-1 font-mono">
                            <span>🕒 累計在線：{formatDuration(user.activeSeconds)}</span>
                            <span>✍️ 累計投稿：{user.submissions}次</span>
                          </div>
                        </div>

                        {/* Total Score Badge */}
                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-black text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                            {user.score} pts
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* --- HISTORICAL RANKINGS HALL OF FAME TAB --- */
            <div className="space-y-5">
              <div className="text-center py-2 bg-gradient-to-r from-pink-50/50 to-white p-3 rounded-2xl border border-pink-100/40 text-[11px] text-[#6E4B55]/70 italic">
                🏰 這裡是極禹支持者的榮耀聖殿。記錄每日活躍的前十名支持者，並通過 Supabase 實時同步保存，永不丟失！
              </div>

              {historyData.length === 0 ? (
                <div className="text-center py-20 bg-[#FFF6F2]/20 rounded-3xl border border-dashed border-[#FF799C]/20">
                  <Calendar className="h-8 w-8 text-[#FF799C]/40 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 italic">暫無歷史結算紀錄。明天 00:00 結算後，首條紀錄將載入史冊！🌌</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {historyData.map((record: any, hIdx: number) => (
                    <div key={record.date || hIdx} className="border border-pink-100 rounded-3xl bg-white p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                      {/* Record date and banner */}
                      <div className="flex items-center justify-between border-b border-pink-50 pb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-[#FF799C]" />
                          <h4 className="text-xs font-mono font-bold text-[#FF799C] tracking-wider">
                            📅 {record.date} 結算排行
                          </h4>
                        </div>
                        <span className="text-[10px] bg-green-50 text-green-500 font-mono font-semibold border border-green-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span>● 已發放星星幣</span>
                        </span>
                      </div>

                      {/* Sub-leaders inside history */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {record.topTen && record.topTen.slice(0, 4).map((top: any, tIdx: number) => (
                          <div key={top.id || tIdx} className="flex items-center gap-2.5 bg-[#FFFDFD] border border-gray-50 p-2.5 rounded-2xl">
                            {/* Small Rank badge */}
                            <span className="text-sm shrink-0">
                              {tIdx === 0 ? "🥇" : tIdx === 1 ? "🥈" : tIdx === 2 ? "🥉" : `🏅 #${tIdx + 1}`}
                            </span>

                            {/* Avatar */}
                            <div className="h-7 w-7 rounded-full border border-pink-50 bg-pink-50 overflow-hidden shrink-0 flex items-center justify-center">
                              {top.avatar ? (
                                <img src={top.avatar} alt="avatar" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="text-[10px] font-bold text-[#FF799C] font-mono">⭐</span>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-[#6E4B55] truncate">
                                {top.username}
                              </p>
                              <p className="text-[9px] text-gray-400 truncate font-mono">
                                Score: {top.score} pts
                              </p>
                            </div>

                            {/* Reward Pill */}
                            <span className="text-[9px] font-mono font-bold bg-[#FF799C]/10 text-[#FF799C] border border-[#FF799C]/15 px-2 py-0.5 rounded-lg shrink-0">
                              +{top.coinsAwarded} 🪙
                            </span>
                          </div>
                        ))}

                        {record.topTen && record.topTen.length > 4 && (
                          <div className="md:col-span-2 text-center text-[10px] text-gray-400 italic pt-1">
                            外加另外 {record.topTen.length - 4} 位星光支持者（各獲贈 +200 🪙 獎勵）...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer (Highlighting Current Logged in User's Rank status) */}
        {currentUser && (
          <div className="p-4 bg-gradient-to-tr from-[#FF799C] to-[#FFCCDD] text-white shrink-0 relative z-10">
            {activeTab === "alltime" ? (
              myAllTimeItem ? (
                <div className="max-w-xl mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full border-2 border-white bg-white/20 overflow-hidden shrink-0">
                      {myAllTimeItem.avatar ? (
                        <img src={myAllTimeItem.avatar} alt="avatar" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-xs">Me</div>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold tracking-wide uppercase opacity-90">我的歷史總累積進度 🏆</p>
                      <p className="text-xs font-black flex items-center gap-1.5 mt-0.5">
                        <span>{currentUser.username}</span>
                        <span className="opacity-75 font-normal">|</span>
                        <span>總名次：#{myAllTimeItem.rank}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-[10px] font-mono space-y-0.5 opacity-95">
                    <p>🕒 總在線：{formatDuration(myAllTimeItem.activeSeconds)}</p>
                    <p>✍️ 總投稿：{myAllTimeItem.submissions}次</p>
                    <p className="font-bold text-xs mt-1 bg-white/20 px-2 py-0.5 rounded-md inline-block">總分：{myAllTimeItem.score} pts</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-xl mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full border-2 border-white bg-white/20 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs">Me</div>
                    <div>
                      <p className="text-[11px] font-bold tracking-wide uppercase opacity-90">我的歷史總累積進度 🏆</p>
                      <p className="text-xs font-black flex items-center gap-1.5 mt-0.5">
                        <span>{currentUser.username}</span>
                        <span className="opacity-75 font-normal">|</span>
                        <span>總名次：暫未上榜</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] font-mono opacity-95">
                    <p>🕒 總在線：0秒</p>
                    <p>✍️ 總投稿：0次</p>
                    <p className="font-bold text-xs mt-1 bg-white/20 px-2 py-0.5 rounded-md inline-block">總分：0 pts</p>
                  </div>
                </div>
              )
            ) : activeTab === "current" && currentData?.currentUserStats ? (
              <div className="max-w-xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full border-2 border-white bg-white/20 overflow-hidden shrink-0">
                    {currentData.currentUserStats.avatar ? (
                      <img src={currentData.currentUserStats.avatar} alt="avatar" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xs">Me</div>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold tracking-wide uppercase opacity-90">我的今日活躍進度 📊</p>
                    <p className="text-xs font-black flex items-center gap-1.5 mt-0.5">
                      <span>{currentUser.username}</span>
                      <span className="opacity-75 font-normal">|</span>
                      <span>名次：{currentData.currentUserStats.rank === "Unranked" ? "暫未上榜" : `#${currentData.currentUserStats.rank}`}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right text-[10px] font-mono space-y-0.5 opacity-95">
                  <p>🕒 累積在線：{formatDuration(currentData.currentUserStats.activeSeconds)}</p>
                  <p>✍️ 投稿次數：{currentData.currentUserStats.submissions}次</p>
                  <p className="font-bold text-xs mt-1 bg-white/20 px-2 py-0.5 rounded-md inline-block">活躍：{currentData.currentUserStats.score} pts</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs font-semibold py-1">
                正在獲取您的活躍排行數據...
              </div>
            )}
          </div>
        )}

        {/* Guest prompt footer */}
        {!currentUser && (
          <div className="p-4 bg-[#FFF6F2] border-t border-[#FF799C]/10 text-center text-xs font-medium text-[#6E4B55]/80 shrink-0">
            🔒 <span className="font-bold text-[#FF799C]">登入帳號使用者才可參與活躍排行榜</span>。請先註冊並登入支持者帳號，開始計時！✨
          </div>
        )}
      </motion.div>
    </div>
  );
}
