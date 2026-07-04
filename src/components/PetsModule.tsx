import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Music, Heart, Smile, Star, Send, Edit2, Check, 
  RefreshCw, HelpCircle, Users, Image, Camera, Lock, UserPlus, 
  Coins, Plus, CheckCircle, Info, ChevronRight, X
} from "lucide-react";
import { User } from "../types";
import PetsCanvasBoard from "./PetsCanvasBoard";
import PlogModule from "./PlogModule";

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

interface FurnitureItem {
  id: string;
  name: string;
  x: number;
  y: number;
  description: string;
}

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

export default function PetsModule({ currentUser }: PetsModuleProps) {
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

  // Co-parenting full-stack state
  const [coparentGroups, setCoparentGroups] = useState<any[]>([]);
  const [activeGroup, setActiveGroup] = useState<any | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedFriendsForGroup, setSelectedFriendsForGroup] = useState<string[]>([]);
  
  // Friend Addition Search
  const [friendSearch, setFriendSearch] = useState("");
  const [friendAddStatus, setFriendAddStatus] = useState({ success: false, error: "", message: "" });

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
  const [chatInput, setChatInput] = useState("");
  const [feedEffect, setFeedEffect] = useState<string | null>(null);
  const roomRef = useRef<HTMLDivElement | null>(null);

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
    } else {
      // Fetch local storage fallback if they were a guest, or set defaults
      const savedName = localStorage.getItem(`${localKey}_name`);
      if (savedName) {
        setSoloPetName(savedName);
        const savedFullness = localStorage.getItem(`${localKey}_fullness`);
        if (savedFullness) setSoloFullness(parseInt(savedFullness, 10));
        const savedLove = localStorage.getItem(`${localKey}_love`);
        if (savedLove) setSoloLove(parseInt(savedLove, 10));
        const savedCoins = localStorage.getItem(`${localKey}_coins`);
        if (savedCoins) setSoloCoins(parseInt(savedCoins, 10));
        const savedFurniture = localStorage.getItem(`${localKey}_furniture`);
        if (savedFurniture) {
          try { setSoloFurniture(JSON.parse(savedFurniture)); } catch (e) {}
        }
        const savedFridge = localStorage.getItem(`${localKey}_fridge`);
        if (savedFridge) {
          try { setSoloFridgeFood(JSON.parse(savedFridge)); } catch (e) {}
        }
        const savedSkin = localStorage.getItem(`${localKey}_custom_skin`);
        if (savedSkin) setSoloCustomSkin(savedSkin);
      }
    }
  }, [currentUser?.id, localKey]);

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
            custom_skin: soloCustomSkin
          }
        })
      }).catch(err => console.error("Failed to sync solo pet to cloud", err));
    }, 1200);
    return () => clearTimeout(saveTimeout);
  }, [currentUser?.id, soloPetName, soloFullness, soloLove, soloCoins, soloFurniture, soloFridgeFood, soloCustomSkin]);

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
        setFriendAddStatus({ success: true, error: "", message: `成功添加 ${data.friend.username} 為好友！🌸` });
        setFriendSearch("");
        fetchCoparentData();
      } else {
        setFriendAddStatus({ success: false, error: data.error || "添加失敗", message: "" });
      }
    } catch (e) {
      setFriendAddStatus({ success: false, error: "連線異常", message: "" });
    }
  };

  const handleCreateGroup = async () => {
    if (!currentUser || !newGroupName.trim()) return;
    if (selectedFriendsForGroup.length === 0) {
      alert("請至少選擇 1 位好友共同飼養喔！(總人數 2～6 人)");
      return;
    }

    try {
      const res = await fetch("/api/coparent/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName.trim(),
          creatorId: currentUser.id,
          memberIds: selectedFriendsForGroup
        })
      });
      if (res.ok) {
        const data = await res.json();
        setNewGroupName("");
        setSelectedFriendsForGroup([]);
        setIsCreatingGroup(false);
        fetchCoparentData();
        setActiveTab("coparent");
        // Select newly created group
        setActiveGroup(data.group);
      } else {
        const err = await res.json();
        alert(err.error || "創建家庭失敗");
      }
    } catch (e) {
      alert("創立失敗");
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
        setFridgeMessage("❌ 星星幣不夠了！陪我聊天或切換共同飼養賺取吧！");
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
    } else {
      executeCoparentAction("feed-pet", { foodId: "dummy", fullnessVal: 0, loveVal: 2 }).catch(() => {});
    }

    setTimeout(() => {
      setIsDancing(false);
    }, 1000);
  };

  // Submit chat talking to Pet
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const msg = chatInput.trim();
    setChatInput("");
    setIsDancing(true);

    let reply = "";
    let nextExpr: "blink" | "happy" | "shy" | "glow" = "happy";

    const pName = activeTab === "single" ? soloPetName : activeGroup?.pet?.name || "小星";

    if (msg.includes("喜歡") || msg.includes("愛") || msg.includes("love")) {
      reply = `唔哇！聽到你說這句話，我的棉花糖外衣都要害羞得變成蜜桃粉紅了～💖 我也最愛最愛你了！(蓬蓬抱抱)`;
      nextExpr = "glow";
      if (activeTab === "single") setSoloLove(prev => Math.min(100, prev + 10));
    } else if (msg.includes("餓") || msg.includes("吃") || msg.includes("點心") || msg.includes("飯") || msg.includes("冰箱")) {
      reply = `摸摸肚子... 肚子有一點扁扁的呢！好想吃草莓冰箱 🧊 裡的水蜜桃棉花糖和布丁喔 ✨`;
      nextExpr = "shy";
    } else if (msg.includes("辛苦") || msg.includes("累") || msg.includes("難過") || msg.includes("傷心")) {
      reply = `別難過，快把頭埋在我的棉花糖身體裡！暖呼呼拍拍你，今天有我陪你，把所有不開心都融化在星光裡吧 🧸⭐`;
      nextExpr = "glow";
      if (activeTab === "single") setSoloLove(prev => Math.min(100, prev + 8));
    } else if (msg.includes("可愛") || msg.includes("美") || msg.includes("帥")) {
      reply = `嘿嘿～被你這樣誇獎，我的小耳朵都要害羞到發光了！你也是宇宙中最耀眼的！✨`;
      nextExpr = "shy";
      if (activeTab === "single") setSoloLove(prev => Math.min(100, prev + 6));
    } else {
      const fallbackReplies = [
        `哇！你說的「${msg}」我聽得好認真喔！真想一直聽你分享生活～🌸`,
        `聽你講話時，我的頭上好像在放小煙火呢 🎆！今天過得好嗎？`,
        `不管發生什麼事，我都會在粉紅星空之家裡一直守護、陪伴你唷！🪐`,
        `眨眨眼睛～接收到了你的宇宙波段！我們的心跳頻率是不是同步了呢？💓`
      ];
      reply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
      nextExpr = "blink";
      if (activeTab === "single") setSoloLove(prev => Math.min(100, prev + 3));
    }

    setBubbleText(reply);
    setExpression(nextExpr);

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

  const currentPetName = activeTab === "single"
    ? soloPetName
    : activeTab === "friend"
    ? (isVisitingGroup ? (selectedVisitedGroup?.pet?.name || "蜜桃粉萌星") : (visitedPet?.name || "小星"))
    : activeGroup?.pet?.name || "蜜桃粉萌星";

  const currentFullness = activeTab === "single"
    ? soloFullness
    : activeTab === "friend"
    ? (isVisitingGroup ? (selectedVisitedGroup?.pet?.fullness || 60) : 75)
    : activeGroup?.pet?.fullness || 50;

  const currentLove = activeTab === "single"
    ? soloLove
    : activeTab === "friend"
    ? (isVisitingGroup ? (selectedVisitedGroup?.pet?.love || 65) : 80)
    : activeGroup?.pet?.love || 50;

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
    : activeTab === "friend"
    ? (isVisitingGroup ? (selectedVisitedGroup?.pet?.custom_skin || "") : (visitedPet?.custom_skin || ""))
    : activeGroup?.pet?.custom_skin || "";

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

          {/* THE DECOR ROOM CONTAINER */}
          <div
            ref={roomRef}
            onClick={handleRoomClick}
            className="relative w-full h-[300px] bg-gradient-to-b from-[#FFF0F4] to-[#FFE0E9] border-2 border-[#FF799C]/25 rounded-2xl overflow-hidden shadow-inner cursor-crosshair"
          >
            {/* Cute backdrop wallpaper details */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gradient-to-b from-[#2E1834] to-[#4A1D50] border-2 border-white rounded-full flex items-center justify-center overflow-hidden shadow-md">
              <div className="absolute top-1 right-2 text-yellow-200 text-[9px] animate-pulse">🌙</div>
              <div className="absolute bottom-1 left-2 text-white/50 text-[6px]">⭐</div>
              <div className="absolute bottom-[-2px] w-full h-4 bg-white/10 rounded-full blur-[1px]" />
            </div>

            <div className="absolute top-6 left-6 text-xl opacity-20 select-none">☁️</div>
            <div className="absolute top-14 right-10 text-lg opacity-25 select-none animate-pulse">🌸</div>
            <div className="absolute top-4 right-6 text-[8px] opacity-25 font-mono">PINKISH ROOM</div>

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

            {/* Bubble Speeches */}
            <div className="absolute top-2 left-3 z-20 pointer-events-none">
              <AnimatePresence mode="wait">
                {showBubble && (
                  <motion.div
                    key={bubbleText}
                    initial={{ scale: 0.8, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: -5 }}
                    className="bg-white/95 border border-[#FF799C]/25 text-[#6E4B55] px-3.5 py-2 rounded-2xl max-w-[200px] shadow-md text-[10px] text-left pointer-events-auto"
                  >
                    {bubbleText}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* THE REDESIGNED EXTREMELY CUTELY ROUNDED PINK COTTON CANDY PET STAR */}
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
              <div className="absolute inset-0 m-auto h-24 w-24 rounded-full bg-gradient-to-tr from-[#FF799C]/20 to-[#FFD5E0]/45 blur-xl animate-pulse pointer-events-none" />

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
                {/* SVG Puffy Star representing complete recognizable shape but pink and marshmallow textured */}
                <svg
                  width="135"
                  height="135"
                  viewBox="0 0 100 100"
                  className="filter drop-shadow-[0_8px_18px_rgba(255,121,156,0.35)] overflow-visible"
                >
                  <defs>
                    {/* Enhanced Fluffy Cotton Candy filter displacement for correct fuzzy look */}
                    <filter id="puffyCottonStar" x="-30%" y="-30%" width="160%" height="160%">
                      <feTurbulence type="fractalNoise" baseFrequency="0.18" numOctaves="4" result="noise" />
                      <feDisplacementMap in="SourceGraphic" in2="noise" scale="9.0" xChannelSelector="R" yChannelSelector="G" />
                    </filter>

                    <linearGradient id="compStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFF2F5" />
                      <stop offset="50%" stopColor="#FFCCDD" />
                      <stop offset="100%" stopColor="#FF799C" />
                    </linearGradient>
                  </defs>

                  {currentCustomSkin ? (
                    /* User's custom hand-drawn pet star - fully customized, with marshmallow puffy filter correctly displayed */
                    <image
                      href={currentCustomSkin}
                      x="0"
                      y="0"
                      width="100"
                      height="100"
                      filter="url(#puffyCottonStar)"
                    />
                  ) : (
                    /* Default Star Companion shape - exactly like the right-corner star with pink bow and adorable face */
                    <>
                      {/* Star body */}
                      <path
                        d="M 50 5 L 63 37 L 97 37 L 70 58 L 81 92 L 50 72 L 19 92 L 30 58 L 3 37 L 37 37 Z"
                        fill="url(#compStarGrad)"
                        filter="url(#puffyCottonStar)"
                        stroke="#FFF"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                      />

                      {/* Soft 3D volumetric light spheres to make it look like fluffy cotton candy mass */}
                      <circle cx="50" cy="48" r="16" fill="rgba(255, 255, 255, 0.45)" filter="blur(6px)" pointerEvents="none" />

                      {/* Pink bow on left star tip */}
                      <g transform="translate(0, 0)">
                        <path d="M 28 30 Q 23 25 28 20 Q 33 25 28 30 Z" fill="#FF799C" stroke="#FFF" strokeWidth="1" />
                        <path d="M 28 30 Q 33 35 28 40 Q 23 35 28 30 Z" fill="#FF799C" stroke="#FFF" strokeWidth="1" />
                        <circle cx="28" cy="30" r="2.5" fill="#FFCCDD" stroke="#FFF" strokeWidth="0.8" />
                      </g>

                      {/* Blushing cheeks */}
                      <ellipse cx="36" cy="54" rx="5" ry="3" fill="#FF799C" opacity="0.6" />
                      <ellipse cx="64" cy="54" rx="5" ry="3" fill="#FF799C" opacity="0.6" />

                      {/* Cute Eyes & Mouth */}
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
                            <circle cx="57.5" cy="46" r="1.2" fill="#FFF" />
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

                        {/* Cute mouth */}
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

          {/* CHAT / INTERACTION PANEL */}
          <div className="bg-white/60 border border-[#FF799C]/15 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-[#6E4B55] mb-2 flex items-center justify-between">
              <span>💬 與 {currentPetName} 語音聊天</span>
              <button
                onClick={handleStarClick}
                className="text-[9px] text-[#FF799C] hover:underline cursor-pointer"
              >
                戳一下星星 ⚡
              </button>
            </h3>

            <form onSubmit={handleChatSubmit} className="flex gap-1.5">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`跟 ${currentPetName} 聊聊天吧...`}
                className="flex-1 bg-white/80 border border-[#FF799C]/20 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#FF799C] text-[#6E4B55]"
              />
              <button
                type="submit"
                className="bg-[#FF799C] hover:bg-[#FF799C]/90 text-white p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

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
                      <Camera className="text-[#FF799C] h-4.5 w-4.5" /> 每小時傳照片得星星幣任務 🪙
                    </h3>
                    {photoShareCooldown > 0 ? (
                      <span className="text-[9px] font-mono text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        ⏱️ 倒數：{Math.floor(photoShareCooldown / 60)}分{photoShareCooldown % 60}秒
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-pulse">
                        ✅ 任務可領取
                      </span>
                    )}
                  </div>

                  {isSharingPhoto ? (
                    <form onSubmit={handlePhotoShareSubmit} className="space-y-2.5 text-xs bg-white/80 p-3 rounded-xl border border-[#FF799C]/10">
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 mb-1">📸 照片 URL (留空將隨機推薦一張星光拍立得)：</label>
                        <input
                          type="text"
                          placeholder="請輸入照片的圖片網址..."
                          value={photoUrlInput}
                          onChange={(e) => setPhotoUrlInput(e.target.value)}
                          className="w-full bg-white border border-[#FF799C]/20 rounded-lg p-1.5 focus:outline-none focus:border-[#FF799C] text-[#6E4B55] text-[10px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 mb-1">💬 給夥伴們的話：</label>
                        <input
                          type="text"
                          placeholder="例如：小星寵今天看起來很乖耶！🌸"
                          value={photoCaptionInput}
                          onChange={(e) => setPhotoCaptionInput(e.target.value)}
                          className="w-full bg-white border border-[#FF799C]/20 rounded-lg p-1.5 focus:outline-none focus:border-[#FF799C] text-[#6E4B55] text-[10px]"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setIsSharingPhoto(false)}
                          className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg"
                        >
                          取消
                        </button>
                        <button
                          type="submit"
                          className="bg-[#FF799C] text-white px-3 py-1 rounded-lg hover:bg-[#FF799C]/90"
                        >
                          分享並領取 +50 🪙
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-center">
                      <button
                        disabled={photoShareCooldown > 0}
                        onClick={() => setIsSharingPhoto(true)}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${photoShareCooldown > 0 ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed" : "bg-gradient-to-r from-[#FF799C] to-[#FFCCDD] text-white hover:opacity-95"}`}
                      >
                        <Camera className="h-4 w-4" /> 上傳照片打卡 (每小時領取 +50 星星幣)
                      </button>
                    </div>
                  )}

                  {/* PHOTO FEED ALBUM */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-[#6E4B55] flex items-center gap-1">
                      <span>📸 共同飼養相片動態牆 ({activeGroup.photos?.length || 0})</span>
                    </h4>
                    
                    <div className="flex gap-3 overflow-x-auto pb-2 pt-1 max-w-full">
                      {activeGroup.photos?.map((p: any) => (
                        <div key={p.id} className="bg-white p-2 rounded-xl border border-[#FF799C]/10 shadow-sm shrink-0 w-[140px] text-center">
                          <div className="h-20 w-full overflow-hidden rounded-lg bg-gray-50 border border-gray-100">
                            <img src={p.image_url || undefined} alt="Shared snap" className="h-full w-full object-cover" />
                          </div>
                          <p className="text-[10px] font-bold text-[#FF799C] truncate mt-1.5">{p.username}</p>
                          <p className="text-[8px] text-gray-500 truncate">{p.caption}</p>
                          <span className="text-[7px] text-gray-400 block mt-0.5 leading-none">
                            {new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* FRIEND SYSTEM MANAGER */}
              <div className="bg-white/60 border border-[#FF799C]/15 rounded-2xl p-4 space-y-3">
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

                {/* SUGGESTION BUTTONS FOR RAPID DEMONSTRATION */}
                <div className="bg-[#FFF4F7]/40 p-2.5 rounded-xl border border-[#FF799C]/10 space-y-1.5">
                  <span className="text-[9px] text-gray-400 block font-mono">💡 快速測試推薦好友：</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {SUGGESTED_FRIENDS.map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={async () => {
                          setFriendSearch(f.username);
                        }}
                        className="bg-white hover:bg-[#FFF4F7] border border-[#FF799C]/15 px-2 py-0.5 rounded-full text-[9px] text-[#6E4B55] transition-all"
                      >
                        +{f.username}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FRIENDS LIST ROW */}
                <div className="space-y-1.5 border-t border-[#FF799C]/10 pt-2.5">
                  <h4 className="text-[10px] font-bold text-gray-500">🌸 我的好友清單 ({friends.length})</h4>
                  {friends.length === 0 ? (
                    <p className="text-[9px] text-gray-400 leading-normal">
                      目前好友列表空空的，點擊上面的推薦好友按鈕，再點擊右邊的「添加」按鈕，快速建立你的友誼吧！🌟
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
                            className="bg-[#FF799C]/10 hover:bg-[#FF799C]/20 text-[#FF799C] text-[8px] font-bold px-1.5 py-0.5 rounded-lg ml-1 shrink-0 transition-all cursor-pointer active:scale-95 animate-pulse"
                          >
                            互動 ✦
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
              </div>

            </div>
          )}

        </div>

      </div>
      )}

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
