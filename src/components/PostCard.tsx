"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { CommentSection } from "./CommentSection";
import { ConfirmModal } from "./ConfirmModal";
import { ShareModal } from "./ShareModal";
import { Heart, MessageSquare, Share2, Trash2, Eye } from "lucide-react";

export function PostCard({ post, onUpdate }: { post: any; onUpdate: () => void }) {
  const { user } = useAuthStore();
  const [showComments, setShowComments] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [isLiked, setIsLiked] = useState(
    post.likes?.includes(user?._id) || false
  );
  const [views, setViews] = useState(post.views || 0);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const hasViewed = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasViewed.current) {
          hasViewed.current = true;
          api.posts.view(post._id).then((data) => setViews(data.views)).catch(console.error);
        }
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [post._id]);

  const handleLike = async () => {
    try {
      const data = await api.posts.like(post._id);
      setLikes(data.likes);
      setIsLiked(data.isLiked);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.posts.delete(post._id);
      setIsDeleteModalOpen(false);
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderContent = (text: string) => {
    const parts = text.split(/([@#]\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return <span key={i} className="text-primary hover:underline cursor-pointer font-medium">{part}</span>;
      }
      if (part.startsWith("#")) {
        return <span key={i} className="text-primary hover:underline cursor-pointer">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div ref={cardRef} className="bg-card rounded-xl p-4 shadow-sm border border-border mb-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: post.author?.handleColor || "var(--primary)" }}
          >
            {post.author?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-bold">{post.author?.name}</div>
            <div className="text-xs text-muted-foreground">@{post.author?.handle}</div>
          </div>
        </div>
            {user && user._id === post.author?._id && (
              <button 
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center space-x-1 hover:text-destructive transition-colors focus:outline-none"
              >
                <Trash2 size={18} />
              </button>
            )}
      </div>

      <p className="text-sm mb-3 whitespace-pre-wrap">{renderContent(post.content)}</p>

      {post.imageUrl && (
        <img src={post.imageUrl} alt="Post image" className="rounded-lg w-full max-h-[400px] object-cover mb-3" />
      )}

      <div className="flex items-center justify-between text-muted-foreground pt-3 border-t border-border mt-3 text-sm">
        <div className="flex gap-4">
          <button onClick={handleLike} className={`flex items-center gap-1 hover:text-primary transition-colors ${isLiked ? 'text-primary' : ''}`}>
            <Heart size={18} className={isLiked ? 'fill-current' : ''} />
            <span>{likes}</span>
          </button>
          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1 hover:text-primary transition-colors">
            <MessageSquare size={18} />
            <span>{post.commentsCount || 0}</span>
          </button>
          <button onClick={() => setIsShareModalOpen(true)} className="flex items-center gap-1 hover:text-primary transition-colors">
            <Share2 size={18} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <Eye size={16} />
          <span>{views}</span>
        </div>
      </div>

      {showComments && (
        <div className="border-t p-4">
          <CommentSection postId={post._id} postAuthorId={post.author?._id} />
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        postId={post._id} 
      />
    </div>
  );
}
