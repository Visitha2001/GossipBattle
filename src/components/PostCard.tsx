"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { CommentSection } from "./CommentSection";
import { ConfirmModal } from "./ConfirmModal";
import { ShareModal } from "./ShareModal";
import { CreatePostModal } from "./CreatePostModal";
import { MessageSquare, Share2, Trash2, Eye, ArrowUp, ArrowDown, Edit2 } from "lucide-react";

export function PostCard({ post, onUpdate }: { post: any; onUpdate: () => void }) {
  const { user } = useAuthStore();
  const [showComments, setShowComments] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [upvotes, setUpvotes] = useState(post.upvotes?.length || 0);
  const [downvotes, setDownvotes] = useState(post.downvotes?.length || 0);
  const [hasUpvoted, setHasUpvoted] = useState(post.upvotes?.includes(user?._id) || false);
  const [hasDownvoted, setHasDownvoted] = useState(post.downvotes?.includes(user?._id) || false);
  const [views, setViews] = useState(post.views || 0);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
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

  const handleVote = async (voteType: "W" | "L") => {
    if (!user) return;
    try {
      const data = await api.posts.vote(post._id, voteType);
      setUpvotes(data.upvotes);
      setDownvotes(data.downvotes);
      setHasUpvoted(data.hasUpvoted);
      setHasDownvoted(data.hasDownvoted);
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
            <div className="font-bold">
              {post.author?.name} 
              {post.feeling && <span className="font-normal text-muted-foreground ml-1">is feeling {post.feeling}</span>}
            </div>
            <div className="text-xs text-muted-foreground">
              @{post.author?.handle?.replace('@', '')}
            </div>
          </div>
        </div>
        {user && user._id === post.author?._id && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center space-x-1 hover:text-primary transition-colors focus:outline-none text-muted-foreground"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center space-x-1 hover:text-destructive transition-colors focus:outline-none text-muted-foreground"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <p className="text-sm mb-3 whitespace-pre-wrap">{renderContent(post.content)}</p>

      {post.imageUrls && post.imageUrls.length > 0 && (
        <div className={`gap-2 mb-3 ${post.imageUrls.length === 1 ? '' : 'grid aspect-square'} ${post.imageUrls.length === 2 ? 'grid-cols-2' : ''} ${post.imageUrls.length >= 4 ? 'grid-cols-2 grid-rows-2' : ''}`}>
          {post.imageUrls.length === 1 && (
            <img src={post.imageUrls[0]} alt="Post image" className="rounded-lg w-full max-h-[400px] object-cover" />
          )}
          {post.imageUrls.length === 2 && post.imageUrls.map((url: string, index: number) => (
            <img key={index} src={url} alt={`Post image ${index}`} className="rounded-lg w-full h-full object-cover" />
          ))}
          {post.imageUrls.length === 3 && (
            <div className="grid grid-cols-2 gap-2 w-full h-full">
              <div className="grid grid-rows-2 gap-2 h-full">
                <img src={post.imageUrls[1]} alt="Post image 1" className="rounded-lg w-full h-full object-cover" />
                <img src={post.imageUrls[2]} alt="Post image 2" className="rounded-lg w-full h-full object-cover" />
              </div>
              <div className="h-full">
                <img src={post.imageUrls[0]} alt="Post image 0" className="rounded-lg w-full h-full object-cover" />
              </div>
            </div>
          )}
          {post.imageUrls.length >= 4 && post.imageUrls.slice(0, 4).map((url: string, index: number) => (
            <img key={index} src={url} alt={`Post image ${index}`} className="rounded-lg w-full h-full object-cover" />
          ))}
        </div>
      )}
      
      {/* Fallback for old posts with imageUrl */}
      {post.imageUrl && (!post.imageUrls || post.imageUrls.length === 0) && (
        <img src={post.imageUrl} alt="Post image" className="rounded-lg w-full max-h-[400px] object-cover mb-3" />
      )}

      <div className="flex items-center justify-between text-muted-foreground pt-3 border-t border-border mt-3 text-sm">
        <div className="flex gap-4">
          <div className="flex gap-1 items-center bg-muted/50 rounded-full px-2 py-1">
            <button onClick={() => handleVote("W")} className={`flex items-center hover:text-green-500 transition-colors ${hasUpvoted ? 'text-green-500' : ''}`}>
              <ArrowUp size={16} />
              <span className="font-medium ml-1">{upvotes}</span>
            </button>
            <span className="mx-1 text-border">|</span>
            <button onClick={() => handleVote("L")} className={`flex items-center hover:text-red-500 transition-colors ${hasDownvoted ? 'text-red-500' : ''}`}>
              <ArrowDown size={16} />
              <span className="font-medium ml-1">{downvotes}</span>
            </button>
          </div>
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
      <CreatePostModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onPostCreated={onUpdate}
        editPost={post}
      />
    </div>
  );
}
