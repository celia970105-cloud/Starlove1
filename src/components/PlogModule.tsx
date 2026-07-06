import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Camera, Image as ImageIcon, Sparkles, Heart, Trash2, Download, 
  Plus, Maximize2, RotateCcw, ArrowUp, ArrowDown, Type, Check, Paintbrush, RefreshCw, X,
  Grid, Shuffle, Eraser
} from "lucide-react";
import { PhotoPost, User } from "../types";

interface PlogModuleProps {
  currentUser: User | null;
}

interface CollageElement {
  id: string;
  type: "image" | "text" | "sticker";
  src?: string; // For images and stickers
  text?: string; // For text elements
  color?: string; // Text color
  fontSize?: number; // Text font size
  x: number; // Percent or absolute coordinates on canvas (let's use pixel in 500x500 box)
  y: number;
  scale: number;
  rotation: number; // degrees
}

const PRESET_STICKERS = [
  { char: "💖", label: "愛心" },
  { char: "✨", label: "亮晶晶" },
  { char: "⭐", label: "星星" },
  { char: "🌸", label: "粉櫻" },
  { char: "🍓", label: "草莓" },
  { char: "🐾", label: "足跡" },
  { char: "🎀", label: "蝴蝶結" },
  { char: "🧸", label: "泰迪熊" },
  { char: "☁️", label: "軟白雲" },
  { char: "👑", label: "皇冠" },
  { char: "🍭", label: "棒棒糖" },
  { char: "🌙", label: "月亮" }
];

