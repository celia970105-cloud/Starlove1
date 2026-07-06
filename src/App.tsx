import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, Camera, Film, Mail, Palette, Music, Sparkles, Smile, Shield, User as UserIcon, Heart, Compass, Layout } from "lucide-react";
import { useLanguage } from "./context/LanguageContext";
import { saveUserBackup, restoreUserBackup } from "./lib/syncHelper";

// Components
import StarryBackground from "./components/StarryBackground";
import CupidoIntro from "./components/CupidoIntro";
import MusicPlayer from "./components/MusicPlayer";
import GalleryModule from "./components/GalleryModule";
import VideoModule from "./components/VideoModule";
import LettersModule from "./components/LettersModule";
import MuseumModule from "./components/MuseumModule";
import PetsModule from "./components/PetsModule";
import UserModule from "./components/UserModule";
import AdminModule from "./components/AdminModule";

// Types
import { User } from "./types";

export default function App() {
  const { language, setLanguage, t } = useLanguage();
  const [showIntro, setShowIntro] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeModule, setActiveModule] = useState<string>("home");
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; char: string }[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  // Custom configurations from admin settings
  const [heroTitle, setHeroTitle] = useState("ALL FOR JIYU");
  const [heroSub, setHeroSub] = useState("ALL FOR JIYU - 專屬 Jiyu 的最可愛奢華應援星空社群平台。結合投稿審核、黑膠音樂播放、同人畫作展覽及星寵互動。");
  const [bannerUrl, setBannerUrl] = useState("https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1200");

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

  // Floating pet greeting speech state
  const [companionGreeting, setCompanionGreeting] = useState("所以謝謝你的存在");
  const [showCompanionBubble, setShowCompanionBubble] = useState(true);

  // Sync settings and login on mount
  useEffect(() => {
    // Load config from localStorage
    const savedTitle = localStorage.getItem("starry_hero_title");
    const savedSub = localStorage.getItem("starry_hero_sub");
    const savedBanner = localStorage.getItem("starry_hero_banner");
    if (savedTitle) setHeroTitle(savedTitle);
    if (savedSub) setHeroSub(savedSub);
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

    // Auto-login seed user for comfortable demonstration if they reload or start
    const savedUser = localStorage.getItem("starry_current_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.email?.trim().toLowerCase() === "celia970105@gmail.com") {
          parsed.role = "admin";
        }
        setCurrentUser(parsed);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Rotate companion greetings
  useEffect(() => {
    const greetings = [
      "所以謝謝你的存在",
      "張極！張澤禹。",
      "從未改變過",
      "極禹TOP唯一美帝"
    ];

    const interval = setInterval(() => {
      setShowCompanionBubble(false);
      setTimeout(() => {
        const rand = greetings[Math.floor(Math.random() * greetings.length)];
        setCompanionGreeting(rand);
        setShowCompanionBubble(true);
      }, 500);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const refreshCurrentUser = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/users/profile/${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user && data.user.email?.trim().toLowerCase() === "celia970105@gmail.com") {
          data.user.role = "admin";
        }
        setCurrentUser(data.user);
        localStorage.setItem("starry_current_user", JSON.stringify(data.user));
        // Back up user details in local storage
        saveUserBackup(data.user);
      } else if (res.status === 404 && currentUser.email) {
        // Automatically restore from client backup if user got wiped from ephemeral database!
        const restoredUser = await restoreUserBackup(currentUser.email);
        if (restoredUser) {
          if (restoredUser.email?.trim().toLowerCase() === "celia970105@gmail.com") {
            restoredUser.role = "admin";
          }
          setCurrentUser(restoredUser);
          localStorage.setItem("starry_current_user", JSON.stringify(restoredUser));
        }
      }
    } catch (e) {
      console.error("Failed to refresh current user:", e);
    }
  };

  // Poll current user profile for updated star_coins passively every 8 seconds
  useEffect(() => {
    if (!currentUser) return;
    refreshCurrentUser(); // Refresh once on mount/change
    const interval = setInterval(() => {
      refreshCurrentUser();
    }, 8000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // Check unread notifications count periodically
  useEffect(() => {
    if (!currentUser) {
      setUnreadNotifs(0);
      return;
    }
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch(`/api/social/notifications/${currentUser.id}`);
        if (res.ok) {
          const data = await res.json();
          const unread = (data || []).filter((n: any) => !n.is_read).length;
          setUnreadNotifs(unread);
        }
      } catch (err) {
        console.error("Failed to fetch unread notifications count:", err);
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 6000);
    return () => clearInterval(interval);
  }, [currentUser?.id, activeModule]);

  const handleLoginSuccess = (user: User) => {
    if (user && user.email?.trim().toLowerCase() === "celia970105@gmail.com") {
      user.role = "admin";
    }
    setCurrentUser(user);
    localStorage.setItem("starry_current_user", JSON.stringify(user));
    saveUserBackup(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("starry_current_user");
    setActiveModule("home");
  };

  const getNavLabel = (id: string, customLabel: string) => {
    const defaultLabels: Record<string, string[]> = {
      gallery: ["圖片相簿", "相片應援"],
      video: ["影片專區", "影音珍藏"],
      letters: ["紙短情長", "星星信箱"],
      museum: ["美術展覽館", "星願畫廊"],
      pets: ["星寵家園"],
    };
    const isDefault = !customLabel || defaultLabels[id]?.includes(customLabel);
    if (isDefault) {
      return t(id);
    }
    return customLabel;
  };

  // Navigations mapping
  const navItems = [
    { id: "gallery", label: getNavLabel("gallery", galleryTitle), icon: Camera },
    { id: "video", label: getNavLabel("video", videoTitle), icon: Film },
    { id: "letters", label: getNavLabel("letters", lettersTitle), icon: Mail },
    { id: "museum", label: getNavLabel("museum", museumTitle), icon: Palette },
    { id: "pets", label: getNavLabel("pets", petsTitle), icon: Smile },
  ];

  return (
    <div className="min-h-screen text-white relative font-sans flex flex-col justify-between">
      {/* Absolute Layered Starry Night Background */}
      <StarryBackground />

      {/* Opening Intro Animation */}
      <AnimatePresence>
        {showIntro && (
          <CupidoIntro onComplete={() => setShowIntro(false)} />
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-[#FFF6F2]/75 backdrop-blur-md border-b border-[#FF799C]/15 py-3 sm:py-4 px-3 sm:px-6 transition-all text-[#6E4B55]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo Brand */}
          <div 
            onClick={() => setActiveModule("home")}
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group"
          >
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-tr from-[#FF799C] to-[#FFCCDD] flex items-center justify-center shadow-lg shadow-[#FF799C]/20 transition-transform group-hover:scale-105">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 text-white fill-current animate-spin-slow" />
            </div>
            <div className="text-left">
              <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.2em] sm:tracking-[0.25em] text-[#FF799C] block uppercase font-bold truncate max-w-[90px] sm:max-w-none">
                {t("all_for_jiyu")}
              </span>
              <h1 className="text-sm sm:text-lg font-serif font-light tracking-widest text-[#FF799C]">
                {t("starry_support")}
              </h1>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#FF799C]/5 p-1 rounded-2xl border border-[#FF799C]/10">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all ${activeModule === item.id ? "bg-[#FF799C] text-white shadow-lg shadow-[#FF799C]/15" : "text-[#6E4B55]/70 hover:text-[#FF799C] hover:bg-[#FF799C]/5"}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Auth Widgets */}
          <div className="flex items-center gap-3">
            {/* Language Selection Dropdown */}
            <div className="flex items-center gap-1 bg-white/60 hover:bg-white border border-[#FF799C]/20 rounded-xl px-2.5 py-1.5 transition-all shadow-sm">
              <span className="text-xs">🌐</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-transparent text-[#6E4B55] text-xs cursor-pointer focus:outline-none font-sans font-medium"
              >
                <option value="zh-TW">繁體</option>
                <option value="zh-CN">简体</option>
              </select>
            </div>

            {currentUser?.role === "admin" && (
              <button
                onClick={() => setActiveModule("admin")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#FF799C]/30 bg-[#FF799C]/10 text-[#FF799C] text-[10px] font-mono font-bold tracking-wider uppercase transition-all hover:bg-[#FF799C]/20 active:scale-95 ${activeModule === "admin" ? "ring-2 ring-[#FF799C]" : ""}`}
              >
                <Shield className="h-3 w-3" />
                <span>ADMIN</span>
              </button>
            )}

            {currentUser ? (
              <button
                onClick={() => setActiveModule("user")}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border transition-all relative ${activeModule === "user" ? "bg-[#FF799C] text-white border-[#FF799C]" : "bg-white/50 border-[#FF799C]/15 hover:bg-white text-[#6E4B55]"}`}
              >
                <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full overflow-hidden border border-[#FF799C]/20 bg-white/10 flex items-center justify-center">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="avatar" className="h-full w-full" />
                  ) : (
                    <div className="w-full h-full bg-[#FF799C]/10" />
                  )}
                </div>
                <span className="text-[11px] sm:text-xs text-[#6E4B55]/90 font-medium truncate max-w-[60px] sm:max-w-[80px]">
                  {currentUser.username}
                </span>
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold font-mono border-2 border-[#FFF6F2] shadow-sm animate-bounce">
                    {unreadNotifs}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setActiveModule("user")}
                className="flex items-center gap-1 bg-gradient-to-r from-[#FF799C] to-[#FFCCDD] hover:opacity-90 text-white text-[11px] sm:text-xs font-semibold tracking-wider px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-md transition-all active:scale-95"
              >
                <UserIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>登入</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Sparkly interactive click particles portal layer */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {sparkles.map((spark) => (
          <motion.div
            key={spark.id}
            initial={{ opacity: 1, scale: 0.2, x: spark.x, y: spark.y }}
            animate={{
              opacity: 0,
              scale: [1, 2, 0.5],
              x: spark.x + (Math.random() * 240 - 120),
              y: spark.y + (Math.random() * 240 - 120),
              rotate: 360
            }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute text-2xl select-none"
          >
            {spark.char}
          </motion.div>
        ))}
      </div>

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 pb-24 md:pb-8 relative z-10 text-[#6E4B55] has-[.fridge-open]:z-50 has-[.modal-open-layer]:z-50">
        <AnimatePresence mode="wait">
          {activeModule === "home" && (
            /* Home Visual + Stars Grid Entry */
            <motion.div
              key="home-module"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="space-y-12"
            >
              {/* Hero Banner Grid layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                {/* Left 3D style girl visual (7 Cols) */}
                <div className="lg:col-span-7 flex flex-col items-center justify-center relative min-h-[420px] w-full">
                  {/* Decorative glowing tags */}
                  <div className="md:absolute md:top-0 md:left-4 text-left w-full mb-6 md:mb-0">
                    <span className="text-[9px] md:text-[10px] font-mono tracking-[0.25em] md:tracking-[0.4em] text-[#FF799C] block uppercase font-bold">
                      ZACK • EXCLUSIVE DEBUT • JEREMY
                    </span>
                    <h2 id="home-hero-title" className="text-2xl sm:text-3xl md:text-5xl font-serif font-light text-[#FF799C] tracking-widest mt-2 leading-tight">
                      {!heroTitle || heroTitle === "ALL FOR JIYU" || heroTitle === "極禹 TOP 1 雙向奔赴" ? t("hero_title") : heroTitle}
                    </h2>
                    <p className="text-[#6E4B55]/70 text-[11px] md:text-xs mt-3 tracking-widest max-w-md font-sans leading-relaxed">
                      {!heroSub || heroSub.startsWith("ALL FOR JIYU - 專屬 Jiyu") || heroSub.startsWith("在這裡記錄每一次") ? t("hero_sub") : heroSub}
                    </p>
                  </div>

                  {/* Clickable Visual composition: Transparent Crystal Girl & Star */}
                  <div 
                    onClick={(e) => {
                      // Trigger particle explosion and portal transition
                      const newSparkles = Array.from({ length: 15 }).map((_, i) => ({
                        id: Date.now() + i,
                        x: e.clientX || window.innerWidth / 3,
                        y: e.clientY || window.innerHeight / 2,
                        char: ["✨", "⭐", "🌸", "💖", "💫"][Math.floor(Math.random() * 5)]
                      }));
                      setSparkles(newSparkles);
                      setTimeout(() => {
                        setActiveModule("portal");
                        setSparkles([]);
                      }, 750);
                    }}
                    className="relative mt-6 md:mt-24 h-[300px] md:h-[330px] w-full flex items-center justify-center cursor-pointer group select-none"
                    title={t("portal_tip")}
                  >
                    {/* Glowing background star aura */}
                    <div className="absolute h-64 w-64 rounded-full bg-[#FF799C]/15 blur-3xl animate-pulse group-hover:scale-110 transition-transform" />

                    {/* Y2K Fluffy Fuzzy Star Composition (毛茸茸的星星) */}
                    <svg
                      width="260"
                      height="260"
                      viewBox="0 0 120 120"
                      fill="none"
                      className="drop-shadow-[0_8px_25px_rgba(255,121,156,0.35)] group-hover:scale-105 transition-transform duration-500"
                    >
                      <defs>
                        {/* Perfect fluffy cotton wool displacement filter */}
                        <filter id="fuzzyMain" x="-25%" y="-25%" width="150%" height="150%">
                          <feTurbulence type="fractalNoise" baseFrequency="0.14" numOctaves="3" result="noise" />
                          <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
                        </filter>
                        
                        <linearGradient id="fluffyStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FFF2F5" />
                          <stop offset="35%" stopColor="#FFCCD9" />
                          <stop offset="70%" stopColor="#D2E4FF" />
                          <stop offset="100%" stopColor="#E3D1FF" />
                        </linearGradient>
                      </defs>

                      {/* Orbiting cyber rings / sparkles */}
                      <ellipse cx="60" cy="60" rx="46" ry="12" stroke="rgba(255, 121, 156, 0.3)" strokeWidth="1" strokeDasharray="4 4" className="animate-spin-slow" style={{ transformOrigin: "60px 60px" }} />
                      <ellipse cx="60" cy="60" rx="12" ry="46" stroke="rgba(255, 121, 156, 0.2)" strokeWidth="1" strokeDasharray="3 3" className="animate-spin-slow" style={{ transformOrigin: "60px 60px", animationDirection: "reverse" }} />
                      
                      {/* Cyber crosshair guide lines */}
                      <line x1="10" y1="60" x2="110" y2="60" stroke="rgba(255, 121, 156, 0.12)" strokeWidth="1" />
                      <line x1="60" y1="10" x2="60" y2="110" stroke="rgba(255, 121, 156, 0.12)" strokeWidth="1" />
                      
                      {/* Glowing decorative tiny sparkles */}
                      <circle cx="20" cy="40" r="1.5" fill="#FF799C" className="animate-ping" />
                      <circle cx="100" cy="80" r="1.5" fill="#FF799C" className="animate-ping" style={{ animationDelay: "0.5s" }} />

                      {/* Main Cotton Candy Star Body */}
                      <path
                        d="M 60,12 L 73,44 L 105,44 L 79,64 L 89,96 L 60,78 L 31,96 L 41,64 L 15,44 L 47,44 Z"
                        fill="url(#fluffyStarGrad)"
                        filter="url(#fuzzyMain)"
                        stroke="#FFF2F5"
                        strokeWidth="2.5"
                        className="animate-pulse"
                        style={{ transformOrigin: "60px 60px", animationDuration: "3.5s" }}
                      />

                      {/* Soft blurred volumetric cotton candy clouds for 3D fluff depth */}
                      <circle cx="60" cy="56" r="14" fill="rgba(255, 255, 255, 0.45)" filter="blur(5px)" pointerEvents="none" />
                      <circle cx="48" cy="50" r="8" fill="rgba(255, 255, 255, 0.25)" filter="blur(3px)" pointerEvents="none" />
                      <circle cx="72" cy="50" r="8" fill="rgba(255, 255, 255, 0.25)" filter="blur(3px)" pointerEvents="none" />

                      {/* Blushing cheeks (Unfiltered for perfect roundness & softness) */}
                      <ellipse cx="43" cy="58" rx="5" ry="3" fill="#FF4B72" opacity="0.6" />
                      <ellipse cx="77" cy="58" rx="5" ry="3" fill="#FF4B72" opacity="0.6" />

                      {/* Cute Anime Eyes (Crisp and twinkling) */}
                      <circle cx="48" cy="52" r="3.5" fill="#6E4B55" />
                      <circle cx="72" cy="52" r="3.5" fill="#6E4B55" />
                      {/* Highlights */}
                      <circle cx="46.5" cy="50.2" r="1.2" fill="white" />
                      <circle cx="70.5" cy="50.2" r="1.2" fill="white" />

                      {/* Cute happy open mouth */}
                      <path d="M 56,58 Q 60,61 64,58" stroke="#6E4B55" strokeWidth="2" strokeLinecap="round" fill="none" />

                      {/* Outer cute orbital bead */}
                      <circle cx="82" cy="38" r="3.5" fill="#FF799C" className="animate-bounce" style={{ animationDuration: "2.5s" }} />
                    </svg>

                    {/* Pulse hint overlay */}
                    <div className="absolute bottom-4 bg-white/95 border border-[#FF799C]/25 text-[#FF799C] text-[10px] font-mono tracking-widest px-3.5 py-1.5 rounded-full shadow-md animate-bounce">
                      ✨ CLICK ME TO ENTER PORTAL
                    </div>

                    {/* Small transparent crystal pet home graphic at foot */}
                    <div className="absolute bottom-[-15px] left-[32%] px-3.5 py-1.5 rounded-full border border-[#FF799C]/15 glass bg-white/50 text-[9px] font-mono tracking-widest text-[#FF799C] flex items-center gap-1 shadow-md">
                      <span className="text-xs">🏡</span>
                      <span>CRYSTAL PET DEN</span>
                    </div>
                  </div>
                </div>

                {/* Right Star Entry Constellation (5 Cols) */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="text-left">
                    <span className="text-xs font-mono tracking-[0.3em] text-[#FF799C] block mb-1">
                      CONSTELLATION ENTRANCE
                    </span>
                    <h3 className="text-2xl font-serif font-light text-[#FF799C] tracking-wide">
                      星宿入口系統
                    </h3>
                    <p className="text-xs text-[#6E4B55]/70 mt-1.5 leading-relaxed">
                      點擊天軌中的漂浮星宿卡片，直接跳轉傳送至專屬應援區：
                    </p>
                  </div>

                  {/* Constellation list */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Gallery Entrance */}
                    <button
                      onClick={() => setActiveModule("gallery")}
                      className="group flex flex-col items-start p-4 rounded-2xl border border-[#FF799C]/15 glass hover:border-[#FF799C]/50 transition-all duration-300 text-left relative overflow-hidden active:scale-95 hover:shadow-[0_0_20px_rgba(255,121,156,0.1)]"
                    >
                      <div className="p-3 rounded-xl bg-[#FF799C]/10 text-[#FF799C] mb-3 group-hover:scale-105 transition-transform">
                        <Camera className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-semibold font-serif text-[#6E4B55] group-hover:text-[#FF799C]">📸 {galleryTitle}</h4>
                      <p className="text-[10px] text-[#6E4B55]/50 mt-1">{galleryDesc}</p>
                      <Star className="absolute right-3 top-3 h-3 w-3 text-[#FF799C]/20 group-hover:text-[#FF799C] transition-colors" />
                    </button>

                    {/* Video Entrance */}
                    <button
                      onClick={() => setActiveModule("video")}
                      className="group flex flex-col items-start p-4 rounded-2xl border border-[#FF799C]/15 glass hover:border-[#FF799C]/50 transition-all duration-300 text-left relative overflow-hidden active:scale-95 hover:shadow-[0_0_20px_rgba(255,121,156,0.1)]"
                    >
                      <div className="p-3 rounded-xl bg-[#FF799C]/10 text-[#FF799C] mb-3 group-hover:scale-105 transition-transform">
                        <Film className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-semibold font-serif text-[#6E4B55] group-hover:text-[#FF799C]">🎬 {videoTitle}</h4>
                      <p className="text-[10px] text-[#6E4B55]/50 mt-1">{videoDesc}</p>
                      <Star className="absolute right-3 top-3 h-3 w-3 text-[#FF799C]/20 group-hover:text-[#FF799C] transition-colors" />
                    </button>

                    {/* Letters Entrance */}
                    <button
                      onClick={() => setActiveModule("letters")}
                      className="group flex flex-col items-start p-4 rounded-2xl border border-[#FF799C]/15 glass hover:border-[#FF799C]/50 transition-all duration-300 text-left relative overflow-hidden active:scale-95 hover:shadow-[0_0_20px_rgba(255,121,156,0.1)]"
                    >
                      <div className="p-3 rounded-xl bg-[#FF799C]/10 text-[#FF799C] mb-3 group-hover:scale-105 transition-transform">
                        <Mail className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-semibold font-serif text-[#6E4B55] group-hover:text-[#FF799C]">💌 {lettersTitle}</h4>
                      <p className="text-[10px] text-[#6E4B55]/50 mt-1">{lettersDesc}</p>
                      <Star className="absolute right-3 top-3 h-3 w-3 text-[#FF799C]/20 group-hover:text-[#FF799C] transition-colors" />
                    </button>

                    {/* Museum Entrance */}
                    <button
                      onClick={() => setActiveModule("museum")}
                      className="group flex flex-col items-start p-4 rounded-2xl border border-[#FF799C]/15 glass hover:border-[#FF799C]/50 transition-all duration-300 text-left relative overflow-hidden active:scale-95 hover:shadow-[0_0_20px_rgba(255,121,156,0.1)]"
                    >
                      <div className="p-3 rounded-xl bg-[#FF799C]/10 text-[#FF799C] mb-3 group-hover:scale-105 transition-transform">
                        <Palette className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-semibold font-serif text-[#6E4B55] group-hover:text-[#FF799C]">🎨 {museumTitle}</h4>
                      <p className="text-[10px] text-[#6E4B55]/50 mt-1">{museumDesc}</p>
                      <Star className="absolute right-3 top-3 h-3 w-3 text-[#FF799C]/20 group-hover:text-[#FF799C] transition-colors" />
                    </button>

                    {/* Music Entrance */}
                    <button
                      onClick={() => {
                        // Scroll to the music box
                        const el = document.getElementById("starry-music-box");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="group col-span-2 flex items-center p-4 rounded-2xl border border-[#FF799C]/15 glass hover:border-[#FF799C]/50 transition-all duration-300 text-left relative overflow-hidden active:scale-95 hover:shadow-[0_0_20px_rgba(255,121,156,0.1)] gap-4"
                    >
                      <div className="p-3 rounded-xl bg-[#FF799C]/10 text-[#FF799C] shrink-0 group-hover:rotate-12 transition-transform">
                        <Music className="h-5 w-5 animate-pulse" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold font-serif text-[#6E4B55] group-hover:text-[#FF799C]">🎵 {musicTitle}</h4>
                        <p className="text-[10px] text-[#6E4B55]/50 mt-1">{musicDesc}</p>
                      </div>
                      <Star className="absolute right-3 top-3 h-3 w-3 text-[#FF799C]/20" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Music Player Board Section (Centered below on Home) */}
              <div id="starry-music-box" className="pt-8 border-t border-[#FF799C]/10">
                <div className="text-center mb-6">
                  <span className="text-xs font-mono tracking-[0.3em] text-[#FF799C] uppercase">
                    STARRY VINYL AUDIO
                  </span>
                  <h3 className="text-2xl font-serif font-light text-[#FF799C] tracking-wide mt-1.5">
                    黑膠音軌唱片機
                  </h3>
                </div>
                <MusicPlayer currentUser={currentUser} onRefreshData={refreshCurrentUser} />
              </div>
            </motion.div>
          )}

          {activeModule === "portal" && (
            <motion.div
              key="portal-module"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center justify-center py-10"
            >
              <div className="text-center mb-12">
                <span className="text-xs font-mono tracking-[0.4em] text-[#FF799C] uppercase block mb-1">
                  STARRY PORTAL • DISCOVER THE STAR
                </span>
                <h2 className="text-4xl font-serif font-light text-[#FF799C] tracking-widest">
                  星願傳送門
                </h2>
                <p className="text-xs text-[#6E4B55]/70 mt-2 max-w-md mx-auto leading-relaxed">
                  歡迎來到璀璨夢幻星願之境！點擊下方懸浮在空中的魔法卡片，進入對應的應援世界：
                </p>
              </div>

              {/* 5 Floating cards layout in a bento-style circular/staggered grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl w-full px-4">
                {[
                  { id: "gallery", label: galleryTitle, desc: galleryDesc, icon: Camera, color: "from-[#FF799C] to-[#FFCCDD]" },
                  { id: "video", label: videoTitle, desc: videoDesc, icon: Film, color: "from-[#FF8C94] to-[#FFAAA6]" },
                  { id: "letters", label: lettersTitle, desc: lettersDesc, icon: Mail, color: "from-[#FFA2A9] to-[#FFD0D0]" },
                  { id: "museum", label: museumTitle, desc: museumDesc, icon: Palette, color: "from-[#FF799C] to-[#FFAAA6]" },
                  { id: "pets", label: petsTitle, desc: petsDesc, icon: Smile, color: "from-[#FF799C] to-[#FFCCDD]" }
                ].map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.id}
                      onClick={() => {
                        setActiveModule(card.id);
                      }}
                      className="cursor-pointer group relative rounded-[32px] p-6 glass border border-[#FF799C]/20 hover:border-[#FF799C]/50 shadow-md hover:shadow-lg hover:shadow-[#FF799C]/10 transition-all duration-300 bg-white/20"
                      animate={{
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 3.5 + idx * 0.4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
                      <div className="absolute top-3 right-3 text-yellow-300 text-xs animate-pulse">⭐</div>
                      
                      <div className={`p-4 rounded-2xl bg-gradient-to-tr ${card.color} text-white mb-6 flex items-center justify-center w-12 h-12 shadow-md shadow-[#FF799C]/10 group-hover:scale-110 transition-transform`}>
                        <Icon className="h-6 w-6" />
                      </div>

                      <h3 className="text-lg font-serif font-light text-[#FF799C] group-hover:text-[#FF799C] transition-colors text-left">
                        {card.label}
                      </h3>
                      <p className="text-xs text-[#6E4B55]/70 mt-2 text-left leading-relaxed">
                        {card.desc}
                      </p>

                      <div className="mt-6 flex items-center justify-end text-[9px] font-mono tracking-widest text-[#FF799C] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                        ENTER PORTAL →
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Back to Home Button */}
              <button
                onClick={() => setActiveModule("home")}
                className="mt-12 px-6 py-2.5 rounded-full text-xs font-semibold border border-[#FF799C]/30 bg-[#FF799C]/10 text-[#FF799C] hover:bg-[#FF799C]/20 transition-all active:scale-95"
              >
                ← 返回主頁
              </button>
            </motion.div>
          )}

          {activeModule === "gallery" && (
            <motion.div
              key="gallery-module"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <GalleryModule currentUser={currentUser} onRefreshData={refreshCurrentUser} />
            </motion.div>
          )}

          {activeModule === "video" && (
            <motion.div
              key="video-module"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <VideoModule currentUser={currentUser} onRefreshData={refreshCurrentUser} />
            </motion.div>
          )}

          {activeModule === "letters" && (
            <motion.div
              key="letters-module"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <LettersModule currentUser={currentUser} onRefreshData={refreshCurrentUser} />
            </motion.div>
          )}

          {activeModule === "museum" && (
            <motion.div
              key="museum-module"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <MuseumModule currentUser={currentUser} onRefreshData={refreshCurrentUser} />
            </motion.div>
          )}

          {activeModule === "pets" && (
            <motion.div
              key="pets-module"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <PetsModule currentUser={currentUser} />
            </motion.div>
          )}

          {activeModule === "user" && (
            <motion.div
              key="user-module"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <UserModule
                currentUser={currentUser}
                onLoginSuccess={handleLoginSuccess}
                onLogout={handleLogout}
                refreshCurrentUser={refreshCurrentUser}
                onNavigateToAdmin={() => setActiveModule("admin")}
              />
            </motion.div>
          )}

          {activeModule === "admin" && (
            <motion.div
              key="admin-module"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AdminModule currentUser={currentUser} onRefreshData={refreshCurrentUser} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFF6F2]/95 backdrop-blur-md border-t border-[#FF799C]/15 py-2 px-2 flex justify-around items-center text-[#6E4B55] shadow-[0_-4px_12px_rgba(255,121,156,0.08)]">
        <button
          onClick={() => setActiveModule("home")}
          className={`flex flex-col items-center gap-0.5 min-w-[56px] transition-colors ${activeModule === "home" ? "text-[#FF799C]" : "text-[#6E4B55]/60"}`}
        >
          <Star className="h-5 w-5 fill-current opacity-90" />
          <span className="text-[9px] font-medium tracking-tight">主頁</span>
        </button>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`flex flex-col items-center gap-0.5 min-w-[56px] transition-colors ${activeModule === item.id ? "text-[#FF799C]" : "text-[#6E4B55]/60"}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-medium tracking-tight truncate max-w-[56px]">{item.label}</span>
            </button>
          );
        })}
        {currentUser?.role === "admin" && (
          <button
            onClick={() => setActiveModule("admin")}
            className={`flex flex-col items-center gap-0.5 min-w-[56px] transition-colors ${activeModule === "admin" ? "text-[#FF799C]" : "text-[#6E4B55]/60"}`}
          >
            <Shield className="h-5 w-5 animate-pulse" />
            <span className="text-[9px] font-medium tracking-tight">審核</span>
          </button>
        )}
      </div>

      {/* Floating Star Pet Companion in corner (隨機出現在網站互動) */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex items-end gap-3 pointer-events-none">
        <AnimatePresence>
          {showCompanionBubble && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              className="bg-white/95 text-xs font-sans text-[#6E4B55] border border-[#FF799C]/30 px-4 py-2.5 rounded-2xl max-w-xs shadow-xl relative pointer-events-auto shadow-[#FF799C]/5"
            >
              {/* Talk Bubble Arrow */}
              <div className="absolute bottom-4 right-[-6px] h-3 w-3 bg-white border-r border-t border-[#FF799C]/30 transform rotate-45" />
              <p className="leading-relaxed font-medium">{companionGreeting}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cute micro-companion STAR */}
        <motion.div
          animate={{
            y: [0, -6, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          onClick={() => setActiveModule("pets")}
          className="h-16 w-16 cursor-pointer flex items-center justify-center pointer-events-auto relative filter drop-shadow-[0_4px_12px_rgba(255,121,156,0.35)] hover:scale-110 active:scale-95 transition-all"
          title="應援小星寵"
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 100 100"
            fill="none"
          >
            <defs>
              <linearGradient id="compStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF2F5" />
                <stop offset="50%" stopColor="#FFCCDD" />
                <stop offset="100%" stopColor="#FF799C" />
              </linearGradient>
            </defs>
            {/* Adorable Star Body */}
            <path
              d="M 50 5 L 63 37 L 97 37 L 70 58 L 81 92 L 50 72 L 19 92 L 30 58 L 3 37 L 37 37 Z"
              fill="url(#compStarGrad)"
              stroke="#FFF"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            
            {/* Star blushing cheeks */}
            <ellipse cx="36" cy="54" rx="5" ry="3" fill="#FF799C" opacity="0.6" />
            <ellipse cx="64" cy="54" rx="5" ry="3" fill="#FF799C" opacity="0.6" />

            {/* Cute Anime Eyes */}
            <circle cx="41" cy="48" r="3.5" fill="#6E4B55" />
            <circle cx="59" cy="48" r="3.5" fill="#6E4B55" />
            {/* Eye highlights */}
            <circle cx="39.5" cy="46" r="1.2" fill="#FFF" />
            <circle cx="57.5" cy="46" r="1.2" fill="#FFF" />

            {/* Adorable Mouth */}
            <path d="M 46 54 Q 50 58 54 54" stroke="#6E4B55" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            
            {/* Pink bow on left star tip */}
            <path d="M 28 30 Q 23 25 28 20 Q 33 25 28 30 Z" fill="#FF799C" stroke="#FFF" strokeWidth="1" />
            <path d="M 28 30 Q 33 35 28 40 Q 23 35 28 30 Z" fill="#FF799C" stroke="#FFF" strokeWidth="1" />
            <circle cx="28" cy="30" r="2.5" fill="#FFCCDD" stroke="#FFF" strokeWidth="0.8" />
          </svg>
          
          {/* Orbiting tiny stardust */}
          <div className="absolute top-0 right-0 text-[10px] animate-bounce">⭐</div>
          <div className="absolute bottom-1 left-0 text-[8px] animate-pulse text-[#FF799C]">✨</div>
        </motion.div>
      </div>

      {/* Elegant Footer Area */}
      <footer className="z-10 border-t border-[#FF799C]/10 py-6 px-6 text-center text-[#6E4B55]/50 text-[10px] font-mono tracking-widest uppercase bg-[#FFF6F2]/30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>
            © 2026 STARRY WISH SUPPORT PLATFORM. ALL FOR JIYU • ZACK • JEREMY.
          </span>
          <span className="text-[#FF799C]/60 hover:text-[#FF799C] transition-colors cursor-pointer">
            Design By AMSS
          </span>
        </div>
      </footer>
    </div>
  );
}
