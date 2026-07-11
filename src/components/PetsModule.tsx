import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Music, Heart, Smile, Star, Send, Edit2, Check, 
  RefreshCw, HelpCircle, Users, Image, Camera, Lock, UserPlus, 
  Coins, Plus, CheckCircle, Info, ChevronRight, X, Bell
} from "lucide-react";
import { User } from "../types";
import PetsCanvasBoard from "./PetsCanvasBoard";
import PlogModule from "./PlogModule";
import { updateFriendsBackup } from "../lib/syncHelper";

interface PetsModuleProps {
  currentUser: User | null;
  onRefreshData?: () => void;
}

// Food / Treats inside the Refrigerator
interface FoodItem {
  id: string;
  name: string;
  icon: string; // HTML/SVG represented inside list
  effect: string;
  fullnessVal: number;
  loveVal: number;
  cost: number;
  description: string;
  dialog: string;
}

const REFRIGERATOR_FOOD_TEMPLATES: FoodItem[] = [
  { 
    id: "cotton_candy", 
    name: "星願棉花糖", 
    icon: "🍥", 
    effect: "飽食 +15 • 幸福 +8", 
    fullnessVal: 15, 
    loveVal: 8, 
    cost: 20,
    description: "蓬蓬鬆鬆的水蜜桃粉色棉花糖，咬一口像睡在雲端",
    dialog: "好軟好甜喔！我的棉花糖身體感覺要融化在你的愛裡了～🧁✨"
  },
  { 
    id: "peach_juice", 
    name: "蜜桃流星果汁", 
    icon: "🍹", 
    effect: "飽食 +10 • 幸福 +10", 
    fullnessVal: 10, 
    loveVal: 10, 
    cost: 15,
    description: "裝在愛心玻璃杯裡的蜜桃起泡果汁，散發星星亮粉",
    dialog: "咕嚕咕嚕～哈！這個蜜桃起泡果汁有戀愛的味道耶！🍹💖"
  },
  { 
    id: "star_macaron", 
    name: "星星糖霜馬卡龍", 
    icon: "🧁", 
    effect: "飽食 +25 • 幸福 +15", 
    fullnessVal: 25, 
    loveVal: 15, 
    cost: 35,
    description: "精緻奢華的櫻花糖霜星星造型馬卡龍，帶有粉色蕾絲邊",
    dialog: "天啊！這馬卡龍也太精緻了吧！卡嚓一聲，滿口櫻花香！🌸🧸"
  },
  { 
    id: "cherry_pudding", 
    name: "櫻桃草莓布丁", 
    icon: "🍮", 
    effect: "飽食 +20 • 幸福 +12", 
    fullnessVal: 20, 
    loveVal: 12, 
    cost: 25,
    description: "Q彈抖動的粉嫩草莓布丁，頂部裝飾著雙生新鮮櫻桃",
    dialog: "彈彈彈～像果凍一樣抖動的布丁最棒了！甜滋滋的超級幸福🍮⭐"
  }
];