const PRESET_FALLBACK_IMAGES = [
  { url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='500' height='500'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23FF799C'/><stop offset='100%25' stop-color='%23FFFFFF'/></linearGradient></defs><rect width='100%25' height='100%25' fill='url(%23g)'/></svg>", title: "粉白夢幻漸層" },
  { url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='500' height='500'><rect width='100%25' height='100%25' fill='%23FF799C'/><defs><pattern id='p' width='40' height='40' patternUnits='userSpaceOnUse'><circle cx='20' cy='20' r='6' fill='%23FFFFFF' opacity='0.45'/></pattern></defs><rect width='100%25' height='100%25' fill='url(%23p)'/></svg>", title: "甜美粉色波點" },
  { url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='500' height='500'><rect width='100%25' height='100%25' fill='%23FFFFFF'/><defs><pattern id='p' width='40' height='40' patternUnits='userSpaceOnUse'><circle cx='20' cy='20' r='6' fill='%23FF799C' opacity='0.35'/></pattern></defs><rect width='100%25' height='100%25' fill='url(%23p)'/></svg>", title: "精緻白色波點" }
];

const TEXT_COLORS = [
  { code: "#FF799C", name: "棉花糖粉" },
  { code: "#FFB03B", name: "流星金黃" },
  { code: "#4A90E2", name: "星空藍" },
  { code: "#4CD964", name: "薄荷綠" },
  { code: "#A0522D", name: "溫潤拿鐵" },
  { code: "#9B59B6", name: "星砂紫" },
  { code: "#FFFFFF", name: "皎潔雪白" },
  { code: "#333333", name: "極光深炭" }
];

const BG_TEMPLATES = [
  { 
    id: "sweet-pink", 
    name: "🌸 蜜桃粉櫻甜夢", 
    class: "bg-gradient-to-tr from-[#FFF0F5] to-[#FFE4E1]", 
    gradient: ["#FFF0F5", "#FFE4E1"],
    textColor: "#FF799C"
  },
  { 
    id: "cosmic-night", 
    name: "🌌 宇宙極光霓虹", 
    class: "bg-gradient-to-b from-[#130CB7] to-[#52E5E7]", 
    gradient: ["#130CB7", "#52E5E7"],
    textColor: "#FFFFFF"
  },
  { 
    id: "retro-polaroid", 
    name: "📸 經典復古象牙", 
    class: "bg-[#FAF9F6] border-8 border-white shadow-inner", 
    gradient: ["#FAF9F6", "#FAF9F6"],
    textColor: "#333333"
  },
  { 
    id: "lavender-mist", 
    name: "💜 薰衣草星霧", 
    class: "bg-gradient-to-tr from-[#E0C3FC] to-[#8EC5FC]", 
    gradient: ["#E0C3FC", "#8EC5FC"],
    textColor: "#6B5B95"
  }
];

export default function PlogModule({ currentUser }: PlogModuleProps) {
  const [photos, setPhotos] = useState<PhotoPost[]>([]);
  const [friendSnaps, setFriendSnaps] = useState<any[]>([]);
  const [isSnapsLoading, setIsSnapsLoading] = useState(false);
  const [activePhotoTab, setActivePhotoTab] = useState<"snaps" | "upload" | "presets">("snaps");
  const [elements, setElements] = useState<CollageElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentBg, setCurrentBg] = useState(BG_TEMPLATES[0]);
  const [textInput, setTextInput] = useState("");
  const [selectedColor, setSelectedColor] = useState(TEXT_COLORS[0].code);
  const [textSize, setTextSize] = useState(24);
  const [isExporting, setIsExporting] = useState(false);
  const [isPhotosLoading, setIsPhotosLoading] = useState(false);

  // Drag states
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [elementStartPos, setElementStartPos] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Grid collage states
  const [isGridMode, setIsGridMode] = useState(false);
  const [gridType, setGridType] = useState<"4" | "9">("4");
  const [selectedGridPhotos, setSelectedGridPhotos] = useState<(string | null)[]>([null, null, null, null]);
  const [activeGridCellIndex, setActiveGridCellIndex] = useState<number>(0);
  const [snapFilter, setSnapFilter] = useState<string>("all");

  // Stitch/Collage Puzzle tool states
  const [activeModuleTab, setActiveModuleTab] = useState<"canvas" | "stitch">("canvas");
  const [stitchGridType, setStitchGridType] = useState<"4" | "9">("4");
  const [stitchPhotos, setStitchPhotos] = useState<(string | null)[]>([null, null, null, null]);
  const [stitchActiveIndex, setStitchActiveIndex] = useState<number>(0);
  const [stitchTitle, setStitchTitle] = useState<string>("");
  const [stitchCategory, setStitchCategory] = useState<string>("應援");
  const [isStitchSaving, setIsStitchSaving] = useState<boolean>(false);

  // Sync stitch grid length based on stitch grid type selection
  useEffect(() => {
    if (stitchGridType === "4") {
      setStitchPhotos((prev) => {
        const next = [...prev];
        if (next.length > 4) {
          return next.slice(0, 4);
        } else {
          while (next.length < 4) next.push(null);
          return next;
        }
      });
      if (stitchActiveIndex >= 4) {
        setStitchActiveIndex(0);
      }
    } else {
      setStitchPhotos((prev) => {
        const next = [...prev];
        while (next.length < 9) next.push(null);
        return next;
      });
    }
  }, [stitchGridType]);

  const randomFillStitch = () => {
    const pool = [
      ...friendSnaps.map(s => s.imageUrl),
      ...photos.map(p => p.image_url),
      ...PRESET_FALLBACK_IMAGES.map(img => img.url)
    ].filter(Boolean);
    
    if (pool.length === 0) return;
    
    const maxCells = stitchGridType === "4" ? 4 : 9;
    setStitchPhotos(() => {
      const next = [];
      for (let i = 0; i < maxCells; i++) {
        const randomImg = pool[Math.floor(Math.random() * pool.length)];
        next.push(randomImg);
      }
      return next;
    });
  };

  const clearStitch = () => {
    const maxCells = stitchGridType === "4" ? 4 : 9;
    setStitchPhotos(Array(maxCells).fill(null));
    setStitchActiveIndex(0);
  };

  const handleSelectPhotoForStitch = (url: string) => {
    setStitchPhotos((prev) => {
      const next = [...prev];
      next[stitchActiveIndex] = url;
      return next;
    });
    // Auto-advance
    const maxCells = stitchGridType === "4" ? 4 : 9;
    setStitchActiveIndex((prev) => (prev + 1) % maxCells);
  };

  const handleSaveStitchPuzzle = async () => {
    const filledCount = stitchPhotos.filter(Boolean).length;
    if (filledCount === 0) {
      alert("您的拼接拼圖還是空的喔！請先在格子中填入相片 📸");
      return;
    }
    
    setIsStitchSaving(true);
    try {
      const canvasSize = 1000;
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = canvasSize;
      exportCanvas.height = canvasSize;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas context");

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      const gap = 12;
      const pad = 12;
      const availSize = canvasSize - pad * 2;

      const loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = window.Image ? new window.Image() : document.createElement("img");
          img.crossOrigin = "anonymous";
          img.src = url;
          img.onload = () => resolve(img);
          img.onerror = () => {
            const fallbackImg = window.Image ? new window.Image() : document.createElement("img");
            fallbackImg.src = url;
            fallbackImg.onload = () => resolve(fallbackImg);
            fallbackImg.onerror = () => reject(new Error("Image load failed"));
          };
        });
      };

      const drawCoverImage = (
        context: CanvasRenderingContext2D,
        img: HTMLImageElement,
        x: number,
        y: number,
        w: number,
        h: number
      ) => {
        const imgRatio = img.width / img.height;
        const targetRatio = w / h;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;

        if (imgRatio > targetRatio) {
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / targetRatio;
          sy = (img.height - sh) / 2;
        }

        context.drawImage(img, sx, sy, sw, sh, x, y, w, h);
      };

      if (stitchGridType === "4") {
        const cellSize = (availSize - gap) / 2;
        const slots = [
          { x: pad, y: pad },
          { x: pad + cellSize + gap, y: pad },
          { x: pad, y: pad + cellSize + gap },
          { x: pad + cellSize + gap, y: pad + cellSize + gap }
        ];

        for (let i = 0; i < 4; i++) {
          const url = stitchPhotos[i];
          const slot = slots[i];
          if (url) {
            try {
              const img = await loadImage(url);
              drawCoverImage(ctx, img, slot.x, slot.y, cellSize, cellSize);
            } catch (e) {
              console.error(`Failed to load stitch image ${i}:`, e);
              ctx.fillStyle = "#FFF5F7";
              ctx.fillRect(slot.x, slot.y, cellSize, cellSize);
            }
          } else {
            ctx.fillStyle = "#FFF5F7";
            ctx.fillRect(slot.x, slot.y, cellSize, cellSize);
            ctx.fillStyle = "rgba(255, 121, 156, 0.4)";
            ctx.font = "bold 26px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`📸 槽位 ${i + 1}`, slot.x + cellSize / 2, slot.y + cellSize / 2);
          }
        }
      } else {
        const cellSize = (availSize - gap * 2) / 3;
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            const i = row * 3 + col;
            const url = stitchPhotos[i];
            const slotX = pad + col * (cellSize + gap);
            const slotY = pad + row * (cellSize + gap);

            if (url) {
              try {
                const img = await loadImage(url);
                drawCoverImage(ctx, img, slotX, slotY, cellSize, cellSize);
              } catch (e) {
                console.error(`Failed to load stitch image ${i}:`, e);
                ctx.fillStyle = "#FFF5F7";
                ctx.fillRect(slotX, slotY, cellSize, cellSize);
              }
            } else {
              ctx.fillStyle = "#FFF5F7";
              ctx.fillRect(slotX, slotY, cellSize, cellSize);
              ctx.fillStyle = "rgba(255, 121, 156, 0.4)";
              ctx.font = "bold 20px sans-serif";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(`📸 ${i + 1}`, slotX + cellSize / 2, slotY + cellSize / 2);
            }
          }
        }
      }

      ctx.fillStyle = "rgba(255, 121, 156, 0.6)";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("STARRY WISH • GRID COLLAGE", canvasSize - 250, canvasSize - 35);

      const base64DataUrl = exportCanvas.toDataURL("image/png");

      const title = stitchTitle.trim() || `我的應援${stitchGridType}宮格拼接拼圖 💖`;
      const payload = {
        title,
        image_url: base64DataUrl,
        year: String(new Date().getFullYear()),
        category: stitchCategory,
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
        const data = await res.json();
        alert(`🎉 拼接拼圖製作成功並已上傳儲存至 Plog！\n獲得星星幣 +50 🪙`);
        
        fetch("/api/posts/photos")
          .then((r) => r.ok ? r.json() : [])
          .then((d) => setPhotos(d));

        setStitchTitle("");
        const emptyCells = stitchGridType === "4" ? 4 : 9;
        setStitchPhotos(Array(emptyCells).fill(null));
        setStitchActiveIndex(0);
      } else {
        const data = await res.json();
        alert(data.error || "儲存至 Plog 資料表失敗，請重新再試。");
      }

    } catch (error) {
      console.error("Failed to generate and save stitch puzzle:", error);
      alert("生成拼接拼圖時發生錯誤，請檢查相片來源。");
    } finally {
      setIsStitchSaving(false);
    }
  };

  // Sync grid slot length based on 4-grid or 9-grid selection
  useEffect(() => {
    if (gridType === "4") {
      setSelectedGridPhotos((prev) => {
        const next = [...prev];
        if (next.length > 4) {
          return next.slice(0, 4);
        } else {
          while (next.length < 4) next.push(null);
          return next;
        }
      });
      if (activeGridCellIndex >= 4) {
        setActiveGridCellIndex(0);
      }
    } else {
      setSelectedGridPhotos((prev) => {
        const next = [...prev];
        while (next.length < 9) next.push(null);
        return next;
      });
    }
  }, [gridType]);

  const fillGridSlot = (url: string) => {
    setSelectedGridPhotos((prev) => {
      const next = [...prev];
      next[activeGridCellIndex] = url;
      return next;
    });
    // Auto-advance to next slot to make sequential clicking super fast!
    const maxCells = gridType === "4" ? 4 : 9;
    setActiveGridCellIndex((prev) => (prev + 1) % maxCells);
  };

  const randomFillGrid = () => {
    const pool = [
      ...friendSnaps.map(s => s.imageUrl),
      ...photos.map(p => p.image_url),
      ...PRESET_FALLBACK_IMAGES.map(img => img.url)
    ].filter(Boolean);
    
    if (pool.length === 0) return;
    
    const maxCells = gridType === "4" ? 4 : 9;
    setSelectedGridPhotos(() => {
      const next = [];
      for (let i = 0; i < maxCells; i++) {
        const randomImg = pool[Math.floor(Math.random() * pool.length)];
        next.push(randomImg);
      }
      return next;
    });
  };

  const clearGrid = () => {
    const maxCells = gridType === "4" ? 4 : 9;
    setSelectedGridPhotos(Array(maxCells).fill(null));
    setActiveGridCellIndex(0);
  };

  // Fetch friend snaps
  useEffect(() => {
    if (!currentUser) return;
    setIsSnapsLoading(true);
    fetch(`/api/friends/snaps?userId=${currentUser.id}`)
      .then((res) => {
        if (res.ok) return res.json();
        return [];
      })
      .then((data) => {
        setFriendSnaps(data);
      })
      .catch((err) => {
        console.error("Failed to load friend snaps:", err);
      })
      .finally(() => {
        setIsSnapsLoading(false);
      });
  }, [currentUser]);

  // Fetch photos from API
  useEffect(() => {
    setIsPhotosLoading(true);
    fetch("/api/posts/photos")
      .then((res) => {
        if (res.ok) return res.json();
        return [];
      })
      .then((data) => {
        setPhotos(data);
      })
      .catch((err) => {
        console.error("Failed to load album photos:", err);
      })
      .finally(() => {
        setIsPhotosLoading(false);
      });
  }, []);

  // Add Element Helper
  // Helper to estimate dimensions of an element based on its type and attributes
  const getElementHalfDimensions = (el: CollageElement) => {
    let baseW = 150;
    let baseH = 160;

    if (el.type === "sticker") {
      baseW = 42;
      baseH = 42;
    } else if (el.type === "text") {
      const textLen = el.text ? el.text.length : 5;
      const fontSize = el.fontSize || 18;
      baseW = textLen * fontSize * 0.65 + 16;
      baseH = fontSize + 10;
    }

    const scale = el.scale || 1.0;
    return {
      halfW: Math.max(10, (baseW * scale) / 2),
      halfH: Math.max(10, (baseH * scale) / 2),
    };
  };

  // Find a position starting from center (225, 225) that doesn't completely overlap existing elements
  const getNonOverlappingCenter = (type: "image" | "sticker" | "text", scale: number, textLength?: number, fontSize?: number) => {
    let targetX = 225;
    let targetY = 225;

    // Create a temporary element representation to measure its boundary
    const tempEl: CollageElement = {
      id: "temp",
      type,
      scale,
      x: targetX,
      y: targetY,
      rotation: 0,
      text: textLength ? "X".repeat(textLength) : undefined,
      fontSize
    };

    const { halfW, halfH } = getElementHalfDimensions(tempEl);

    let offsetCount = 0;
    
    while (offsetCount < 15) {
      const collides = elements.some(el => {
        const dx = Math.abs(el.x - targetX);
        const dy = Math.abs(el.y - targetY);
        const { halfW: otherHalfW, halfH: otherHalfH } = getElementHalfDimensions(el);
        // Overlap if center distance is very close
        return dx < (halfW + otherHalfW) * 0.4 && dy < (halfH + otherHalfH) * 0.4;
      });

      if (!collides) {
        break;
      }

      // Overlap detected: try shifting
      targetX += 24;
      targetY += 18;
      offsetCount++;

      // If we go out of bounds, wrap/reset to a semi-random spot near the center
      if (targetX + halfW > 450 || targetY + halfH > 450) {
        targetX = 150 + Math.random() * 150;
        targetY = 150 + Math.random() * 150;
      }
    }

    // Strictly clamp within boundaries
    targetX = Math.max(halfW, Math.min(450 - halfW, targetX));
    targetY = Math.max(halfH, Math.min(450 - halfH, targetY));

    return { x: targetX, y: targetY };
  };

  const addImageElement = (url: string) => {
    if (isGridMode) {
      fillGridSlot(url);
      return;
    }
    const scale = 0.4;
    const { x, y } = getNonOverlappingCenter("image", scale);
    const newEl: CollageElement = {
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: "image",
      src: url,
      x,
      y,
      scale,
      rotation: (Math.random() - 0.5) * 10
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const addStickerElement = (char: string) => {
    const scale = 1.0;
    const { x, y } = getNonOverlappingCenter("sticker", scale);
    const newEl: CollageElement = {
      id: `sticker-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: "sticker",
      src: char, // using character as src
      x,
      y,
      scale,
      rotation: (Math.random() - 0.5) * 15
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const addTextElement = () => {
    if (!textInput.trim()) return;
    const scale = 1.0;
    const { x, y } = getNonOverlappingCenter("text", scale, textInput.trim().length, textSize);
    const newEl: CollageElement = {
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: "text",
      text: textInput.trim(),
      color: selectedColor,
      fontSize: textSize,
      x,
      y,
      scale,
      rotation: 0
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
    setTextInput("");
  };

  // Drag elements handler
  const handleElementMouseDown = (e: React.MouseEvent, el: CollageElement) => {
    e.stopPropagation();
    setSelectedId(el.id);
    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setElementStartPos({ x: el.x, y: el.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedId) return;
    const el = elements.find((item) => item.id === selectedId);
    if (!el) return;

    const dx = e.clientX - dragStartPos.x;
    const dy = e.clientY - dragStartPos.y;

    let nextX = elementStartPos.x + dx;
    let nextY = elementStartPos.y + dy;

    // Calculate boundary size
    const { halfW, halfH } = getElementHalfDimensions(el);

    // Keep within the 450x450 canvas area
    nextX = Math.max(halfW, Math.min(450 - halfW, nextX));
    nextY = Math.max(halfH, Math.min(450 - halfH, nextY));

    setElements(
      elements.map((item) =>
        item.id === selectedId ? { ...item, x: nextX, y: nextY } : item
      )
    );
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  // Adjust properties of selected element and clamp its position safely inside limits
  const updateSelectedElement = (property: keyof CollageElement, value: any) => {
    if (!selectedId) return;
    setElements(
      elements.map((item) => {
        if (item.id === selectedId) {
          const updated = { ...item, [property]: value };
          // Clamp to boundaries if scale or other property changed
          const { halfW, halfH } = getElementHalfDimensions(updated);
          updated.x = Math.max(halfW, Math.min(450 - halfW, updated.x));
          updated.y = Math.max(halfH, Math.min(450 - halfH, updated.y));
          return updated;
        }
        return item;
      })
    );
  };

  const deleteSelectedElement = () => {
    if (!selectedId) return;
    setElements(elements.filter((item) => item.id !== selectedId));
    setSelectedId(null);
  };

  const sendToFront = () => {
    if (!selectedId) return;
    const target = elements.find((item) => item.id === selectedId);
    if (!target) return;
    const remaining = elements.filter((item) => item.id !== selectedId);
    setElements([...remaining, target]);
  };

  const sendToBack = () => {
    if (!selectedId) return;
    const target = elements.find((item) => item.id === selectedId);
    if (!target) return;
    const remaining = elements.filter((item) => item.id !== selectedId);
    setElements([target, ...remaining]);
  };

  // Export collage to Image
  const handleExportCollage = async () => {
    if (elements.length === 0 && !isGridMode) {
      alert("拼圖板上還是空的喔！快新增一些相片與文字貼紙吧 🌸");
      return;
    }
    setIsExporting(true);

    try {
      // Create high resolution canvas 1000x1000
      const canvasSize = 1000;
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = canvasSize;
      exportCanvas.height = canvasSize;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) return;

      // Enable smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Preload image elements to avoid blank exports due to async load
      const loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = window.Image ? new window.Image() : document.createElement("img");
          img.crossOrigin = "anonymous";
          img.src = url;
          img.onload = () => resolve(img);
          img.onerror = () => {
            // Fallback to proxy or bypass key
            console.warn(`Failed to load image ${url} crossOrigin anonymously. Retrying with no-referrer.`);
            const fallbackImg = window.Image ? new window.Image() : document.createElement("img");
            fallbackImg.src = url;
            fallbackImg.onload = () => resolve(fallbackImg);
            fallbackImg.onerror = () => reject(new Error("Image load failed"));
          };
        });
      };

      const drawCoverImage = (
        context: CanvasRenderingContext2D,
        img: HTMLImageElement,
        x: number,
        y: number,
        w: number,
        h: number
      ) => {
        const imgRatio = img.width / img.height;
        const targetRatio = w / h;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;

        if (imgRatio > targetRatio) {
          // Image is wider than target
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else {
          // Image is taller than target
          sh = img.width / targetRatio;
          sy = (img.height - sh) / 2;
        }

        context.drawImage(img, sx, sy, sw, sh, x, y, w, h);
      };

      // 1. Draw Background Template or Photo Grid Stitch
      if (isGridMode) {
        // Draw white background gap base
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        // Grid config
        const gap = 12; // Gap size on export canvas
        const pad = 12; // Padding size on export canvas
        const availSize = canvasSize - pad * 2;
        
        if (gridType === "4") {
          const cellSize = (availSize - gap) / 2;
          const slots = [
            { x: pad, y: pad },
            { x: pad + cellSize + gap, y: pad },
            { x: pad, y: pad + cellSize + gap },
            { x: pad + cellSize + gap, y: pad + cellSize + gap }
          ];

          for (let i = 0; i < 4; i++) {
            const url = selectedGridPhotos[i];
            const slot = slots[i];
            if (url) {
              try {
                const img = await loadImage(url);
                drawCoverImage(ctx, img, slot.x, slot.y, cellSize, cellSize);
              } catch (e) {
                console.error(`Failed to load grid image ${i} during export:`, e);
                ctx.fillStyle = "#FFF5F7";
                ctx.fillRect(slot.x, slot.y, cellSize, cellSize);
              }
            } else {
              ctx.fillStyle = "#FFF5F7";
              ctx.fillRect(slot.x, slot.y, cellSize, cellSize);
              // Draw small camera symbol and number
              ctx.fillStyle = "rgba(255, 121, 156, 0.4)";
              ctx.font = "bold 26px sans-serif";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(`📸 槽位 ${i + 1}`, slot.x + cellSize / 2, slot.y + cellSize / 2);
            }
          }
        } else {
          // 9-grid
          const cellSize = (availSize - gap * 2) / 3;
          for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
              const i = row * 3 + col;
              const url = selectedGridPhotos[i];
              const slotX = pad + col * (cellSize + gap);
              const slotY = pad + row * (cellSize + gap);

              if (url) {
                try {
                  const img = await loadImage(url);
                  drawCoverImage(ctx, img, slotX, slotY, cellSize, cellSize);
                } catch (e) {
                  console.error(`Failed to load grid image ${i} during export:`, e);
                  ctx.fillStyle = "#FFF5F7";
                  ctx.fillRect(slotX, slotY, cellSize, cellSize);
                }
              } else {
                ctx.fillStyle = "#FFF5F7";
                ctx.fillRect(slotX, slotY, cellSize, cellSize);
                // Draw small camera symbol and number
                ctx.fillStyle = "rgba(255, 121, 156, 0.4)";
                ctx.font = "bold 20px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(`📸 ${i + 1}`, slotX + cellSize / 2, slotY + cellSize / 2);
              }
            }
          }
        }
      } else {
        // Draw normal background templates
        if (currentBg.id === "retro-polaroid") {
          ctx.fillStyle = "#FAF9F6";
          ctx.fillRect(0, 0, canvasSize, canvasSize);
          // Draw elegant white Polaroid inner border
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(50, 50, canvasSize - 100, canvasSize - 150);
        } else {
          const grad = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
          grad.addColorStop(0, currentBg.gradient[0]);
          grad.addColorStop(1, currentBg.gradient[1]);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvasSize, canvasSize);
        }

        // 2. Drawgrid decorative overlay for cute dreaming themes
        if (currentBg.id === "sweet-pink" || currentBg.id === "lavender-mist") {
          ctx.strokeStyle = "rgba(255, 121, 156, 0.15)";
          ctx.lineWidth = 2;
          const spacing = 50;
          for (let x = 0; x < canvasSize; x += spacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasSize);
            ctx.stroke();
          }
          for (let y = 0; y < canvasSize; y += spacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvasSize, y);
            ctx.stroke();
          }
        }

        // Draw starry galaxy grids for Cosmic aurora theme
        if (currentBg.id === "cosmic-night") {
          ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
          for (let i = 0; i < 40; i++) {
            const starX = Math.random() * canvasSize;
            const starY = Math.random() * canvasSize;
            const starR = 1 + Math.random() * 3;
            ctx.beginPath();
            ctx.arc(starX, starY, starR, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Ratios mapping from 450x450 workspace display to 1000x1000 canvas export
      const scaleFactor = canvasSize / 450;

      // Draw elements sequentially
      for (const el of elements) {
        ctx.save();

        const canvasX = el.x * scaleFactor;
        const canvasY = el.y * scaleFactor;

        // Apply translations
        ctx.translate(canvasX, canvasY);
        ctx.rotate((el.rotation * Math.PI) / 180);

        if (el.type === "image") {
          try {
            const img = await loadImage(el.src!);
            
            // Draw a stylish white polaroid or soft rounded shadow border around images
            const w = img.width;
            const h = img.height;
            const maxDimension = 350; // Max sizing on export canvas
            const ratio = Math.min(maxDimension / w, maxDimension / h);
            const drawW = w * ratio * el.scale;
            const drawH = h * ratio * el.scale;

            // White frame card background
            ctx.fillStyle = "#FFFFFF";
            ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
            ctx.shadowBlur = 12;
            ctx.shadowOffsetX = 4;
            ctx.shadowOffsetY = 6;

            const padding = 12;
            ctx.fillRect(
              -drawW / 2 - padding,
              -drawH / 2 - padding,
              drawW + padding * 2,
              drawH + padding * 2 + 15 // bottom offset like Polaroid
            );

            // Draw image
            ctx.shadowColor = "transparent"; // reset shadow
            ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

            // Write a tiny caption mock if retro
            if (currentBg.id === "retro-polaroid") {
              ctx.fillStyle = "#888888";
              ctx.font = "italic 11px font-serif, 'Inter', sans-serif";
              ctx.fillText("🌟 My Star Wish Memory", -drawW / 2 + 4, drawH / 2 + 10);
            }

          } catch (e) {
            console.error("Skipping image drawing due to load failure:", e);
            // Draw fallback pink cross
            ctx.fillStyle = "#FF799C";
            ctx.fillRect(-50, -50, 100, 100);
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 12px sans-serif";
            ctx.fillText("載入失敗", -24, 4);
          }
        } else if (el.type === "sticker") {
          // Draw cute text sticker
          ctx.font = `bold ${55 * el.scale}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          
          // Draw a soft white bubble text outline for visibility
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 6;
          ctx.strokeText(el.src!, 0, 0);

          ctx.fillText(el.src!, 0, 0);
        } else if (el.type === "text") {
          // Draw text layer
          ctx.font = `bold ${el.fontSize * 1.5}px sans-serif`;
          ctx.fillStyle = el.color!;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          // Add elegant high contrast border/shadow
          ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 2;

          // Draw white background stroke for readable dark texts
          ctx.strokeStyle = el.color === "#FFFFFF" ? "#000000" : "#FFFFFF";
          ctx.lineWidth = 3;
          ctx.strokeText(el.text!, 0, 0);

          ctx.fillText(el.text!, 0, 0);
        }

        ctx.restore();
      }

      // Add elegant watermark signature
      ctx.fillStyle = "rgba(255, 121, 156, 0.4)";
      ctx.font = "bold 13px font-mono, sans-serif";
      ctx.fillText("STARRY WISH • PLOG COLLAGE", canvasSize - 230, canvasSize - 35);

      // Trigger automatic file download
      const dataUrl = exportCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `StarryWish_PLOG_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
      alert("拼圖匯出時遇到了一些問題，可能是相片跨網域安全性 (CORS) 限制，請重試或點擊下方重新生成。");
    } finally {
      setIsExporting(false);
    }
  };

  const selectedElement = elements.find((item) => item.id === selectedId);

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* Decorative subtitle banner */}
      <div className="bg-[#FFF0F4]/90 border-2 border-[#FF799C]/20 rounded-2xl px-5 py-3.5 mb-6 max-w-3xl w-full text-center shadow-sm">
        <h3 className="text-sm font-bold text-[#FF799C] flex items-center justify-center gap-1.5 mb-1">
          <Camera className="h-4.5 w-4.5 animate-bounce" /> 📸 PLOG 星願應援拼圖記錄 🌸
        </h3>
        <p className="text-[10px] text-[#6E4B55]/75 leading-relaxed">
          將珍藏的愛豆應援照、活動相片或是可愛星寵日常，自由拼貼、翻轉、縮放，配上特製心願文字與超萌裝飾貼紙，製作獨一無二的<b>精美同感紀念卡</b>並點擊一鍵匯出儲存！
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 bg-pink-50/60 backdrop-blur-sm p-1.5 rounded-2xl mb-6 w-full max-w-md border border-[#FF799C]/10 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveModuleTab("canvas")}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeModuleTab === "canvas"
              ? "bg-[#FF799C] text-white shadow-sm scale-102"
              : "text-[#6E4B55]/85 hover:bg-white/50"
          }`}
        >
          <Paintbrush className="h-4 w-4" /> 🎨 自由貼紙畫布
        </button>
        <button
          type="button"
          onClick={() => setActiveModuleTab("stitch")}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeModuleTab === "stitch"
              ? "bg-[#FF799C] text-white shadow-sm scale-102"
              : "text-[#6E4B55]/85 hover:bg-white/50"
          }`}
        >
          <Grid className="h-4 w-4" /> 🧩 『拼接拼圖』工具
        </button>
      </div>

      {activeModuleTab === "canvas" ? (
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COMPILER SCREEN: INTERACTIVE PLOG CANVAS (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center bg-white/40 border border-[#FF799C]/15 rounded-[28px] p-5">
          <div className="w-full flex justify-between items-center mb-3">
            <span className="text-[10px] text-gray-500 font-mono">
              拼圖畫布 (450x450 Box) • 點擊物件選取，拖曳以自由移動
            </span>
            <button
              onClick={() => {
                if (confirm("確定要清空畫布上的所有貼圖與文字嗎？")) {
                  setElements([]);
                  setSelectedId(null);
                }
              }}
              className="text-[9px] text-[#FF799C] hover:text-[#FF4B72] bg-[#FF799C]/5 hover:bg-[#FF799C]/10 px-2.5 py-1 rounded-lg border border-[#FF799C]/10 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <Trash2 className="h-3 w-3" /> 清空拼圖
            </button>
          </div>

          {/* Interactive Workspace Screen */}
          <div
            ref={canvasRef}
            onClick={() => setSelectedId(null)} // Clear selection on clicking void canvas
            className={`relative w-full aspect-square max-w-[450px] rounded-2xl overflow-hidden shadow-md select-none border-2 border-[#FF799C]/15 cursor-default transition-all ${currentBg.class}`}
          >
            {/* Template background details (Grids / Stars) */}
            {!isGridMode && (currentBg.id === "sweet-pink" || currentBg.id === "lavender-mist") && (
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,121,156,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,121,156,0.06)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
            )}

            {!isGridMode && currentBg.id === "cosmic-night" && (
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.15)_0%,transparent_60%)]">
                <div className="absolute top-10 left-15 text-white/10 text-lg animate-pulse">⭐</div>
                <div className="absolute top-24 right-12 text-white/20 text-xs">✨</div>
                <div className="absolute bottom-16 left-12 text-white/15 text-sm animate-ping">✨</div>
              </div>
            )}

            {/* Interactive Grid Stitching Background */}
            {isGridMode && (
              <div 
                className="absolute inset-0 grid p-2 gap-2 bg-white pointer-events-auto"
                style={{
                  gridTemplateColumns: gridType === "4" ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))",
                  gridTemplateRows: gridType === "4" ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))",
                }}
              >
                {selectedGridPhotos.map((url, idx) => {
                  const isCellActive = idx === activeGridCellIndex;
                  return (
                    <div
                      key={`canvas-grid-cell-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation(); // Avoid deselection
                        setActiveGridCellIndex(idx);
                      }}
                      className={`relative rounded-xl overflow-hidden transition-all flex flex-col items-center justify-center cursor-pointer select-none border-2 ${
                        isCellActive 
                          ? "border-[#FF799C] ring-2 ring-[#FF799C]/25 shadow-lg scale-[1.02] z-20 bg-[#FFF5F7]" 
                          : "border-gray-200/60 hover:border-[#FF9FA2] hover:scale-[1.01] bg-white"
                      }`}
                    >
                      {url ? (
                        <>
                          <img src={url} alt={`cell-${idx}`} className="w-full h-full object-cover pointer-events-none" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none text-white text-[9px] font-bold">
                            點擊下方相片更換
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-2 text-[#FF799C]/60 pointer-events-none">
                          <Camera className="h-4.5 w-4.5 mb-1 text-[#FF799C]/70" />
                          <span className="text-[9px] font-black">槽位 {idx + 1}</span>
                          <span className="text-[7.5px] text-gray-400">點擊選取</span>
                        </div>
                      )}
                      
                      <div className="absolute top-1 left-1 bg-black/55 text-white text-[7.5px] font-black px-1.5 py-0.5 rounded-full scale-90 select-none">
                        {idx + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Render Canvas collage items */}
            {elements.map((el) => {
              const isSelected = el.id === selectedId;
              return (
                <motion.div
                  key={`${el.id}-${el.x}-${el.y}`}
                  drag
                  dragMomentum={false}
                  dragConstraints={canvasRef}
                  dragElastic={0}
                  onDragStart={() => {
                    setSelectedId(el.id);
                    setIsDragging(true);
                  }}
                  onDragEnd={(event, info) => {
                    setIsDragging(false);
                    let nextX = el.x + info.offset.x;
                    let nextY = el.y + info.offset.y;
                    
                    const { halfW, halfH } = getElementHalfDimensions(el);
                    nextX = Math.max(halfW, Math.min(450 - halfW, nextX));
                    nextY = Math.max(halfH, Math.min(450 - halfH, nextY));

                    setElements(prev =>
                      prev.map(item => item.id === el.id ? { ...item, x: nextX, y: nextY } : item)
                    );
                  }}
                  style={{
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    transform: `translate(-50%, -50%) rotate(${el.rotation}deg) scale(${el.scale})`,
                    position: "absolute",
                    zIndex: isSelected ? 30 : 10,
                  }}
                  className={`absolute origin-center select-none cursor-grab active:cursor-grabbing ${
                    isSelected ? "ring-2 ring-[#FF799C] ring-dashed p-1 bg-white/25 rounded-md" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(el.id);
                  }}
                >
                  {/* Delete button wrapper when selected */}
                  {isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSelectedElement();
                      }}
                      className="absolute -top-7 -right-7 bg-[#FF799C] hover:bg-[#FF4B72] text-white p-1 rounded-full shadow-md hover:scale-110 active:scale-95 transition-all z-40 cursor-pointer"
                      title="刪除物件"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Render based on Type */}
                  {el.type === "image" && (
                    <div className="bg-white p-1.5 shadow-md border border-gray-100 max-w-[140px] flex flex-col rounded-sm pointer-events-none">
                      <img
                        src={el.src}
                        alt="Collage Part"
                        referrerPolicy="no-referrer"
                        className="w-full h-auto object-cover max-h-[140px] rounded-sm pointer-events-none"
                      />
                      {currentBg.id === "retro-polaroid" && (
                        <span className="text-[7px] text-[#888] italic font-serif mt-1 block text-center leading-none">
                          My Wish
                        </span>
                      )}
                    </div>
                  )}

                  {el.type === "sticker" && (
                    <span className="text-4xl filter drop-shadow-md select-none block pointer-events-none">
                      {el.src}
                    </span>
                  )}

                  {el.type === "text" && (
                    <span
                      style={{
                        color: el.color,
                        fontSize: `${el.fontSize}px`,
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                        textShadow: el.color === "#FFFFFF" 
                          ? "1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)" 
                          : "1px 1px 2px rgba(255,255,255,0.9), -1px -1px 2px rgba(255,255,255,0.9)",
                      }}
                      className="font-sans leading-none block select-none px-2 py-0.5 pointer-events-none"
                    >
                      {el.text}
                    </span>
                  )}
                </motion.div>
              );
            })}

            {/* Inline floating controller */}
            {selectedElement && !isDragging && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                style={{
                  left: `${Math.max(130, Math.min(320, selectedElement.x))}px`,
                  top: `${selectedElement.y > 225 ? Math.max(90, selectedElement.y - 145) : Math.min(360, selectedElement.y + 115)}px`,
                  position: "absolute",
                  zIndex: 50,
                }}
                className="absolute transform -translate-x-1/2 w-[260px] bg-white/95 backdrop-blur-md border-2 border-[#FF799C] shadow-2xl rounded-2xl p-3 select-none pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with action icons */}
                <div className="flex justify-between items-center border-b border-[#FF799C]/20 pb-1.5 mb-2">
                  <span className="text-[10px] font-black text-[#FF799C] flex items-center gap-1">
                    <span>✨</span> 實時屬性調整
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); sendToFront(); }}
                      className="p-1 hover:bg-pink-100 rounded text-[#FF799C] transition-all cursor-pointer"
                      title="置於最上層"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); sendToBack(); }}
                      className="p-1 hover:bg-pink-100 rounded text-[#FF799C] transition-all cursor-pointer"
                      title="置於最下層"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSelectedElement(); }}
                      className="p-1 hover:bg-red-50 rounded text-red-500 transition-all cursor-pointer"
                      title="刪除"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Sizing & rotation sliders */}
                <div className="space-y-2">
                  {/* Sizing Slider */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] text-[#6E4B55] font-bold shrink-0 flex items-center gap-0.5 w-18">
                      <Maximize2 className="h-3 w-3 text-[#FF799C]" /> 縮放 {selectedElement.scale.toFixed(1)}x
                    </span>
                    <input
                      type="range"
                      min={0.2}
                      max={3.0}
                      step={0.1}
                      value={selectedElement.scale}
                      onChange={(e) => updateSelectedElement("scale", parseFloat(e.target.value))}
                      className="w-full accent-[#FF799C] h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Rotation Slider */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] text-[#6E4B55] font-bold shrink-0 flex items-center gap-0.5 w-18">
                      <RotateCcw className="h-3 w-3 text-[#FF799C]" /> 旋轉 {selectedElement.rotation}°
                    </span>
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      step={5}
                      value={selectedElement.rotation}
                      onChange={(e) => updateSelectedElement("rotation", parseInt(e.target.value))}
                      className="w-full accent-[#FF799C] h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Color adjustment if text element */}
                  {selectedElement.type === "text" && (
                    <div className="pt-1.5 border-t border-[#FF799C]/10 mt-1">
                      <span className="text-[9px] text-[#6E4B55] font-bold block mb-1">調整文字顏色：</span>
                      <div className="flex gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
                        {TEXT_COLORS.map((color) => (
                          <button
                            key={color.code}
                            onClick={() => updateSelectedElement("color", color.code)}
                            className={`w-4 h-4 rounded-full border transition-all active:scale-90 cursor-pointer flex items-center justify-center shrink-0 ${
                              selectedElement.color === color.code ? "ring-1 ring-[#FF799C] border-white scale-110" : "border-gray-200"
                            }`}
                            style={{ backgroundColor: color.code }}
                            title={color.name}
                          >
                            {selectedElement.color === color.code && (
                              <Check className={`h-2.5 w-2.5 ${color.code === "#FFFFFF" ? "text-black" : "text-white"}`} />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Empty Watermark placeholder */}
            {elements.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-[#6E4B55]/30 pointer-events-none">
                <span className="text-4xl mb-2">📸</span>
                <p className="text-xs font-bold font-serif">這裡還是空白星空板喔</p>
                <p className="text-[9px] mt-1">從右側選單點擊新增：相片、可愛貼紙或心願文字</p>
              </div>
            )}
          </div>

          {/* Export Action Button Trigger */}
          <button
            onClick={handleExportCollage}
            disabled={isExporting}
            className={`w-full max-w-[450px] mt-5 py-3 rounded-2xl text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
              isExporting
                ? "bg-gray-400 cursor-not-allowed animate-pulse"
                : "bg-gradient-to-r from-[#FF799C] to-[#FF9FA2] hover:shadow-[#FF799C]/20 hover:from-[#FF4B72] hover:to-[#FF799C]"
            }`}
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>拼圖繪出與高解析度渲染中... 請稍候</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>🌟 導出拼圖 / 儲存至裝置 (High-DPI PNG)</span>
              </>
            )}
          </button>
        </div>

        {/* RIGHT CONTROL SIDEBARS: EDITORS & STICKERS (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5 text-left">
          
          {/* Section 1: Background Template Options */}
          <div className="bg-white/90 border border-[#FF799C]/15 rounded-2xl p-4 shadow-sm">
            <h4 className="text-xs font-bold text-[#6E4B55] mb-2.5 flex items-center gap-1.5 border-b border-[#FF799C]/10 pb-2">
              <Paintbrush className="h-3.5 w-3.5 text-[#FF799C]" /> 1. 選擇畫布模板樣式
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {BG_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setCurrentBg(tmpl)}
                  className={`p-2.5 rounded-xl border text-[10px] font-bold text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between h-14 ${
                    currentBg.id === tmpl.id
                      ? "border-[#FF799C] bg-[#FF799C]/5 shadow-sm ring-1 ring-[#FF799C]/20"
                      : "border-gray-100 bg-white hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  <span>{tmpl.name}</span>
                  <div className={`w-full h-2 rounded-full ${tmpl.class}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Adding Texts */}
          <div className="bg-white/90 border border-[#FF799C]/15 rounded-2xl p-4 shadow-sm">
            <h4 className="text-xs font-bold text-[#6E4B55] mb-2.5 flex items-center gap-1.5 border-b border-[#FF799C]/10 pb-2">
              <Type className="h-3.5 w-3.5 text-[#FF799C]" /> 2. 添加應援可愛文字
            </h4>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="輸入想寫在拼圖上的可愛話語..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  maxLength={24}
                  className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#FF799C] flex-1 text-[#6E4B55]"
                />
                <button
                  onClick={addTextElement}
                  className="bg-[#FF799C] hover:bg-[#FF4B72] text-white font-bold text-xs px-4 rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> 新增
                </button>
              </div>

              {/* Text configurations */}
              <div className="space-y-2 pt-1">
                {/* Preset colors */}
                <div>
                  <span className="text-[9px] text-gray-400 block mb-1">文字預設色調：</span>
                  <div className="flex flex-wrap gap-1.5">
                    {TEXT_COLORS.map((color) => (
                      <button
                        key={color.code}
                        onClick={() => setSelectedColor(color.code)}
                        className={`w-5 h-5 rounded-full border transition-all active:scale-90 cursor-pointer flex items-center justify-center ${
                          selectedColor === color.code ? "ring-2 ring-[#FF799C] border-white scale-110" : "border-gray-200"
                        }`}
                        style={{ backgroundColor: color.code }}
                        title={color.name}
                      >
                        {selectedColor === color.code && (
                          <Check className={`h-2.5 w-2.5 ${color.code === "#FFFFFF" ? "text-black" : "text-white"}`} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sizing slider */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-[9px] text-gray-400 shrink-0">文字尺寸 ({textSize}px)：</span>
                  <input
                    type="range"
                    min={14}
                    max={64}
                    value={textSize}
                    onChange={(e) => setTextSize(parseInt(e.target.value))}
                    className="w-full accent-[#FF799C] h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Element customizer controls (rendered conditionally if something is selected) */}
          <div className="bg-white/90 border border-[#FF799C]/15 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <h4 className="text-xs font-bold text-[#6E4B55] mb-2.5 flex items-center gap-1.5 border-b border-[#FF799C]/10 pb-2">
              <Sparkles className="h-3.5 w-3.5 text-[#FF799C]" /> 3. 調整選中物件屬性
            </h4>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="輸入想寫在拼圖上的可愛話語..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  maxLength={24}
                  className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#FF799C] flex-1 text-[#6E4B55]"
                />
                <button
                  onClick={addTextElement}
                  className="bg-[#FF799C] hover:bg-[#FF4B72] text-white font-bold text-xs px-4 rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> 新增
                </button>
              </div>

              {/* Text configurations */}
              <div className="space-y-2 pt-1">
                {/* Preset colors */}
                <div>
                  <span className="text-[9px] text-gray-400 block mb-1">文字預設色調：</span>
                  <div className="flex flex-wrap gap-1.5">
                    {TEXT_COLORS.map((color) => (
                      <button
                        key={color.code}
                        onClick={() => setSelectedColor(color.code)}
                        className={`w-5 h-5 rounded-full border transition-all active:scale-90 cursor-pointer flex items-center justify-center ${
                          selectedColor === color.code ? "ring-2 ring-[#FF799C] border-white scale-110" : "border-gray-200"
                        }`}
                        style={{ backgroundColor: color.code }}
                        title={color.name}
                      >
                        {selectedColor === color.code && (
                          <Check className={`h-2.5 w-2.5 ${color.code === "#FFFFFF" ? "text-black" : "text-white"}`} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sizing slider */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-[9px] text-gray-400 shrink-0">文字尺寸 ({textSize}px)：</span>
                  <input
                    type="range"
                    min={14}
                    max={64}
                    value={textSize}
                    onChange={(e) => setTextSize(parseInt(e.target.value))}
                    className="w-full accent-[#FF799C] h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Element customizer controls (rendered conditionally if something is selected) */}
          <div className="bg-white/90 border border-[#FF799C]/15 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <h4 className="text-xs font-bold text-[#6E4B55] mb-2.5 flex items-center gap-1.5 border-b border-[#FF799C]/10 pb-2">
              <Sparkles className="h-3.5 w-3.5 text-[#FF799C]" /> 4. 調整選中物件屬性
            </h4>
            
            {selectedElement ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-pink-50/45 p-2 rounded-xl border border-[#FF799C]/10">
                  <span className="text-[10px] text-[#6E4B55]/90 font-bold">
                    已選定：{selectedElement.type === "image" ? "🖼️ 應援相片" : selectedElement.type === "sticker" ? "🌸 裝飾貼紙" : "✍️ 心願文字"}
                  </span>
                  <button
                    onClick={deleteSelectedElement}
                    className="text-[9px] text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200 transition-all cursor-pointer active:scale-95"
                  >
                    刪除此物
                  </button>
                </div>

                {/* Sliders for scale and rotation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[9px] text-gray-400 shrink-0 flex items-center gap-1">
                      <Maximize2 className="h-3 w-3" /> 大小倍率 ({selectedElement.scale.toFixed(1)}x)
                    </span>
                    <input
                      type="range"
                      min={0.2}
                      max={3.0}
                      step={0.1}
                      value={selectedElement.scale}
                      onChange={(e) => updateSelectedElement("scale", parseFloat(e.target.value))}
                      className="w-full accent-[#FF799C] h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[9px] text-gray-400 shrink-0 flex items-center gap-1">
                      <RotateCcw className="h-3 w-3" /> 旋轉角度 ({selectedElement.rotation}°)
                    </span>
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      step={5}
                      value={selectedElement.rotation}
                      onChange={(e) => updateSelectedElement("rotation", parseInt(e.target.value))}
                      className="w-full accent-[#FF799C] h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Layer hierarchy buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={sendToFront}
                    className="flex items-center justify-center gap-1 py-1.5 rounded-xl border border-gray-100 hover:bg-gray-50 text-[10px] text-gray-600 transition-all active:scale-95 cursor-pointer"
                  >
                    <ArrowUp className="h-3.5 w-3.5 text-gray-400" />
                    <span>置於最上層</span>
                  </button>
                  <button
                    onClick={sendToBack}
                    className="flex items-center justify-center gap-1 py-1.5 rounded-xl border border-gray-100 hover:bg-gray-50 text-[10px] text-gray-600 transition-all active:scale-95 cursor-pointer"
                  >
                    <ArrowDown className="h-3.5 w-3.5 text-gray-400" />
                    <span>置於最下層</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-[10px] text-gray-400">
                💡 點擊拼圖畫布上的任意相片、貼紙或文字，即可在此處調整大小、旋轉、層級 or 進行刪除喔！
              </div>
            )}
          </div>

          {/* Section 4: Album Photos Select & Falling Emojis Sticker Library */}
          <div className="bg-white/90 border border-[#FF799C]/15 rounded-2xl p-4 shadow-sm flex-1 flex flex-col min-h-[220px]">
            <h4 className="text-xs font-bold text-[#6E4B55] mb-2 flex items-center gap-1.5 border-b border-[#FF799C]/10 pb-2">
              <ImageIcon className="h-3.5 w-3.5 text-[#FF799C]" /> 4. 點選相簿圖片 / 可愛貼紙置入
            </h4>

            {/* Sub Tabs: Photos vs Stickers */}
            <div className="flex flex-col flex-1">
              
              {/* Photo Source Tabs */}
              <div className="flex gap-1 bg-pink-50/50 p-1 rounded-xl mb-3 text-[9px] font-bold">
                <button
                  type="button"
                  onClick={() => setActivePhotoTab("snaps")}
                  className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${activePhotoTab === "snaps" ? "bg-[#FF799C] text-white shadow-xs" : "text-[#6E4B55]/70 hover:bg-white/50"}`}
                >
                  💌 與好友互傳
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoTab("upload")}
                  className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${activePhotoTab === "upload" ? "bg-[#FF799C] text-white shadow-xs" : "text-[#6E4B55]/70 hover:bg-white/50"}`}
                >
                  🖼️ 從本機相冊
                </button>
              </div>

              {/* Tab Contents */}
              {activePhotoTab === "snaps" && (
                <div>
                  {isSnapsLoading ? (
                    <div className="flex justify-center items-center py-6 text-[10px] text-gray-400 font-mono">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5 text-[#FF799C]" /> 讀取拍立得照片牆中...
                    </div>
                  ) : friendSnaps.length === 0 ? (
                    <div className="text-[9px] text-gray-400 bg-[#FFF5F7]/50 p-3 rounded-xl border border-pink-100/30 text-center leading-relaxed">
                      💡 目前拍照記錄空空如也！請先在共同飼養區點擊好友列表旁的<b>「📷 拍立得」</b>拍照或發送相片，即可在此處點選拍攝過的照片，製作拼圖導出喔！🌸
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {/* Source Selection Filter Field */}
                      <div className="flex items-center justify-between bg-pink-50/45 p-1.5 rounded-xl border border-[#FF799C]/10 gap-2 mb-1.5">
                        <span className="text-[8.5px] text-[#6E4B55] font-bold">📂 相片來源篩選：</span>
                        <div className="flex bg-white rounded-lg p-0.5 border border-[#FF799C]/25 text-[8px] font-bold">
                          <button
                            type="button"
                            onClick={() => setSnapFilter("all")}
                            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${snapFilter === "all" ? "bg-[#FF799C] text-white" : "text-gray-500 hover:bg-gray-50"}`}
                          >
                            全部互傳
                          </button>
                          <button
                            type="button"
                            onClick={() => setSnapFilter("sent")}
                            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${snapFilter === "sent" ? "bg-[#FF799C] text-white" : "text-gray-500 hover:bg-gray-50"}`}
                          >
                            📤 我發送
                          </button>
                          <button
                            type="button"
                            onClick={() => setSnapFilter("received")}
                            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${snapFilter === "received" ? "bg-[#FF799C] text-white" : "text-gray-500 hover:bg-gray-50"}`}
                          >
                            📥 我收到的
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 max-h-[140px] overflow-y-auto pr-1 py-1">
                        {friendSnaps
                          .filter((snap) => {
                            if (!currentUser) return true;
                            if (snapFilter === "sent") return snap.senderId === currentUser.id;
                            if (snapFilter === "received") return snap.senderId !== currentUser.id;
                            return true;
                          })
                          .map((snap) => (
                            <button
                              key={snap.id}
                              onClick={() => addImageElement(snap.imageUrl)}
                              className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-100 hover:border-[#FF799C] transition-all hover:scale-105 cursor-pointer relative group"
                              title={snap.caption}
                            >
                              <img src={snap.imageUrl} alt="Polaroid snap" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                <Plus className="h-4 w-4 text-white" />
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activePhotoTab === "upload" && (
                <div className="bg-[#FFF5F7]/30 border border-dashed border-[#FF799C]/30 p-3 rounded-xl text-center">
                  <span className="text-[9px] text-gray-500 block mb-2 font-medium">📷 選擇你手機或本機相冊的照片，直接加入拼圖：</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          addImageElement(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="mx-auto text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-[9px] file:font-bold file:bg-[#FF799C]/10 file:text-[#FF799C] file:hover:bg-[#FF799C]/20 transition-all cursor-pointer"
                  />
                  <p className="text-[7.5px] text-gray-400 mt-2">支援 PNG, JPG 等手機相冊照片，即點即加 🌟</p>
                </div>
              )}

              {/* Presets stickers list */}
              <span className="text-[9px] text-[#FF799C] font-semibold mt-4 mb-1">🍥 超萌裝飾貼紙庫：</span>
              <div className="grid grid-cols-6 gap-2 bg-pink-50/20 border border-[#FF799C]/10 p-2.5 rounded-xl max-h-[110px] overflow-y-auto">
                {PRESET_STICKERS.map((stk) => (
                  <button
                    key={stk.char}
                    onClick={() => addStickerElement(stk.char)}
                    className="flex flex-col items-center justify-center p-1.5 bg-white rounded-lg border border-gray-100 hover:border-[#FF799C] transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-sm"
                    title={stk.label}
                  >
                    <span className="text-xl select-none">{stk.char}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
      ) : (
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn text-left">
          {/* LEFT: INTERACTIVE STITCH PREVIEW (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center bg-white/40 border border-[#FF799C]/15 rounded-[28px] p-5">
            <div className="w-full flex justify-between items-center mb-3">
              <span className="text-[10px] text-gray-500 font-mono">
                拼接預覽 (1:1 正方形) • 點擊槽位，再點擊右側照片或好友拍立得填入 📸
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={randomFillStitch}
                  className="text-[9px] bg-pink-50 hover:bg-[#FF799C]/10 text-[#FF799C] border border-[#FF799C]/10 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 active:scale-95 cursor-pointer font-bold"
                >
                  <Shuffle className="h-3 w-3" /> 隨機填滿
                </button>
                <button
                  type="button"
                  onClick={clearStitch}
                  className="text-[9px] text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 transition-all flex items-center gap-1 active:scale-95 cursor-pointer font-bold"
                >
                  <Eraser className="h-3 w-3" /> 清空全部
                </button>
              </div>
            </div>

            {/* Interactive Grid Canvas Box */}
            <div className="relative w-full aspect-square max-w-[450px] rounded-2xl overflow-hidden shadow-md bg-white border-2 border-[#FF799C]/15 p-3 flex flex-col justify-between">
              <div 
                className="grid gap-2 w-full h-full"
                style={{
                  gridTemplateColumns: stitchGridType === "4" ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))",
                }}
              >
                {stitchPhotos.map((url, idx) => {
                  const isActive = idx === stitchActiveIndex;
                  return (
                    <button
                      key={`stitch-slot-${idx}`}
                      type="button"
                      onClick={() => setStitchActiveIndex(idx)}
                      className={`aspect-square rounded-xl border-3 transition-all flex flex-col items-center justify-center overflow-hidden relative cursor-pointer ${
                        isActive 
                          ? "border-[#FF799C] ring-4 ring-[#FF799C]/15 bg-[#FFF0F4]/35 scale-102 z-10" 
                          : "border-gray-100 bg-gray-50/50 hover:border-[#FF9FA2]/60 hover:bg-[#FFF5F7]/30"
                      }`}
                    >
                      {url ? (
                        <img src={url} alt={`stitch-slot-${idx}`} className="w-full h-full object-cover animate-fadeIn" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-gray-400">
                          <Camera className="h-5 w-5 opacity-40" />
                          <span className="text-[10px] font-black">槽位 {idx + 1}</span>
                          <span className="text-[8px] opacity-70">點擊選取</span>
                        </div>
                      )}
                      <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[7px] font-extrabold px-1.5 py-0.5 rounded-full scale-90">
                        {idx + 1}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Premium Signature Label */}
            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
              <span>STARRY WISH • GRID COLLAGE STITCHING SYSTEM v2.0</span>
            </div>
          </div>

          {/* RIGHT: CONTROLS & SOURCES (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5 text-left">
            {/* Card 1: Grid Settings */}
            <div className="bg-white/90 border border-[#FF799C]/15 rounded-2xl p-4 shadow-sm">
              <h4 className="text-xs font-bold text-[#6E4B55] mb-2.5 flex items-center gap-1.5 border-b border-[#FF799C]/10 pb-2">
                <Grid className="h-3.5 w-3.5 text-[#FF799C]" /> 1. 版面排版設定
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 bg-[#FFF0F4]/30 p-2 rounded-xl border border-pink-100/40">
                  <span className="text-[10px] text-[#6E4B55] font-extrabold">選擇拼圖格數：</span>
                  <div className="flex rounded-lg overflow-hidden border border-[#FF799C]/30 text-[9px] font-bold bg-white">
                    <button
                      type="button"
                      onClick={() => setStitchGridType("4")}
                      className={`px-4 py-1.5 transition-all cursor-pointer ${
                        stitchGridType === "4" 
                          ? "bg-[#FF799C] text-white" 
                          : "bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      4宮格 (2x2)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStitchGridType("9")}
                      className={`px-4 py-1.5 border-l border-[#FF799C]/20 transition-all cursor-pointer ${
                        stitchGridType === "9" 
                          ? "bg-[#FF799C] text-white" 
                          : "bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      9宮格 (3x3)
                    </button>
                  </div>
                </div>

                {/* Title and Category */}
                <div className="space-y-2">
                  <div>
                    <label className="text-[9px] text-[#6E4B55] font-bold block mb-1">✍️ 拼圖標題：</label>
                    <input
                      type="text"
                      placeholder="為這張精美拼接拼圖命名吧..."
                      value={stitchTitle}
                      onChange={(e) => setStitchTitle(e.target.value)}
                      maxLength={32}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#FF799C] text-[#6E4B55]"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-[#6E4B55] font-bold block mb-1">🏷️ 分類歸屬：</label>
                    <select
                      value={stitchCategory}
                      onChange={(e) => setStitchCategory(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#FF799C] text-[#6E4B55]"
                    >
                      <option value="應援">✨ 應援日常</option>
                      <option value="星寵">🐾 星寵成長</option>
                      <option value="活動">🎪 節日活動</option>
                      <option value="日常">🌸 歲月靜好</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Photo Source List */}
            <div className="bg-white/90 border border-[#FF799C]/15 rounded-2xl p-4 shadow-sm flex-1 flex flex-col min-h-[300px]">
              <h4 className="text-xs font-bold text-[#6E4B55] mb-2 flex items-center gap-1.5 border-b border-[#FF799C]/10 pb-2">
                <ImageIcon className="h-3.5 w-3.5 text-[#FF799C]" /> 2. 選擇照片填入當前「槽位 {stitchActiveIndex + 1}」
              </h4>

              {/* Subtabs for photo sources */}
              <div className="flex gap-1 bg-pink-50/50 p-1 rounded-xl mb-3 text-[9px] font-bold">
                <button
                  type="button"
                  onClick={() => setActivePhotoTab("snaps")}
                  className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${activePhotoTab === "snaps" ? "bg-[#FF799C] text-white shadow-xs" : "text-[#6E4B55]/70 hover:bg-white/50"}`}
                >
                  💌 好友拍立得
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoTab("presets")}
                  className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${activePhotoTab === "presets" ? "bg-[#FF799C] text-white shadow-xs" : "text-[#6E4B55]/70 hover:bg-white/50"}`}
                >
                  🖼️ 星願相冊
                </button>
              </div>

              {/* Contents list */}
              <div className="flex-1 min-h-[180px] overflow-y-auto pr-1">
                {activePhotoTab === "snaps" ? (
                  <div>
                    {isSnapsLoading ? (
                      <div className="flex justify-center items-center py-6 text-[10px] text-gray-400 font-mono">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5 text-[#FF799C]" /> 讀取好友拍立得中...
                      </div>
                    ) : friendSnaps.length === 0 ? (
                      <div className="text-[9px] text-gray-400 bg-[#FFF5F7]/50 p-3 rounded-xl border border-pink-100/30 text-center leading-relaxed">
                        💡 目前拍照記錄空空如也！
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 py-1">
                        {friendSnaps.map((snap) => (
                          <button
                            key={`stitch-snap-${snap.id}`}
                            type="button"
                            onClick={() => handleSelectPhotoForStitch(snap.imageUrl)}
                            className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-100 hover:border-[#FF799C] transition-all hover:scale-105 cursor-pointer relative group"
                          >
                            <img src={snap.imageUrl} alt="Polaroid snap" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                              <Plus className="h-4 w-4 text-white" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {isPhotosLoading ? (
                      <div className="flex justify-center items-center py-6 text-[10px] text-gray-400">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> 讀取相冊中...
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 py-1">
                        {PRESET_FALLBACK_IMAGES.map((img, idx) => (
                          <button
                            key={`stitch-fallback-${idx}`}
                            type="button"
                            onClick={() => handleSelectPhotoForStitch(img.url)}
                            className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-100 hover:border-[#FF799C] transition-all hover:scale-105 cursor-pointer relative group"
                          >
                            <img src={img.url} alt="Fallback Preset" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                              <Plus className="h-4 w-4 text-white" />
                            </div>
                          </button>
                        ))}
                        {photos.map((photo) => (
                          <button
                            key={`stitch-photo-${photo.id}`}
                            type="button"
                            onClick={() => handleSelectPhotoForStitch(photo.image_url)}
                            className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-100 hover:border-[#FF799C] transition-all hover:scale-105 cursor-pointer relative group"
                          >
                            <img src={photo.image_url} alt={photo.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                              <Plus className="h-4 w-4 text-white" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Upload to feed option */}
              <div className="border-t border-gray-100 pt-3 mt-3">
                <span className="text-[9px] text-gray-500 block mb-1 font-medium">📷 或直接從本機上傳圖片填入槽位：</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        handleSelectPhotoForStitch(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-[9px] file:font-bold file:bg-[#FF799C]/10 file:text-[#FF799C] file:hover:bg-[#FF799C]/20 transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* Action Trigger Card */}
            <div className="bg-white/90 border border-[#FF799C]/15 rounded-2xl p-4 shadow-sm">
              <button
                type="button"
                disabled={isStitchSaving}
                onClick={handleSaveStitchPuzzle}
                className="w-full bg-[#FF799C] hover:bg-[#FF4B72] text-white font-black text-xs py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                {isStitchSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>正在拼接星願拼圖 & 儲存中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                    <span>🧩 完美拼接生成！並儲存至 Plog 畫廊 💖</span>
                  </>
                )}
              </button>
              <p className="text-[8.5px] text-gray-400 text-center mt-2 leading-relaxed">
                * 拼接完成後將會自動繪製 1000x1000 High-DPI 的正方形拼圖，自動上傳至 Supabase plog 資料庫，並獲得 <b>星星幣 +50 🪙</b> 獎勵！
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
