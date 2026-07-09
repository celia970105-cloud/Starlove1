import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, SkipForward, SkipBack, Music, Volume2, Plus, Sparkles, AlertCircle, FileText, CheckCircle, Palette, Settings, Sliders, Eye, EyeOff, Check } from "lucide-react";
import { MusicPost, User } from "../types";

// Shared global audio engine to persist music across components and page switches
let sharedAudio: HTMLAudioElement | null = null;
let globalCurrentIdx = 0;
let globalTracks: MusicPost[] = [];

if (typeof window !== "undefined") {
  if (!(window as any).__shared_starry_audio__) {
    (window as any).__shared_starry_audio__ = new Audio();
  }
  sharedAudio = (window as any).__shared_starry_audio__;
}

interface MusicPlayerProps {
  currentUser: User | null;
  onRefreshData?: () => void;
  globalRefreshCount?: number;
}

const THEMES = {
  pink: {
    accent: "#FF799C",
    accentBg: "bg-[#FF799C]",
    accentText: "text-[#FF799C]",
    hoverText: "hover:text-[#FF799C]",
    lightBg: "bg-[#FFF0F3]",
    border: "border-[#FF799C]/20",
    glow: "shadow-[#FF799C]/20",
    text: "text-[#6E4B55]"
  },
  purple: {
    accent: "#A29BFE",
    accentBg: "bg-[#A29BFE]",
    accentText: "text-[#A29BFE]",
    hoverText: "hover:text-[#A29BFE]",
    lightBg: "bg-[#F0E6FF]",
    border: "border-[#A29BFE]/20",
    glow: "shadow-[#A29BFE]/20",
    text: "text-[#4B3F6E]"
  },
  blue: {
    accent: "#74B9FF",
    accentBg: "bg-[#74B9FF]",
    accentText: "text-[#74B9FF]",
    hoverText: "hover:text-[#74B9FF]",
    lightBg: "bg-[#E6F0FF]",
    border: "border-[#74B9FF]/20",
    glow: "shadow-[#74B9FF]/20",
    text: "text-[#3F4E6E]"
  },
  amber: {
    accent: "#FDCB6E",
    accentBg: "bg-[#FDCB6E]",
    accentText: "text-[#FDCB6E]",
    hoverText: "hover:text-[#FDCB6E]",
    lightBg: "bg-[#FFFBE6]",
    border: "border-[#FDCB6E]/20",
    glow: "shadow-[#FDCB6E]/20",
    text: "text-[#6E5C3F]"
  },
  dark: {
    accent: "#4A373D",
    accentBg: "bg-[#4A373D]",
    accentText: "text-[#4A373D]",
    hoverText: "hover:text-[#4A373D]",
    lightBg: "bg-gray-100",
    border: "border-gray-300",
    glow: "shadow-gray-400/20",
    text: "text-gray-800"
  }
};

const parseEmbedUrl = (url: string) => {
  if (!url) return "";
  const lowerUrl = url.toLowerCase();
  
  // YouTube support
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
    const ytMatch = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&enablejsapi=1`;
    }
  }

  // Bilibili
  if (lowerUrl.includes("bilibili.com") || lowerUrl.includes("b23.tv")) {
    const bvMatch = url.match(/(BV[a-zA-Z0-9]{10})/i);
    if (bvMatch) {
      return `https://player.bilibili.com/player.html?bvid=${bvMatch[1]}&page=1&high_quality=1&as_wide=1&autoplay=1`;
    }
    const avMatch = url.match(/\/av([0-9]+)/i);
    if (avMatch) {
      return `https://player.bilibili.com/player.html?aid=${avMatch[1]}&page=1&high_quality=1&as_wide=1&autoplay=1`;
    }
    if (url.includes("player.html")) {
      if (!url.includes("autoplay=1")) {
        return url + (url.includes("?") ? "&" : "?") + "autoplay=1";
      }
      return url;
    }
    return url;
  }
  
  // QQ Music
  if (lowerUrl.includes("qq.com")) {
    const songMidMatch = url.match(/\/songDetail\/([a-zA-Z0-9]+)/);
    if (songMidMatch) {
      return `https://y.qq.com/n/ryqq/player?songmid=${songMidMatch[1]}&autoplay=1`;
    }
    const songIdMatch = url.match(/songid=([0-9]+)/);
    if (songIdMatch) {
      return `https://y.qq.com/n/ryqq/player?songid=${songIdMatch[1]}&autoplay=1`;
    }
    if (!url.includes("autoplay=1")) {
      return url + (url.includes("?") ? "&" : "?") + "autoplay=1";
    }
    return url;
  }
  return url;
};

