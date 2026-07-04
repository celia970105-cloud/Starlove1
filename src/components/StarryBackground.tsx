import React, { useEffect, useState } from "react";

export default function StarryBackground() {
  const [stars, setStars] = useState<{ id: number; top: number; left: number; size: number; delay: number }[]>([]);

  useEffect(() => {
    // Generate static random stars on mount to prevent hydration mismatch and performance issues
    const generatedStars = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 5
    }));
    setStars(generatedStars);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-gradient-to-b from-[#FFF6F2] via-[#FFF9F6] to-[#FFF0F4]">
      {/* Aurora and Nebula Glows */}
      <div className="absolute top-[-10%] left-[-10%] h-[60%] w-[60%] rounded-full bg-gradient-to-br from-[#FF799C]/10 to-[#FFCCDD]/0 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[70%] w-[70%] rounded-full bg-gradient-to-tl from-[#FFCCDD]/15 to-[#FF799C]/0 blur-[130px]" />
      <div className="absolute top-[40%] left-[30%] h-[40%] w-[40%] rounded-full bg-[#FF799C]/8 blur-[100px]" />

      {/* Sparkling Stars */}
      <div className="absolute inset-0">
        {stars.map((star) => {
          // Some stars are pink, some are gold, some are white
          const starColors = ["bg-[#FF799C]", "bg-[#FFCCDD]", "bg-amber-300", "bg-white"];
          const colorClass = starColors[star.id % starColors.length];
          return (
            <div
              key={star.id}
              className={`absolute rounded-full animate-star-glow ${colorClass}`}
              style={{
                top: `${star.top}%`,
                left: `${star.left}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                animationDelay: `${star.delay}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          );
        })}
      </div>

      {/* Constellation grid lines (subtle) */}
      <div 
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 121, 156, 0.2) 1px, transparent 0)`,
          backgroundSize: "40px 40px"
        }}
      />
    </div>
  );
}
