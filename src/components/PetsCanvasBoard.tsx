import React, { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  X, Check, RotateCcw, Paintbrush, Eraser, Trash2, Undo, 
  Sparkles, Palette, HelpCircle, Eye, EyeOff
} from "lucide-react";

interface PetsCanvasBoardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  initialDataUrl?: string;
  petName: string;
}

const PRESET_COLORS = [
  { name: "心型深桃", value: "#FF4B72" },
  { name: "櫻花粉紅", value: "#FF799C" },
  { name: "草莓起泡", value: "#FFAEC9" },
  { name: "星光琥珀", value: "#FFEB3B" },
  { name: "微光奶茶", value: "#F5C7A9" },
  { name: "流星晴空", value: "#4EA8DE" },
  { name: "精靈淡紫", value: "#B5179E" },
  { name: "森林抹茶", value: "#4CAF50" },
  { name: "蓬蓬白雪", value: "#FFFFFF" },
  { name: "極夜木炭", value: "#4A373D" }
];

export default function PetsCanvasBoard({
  isOpen,
  onClose,
  onSave,
  initialDataUrl = "",
  petName
}: PetsCanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#FF4B72");
  const [brushSize, setBrushSize] = useState(5);
  const [toolMode, setToolMode] = useState<"brush" | "eraser">("brush");
  const [showGuideline, setShowGuideline] = useState(true);
  
  // History stack for Undo
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    // Small delay to ensure modal is mounted and canvas element exists
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Use 300x300 high resolution backing for canvas
      canvas.width = 300;
      canvas.height = 300;
      canvas.style.width = "300px";
      canvas.style.height = "300px";

      const context = canvas.getContext("2d");
      if (!context) return;

      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = brushColor;
      context.lineWidth = brushSize;
      contextRef.current = context;

      // Load initial data if present
      if (initialDataUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          context.drawImage(img, 0, 0, 300, 300);
          saveToHistory();
        };
        img.src = initialDataUrl;
      } else {
        // Clear canvas initially (fully transparent)
        context.clearRect(0, 0, 300, 300);
        saveToHistory();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Update canvas options when brushColor, brushSize, or toolMode changes
  useEffect(() => {
    const context = contextRef.current;
    if (!context) return;

    context.lineWidth = brushSize;
    if (toolMode === "eraser") {
      context.globalCompositeOperation = "destination-out";
    } else {
      context.globalCompositeOperation = "source-over";
      context.strokeStyle = brushColor;
    }
  }, [brushColor, brushSize, toolMode]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    // Check if touch event
    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      const touch = e.touches[0];
      return {
        x: ((touch.clientX - rect.left) / rect.width) * canvas.width,
        y: ((touch.clientY - rect.top) / rect.height) * canvas.height
      };
    } else {
      return {
        x: ((e.clientX - rect.left) / rect.width) * canvas.width,
        y: ((e.clientY - rect.top) / rect.height) * canvas.height
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    
    const context = contextRef.current;
    if (!context) return;

    context.beginPath();
    context.moveTo(x, y);
    // Draw a single dot immediately on click/touch
    context.lineTo(x, y);
    context.stroke();
    
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    
    const context = contextRef.current;
    if (!context) return;

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const context = contextRef.current;
    if (context) {
      context.closePath();
    }
    setIsDrawing(false);
    saveToHistory();
  };

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setHistory(prev => {
      // Limit history stack size to 25 to optimize memory
      const nextStack = [...prev, dataUrl];
      if (nextStack.length > 25) {
        nextStack.shift();
      }
      return nextStack;
    });
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    // Pop the current state
    const newHistory = [...history];
    newHistory.pop(); // remove current state
    const prevState = newHistory[newHistory.length - 1];

    setHistory(newHistory);

    // Render back the state
    context.clearRect(0, 0, 300, 300);
    const img = new Image();
    img.onload = () => {
      // Temporary restore composite operation to draw the history item
      const currentOp = context.globalCompositeOperation;
      context.globalCompositeOperation = "source-over";
      context.drawImage(img, 0, 0, 300, 300);
      context.globalCompositeOperation = currentOp;
    };
    img.src = prevState;
  };

  const handleClear = () => {
    if (window.confirm("確定要清除目前畫板上的所有筆跡嗎？")) {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      if (!canvas || !context) return;

      context.clearRect(0, 0, 300, 300);
      saveToHistory();
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Extract the raw image as base64 DataURL
    const dataUrl = canvas.toDataURL();
    onSave(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4A373D]/65 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white/95 border border-[#FF799C]/20 rounded-[32px] p-6 max-w-lg w-full shadow-2xl relative flex flex-col items-center"
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-left">
            <span className="p-1.5 bg-[#FFF0F3] text-[#FF799C] rounded-xl">
              <Sparkles className="h-4.5 w-4.5 animate-pulse" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-[#6E4B55] font-serif">
                為 {petName} 繪製自定義外觀
              </h2>
              <p className="text-[10px] text-[#6E4B55]/70">
                繪製帽子、表情、裝飾，完成後保存直接套用在寵物身上喔！
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-[#FFF0F3] text-[#6E4B55]/60 hover:text-[#FF799C] rounded-full transition-all cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* DRAWING ZONE */}
        <div className="relative w-[300px] h-[300px] bg-gradient-to-b from-[#FFF5F7] to-[#FFE8EE] border-4 border-[#FF799C]/20 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center mb-4">
          
          {/* Template guideline layer (SVG Star outline) */}
          {showGuideline && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 select-none scale-110">
              {/* Pet Outline guideline */}
              <svg width="220" height="220" viewBox="0 0 100 100">
                <path
                  d="M 50 5 L 63 37 L 97 37 L 70 58 L 81 92 L 50 72 L 19 92 L 30 58 L 3 37 L 37 37 Z"
                  fill="#FF799C"
                  stroke="#FF4B72"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />
                {/* Bow guideline */}
                <path d="M 28 30 Q 23 25 28 20 Q 33 25 28 30 Z" fill="none" stroke="#FF4B72" strokeWidth="1.5" strokeDasharray="2 2" />
                <path d="M 28 30 Q 33 35 28 40 Q 23 35 28 30 Z" fill="none" stroke="#FF4B72" strokeWidth="1.5" strokeDasharray="2 2" />
                <circle cx="28" cy="30" r="2" fill="#FF4B72" />

                {/* Facial layout references */}
                <circle cx="41" cy="48" r="3" fill="#FF4B72" />
                <circle cx="59" cy="48" r="3" fill="#FF4B72" />
                <path d="M 46 54 Q 50 58 54 54" stroke="#FF4B72" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
          )}

          {/* Canvas Element */}
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="absolute inset-0 cursor-pencil z-10 touch-none bg-transparent"
          />
        </div>

        {/* PALETTE / TOOLS */}
        <div className="w-full space-y-4">
          
          {/* Preset Color Swatches */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-[#6E4B55]/70 font-semibold block text-left flex items-center gap-1">
              <Palette className="h-3 w-3 text-[#FF799C]" /> 畫筆顏色選擇
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => {
                    setBrushColor(c.value);
                    setToolMode("brush");
                  }}
                  style={{ backgroundColor: c.value }}
                  className={`h-6.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer active:scale-95 ${c.value === "#FFFFFF" ? "border-[#FF799C]/25" : "border-transparent"} ${brushColor === c.value && toolMode === "brush" ? "ring-2 ring-[#FF799C] scale-105 shadow-sm" : "hover:scale-102"}`}
                  title={c.name}
                >
                  {brushColor === c.value && toolMode === "brush" && (
                    <span className={`text-[10px] font-bold ${c.value === "#FFFFFF" || c.value === "#FFEB3B" || c.value === "#FFAEC9" ? "text-gray-700" : "text-white"}`}>
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Brush controls, Tool modes and Options */}
          <div className="grid grid-cols-2 gap-4 items-center pt-1">
            {/* Brush Size Slider */}
            <div className="space-y-1 text-left">
              <span className="text-[10px] text-[#6E4B55]/70 font-semibold block">
                畫筆大小: {brushSize}px
              </span>
              <input
                type="range"
                min="1"
                max="25"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-full accent-[#FF799C] h-1.5 bg-[#FFF0F3] rounded-lg cursor-pointer"
              />
            </div>

            {/* Custom Color Picker & Toggle Guideline */}
            <div className="flex gap-2 justify-end">
              <div className="relative">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => {
                    setBrushColor(e.target.value);
                    setToolMode("brush");
                  }}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-[#FF799C]/20 bg-white p-0.5"
                  title="自定義調色盤"
                />
              </div>

              {/* Guideline Toggle */}
              <button
                onClick={() => setShowGuideline(!showGuideline)}
                className={`p-2 rounded-xl border transition-all cursor-pointer text-xs font-bold ${showGuideline ? "bg-[#FFF0F3] border-[#FF799C]/30 text-[#FF799C]" : "bg-white border-gray-100 text-[#6E4B55]/70"}`}
                title={showGuideline ? "隱藏寵物星體對齊輔助線" : "顯示寵物星體對齊輔助線"}
              >
                {showGuideline ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Action Tools */}
          <div className="grid grid-cols-4 gap-2 pt-1 border-t border-[#FF799C]/10">
            {/* Draw Brush mode */}
            <button
              onClick={() => setToolMode("brush")}
              className={`py-1.5 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-0.5 cursor-pointer transition-all ${toolMode === "brush" ? "bg-[#FF799C] text-white border-transparent shadow-sm" : "bg-white border-[#FF799C]/10 text-[#6E4B55] hover:bg-[#FFF6F2]"}`}
            >
              <Paintbrush className="h-3.5 w-3.5" />
              <span>彩筆</span>
            </button>

            {/* Eraser Mode */}
            <button
              onClick={() => setToolMode("eraser")}
              className={`py-1.5 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-0.5 cursor-pointer transition-all ${toolMode === "eraser" ? "bg-[#FF799C] text-white border-transparent shadow-sm" : "bg-white border-[#FF799C]/10 text-[#6E4B55] hover:bg-[#FFF6F2]"}`}
            >
              <Eraser className="h-3.5 w-3.5" />
              <span>橡皮擦</span>
            </button>

            {/* Undo stroke */}
            <button
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="py-1.5 rounded-xl border border-[#FF799C]/10 text-[#6E4B55] bg-white hover:bg-[#FFF6F2] text-[10px] font-bold flex flex-col items-center gap-0.5 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Undo className="h-3.5 w-3.5" />
              <span>復原 ({Math.max(0, history.length - 1)})</span>
            </button>

            {/* Trash Clear */}
            <button
              onClick={handleClear}
              className="py-1.5 rounded-xl border border-[#FF799C]/10 text-[#FF799C] bg-white hover:bg-[#FFF0F3] text-[10px] font-bold flex flex-col items-center gap-0.5 cursor-pointer transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>清空</span>
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="w-full grid grid-cols-2 gap-3 mt-5 pt-3 border-t border-[#FF799C]/10">
          <button
            onClick={onClose}
            className="w-full bg-[#FFF0F3] hover:bg-[#FFE0E6] text-[#FF799C] border border-[#FF799C]/25 py-2 rounded-2xl text-xs font-semibold tracking-wide transition-all cursor-pointer active:scale-95"
          >
            取消繪製
          </button>
          <button
            onClick={handleSave}
            className="w-full bg-[#FF799C] hover:bg-[#FF799C]/90 text-white py-2 rounded-2xl text-xs font-semibold tracking-wide transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
          >
            <Check className="h-4 w-4" />
            保存並套用
          </button>
        </div>
      </motion.div>
    </div>
  );
}