export default function MusicPlayer({ currentUser, onRefreshData, globalRefreshCount }: MusicPlayerProps) {
  const [tracks, setTracks] = useState<MusicPost[]>(globalTracks);
  const [currentIdx, setCurrentIdx] = useState(globalCurrentIdx);
  const [isPlaying, setIsPlaying] = useState(sharedAudio ? !sharedAudio.paused && !!sharedAudio.src : false);
  const [currentTime, setCurrentTime] = useState(sharedAudio ? sharedAudio.currentTime : 0);
  const [duration, setDuration] = useState(sharedAudio ? sharedAudio.duration || 180 : 180);
  const [volume, setVolume] = useState(sharedAudio ? sharedAudio.volume : 0.8);
  const [isLoading, setIsLoading] = useState(globalTracks.length === 0);
  const [iframeUrl, setIframeUrl] = useState<string>("");

  // Customizable Player State
  const [themeColor, setThemeColor] = useState<"pink" | "purple" | "blue" | "amber" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("starry_player_theme") as any) || "pink";
    }
    return "pink";
  });
  const currentTheme = THEMES[themeColor];
  const [discSkin, setDiscSkin] = useState<"zack-jeremy" | "starry-night" | "rainbow-peach" | "neon-retro" | "custom">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("starry_player_skin") as any) || "zack-jeremy";
    }
    return "zack-jeremy";
  });
  const [customStickerUrl, setCustomStickerUrl] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("starry_player_custom_sticker") || "";
    }
    return "";
  });
  const [rotationSpeed, setRotationSpeed] = useState<"slow" | "normal" | "fast">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("starry_player_speed") as any) || "normal";
    }
    return "normal";
  });
  const [glowIntensity, setGlowIntensity] = useState<"none" | "soft" | "neon">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("starry_player_glow") as any) || "soft";
    }
    return "soft";
  });
  const [panelBg, setPanelBg] = useState<"frosted" | "glossy" | "gradient">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("starry_player_bg") as any) || "frosted";
    }
    return "frosted";
  });
  const [showIframeWindow, setShowIframeWindow] = useState<"hidden" | "compact" | "visible">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("starry_player_iframe_mode") as any) || "compact";
    }
    return "compact";
  });

  const [showCustomizePanel, setShowCustomizePanel] = useState(false);

  // Submission Form State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [newAudioUrl, setNewAudioUrl] = useState("");
  const [newCoverUrl, setNewCoverUrl] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Save Player Styles to localStorage
  useEffect(() => {
    localStorage.setItem("starry_player_theme", themeColor);
    localStorage.setItem("starry_player_skin", discSkin);
    localStorage.setItem("starry_player_speed", rotationSpeed);
    localStorage.setItem("starry_player_glow", glowIntensity);
    localStorage.setItem("starry_player_bg", panelBg);
    localStorage.setItem("starry_player_iframe_mode", showIframeWindow);
    if (customStickerUrl) {
      localStorage.setItem("starry_player_custom_sticker", customStickerUrl);
    }
  }, [themeColor, discSkin, rotationSpeed, glowIntensity, panelBg, showIframeWindow, customStickerUrl]);

  // If user is not logged in, force reset custom skin to zack-jeremy (Only logged-in user can use and see custom skin)
  useEffect(() => {
    if (!currentUser && discSkin === "custom") {
      setDiscSkin("zack-jeremy");
    }
  }, [currentUser, discSkin]);

  // Fetch approved tracks from server
  const fetchTracks = async () => {
    if (globalTracks.length === 0) {
      setIsLoading(true);
    }
    try {
      const res = await fetch("/api/posts/music");
      if (res.ok) {
        const data = await res.json();
        setTracks(data);
        globalTracks = data;
        
        // Setup initial source
        if (data.length > 0) {
          const track = data[globalCurrentIdx];
          const isDirect = track.audio_url.match(/\.(mp3|wav|ogg|m4a)/i);
          if (isDirect && sharedAudio && !sharedAudio.src) {
            sharedAudio.src = track.audio_url;
          } else if (!isDirect && isPlaying) {
            setIframeUrl(parseEmbedUrl(track.audio_url));
          }
        }
      }
    } catch (err) {
      console.error("Error fetching tracks", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, [globalRefreshCount]);

  // Update global index reference when currentIdx changes
  useEffect(() => {
    globalCurrentIdx = currentIdx;
  }, [currentIdx]);

  const currentTrack = tracks[currentIdx] || null;

  // Sync state with HTMLAudioElement events
  useEffect(() => {
    if (!sharedAudio) return;

    const onTimeUpdate = () => {
      const isDirect = currentTrack?.audio_url.match(/\.(mp3|wav|ogg|m4a)/i);
      if (isDirect) {
        setCurrentTime(sharedAudio!.currentTime);
      }
    };

    const onDurationChange = () => {
      const isDirect = currentTrack?.audio_url.match(/\.(mp3|wav|ogg|m4a)/i);
      if (isDirect) {
        setDuration(sharedAudio!.duration || 180);
      }
    };

    const onEnded = () => {
      nextTrack();
    };

    const onPlay = () => {
      setIsPlaying(true);
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    sharedAudio.addEventListener("timeupdate", onTimeUpdate);
    sharedAudio.addEventListener("durationchange", onDurationChange);
    sharedAudio.addEventListener("ended", onEnded);
    sharedAudio.addEventListener("play", onPlay);
    sharedAudio.addEventListener("pause", onPause);

    return () => {
      if (sharedAudio) {
        sharedAudio.removeEventListener("timeupdate", onTimeUpdate);
        sharedAudio.removeEventListener("durationchange", onDurationChange);
        sharedAudio.removeEventListener("ended", onEnded);
        sharedAudio.removeEventListener("play", onPlay);
        sharedAudio.removeEventListener("pause", onPause);
      }
    };
  }, [tracks, currentIdx, currentTrack]);

  // Simulate progress bar ticking for non-direct Bilibili/QQ iframe audio playing in background
  useEffect(() => {
    if (!isPlaying || !currentTrack) return;
    
    const isDirectAudio = currentTrack.audio_url.match(/\.(mp3|wav|ogg|m4a)/i);
    if (isDirectAudio) return; // Managed natively by HTML5 audio

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= duration) {
          clearInterval(interval);
          nextTrack();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack, duration, currentIdx]);

  // Handle Track Source Change
  const selectTrack = (idx: number, autoPlay = true) => {
    if (tracks.length === 0) return;
    const track = tracks[idx];
    if (!track) return;

    setCurrentIdx(idx);
    globalCurrentIdx = idx;
    setCurrentTime(0);
    setDuration(210); // Standard simulated duration (3:30)

    const isDirectAudio = track.audio_url.match(/\.(mp3|wav|ogg|m4a)/i);
    
    if (isDirectAudio) {
      if (sharedAudio) {
        setIframeUrl("");
        const isSameSrc = sharedAudio.src === track.audio_url;
        if (!isSameSrc) {
          sharedAudio.src = track.audio_url;
          sharedAudio.load();
        }
        if (autoPlay) {
          sharedAudio.play()
            .then(() => setIsPlaying(true))
            .catch(e => console.log("Playback error:", e));
        }
      }
    } else {
      // Bilibili / QQ Music
      if (sharedAudio) {
        sharedAudio.pause();
      }
      const embed = parseEmbedUrl(track.audio_url);
      if (autoPlay) {
        setIframeUrl(embed);
        setIsPlaying(true);
      } else {
        setIframeUrl("");
        setIsPlaying(false);
      }
    }
  };

  // Sync play state
  const togglePlay = () => {
    if (tracks.length === 0 || !currentTrack) return;
    
    const isDirectAudio = currentTrack.audio_url.match(/\.(mp3|wav|ogg|m4a)/i);

    if (isPlaying) {
      if (isDirectAudio && sharedAudio) {
        sharedAudio.pause();
      }
      setIframeUrl(""); // pause iframe by removing src
      setIsPlaying(false);
    } else {
      if (isDirectAudio && sharedAudio) {
        if (!sharedAudio.src) {
          sharedAudio.src = currentTrack.audio_url;
          sharedAudio.load();
        }
        sharedAudio.play()
          .then(() => setIsPlaying(true))
          .catch(err => {
            console.error("Audio play error", err);
            setIsPlaying(false);
          });
      } else {
        // Bilibili / QQ Music
        const embed = parseEmbedUrl(currentTrack.audio_url);
        setIframeUrl(embed);
        setIsPlaying(true);
      }
    }
  };

  const nextTrack = () => {
    if (tracks.length === 0) return;
    const nextIdx = (currentIdx + 1) % tracks.length;
    selectTrack(nextIdx, isPlaying);
  };

  const prevTrack = () => {
    if (tracks.length === 0) return;
    const prevIdx = (currentIdx - 1 + tracks.length) % tracks.length;
    selectTrack(prevIdx, isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const isDirectAudio = currentTrack?.audio_url.match(/\.(mp3|wav|ogg|m4a)/i);
    if (isDirectAudio && sharedAudio) {
      sharedAudio.currentTime = val;
    }
    setCurrentTime(val);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (sharedAudio) {
      sharedAudio.volume = val;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Submit new music
  const handleSubmitMusic = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(false);

    const title = newTitle.trim();
    if (!title || !newArtist || !newAudioUrl) {
      setSubmitError("請填寫必填欄位 (音樂名稱、歌手/製作人、網址)！");
      return;
    }

    // Client-side duplicate check
    const isDuplicate = tracks.some(t => t.title.trim().toLowerCase() === title.toLowerCase());
    if (isDuplicate) {
      setSubmitError("音樂名稱重複了！請為您的音樂起一個獨一無二的名稱。");
      return;
    }

    // Client-side QQ Music / Bilibili validation
    const trimmedUrl = newAudioUrl.trim();
    const isBili = trimmedUrl.toLowerCase().includes("bilibili.com") || trimmedUrl.toLowerCase().includes("b23.tv");
    const isQQ = trimmedUrl.toLowerCase().includes("qq.com");
    if (!isBili && !isQQ) {
      setSubmitError("音樂投稿失敗！網址限用 QQ音樂 或 bilibili 網址。");
      return;
    }

    try {
      const payload = {
        title,
        artist: newArtist.trim(),
        audio_url: trimmedUrl,
        cover_url: newCoverUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500",
        duration: "3:30",
        user_id: currentUser?.id || "anonymous",
        username: currentUser?.username || "Anonymous Visitor",
        role: currentUser?.role || "user",
        email: currentUser?.email || ""
      };

      const res = await fetch("/api/posts/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload })
      });

      if (res.ok) {
        const data = await res.json();
        setSubmitSuccess(true);
        setNewTitle("");
        setNewArtist("");
        setNewAudioUrl("");
        setNewCoverUrl("");
        
        // Instantly refresh list so they can see and play it immediately
        fetchTracks();
        
        if (onRefreshData) {
          onRefreshData();
        }
        if (data.coinMessage) {
          setTimeout(() => {
            alert(data.coinMessage);
          }, 300);
        }
        setTimeout(() => {
          setShowSubmitModal(false);
          setSubmitSuccess(false);
        }, 2000);
      } else {
        const data = await res.json();
        setSubmitError(data.error || "投稿失敗，請稍後再試。");
      }
    } catch (err) {
      setSubmitError("伺服器連線出錯，請確認網路連線。");
    }
  };

  return (
    <>
      <div 
        className={`w-full max-w-4xl mx-auto p-6 rounded-[32px] relative overflow-hidden transition-all duration-500 border ${currentTheme.border} ${currentTheme.text} ${
          panelBg === "frosted" 
            ? "bg-white/70 backdrop-blur-md shadow-xl" 
            : panelBg === "glossy" 
            ? "bg-white/95 shadow-2xl" 
            : `bg-gradient-to-tr from-white via-white/85 to-[${currentTheme.accent}]/5 backdrop-blur-md shadow-xl`
        }`}
        style={{
          boxShadow: glowIntensity === "neon" 
            ? `0 20px 40px -5px ${currentTheme.accent}77` 
            : glowIntensity === "soft" 
            ? `0 10px 25px -5px ${currentTheme.accent}33` 
            : undefined
        }}
      >
      {/* Background decoration elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-b from-[#FF799C]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-t from-[#A29BFE]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Decorative tag / Top action bar */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[#FF799C] animate-pulse" />
          <span className="text-[10px] font-mono tracking-widest uppercase opacity-80" style={{ color: currentTheme.accent }}>
            JEREMY • CUSTOM VINYL PLAYER • ZACK
          </span>
        </div>
        
        {/* Style Customizer toggle button */}
        <button
          onClick={() => setShowCustomizePanel(!showCustomizePanel)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${showCustomizePanel ? "bg-white/90 border-[#FF799C] text-[#FF799C] shadow-sm" : "bg-white/40 border-gray-200/50 hover:bg-white/60"}`}
        >
          <Palette className="h-3.5 w-3.5 animate-spin-slow" />
          <span>自定義播放器樣式</span>
        </button>
      </div>

      {/* STYLES CUSTOMIZE DRAWER */}
      <AnimatePresence>
        {showCustomizePanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 overflow-hidden relative z-10 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/40 p-4 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-200/30 pb-2">
              <h5 className="text-sm font-semibold flex items-center gap-2">
                <Sliders className="h-4 w-4" style={{ color: currentTheme.accent }} />
                <span>播放器專屬自定義設定</span>
              </h5>
              <span className="text-[10px] font-mono bg-gray-200/40 px-2 py-0.5 rounded text-gray-500">已自動儲存</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              {/* Theme Selector */}
              <div className="space-y-1.5">
                <span className="font-medium text-gray-500">1. 顏色主題</span>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map((t) => (
                    <button
                      key={t}
                      onClick={() => setThemeColor(t)}
                      className={`h-6 w-6 rounded-full border-2 transition-transform active:scale-90 relative flex items-center justify-center`}
                      style={{ 
                        backgroundColor: THEMES[t].accent, 
                        borderColor: themeColor === t ? "#fff" : "transparent",
                        boxShadow: themeColor === t ? "0 0 0 2px #4B3F6E" : "none"
                      }}
                      title={t}
                    >
                      {themeColor === t && <Check className="h-3.5 w-3.5 text-white stroke-[3px]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Disc Center Skin */}
              <div className="space-y-1.5">
                <span className="font-medium text-gray-500">2. 黑膠唱片貼紙</span>
                <select
                  value={discSkin}
                  onChange={(e) => setDiscSkin(e.target.value as any)}
                  className="w-full bg-white/80 border border-gray-200/80 rounded-lg p-1 focus:outline-none"
                >
                  <option value="zack-jeremy">Zack & Jeremy 經典封面</option>
                  <option value="starry-night">璀璨星空貼紙 ✨</option>
                  <option value="rainbow-peach">粉萌蜜桃派對 🌸</option>
                  <option value="neon-retro">霓虹復古波形 ⚡</option>
                  {currentUser && (
                    <option value="custom">自定義貼紙 (從相簿選擇) 👤</option>
                  )}
                </select>

                {!currentUser && (
                  <p className="text-[10px] text-[#6E4B55]/70 italic mt-1">
                    🔒 登入後即可解鎖「自定義貼紙」功能
                  </p>
                )}

                {currentUser && discSkin === "custom" && (
                  <div className="mt-2 space-y-1">
                    <label className="flex items-center justify-center gap-1 border-2 border-dashed border-[#FF799C]/30 hover:border-[#FF799C] bg-[#FFF6F2]/40 rounded-lg p-1.5 cursor-pointer transition-all hover:bg-[#FFF6F2]/80">
                      <Plus className="h-3.5 w-3.5 text-[#FF799C]/70" />
                      <span className="text-[10px] text-[#6E4B55]/70">選擇手機相簿圖片</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setCustomStickerUrl(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    {customStickerUrl && (
                      <div className="flex items-center gap-1.5 mt-1 justify-center bg-white/40 py-0.5 px-1 rounded">
                        <img src={customStickerUrl} className="w-5 h-5 rounded-full object-cover border border-[#FF799C]/25" referrerPolicy="no-referrer" />
                        <span className="text-[9px] text-gray-500">自訂圖片已載入</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Rotation Speed */}
              <div className="space-y-1.5">
                <span className="font-medium text-gray-500">3. 黑膠旋轉速度</span>
                <div className="flex gap-1.5 bg-white/60 p-0.5 rounded-lg border border-gray-200/40">
                  {(["slow", "normal", "fast"] as const).map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setRotationSpeed(spd)}
                      className={`flex-1 py-1 rounded-md text-[11px] transition-all ${rotationSpeed === spd ? "bg-white shadow-sm font-semibold" : "opacity-60 hover:opacity-100"}`}
                      style={{ color: rotationSpeed === spd ? currentTheme.accent : undefined }}
                    >
                      {spd === "slow" ? "沉浸慢" : spd === "fast" ? "動感快" : "標準"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Glow Intensity */}
              <div className="space-y-1.5">
                <span className="font-medium text-gray-500">4. 霓虹光暈效果</span>
                <div className="flex gap-1.5 bg-white/60 p-0.5 rounded-lg border border-gray-200/40">
                  {(["none", "soft", "neon"] as const).map((gl) => (
                    <button
                      key={gl}
                      onClick={() => setGlowIntensity(gl)}
                      className={`flex-1 py-1 rounded-md text-[11px] transition-all ${glowIntensity === gl ? "bg-white shadow-sm font-semibold" : "opacity-60 hover:opacity-100"}`}
                      style={{ color: glowIntensity === gl ? currentTheme.accent : undefined }}
                    >
                      {gl === "none" ? "無" : gl === "soft" ? "柔和" : "極致"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Panel Style */}
              <div className="space-y-1.5">
                <span className="font-medium text-gray-500">5. 面板背景材質</span>
                <div className="flex gap-1.5 bg-white/60 p-0.5 rounded-lg border border-gray-200/40">
                  {(["frosted", "glossy", "gradient"] as const).map((bg) => (
                    <button
                      key={bg}
                      onClick={() => setPanelBg(bg)}
                      className={`flex-1 py-1 rounded-md text-[11px] transition-all ${panelBg === bg ? "bg-white shadow-sm font-semibold" : "opacity-60 hover:opacity-100"}`}
                      style={{ color: panelBg === bg ? currentTheme.accent : undefined }}
                    >
                      {bg === "frosted" ? "磨砂玻璃" : bg === "glossy" ? "晶瑩白" : "漸變幻彩"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Iframe Display mode */}
              <div className="space-y-1.5">
                <span className="font-medium text-gray-500">6. 播放源視窗模式</span>
                <div className="flex gap-1.5 bg-white/60 p-0.5 rounded-lg border border-gray-200/40">
                  {(["hidden", "compact", "visible"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setShowIframeWindow(m)}
                      className={`flex-1 py-1 rounded-md text-[11px] transition-all ${showIframeWindow === m ? "bg-white shadow-sm font-semibold" : "opacity-60 hover:opacity-100"}`}
                      style={{ color: showIframeWindow === m ? currentTheme.accent : undefined }}
                    >
                      {m === "hidden" ? "後台隱藏" : m === "compact" ? "精簡" : "完整視聽"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
        {/* Vinyl Section (5 columns on desktop) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          {/* Turntable Stylus Arm */}
          <div 
            className="absolute top-[-25px] right-[40px] z-20 origin-top-left transition-transform duration-700"
            style={{
              transform: isPlaying ? "rotate(15deg)" : "rotate(-12deg)"
            }}
          >
            <svg width="60" height="120" viewBox="0 0 60 120" fill="none">
              {/* Base pivot */}
              <circle cx="15" cy="15" r="12" fill="#2d1e3d" stroke={currentTheme.accent} strokeWidth="2" />
              <circle cx="15" cy="15" r="4" fill={currentTheme.accent} />
              {/* Main metal arm */}
              <path d="M 15 15 L 15 80 L 40 105" stroke="#a09fb1" strokeWidth="4" strokeLinecap="round" />
              {/* Cartridge head */}
              <rect x="34" y="100" width="12" height="18" rx="2" fill={currentTheme.accent} stroke="#2d1e3d" strokeWidth="1" />
              <circle cx="40" cy="109" r="2" fill="#fff" />
            </svg>
          </div>

          {/* Vinyl Disc */}
          <div 
            className="relative h-60 w-60 rounded-full bg-neutral-950 border-4 flex items-center justify-center shadow-lg relative overflow-hidden transition-all duration-500"
            style={{ 
              borderColor: currentTheme.accent + "55"
            }}
          >
            {/* Vinyl record grooves */}
            <div className="absolute inset-2 rounded-full border border-black/50" />
            <div className="absolute inset-6 rounded-full border border-black/50" />
            <div className="absolute inset-10 rounded-full border border-black/50" />
            <div className="absolute inset-14 rounded-full border border-black/50" />
            <div className="absolute inset-18 rounded-full border border-white/5" />
            <div className="absolute inset-24 rounded-full border border-black/50" />

            {/* Album center labels */}
            <div 
              className={`h-28 w-28 rounded-full overflow-hidden border-4 border-neutral-900 relative z-10 transition-transform`}
              style={{ 
                animation: isPlaying ? `vinyl-spin ${rotationSpeed === "slow" ? "25s" : rotationSpeed === "fast" ? "6s" : "14s"} linear infinite` : undefined,
                transform: !isPlaying ? "rotate(12deg)" : undefined
              }}
            >
              {/* Disc skin picker rendering */}
              {discSkin === "starry-night" ? (
                <div className="absolute inset-0 bg-gradient-to-b from-[#0F0C20] via-[#151030] to-[#050212] flex flex-col items-center justify-center p-2 text-center text-yellow-100/90 select-none">
                  <div className="text-[7px] font-mono tracking-widest text-[#FFF]/40 mb-1">STARRY DISK</div>
                  <div className="text-[10px] font-bold tracking-tight">夜空應援 ✨</div>
                  <div className="text-[7px] opacity-60 mt-1 font-mono scale-90">Zack & Jeremy</div>
                </div>
              ) : discSkin === "rainbow-peach" ? (
                <div className="absolute inset-0 bg-gradient-to-tr from-[#FFD3D6] via-[#FFF1F2] to-[#FFCCDD] flex flex-col items-center justify-center p-2 text-center text-[#9C5D64] select-none">
                  <div className="text-[7px] tracking-wider uppercase font-semibold text-[#FF799C] mb-1 scale-90">Sweet Peach</div>
                  <div className="text-[10px] font-bold tracking-tight">粉萌蜜桃 🌸</div>
                  <div className="text-[7px] opacity-60 mt-1 scale-90">Cotton Candy</div>
                </div>
              ) : discSkin === "neon-retro" ? (
                <div className="absolute inset-0 bg-[#0c0014] border-2 border-[#ff007f]/50 flex flex-col items-center justify-center p-2 text-center text-[#00f0ff] select-none">
                  <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,0,127,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,127,0.1)_1px,transparent_1px)] bg-[size:10px_10px]" />
                  <div className="text-[7px] font-mono uppercase tracking-widest text-[#ff007f] scale-90">RETRO WAVE</div>
                  <div className="text-[9px] font-mono font-bold tracking-tighter">⚡ NEON ECHO ⚡</div>
                  <div className="text-[6px] font-mono text-white/50 mt-1 scale-90">Z & J • VIBES</div>
                </div>
              ) : (discSkin === "custom" && currentUser) ? (
                customStickerUrl ? (
                  <img 
                    src={customStickerUrl} 
                    alt="Custom Disc Sticker" 
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#FF799C] to-[#C9A2FE] flex flex-col items-center justify-center p-2 text-center text-white select-none">
                    <span className="text-[9px] font-bold">自定義貼紙</span>
                    <span className="text-[7px] opacity-80 mt-0.5 scale-90">請到設定上傳</span>
                  </div>
                )
              ) : (
                currentTrack?.cover_url ? (
                  <img 
                    src={currentTrack.cover_url} 
                    alt={currentTrack.title} 
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-tr from-[#FF799C] to-[#FFCCDD] flex items-center justify-center">
                    <Music className="h-8 w-8 text-white" />
                  </div>
                )
              )}
              {/* Center spindle hole */}
              <div className="absolute inset-0 m-auto h-4 w-4 rounded-full bg-neutral-950 border-2 border-neutral-800" />
            </div>
          </div>

          {/* Player controls */}
          <div className="flex items-center gap-6 mt-6 z-10">
            <button 
              onClick={prevTrack}
              className={`p-3 rounded-full transition-all active:scale-95 ${currentTheme.hoverText}`}
              title="上一首"
            >
              <SkipBack className="h-5 w-5" />
            </button>
            <button 
              onClick={togglePlay}
              className="p-5 rounded-full text-white shadow-lg transition-all active:scale-95 hover:scale-105"
              style={{ backgroundColor: currentTheme.accent, boxShadow: `0 8px 20px ${currentTheme.accent}44` }}
              title={isPlaying ? "暫停" : "播放"}
            >
              {isPlaying ? <Pause className="h-6 w-6 fill-white" /> : <Play className="h-6 w-6 fill-white ml-0.5" />}
            </button>
            <button 
              onClick={nextTrack}
              className={`p-3 rounded-full transition-all active:scale-95 ${currentTheme.hoverText}`}
              title="下一首"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Music Metadata and Playlist (7 columns) */}
        <div className="md:col-span-7 flex flex-col h-full justify-between">
          <div>
            {currentTrack ? (
              <div className="text-left">
                <span 
                  className="inline-block px-3 py-1 rounded-full text-[10px] font-mono font-semibold border mb-3"
                  style={{ color: currentTheme.accent, borderColor: currentTheme.accent + "33", backgroundColor: currentTheme.accent + "0c" }}
                >
                  NOW PLAYING • {currentTrack.audio_url.includes("bilibili") ? "bilibili" : "QQ音樂"}
                </span>
                <h3 className="text-2xl font-serif font-semibold tracking-wide" style={{ color: currentTheme.accent }}>
                  {currentTrack.title}
                </h3>
                <p className="text-sm mt-1 font-sans opacity-80">
                  {currentTrack.artist}
                </p>
              </div>
            ) : (
              <div className="text-left text-gray-400 py-4">
                <Music className="h-8 w-8 mb-2 animate-pulse" />
                <p className="font-serif">目前還沒有內容 ＞＜ 歡迎投稿你的應援音樂！</p>
              </div>
            )}

            {/* Seek Bar */}
            <div className="mt-6">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${currentTheme.accent} ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%)`
                }}
              />
              <div className="flex justify-between text-[11px] font-mono mt-2 opacity-60">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2 mt-4 justify-end opacity-60 hover:opacity-100 transition-opacity">
              <Volume2 className="h-4 w-4" style={{ color: currentTheme.accent }} />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-1 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${currentTheme.accent} ${volume * 100}%, #e5e7eb ${volume * 100}%)`
                }}
              />
            </div>
          </div>

          {/* BACKGROUND IFRAME EMBED COMPACT/VISIBLE RENDERING */}
          {iframeUrl && (
            <div className="mt-4">
              {showIframeWindow === "hidden" ? (
                <div className="w-0 h-0 opacity-0 absolute pointer-events-none">
                  <iframe src={iframeUrl} className="w-0 h-0 border-0" allow="autoplay; encrypted-media" />
                </div>
              ) : showIframeWindow === "compact" ? (
                <div className="rounded-xl overflow-hidden border border-gray-200/40 shadow-inner bg-white/40">
                  <div className="px-3 py-1 bg-gray-100/50 text-[10px] font-mono flex items-center justify-between text-gray-500 border-b border-gray-100">
                    <span className="flex items-center gap-1">📻 播放源：{currentTrack?.title} (精簡後台播放)</span>
                    <span className="text-green-500 flex items-center gap-1 animate-pulse">● PLAYING</span>
                  </div>
                  <iframe src={iframeUrl} className="w-full h-24 border-0" allow="autoplay; encrypted-media" />
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden border border-gray-200/60 shadow-md bg-white">
                  <div className="px-3 py-1.5 bg-gray-100 text-xs font-mono flex items-center justify-between text-gray-600 border-b border-gray-100">
                    <span className="font-semibold">🎬 完整視聽播放器：{currentTrack?.title}</span>
                    <span className="text-green-500 font-bold animate-pulse">● ACTIVE</span>
                  </div>
                  <iframe src={iframeUrl} className="w-full h-56 border-0" allow="autoplay; encrypted-media" />
                </div>
              )}
            </div>
          )}

          {/* Tracklist Area */}
          <div className="mt-6 border-t border-gray-200/30 pt-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-mono tracking-widest uppercase opacity-60">
                STARRY PLAYLIST ({tracks.length})
              </span>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="text-xs text-white flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95 shadow-sm font-semibold cursor-pointer"
                style={{ backgroundColor: currentTheme.accent }}
              >
                <Plus className="h-3.5 w-3.5 stroke-[3px]" />
                <span>音樂投稿</span>
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2 scrollbar-thin">
              {isLoading ? (
                <div className="text-center py-6 text-xs font-mono opacity-50">正在為您載入音樂星庫中...</div>
              ) : tracks.length === 0 ? (
                <div className="text-center py-6 text-xs font-serif opacity-50">{"目前還沒有人投稿過音樂 ＞＜ 快來當第一個吧！"}</div>
              ) : (
                tracks.map((track, idx) => (
                  <div
                    key={track.id}
                    onClick={() => selectTrack(idx)}
                    className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer border ${currentIdx === idx ? `bg-white/90 shadow-sm ${currentTheme.border} font-semibold` : "hover:bg-white/30 border-transparent opacity-85"}`}
                    style={{ color: currentIdx === idx ? currentTheme.accent : undefined }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border bg-white/40 border-gray-200/40">
                        {track.cover_url ? (
                          <img src={track.cover_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Music className="h-4 w-4" style={{ color: currentTheme.accent }} />
                        )}
                      </div>
                      <div className="text-left text-xs min-w-0">
                        <p className="font-semibold truncate max-w-[160px] md:max-w-[200px]">{track.title}</p>
                        <p className="opacity-75 truncate max-w-[120px]">{track.artist}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono opacity-50 px-1.5 py-0.5 rounded bg-gray-200/40">
                        {track.audio_url.includes("bilibili") ? "Bilibili" : "QQ"}
                      </span>
                      <span className="text-xs font-mono opacity-50">{track.duration}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Submission Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white/95 text-[#6E4B55] p-6 rounded-3xl border border-[#FF799C]/25 shadow-2xl relative"
            >
              <h4 className="text-xl font-serif font-light text-[#FF799C] mb-2 flex items-center gap-2">
                <Music className="h-5 w-5 text-[#FF799C]" />
                粉絲應援音樂投稿
              </h4>
              <p className="text-xs text-[#6E4B55]/60 mb-6">
                永久保存至音樂應援庫！雙主唱專屬播放器，支援背景播放。
              </p>

              {!currentUser || currentUser.is_guest ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-[#6E4B55] space-y-4">
                  <div className="h-16 w-16 bg-[#FF799C]/10 text-[#FF799C] rounded-full flex items-center justify-center animate-pulse">
                    <Music className="h-8 w-8" />
                  </div>
                  <p className="text-base font-semibold font-serif text-[#FF799C]">星光同盟限定功能 💖</p>
                  <p className="text-xs text-[#6E4B55]/70 max-w-xs leading-relaxed">
                    親愛的星星同盟，應援音樂投稿功能僅開放給【已登入使用者】。請先前往「個人中心」註冊或登入您的帳號，即可獲得 50 星星幣並參與黑膠播放器應援！✨
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="mt-2 px-6 py-2.5 bg-gradient-to-r from-[#FF799C] to-[#FF9EBA] hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    我知道了
                  </button>
                </div>
              ) : submitSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-[#FF799C]">
                  <CheckCircle className="h-16 w-16 mb-4 animate-bounce" />
                  <p className="text-lg font-serif font-semibold">
                    {currentUser?.email === "celia970105@gmail.com" ? "管理員直接發布成功！" : "應援音樂投稿成功！"}
                  </p>
                  <p className="text-xs text-[#6E4B55]/60 mt-2">
                    {currentUser?.email === "celia970105@gmail.com"
                      ? "管理員已直接將此首歌曲載入至下方播放列表中！✨"
                      : "投稿已送入星光審核箱，一經管理員 (celia970105) 審核通過後，所有人都看得到！✨"}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitMusic} className="space-y-4 text-left">
                  {submitError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-[#6E4B55]/70 mb-1.5">音樂名稱 (必須填寫，且不能重複) *</label>
                    <input
                      type="text"
                      required
                      placeholder="請為音樂命名，例：TOP雙主唱應援曲"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-[#FFF6F2]/60 border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-sm px-3.5 py-2.5 rounded-xl transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6E4B55]/70 mb-1.5">歌手 / 製作人 *</label>
                    <input
                      type="text"
                      required
                      placeholder="例如：Zack & Jeremy 應援團"
                      value={newArtist}
                      onChange={(e) => setNewArtist(e.target.value)}
                      className="w-full bg-[#FFF6F2]/60 border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-sm px-3.5 py-2.5 rounded-xl transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6E4B55]/70 mb-1.5">QQ音樂 / Bilibili 應援網址 *</label>
                    <input
                      type="url"
                      required
                      placeholder="限用 https://y.qq.com/... 或 bilibili 影片網址"
                      value={newAudioUrl}
                      onChange={(e) => setNewAudioUrl(e.target.value)}
                      className="w-full bg-[#FFF6F2]/60 border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-sm px-3.5 py-2.5 rounded-xl transition-all font-mono"
                    />
                    <span className="text-[10px] text-[#FF799C] mt-1 block font-medium">⚠️ 注意：本播放器限用 QQ音樂 (y.qq.com/qq.com) 及 bilibili 網址，將自動在後台進行播放。</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6E4B55]/70 mb-1.5">封面圖片網址 (選填)</label>
                    <input
                      type="url"
                      placeholder="e.g. https://domain.com/cover.jpg"
                      value={newCoverUrl}
                      onChange={(e) => setNewCoverUrl(e.target.value)}
                      className="w-full bg-[#FFF6F2]/60 border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-[#6E4B55] text-sm px-3.5 py-2.5 rounded-xl transition-all font-mono"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSubmitModal(false);
                        setNewTitle("");
                        setNewArtist("");
                        setNewAudioUrl("");
                        setNewCoverUrl("");
                        setSubmitError("");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="flex-1 bg-[#FFF6F2]/80 hover:bg-[#FFF6F2] text-[#6E4B55]/80 hover:text-[#6E4B55] text-sm py-3 rounded-xl transition-all border border-[#FF799C]/10 active:scale-95"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-[#FF799C] to-[#FFCCDD] hover:opacity-90 text-white font-medium text-sm py-3 rounded-xl shadow-lg shadow-[#FF799C]/25 transition-all active:scale-95"
                    >
                      永久保存並投稿
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
