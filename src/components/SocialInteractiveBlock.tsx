import React, { useState } from "react";
import { Share2 } from "lucide-react";
import { User } from "../types";

interface SocialInteractiveBlockProps {
  currentUser: User | null;
  postId: string;
  postType: "photos" | "videos" | "music" | "letters" | "artworks" | "candies";
  initialLikes?: number;
  initialFavorites?: number;
  onUpdateCounts?: () => void;
}

export default function SocialInteractiveBlock({
  postId,
}: SocialInteractiveBlockProps) {
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/#post-${postId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }).catch(err => {
      console.error("Share copy failed:", err);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-[#FFF6F2]/30 border border-[#FF799C]/10 rounded-2xl text-center space-y-2">
      <p className="text-[10px] font-mono tracking-wider text-[#6E4B55]/60 uppercase">
        SHARE THIS SUPPORT • 分享此應援
      </p>
      
      <div className="relative w-full">
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#FF799C]/25 bg-white text-[#FF799C] font-semibold text-xs hover:bg-[#FF799C]/5 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>複製專屬分享連結</span>
        </button>
        {shareSuccess && (
          <span className="absolute left-1/2 -translate-x-1/2 -top-10 bg-black/85 text-white text-[10px] px-3 py-1.5 rounded-lg whitespace-nowrap animate-fade-in shadow-lg font-sans">
            🎉 應援連結已複製成功！
          </span>
        )}
      </div>
    </div>
  );
}
