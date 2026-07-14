import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart } from "lucide-react";

interface CupidoIntroProps {
  onComplete: () => void;
}

export default function CupidoIntro({ onComplete }: CupidoIntroProps) {
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number; scale: number; delay: number }[]>([]);
  const [arrowShot, setArrowShot] = useState(false);
  const onCompleteRef = useRef(onComplete);

  // Keep the ref updated with the latest onComplete callback
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    // Generate burst of hearts when the arrow is "shot"
    const timerShot = setTimeout(() => {
      setArrowShot(true);
      const generatedHearts = Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 500,
        y: (Math.random() - 0.5) * 500 - 100,
        scale: Math.random() * 1.5 + 0.5,
        delay: Math.random() * 0.4
      }));
      setHearts(generatedHearts);
    }, 1000);

    const timerEnd = setTimeout(() => {
      onCompleteRef.current();
    }, 3000);

    return () => {
      clearTimeout(timerShot);
      clearTimeout(timerEnd);
    };
  }, []); // Stable empty dependency array ensures timers are never cleared prematurely

  return (
    <motion.div
      onClick={() => onCompleteRef.current()}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0c0611] cursor-pointer select-none"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      title="點擊螢幕任意處跳過 / Click anywhere to skip"
    >
      {/* Sparkles background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,121,156,0.1)_0%,transparent_70%)]" />

      <div className="relative flex flex-col items-center text-center">
        {/* Cupid Logo & Bow Animation */}
        <div className="relative h-48 w-48 flex items-center justify-center">
          <AnimatePresence>
            {!arrowShot ? (
              <motion.div
                key="cupido-bow"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="relative flex items-center justify-center"
              >
                {/* Bow visualization */}
                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 100 100"
                  fill="none"
                  className="text-[#FF799C]"
                >
                  {/* Bow String */}
                  <line x1="30" y1="20" x2="30" y2="80" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                  {/* Drawn String */}
                  <motion.path
                    d="M 30 20 Q 15 50 30 80"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    animate={{ d: ["M 30 20 Q 15 50 30 80", "M 30 20 Q 5 50 30 80", "M 30 20 Q 15 50 30 80"] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                  {/* Arrow */}
                  <motion.path
                    d="M 5 50 L 55 50 M 55 50 L 45 42 M 55 50 L 45 58"
                    stroke="#FFCCDD"
                    strokeWidth="3"
                    fill="none"
                    animate={{ x: [0, -10, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                </svg>
                {/* Heart on arrow tip */}
                <motion.div
                  className="absolute left-[110px]"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <Heart className="h-6 w-6 fill-[#FF799C] text-[#FF799C]" />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="cupido-burst"
                className="absolute flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1.2 }}
                transition={{ type: "spring", stiffness: 100 }}
              >
                {/* Big central crystal heart */}
                <div className="relative">
                  <div className="absolute inset-0 bg-[#FF799C] opacity-40 blur-xl rounded-full scale-125" />
                  <Heart className="h-24 w-24 fill-[#FF799C] text-[#FF799C] drop-shadow-[0_0_15px_rgba(255,121,156,0.8)]" />
                </div>

                {/* Flying hearts burst */}
                {hearts.map((h) => (
                  <motion.div
                    key={h.id}
                    className="absolute"
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                    animate={{ x: h.x, y: h.y, opacity: 0, scale: h.scale }}
                    transition={{ duration: 1.5, delay: h.delay, ease: "easeOut" }}
                  >
                    <Heart className="h-5 w-5 fill-[#FFCCDD] text-[#FF799C]" />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Brand Accents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <span className="text-xs font-mono tracking-[0.4em] text-[#FFCCDD]/70 block mb-2">
            ALL FOR JIYU • ZACK • JEREMY
          </span>
          <h1 className="text-3xl md:text-4xl font-serif tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FFCCDD] to-[#FF799C] font-semibold">
            ALL FOR JIYU Support Platform
          </h1>
          <p className="text-[#FFCCDD]/50 text-sm mt-3 tracking-widest font-sans">
            ALL FOR JIYU
          </p>
        </motion.div>
      </div>

      {/* Skip Hint */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.35, 0.75, 0.35] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-16 left-0 right-0 text-center pointer-events-none"
      >
        <span className="text-[11px] font-sans tracking-widest text-[#FF799C]/80">
          ✨ 點擊螢幕任意處可跳過動畫 / Click anywhere to skip ✨
        </span>
      </motion.div>

      {/* Decorative Branding Line */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <span className="text-[10px] font-mono tracking-[0.2em] text-[#FFCCDD]/30">
          DESIGN BY AMSS
        </span>
      </div>
    </motion.div>
  );
}