// Seeded users list for easy simulation of "adding friends"
const SUGGESTED_FRIENDS = [
  { id: "user_zack", username: "ZackLover", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Zack", email: "zack@starry.com" },
  { id: "user_jeremy", username: "JeremyFan", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jeremy", email: "jeremy@starry.com" },
  { id: "user_star", username: "MarshmallowStar", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Star", email: "star@starry.com" }
];

interface PetInstance {
  id: string; // "star" | "pig" | "dog"
  species: "star" | "pig" | "dog";
  name: string;
  level: number;
  exp: number;
  fullness: number;
  love: number;
  customSkin: string;
  currentHome: string; // "home_star" | "home_pig" | "home_dog"
}

const getInitialPets = (localKey: string, legacyName: string, legacyFullness: number, legacyLove: number, legacyLevel: number, legacyExp: number, legacySkin: string): PetInstance[] => {
  if (typeof window !== "undefined") {
    const v = localStorage.getItem(`${localKey}_pets_v2`);
    if (v) {
      try {
        const parsed = JSON.parse(v);
        if (parsed && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Error parsing pets list", e);
      }
    }
  }

  // Fallback / Initial Seed: ONLY the Star is owned initially!
  return [
    {
      id: "star",
      species: "star",
      name: legacyName || "棉花糖糖",
      level: legacyLevel || 1,
      exp: legacyExp || 0,
      fullness: legacyFullness !== undefined ? legacyFullness : 60,
      love: legacyLove !== undefined ? legacyLove : 70,
      customSkin: legacySkin || "",
      currentHome: "home_star"
    }
  ];
};

const getPetPositionClass = (idx: number, total: number) => {
  if (total <= 1) {
    return { left: "50%", transform: "translateX(-50%)" };
  }
  if (total === 2) {
    return idx === 0
      ? { left: "28%", transform: "translateX(-50%)" }
      : { left: "72%", transform: "translateX(-50%)" };
  }
  // 3 or more pets
  if (idx === 0) return { left: "20%", transform: "translateX(-50%)" };
  if (idx === 1) return { left: "50%", transform: "translateX(-50%)" };
  return { left: "80%", transform: "translateX(-50%)" };
};

interface FurnitureItem {
  id: string;
  name: string;
  x: number;
  y: number;
  description: string;
}

interface ShopFurnitureItem {
  id: string;
  name: string;
  cost: number;
  description: string;
  vibe: string;
}

const SHOP_FURNITURE_TEMPLATES: ShopFurnitureItem[] = [
  { id: "table", name: "蜜桃蝴蝶結小圓桌", cost: 80, description: "擺放著櫻桃小甜點的雙層粉紅蕾絲邊圓桌", vibe: "Cute" },
  { id: "wardrobe", name: "櫻花公主旋轉衣櫥", cost: 180, description: "散發粉紅亮粉的魔幻衣櫥，可以收納漂亮的配件", vibe: "Princess" },
  { id: "piano", name: "星光水晶迷你鋼琴", cost: 380, description: "用透明水晶打造的粉嫩鋼琴，彈奏時會發出流星雨音效", vibe: "Elegant" },
  { id: "tv", name: "草莓波點復古小電視", cost: 680, description: "外殼是可愛草莓造型的舊式天線電視，播放著應援回憶錄", vibe: "Retro" },
  { id: "castle", name: "璀璨极禹星空城堡", cost: 1200, description: "超級奢華的雙層粉色星光小城堡，是全宇宙最高貴的玩具", vibe: "Dreamy" }
];

interface Achievement {
  id: string;
  title: string;
  description: string;
  targetType: "posts" | "feed_pet" | "buy_furniture" | "pet_level" | "friend_visit";
  targetValue: number;
  rewardCoins: number;
  icon: string;
}

const ACHIEVEMENTS_LIST: Achievement[] = [
  { id: "FIRST_POST", title: "初次發射星光", description: "發布 1 次應援投稿（照片、影片、信件、畫作或音樂）", targetType: "posts", targetValue: 1, rewardCoins: 100, icon: "🌠" },
  { id: "POST_MASTER", title: "璀璨應援大使", description: "累計發布 5 次應援投稿", targetType: "posts", targetValue: 5, rewardCoins: 300, icon: "👑" },
  { id: "FEED_STARTER", title: "愛心小幫手", description: "餵食星寵 5 次", targetType: "feed_pet", targetValue: 5, rewardCoins: 120, icon: "🍰" },
  { id: "FEED_EXPERT", title: "萌星小廚神", description: "餵食星寵 15 次", targetType: "feed_pet", targetValue: 15, rewardCoins: 250, icon: "👩‍🍳" },
  { id: "DECORATOR", title: "夢幻設計師", description: "購買或擁有 8 件家具", targetType: "buy_furniture", targetValue: 8, rewardCoins: 200, icon: "🎀" },
  { id: "LEVEL_UPPER", title: "萌星培育專家", description: "星寵等級達到 3 級", targetType: "pet_level", targetValue: 3, rewardCoins: 150, icon: "⭐" },
  { id: "PET_MASTER", title: "宇宙級巨星萌伴", description: "星寵等級達到 5 級", targetType: "pet_level", targetValue: 5, rewardCoins: 400, icon: "🌌" },
  { id: "SOCIAL_BUTTERFLY", title: "交友廣闊", description: "與好友進行拜訪互動 5 次", targetType: "friend_visit", targetValue: 5, rewardCoins: 150, icon: "🤝" }
];

const DEFAULT_FURNITURE: FurnitureItem[] = [
  { id: "bed", name: "棉花糖蓬蓬床", x: 20, y: 150, description: "圓潤香甜的草莓棉花糖大床" },
  { id: "sofa", name: "蜜桃雲朵沙發", x: 190, y: 160, description: "像雲朵般舒適的圓角粉紅小沙發" },
  { id: "lamp", name: "流星粉紅檯燈", x: 30, y: 55, description: "散發溫暖星光的蜜桃色落地燈" },
  { id: "rug", name: "蝴蝶結草莓地毯", x: 105, y: 165, description: "鋪在房內中央的可愛蝴蝶結毛絨絨地毯" },
  { id: "fridge", name: "草莓波點冰箱", x: 120, y: 50, description: "可以點擊查看食物美味的 retro 粉色小冰箱" }
];

// Render Cute Rounded Pink SVGs for Furniture instead of emoji
const FURNITURE_SVGS: Record<string, React.ReactNode> = {
  bed: (
    <svg width="65" height="50" viewBox="0 0 100 80" className="filter drop-shadow-md">
      <rect x="5" y="10" width="90" height="40" rx="15" fill="#FFAEC9" />
      <circle cx="15" cy="20" r="4" fill="#FFF" opacity="0.6" />
      <circle cx="85" cy="20" r="4" fill="#FFF" opacity="0.6" />
      <rect x="10" y="30" width="80" height="40" rx="12" fill="#FFF0F5" stroke="#FFD2E0" strokeWidth="2" />
      <rect x="20" y="22" width="25" height="15" rx="6" fill="#FFC0CB" />
      <rect x="55" y="22" width="25" height="15" rx="6" fill="#FFC0CB" />
      <path d="M 32.5 28 C 32.5 28 31 26 29 26 C 27 26 27 28.5 29 30.5 L 32.5 33 L 36 30.5 C 38 28.5 38 26 36 26 C 34 26 32.5 28 32.5 28 Z" fill="#FF799C" />
      <rect x="10" y="42" width="80" height="28" rx="8" fill="#FFD2E0" />
      <path d="M 10 45 Q 25 40 40 45 Q 55 50 70 45 Q 80 40 90 45 L 90 70 L 10 70 Z" fill="#FFB7CE" opacity="0.5" />
    </svg>
  ),
  sofa: (
    <svg width="65" height="45" viewBox="0 0 100 70" className="filter drop-shadow-md">
      <circle cx="25" cy="30" r="20" fill="#FFAEC9" />
      <circle cx="50" cy="25" r="22" fill="#FFAEC9" />
      <circle cx="75" cy="30" r="20" fill="#FFAEC9" />
      <circle cx="35" cy="32" r="16" fill="#FFF2F5" opacity="0.4" />
      <circle cx="65" cy="32" r="16" fill="#FFF2F5" opacity="0.4" />
      <rect x="10" y="38" width="80" height="22" rx="10" fill="#FFC0CB" stroke="#FF9DBE" strokeWidth="1.5" />
      <rect x="3" y="33" width="12" height="24" rx="6" fill="#FFAEC9" />
      <rect x="85" y="33" width="12" height="24" rx="6" fill="#FFAEC9" />
      <rect x="20" y="58" width="6" height="8" rx="3" fill="#E6A1B5" />
      <rect x="74" y="58" width="6" height="8" rx="3" fill="#E6A1B5" />
    </svg>
  ),
  lamp: (
    <svg width="35" height="65" viewBox="0 0 60 100" className="filter drop-shadow-md">
      <ellipse cx="30" cy="92" rx="20" ry="6" fill="#E6A1B5" />
      <path d="M 30 92 L 30 40 Q 30 20 45 20" fill="none" stroke="#FFAEC9" strokeWidth="4" strokeLinecap="round" />
      <circle cx="45" cy="35" r="15" fill="#FFE2E9" className="animate-pulse" opacity="0.3" filter="blur(4px)" />
      <circle cx="45" cy="32" r="10" fill="#FF799C" />
      <path d="M 45 32 L 35 48 L 55 48 Z" fill="#FFAEC9" stroke="#FF799C" strokeWidth="1" strokeLinejoin="round" />
      <path d="M 45 48 L 45 58 M 43 58 L 47 58" stroke="#E6A1B5" strokeWidth="1" />
      <polygon points="45,58 46,61 49,61 47,63 48,66 45,64 42,66 43,63 41,61 44,61" fill="#FFEB3B" />
    </svg>
  ),
  rug: (
    <svg width="75" height="50" viewBox="0 0 100 70" className="filter drop-shadow-sm">
      <ellipse cx="50" cy="35" rx="46" ry="30" fill="#FFF0F5" stroke="#FFCCD9" strokeWidth="2.5" strokeDasharray="4 3" />
      <ellipse cx="50" cy="35" rx="36" ry="22" fill="#FFE4E1" opacity="0.8" />
      <g transform="translate(50, 35) scale(0.8)">
        <path d="M -15 -8 C -22 -15 -30 0 -15 8 Z" fill="#FF799C" stroke="#FFF" strokeWidth="1" />
        <path d="M 15 -8 C 22 -15 30 0 15 8 Z" fill="#FF799C" stroke="#FFF" strokeWidth="1" />
        <path d="M -8 5 L -18 22 L -10 20 Z" fill="#FF799C" />
        <path d="M 8 5 L 18 22 L 10 20 Z" fill="#FF799C" />
        <circle cx="0" cy="0" r="5.5" fill="#FF4B72" stroke="#FFF" strokeWidth="1" />
      </g>
    </svg>
  ),
  fridge: (
    <svg width="45" height="65" viewBox="0 0 70 100" className="filter drop-shadow-md">
      <rect x="5" y="5" width="60" height="90" rx="14" fill="#FFC2D1" stroke="#FF9FB6" strokeWidth="2.5" />
      <line x1="5" y1="38" x2="65" y2="38" stroke="#FF9FB6" strokeWidth="2" />
      <circle cx="20" cy="20" r="1.5" fill="#FFF" opacity="0.6" />
      <circle cx="50" cy="16" r="1.5" fill="#FFF" opacity="0.6" />
      <circle cx="15" cy="55" r="1.5" fill="#FFF" opacity="0.6" />
      <circle cx="48" cy="72" r="1.5" fill="#FFF" opacity="0.6" />
      <circle cx="32" cy="84" r="1.5" fill="#FFF" opacity="0.6" />
      <rect x="52" y="20" width="5" height="12" rx="2.5" fill="#FFFFFF" stroke="#FF799C" strokeWidth="1" />
      <rect x="52" y="46" width="5" height="18" rx="2.5" fill="#FFFFFF" stroke="#FF799C" strokeWidth="1" />
      <g transform="translate(25, 55) scale(0.7)">
        <path d="M 12 4 Q 6 4 6 12 Q 6 22 12 26 Q 18 22 18 12 Q 18 4 12 4 Z" fill="#FF3B30" />
        <path d="M 12 5 L 9 1 L 12 3 L 15 1 Z" fill="#4CD964" />
        <circle cx="9" cy="10" r="0.6" fill="#FFE135" />
        <circle cx="15" cy="10" r="0.6" fill="#FFE135" />
        <circle cx="12" cy="15" r="0.6" fill="#FFE135" />
        <circle cx="9" cy="18" r="0.6" fill="#FFE135" />
        <circle cx="15" cy="18" r="0.6" fill="#FFE135" />
        <circle cx="12" cy="22" r="0.6" fill="#FFE135" />
      </g>
    </svg>
  ),
  table: (
    <svg width="55" height="45" viewBox="0 0 80 70" className="filter drop-shadow-md">
      <line x1="20" y1="35" x2="15" y2="62" stroke="#E6A1B5" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="60" y1="35" x2="65" y2="62" stroke="#E6A1B5" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="40" y1="35" x2="40" y2="58" stroke="#D38AA0" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="40" cy="32" rx="35" ry="10" fill="#FFAEC9" stroke="#FF9DBE" strokeWidth="1.5" />
      <ellipse cx="40" cy="30" rx="35" ry="10" fill="#FFF0F5" />
      <path d="M 22 30 Q 31 38 40 30 Q 49 38 58 30 Q 64 36 58 30" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <rect x="36" y="22" width="8" height="6" rx="2.5" fill="#FF799C" />
      <path d="M 44 23 A 2.5 2.5 0 0 1 44 27" fill="none" stroke="#FF799C" strokeWidth="1.5" />
    </svg>
  ),
  wardrobe: (
    <svg width="50" height="70" viewBox="0 0 70 100" className="filter drop-shadow-md">
      <rect x="5" y="5" width="60" height="90" rx="12" fill="#FFAEC9" stroke="#FF799C" strokeWidth="2" />
      <line x1="35" y1="5" x2="35" y2="95" stroke="#FF799C" strokeWidth="1.5" />
      <circle cx="28" cy="50" r="4" fill="#FFF" />
      <circle cx="42" cy="50" r="4" fill="#FFF" />
      <circle cx="28" cy="50" r="2" fill="#FF4B72" />
      <circle cx="42" cy="50" r="2" fill="#FF4B72" />
      <rect x="15" y="75" width="40" height="12" rx="4" fill="#FFF0F5" stroke="#FFB7CE" />
      <circle cx="35" cy="81" r="2" fill="#FF799C" />
      <path d="M 12 15 Q 35 10 58 15" stroke="#FFF" strokeWidth="1.5" fill="none" opacity="0.6" />
    </svg>
  ),
  piano: (
    <svg width="65" height="55" viewBox="0 0 90 80" className="filter drop-shadow-md">
      <rect x="10" y="20" width="70" height="35" rx="8" fill="#D2E4FF" stroke="#A3C2F7" strokeWidth="2" />
      <rect x="10" y="48" width="70" height="15" rx="3" fill="#FFF" stroke="#A3C2F7" strokeWidth="1.5" />
      <line x1="18" y1="48" x2="18" y2="63" stroke="#DDD" strokeWidth="1" />
      <line x1="26" y1="48" x2="26" y2="63" stroke="#DDD" strokeWidth="1" />
      <line x1="34" y1="48" x2="34" y2="63" stroke="#DDD" strokeWidth="1" />
      <line x1="42" y1="48" x2="42" y2="63" stroke="#DDD" strokeWidth="1" />
      <line x1="50" y1="48" x2="50" y2="63" stroke="#DDD" strokeWidth="1" />
      <line x1="58" y1="48" x2="58" y2="63" stroke="#DDD" strokeWidth="1" />
      <line x1="66" y1="48" x2="66" y2="63" stroke="#DDD" strokeWidth="1" />
      <line x1="74" y1="48" x2="74" y2="63" stroke="#DDD" strokeWidth="1" />
      <rect x="21" y="48" width="4" height="9" fill="#2E1834" />
      <rect x="29" y="48" width="4" height="9" fill="#2E1834" />
      <rect x="45" y="48" width="4" height="9" fill="#2E1834" />
      <rect x="53" y="48" width="4" height="9" fill="#2E1834" />
      <rect x="61" y="48" width="4" height="9" fill="#2E1834" />
      <path d="M 12 20 Q 45 5 78 20" fill="none" stroke="#FFF" strokeWidth="2.5" opacity="0.7" />
      <rect x="25" y="63" width="40" height="8" rx="2" fill="#A3C2F7" />
      <line x1="15" y1="55" x2="10" y2="75" stroke="#A3C2F7" strokeWidth="3" />
      <line x1="75" y1="55" x2="80" y2="75" stroke="#A3C2F7" strokeWidth="3" />
    </svg>
  ),
  tv: (
    <svg width="60" height="50" viewBox="0 0 80 70" className="filter drop-shadow-md">
      <rect x="5" y="15" width="70" height="48" rx="10" fill="#FFB7CE" stroke="#FF799C" strokeWidth="2" />
      <rect x="12" y="21" width="45" height="36" rx="6" fill="#FFF0F5" stroke="#FFCCD9" strokeWidth="1" />
      <circle cx="67" cy="27" r="3" fill="#FF4B72" />
      <circle cx="67" cy="37" r="3" fill="#FF4B72" />
      <rect x="63" y="45" width="8" height="10" rx="1" fill="#FF799C" opacity="0.5" />
      <path d="M 20 45 Q 35 25 50 45 Z" fill="#FFAEC9" opacity="0.6" />
      <circle cx="35" cy="30" r="3" fill="#FFEB3B" />
      <line x1="40" y1="15" x2="25" y2="5" stroke="#FF799C" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="40" y1="15" x2="55" y2="5" stroke="#FF799C" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="25" cy="5" r="2.5" fill="#FF4B72" />
      <circle cx="55" cy="5" r="2.5" fill="#FF4B72" />
    </svg>
  ),
  castle: (
    <svg width="85" height="75" viewBox="0 0 110 100" className="filter drop-shadow-md">
      <rect x="25" y="40" width="60" height="50" rx="4" fill="#FFC2D1" stroke="#FF799C" strokeWidth="2" />
      <rect x="15" y="25" width="18" height="65" fill="#FFAEC9" stroke="#FF799C" strokeWidth="1.5" />
      <rect x="77" y="25" width="18" height="65" fill="#FFAEC9" stroke="#FF799C" strokeWidth="1.5" />
      <polygon points="12,25 24,5 36,25" fill="#FF799C" />
      <polygon points="74,25 86,5 98,25" fill="#FF799C" />
      <polygon points="40,40 55,15 70,40" fill="#FF4B72" />
      <path d="M 45 90 A 10 10 0 0 1 65 90 Z" fill="#FFF0F5" stroke="#FF799C" strokeWidth="1.5" />
      <rect x="20" y="40" width="8" height="12" rx="2" fill="#FFF" />
      <rect x="82" y="40" width="8" height="12" rx="2" fill="#FFF" />
      <circle cx="55" cy="55" r="4" fill="#FFEB3B" className="animate-pulse" />
      <path d="M 50 40 L 60 40 M 55 35 L 55 45" stroke="#FFF" strokeWidth="1" />
    </svg>
  )
};

const TALK_BUBBLES = [
  "今天辛苦啦！⭐",
  "キラキラ～應援也是要幸福喔！",
  "You are my shining star! 🌸",
  "你也是夜空中最溫暖的那顆星對不對～💖",
  "Zack 和 Jeremy 今天也有在好好努力喔！🌟",
  "讓我們的願望，跟著星光一起飛吧！✨",
  "聽說對著我許願的話，夢想就會成真喔！🎀",
  "每天都要開開心心的，有我在陪著你呢！🧸"
];

interface FallingItem {
  id: number;
  x: number;
  delay: number;
  duration: number;
  scale: number;
  char: string;
}

export default function PetsModule({ currentUser, onRefreshData }: PetsModuleProps) {
  const localKey = currentUser ? `local_star_pet_${currentUser.id}` : `local_star_pet_guest`;

  // Toggle Modes: "single" (Solo/Local) or "coparent" (Shared Home) or "friend" (Visiting Friend) or "plog" (PLOG Collage)
  const [activeTab, setActiveTab] = useState<"single" | "coparent" | "friend" | "plog">("single");

  // Friend Visitation State
  const [visitingFriend, setVisitingFriend] = useState<any | null>(null);
  const [visitedPet, setVisitedPet] = useState<any | null>(null);
  const [visitedCoparentGroups, setVisitedCoparentGroups] = useState<any[]>([]);
  const [selectedVisitedGroup, setSelectedVisitedGroup] = useState<any | null>(null);
  const [isVisitingGroup, setIsVisitingGroup] = useState(false);
  const [activeGroupMembers, setActiveGroupMembers] = useState<any[]>([]); // To show active coparent members list
  const [visitedGroupMembers, setVisitedGroupMembers] = useState<any[]>([]); // To show visited coparent members list
  const [interactionRewardMsg, setInteractionRewardMsg] = useState("");

  // Local/Solo state
  const [soloPetName, setSoloPetName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`${localKey}_name`) || "棉花糖糖";
    }
    return "棉花糖糖";
  });
  const [isEditingSoloName, setIsEditingSoloName] = useState(false);
  const [tempSoloName, setTempSoloName] = useState(soloPetName);
  const [soloFullness, setSoloFullness] = useState(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem(`${localKey}_fullness`);
      return v ? parseInt(v, 10) : 60;
    }
    return 60;
  });
  const [soloLove, setSoloLove] = useState(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem(`${localKey}_love`);
      return v ? parseInt(v, 10) : 70;
    }
    return 70;
  });
  const [soloCoins, setSoloCoins] = useState(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem(`${localKey}_coins`);
      return v ? parseInt(v, 10) : 120;
    }
    return 120;
  });
  const [soloFurniture, setSoloFurniture] = useState<FurnitureItem[]>(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem(`${localKey}_furniture`);
      if (v) {
        try { return JSON.parse(v); } catch (e) { }
      }
    }
    return DEFAULT_FURNITURE;
  });
  const [soloFridgeFood, setSoloFridgeFood] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem(`${localKey}_fridge`);
      if (v) {
        try { return JSON.parse(v); } catch (e) { }
      }
    }
    return { cotton_candy: 3, peach_juice: 2, star_macaron: 1, cherry_pudding: 1 };
  });

  const [soloCustomSkin, setSoloCustomSkin] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`${localKey}_custom_skin`) || "";
    }
    return "";
  });

  // Level & EXP for solo pet
  const [soloLevel, setSoloLevel] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem(`${localKey}_level`);
      return v ? parseInt(v, 10) : 1;
    }
    return 1;
  });
  const [soloExp, setSoloExp] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem(`${localKey}_exp`);
      return v ? parseInt(v, 10) : 0;
    }
    return 0;
  });

  // NEW MULTI-PET SYSTEM STATE
  const [pets, setPets] = useState<PetInstance[]>(() => 
    getInitialPets(localKey, soloPetName, soloFullness, soloLove, soloLevel, soloExp, soloCustomSkin)
  );
  const [currentHomeId, setCurrentHomeId] = useState<"home_star" | "home_pig" | "home_dog">("home_star");
  const [focusedPetId, setFocusedPetId] = useState<string>("star");
  const [autoConversation, setAutoConversation] = useState<{ speakerId: string; speakerName: string; text: string } | null>(null);

  // HATCHING SYSTEM STATE
  const [isHatching, setIsHatching] = useState(false);
  const [hatchingEggPhase, setHatchingEggPhase] = useState<"egg_idle" | "egg_shake" | "egg_burst" | "egg_reveal">("egg_idle");
  const [hatchedPet, setHatchedPet] = useState<PetInstance | null>(null);

  // Helper to load a selected pet into active focus states
  const selectFocusedPet = (petId: string) => {
    setFocusedPetId(petId);
    setPets(prev => {
      const targetPet = prev.find(p => p.id === petId);
      if (targetPet) {
        setSoloPetName(targetPet.name);
        setSoloFullness(targetPet.fullness);
        setSoloLove(targetPet.love);
        setSoloLevel(targetPet.level || 1);
        setSoloExp(targetPet.exp || 0);
        setSoloCustomSkin(targetPet.customSkin || "");
        setBubbleText(`你選擇了「${targetPet.name}」！來和牠互動，或者餵牠吃點心吧！✨`);
      }
      return prev;
    });
  };

  // Helper to get beautiful names
  const getHomeName = (homeId: string) => {
    if (homeId === "home_star") return "🌌 夢幻星空房";
    if (homeId === "home_pig") return "🍓 草莓甜心房";
    if (homeId === "home_dog") return "🐾 活力萌犬房";
    return "🏠 溫馨家園";
  };

  const getSpeciesName = (species: string) => {
    if (species === "star") return "經典小星星 🌟";
    if (species === "pig") return "粉萌小蜜豬 🐷";
    if (species === "dog") return "軟綿小奶犬 🐶";
    return "神祕萌星寵 👾";
  };

  // Helper to move pet to home
  const movePetToHome = async (petId: string, targetHomeId: "home_star" | "home_pig" | "home_dog") => {
    if (activeTab === "single") {
      setPets(prev => {
        const next = prev.map(p => {
          if (p.id === petId) {
            return { ...p, currentHome: targetHomeId };
          }
          return p;
        });
        if (typeof window !== "undefined") {
          localStorage.setItem(`${localKey}_pets_v2`, JSON.stringify(next));
        }
        return next;
      });
      
      // Auto sync state if it's the active focused pet
      if (petId === focusedPetId) {
        setCurrentHomeId(targetHomeId);
      }

      const movedPet = pets.find(p => p.id === petId);
      if (movedPet) {
        setBubbleText(`🚚 成功將「${movedPet.name}」移居到「${getHomeName(targetHomeId)}」！✨`);
      }
    } else if (activeTab === "coparent") {
      try {
        await executeCoparentAction("move-pet-home", { petId, targetHomeId });
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Egg Hatching function
  const handleHatchEgg = async () => {
    if (activeTab === "single") {
      if (soloCoins < 200) {
        triggerInsufficientCoinsModal(200, "孵化幸運萌寵蛋");
        return;
      }

      // Deduct 200 Star Coins
      const newCoins = soloCoins - 200;
      setSoloCoins(newCoins);
      if (typeof window !== "undefined") {
        localStorage.setItem(`${localKey}_coins`, String(newCoins));
      }

      // Pick random species: "pig" or "dog"
      const isPig = Math.random() < 0.5;
      const species = isPig ? "pig" : "dog";
      
      // Choose a cute random name
      const pigNames = ["草莓嘟嘟", "蜜桃波波", "櫻桃糯米", "年糕胖胖", "粉嫩布丁", "甜心脆脆"];
      const dogNames = ["幸運啵啵", "小椰果凍", "啵啵可可", "旺仔椰椰", "奶糖曲奇", "皮皮球球"];
      const randomName = isPig 
        ? pigNames[Math.floor(Math.random() * pigNames.length)]
        : dogNames[Math.floor(Math.random() * dogNames.length)];

      const newPetId = `${species}_${Date.now()}`;
      const defaultHome = isPig ? "home_pig" : "home_dog";

      const newPet: PetInstance = {
        id: newPetId,
        species,
        name: randomName,
        level: 1,
        exp: 0,
        fullness: 50,
        love: 60,
        customSkin: "",
        currentHome: defaultHome
      };

      // Play hatching sequence
      setHatchedPet(newPet);
      setIsHatching(true);
      setHatchingEggPhase("egg_idle");

      // Phase 1: idle, then shake after 700ms
      setTimeout(() => {
        setHatchingEggPhase("egg_shake");
      }, 700);

      // Phase 2: burst after 2200ms
      setTimeout(() => {
        setHatchingEggPhase("egg_burst");
      }, 2200);

      // Phase 3: reveal after 3400ms
      setTimeout(() => {
        setHatchingEggPhase("egg_reveal");
        
        // Permanently save the new pet to pets list
        setPets(prev => {
          const next = [...prev, newPet];
          if (typeof window !== "undefined") {
            localStorage.setItem(`${localKey}_pets_v2`, JSON.stringify(next));
          }
          return next;
        });

        // Switch active home to the hatched pet's home so they can see it instantly!
        setCurrentHomeId(defaultHome);
        setFocusedPetId(newPetId);
        setSoloPetName(newPet.name);
        setSoloFullness(newPet.fullness);
        setSoloLove(newPet.love);
        setSoloLevel(newPet.level);
        setSoloExp(newPet.exp);
        setSoloCustomSkin(newPet.customSkin);

        // Add 100 EXP as a special gift to the user's active levels
        addSoloExp(100);
      }, 3500);
    } else if (activeTab === "coparent") {
      if (!activeGroup) return;
      if ((activeGroup.star_coins || 0) < 200) {
        triggerInsufficientCoinsModal(200, "共同繁衍孵化幸運萌寵蛋");
        return;
      }

      try {
        const res = await executeCoparentAction("hatch-egg", {});
        if (res && res.newPet) {
          const newPet = res.newPet;
          
          // Play hatching sequence for coparent pet
          setHatchedPet(newPet);
          setIsHatching(true);
          setHatchingEggPhase("egg_idle");

          // Phase 1: idle, then shake after 700ms
          setTimeout(() => {
            setHatchingEggPhase("egg_shake");
          }, 700);

          // Phase 2: burst after 2200ms
          setTimeout(() => {
            setHatchingEggPhase("egg_burst");
          }, 2200);

          // Phase 3: reveal after 3400ms
          setTimeout(() => {
            setHatchingEggPhase("egg_reveal");
          }, 3500);
        }
      } catch (err: any) {
        alert(err.message || "孵化失敗");
      }
    }
  };

  // Helper to update a single pet
  const updatePet = async (petId: string, updates: Partial<PetInstance>) => {
    if (activeTab === "single") {
      setPets(prev => {
        const next = prev.map(p => p.id === petId ? { ...p, ...updates } : p);
        if (typeof window !== "undefined") {
          localStorage.setItem(`${localKey}_pets_v2`, JSON.stringify(next));
        }
        return next;
      });
    } else if (activeTab === "coparent") {
      if (updates.name) {
        try {
          await executeCoparentAction("rename", { newName: updates.name, petId });
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  // Shop & Achievements Overlays
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);

  // Achievements State
  const [achievementsState, setAchievementsState] = useState<Record<string, { progress: number, claimed: boolean }>>(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem(`starry_ach_progress_${currentUser?.id || "guest"}`);
      if (v) {
        try { return JSON.parse(v); } catch (e) {}
      }
    }
    const initial: Record<string, { progress: number, claimed: boolean }> = {};
    ACHIEVEMENTS_LIST.forEach(ach => {
      initial[ach.id] = { progress: 0, claimed: false };
    });
    return initial;
  });

  // Co-parenting full-stack state
  const [coparentGroups, setCoparentGroups] = useState<any[]>([]);
  const [activeGroup, setActiveGroup] = useState<any | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [coparentInvitations, setCoparentInvitations] = useState<any[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedFriendsForGroup, setSelectedFriendsForGroup] = useState<string[]>([]);
  
  // Friend Addition Search
  const [friendSearch, setFriendSearch] = useState("");
  const [friendAddStatus, setFriendAddStatus] = useState({ success: false, error: "", message: "" });

  // Friend Snaps / Polaroid states
  const [friendSnaps, setFriendSnaps] = useState<any[]>([]);
  const [selectedFriendForSnap, setSelectedFriendForSnap] = useState<any | null>(null);
  const [snapCaption, setSnapCaption] = useState("");
  const [snapSourceType, setSnapSourceType] = useState<"camera" | "upload">("camera");
  const [uploadedSnapBase64, setUploadedSnapBase64] = useState("");
  const [isSendingSnap, setIsSendingSnap] = useState(false);
  const [snapMessage, setSnapMessage] = useState("");
  const [snapError, setSnapError] = useState("");

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedCameraBase64, setCapturedCameraBase64] = useState<string>("");
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (!selectedFriendForSnap || snapSourceType !== "camera") {
      stopCameraStream();
    }
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedFriendForSnap, snapSourceType]);

  // Share Photo in Group state
  const [isSharingPhoto, setIsSharingPhoto] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [photoCaptionInput, setPhotoCaptionInput] = useState("");
  const [photoShareCooldown, setPhotoShareCooldown] = useState<number>(0); // remaining seconds

  // Refrigerator Overlay / Drawer State
  const [isFridgeOpen, setIsFridgeOpen] = useState(false);
  const [fridgeMessage, setFridgeMessage] = useState("");

  // Custom Skin Canvas state
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);

  // Interaction State
  const [bubbleText, setBubbleText] = useState(`點擊我可以和我說話，或者開啟草莓冰箱餵我吃點心哦！✨`);
  const [showBubble, setShowBubble] = useState(true);
  const [isDancing, setIsDancing] = useState(false);
  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);
  const [expression, setExpression] = useState<"blink" | "happy" | "shy" | "glow">("happy");
  const [petState, setPetState] = useState<"idle" | "sitting" | "sleeping">("idle");
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  const [feedEffect, setFeedEffect] = useState<string | null>(null);
  const roomRef = useRef<HTMLDivElement | null>(null);

  // Danmaku Barrage State
  const [danmakus, setDanmakus] = useState<{ id: string; text: string; color: string }[]>([]);

  // Insufficient Star Coins modal states & trigger
  const [showCoinGuideModal, setShowCoinGuideModal] = useState(false);
  const [neededCoinsAmount, setNeededCoinsAmount] = useState(0);
  const [coinActionContext, setCoinActionContext] = useState("");

  const triggerInsufficientCoinsModal = (needed: number, actionName: string) => {
    setNeededCoinsAmount(needed);
    setCoinActionContext(actionName);
    setShowCoinGuideModal(true);
  };

  // Convert bubbleText to Danmaku items dynamically
  useEffect(() => {
    if (bubbleText) {
      const newDanmaku = {
        id: Math.random().toString(),
        text: bubbleText,
        color: [
          "bg-[#FF799C]/10 text-[#FF4B72] border-[#FF799C]/20",
          "bg-pink-50 text-pink-600 border-pink-100/80",
          "bg-[#FFF0F4]/90 text-[#FF5B7E] border-[#FF5B7E]/20"
        ][Math.floor(Math.random() * 3)]
      };
      setDanmakus([newDanmaku]);

      // Automatically remove danmaku item after 5 seconds
      const timer = setTimeout(() => {
        setDanmakus((prev) => prev.filter((d) => d.id !== newDanmaku.id));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [bubbleText]);

  // Convert autoConversation to Danmaku items dynamically
  useEffect(() => {
    if (autoConversation?.text) {
      const newDanmaku = {
        id: Math.random().toString(),
        text: `【${autoConversation.speakerName}】${autoConversation.text}`,
        color: "bg-purple-50 text-[#8E44AD] border-purple-100 font-bold"
      };
      setDanmakus([newDanmaku]);

      // Automatically remove danmaku item after 5 seconds
      const timer = setTimeout(() => {
        setDanmakus((prev) => prev.filter((d) => d.id !== newDanmaku.id));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [autoConversation]);

  // Sync Solo to localStorage
  useEffect(() => {
    localStorage.setItem(`${localKey}_name`, soloPetName);
    localStorage.setItem(`${localKey}_fullness`, soloFullness.toString());
    localStorage.setItem(`${localKey}_love`, soloLove.toString());
    localStorage.setItem(`${localKey}_coins`, soloCoins.toString());
    localStorage.setItem(`${localKey}_furniture`, JSON.stringify(soloFurniture));
    localStorage.setItem(`${localKey}_fridge`, JSON.stringify(soloFridgeFood));
    localStorage.setItem(`${localKey}_custom_skin`, soloCustomSkin);
  }, [localKey, soloPetName, soloFullness, soloLove, soloCoins, soloFurniture, soloFridgeFood, soloCustomSkin]);

  // Load solo_pet from currentUser (cloud database) if available
  useEffect(() => {
    if (currentUser?.solo_pet) {
      const pet = currentUser.solo_pet;
      if (pet.name) setSoloPetName(pet.name);
      if (pet.fullness !== undefined) setSoloFullness(pet.fullness);
      if (pet.love !== undefined) setSoloLove(pet.love);
      if (pet.coins !== undefined) setSoloCoins(pet.coins);
      if (pet.furniture) setSoloFurniture(pet.furniture);
      if (pet.fridge) setSoloFridgeFood(pet.fridge);
      if (pet.custom_skin !== undefined) setSoloCustomSkin(pet.custom_skin);
      if (pet.level !== undefined) setSoloLevel(pet.level);
      if (pet.exp !== undefined) setSoloExp(pet.exp);

      if (pet.pets) {
        setPets(pet.pets);
      } else {
        const upgraded = getInitialPets(localKey, pet.name, pet.fullness, pet.love, pet.level, pet.exp, pet.custom_skin);
        setPets(upgraded);
      }
      if (pet.currentHomeId) setCurrentHomeId(pet.currentHomeId);
      if (pet.focusedPetId) setFocusedPetId(pet.focusedPetId);
    } else {
      // Fetch local storage fallback if they were a guest, or set defaults
      const savedName = localStorage.getItem(`${localKey}_name`);
      const savedFullnessVal = localStorage.getItem(`${localKey}_fullness`);
      const savedLoveVal = localStorage.getItem(`${localKey}_love`);
      const savedLevelVal = localStorage.getItem(`${localKey}_level`);
      const savedExpVal = localStorage.getItem(`${localKey}_exp`);
      const savedSkinVal = localStorage.getItem(`${localKey}_custom_skin`);
      
      const legacyName = savedName || "棉花糖糖";
      const legacyFullness = savedFullnessVal ? parseInt(savedFullnessVal, 10) : 60;
      const legacyLove = savedLoveVal ? parseInt(savedLoveVal, 10) : 70;
      const legacyLevel = savedLevelVal ? parseInt(savedLevelVal, 10) : 1;
      const legacyExp = savedExpVal ? parseInt(savedExpVal, 10) : 0;
      const legacySkin = savedSkinVal || "";

      const upgraded = getInitialPets(localKey, legacyName, legacyFullness, legacyLove, legacyLevel, legacyExp, legacySkin);
      setPets(upgraded);

      if (savedName) {
        setSoloPetName(savedName);
        if (savedFullnessVal) setSoloFullness(parseInt(savedFullnessVal, 10));
        if (savedLoveVal) setSoloLove(parseInt(savedLoveVal, 10));
        const savedCoins = localStorage.getItem(`${localKey}_coins`);
        if (savedCoins) setSoloCoins(parseInt(savedCoins, 10));
        if (savedLevelVal) setSoloLevel(parseInt(savedLevelVal, 10));
        if (savedExpVal) setSoloExp(parseInt(savedExpVal, 10));
        const savedFurniture = localStorage.getItem(`${localKey}_furniture`);
        if (savedFurniture) {
          try { setSoloFurniture(JSON.parse(savedFurniture)); } catch (e) {}
        }
        const savedFridge = localStorage.getItem(`${localKey}_fridge`);
        if (savedFridge) {
          try { setSoloFridgeFood(JSON.parse(savedFridge)); } catch (e) {}
        }
        if (savedSkinVal) setSoloCustomSkin(savedSkinVal);
      }
      
      const savedHomeId = localStorage.getItem(`${localKey}_currentHomeId`);
      if (savedHomeId) setCurrentHomeId(savedHomeId as any);
      const savedFocusId = localStorage.getItem(`${localKey}_focusedPetId`);
      if (savedFocusId) setFocusedPetId(savedFocusId);
    }
  }, [currentUser?.id, localKey]);

  // Sync solo_pet extra stats, currentHomeId, and focusedPetId to localstorage
  useEffect(() => {
    localStorage.setItem(`${localKey}_level`, soloLevel.toString());
    localStorage.setItem(`${localKey}_exp`, soloExp.toString());
    localStorage.setItem(`${localKey}_currentHomeId`, currentHomeId);
    localStorage.setItem(`${localKey}_focusedPetId`, focusedPetId);
  }, [localKey, soloLevel, soloExp, currentHomeId, focusedPetId]);

  // Synchronize active stats to the currently focused pet in the individual pets list
  useEffect(() => {
    if (activeTab !== "single") return;
    setPets(prev => {
      const isExist = prev.some(p => p.id === focusedPetId);
      if (!isExist) return prev;
      const next = prev.map(p => {
        if (p.id === focusedPetId) {
          return {
            ...p,
            name: soloPetName,
            fullness: soloFullness,
            love: soloLove,
            level: soloLevel,
            exp: soloExp,
            customSkin: soloCustomSkin
          };
        }
        return p;
      });
      // Compare stringified versions to avoid infinite loop of updates
      const oldVal = localStorage.getItem(`${localKey}_pets_v2`);
      const newVal = JSON.stringify(next);
      if (oldVal !== newVal) {
        if (typeof window !== "undefined") {
          localStorage.setItem(`${localKey}_pets_v2`, newVal);
        }
        return next;
      }
      return prev;
    });
  }, [soloPetName, soloFullness, soloLove, soloLevel, soloExp, soloCustomSkin, focusedPetId, activeTab, localKey]);

  // Auto dialogues between co-habiting pets
  useEffect(() => {
    if (activeTab !== "single") return;
    const activePets = pets.filter(p => p.currentHome === currentHomeId);
    if (activePets.length < 2) {
      setAutoConversation(null);
      return;
    }

    const dialogues = [
      [
        { id: 0, text: "好開心能跟你一起住在這裡！💖" },
        { id: 1, text: "我也是！有你作伴，這裡就是最溫馨的星光城堡！🏯" }
      ],
      [
        { id: 0, text: "主人擺放的家具真的好漂亮喔，我們真是太幸福了～🛋️" },
        { id: 1, text: "對啊！等一下我們要不要躺在草莓大床上睡午覺？💤" }
      ],
      [
        { id: 0, text: "你今天肚子餓了嗎？要不要一起去敲敲冰箱？🧊" },
        { id: 1, text: "好耶！冰箱裡聽說有草莓波點冰箱新進的蜜桃流星果汁！🍑" }
      ],
      [
        { id: 0, text: "看我！我會發光喔，閃亮閃亮的！✨" },
        { id: 1, text: "哇！你好耀眼喔！不愧是全宇宙最萌的小星寵！🌟" }
      ],
      [
        { id: 0, text: "哼！你是不是偷偷吃掉了最後一個櫻桃布丁？🍮" },
        { id: 1, text: "才...才沒有呢！肯定是冰箱精靈悄悄拿走享用啦！👻" }
      ],
      [
        { id: 0, text: "我們今天一起在房間裡跳個舞，給主人一個驚喜吧！🎉" },
        { id: 1, text: "好呀！看我的軟綿綿翻滾舞步，衝呀！💃" }
      ]
    ];

    const triggerDialogue = () => {
      setPets(currentPets => {
        const activePets = currentPets.filter(p => p.currentHome === currentHomeId);
        if (activePets.length < 2) return currentPets;

        const randomDiag = dialogues[Math.floor(Math.random() * dialogues.length)];
        // Pick two distinct pets
        const petA = activePets[0];
        const petB = activePets[1];

        // Speaker A speaks
        setAutoConversation({
          speakerId: petA.id,
          speakerName: petA.name,
          text: randomDiag[0].text
        });

        // Speaker B replies after 3.5 seconds
        setTimeout(() => {
          setAutoConversation({
            speakerId: petB.id,
            speakerName: petB.name,
            text: randomDiag[1].text
          });
        }, 3500);

        // Hide after 7 seconds
        setTimeout(() => {
          setAutoConversation(null);
        }, 7000);

        return currentPets;
      });
    };

    // Trigger first dialog after 8 seconds, and then every 24 seconds
    const initialDelay = setTimeout(triggerDialogue, 8000);
    const interval = setInterval(triggerDialogue, 24000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [pets, currentHomeId, activeTab]);

  // Fetch total user posts to sync achievements
  useEffect(() => {
    if (!currentUser) return;
    const checkPostsAndSync = async () => {
      try {
        let total = 0;
        const endpoints = ["photos", "videos", "letters", "artworks", "music"];
        for (const ep of endpoints) {
          const res = await fetch(`/api/posts/${ep}`);
          if (res.ok) {
            const list = await res.json();
            const userPosts = list.filter((p: any) => p.user_id === currentUser.id);
            total += userPosts.length;
          }
        }
        updateAchievementProgress("posts", total);
      } catch (err) {
        console.error("Failed to fetch user posts for achievements", err);
      }
    };
    checkPostsAndSync();
  }, [currentUser?.id]);

  // Pet Raising raising functions
  const addSoloExp = (amount: number) => {
    let newExp = soloExp + amount;
    let newLevel = soloLevel;
    const expNeeded = soloLevel * 100; // 每一級需要 level * 100 經驗值，越來越有挑戰性！
    if (newExp >= expNeeded) {
      newExp -= expNeeded;
      newLevel += 1;
      alert(`🎉 恭喜！你的星寵「${soloPetName}」升級到 Lv.${newLevel} 了！🌟 新形象新光芒！`);
      updateAchievementProgress("pet_level", newLevel);
    }
    setSoloExp(newExp);
    setSoloLevel(newLevel);
    
    // Immediate save sync to cloud
    if (currentUser) {
      const updatedPet = {
        name: soloPetName,
        fullness: soloFullness,
        love: soloLove,
        coins: soloCoins,
        furniture: soloFurniture,
        fridge: soloFridgeFood,
        custom_skin: soloCustomSkin,
        level: newLevel,
        exp: newExp
      };
      fetch("/api/users/save-solo-pet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, solo_pet: updatedPet })
      });
    }
  };

  const updateAchievementProgress = (
    targetType: "posts" | "feed_pet" | "buy_furniture" | "pet_level" | "friend_visit",
    value: number,
    isIncrement = false
  ) => {
    setAchievementsState(prev => {
      const next = { ...prev };
      let changed = false;
      ACHIEVEMENTS_LIST.forEach(ach => {
        if (ach.targetType === targetType) {
          const state = next[ach.id] || { progress: 0, claimed: false };
          let newProgress = isIncrement ? state.progress + value : value;
          if (newProgress > ach.targetValue) newProgress = ach.targetValue;
          if (newProgress !== state.progress) {
            next[ach.id] = { ...state, progress: newProgress };
            changed = true;
          }
        }
      });
      if (changed) {
        localStorage.setItem(`starry_ach_progress_${currentUser?.id || "guest"}`, JSON.stringify(next));
      }
      return next;
    });
  };

  const claimAchievementReward = (achId: string) => {
    const ach = ACHIEVEMENTS_LIST.find(a => a.id === achId);
    if (!ach) return;
    const state = achievementsState[achId];
    if (!state || state.progress < ach.targetValue || state.claimed) return;

    const reward = ach.rewardCoins;
    const newCoins = soloCoins + reward;
    setSoloCoins(newCoins);
    localStorage.setItem(`${localKey}_coins`, String(newCoins));

    setAchievementsState(prev => {
      const next = {
        ...prev,
        [achId]: { ...prev[achId], claimed: true }
      };
      localStorage.setItem(`starry_ach_progress_${currentUser?.id || "guest"}`, JSON.stringify(next));
      return next;
    });

    alert(`🎉 成功領取成就「${ach.title}」獎勵！獲得星星幣 +${reward} 🪙！`);

    // Sync to server
    if (currentUser) {
      const updatedPet = {
        name: soloPetName,
        fullness: soloFullness,
        love: soloLove,
        coins: newCoins,
        furniture: soloFurniture,
        fridge: soloFridgeFood,
        custom_skin: soloCustomSkin,
        level: soloLevel,
        exp: soloExp
      };
      fetch("/api/users/save-solo-pet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, solo_pet: updatedPet })
      });
    }
  };

  const handleBuyShopFurniture = async (item: ShopFurnitureItem) => {
    if (activeTab === "single") {
      if (soloCoins < item.cost) {
        triggerInsufficientCoinsModal(item.cost, `購入高檔家具「${item.name}」`);
        return;
      }

      if (soloFurniture.some(f => f.id === item.id)) {
        alert(`❌ 你已經擁有「${item.name}」這件家具了，快去房間裡拖曳擺放它吧！🌸`);
        return;
      }

      const newCoins = soloCoins - item.cost;
      const newFurnitureItem: FurnitureItem = {
        id: item.id,
        name: item.name,
        x: 50 + Math.random() * 150,
        y: 100 + Math.random() * 80,
        description: item.description
      };
      const updatedFurniture = [...soloFurniture, newFurnitureItem];

      setSoloCoins(newCoins);
      setSoloFurniture(updatedFurniture);
      localStorage.setItem(`${localKey}_coins`, String(newCoins));
      localStorage.setItem(`${localKey}_furniture`, JSON.stringify(updatedFurniture));

      // Update Achievements & EXP
      updateAchievementProgress("buy_furniture", updatedFurniture.length);
      addSoloExp(50); // 購入家具獲得 50 經驗！

      alert(`🎉 成功購入高檔家具「${item.name}」！已扣除 ${item.cost} 星星幣。新家具已放進房間，可以隨時拖曳移動！✨`);

      // Sync to server
      if (currentUser) {
        const updatedPet = {
          name: soloPetName,
          fullness: soloFullness,
          love: soloLove,
          coins: newCoins,
          furniture: updatedFurniture,
          fridge: soloFridgeFood,
          custom_skin: soloCustomSkin,
          level: soloLevel,
          exp: soloExp
        };
        fetch("/api/users/save-solo-pet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.id, solo_pet: updatedPet })
        });
      }
    } else if (activeTab === "coparent") {
      if (!activeGroup) {
        alert("⚠️ 請先選擇或建立一個共同飼養家庭小組喔！");
        return;
      }
      const groupCoins = activeGroup.star_coins || 0;
      if (groupCoins < item.cost) {
        triggerInsufficientCoinsModal(item.cost, `共同家庭置辦高檔家具「${item.name}」`);
        return;
      }

      const coparentFurniture = activeGroup.pet?.furniture || [];
      if (coparentFurniture.some((f: any) => f.id === item.id)) {
        alert(`❌ 共同家庭已經擁有「${item.name}」這件家具了，快去房間裡拖曳擺放它吧！🌸`);
        return;
      }

      const res = await executeCoparentAction("buy-furniture", { item });
      if (res && res.success) {
        alert(`🎉 共同家庭成功置辦高級家具「${item.name}」！扣除共享家庭幣 ${item.cost}。新家具已放進房間，可以隨時拖曳移動！✨`);
      }
    }
  };

  // Debounced cloud synchronization of solo pet
  useEffect(() => {
    if (!currentUser) return;
    const saveTimeout = setTimeout(() => {
      fetch("/api/users/save-solo-pet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          solo_pet: {
            name: soloPetName,
            fullness: soloFullness,
            love: soloLove,
            coins: soloCoins,
            furniture: soloFurniture,
            fridge: soloFridgeFood,
            custom_skin: soloCustomSkin,
            level: soloLevel,
            exp: soloExp,
            pets: pets,
            currentHomeId: currentHomeId,
            focusedPetId: focusedPetId
          }
        })
      }).catch(err => console.error("Failed to sync solo pet to cloud", err));
    }, 1200);
    return () => clearTimeout(saveTimeout);
  }, [currentUser?.id, soloPetName, soloFullness, soloLove, soloCoins, soloFurniture, soloFridgeFood, soloCustomSkin, soloLevel, soloExp, pets, currentHomeId, focusedPetId]);

  // Fetch active coparent group member details dynamically
  useEffect(() => {
    if (activeGroup?.id) {
      fetch(`/api/coparent/members/${activeGroup.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setActiveGroupMembers(data);
          }
        })
        .catch(err => console.error("Error loading active group members:", err));
    } else {
      setActiveGroupMembers([]);
    }
  }, [activeGroup?.id]);

  const handleVisitFriendRoom = async (friendId: string) => {
    try {
      const res = await fetch(`/api/friends/room/${friendId}`);
      if (!res.ok) {
        throw new Error("無法載入好友的家園資訊");
      }
      const data = await res.json();
      if (data && data.friend) {
        setVisitingFriend(data.friend);
        setVisitedPet(data.pet);
        setVisitedCoparentGroups(data.coparentGroups || []);
        
        // Reset visited room sub-states
        setIsVisitingGroup(false);
        setSelectedVisitedGroup(null);
        setVisitedGroupMembers([{ id: data.friend.id, username: data.friend.username, avatar: data.friend.avatar }]);
        
        setActiveTab("friend");
        setBubbleText(`✨ 歡迎參觀 ${data.friend.username} 的星空萌寵屋！快戳一戳星寵與牠互動、並贈予溫暖與陪伴吧！🌸`);
        setInteractionRewardMsg("");
      } else {
        throw new Error("無法解析好友的家園資訊");
      }
    } catch (err: any) {
      alert(err.message || "載入好友家園失敗");
    }
  };

  const handleSelectVisitedGroup = async (group: any) => {
    setSelectedVisitedGroup(group);
    setIsVisitingGroup(true);
    setInteractionRewardMsg("");
    
    // Fetch co-parent members list
    try {
      const res = await fetch(`/api/coparent/members/${group.id}`);
      if (res.ok) {
        const data = await res.json();
        setVisitedGroupMembers(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Load co-parenting data from API when logged in
  useEffect(() => {
    if (currentUser) {
      fetchCoparentData();
    }
  }, [currentUser, activeTab]);

  const fetchCoparentData = async () => {
    if (!currentUser) return;
    try {
      // Fetch user's friends
      const resFriends = await fetch(`/api/friends/${currentUser.id}`);
      if (resFriends.ok) {
        const data = await resFriends.json();
        setFriends(data);
        // Sync friends backup
        updateFriendsBackup(currentUser.email, data);
      }

      // Fetch user's coparenting groups
      const resGroups = await fetch(`/api/coparent/groups/${currentUser.id}`);
      if (resGroups.ok) {
        const data = await resGroups.json();
        setCoparentGroups(data);
        if (data.length > 0) {
          // Keep active group index if possible
          if (activeGroup) {
            const updatedGroup = data.find((g: any) => g.id === activeGroup.id);
            setActiveGroup(updatedGroup || data[0]);
          } else {
            setActiveGroup(data[0]);
          }
        } else {
          setActiveGroup(null);
        }
      }

      // Fetch user's friend snaps
      const resSnaps = await fetch(`/api/friends/snaps?userId=${currentUser.id}`);
      if (resSnaps.ok) {
        const snapsData = await resSnaps.json();
        setFriendSnaps(snapsData);
      }

      // Fetch friend requests
      const resRequests = await fetch(`/api/friends/requests/${currentUser.id}`);
      if (resRequests.ok) {
        const reqData = await resRequests.json();
        setFriendRequests(reqData);
      }

      // Fetch coparent invitations
      const resInvites = await fetch(`/api/coparent/invites/${currentUser.id}`);
      if (resInvites.ok) {
        const invData = await resInvites.json();
        setCoparentInvitations(invData);
      }
    } catch (e) {
      console.error("Error loading coparent data:", e);
    }
  };

  // Cooldown calculation for hourly photo share
  useEffect(() => {
    if (!activeGroup || !currentUser) return;
    const interval = setInterval(() => {
      const lastTimeStr = activeGroup.last_photo_times?.[currentUser.id];
      if (lastTimeStr) {
        const lastTime = new Date(lastTimeStr).getTime();
        const diffMs = Date.now() - lastTime;
        const oneHourMs = 60 * 60 * 1000;
        if (diffMs < oneHourMs) {
          setPhotoShareCooldown(Math.ceil((oneHourMs - diffMs) / 1000));
        } else {
          setPhotoShareCooldown(0);
        }
      } else {
        setPhotoShareCooldown(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeGroup, currentUser]);

  // Falling particles animation setup
  useEffect(() => {
    const items: FallingItem[] = Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 6,
      duration: 8 + Math.random() * 7,
      scale: 0.5 + Math.random() * 0.7,
      char: ["🌸", "✨", "⭐", "☁️", "💗"][Math.floor(Math.random() * 5)]
    }));
    setFallingItems(items);
  }, []);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!friendSearch.trim()) return;

    setFriendAddStatus({ success: false, error: "", message: "發送請求中..." });
    try {
      const res = await fetch("/api/friends/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          targetUsernameOrEmail: friendSearch.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFriendAddStatus({ success: true, error: "", message: `成功發送好友邀請！請靜待對方同意 🌸` });
        setFriendSearch("");
        fetchCoparentData();
      } else {
        setFriendAddStatus({ success: false, error: data.error || "添加失敗", message: "" });
      }
    } catch (e) {
      setFriendAddStatus({ success: false, error: "連線異常", message: "" });
    }
  };

  const handleRespondFriendRequest = async (requestId: string, action: "accept" | "decline") => {
    try {
      const res = await fetch("/api/friends/requests/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "處理成功！");
        fetchCoparentData();
      } else {
        alert(data.error || "處理失敗");
      }
    } catch (e) {
      alert("網路連線異常");
    }
  };

  const handleRespondCoparentInvitation = async (inviteId: string, action: "accept" | "decline") => {
    try {
      const res = await fetch("/api/coparent/invites/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, action })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "處理成功！");
        fetchCoparentData();
      } else {
        alert(data.error || "處理失敗");
      }
    } catch (e) {
      alert("網路連線異常");
    }
  };

  const handleCreateGroup = async () => {
    if (!currentUser || !newGroupName.trim()) return;
    if (selectedFriendsForGroup.length === 0) {
      alert("請至少選擇 1 位好友發送共同飼養邀請喔！");
      return;
    }

    try {
      // Send invite for each selected friend
      for (const friendId of selectedFriendsForGroup) {
        const res = await fetch("/api/coparent/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: currentUser.id,
            receiverId: friendId,
            roomName: newGroupName.trim()
          })
        });
        if (!res.ok) {
          const data = await res.json();
          alert(`邀請好友失敗: ${data.error || "未知錯誤"}`);
          return;
        }
      }

      alert("🎉 共同飼養邀請已成功發送！當好友在通知中心接受您的邀請後，共同小屋就會立即建立囉 🏡！");
      setNewGroupName("");
      setSelectedFriendsForGroup([]);
      setIsCreatingGroup(false);
      fetchCoparentData();
    } catch (e) {
      alert("連線發送邀請異常，請重試");
    }
  };

  const executeCoparentAction = async (actionType: string, payload: any) => {
    if (!activeGroup || !currentUser) return;
    try {
      const res = await fetch("/api/coparent/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: activeGroup.id,
          userId: currentUser.id,
          actionType,
          payload
        })
      });
      const data = await res.json();
      if (res.ok) {
        // Update local active group
        setActiveGroup(data.group);
        // Sync full lists in background
        fetchCoparentData();
        return data;
      } else {
        throw new Error(data.error || "操作失敗");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Refrigerator: Buy food
  const handleBuyFood = async (food: FoodItem) => {
    if (activeTab === "single") {
      if (soloCoins < food.cost) {
        setFridgeMessage(`❌ 星星幣不足以購買 ${food.name}！`);
        triggerInsufficientCoinsModal(food.cost, `採購美味零食「${food.name}」`);
        return;
      }
      setSoloCoins(prev => prev - food.cost);
      setSoloFridgeFood(prev => ({
        ...prev,
        [food.id]: (prev[food.id] || 0) + 1
      }));
      setFridgeMessage(`🪙 成功購入 ${food.name}，放入冰箱儲藏室！`);
    } else {
      if (!activeGroup) return;
      if ((activeGroup.star_coins || 0) < food.cost) {
        setFridgeMessage(`❌ 共享星星幣不足以購買 ${food.name}！`);
        triggerInsufficientCoinsModal(food.cost, `採購共享美味零食「${food.name}」`);
        return;
      }
      try {
        const res = await executeCoparentAction("buy-food", {
          foodId: food.id,
          cost: food.cost,
          count: 1
        });
        if (res) {
          setFridgeMessage(`🪙 購入成功！已扣除家庭共享星星幣。`);
        }
      } catch (e: any) {
        setFridgeMessage(`❌ ${e.message}`);
      }
    }
  };

  // Refrigerator: Feed pet
  const handleFeedFromFridge = async (food: FoodItem) => {
    if (activeTab === "single") {
      if (!soloFridgeFood[food.id] || soloFridgeFood[food.id] <= 0) {
        setFridgeMessage("❌ 冰箱儲藏室裡已經沒有這個食物了，快去購買吧！");
        return;
      }
      if (soloFullness >= 100) {
        setFridgeMessage(`❌ 肚子已經裝不下囉！`);
        setBubbleText(`嗝～小肚子已經圓滾滾、裝不下囉！🌸`);
        return;
      }

      setSoloFridgeFood(prev => ({
        ...prev,
        [food.id]: prev[food.id] - 1
      }));
      setSoloFullness(prev => Math.min(100, prev + food.fullnessVal));
      setSoloLove(prev => Math.min(100, prev + food.loveVal));
      setFeedEffect(food.icon);
      setBubbleText(food.dialog);
      setExpression("glow");
      setIsDancing(true);

      // Add EXP & Achievements
      addSoloExp(15);
      updateAchievementProgress("feed_pet", 1, true);

      setTimeout(() => {
        setFeedEffect(null);
        setIsDancing(false);
        setExpression("happy");
      }, 1500);

      setFridgeMessage(`🍰 成功餵食！${soloPetName} 露出了幸福的表情。`);
    } else {
      if (!activeGroup) return;
      try {
        const currentQty = activeGroup.refrigerator_food?.[food.id] || 0;
        if (currentQty <= 0) {
          setFridgeMessage("❌ 冰箱儲藏室裡已經沒有這個食物了，快去購買吧！");
          return;
        }

        const res = await executeCoparentAction("feed-pet", {
          foodId: food.id,
          fullnessVal: food.fullnessVal,
          loveVal: food.loveVal
        });

        if (res) {
          setFeedEffect(food.icon);
          setBubbleText(food.dialog);
          setExpression("glow");
          setIsDancing(true);

          setTimeout(() => {
            setFeedEffect(null);
            setIsDancing(false);
            setExpression("happy");
          }, 1500);

          setFridgeMessage(`🍰 餵食成功！共同飼養的小星感到非常滿足～`);
        }
      } catch (e: any) {
        setFridgeMessage(`❌ ${e.message}`);
      }
    }
  };

  // Handle Drag / Click of Furniture Positions
  const handleRoomClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedFurnitureId || !roomRef.current) return;

    const rect = roomRef.current.getBoundingClientRect();
    let clickX = e.clientX - rect.left - 25; // center offset
    let clickY = e.clientY - rect.top - 25;

    clickX = Math.max(5, Math.min(rect.width - 60, clickX));
    clickY = Math.max(5, Math.min(rect.height - 60, clickY));

    if (activeTab === "single") {
      setSoloFurniture(prev =>
        prev.map(f => f.id === selectedFurnitureId ? { ...f, x: clickX, y: clickY } : f)
      );
    } else {
      if (!activeGroup) return;
      const updatedFurniture = activeGroup.pet.furniture.map((f: any) =>
        f.id === selectedFurnitureId ? { ...f, x: clickX, y: clickY } : f
      );
      executeCoparentAction("move-furniture", { furniture: updatedFurniture });
    }
  };

  // Star Click interactions
  const handleStarClick = () => {
    if (activeTab === "friend") {
      if (!currentUser) {
        alert("互動獲取星星幣需要登入星願帳號喔！已為您在下方顯示模擬快速登入。");
        return;
      }
      setIsDancing(true);
      const expressions: ("blink" | "happy" | "shy" | "glow")[] = ["blink", "happy", "shy", "glow"];
      setExpression(expressions[Math.floor(Math.random() * expressions.length)]);

      const targetId = isVisitingGroup ? selectedVisitedGroup?.id : (visitedPet?.id || visitingFriend?.id);
      if (!targetId) return;

      fetch("/api/friends/pet/interact-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          targetId,
          isGroup: isVisitingGroup
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setInteractionRewardMsg(data.message);
            setBubbleText(`✨ 哇！謝謝你的溫暖陪伴！${visitingFriend?.username} 的星寵特別開心地對你眨了眨眼！💖`);
            if (data.visitorCoins !== undefined) {
              setSoloCoins(data.visitorCoins);
            }
            // Increment achievements and exp
            updateAchievementProgress("friend_visit", 1, true);
            addSoloExp(10);
          } else {
            alert(data.error || "互動失敗");
          }
        })
        .catch(err => console.error("Error during visitor interaction:", err));

      setTimeout(() => {
        setIsDancing(false);
      }, 1000);
      return;
    }

    if (petState !== "idle") {
      setPetState("idle");
      const name = activeTab === "single" ? soloPetName : activeGroup?.pet?.name || "小星";
      setBubbleText(`哇！我醒來/站起來囉！精神飽滿！☀️`);
      setIsDancing(true);
      setExpression("happy");
      setTimeout(() => {
        setIsDancing(false);
      }, 1000);
      return;
    }

    setIsDancing(true);
    const expressions: ("blink" | "happy" | "shy" | "glow")[] = ["blink", "happy", "shy", "glow"];
    const randExpr = expressions[Math.floor(Math.random() * expressions.length)];
    setExpression(randExpr);

    const randomBubble = TALK_BUBBLES[Math.floor(Math.random() * TALK_BUBBLES.length)];
    setBubbleText(randomBubble);
    setShowBubble(true);

    if (activeTab === "single") {
      setSoloLove(prev => Math.min(100, prev + 3));
      addSoloExp(2);
    } else {
      executeCoparentAction("feed-pet", { foodId: "dummy", fullnessVal: 0, loveVal: 2 }).catch(() => {});
    }

    setTimeout(() => {
      setIsDancing(false);
    }, 1000);
  };



  // Hourly Photo sharing submit
  const handlePhotoShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || !currentUser) return;
    
    // Choose a sweet random starry photo if user leaves input empty
    const finalUrl = photoUrlInput.trim() || [
      "https://images.unsplash.com/photo-1518887570146-0612132dd618?w=500", // dreamy star light
      "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=500", // pink sunset pastel sky
      "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=500", // magical nebula
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500"  // milky way mountains
    ][Math.floor(Math.random() * 4)];

    const finalCaption = photoCaptionInput.trim() || "📸 美好的一天，跟朋友一起守護我們的粉紅星寵！💖";

    try {
      const res = await executeCoparentAction("share-photo", {
        image_url: finalUrl,
        caption: finalCaption
      });
      if (res) {
        setPhotoUrlInput("");
        setPhotoCaptionInput("");
        setIsSharingPhoto(false);
        setBubbleText(`哇！謝謝你上傳了照片！大家一起獲得了 +50 星星幣 🪙，快去點擊冰箱買美味零食吧！`);
        setExpression("glow");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Reset Solo furniture
  const handleResetSoloFurniture = () => {
    setSoloFurniture(DEFAULT_FURNITURE);
    setBubbleText("哇！家具都回到了原本的位置，擺得整整齊齊了，謝謝你幫我整理房間 🌸");
    setExpression("happy");
  };

  const handleSaveCustomSkin = async (dataUrl: string) => {
    if (activeTab === "single") {
      setSoloCustomSkin(dataUrl);
      setBubbleText(`哇！這是我新的彩繪服裝嗎？畫得太好看了，我很喜歡喔！✨`);
      setExpression("glow");
    } else {
      if (!activeGroup) return;
      try {
        const res = await executeCoparentAction("save-skin", { customSkin: dataUrl });
        if (res) {
          setBubbleText(`哇！這是我新繪製的家庭共享外觀嗎？大家畫得太棒了！✨`);
          setExpression("glow");
        }
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const handleClearCustomSkin = async () => {
    if (activeTab === "single") {
      setSoloCustomSkin("");
      setBubbleText(`衣服洗乾淨囉，回歸最自然純粹的粉嫩棉花糖外表！🌸`);
      setExpression("happy");
    } else {
      if (!activeGroup) return;
      try {
        const res = await executeCoparentAction("save-skin", { customSkin: "" });
        if (res) {
          setBubbleText(`共享外觀洗乾淨囉，回歸最經典的粉萌樣子！🌸`);
          setExpression("happy");
        }
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  // Automated conversations between pets when multiple co-habit in the same home
  useEffect(() => {
    if (activeTab !== "single") return;

    const interval = setInterval(() => {
      const activePets = pets.filter(p => p.currentHome === currentHomeId);
      if (activePets.length < 2) {
        setAutoConversation(null);
        return;
      }

      const starPet = activePets.find(p => p.species === "star");
      const pigPet = activePets.find(p => p.species === "pig");
      const dogPet = activePets.find(p => p.species === "dog");

      let dialogues: { speakerId: string; text: string }[] = [];

      if (starPet && pigPet && dogPet) {
        const r = Math.random();
        if (r < 0.33) {
          dialogues = [
            { speakerId: starPet.id, text: `大家快看！今晚的星空好璀璨喔～🌌` },
            { speakerId: pigPet.id, text: `哼唧哼唧，今晚最適合喝香甜的蜜桃流星果汁！🐷` },
            { speakerId: dogPet.id, text: `汪！今晚我要在大草地上開心地追著流星跑！🐶✨` }
          ];
        } else if (r < 0.66) {
          dialogues = [
            { speakerId: pigPet.id, text: `這個大沙發是我的！我要舒服地躺著，哼哼～🐷` },
            { speakerId: dogPet.id, text: `汪！明明是我先走過來的，分我一半啦！🐶` },
            { speakerId: starPet.id, text: `好啦好啦，大家一起擠一擠，沙發很大的啦～🫂✨` }
          ];
        } else {
          dialogues = [
            { speakerId: dogPet.id, text: `小豬、小星星！我們來玩捉迷藏好不好？🐶🐾` },
            { speakerId: starPet.id, text: `好呀！那我躲到棉花糖蓬蓬床後面～✨` },
            { speakerId: pigPet.id, text: `哼唧！那我就負責吃掉圓桌上的馬卡龍！😋` }
          ];
        }
      } else if (starPet && pigPet) {
        const r = Math.random();
        if (r < 0.5) {
          dialogues = [
            { speakerId: starPet.id, text: `小豬豬「${pigPet.name}」，你是不是又偷偷吃了冰箱裡的櫻桃草莓布丁？😮` },
            { speakerId: pigPet.id, text: `哼唧！才沒有呢，我只是幫忙測試一下布丁的Q彈度啦～🐷💖` }
          ];
        } else {
          dialogues = [
            { speakerId: pigPet.id, text: `小星星「${starPet.name}」，你的身體軟綿綿的，好像大大的棉花糖喔！🍬` },
            { speakerId: starPet.id, text: `嘿嘿，因為我是用亮晶晶的願望和甜度做成的呀！🌟` }
          ];
        }
      } else if (starPet && dogPet) {
        const r = Math.random();
        if (r < 0.5) {
          dialogues = [
            { speakerId: dogPet.id, text: `「${starPet.name}」！我們來玩扔星星和接球球的遊戲吧！汪汪！🐶⚾` },
            { speakerId: starPet.id, text: `好呀好呀！但是你不准真的用大嘴巴咬住我喔，我怕癢～🌟` }
          ];
        } else {
          dialogues = [
            { speakerId: starPet.id, text: `小狗「${dogPet.name}」，你的尾巴搖得像小直升機一樣，太熱情啦！💖` },
            { speakerId: dogPet.id, text: `汪嗚！因為能看到心愛的主人和你在同一間家園，我太興奮了嘛！🐶🐾` }
          ];
        }
      } else if (pigPet && dogPet) {
        const r = Math.random();
        if (r < 0.5) {
          dialogues = [
            { speakerId: pigPet.id, text: `小狗「${dogPet.name}」，你尾巴搖得太快，把我的蜜桃流星果汁都吹得冒泡了啦！💢` },
            { speakerId: dogPet.id, text: `汪汪！對不起嘛，那我輕一點搖，你分我喝一口果汁好不好？🐶🍹` }
          ];
        } else {
          dialogues = [
            { speakerId: pigPet.id, text: `哼唧哼唧，我們在同一間屋子裡，感觉家裡變得好熱鬧、好溫暖喔！🐷🏡` },
            { speakerId: dogPet.id, text: `沒確汪！兩個人合養，有雙倍的愛 and 雙倍的零食吃！汪汪！🐶💖` }
          ];
        }
      }

      if (dialogues.length > 0) {
        let step = 0;
        const playStep = () => {
          if (step < dialogues.length) {
            const current = dialogues[step];
            const p = activePets.find(pet => pet.id === current.speakerId);
            if (p) {
              setAutoConversation({
                speakerId: current.speakerId,
                speakerName: p.name,
                text: current.text
              });
            }
            step++;
            setTimeout(playStep, 4500); // 4.5 seconds per message sentence
          } else {
            setAutoConversation(null);
          }
        };
        playStep();
      }
    }, 14000); // dialogue trigger interval every 14 seconds

    return () => clearInterval(interval);
  }, [pets, currentHomeId, activeTab]);

  // Helper getters to unify single/coparent/friend modes and support multiple pets, hatching, room switching and individual custom skin paintings
  const getActivePetsList = (): any[] => {
    if (activeTab === "single") {
      return pets;
    } else if (activeTab === "coparent") {
      if (activeGroup) {
        return activeGroup.pets_v2 || [
          {
            id: "star",
            species: "star",
            name: activeGroup.pet?.name || "蜜桃粉萌星",
            level: activeGroup.pet?.level || 1,
            exp: activeGroup.pet?.exp || 0,
            fullness: activeGroup.pet?.fullness || 50,
            love: activeGroup.pet?.love || 50,
            customSkin: activeGroup.pet?.custom_skin || "",
            currentHome: activeGroup.currentHomeId || "home_star"
          }
        ];
      }
      return [];
    } else {
      // friend
      if (isVisitingGroup && selectedVisitedGroup) {
        return selectedVisitedGroup.pets_v2 || [
          {
            id: "star",
            species: "star",
            name: selectedVisitedGroup.pet?.name || "蜜桃粉萌星",
            level: selectedVisitedGroup.pet?.level || 1,
            exp: selectedVisitedGroup.pet?.exp || 0,
            fullness: selectedVisitedGroup.pet?.fullness || 50,
            love: selectedVisitedGroup.pet?.love || 50,
            customSkin: selectedVisitedGroup.pet?.custom_skin || "",
            currentHome: selectedVisitedGroup.currentHomeId || "home_star"
          }
        ];
      } else if (visitedPet) {
        return [
          {
            id: "star",
            species: "star",
            name: visitedPet.name || "小星",
            level: visitedPet.level || 1,
            exp: visitedPet.exp || 0,
            fullness: visitedPet.fullness || 75,
            love: visitedPet.love || 80,
            customSkin: visitedPet.custom_skin || "",
            currentHome: "home_star"
          }
        ];
      }
      return [];
    }
  };

  const getEffectiveHomeId = () => {
    if (activeTab === "single") {
      return currentHomeId;
    } else if (activeTab === "coparent") {
      return activeGroup?.currentHomeId || "home_star";
    } else {
      if (isVisitingGroup && selectedVisitedGroup) {
        return selectedVisitedGroup.currentHomeId || "home_star";
      }
      return "home_star";
    }
  };

  const getEffectiveFocusedPetId = () => {
    if (activeTab === "single") {
      return focusedPetId;
    } else if (activeTab === "coparent") {
      return activeGroup?.focusedPetId || "star";
    } else {
      if (isVisitingGroup && selectedVisitedGroup) {
        return selectedVisitedGroup.focusedPetId || "star";
      }
      return "star";
    }
  };

  const activePetsList = getActivePetsList();
  const effectiveHomeId = getEffectiveHomeId();
  const effectiveFocusedPetId = getEffectiveFocusedPetId();
  const focusedPetObj = activePetsList.find(p => p.id === effectiveFocusedPetId) || activePetsList[0];

  const currentPetName = activeTab === "single"
    ? soloPetName
    : focusedPetObj?.name || "蜜桃粉萌星";

  const currentFullness = activeTab === "single"
    ? soloFullness
    : focusedPetObj?.fullness ?? 50;

  const currentLove = activeTab === "single"
    ? soloLove
    : focusedPetObj?.love ?? 50;

  const currentCoins = activeTab === "single"
    ? soloCoins
    : activeTab === "friend"
    ? soloCoins // Visitor's own coins wallet
    : activeGroup?.star_coins || 0;

  const currentFurnitureList = activeTab === "single"
    ? soloFurniture
    : activeTab === "friend"
    ? (isVisitingGroup ? (selectedVisitedGroup?.pet?.furniture || DEFAULT_FURNITURE) : DEFAULT_FURNITURE)
    : activeGroup?.pet?.furniture || DEFAULT_FURNITURE;

  const currentFridgeFood = activeTab === "single"
    ? soloFridgeFood
    : activeTab === "friend"
    ? (isVisitingGroup ? (selectedVisitedGroup?.refrigerator_food || {}) : {})
    : activeGroup?.refrigerator_food || {};

  const currentCustomSkin = activeTab === "single"
    ? soloCustomSkin
    : focusedPetObj?.customSkin || focusedPetObj?.custom_skin || "";

  return (
    <div className="relative w-full max-w-5xl mx-auto glass border border-[#FF799C]/20 rounded-[36px] p-6 text-center overflow-hidden min-h-[620px] flex flex-col justify-between shadow-xl">
      
      {/* Falling star background details */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {fallingItems.map((item) => (
          <motion.div
            key={item.id}
            className="absolute text-xl select-none"
            style={{ left: `${item.x}%`, top: "-5%" }}
            initial={{ y: -20, opacity: 0, rotate: 0 }}
            animate={{
              y: "110vh",
              opacity: [0, 0.8, 0.8, 0],
              rotate: 360,
              x: `${item.x + (item.id % 2 === 0 ? 4 : -4)}%`
            }}
            transition={{
              duration: item.duration,
              repeat: Infinity,
              delay: item.delay,
              ease: "linear"
            }}
          >
            <span style={{ transform: `scale(${item.scale})`, display: "inline-block" }}>
              {item.char}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,121,156,0.05)_0%,transparent_80%)] pointer-events-none" />

      {/* Header and Mode Tab Toggles */}
      <div className="relative z-10 flex flex-col items-center">
        <span className="text-[10px] font-mono tracking-[0.3em] text-[#FF799C] uppercase block mb-1">
          ALL FOR JIYU • STARRY COMPANION
        </span>

        {/* Cute Segmented Mode Controller */}
        <div className="flex gap-2 bg-[#FF799C]/5 border border-[#FF799C]/15 p-1 rounded-2xl mb-4">
          <button
            onClick={() => {
              setVisitingFriend(null);
              setActiveTab("single");
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "single" ? "bg-[#FF799C] text-white shadow-sm" : "text-[#6E4B55]/70 hover:text-[#FF799C]"}`}
          >
            ✨ 單人私密小屋
          </button>
          <button
            onClick={() => {
              if (!currentUser) {
                alert("共同飼養需要登入星願帳號喔！已為您在下方顯示模擬登入引導。");
              }
              setVisitingFriend(null);
              setActiveTab("coparent");
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${activeTab === "coparent" ? "bg-[#FF799C] text-white shadow-sm" : "text-[#6E4B55]/70 hover:text-[#FF799C]"}`}
          >
            <Users className="h-3 w-3" /> 2~6人共同飼養星家
          </button>
          <button
            onClick={() => {
              setVisitingFriend(null);
              setActiveTab("plog");
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${activeTab === "plog" ? "bg-[#FF799C] text-white shadow-sm" : "text-[#6E4B55]/70 hover:text-[#FF799C]"}`}
          >
            <Camera className="h-3.5 w-3.5" /> 📸 PLOG 拼圖記錄
          </button>
          {activeTab === "friend" && (
            <button
              onClick={() => {}}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#FF799C] to-[#FFCCDD] text-white shadow-sm flex items-center gap-1.5 border border-[#FF799C]/15"
            >
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>參訪中：{visitingFriend?.username}</span>
            </button>
          )}
        </div>

        {/* Guest Warning Banner */}
        {!currentUser && (
          <div className="bg-[#FFF0F3] border border-[#FF799C]/20 rounded-2xl p-3.5 mb-5 max-w-2xl w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-start gap-2.5">
              <Info className="h-4.5 w-4.5 text-[#FF799C] shrink-0 mt-0.5 animate-bounce" />
              <div>
                <h4 className="text-xs font-bold text-[#FF799C]">登入帳號，解鎖完整的粉紅共同飼養！</h4>
                <p className="text-[10px] text-[#6E4B55]/70 leading-relaxed">
                  訪客模式下僅能使用本機單人小屋。請點選右上角「登入」以解鎖完整功能：添加好友、創立 2~6 人共同飼養房、<b>以每小時分享照片獲得星星幣</b>並共享草莓冰箱儲藏室 🌸
                </p>
              </div>
            </div>
          </div>
        )}

        {/* FRIEND VISITOR ROOM CONTROLLER & WELCOME BANNER */}
        {activeTab === "friend" && visitingFriend && (
          <div className="bg-[#FFF4F7]/90 border-2 border-[#FF799C]/25 rounded-[22px] p-4 mb-5 max-w-2xl w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-sm z-10 relative">
            <div className="flex items-start gap-3 flex-1">
              <img src={visitingFriend.avatar || undefined} alt="Avatar" className="w-11 h-11 rounded-full border-2 border-[#FF799C]/20 shadow-sm shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-[#FF799C] flex items-center gap-1.5">
                  🌟 正在拜訪 {visitingFriend.username} 的星空萌星家園
                </h4>
                <p className="text-[10px] text-[#6E4B55]/75 leading-relaxed mt-0.5">
                  戳戳牠進行互動陪伴！系統將<b>根據陪伴時間與頻率</b>自動計算並發放星星幣獎勵 🪙，且好友亦能獲得祝福加成！
                </p>
                {interactionRewardMsg && (
                  <div className="mt-1.5 text-[9.5px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 inline-block font-bold animate-pulse">
                    {interactionRewardMsg}
                  </div>
                )}
              </div>
            </div>
            
            {/* Visited Room Switcher */}
            <div className="flex flex-col items-stretch sm:items-end gap-1.5 border-t sm:border-t-0 border-[#FF799C]/10 pt-2 sm:pt-0 shrink-0">
              <span className="text-[8px] text-[#6E4B55]/60 font-mono text-center sm:text-right block">切換該玩家的家園：</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    setIsVisitingGroup(false);
                    setSelectedVisitedGroup(null);
                    setVisitedGroupMembers([{ id: visitingFriend.id, username: visitingFriend.username, avatar: visitingFriend.avatar }]);
                    setInteractionRewardMsg("");
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-bold border transition-all active:scale-95 ${!isVisitingGroup ? "bg-[#FF799C] text-white border-[#FF799C] shadow-sm" : "bg-white text-[#6E4B55] border-[#FF799C]/15 hover:bg-pink-50/50"}`}
                >
                  🏠 個人私密房
                </button>
                {visitedCoparentGroups.map(g => (
                  <button
                    key={g.id}
                    onClick={() => handleSelectVisitedGroup(g)}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-bold border transition-all active:scale-95 ${isVisitingGroup && selectedVisitedGroup?.id === g.id ? "bg-[#FF799C] text-white border-[#FF799C] shadow-sm" : "bg-white text-[#6E4B55] border-[#FF799C]/15 hover:bg-pink-50/50"}`}
                  >
                    🏡 {g.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Title Name Customizer Header */}
        {activeTab !== "plog" && (
          <div className="flex items-center justify-center gap-3 mt-1">
            {activeTab === "single" ? (
            isEditingSoloName ? (
              <div className="flex items-center gap-1.5 bg-white/95 border border-[#FF799C]/40 rounded-full px-3.5 py-1 shadow-sm">
                <input
                  type="text"
                  value={tempSoloName}
                  onChange={(e) => setTempSoloName(e.target.value)}
                  maxLength={10}
                  className="bg-transparent text-lg font-serif text-[#FF799C] focus:outline-none w-32 text-center"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (tempSoloName.trim()) {
                        setSoloPetName(tempSoloName.trim());
                        setIsEditingSoloName(false);
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (tempSoloName.trim()) {
                      setSoloPetName(tempSoloName.trim());
                      setIsEditingSoloName(false);
                    }
                  }}
                  className="text-emerald-500 hover:text-emerald-600 p-0.5"
                >
                  <Check className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-serif font-light text-[#FF799C] tracking-wide">
                  {soloPetName} 的棉花糖星空家園
                </h2>
                <button
                  onClick={() => {
                    setTempSoloName(soloPetName);
                    setIsEditingSoloName(true);
                  }}
                  className="p-1 hover:bg-[#FF799C]/10 rounded-full text-[#FF799C] transition-all cursor-pointer"
                  title="為星星修改名字"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          ) : activeTab === "friend" ? (
            <div className="flex flex-col items-center">
              <h2 className="text-2xl sm:text-3xl font-serif font-light text-[#FF799C] tracking-wide">
                {currentPetName} 的星空夢幻小屋 🌸
              </h2>
            </div>
          ) : (
            // Co-parenting group pet header
            activeGroup ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-serif font-light text-[#FF799C] tracking-wide">
                    {activeGroup.pet.name} <span className="text-sm font-sans text-[#6E4B55]/70">({activeGroup.name} 共同飼養)</span>
                  </h2>
                  <button
                    onClick={async () => {
                      const newN = prompt("請輸入新的寵物星星名字：", activeGroup.pet.name);
                      if (newN && newN.trim()) {
                        await executeCoparentAction("rename", { newName: newN.trim() });
                      }
                    }}
                    className="p-1 hover:bg-[#FF799C]/10 rounded-full text-[#FF799C] transition-all cursor-pointer"
                    title="為共同寵物星星修改名字"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-[#6E4B55]/60 mt-1 flex items-center gap-1.5 bg-[#FF799C]/5 border border-[#FF799C]/10 px-2.5 py-0.5 rounded-full font-mono">
                  <span>🏡 成員數: {activeGroup.member_ids?.length || 0} / 6 人</span>
                  <span>•</span>
                  <span>🪙 共享家庭幣: {activeGroup.star_coins || 0}</span>
                </p>
              </div>
            ) : (
              <h2 className="text-xl font-serif text-[#FF799C]">共同飼養星空小屋</h2>
            )
          )}
        </div>
        )}

        {(activeTab === "single" || (activeTab === "coparent" && activeGroup)) && (
          <div className="mt-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/75 border border-[#FF799C]/20 rounded-[24px] p-4 max-w-2xl w-full mx-auto shadow-xs">
            {/* Level & EXP Progress */}
            <div className="flex flex-col items-start w-full sm:w-auto flex-1 px-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-gradient-to-r from-[#FF799C] to-[#FFAEC9] text-white font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  Lv.{activeTab === "single" ? soloLevel : (focusedPetObj?.level || activeGroup?.pet?.level || 1)}
                </span>
                <span className="text-[11px] text-[#6E4B55] font-bold">
                  {activeTab === "single" ? soloPetName : (focusedPetObj?.name || activeGroup?.pet?.name || "蜜桃粉萌星")} 的經驗值：
                  {activeTab === "single" ? soloExp : (focusedPetObj?.exp || activeGroup?.pet?.exp || 0)} /{" "}
                  {activeTab === "single" ? (soloLevel * 100) : ((focusedPetObj?.level || activeGroup?.pet?.level || 1) * 100)}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-[#FF799C]/10">
                <motion.div
                  className="bg-gradient-to-r from-[#FF799C] to-[#FF9EBA] h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(
                      100,
                      activeTab === "single"
                        ? (soloExp / (soloLevel * 100)) * 100
                        : (((focusedPetObj?.exp || activeGroup?.pet?.exp || 0) /
                            ((focusedPetObj?.level || activeGroup?.pet?.level || 1) * 100)) * 100)
                    )}%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Shop & Achievement Quick Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setIsShopOpen(true)}
                className="bg-gradient-to-r from-[#FF799C] to-[#FF9EBA] hover:opacity-95 text-white font-bold text-xs px-4 py-2 rounded-2xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <span>🛍️ 家具商店</span>
              </button>
              <button
                onClick={() => setIsAchievementsOpen(true)}
                className="bg-gradient-to-r from-[#FF9800] to-[#FFC107] hover:opacity-95 text-white font-bold text-xs px-4 py-2 rounded-2xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <span>🏆 萌星成就</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {activeTab === "plog" ? (
        <div className="relative z-10 w-full my-6 flex-1">
          <PlogModule currentUser={currentUser} />
        </div>
      ) : (
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 items-stretch flex-1">
        
        {/* LEFT COLUMN: THE DECORATION PLAYGROUND (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-between bg-white/40 border border-[#FF799C]/15 rounded-[28px] p-4 min-h-[380px]">
          
          <div className="w-full flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-mono text-[#6E4B55]/70 flex items-center gap-1.5">
              <span>🏠 粉紅佈置空間 (支援在房內拖曳家具、選中後點擊放置)</span>
            </span>
            <button
              onClick={activeTab === "single" ? handleResetSoloFurniture : () => {
                if (activeGroup) {
                  const reset = DEFAULT_FURNITURE.map((f, i) => ({ ...f, x: 20 + i * 40, y: 150 }));
                  executeCoparentAction("move-furniture", { furniture: reset });
                }
              }}
              className="text-[10px] text-[#FF799C] bg-[#FF799C]/5 hover:bg-[#FF799C]/10 px-2 py-1 rounded-lg border border-[#FF799C]/10 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <RefreshCw className="h-3 w-3 animate-spin-slow" /> 重置佈置
            </button>
          </div>

          {/* DANMAKU BARRAGE BROADCAST BOARD */}
          <div className="w-full bg-[#FFF0F4]/40 border border-[#FF799C]/10 rounded-xl p-2.5 mb-3 overflow-hidden relative min-h-[48px] flex flex-col justify-center shadow-xs">
            <div className="absolute top-1.5 left-2.5 flex items-center gap-1 z-10 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full border border-pink-100/50 shadow-2xs scale-90">
              <span className="text-[9px] font-black text-[#FF799C] flex items-center gap-1 animate-pulse">
                <span>📢</span> 萌星廣播
              </span>
            </div>
            
            <div className="relative w-full h-8 overflow-hidden mt-3 pl-2 flex items-center">
              <AnimatePresence mode="wait">
                {danmakus.length === 0 ? (
                  <motion.div
                    key="empty-danmaku"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] text-gray-400 font-medium italic pl-1"
                  >
                    寵物房間很安靜，輕輕觸摸星寵，聽聽牠們的心聲吧 ✨
                  </motion.div>
                ) : (
                  <div className="w-full flex items-center justify-start overflow-hidden">
                    {danmakus.map((d) => (
                      <motion.div
                        key={d.id}
                        initial={{ opacity: 0, scale: 0.9, x: 30 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, x: -30 }}
                        transition={{ type: "spring", stiffness: 120, damping: 16 }}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-full border shadow-sm flex items-center gap-1.5 whitespace-nowrap max-w-full truncate ${d.color}`}
                      >
                        <span className="text-[10px] shrink-0">💬</span>
                        <span className="truncate">{d.text}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* THE DECOR ROOM CONTAINER */}
          <div
            ref={roomRef}
            onClick={handleRoomClick}
            className={`relative w-full h-[300px] border-2 rounded-2xl overflow-hidden shadow-inner cursor-crosshair transition-all duration-700 ${
              activeTab === "single"
                ? currentHomeId === "home_pig"
                  ? "bg-gradient-to-b from-[#FFF5F6] to-[#FFEBF1] border-[#FF5B7E]/25"
                  : currentHomeId === "home_dog"
                  ? "bg-gradient-to-b from-[#FFFBF2] to-[#F5EBDD] border-[#D4A373]/25"
                  : "bg-gradient-to-b from-[#FFF0F4] to-[#FFE0E9] border-[#FF799C]/25"
                : "bg-gradient-to-b from-[#FFF0F4] to-[#FFE0E9] border-[#FF799C]/25"
            }`}
          >
            {/* Active home badge indicator */}
            {activeTab === "single" && (
              <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-xs border border-[#FF799C]/20 px-3 py-1 rounded-full text-[9px] font-bold text-[#6E4B55] flex items-center gap-1 shadow-xs">
                <span>{getHomeName(currentHomeId)}</span>
                {pets.filter(p => p.currentHome === currentHomeId).length === 0 && (
                  <span className="bg-amber-100 text-amber-700 text-[8px] px-1.5 rounded-full font-black animate-pulse">閒置空房</span>
                )}
              </div>
            )}

            {/* Cute backdrop wallpaper details */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gradient-to-b from-[#2E1834] to-[#4A1D50] border-2 border-white rounded-full flex items-center justify-center overflow-hidden shadow-md">
              <div className="absolute top-1 right-2 text-yellow-200 text-[9px] animate-pulse">🌙</div>
              <div className="absolute bottom-1 left-2 text-white/50 text-[6px]">⭐</div>
              <div className="absolute bottom-[-2px] w-full h-4 bg-white/10 rounded-full blur-[1px]" />
            </div>

            <div className="absolute top-6 left-6 text-xl opacity-20 select-none">☁️</div>
            <div className="absolute top-14 right-10 text-lg opacity-25 select-none animate-pulse">🌸</div>
            <div className="absolute top-4 right-6 text-[8px] opacity-25 font-mono uppercase tracking-wider">
              {activeTab === "single" ? getHomeName(currentHomeId) : "PINKISH ROOM"}
            </div>

            {/* RENDER CUTE ROUNDED PINK FURNITURE VECTOR OBJECTS */}
            {currentFurnitureList.map((f: any) => (
              <motion.div
                key={`${f.id}-${f.x}-${f.y}`}
                drag
                dragMomentum={false}
                dragConstraints={roomRef}
                dragElastic={0}
                style={{ left: f.x, top: f.y, position: "absolute" }}
                onDragEnd={(event, info) => {
                  const rect = roomRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  
                  let nextX = f.x + info.offset.x;
                  let nextY = f.y + info.offset.y;
                  
                  nextX = Math.max(5, Math.min(rect.width - 65, nextX));
                  nextY = Math.max(5, Math.min(rect.height - 65, nextY));

                  if (activeTab === "single") {
                    setSoloFurniture(prev =>
                      prev.map(item => item.id === f.id ? { ...item, x: nextX, y: nextY } : item)
                    );
                  } else {
                    if (!activeGroup) return;
                    const updated = activeGroup.pet.furniture.map((item: any) =>
                      item.id === f.id ? { ...item, x: nextX, y: nextY } : item
                    );
                    executeCoparentAction("move-furniture", { furniture: updated });
                  }
                }}
                className={`z-10 cursor-grab active:cursor-grabbing p-1.5 rounded-2xl flex flex-col items-center justify-center select-none touch-none bg-white/95 border-2 transition-all hover:scale-105 active:scale-95 shadow-md ${selectedFurnitureId === f.id ? "border-[#FF799C] ring-2 ring-[#FF799C]/25" : "border-[#FF799C]/15"}`}
                onClick={(e) => {
                  e.stopPropagation(); // avoid parent room click
                  setSelectedFurnitureId(f.id);
                  
                  // Special check: Refrigerator clicks!
                  if (f.id === "fridge") {
                    setIsFridgeOpen(true);
                    setFridgeMessage(`🍰 歡迎光臨草莓波點冰箱！點擊食物餵食 ${currentPetName}，或是採購更多美味吧！`);
                  } else if (f.id === "bed") {
                    setPetState("sleeping");
                    setBubbleText(`${currentPetName} 躺在軟綿綿的草莓棉花糖大床上，正甜甜地睡著呢... 🐑 zZZ (點擊寵物可喚醒)`);
                  } else if (f.id === "sofa") {
                    setPetState("sitting");
                    setBubbleText(`${currentPetName} 舒服地坐在蜜桃雲朵沙發上，晃晃小腿感覺超級愜意！🍵 (點擊寵物可站立)`);
                  }
                }}
              >
                {/* Custom SVG furniture node rendering */}
                <div className="filter drop-shadow-[0_2px_4px_rgba(255,121,156,0.12)]">
                  {FURNITURE_SVGS[f.id] || <span className="text-2xl">🧸</span>}
                </div>
                
                <span className="text-[8px] font-bold text-[#6E4B55] mt-0.5 whitespace-nowrap bg-[#FFD6E3]/50 px-1 rounded-full">
                  {f.name}
                </span>

                {/* Sparkle indicator if refrigerator */}
                {f.id === "fridge" && (
                  <span className="absolute top-[-4px] right-[-4px] bg-[#FF799C] text-[7px] text-white font-bold px-1 rounded-full scale-90 animate-pulse uppercase">
                    OPEN
                  </span>
                )}
              </motion.div>
            ))}

            {/* THE REDESIGNED EXTREMELY CUTELY ROUNDED PINK COTTON CANDY PET STAR */}
            {(activeTab === "single" || activeTab === "coparent") ? (
              // MULTIPLE PETS CO-HABITATION
              getActivePetsList().filter(p => p.currentHome === getEffectiveHomeId()).map((p, idx, filtered) => {
                const isFocused = getEffectiveFocusedPetId() === p.id;
                const pos = getPetPositionClass(idx, filtered.length);
                
                let petStyle: React.CSSProperties = {
                  position: "absolute",
                  transition: "all 0.8s ease-in-out",
                  ...pos
                };

                if (isFocused && petState === "sitting" && currentFurnitureList.find((f: any) => f.id === "sofa")) {
                  const sofa = currentFurnitureList.find((f: any) => f.id === "sofa");
                  petStyle = {
                    position: "absolute",
                    left: ((sofa?.x ?? 190) - 35) + "px",
                    top: ((sofa?.y ?? 160) - 45) + "px",
                    transform: "none",
                    transition: "all 0.8s ease-in-out"
                  };
                } else if (isFocused && petState === "sleeping" && currentFurnitureList.find((f: any) => f.id === "bed")) {
                  const bed = currentFurnitureList.find((f: any) => f.id === "bed");
                  petStyle = {
                    position: "absolute",
                    left: ((bed?.x ?? 20) - 35) + "px",
                    top: ((bed?.y ?? 150) - 35) + "px",
                    transform: "none",
                    transition: "all 0.8s ease-in-out"
                  };
                } else {
                  petStyle = {
                    position: "absolute",
                    bottom: "20px",
                    transition: "all 0.8s ease-in-out",
                    ...pos
                  };
                }

                const displayExpr = isFocused ? expression : "happy";
                const displayState = isFocused ? petState : "idle";

                return (
                  <div
                    key={p.id}
                    className={`z-20 transition-all duration-300 ${isFocused ? "scale-105 filter drop-shadow-[0_0_15px_rgba(255,121,156,0.55)]" : "opacity-85 hover:opacity-100"}`}
                    style={petStyle}
                  >
                    {/* Feeding floating food items indicator */}
                    <AnimatePresence>
                      {isFocused && feedEffect && (
                        <motion.div
                          initial={{ scale: 0.5, y: 35, opacity: 0 }}
                          animate={{ scale: [1, 1.5, 0.9], y: [10, -40, -80], opacity: [0, 1, 1, 0] }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.3, ease: "easeOut" }}
                          className="absolute text-4xl z-30 left-7 top-[-35px] filter drop-shadow-md"
                        >
                          {feedEffect}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Floating sleep Zzz letters if sleeping */}
                    {isFocused && petState === "sleeping" && (
                      <div className="absolute top-[-30px] right-[-10px] z-30 flex flex-col pointer-events-none select-none">
                        <motion.span 
                          animate={{ y: [-5, -25], x: [0, 8, 0], opacity: [0, 1, 0], scale: [0.8, 1.2, 0.9] }} 
                          transition={{ repeat: Infinity, duration: 2, delay: 0 }}
                          className="text-xs font-bold text-[#FF799C]"
                        >
                          z
                        </motion.span>
                        <motion.span 
                          animate={{ y: [-5, -25], x: [0, -6, 0], opacity: [0, 1, 0], scale: [0.8, 1.3, 0.9] }} 
                          transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}
                          className="text-sm font-bold text-[#FF799C]/80 ml-2"
                        >
                          Z
                        </motion.span>
                        <motion.span 
                          animate={{ y: [-5, -25], x: [0, 10, 0], opacity: [0, 1, 0], scale: [0.8, 1.4, 0.9] }} 
                          transition={{ repeat: Infinity, duration: 2, delay: 1.2 }}
                          className="text-md font-bold text-[#FF799C]/60 ml-4"
                        >
                          Z
                        </motion.span>
                      </div>
                    )}

                    {/* Halo background light glow */}
                    {isFocused && (
                      <div className="absolute inset-0 m-auto h-24 w-24 rounded-full bg-gradient-to-tr from-[#FF799C]/25 to-[#FFD5E0]/45 blur-xl animate-pulse pointer-events-none" />
                    )}

                    {/* Name tag and Level tag above Pet */}
                    <div className="absolute top-[-30px] left-1/2 transform -translate-x-1/2 bg-white/95 border border-[#FF799C]/30 text-[10px] text-[#6E4B55] font-black px-2.5 py-0.5 rounded-full shadow-xs whitespace-nowrap flex items-center gap-1 z-30">
                      <span className="text-[9px] bg-[#FF799C] text-white px-1 rounded-sm">Lv.{p.level}</span>
                      <span>{p.name}</span>
                      {isFocused && <span className="text-[#FF4B72]">⭐</span>}
                    </div>

                    {/* Speech bubble removed from here and moved to non-obstructive Danmaku channel as requested */}

                    {/* Main star with dynamic animation */}
                    <motion.div
                      className="relative flex items-center justify-center cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (getEffectiveFocusedPetId() === p.id) {
                          handleStarClick();
                        } else {
                          if (activeTab === "single") {
                            selectFocusedPet(p.id);
                          } else if (activeTab === "coparent") {
                            executeCoparentAction("switch-home-and-focus", { homeId: p.currentHome, petId: p.id });
                          }
                        }
                      }}
                      animate={isDancing && isFocused ? {
                        scale: [1, 1.25, 0.9, 1.18, 1],
                        rotate: [0, 18, -18, 6, 0],
                        y: [0, -30, 12, -6, 0]
                      } : isFocused && petState === "sleeping" ? {
                        y: [0, -3, 0],
                        rotate: [18, 20, 16, 18] // Comfortable sleep tilt
                      } : isFocused && petState === "sitting" ? {
                        y: [0, -2, 0],
                        scale: 0.96, // Comfy squish
                        rotate: [0, 1, -1, 0]
                      } : {
                        y: [0, -7, 0],
                        rotate: [0, 0.6, -0.6, 0]
                      }}
                      transition={isDancing && isFocused ? {
                        duration: 0.85,
                        ease: "easeInOut"
                      } : isFocused && petState === "sleeping" ? {
                        duration: 5.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      } : {
                        duration: 4.8 + (idx * 0.4),
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <svg
                        width="115"
                        height="115"
                        viewBox="0 0 100 100"
                        className="filter drop-shadow-[0_8px_18px_rgba(255,121,156,0.35)] overflow-visible"
                      >
                        <defs>
                          <filter id="puffyCottonStar" x="-30%" y="-30%" width="160%" height="160%">
                            <feTurbulence type="fractalNoise" baseFrequency="0.18" numOctaves="4" result="noise" />
                            <feDisplacementMap in="SourceGraphic" in2="noise" scale="9.0" xChannelSelector="R" yChannelSelector="G" />
                          </filter>

                          <linearGradient id="compStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FFF2F5" />
                            <stop offset="50%" stopColor="#FFCCDD" />
                            <stop offset="100%" stopColor="#FF799C" />
                          </linearGradient>

                          <linearGradient id="compPigGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FFF5F7" />
                            <stop offset="50%" stopColor="#FFAEC9" />
                            <stop offset="100%" stopColor="#FF799C" />
                          </linearGradient>

                          <linearGradient id="compDogGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FFFBF5" />
                            <stop offset="50%" stopColor="#F5D2B3" />
                            <stop offset="100%" stopColor="#D4A373" />
                          </linearGradient>
                        </defs>

                        {p.customSkin ? (
                          <image
                            href={p.customSkin}
                            x="0"
                            y="0"
                            width="100"
                            height="100"
                            filter="url(#puffyCottonStar)"
                          />
                        ) : (
                          <>
                            {p.species === "star" && (
                              <>
                                <path
                                  d="M 50 5 L 63 37 L 97 37 L 70 58 L 81 92 L 50 72 L 19 92 L 30 58 L 3 37 L 37 37 Z"
                                  fill="url(#compStarGrad)"
                                  filter="url(#puffyCottonStar)"
                                  stroke="#FFF"
                                  strokeWidth="2.5"
                                  strokeLinejoin="round"
                                />
                                <circle cx="50" cy="48" r="16" fill="rgba(255, 255, 255, 0.45)" filter="blur(6px)" pointerEvents="none" />
                                <g>
                                  <path d="M 28 30 Q 23 25 28 20 Q 33 25 28 30 Z" fill="#FF799C" stroke="#FFF" strokeWidth="1" />
                                  <path d="M 28 30 Q 33 35 28 40 Q 23 35 28 30 Z" fill="#FF799C" stroke="#FFF" strokeWidth="1" />
                                  <circle cx="28" cy="30" r="2.5" fill="#FFCCDD" stroke="#FFF" strokeWidth="0.8" />
                                </g>
                              </>
                            )}

                            {p.species === "pig" && (
                              <>
                                <ellipse cx="50" cy="55" rx="38" ry="32" fill="url(#compPigGrad)" filter="url(#puffyCottonStar)" stroke="#FFF" strokeWidth="2.5" />
                                <circle cx="50" cy="50" r="18" fill="rgba(255, 255, 255, 0.45)" filter="blur(6px)" pointerEvents="none" />
                                <path d="M 20 32 Q 5 15 15 10 Q 25 15 22 30" fill="#FF9EBA" stroke="#FFF" strokeWidth="1.5" strokeLinejoin="round" />
                                <path d="M 80 32 Q 95 15 85 10 Q 75 15 78 30" fill="#FF9EBA" stroke="#FFF" strokeWidth="1.5" strokeLinejoin="round" />
                                <rect x="38" y="56" width="24" height="15" rx="7" fill="#FF8EA9" stroke="#FFF" strokeWidth="1.5" />
                                <ellipse cx="45" cy="63" rx="2.2" ry="3.5" fill="#6E4B55" />
                                <ellipse cx="55" cy="63" rx="2.2" ry="3.5" fill="#6E4B55" />
                                <g transform="translate(58, -12)">
                                  <path d="M 20 30 Q 15 25 20 20 Q 25 25 20 30 Z" fill="#FF799C" stroke="#FFF" strokeWidth="1" />
                                  <path d="M 20 30 Q 25 35 20 40 Q 15 35 20 30 Z" fill="#FF799C" stroke="#FFF" strokeWidth="1" />
                                  <circle cx="20" cy="30" r="2.5" fill="#FFCCDD" stroke="#FFF" strokeWidth="0.8" />
                                </g>
                              </>
                            )}

                            {p.species === "dog" && (
                              <>
                                <ellipse cx="50" cy="55" rx="36" ry="32" fill="url(#compDogGrad)" filter="url(#puffyCottonStar)" stroke="#FFF" strokeWidth="2.5" />
                                <circle cx="50" cy="50" r="18" fill="rgba(255, 255, 255, 0.45)" filter="blur(6px)" pointerEvents="none" />
                                <path d="M 16 35 C 8 30 4 55 12 65 C 20 75 22 50 18 35 Z" fill="#A77443" stroke="#FFF" strokeWidth="1.5" />
                                <path d="M 84 35 C 92 30 96 55 88 65 C 80 75 78 50 82 35 Z" fill="#A77443" stroke="#FFF" strokeWidth="1.5" />
                                <ellipse cx="50" cy="62" rx="14" ry="10" fill="#FFF" opacity="0.8" />
                                <path d="M 46 56 Q 50 53 54 56 Q 54 59 50 62 Q 46 59 46 56 Z" fill="#4E3629" />
                                {(isFocused && (expression === "happy" || expression === "glow")) && (
                                  <path d="M 47 67 Q 50 78 53 67 Z" fill="#FF799C" stroke="#FFF" strokeWidth="0.8" />
                                )}
                              </>
                            )}

                            {/* Shared Face Features */}
                            <ellipse cx="36" cy="52" rx="5" ry="3" fill="#FF799C" opacity="0.6" />
                            <ellipse cx="64" cy="52" rx="5" ry="3" fill="#FF799C" opacity="0.6" />

                            <g transform="translate(0, 0)">
                              {displayState === "sleeping" || displayExpr === "blink" ? (
                                <>
                                  <path d="M 38 46 Q 42 50 46 46" stroke="#6E4B55" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                                  <path d="M 54 46 Q 58 50 62 46" stroke="#6E4B55" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                                </>
                              ) : displayExpr === "happy" ? (
                                <>
                                  <circle cx="41" cy="48" r="3.5" fill="#6E4B55" />
                                  <circle cx="59" cy="48" r="3.5" fill="#6E4B55" />
                                  <circle cx="39.5" cy="46" r="1.2" fill="#FFF" />
                                  <circle cx="57.5" cy="46" r="1.2" fill="#FFF" />
                                </>
                              ) : displayExpr === "shy" ? (
                                <>
                                  <circle cx="41" cy="47" r="2.5" fill="#6E4B55" />
                                  <circle cx="59" cy="47" r="2.5" fill="#6E4B55" />
                                </>
                              ) : (
                                <>
                                  <path d="M 37 47 L 43 47 M 40 44 L 40 50" stroke="#6E4B55" strokeWidth="2.5" strokeLinecap="round" />
                                  <path d="M 57 47 L 63 47 M 60 44 L 60 50" stroke="#6E4B55" strokeWidth="2.5" strokeLinecap="round" />
                                </>
                              )}

                              {displayState === "sleeping" ? (
                                <path d="M 48 53 Q 50 51 52 53" stroke="#6E4B55" strokeWidth="2" strokeLinecap="round" fill="none" />
                              ) : displayExpr === "happy" || displayExpr === "glow" ? (
                                <path d="M 46 54 Q 50 58 54 54" stroke="#6E4B55" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                              ) : (
                                <path d="M 47 54 Q 50 56 53 54" stroke="#6E4B55" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                              )}
                            </g>
                          </>
                        )}
                      </svg>
                      
                      {isFocused && (
                        <>
                          <div className="absolute top-2 left-6 text-yellow-300 text-sm animate-pulse">⭐</div>
                          <div className="absolute bottom-6 right-3 text-pink-400 text-sm animate-ping">✨</div>
                        </>
                      )}
                    </motion.div>
                  </div>
                );
              })
            ) : (
              // ORIGINAL FALLBACK SINGLE PET VIEW (For friends or co-parenting room view)
              <div 
                className="z-20 transition-all duration-700 ease-out"
                style={
                  petState === "sitting" && currentFurnitureList.find((f: any) => f.id === "sofa")
                    ? {
                        position: "absolute",
                        left: ((currentFurnitureList.find((f: any) => f.id === "sofa")?.x ?? 190) - 35) + "px",
                        top: ((currentFurnitureList.find((f: any) => f.id === "sofa")?.y ?? 160) - 45) + "px",
                        transform: "none",
                      }
                    : petState === "sleeping" && currentFurnitureList.find((f: any) => f.id === "bed")
                    ? {
                        position: "absolute",
                        left: ((currentFurnitureList.find((f: any) => f.id === "bed")?.x ?? 20) - 35) + "px",
                        top: ((currentFurnitureList.find((f: any) => f.id === "bed")?.y ?? 150) - 35) + "px",
                        transform: "none",
                      }
                    : {
                        position: "absolute",
                        bottom: "20px",
                        left: "50%",
                        transform: "translateX(-50%)",
                      }
                }
              >
                {/* Feeding floating food items indicator */}
                <AnimatePresence>
                  {feedEffect && (
                    <motion.div
                      initial={{ scale: 0.5, y: 35, opacity: 0 }}
                      animate={{ scale: [1, 1.5, 0.9], y: [10, -40, -80], opacity: [0, 1, 1, 0] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.3, ease: "easeOut" }}
                      className="absolute text-4xl z-30 left-7 top-[-35px] filter drop-shadow-md"
                    >
                      {feedEffect}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Floating sleep Zzz letters if sleeping */}
                {petState === "sleeping" && (
                  <div className="absolute top-[-30px] right-[-10px] z-30 flex flex-col pointer-events-none select-none">
                    <motion.span 
                      animate={{ y: [-5, -25], x: [0, 8, 0], opacity: [0, 1, 0], scale: [0.8, 1.2, 0.9] }} 
                      transition={{ repeat: Infinity, duration: 2, delay: 0 }}
                      className="text-xs font-bold text-[#FF799C]"
                    >
                      z
                    </motion.span>
                    <motion.span 
                      animate={{ y: [-5, -25], x: [0, -6, 0], opacity: [0, 1, 0], scale: [0.8, 1.3, 0.9] }} 
                      transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}
                      className="text-sm font-bold text-[#FF799C]/80 ml-2"
                    >
                      Z
                    </motion.span>
                    <motion.span 
                      animate={{ y: [-5, -25], x: [0, 10, 0], opacity: [0, 1, 0], scale: [0.8, 1.4, 0.9] }} 
                      transition={{ repeat: Infinity, duration: 2, delay: 1.2 }}
                      className="text-md font-bold text-[#FF799C]/60 ml-4"
                    >
                      Z
                    </motion.span>
                  </div>
                )}

                {/* Halo background light glow */}
                <div className="absolute inset-0 m-auto h-24 w-24 rounded-full bg-gradient-to-tr from-[#FF799C]/20 to-[#FFD5E0]/45 blur-xl pointer-events-none" />

                {/* Main star with dynamic animation */}
                <motion.div
                  className="relative flex items-center justify-center cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStarClick();
                  }}
                  animate={isDancing ? {
                    scale: [1, 1.25, 0.9, 1.18, 1],
                    rotate: [0, 18, -18, 6, 0],
                    y: [0, -30, 12, -6, 0]
                  } : petState === "sleeping" ? {
                    y: [0, -3, 0],
                    rotate: [18, 20, 16, 18] // Comfortable sleep tilt
                  } : petState === "sitting" ? {
                    y: [0, -2, 0],
                    scale: 0.96, // Comfy squish
                    rotate: [0, 1, -1, 0]
                  } : {
                    y: [0, -7, 0],
                    rotate: [0, 0.6, -0.6, 0]
                  }}
                  transition={isDancing ? {
                    duration: 0.85,
                    ease: "easeInOut"
                  } : petState === "sleeping" ? {
                    duration: 5.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  } : {
                    duration: 4.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <svg
                    width="135"
                    height="135"
                    viewBox="0 0 100 100"
                    className="filter drop-shadow-[0_8px_18px_rgba(255,121,156,0.35)] overflow-visible"
                  >
                    {currentCustomSkin ? (
                      <image
                        href={currentCustomSkin}
                        x="0"
                        y="0"
                        width="100"
                        height="100"
                        filter="url(#puffyCottonStar)"
                      />
                    ) : (
                      <>
                        <path
                          d="M 50 5 L 63 37 L 97 37 L 70 58 L 81 92 L 50 72 L 19 92 L 30 58 L 3 37 L 37 37 Z"
                          fill="url(#compStarGrad)"
                          filter="url(#puffyCottonStar)"
                          stroke="#FFF"
                          strokeWidth="2.5"
                          strokeLinejoin="round"
                        />
                        <circle cx="50" cy="48" r="16" fill="rgba(255, 255, 255, 0.45)" filter="blur(6px)" pointerEvents="none" />
                        <g>
                          <path d="M 28 30 Q 23 25 28 20 Q 33 25 28 30 Z" fill="#FF799C" stroke="#FFF" strokeWidth="1" />
                          <path d="M 28 30 Q 33 35 28 40 Q 23 35 28 30 Z" fill="#FF799C" stroke="#FFF" strokeWidth="1" />
                          <circle cx="28" cy="30" r="2.5" fill="#FFCCDD" stroke="#FFF" strokeWidth="0.8" />
                        </g>

                        <ellipse cx="36" cy="54" rx="5" ry="3" fill="#FF799C" opacity="0.6" />
                        <ellipse cx="64" cy="54" rx="5" ry="3" fill="#FF799C" opacity="0.6" />

                        <g transform="translate(0, 0)">
                          {petState === "sleeping" || expression === "blink" ? (
                            <>
                              <path d="M 38 46 Q 42 50 46 46" stroke="#6E4B55" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                              <path d="M 54 46 Q 58 50 62 46" stroke="#6E4B55" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                            </>
                          ) : expression === "happy" ? (
                            <>
                              <circle cx="41" cy="48" r="3.5" fill="#6E4B55" />
                              <circle cx="59" cy="48" r="3.5" fill="#6E4B55" />
                              <circle cx="39.5" cy="46" r="1.2" fill="#FFF" />
                              <circle cx="57.5" cy="46" r="1.2" fill="white" />
                            </>
                          ) : expression === "shy" ? (
                            <>
                              <circle cx="41" cy="47" r="2.5" fill="#6E4B55" />
                              <circle cx="59" cy="47" r="2.5" fill="#6E4B55" />
                            </>
                          ) : (
                            <>
                              <path d="M 37 47 L 43 47 M 40 44 L 40 50" stroke="#6E4B55" strokeWidth="2.5" strokeLinecap="round" />
                              <path d="M 57 47 L 63 47 M 60 44 L 60 50" stroke="#6E4B55" strokeWidth="2.5" strokeLinecap="round" />
                            </>
                          )}

                          {petState === "sleeping" ? (
                            <path d="M 48 53 Q 50 51 52 53" stroke="#6E4B55" strokeWidth="2" strokeLinecap="round" fill="none" />
                          ) : expression === "happy" || expression === "glow" ? (
                            <path d="M 46 54 Q 50 58 54 54" stroke="#6E4B55" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                          ) : (
                            <path d="M 47 54 Q 50 56 53 54" stroke="#6E4B55" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                          )}
                        </g>
                      </>
                    )}
                  </svg>

                  <div className="absolute top-2 left-6 text-yellow-300 text-sm animate-pulse">⭐</div>
                  <div className="absolute bottom-6 right-3 text-pink-400 text-sm animate-ping">✨</div>
                </motion.div>
              </div>
            )}
          </div>

          {/* Guide hint info */}
          <div className="w-full text-left mt-2 flex items-start gap-1.5 bg-[#FF799C]/5 border border-[#FF799C]/10 rounded-xl p-2.5">
            <HelpCircle className="h-4 w-4 text-[#FF799C] shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#6E4B55]/75 leading-relaxed">
              <b>互動引導</b>：點擊房間內的 <b>[草莓波點冰箱] 🧊</b> 可開啟食物倉庫。您可以使用星星幣 🪙 採購「星願棉花糖」、「蜜桃流星果汁」等，並直接餵食小星寵，餵食將增加飽食度與幸福指數喔！
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: COPARENT CONTROL PANEL AND FRIENDS (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 text-left">
          
          {/* 🏡 CUTE STAR PET HOME CONSOLE (Single and Coparent modes) */}
          {(activeTab === "single" || activeTab === "coparent") && (
            <div className="bg-gradient-to-br from-[#FFF5F7] to-white border-2 border-[#FF799C]/20 rounded-3xl p-4 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2.5 border-b border-[#FF799C]/10">
                <h3 className="text-sm font-bold text-[#6E4B55] flex items-center gap-1.5">
                  <span className="text-lg">🏡</span>
                  <span>星寵專屬家園控制台</span>
                </h3>
                <span className="text-[10px] bg-[#FF799C] text-white px-2.5 py-0.5 rounded-full font-bold">
                  {getActivePetsList().length} 隻星寵
                </span>
              </div>

              {/* 1. HOME SWITCHER */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#6E4B55]/80 flex items-center gap-1">
                  <span>🗺️ 切換拜訪家園 :</span>
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["home_star", "home_pig", "home_dog"] as const).map((homeId) => {
                    const isSelected = getEffectiveHomeId() === homeId;
                    const residents = getActivePetsList().filter((p) => p.currentHome === homeId);
                    return (
                      <button
                        key={homeId}
                        onClick={() => {
                          if (activeTab === "single") {
                            setCurrentHomeId(homeId);
                            // Automatically set focus on the first resident pet of this home if available
                            if (residents.length > 0) {
                              selectFocusedPet(residents[0].id);
                            } else {
                              // Find any pet of this species, or fallback
                              const matches = pets.find((p) => {
                                if (homeId === "home_star") return p.species === "star";
                                if (homeId === "home_pig") return p.species === "pig";
                                if (homeId === "home_dog") return p.species === "dog";
                                return false;
                              });
                              if (matches) {
                                selectFocusedPet(matches.id);
                              }
                            }
                            setBubbleText(`✨ 傳送到「${getHomeName(homeId)}」！來照顧這裡的小可愛吧！💖`);
                          } else if (activeTab === "coparent") {
                            let targetPetId = "star";
                            if (residents.length > 0) {
                              targetPetId = residents[0].id;
                            } else {
                              const matches = getActivePetsList().find((p) => {
                                if (homeId === "home_star") return p.species === "star";
                                if (homeId === "home_pig") return p.species === "pig";
                                if (homeId === "home_dog") return p.species === "dog";
                                return false;
                              });
                              if (matches) targetPetId = matches.id;
                            }
                            executeCoparentAction("switch-home-and-focus", { homeId, petId: targetPetId });
                          }
                        }}
                        className={`py-2 px-1 rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#FFF0F3] border-[#FF799C] text-[#FF799C] shadow-xs"
                            : "bg-white border-gray-100 hover:border-[#FF799C]/30 text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <span className="text-md">
                          {homeId === "home_star" ? "🌌" : homeId === "home_pig" ? "🍓" : "🐾"}
                        </span>
                        <span className="scale-90 font-sans tracking-tight">
                          {homeId === "home_star" ? "星空房" : homeId === "home_pig" ? "甜心房" : "萌犬房"}
                        </span>
                        <span className={`text-[8px] px-1 rounded-full ${
                          residents.length > 0 ? "bg-[#FF799C]/10 text-[#FF799C]" : "bg-gray-100 text-gray-400"
                        }`}>
                          {residents.length > 0 ? `${residents.length} 隻` : "閒置"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. HATCHING STAR EGG */}
              <div className="bg-[#FFF8F9] border border-[#FF799C]/10 rounded-2xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-3xl select-none animate-bounce duration-1000">🥚</span>
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-[#6E4B55]">孵化星星蛋</span>
                    <span className="text-[9px] text-gray-400 font-sans">
                      隨機孵化出小蜜豬 🐷 或小奶犬 🐶
                    </span>
                    <span className="text-[10px] text-[#FF799C] font-black font-mono flex items-center gap-0.5 mt-0.5">
                      🪙 200 星星幣 / 顆
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleHatchEgg}
                  className="bg-[#FF799C] hover:bg-[#FF799C]/90 text-white rounded-xl py-2 px-3 text-[10.5px] font-black tracking-wider transition-all active:scale-95 shadow-xs cursor-pointer shrink-0"
                >
                  ✨ 購買並孵化
                </button>
              </div>

              {/* 3. CO-HABITATION AND PET TRANSFER */}
              <div className="space-y-2 pt-1 border-t border-[#FF799C]/5">
                <span className="text-[11px] font-bold text-[#6E4B55]/80 flex items-center gap-1">
                  <span>🚚 寵物居住地調整與召喚 :</span>
                </span>
                <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                  {getActivePetsList().map((p) => {
                    const isCurrentHome = p.currentHome === getEffectiveHomeId();
                    const defaultHome = p.species === "star" ? "home_star" : p.species === "pig" ? "home_pig" : "home_dog";
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (activeTab === "single") {
                            selectFocusedPet(p.id);
                          } else if (activeTab === "coparent") {
                            executeCoparentAction("switch-home-and-focus", { homeId: p.currentHome, petId: p.id });
                          }
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl border transition-all text-left cursor-pointer ${
                          getEffectiveFocusedPetId() === p.id
                            ? "bg-[#FFF0F3]/45 border-[#FF799C]/25 shadow-xs"
                            : "bg-white/80 border-gray-100 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl select-none">
                            {p.species === "star" ? "🌟" : p.species === "pig" ? "🐷" : "🐶"}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-[#6E4B55] flex items-center gap-1">
                              {p.name}
                              <span className="text-[8px] bg-amber-100 text-amber-700 px-1 rounded-full font-mono">
                                Lvl {p.level || 1}
                              </span>
                            </span>
                            <span className="text-[8px] text-gray-400 font-sans leading-none mt-0.5">
                              居住：{getHomeName(p.currentHome)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* If not in current home, show Summon button */}
                          {!isCurrentHome ? (
                            <button
                              onClick={() => movePetToHome(p.id, getEffectiveHomeId() as any)}
                              className="bg-[#FFF4F6] hover:bg-[#FFE0E6] text-[#FF799C] border border-[#FF799C]/15 rounded-lg py-1 px-2 text-[9px] font-bold transition-all active:scale-95 cursor-pointer"
                              title="將牠召喚到當前房間一起合養"
                            >
                              🚚 召喚至此房
                            </button>
                          ) : (
                            <div className="flex gap-1">
                              {/* If in current home, show dropdown/transfer buttons */}
                              {(["home_star", "home_pig", "home_dog"] as const)
                                .filter((h) => h !== getEffectiveHomeId())
                                .map((h) => (
                                  <button
                                    key={h}
                                    onClick={() => movePetToHome(p.id, h)}
                                    className="bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 border border-gray-100 rounded-lg py-1 px-1.5 text-[8.5px] font-bold transition-all active:scale-95 cursor-pointer"
                                    title={`移居至 ${getHomeName(h)}`}
                                  >
                                    移至 {h === "home_star" ? "🌌" : h === "home_pig" ? "🍓" : "🐾"}
                                  </button>
                                ))}
                            </div>
                          )}

                          {/* Quick return shortcut if not in default home */}
                          {p.currentHome !== defaultHome && (
                            <button
                              onClick={() => movePetToHome(p.id, defaultHome as any)}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/50 rounded-lg py-1 px-1.5 text-[8.5px] font-bold transition-all active:scale-95 cursor-pointer"
                              title="回原生家園"
                            >
                              🏠 歸位
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          {/* STATS PANEL */}
          <div className="bg-white/60 border border-[#FF799C]/15 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-[#6E4B55] flex items-center justify-between">
              <span>📊 星寵狀態面板</span>
              <span className="text-[11px] font-mono text-[#FF799C] font-bold flex items-center gap-1">
                <Coins className="h-3.5 w-3.5" /> {activeTab === "single" ? "持有的星星幣" : "共享家庭幣"}: {currentCoins} 🪙
              </span>
            </h3>

            {/* Affection Level */}
            <div>
              <div className="flex justify-between text-[10px] text-[#6E4B55]/80 mb-1 font-mono">
                <span>💖 幸福指數 / 親密度</span>
                <span className="font-bold">{currentLove}%</span>
              </div>
              <div className="w-full bg-[#FFF6F2] h-2.5 rounded-full overflow-hidden border border-[#FF799C]/10">
                <motion.div
                  className="bg-gradient-to-r from-[#FF799C] to-[#FFCCDD] h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${currentLove}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Hunger Level */}
            <div>
              <div className="flex justify-between text-[10px] text-[#6E4B55]/80 mb-1 font-mono">
                <span>🍔 飽腹飽食度</span>
                <span className="font-bold">{currentFullness}%</span>
              </div>
              <div className="w-full bg-[#FFF6F2] h-2.5 rounded-full overflow-hidden border border-[#FF799C]/10">
                <motion.div
                  className="bg-gradient-to-r from-[#FF9881] to-[#FFD0A1] h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${currentFullness}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Custom Drawing Skin Action */}
            <div className="pt-2 border-t border-[#FF799C]/10 flex gap-2">
              <button
                onClick={() => setIsCanvasOpen(true)}
                className="flex-1 bg-[#FF799C] hover:bg-[#FF799C]/90 text-white rounded-xl py-2 px-3 text-xs font-semibold tracking-wide transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                title="為寵物繪製個性外觀"
              >
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                <span>🎨 繪製寵物外觀</span>
              </button>
              {currentCustomSkin && (
                <button
                  onClick={() => {
                    if (confirm("確定要清除自定義繪製外觀並還原成經典樣貌嗎？")) {
                      handleClearCustomSkin();
                    }
                  }}
                  className="bg-[#FFF0F3] hover:bg-[#FFE0E6] border border-[#FF799C]/20 text-[#FF799C] rounded-xl py-2 px-3 text-xs font-medium transition-all active:scale-95 cursor-pointer shrink-0"
                  title="還原為原始模樣"
                >
                  還原
                </button>
              )}
            </div>
          </div>

          {/* CO-PARENTING / GUARDIANS LIST PANEL */}
          {(activeTab === "coparent" || activeTab === "friend") && (
            <div className="bg-[#FFF4F7]/90 border border-[#FF799C]/20 rounded-2xl p-4 space-y-2.5">
              <h3 className="text-xs font-bold text-[#FF799C] flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>👥 {activeTab === "coparent" ? "共同飼養星家守護成員" : "本家園共同飼養與守護成員"}</span>
              </h3>
              <div className="flex gap-2 flex-wrap pt-0.5">
                {(activeTab === "coparent" ? activeGroupMembers : visitedGroupMembers).length > 0 ? (
                  (activeTab === "coparent" ? activeGroupMembers : visitedGroupMembers).map((m: any) => (
                    <div key={m.id} className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-[#FF799C]/10 shadow-sm">
                      <img src={m.avatar || undefined} alt={m.username} className="w-5 h-5 rounded-full border border-[#FF799C]/10 shrink-0" referrerPolicy="no-referrer" />
                      <div className="flex flex-col text-left">
                        <span className="text-[9.5px] text-gray-700 font-bold leading-tight">{m.username}</span>
                        <span className="text-[7.5px] text-gray-400 font-mono leading-none">ID: {m.id}</span>
                      </div>
                      {m.id === (activeTab === "coparent" ? activeGroup?.creatorId : (selectedVisitedGroup?.creatorId || visitingFriend?.id)) && (
                        <span className="text-[7.5px] bg-[#FF799C] text-white px-1.5 py-0.2 rounded-full font-bold scale-90">家長</span>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-[10px] text-gray-400 italic">載入成員清單中...</span>
                )}
              </div>
            </div>
          )}



          {/* DRAGGABLE FURNITURE WINDOW */}
          <div className="bg-white/60 border border-[#FF799C]/15 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-1.5">
              <h3 className="text-xs font-bold text-[#6E4B55]">🌸 粉紅家具展櫥 (點擊可放置)</h3>
              {selectedFurnitureId && (
                <button
                  onClick={() => setSelectedFurnitureId(null)}
                  className="text-[9px] text-[#FF799C] hover:underline cursor-pointer"
                >
                  取消選取
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
              {currentFurnitureList.map((item: any) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setSelectedFurnitureId(item.id);
                    if (item.id === "bed") {
                      setPetState("sleeping");
                      setBubbleText(`${currentPetName} 躺在軟綿綿的草莓棉花糖大床上，正甜甜地睡著呢... 🐑 zZZ (點擊寵物可喚醒)`);
                    } else if (item.id === "sofa") {
                      setPetState("sitting");
                      setBubbleText(`${currentPetName} 舒服地坐在蜜桃雲朵沙發上，晃晃小腿感覺超級愜意！🌸 (點擊寵物可站立)`);
                    } else if (item.id === "fridge") {
                      setIsFridgeOpen(true);
                      setFridgeMessage(`🍰 歡迎光臨草莓波點冰箱！點擊食物餵食 ${currentPetName}，或是採購更多美味吧！`);
                    }
                  }}
                  className={`border text-left p-2 rounded-xl transition-all active:scale-95 flex items-center gap-2 cursor-pointer bg-white ${selectedFurnitureId === item.id ? "border-[#FF799C] bg-[#FFF2F5] shadow-sm shadow-[#FF799C]/10" : "border-[#FF799C]/10 hover:bg-[#FFF6F2]"}`}
                >
                  <div className="w-10 h-10 shrink-0 bg-[#FF799C]/5 rounded-lg flex items-center justify-center border border-[#FF799C]/10">
                    {FURNITURE_SVGS[item.id] || <span>🧸</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[10px] font-bold text-[#6E4B55] truncate">{item.name}</h4>
                    <span className="text-[8px] text-[#6E4B55]/60 block truncate leading-tight">{item.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* MODE SPECIFIC SOCIAL MODULES: ONLY VISIBLE IF COPARENT MODE */}
          {activeTab === "coparent" && (
            <div className="space-y-4">
              
              {/* GROUP SELECTOR & CREATOR */}
              <div className="bg-[#FFF4F7]/85 border border-[#FF799C]/20 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-[#FF799C] flex items-center gap-1">
                    <Users className="h-4 w-4" /> 共同飼養家庭選擇
                  </h3>
                  <button
                    onClick={() => setIsCreatingGroup(!isCreatingGroup)}
                    className="text-[10px] text-white bg-[#FF799C] hover:bg-[#FF799C]/90 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> 創建新小屋
                  </button>
                </div>

                {isCreatingGroup ? (
                  <div className="bg-white p-3 rounded-xl border border-[#FF799C]/15 space-y-2.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6E4B55] mb-1">🏡 小屋名稱：</label>
                      <input
                        type="text"
                        placeholder="例如：我們的粉萌小家 🌸"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="w-full bg-white border border-[#FF799C]/20 rounded-lg p-1.5 focus:outline-none focus:border-[#FF799C] text-[#6E4B55]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#6E4B55] mb-1">👥 選擇合養的好友 (2~6人)：</label>
                      {friends.length === 0 ? (
                        <p className="text-[9px] text-amber-600">目前還沒有好友，請在下方新增好友喔！</p>
                      ) : (
                        <div className="space-y-1 max-h-[80px] overflow-y-auto pr-1">
                          {friends.map(friend => (
                            <label key={friend.id} className="flex items-center gap-2 cursor-pointer p-0.5">
                              <input
                                type="checkbox"
                                checked={selectedFriendsForGroup.includes(friend.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedFriendsForGroup(prev => [...prev, friend.id]);
                                  } else {
                                    setSelectedFriendsForGroup(prev => prev.filter(id => id !== friend.id));
                                  }
                                }}
                                className="rounded border-gray-300 text-[#FF799C] focus:ring-[#FF799C]"
                              />
                              <span className="text-[10px] text-[#6E4B55]">{friend.username}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setIsCreatingGroup(false)}
                        className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleCreateGroup}
                        className="bg-[#FF799C] text-white px-3 py-1 rounded-lg hover:bg-[#FF799C]/90"
                      >
                        確認建立
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {coparentGroups.length === 0 ? (
                      <p className="text-[10px] text-gray-500 leading-normal">
                        你目前還沒有共同飼養小組。點擊右上角「創建新小屋」拉上你的好友（2～6人）一起養星寵吧！🌸
                      </p>
                    ) : (
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {coparentGroups.map(group => (
                          <button
                            key={group.id}
                            onClick={() => setActiveGroup(group)}
                            className={`px-3 py-2 rounded-xl text-[11px] font-bold border shrink-0 transition-all ${activeGroup?.id === group.id ? "bg-[#FF799C] text-white border-[#FF799C] shadow-sm" : "bg-white text-[#6E4B55] border-[#FF799C]/15 hover:bg-[#FFF4F7]"}`}
                          >
                            🏡 {group.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* HOURLY PHOTO SHARING TASK & FEED */}
              {activeGroup && (
                <div className="bg-white/60 border border-[#FF799C]/15 rounded-2xl p-4 space-y-3.5">
                  <div className="flex justify-between items-center border-b border-[#FF799C]/10 pb-2">
                    <h3 className="text-xs font-bold text-[#6E4B55] flex items-center gap-1.5">
                      <Camera className="text-[#FF799C] h-4.5 w-4.5" /> 📸 共同家園專屬拍立得牆
                    </h3>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        setSelectedFriendForSnap({
                          id: `group_${activeGroup.id}`,
                          username: activeGroup.name
                        });
                        setSnapCaption("");
                        setUploadedSnapBase64("");
                        setSnapMessage("");
                        setSnapError("");
                      }}
                      className="w-full py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm bg-gradient-to-r from-purple-500 to-[#FF799C] text-white hover:opacity-95 active:scale-95 cursor-pointer"
                    >
                      <Camera className="h-4 w-4" /> 拍攝拍立得相片發布至本房間 📸
                    </button>
                  </div>

                  {/* PHOTO FEED ALBUM */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-[#6E4B55] flex items-center gap-1">
                      <span>📸 共同飼養相片動態牆 ({activeGroup.photos?.length || 0})</span>
                    </h4>
                    
                    <div className="flex gap-3 overflow-x-auto pb-2 pt-1 max-w-full">
                      {activeGroup.photos && activeGroup.photos.length > 0 ? (
                        activeGroup.photos.map((p: any) => (
                          <div key={p.id} className="bg-white p-2 rounded-xl border border-[#FF799C]/10 shadow-sm shrink-0 w-[140px] text-center">
                            <div className="h-20 w-full overflow-hidden rounded-lg bg-gray-50 border border-gray-100">
                              <img src={p.imageUrl || p.image_url || undefined} alt="Shared snap" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <p className="text-[10px] font-bold text-[#FF799C] truncate mt-1.5">{p.senderName || p.username || "家長"}</p>
                            <p className="text-[8px] text-gray-500 truncate">{p.caption}</p>
                            <span className="text-[7px] text-gray-400 block mt-0.5 leading-none">
                              {new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[9px] text-gray-400 italic">目前房間照片牆空空如也，快點擊上方按鈕記錄下萌星的第一張照片吧！🌸</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* FRIEND SYSTEM MANAGER */}
              <div className="bg-white/60 border border-[#FF799C]/15 rounded-2xl p-4 space-y-3">
                {/* 🔔 通知與邀請中心 🔔 */}
                {(friendRequests.length > 0 || coparentInvitations.length > 0) && (
                  <div className="bg-gradient-to-br from-pink-50 to-[#FFF0F3] border-2 border-[#FF799C]/25 rounded-2xl p-4 space-y-3 shadow-sm animate-pulse mb-2 text-left">
                    <h3 className="text-xs font-bold text-[#FF799C] flex items-center gap-1.5">
                      <Bell className="h-4.5 w-4.5 text-[#FF799C]" />
                      <span>🔔 萌友通知中心 ({friendRequests.length + coparentInvitations.length})</span>
                    </h3>
                    
                    {/* Friend Requests */}
                    {friendRequests.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-500">👋 好友添加請求：</p>
                        <div className="space-y-1.5">
                          {friendRequests.map((req: any) => (
                            <div key={req.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-[#FF799C]/15 shadow-sm gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <img src={req.sender_avatar || undefined} alt="Avatar" className="w-6 h-6 rounded-full border border-[#FF799C]/10 shrink-0" referrerPolicy="no-referrer" />
                                <span className="text-[10px] text-gray-700 font-bold truncate">{req.sender_username} 邀請您加為好友 🌸</span>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleRespondFriendRequest(req.id, "accept")}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-[8px] font-bold px-2.5 py-1 rounded-lg transition-all active:scale-95 cursor-pointer"
                                >
                                  同意
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRespondFriendRequest(req.id, "decline")}
                                  className="bg-gray-400 hover:bg-gray-500 text-white text-[8px] font-bold px-2.5 py-1 rounded-lg transition-all active:scale-95 cursor-pointer"
                                >
                                  拒絕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Co-parenting Invitations */}
                    {coparentInvitations.length > 0 && (
                      <div className={`space-y-2 ${friendRequests.length > 0 ? "pt-2.5 border-t border-[#FF799C]/10" : ""}`}>
                        <p className="text-[10px] font-bold text-gray-500">🏡 共同飼養邀請：</p>
                        <div className="space-y-1.5">
                          {coparentInvitations.map((inv: any) => (
                            <div key={inv.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-[#FF799C]/15 shadow-sm gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <img src={inv.sender_avatar || undefined} alt="Avatar" className="w-6 h-6 rounded-full border border-[#FF799C]/10 shrink-0" referrerPolicy="no-referrer" />
                                <div className="flex flex-col text-left min-w-0">
                                  <span className="text-[10px] text-gray-700 font-bold truncate">{inv.sender_username} 邀請您共同飼養 🐾</span>
                                  <span className="text-[8px] text-gray-400 truncate">房間名稱: {inv.room_name}</span>
                                </div>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleRespondCoparentInvitation(inv.id, "accept")}
                                  className="bg-[#FF799C] hover:bg-[#FF799C]/90 text-white text-[8px] font-bold px-2.5 py-1 rounded-lg transition-all active:scale-95 cursor-pointer"
                                >
                                  同意並建立小屋
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRespondCoparentInvitation(inv.id, "decline")}
                                  className="bg-gray-400 hover:bg-gray-500 text-white text-[8px] font-bold px-2.5 py-1 rounded-lg transition-all active:scale-95 cursor-pointer"
                                >
                                  拒絕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <h3 className="text-xs font-bold text-[#6E4B55] flex items-center gap-1">
                  <UserPlus className="h-4.5 w-4.5 text-[#FF799C]" /> 找尋玩家添加好友
                </h3>

                <form onSubmit={handleAddFriend} className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="輸入對方的用戶名 (如: ZackLover)"
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                    className="flex-1 bg-white border border-[#FF799C]/20 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#FF799C] text-[#6E4B55]"
                  />
                  <button
                    type="submit"
                    className="bg-[#FF799C] hover:bg-[#FF799C]/90 text-white px-3 py-1.5 rounded-xl transition-all cursor-pointer text-xs font-bold shrink-0 active:scale-95"
                  >
                    添加
                  </button>
                </form>

                {friendAddStatus.error && (
                  <p className="text-[9px] text-red-500 font-medium">{friendAddStatus.error}</p>
                )}
                {friendAddStatus.message && (
                  <p className="text-[9px] text-emerald-600 font-medium">{friendAddStatus.message}</p>
                )}

                {/* FRIENDS LIST ROW */}
                <div className="space-y-1.5 border-t border-[#FF799C]/10 pt-2.5">
                  <h4 className="text-[10px] font-bold text-gray-500">🌸 我的好友清單 ({friends.length})</h4>
                  {friends.length === 0 ? (
                    <p className="text-[9px] text-gray-400 leading-normal">
                      目前好友列表空空的，請在上方輸入好友的用戶名 (如: ZackLover) 或 Email，點擊「添加」好友，開啟多人共同飼養與拍立得互動吧！🌟
                    </p>
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                      {friends.map(friend => (
                        <div key={friend.id} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-gray-100 shrink-0 shadow-sm">
                          <img src={friend.avatar || undefined} alt="Avatar" className="w-4.5 h-4.5 rounded-full" />
                          <span className="text-[9px] text-gray-600 font-bold">{friend.username}</span>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await fetch("/api/friends/interact", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ userId: currentUser?.id, targetId: friend.id })
                                });
                                const data = await res.json();
                                if (res.ok) {
                                  alert(data.message);
                                } else {
                                  alert(data.error || "互動失敗");
                                }
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="bg-[#FF799C]/10 hover:bg-[#FF799C]/20 text-[#FF799C] text-[8px] font-bold px-1.5 py-0.5 rounded-lg ml-1 shrink-0 transition-all cursor-pointer active:scale-95"
                          >
                            互動 ✦
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFriendForSnap(friend);
                              setSnapCaption("");
                              setUploadedSnapBase64("");
                              setSnapMessage("");
                              setSnapError("");
                            }}
                            className="bg-purple-100 hover:bg-purple-200 text-purple-600 text-[8px] font-bold px-1.5 py-0.5 rounded-lg ml-1 shrink-0 transition-all cursor-pointer active:scale-95 flex items-center gap-0.5"
                          >
                            📷 拍立得
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVisitFriendRoom(friend.id)}
                            className="bg-pink-100 hover:bg-[#FF799C]/20 text-[#FF799C] text-[8px] font-bold px-1.5 py-0.5 rounded-lg ml-1 shrink-0 transition-all cursor-pointer active:scale-95"
                          >
                            參訪 🏡
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* POLAROID ALBUM LOG */}
                {friendSnaps.length > 0 && (
                  <div className="space-y-1.5 border-t border-[#FF799C]/10 pt-2.5">
                    <h4 className="text-[10px] font-bold text-[#FF799C] flex items-center gap-1">
                      <span>📸 拍立得照片牆 (共 {friendSnaps.length} 張)</span>
                    </h4>
                    <div className="flex gap-3 overflow-x-auto pb-2 pt-1 max-w-full">
                      {friendSnaps.map((snap: any) => {
                        const isSent = snap.senderId === currentUser?.id;
                        const isGroup = snap.receiverId?.startsWith("group_");
                        return (
                          <div key={snap.id} className="bg-white p-2 pb-3 rounded-lg border border-gray-100 shadow-md shrink-0 w-[110px] text-center hover:scale-105 hover:rotate-0 transition-all duration-300 transform rotate-[-1deg]">
                            <div className="aspect-square w-full overflow-hidden rounded bg-gray-50 border border-gray-100 relative group">
                              <img src={snap.imageUrl || undefined} alt="Snap" className="h-full w-full object-cover" />
                              <div className="absolute top-1 left-1 bg-white/90 backdrop-blur-xs text-[7px] px-1 py-0.2 rounded font-sans text-[#FF799C]">
                                {isSent ? "📤 已發送" : "📥 已收到"}
                              </div>
                            </div>
                            <p className="text-[9px] font-bold text-[#6E4B55] truncate mt-1">
                              {isGroup ? `🏡 ${snap.receiverName}` : (isSent ? `To: ${snap.receiverName}` : `From: ${snap.senderName}`)}
                            </p>
                            <p className="text-[8px] text-gray-400 truncate italic">"{snap.caption}"</p>
                            <span className="text-[6.5px] text-gray-400 block mt-0.5 font-mono">
                              {new Date(snap.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
      )}

      {/* INSUFFICIENT COINS MODE GUIDE MODAL */}
      <AnimatePresence>
        {showCoinGuideModal && (
          <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[28px] border-4 border-[#FF799C]/40 p-6 max-w-md w-full text-left shadow-2xl relative"
            >
              <button
                onClick={() => setShowCoinGuideModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-[#FF799C] transition-all p-2 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-[#FF799C]/15 pb-3 mb-4">
                <div className="p-2.5 bg-pink-100/60 rounded-full text-pink-500 text-xl animate-bounce">
                  🪙
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#6E4B55]">溫馨提示：星星幣不足</h3>
                  <p className="text-[10px] text-gray-400 font-medium">當前嘗試進行：{coinActionContext}</p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-[#6E4B55]">
                <div className="bg-[#FFF6F8] border border-[#FF799C]/15 p-3 rounded-2xl flex items-center justify-between">
                  <span className="font-bold text-gray-600">您的餘額：</span>
                  <span className="font-black text-[#FF799C] text-sm flex items-center gap-1">
                    {activeTab === "single" ? soloCoins : activeGroup?.star_coins ?? 0} 🪙
                  </span>
                </div>

                <div className="rounded-2xl border-2 border-dashed border-[#FFC2D1] p-4 bg-[#FFFBFB]/50">
                  <h4 className="font-bold text-[#FF5B7E] mb-2 flex items-center gap-1 text-[11px]">
                    ⭐ 快速賺取星星幣攻略：
                  </h4>
                  <ul className="space-y-2.5 text-[10.5px] leading-relaxed">
                    <li className="flex gap-2">
                      <span className="text-base leading-none">📸</span>
                      <div>
                        <strong className="text-[#FF799C] block">每小時傳照打卡任務</strong>
                        在萌星家園右側點擊「傳照片打卡」，每小時成功分享打卡照片，可立即獲得 <strong className="text-pink-600">+50 星星幣</strong>！
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-base leading-none">💖</span>
                      <div>
                        <strong className="text-[#FF799C] block">多與星寵貼貼互動</strong>
                        點擊、輕輕撫摸、拍打或擁抱萌星家園內的小寵物，都會隨機掉落星星幣！
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-base leading-none">👥</span>
                      <div>
                        <strong className="text-[#FF799C] block">添加與拜訪好友</strong>
                        成功添加推薦好友，雙方立即各得 <strong className="text-pink-600">+30 星星幣</strong>。每天去好友小屋探望並陪伴星寵，可額外獲得最高 <strong className="text-pink-600">+16 星星幣</strong>！
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-base leading-none">🏆</span>
                      <div>
                        <strong className="text-[#FF799C] block">挑戰日常萌星成就</strong>
                        點擊下方「萌星成就」，當累計撫摸、餵食、擁有家具次數達標時，即可手動領取海量星星幣獎勵！
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-base leading-none">🔥</span>
                      <div>
                        <strong className="text-[#FF799C] block">每日登入活躍結算</strong>
                        每日登入並在全站進行黑膠聽歌、圖片相冊、黑罐寫信互動，系統自動累計活躍度，每晚 00:00 結算並發放大量星星幣！
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2.5">
                <button
                  onClick={() => setShowCoinGuideModal(false)}
                  className="w-full bg-[#FF799C] hover:bg-[#FF799C]/90 text-white font-bold py-2.5 rounded-2xl text-xs active:scale-[0.98] transition-all cursor-pointer shadow-md text-center"
                >
                  好耶，我知道了！去賺星幣 ✨
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REFRIGERATOR OVERLAY CONTAINER (Sliding Popup Modal) */}
      <AnimatePresence>
        {isFridgeOpen && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4 fridge-open">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[32px] border-4 border-[#FFC2D1] p-6 max-w-lg w-full text-left shadow-2xl relative"
            >
              <button
                onClick={() => {
                  setIsFridgeOpen(false);
                  setFridgeMessage("");
                }}
                className="absolute z-50 top-4 right-4 text-gray-400 hover:text-[#FF799C] transition-all p-2 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="flex items-center gap-3 border-b border-[#FF799C]/15 pb-3.5 mb-4">
                <div className="p-2.5 bg-[#FFC2D1]/20 rounded-2xl">
                  <svg width="35" height="42" viewBox="0 0 70 100">
                    <rect x="5" y="5" width="60" height="90" rx="14" fill="#FFC2D1" stroke="#FF9FB6" strokeWidth="2.5" />
                    <line x1="5" y1="38" x2="65" y2="38" stroke="#FF9FB6" strokeWidth="2" />
                    <rect x="52" y="20" width="5" height="12" rx="2.5" fill="#FFFFFF" stroke="#FF799C" strokeWidth="1" />
                    <rect x="52" y="46" width="5" height="18" rx="2.5" fill="#FFFFFF" stroke="#FF799C" strokeWidth="1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#6E4B55] flex items-center gap-1.5">
                    🍓 草莓波點冰箱：美味儲藏室
                  </h3>
                  <p className="text-xs text-[#6E4B55]/70">
                    為 {currentPetName} 準備的可口草莓水蜜桃甜品點心
                  </p>
                </div>
              </div>

              {/* Coins Balance Indicator */}
              <div className="bg-[#FFF4F7] p-2.5 rounded-xl border border-[#FF799C]/15 flex justify-between items-center mb-4">
                <span className="text-[11px] text-[#6E4B55] font-bold">💰 當前儲蓄星星幣：</span>
                <span className="text-xs font-mono font-bold text-[#FF799C] flex items-center gap-1">
                  <Coins className="h-4 w-4" /> {currentCoins} 🪙
                </span>
              </div>

              {/* Status Message */}
              {fridgeMessage && (
                <div className="bg-[#FFF8EA] border border-[#FFD89C] text-[#915B00] text-[10px] p-2 rounded-xl mb-4 text-center font-bold">
                  {fridgeMessage}
                </div>
              )}

              {/* Food Items List */}
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {REFRIGERATOR_FOOD_TEMPLATES.map((food) => {
                  const quantity = currentFridgeFood[food.id] || 0;
                  return (
                    <div key={food.id} className="bg-gray-50 border border-gray-100 p-3 rounded-2xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl filter drop-shadow-sm select-none">{food.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-[#6E4B55]">{food.name}</h4>
                            <span className="text-[8px] bg-[#FF799C]/10 text-[#FF799C] font-bold px-1.5 py-0.5 rounded-full">
                              庫存: {quantity}
                            </span>
                          </div>
                          <p className="text-[9px] text-gray-500 leading-tight mt-0.5">{food.description}</p>
                          <span className="text-[9px] text-pink-500 font-bold block mt-1">{food.effect}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Buy Button */}
                        <button
                          onClick={() => handleBuyFood(food)}
                          className="bg-white hover:bg-pink-50 border border-[#FF799C]/30 text-[#FF799C] font-bold px-2.5 py-1.5 rounded-xl text-[10px] transition-all cursor-pointer flex flex-col items-center leading-tight active:scale-95"
                        >
                          <span>購入</span>
                          <span className="text-[8px] opacity-75">{food.cost} 🪙</span>
                        </button>

                        {/* Feed Button */}
                        <button
                          disabled={quantity <= 0}
                          onClick={() => handleFeedFromFridge(food)}
                          className={`font-bold px-3 py-1.5 rounded-xl text-[10px] transition-all cursor-pointer flex flex-col items-center leading-tight active:scale-95 ${quantity <= 0 ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed" : "bg-[#FF799C] hover:bg-[#FF799C]/90 text-white"}`}
                        >
                          <span>餵食</span>
                          <span className="text-[8px] opacity-85">消耗 1</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center mt-5 text-[9px] text-gray-400">
                💡 提示：點擊「購入」會扣除星星幣並為冰箱增加 1 個點心；點擊「餵食」會消耗 1 個點心並餵給寵物。
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM PAINT CANVAS MODAL BOARD */}
      <AnimatePresence>
        {isCanvasOpen && (
          <PetsCanvasBoard
            isOpen={isCanvasOpen}
            onClose={() => setIsCanvasOpen(false)}
            onSave={handleSaveCustomSkin}
            initialDataUrl={currentCustomSkin}
            petName={currentPetName}
          />
        )}
      </AnimatePresence>

      {/* FRIEND POLAROID SNAP MODAL */}
      <AnimatePresence>
        {selectedFriendForSnap && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-[#FFF5F7] to-white rounded-3xl p-5 max-w-sm w-full border border-[#FF799C]/30 shadow-2xl relative overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setSelectedFriendForSnap(null)}
                className="absolute top-4 right-4 text-[#6E4B55] hover:text-[#FF799C] transition-all cursor-pointer p-1 rounded-full bg-white/80"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="text-xs font-bold text-[#6E4B55] flex items-center gap-1.5 mb-4">
                <Camera className="h-4 w-4 text-[#FF799C]" />
                與 <span className="text-[#FF799C] underline">{selectedFriendForSnap.username}</span> 的拍立得時光
              </h3>

              {/* Source Switcher */}
              <div className="flex gap-1.5 bg-pink-100/50 p-1 rounded-xl mb-4 text-[10px]">
                <button
                  type="button"
                  onClick={() => setSnapSourceType("camera")}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${snapSourceType === "camera" ? "bg-white text-[#FF799C] shadow-xs" : "text-[#6E4B55]/70"}`}
                >
                  📷 現在拍攝
                </button>
                <button
                  type="button"
                  onClick={() => setSnapSourceType("upload")}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${snapSourceType === "upload" ? "bg-white text-[#FF799C] shadow-xs" : "text-[#6E4B55]/70"}`}
                >
                  🖼️ 手機相冊上傳
                </button>
              </div>

              {/* Polaroid Frame Preview Card */}
              <div className="bg-white p-3 pb-4 rounded-xl shadow-lg border border-pink-100 max-w-[210px] mx-auto rotate-[1deg] mb-4">
                <div className="aspect-square w-full rounded-md bg-gray-50 border border-gray-100 overflow-hidden relative flex items-center justify-center">
                  {snapSourceType === "camera" ? (
                    capturedCameraBase64 ? (
                      <img
                        src={capturedCameraBase64}
                        alt="Captured"
                        className="h-full w-full object-cover"
                      />
                    ) : cameraActive ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="h-full w-full object-cover bg-black"
                      />
                    ) : (
                      <div className="text-center p-3">
                        <Camera className="h-6 w-6 text-gray-300 mx-auto mb-1" />
                        <span className="text-[9px] text-gray-400 block font-sans">相機尚未開啟</span>
                      </div>
                    )
                  ) : uploadedSnapBase64 ? (
                    <img
                      src={uploadedSnapBase64}
                      alt="Uploaded"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-3">
                      <Image className="h-6 w-6 text-gray-300 mx-auto mb-1 animate-pulse" />
                      <span className="text-[9px] text-gray-400 block font-sans">點選下方按鈕上傳</span>
                    </div>
                  )}
                  {/* Polaroid Cute Frame Sticker Accent */}
                  <div className="absolute top-1 right-1 bg-[#FF799C] text-white text-[6px] px-1 py-0.2 rounded font-sans rotate-[5deg] uppercase tracking-wider font-bold">
                    Lovely
                  </div>
                </div>

                {/* Captions Text Inside Frame */}
                <div className="mt-3 text-center">
                  <p className="text-[10px] text-[#6E4B55] font-serif italic truncate max-w-full">
                    {snapCaption.trim() || "✨ 跟你分享這張超級可愛的照片！📸"}
                  </p>
                  <span className="text-[6px] text-gray-300 block font-mono mt-1">
                    {new Date().toLocaleDateString()} • Polaroid
                  </span>
                </div>
              </div>

              {/* Controls */}
              {snapSourceType === "camera" ? (
                <div className="mb-4 flex flex-col items-center gap-2">
                  {!cameraActive && !capturedCameraBase64 && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
                          setCameraStream(stream);
                          setCameraActive(true);
                          setSnapError("");
                          setTimeout(() => {
                            if (videoRef.current) {
                              videoRef.current.srcObject = stream;
                            }
                          }, 150);
                        } catch (err) {
                          console.error("Camera access failed:", err);
                          setSnapError("無法存取相機，請檢查相機權限或使用相冊上傳 📷");
                        }
                      }}
                      className="bg-gradient-to-r from-[#FF799C] to-[#FF9EBA] hover:opacity-95 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      <Camera className="h-4 w-4" />
                      <span>開啟相機鏡頭</span>
                    </button>
                  )}

                  {cameraActive && (
                    <button
                      type="button"
                      onClick={() => {
                        if (videoRef.current) {
                          const canvas = document.createElement("canvas");
                          canvas.width = videoRef.current.videoWidth || 640;
                          canvas.height = videoRef.current.videoHeight || 480;
                          const ctx = canvas.getContext("2d");
                          if (ctx) {
                            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                            const dataUrl = canvas.toDataURL("image/jpeg");
                            setCapturedCameraBase64(dataUrl);
                            stopCameraStream();
                          }
                        }
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer animate-pulse"
                    >
                      <span>📸 立即拍照</span>
                    </button>
                  )}

                  {capturedCameraBase64 && (
                    <button
                      type="button"
                      onClick={async () => {
                        setCapturedCameraBase64("");
                        try {
                          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
                          setCameraStream(stream);
                          setCameraActive(true);
                          setSnapError("");
                          setTimeout(() => {
                            if (videoRef.current) {
                              videoRef.current.srcObject = stream;
                            }
                          }, 150);
                        } catch (err) {
                          console.error("Camera access failed:", err);
                          setSnapError("無法存取相機，請檢查相機權限或使用相冊上傳 📷");
                        }
                      }}
                      className="bg-[#6E4B55] hover:opacity-90 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <span>🔄 重新拍攝</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-[8px] text-gray-400 font-mono mb-1">📂 從本機或手機相冊選擇相片：</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setUploadedSnapBase64(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-[9px] text-gray-500 bg-white border border-pink-100 rounded-xl px-2.5 py-1.5 focus:outline-none file:mr-2 file:py-0.5 file:px-2 file:rounded-lg file:border-0 file:text-[8px] file:font-bold file:bg-[#FF799C]/10 file:text-[#FF799C]"
                  />
                </div>
              )}

              {/* Handwritten Comment Box */}
              <div className="mb-4">
                <label className="block text-[8px] text-gray-400 font-mono mb-1">✍️ 手寫暖心悄悄話：</label>
                <input
                  type="text"
                  placeholder="寫下你想對好友說的話 (限 15 字) 🌸"
                  maxLength={15}
                  value={snapCaption}
                  onChange={(e) => setSnapCaption(e.target.value)}
                  className="w-full bg-white border border-[#FF799C]/20 rounded-xl px-3 py-1.5 text-[10px] focus:outline-none focus:border-[#FF799C] text-[#6E4B55]"
                />
              </div>

              {/* Tips and status message */}
              <p className="text-[8px] text-gray-400 leading-normal text-center mb-3">
                💡 拍立得照片將永遠保存於雙方的「照片牆」，且可隨時於 <b>Plog 區域</b> 製作成拼圖導出！
              </p>

              {snapError && (
                <p className="text-[9px] text-red-500 font-medium text-center mb-3 bg-red-50 py-1 rounded-lg border border-red-100">{snapError}</p>
              )}
              {snapMessage && (
                <p className="text-[9px] text-emerald-600 font-bold text-center mb-3 bg-emerald-50 py-1 rounded-lg border border-emerald-100">{snapMessage}</p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFriendForSnap(null)}
                  className="flex-1 border border-gray-200 text-gray-500 hover:bg-gray-50 text-[10px] font-bold py-2 rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  關閉
                </button>
                <button
                  type="button"
                  disabled={isSendingSnap}
                  onClick={async () => {
                    if (!currentUser || !selectedFriendForSnap) return;
                    setIsSendingSnap(true);
                    setSnapError("");
                    setSnapMessage("");

                    const imageUrl = snapSourceType === "camera" 
                      ? capturedCameraBase64 
                      : uploadedSnapBase64;

                    if (!imageUrl) {
                      setSnapError("請先選擇或上傳一張照片！🌸");
                      setIsSendingSnap(false);
                      return;
                    }

                    try {
                      const res = await fetch("/api/friends/send-snap", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          senderId: currentUser.id,
                          receiverId: selectedFriendForSnap.id,
                          imageUrl,
                          caption: snapCaption.trim() || "✨ 跟你分享這張超級可愛的照片！📸"
                        })
                      });

                      const data = await res.json();
                      if (res.ok) {
                        setSnapMessage(data.message || "✨ 發送成功！");
                        if (onRefreshData) onRefreshData();
                        fetchCoparentData();
                        
                        // Fetch snaps right away to refresh the UI
                        const resSnaps = await fetch(`/api/friends/snaps?userId=${currentUser.id}`);
                        if (resSnaps.ok) {
                          const snapsData = await resSnaps.json();
                          setFriendSnaps(snapsData);
                        }

                        setTimeout(() => {
                          setSelectedFriendForSnap(null);
                        }, 1500);
                      } else {
                        setSnapError(data.error || "發送失敗");
                      }
                    } catch (err) {
                      console.error(err);
                      setSnapError("連線失敗，請稍後再試");
                    } finally {
                      setIsSendingSnap(false);
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-[#FF799C] to-[#FF9EBA] hover:opacity-90 text-white text-[10px] font-bold py-2 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1 shadow-md disabled:opacity-50"
                >
                  {isSendingSnap ? "發送中..." : "確認發送 📸"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🛍️ FURNITURE SHOP MODAL OVERLAY */}
      <AnimatePresence>
        {isShopOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-[#FFF5F7] to-white rounded-[32px] p-6 max-w-lg w-full border-4 border-[#FFCCD9] shadow-2xl relative overflow-hidden text-left"
            >
              {/* Cute corner hearts decoration */}
              <div className="absolute -top-10 -left-10 w-24 h-24 bg-[#FF799C]/10 rounded-full blur-xl" />
              <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-[#FF9EBA]/15 rounded-full blur-xl" />

              <button
                type="button"
                onClick={() => setIsShopOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-[#FF799C] transition-all p-2 rounded-full hover:bg-pink-50 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="flex items-center gap-2.5 border-b border-[#FFCCD9]/30 pb-3.5 mb-4">
                <span className="text-3xl select-none">🛍️</span>
                <div>
                  <h3 className="text-lg font-bold text-[#6E4B55] flex items-center gap-1.5">
                    蜜桃星寵高級家具商店
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    星寵家具越來越貴，但能為房間大幅增加夢幻度，並提供海量經驗值喔！🌸
                  </p>
                </div>
              </div>

              {/* Wallet Balance */}
              <div className="bg-[#FFF4F7] border border-[#FF799C]/20 p-2.5 rounded-2xl flex justify-between items-center mb-4 text-xs font-bold text-[#6E4B55]">
                <span>🪙 {activeTab === "single" ? "我的星星幣餘額：" : "家庭共享星星幣餘額："}</span>
                <span className="text-sm font-mono text-[#FF799C] flex items-center gap-1">
                  <Coins className="h-4.5 w-4.5" /> {activeTab === "single" ? soloCoins : (activeGroup?.star_coins || 0)} 🪙
                </span>
              </div>

              {/* Product list */}
              <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                {SHOP_FURNITURE_TEMPLATES.map(item => {
                  const owned = activeTab === "single"
                    ? soloFurniture.some(f => f.id === item.id)
                    : (activeGroup?.pet?.furniture || []).some((f: any) => f.id === item.id);
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${owned ? "bg-gray-50 border-gray-100 opacity-80" : "bg-white border-pink-100 hover:border-[#FF799C]/40 hover:shadow-xs"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center shrink-0 border border-pink-100 overflow-hidden">
                          {FURNITURE_SVGS[item.id] || <span>🎁</span>}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-[#6E4B55]">{item.name}</h4>
                            <span className="text-[8px] bg-pink-100 text-[#FF799C] px-1.5 py-0.2 rounded-full font-bold">
                              {item.vibe}
                            </span>
                          </div>
                          <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">{item.description}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={owned}
                        onClick={() => handleBuyShopFurniture(item)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shrink-0 cursor-pointer active:scale-95 flex items-center gap-1 ${owned ? "bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default" : "bg-[#FF799C] text-white hover:opacity-90 shadow-sm"}`}
                      >
                        {owned ? (
                          <span>已置辦 💖</span>
                        ) : (
                          <>
                            <span>置辦</span>
                            <span className="text-[8px] opacity-90 font-mono">({item.cost}🪙)</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="text-center mt-5 text-[8.5px] text-gray-400">
                💡 家具購入後將直接送入房間中央，您可以<b>滑鼠按住隨意拖曳擺放</b>，發揮你的浪漫創意！✨
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🏆 ACHIEVEMENTS SYSTEM MODAL OVERLAY */}
      <AnimatePresence>
        {isAchievementsOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-[#FFFCEF] to-white rounded-[32px] p-6 max-w-lg w-full border-4 border-[#FFE3A5] shadow-2xl relative overflow-hidden text-left"
            >
              {/* Gold star decorations */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-yellow-300/10 rounded-full blur-xl" />
              <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-[#FF9EBA]/10 rounded-full blur-xl" />

              <button
                type="button"
                onClick={() => setIsAchievementsOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-amber-500 transition-all p-2 rounded-full hover:bg-amber-50 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="flex items-center gap-2.5 border-b border-[#FFE3A5]/40 pb-3.5 mb-4">
                <span className="text-3xl select-none">🏆</span>
                <div>
                  <h3 className="text-lg font-bold text-amber-950 flex items-center gap-1.5">
                    萌星應援成就榮耀殿堂
                  </h3>
                  <p className="text-[10px] text-amber-800/70">
                    紀錄您與極禹萌寵的溫暖點滴。完成指標可領取海量星星幣，助力星寵快樂成長！💖
                  </p>
                </div>
              </div>

              {/* Achievements Grid List */}
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {ACHIEVEMENTS_LIST.map(ach => {
                  const state = achievementsState[ach.id] || { progress: 0, claimed: false };
                  const completed = state.progress >= ach.targetValue;
                  const percent = Math.min(100, (state.progress / ach.targetValue) * 100);

                  return (
                    <div
                      key={ach.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${completed ? (state.claimed ? "bg-amber-50/20 border-amber-100 opacity-80" : "bg-amber-50/50 border-amber-200") : "bg-white border-gray-100"}`}
                    >
                      <div className="flex items-start gap-2.5 flex-1 text-left">
                        <span className="text-2xl shrink-0 mt-0.5 filter drop-shadow-sm select-none">{ach.icon}</span>
                        <div className="w-full">
                          <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                            {ach.title}
                            {completed && !state.claimed && (
                              <span className="text-[7.5px] bg-red-100 text-red-500 font-extrabold px-1 rounded animate-pulse">
                                可領取 🪙
                              </span>
                            )}
                          </h4>
                          <p className="text-[9px] text-[#6E4B55]/80 leading-normal mt-0.5">{ach.description}</p>
                          
                          {/* Progress bar */}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-24 bg-gray-100 rounded-full h-1.5 border border-amber-100 overflow-hidden">
                              <div
                                className="bg-amber-400 h-full rounded-full"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-[8.5px] font-mono text-gray-400 font-bold">
                              {state.progress} / {ach.targetValue}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {state.claimed ? (
                          <span className="text-[10px] text-amber-600 font-bold bg-amber-100/40 px-2.5 py-1 rounded-full">
                            已達成 ✨
                          </span>
                        ) : completed ? (
                          <button
                            type="button"
                            onClick={() => claimAchievementReward(ach.id)}
                            className="bg-gradient-to-r from-amber-400 to-yellow-400 hover:brightness-105 text-amber-950 font-extrabold text-[10px] px-3 py-1.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer animate-bounce"
                          >
                            領取 +{ach.rewardCoins}🪙
                          </button>
                        ) : (
                          <div className="text-[8px] text-gray-400 font-bold bg-gray-100 px-2 py-1 rounded-lg">
                            進行中..
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}

        {/* 🥚✨ INTERACTIVE STAR EGG HATCHING OVERLAY MODAL */}
        {isHatching && hatchedPet && (
          <div className="fixed inset-0 bg-[#281A2C]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-gradient-to-br from-[#1C0D24] to-[#2E1834] rounded-[40px] p-8 max-w-md w-full border-4 border-[#FFCCD9]/30 shadow-[0_0_50px_rgba(255,121,156,0.3)] relative overflow-hidden text-center text-white"
            >
              {/* Starry starry backdrop sparkles */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,121,156,0.15)_0%,transparent_70%)] pointer-events-none" />
              <div className="absolute top-10 left-10 text-xl opacity-40 animate-ping">✨</div>
              <div className="absolute bottom-10 right-10 text-lg opacity-40 animate-pulse">🌟</div>
              <div className="absolute top-1/4 right-8 text-2xl opacity-20 animate-bounce">🌙</div>

              <h2 className="text-lg font-black tracking-widest text-[#FFCCD9] mb-6 flex items-center justify-center gap-2">
                <span>✨ 星際能量孕育中 ✨</span>
              </h2>

              {/* Egg Stages Container */}
              <div className="h-48 flex items-center justify-center relative mb-6">
                {hatchingEggPhase === "egg_idle" && (
                  <motion.div
                    animate={{ y: [-10, 10, -10] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    className="text-[90px] filter drop-shadow-[0_10px_20px_rgba(255,121,156,0.3)] select-none cursor-pointer"
                  >
                    🥚
                  </motion.div>
                )}

                {hatchingEggPhase === "egg_shake" && (
                  <motion.div
                    animate={{ rotate: [0, -12, 12, -15, 15, -8, 8, 0], scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 0.45 }}
                    className="text-[90px] filter drop-shadow-[0_10px_20px_rgba(255,121,156,0.5)] select-none"
                  >
                    🥚⚡
                  </motion.div>
                )}

                {hatchingEggPhase === "egg_burst" && (
                  <motion.div
                    animate={{ scale: [1, 1.8, 0], rotate: [0, 180, 360] }}
                    transition={{ duration: 0.8 }}
                    className="text-[100px] filter drop-shadow-[0_0_40px_#FF799C] select-none"
                  >
                    💥
                  </motion.div>
                )}

                {hatchingEggPhase === "egg_reveal" && (
                  <motion.div
                    initial={{ scale: 0.3, rotate: -45, opacity: 0 }}
                    animate={{ scale: [0.3, 1.25, 1], rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.9, type: "spring" }}
                    className="relative flex flex-col items-center justify-center"
                  >
                    {/* Glowing gold halo */}
                    <div className="absolute h-36 w-36 rounded-full bg-gradient-to-tr from-[#FF799C]/40 to-[#FFE39C]/60 blur-2xl animate-pulse" />
                    
                    {/* Species Vector rendering inside the modal */}
                    <div className="relative w-32 h-32 flex items-center justify-center filter drop-shadow-[0_15px_25px_rgba(255,121,156,0.4)]">
                      <svg viewBox="0 0 100 100" className="w-28 h-28">
                        <defs>
                          <radialGradient id="compPigGradModal" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#FFF0F5" />
                            <stop offset="100%" stopColor="#FFCCD9" />
                          </radialGradient>
                          <radialGradient id="compDogGradModal" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#FFFBF0" />
                            <stop offset="100%" stopColor="#FFE0B2" />
                          </radialGradient>
                        </defs>
                        
                        {hatchedPet.species === "pig" ? (
                          <>
                            <ellipse cx="50" cy="55" rx="38" ry="34" fill="url(#compPigGradModal)" stroke="#FFF" strokeWidth="2" />
                            <path d="M 22 28 Q 16 12 32 18 Z" fill="#FFCCD9" stroke="#FFF" strokeWidth="1.2" />
                            <path d="M 78 28 Q 84 12 68 18 Z" fill="#FFCCD9" stroke="#FFF" strokeWidth="1.2" />
                            <ellipse cx="50" cy="62" rx="12" ry="8" fill="#FF799C" stroke="#FFF" strokeWidth="1" />
                            <ellipse cx="45" cy="62" rx="2" ry="3.5" fill="#6E4B55" />
                            <ellipse cx="55" cy="62" rx="2" ry="3.5" fill="#6E4B55" />
                          </>
                        ) : (
                          <>
                            <ellipse cx="50" cy="55" rx="36" ry="32" fill="url(#compDogGradModal)" stroke="#FFF" strokeWidth="2" />
                            <path d="M 16 35 C 8 30 4 55 12 65 C 20 75 22 50 18 35 Z" fill="#A77443" stroke="#FFF" strokeWidth="1.2" />
                            <path d="M 84 35 C 92 30 96 55 88 65 C 80 75 78 50 82 35 Z" fill="#A77443" stroke="#FFF" strokeWidth="1.2" />
                            <ellipse cx="50" cy="62" rx="14" ry="10" fill="#FFF" opacity="0.8" />
                            <path d="M 46 56 Q 50 53 54 56 Q 54 59 50 62 Q 46 59 46 56 Z" fill="#4E3629" />
                          </>
                        )}
                        <ellipse cx="36" cy="50" rx="4.5" ry="3" fill="#FF799C" opacity="0.6" />
                        <ellipse cx="64" cy="50" rx="4.5" ry="3" fill="#FF799C" opacity="0.6" />
                        <circle cx="41" cy="46" r="3" fill="#6E4B55" />
                        <circle cx="59" cy="46" r="3" fill="#6E4B55" />
                        <circle cx="39.5" cy="44.5" r="1" fill="#FFF" />
                        <circle cx="57.5" cy="44.5" r="1" fill="#FFF" />
                        <path d="M 46 53 Q 50 57 54 53" stroke="#6E4B55" strokeWidth="2" strokeLinecap="round" fill="none" />
                      </svg>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Descriptions & Renaming Actions */}
              <div className="space-y-4">
                {hatchingEggPhase !== "egg_reveal" ? (
                  <p className="text-xs text-[#FFCCD9]/80 font-medium leading-relaxed font-sans px-4">
                    {hatchingEggPhase === "egg_idle" && "🌟 星塵能量正在向蛋殼中心匯聚，請耐心等待奇蹟降臨... 🔮"}
                    {hatchingEggPhase === "egg_shake" && "⚡ 哇！蛋殼開始出現了密密麻麻的裂縫！好像有什麼要蹦出來了！✨"}
                    {hatchingEggPhase === "egg_burst" && "💥 啪嚓！星際之光綻放，星寵寶寶誕生囉！🎉"}
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-md font-bold text-yellow-300">🎉 恭喜獲得全新星寵！</h3>
                      <p className="text-xs text-pink-200 mt-1">
                        您成功孵化了一隻超可愛的【{getSpeciesName(hatchedPet.species)}】！
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 bg-white/5 border border-white/10 rounded-2xl p-3.5">
                      <span className="text-[10px] text-pink-300 font-bold">🌸 給新星寵起個特別的名字吧 :</span>
                      <input
                        type="text"
                        value={hatchedPet.name}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setHatchedPet(prev => prev ? { ...prev, name: newName } : null);
                          updatePet(hatchedPet.id, { name: newName });
                          // Also sync focused states if selected
                          if (focusedPetId === hatchedPet.id) {
                            setSoloPetName(newName);
                          }
                        }}
                        className="bg-white text-gray-800 text-center text-xs font-black rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF799C] max-w-xs border border-white/20 shadow-inner"
                        placeholder="替寶貝取名..."
                      />
                    </div>

                    <button
                      onClick={() => {
                        setIsHatching(false);
                        setHatchedPet(null);
                        setBubbleText(`🎉 歡迎新成員「${hatchedPet.name}」正式加入我們的星寵大家庭！快和牠一起合養互動吧！🩷🫧`);
                      }}
                      className="w-full bg-[#FF799C] hover:bg-[#FF799C]/90 text-white rounded-2xl py-3 text-xs font-black tracking-wider transition-all shadow-[0_4px_12px_rgba(255,121,156,0.3)] active:scale-95 cursor-pointer mt-2"
                    >
                      帶牠進入家園 🏡✨
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Footer Section */}
      <div className="relative z-10 flex flex-col items-center mt-4">
        <div className="w-32 h-1 bg-gradient-to-r from-transparent via-[#FF799C]/25 to-transparent rounded-full mb-3" />
        
        <div className="text-[9px] text-[#6E4B55]/50 font-mono tracking-widest uppercase">
          PINKY FLUFFY STAR • ALL FOR JIYU COMPANION
        </div>
      </div>

    </div>
  );
}
