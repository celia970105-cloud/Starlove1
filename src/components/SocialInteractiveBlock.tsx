import React, { useState, useEffect, useRef } from "react";
import { Heart, Star, MessageCircle, Share2, Trash2, Send, Smile } from "lucide-react";
import { User, Comment } from "../types";

interface SocialInteractiveBlockProps {
  currentUser: User | null;
  postId: string;
  postType: "photos" | "videos" | "music" | "letters" | "artworks" | "candies";
  initialLikes?: number;
  initialFavorites?: number;
  onUpdateCounts?: () => void;
}

export default function SocialInteractiveBlock({
  currentUser,
  postId,
  postType,
  initialLikes = 0,
  initialFavorites = 0,
  onUpdateCounts
}: SocialInteractiveBlockProps) {
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [favoritesCount, setFavoritesCount] = useState(initialFavorites);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  const emojis = ["🌸", "✨", "💖", "🌙", "🎵", "⭐", "🦄", "🐾", "🍰", "🍭", "🧸", "🎉"];

  useEffect(() => {
    // Reset state when postId changes
    setLikesCount(initialLikes);
    setFavoritesCount(initialFavorites);
    setIsLiked(false);
    setIsFavorited(false);
    fetchComments();
    checkUserInteractions();
  }, [postId, postType]);

  const checkUserInteractions = async () => {
    if (!currentUser) return;
    try {
      // We can fetch from feed latest/hot or a dedicated interaction checker.
      // Alternatively, we query the feed list to see if liked_by_me and favorited_by_me are true,
      // or we can fetch directly from user's likes/favorites store if available.
      // Let's do a fast verification using the user's favorites endpoint:
      const favoritesRes = await fetch(`/api/social/favorites/${currentUser.id}`);
      if (favoritesRes.ok) {
        const favs = await favoritesRes.json();
        const found = favs.some((f: any) => f.id === postId);
        setIsFavorited(found);
      }
      
      // For likes, let's fetch the post detail or rely on client-side cache fallback
      const cachedLike = localStorage.getItem(`starry_like_${postId}_${currentUser.id}`);
      setIsLiked(cachedLike === "true");
    } catch (e) {
      console.error(e);
    }
  };

  const fetchComments = async () => {
    setIsCommentsLoading(true);
    try {
      const res = await fetch(`/api/social/comments/${postId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setIsCommentsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      alert("請先登入後再進行互動喔 ✦");
      return;
    }

    try {
      const res = await fetch("/api/social/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          postId,
          postType
        })
      });

      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.liked);
        setLikesCount(prev => data.liked ? prev + 1 : Math.max(0, prev - 1));
        localStorage.setItem(`starry_like_${postId}_${currentUser.id}`, data.liked ? "true" : "false");
        if (onUpdateCounts) onUpdateCounts();
      }
    } catch (err) {
      console.error("Like interaction failed:", err);
    }
  };

  const handleFavorite = async () => {
    if (!currentUser) {
      alert("請先登入後再進行收藏喔 ✦");
      return;
    }

    try {
      const res = await fetch("/api/social/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          postId,
          postType
        })
      });

      if (res.ok) {
        const data = await res.json();
        setIsFavorited(data.favorited);
        setFavoritesCount(prev => data.favorited ? prev + 1 : Math.max(0, prev - 1));
        if (onUpdateCounts) onUpdateCounts();
      }
    } catch (err) {
      console.error("Favorite interaction failed:", err);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/#post-${postId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }).catch(err => {
      console.error("Share copy failed:", err);
    });
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("請先登入後再留下悄悄話喔 ✦");
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch("/api/social/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          postId,
          postType,
          content: newComment.trim()
        })
      });

      if (res.ok) {
        setNewComment("");
        setShowEmojiPicker(false);
        await fetchComments();
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        if (onUpdateCounts) onUpdateCounts();
      }
    } catch (err) {
      console.error("Comment submission failed:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("確定要刪除這條留言嗎？")) return;

    try {
      const res = await fetch(`/api/social/comment/${commentId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        await fetchComments();
        if (onUpdateCounts) onUpdateCounts();
      } else {
        alert("刪除失敗");
      }
    } catch (err) {
      console.error("Comment deletion failed:", err);
    }
  };

  const insertEmoji = (emoji: string) => {
    setNewComment(prev => prev + emoji);
  };

  return (
    <div className="flex flex-col h-full space-y-4 bg-white rounded-2xl">
      {/* Top action metrics row */}
      <div className="flex justify-between items-center py-2.5 px-3 bg-[#FFF6F2]/40 rounded-xl border border-[#FF799C]/10">
        <div className="flex items-center gap-4">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs font-mono font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer ${isLiked ? "text-red-500 font-bold" : "text-[#6E4B55]/75 hover:text-red-500"}`}
          >
            <Heart className={`h-4.5 w-4.5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            <span>{likesCount}</span>
          </button>

          {/* Favorite */}
          <button
            onClick={handleFavorite}
            className={`flex items-center gap-1.5 text-xs font-mono font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer ${isFavorited ? "text-amber-500 font-bold" : "text-[#6E4B55]/75 hover:text-amber-500"}`}
          >
            <Star className={`h-4.5 w-4.5 ${isFavorited ? "fill-amber-500 text-amber-500" : ""}`} />
            <span>{favoritesCount}</span>
          </button>

          {/* Comments Count */}
          <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#6E4B55]/75">
            <MessageCircle className="h-4.5 w-4.5" />
            <span>{comments.length}</span>
          </div>
        </div>

        {/* Share */}
        <div className="relative">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-mono text-[#6E4B55]/75 hover:text-[#FF799C] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
            <span>分享</span>
          </button>
          {shareSuccess && (
            <span className="absolute bottom-6 right-0 bg-black/80 text-white text-[9px] px-2 py-1 rounded-md whitespace-nowrap animate-fade-in shadow-md">
              🎉 應援連結已複製！
            </span>
          )}
        </div>
      </div>

      {/* Comment Section Panel */}
      <div className="flex flex-col flex-1 min-h-[160px] max-h-[300px]">
        <div className="text-xs font-mono font-bold text-[#FF799C] mb-2 uppercase flex items-center gap-1.5">
          <span>🌸 應援留言板 • Comments</span>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[220px]">
          {isCommentsLoading ? (
            <div className="text-center py-6 text-[10px] text-[#6E4B55]/50 font-mono">
              讀取留言中...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-xs font-serif text-[#6E4B55]/40 italic bg-[#FFF6F2]/25 rounded-xl border border-dashed border-[#FF799C]/5">
              還沒有人留下留言呢...<br />快做第一個留下溫暖應援的人吧 ✦
            </div>
          ) : (
            comments.map((comment) => {
              const isAuthor = currentUser?.id === comment.user_id;
              const isAdmin = currentUser?.role === "admin";
              return (
                <div key={comment.id} className="group flex gap-2.5 items-start p-2 rounded-xl hover:bg-[#FFF6F2]/30 transition-all text-xs">
                  <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 border border-[#FF799C]/10 bg-[#FFF6F2]">
                    <img src={comment.avatar} alt={comment.username} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#6E4B55]">{comment.username}</span>
                      <span className="text-[9px] text-[#6E4B55]/40 font-mono">
                        {new Date(comment.created_at).toLocaleDateString("zh-TW")}
                      </span>
                    </div>
                    <p className="text-[#6E4B55]/85 mt-0.5 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                  </div>
                  
                  {/* Delete Button */}
                  {(isAuthor || isAdmin) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 text-[#6E4B55]/40 hover:text-red-500 transition-all shrink-0 cursor-pointer"
                      title="刪除這則留言"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
          <div ref={commentsEndRef} />
        </div>
      </div>

      {/* Message input bar */}
      <form onSubmit={handlePostComment} className="relative pt-2 border-t border-[#FF799C]/10">
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1.5 rounded-lg hover:bg-[#FFF6F2] text-[#6E4B55]/60 hover:text-[#FF799C] transition-all cursor-pointer"
            title="添加表情符號"
          >
            <Smile className="h-4.5 w-4.5" />
          </button>
          
          <input
            type="text"
            placeholder={currentUser ? "輸入暖心應援留言..." : "請先登入後再發表評論喔 ✦"}
            disabled={!currentUser || isSubmittingComment}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 bg-[#FFF6F2]/60 border border-[#FF799C]/20 focus:border-[#FF799C] focus:outline-none text-xs text-[#6E4B55] px-3 py-2 rounded-xl transition-all"
          />

          <button
            type="submit"
            disabled={!currentUser || isSubmittingComment || !newComment.trim()}
            className="p-2 bg-gradient-to-r from-[#FF799C] to-[#FFCCDD] text-white rounded-xl shadow-md transition-all hover:opacity-95 active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Emoji selector drawer */}
        {showEmojiPicker && (
          <div className="absolute bottom-11 left-0 bg-white border border-[#FF799C]/20 p-2.5 rounded-2xl shadow-xl z-20 w-full animate-fade-in">
            <p className="text-[10px] text-[#6E4B55]/50 mb-1.5 font-mono">暖心應援 Emoji 表情：</p>
            <div className="grid grid-cols-6 gap-1.5">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="text-lg hover:bg-[#FFF6F2] p-1 rounded-lg active:scale-90 transition-all cursor-pointer text-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
