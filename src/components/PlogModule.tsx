import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Camera, Image as ImageIcon, Sparkles, Heart, Trash2, Download, 
  Plus, Maximize2, RotateCcw, ArrowUp, ArrowDown, Type, Check, Paintbrush, RefreshCw, X
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
  { url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500", title: "優雅星寵貓貓" },
  { url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500", title: "活力萌寵柴柴" },
  { url: "https://images.unsplash.com/photo-1535268647977-a403b69fc756?w=500", title: "治癒系小海豹" },
  { url: "https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=500", title: "軟糯星空幼犬" }
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
    if (elements.length === 0) {
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

      // 1. Draw Background Template
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
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onClick={() => setSelectedId(null)} // Clear selection on clicking void canvas
            className={`relative w-full aspect-square max-w-[450px] rounded-2xl overflow-hidden shadow-md select-none border-2 border-[#FF799C]/15 cursor-default transition-all ${currentBg.class}`}
          >
            {/* Template background details (Grids / Stars) */}
            {(currentBg.id === "sweet-pink" || currentBg.id === "lavender-mist") && (
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,121,156,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,121,156,0.06)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
            )}

            {currentBg.id === "cosmic-night" && (
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.15)_0%,transparent_60%)]">
                <div className="absolute top-10 left-15 text-white/10 text-lg animate-pulse">⭐</div>
                <div className="absolute top-24 right-12 text-white/20 text-xs">✨</div>
                <div className="absolute bottom-16 left-12 text-white/15 text-sm animate-ping">✨</div>
              </div>
            )}

            {/* Render Canvas collage items */}
            {elements.map((el) => {
              const isSelected = el.id === selectedId;
              return (
                <div
                  key={el.id}
                  onMouseDown={(e) => handleElementMouseDown(e, el)}
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
                    <div className="bg-white p-1.5 shadow-md border border-gray-100 max-w-[140px] flex flex-col rounded-sm">
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
                    <span className="text-4xl filter drop-shadow-md select-none block">
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
                      className="font-sans leading-none block select-none px-2 py-0.5"
                    >
                      {el.text}
                    </span>
                  )}
                </div>
              );
            })}

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
                💡 點擊拼圖畫布上的任意相片、貼紙或文字，即可在此處調整大小、旋轉、層級或進行刪除喔！
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
              <span className="text-[9px] text-[#FF799C] font-semibold mb-1">📷 星空相簿已上傳圖片：</span>
              
              {isPhotosLoading ? (
                <div className="flex justify-center items-center py-8 text-[10px] text-gray-400">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> 讀取相簿中...
                </div>
              ) : photos.length === 0 ? (
                <div className="space-y-2 py-2">
                  <div className="text-[9px] text-gray-400 bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-center leading-relaxed">
                    您的相片庫目前還沒有審核通過的相片喔。別擔心！我們先為您提供了數張<b>超可愛萌寵範本圖</b>方便您立刻遊玩拼接：
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_FALLBACK_IMAGES.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => addImageElement(img.url)}
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-100 hover:border-[#FF799C] transition-all hover:scale-105 cursor-pointer relative group"
                        title={`新增 ${img.title}`}
                      >
                        <img src={img.url} alt="Fallback Preset" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                          <Plus className="h-4 w-4 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-[140px] overflow-y-auto pr-1 py-1">
                  {photos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => addImageElement(photo.image_url)}
                      className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-100 hover:border-[#FF799C] transition-all hover:scale-105 cursor-pointer relative group"
                      title={photo.title}
                    >
                      <img src={photo.image_url} alt={photo.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <Plus className="h-4 w-4 text-white" />
                      </div>
                    </button>
                  ))}
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
    </div>
  );
}
