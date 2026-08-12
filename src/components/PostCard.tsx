"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { CommentSection } from "./CommentSection";
import { ConfirmModal } from "./ConfirmModal";
import { ShareModal } from "./ShareModal";
import { CreatePostModal } from "./CreatePostModal";
import { ImageSliderModal } from "./ImageSliderModal";
import { MessageSquare, Share2, Trash2, Eye, Edit2, UserPlus, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function PostCard({ post, onUpdate }: { post: any; onUpdate: () => void }) {
  const { user } = useAuthStore();
  const [showComments, setShowComments] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [upvotes, setUpvotes] = useState(post.upvotes?.length || 0);
  const [downvotes, setDownvotes] = useState(post.downvotes?.length || 0);
  const [hasUpvoted, setHasUpvoted] = useState(post.upvotes?.includes(user?._id) || false);
  const [hasDownvoted, setHasDownvoted] = useState(post.downvotes?.includes(user?._id) || false);
  const [views, setViews] = useState(post.views || 0);
  const [isFollowing, setIsFollowing] = useState(user?.following?.includes(post.author?._id) || false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const commentId = searchParams?.get("comment");
    if (commentId && typeof window !== "undefined" && window.location.hash === `#${post._id}`) {
      setShowComments(true);
      // We will let CommentSection handle the scrolling once it fetches comments
    }
  }, [searchParams, post._id]);

  useEffect(() => {
    if (user?.following && post.author?._id) {
      setIsFollowing(user.following.includes(post.author._id));
    }
  }, [user?.following, post.author?._id]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [sliderIndex, setSliderIndex] = useState(0);
  
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
    
    // Optimistic Update
    const prevUpvoted = hasUpvoted;
    const prevDownvoted = hasDownvoted;
    const prevUpvotes = upvotes;
    const prevDownvotes = downvotes;

    let newUpvotes = upvotes;
    let newDownvotes = downvotes;

    if (voteType === "W") {
      if (hasUpvoted) {
        newUpvotes--;
        setHasUpvoted(false);
      } else {
        newUpvotes++;
        setHasUpvoted(true);
        if (hasDownvoted) {
          newDownvotes--;
          setHasDownvoted(false);
        }
      }
    } else {
      if (hasDownvoted) {
        newDownvotes--;
        setHasDownvoted(false);
      } else {
        newDownvotes++;
        setHasDownvoted(true);
        if (hasUpvoted) {
          newUpvotes--;
          setHasUpvoted(false);
        }
      }
    }

    setUpvotes(newUpvotes);
    setDownvotes(newDownvotes);

    try {
      const data = await api.posts.vote(post._id, voteType);
      // Sync with server if needed
      setUpvotes(data.upvotes);
      setDownvotes(data.downvotes);
      setHasUpvoted(data.hasUpvoted);
      setHasDownvoted(data.hasDownvoted);
    } catch (err) {
      console.error(err);
      // Revert on error
      setUpvotes(prevUpvotes);
      setDownvotes(prevDownvotes);
      setHasUpvoted(prevUpvoted);
      setHasDownvoted(prevDownvoted);
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

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await api.users.follow(post.author._id);
      setIsFollowing(res.following);
      
      if (user) {
        const newFollowing = res.following 
          ? [...(user.following || []), post.author._id]
          : (user.following || []).filter(id => id !== post.author._id);
        useAuthStore.getState().setUser({ ...user, following: newFollowing });
      }

      if (res.following) toast.success(`Followed ${post.author.handle}`);
      else toast.success(`Unfollowed ${post.author.handle}`);
    } catch (err) {
      toast.error("Failed to follow user");
    }
  };

  const renderContent = (text: string) => {
    const parts = text.split(/([@#]\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return <Link key={i} href={`/profile/${part}`} className="text-primary hover:underline cursor-pointer font-medium" onClick={(e) => e.stopPropagation()}>{part}</Link>;
      }
      if (part.startsWith("#")) {
        return <span key={i} className="text-primary hover:underline cursor-pointer">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div id={post._id} ref={cardRef} className="bg-card rounded-xl p-2 md:p-3 shadow-sm border border-border mb-2 md:mb-3 scroll-mt-20">
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {post.author?.avatar ? (
            <img 
              src={post.author.avatar} 
              alt={`${post.author.name}'s avatar`} 
              className="w-10 h-10 rounded-full border object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: post.author?.handleColor || "var(--primary)" }}
            >
              {post.author?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="break-words">{post.author?.name}</span>
              {post.feeling && <span className="font-normal text-sm text-muted-foreground">is feeling {post.feeling}</span>}
              {user && user._id !== post.author?._id && (
                <button
                  onClick={handleFollow}
                  className="text-xs flex items-center gap-1 text-primary hover:bg-primary/10 px-2 py-0.5 rounded-full transition-colors"
                >
                  <UserPlus size={12} />
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>
            <Link href={`/profile/${post.author?.handle}`}>
              <div 
                className="text-xs text-muted-foreground hover:underline cursor-pointer"
                style={{ color: post.author?.handleColor }}
              >
                {post.author?.handle}
              </div>
            </Link>
          </div>
        </div>
        {user && user._id === post.author?._id && (
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 text-muted-foreground hover:bg-muted rounded-md transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
                <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-md shadow-md z-20 w-32 overflow-hidden flex flex-col py-1">
                  <button 
                    onClick={() => { setIsMenuOpen(false); setIsEditModalOpen(true); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 text-foreground"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button 
                    onClick={() => { setIsMenuOpen(false); setIsDeleteModalOpen(true); }}
                    className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-muted flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <p className="text-sm mb-3 whitespace-pre-wrap">{renderContent(post.content)}</p>

      {post.imageUrls && post.imageUrls.length > 0 && (
        <div className={`gap-2 mb-3 ${post.imageUrls.length === 1 ? '' : 'grid aspect-square'} ${post.imageUrls.length === 2 ? 'grid-cols-2' : ''} ${post.imageUrls.length >= 4 ? 'grid-cols-2 grid-rows-2' : ''}`}>
          {post.imageUrls.length === 1 && (
            <img 
              src={post.imageUrls[0]} 
              alt="Post image" 
              className="rounded-lg w-full max-h-[400px] object-cover cursor-pointer" 
              onClick={() => { setSliderIndex(0); setIsSliderOpen(true); }}
            />
          )}
          {post.imageUrls.length === 2 && post.imageUrls.map((url: string, index: number) => (
            <img 
              key={index} 
              src={url} 
              alt={`Post image ${index}`} 
              className="rounded-lg w-full h-full object-cover cursor-pointer" 
              onClick={() => { setSliderIndex(index); setIsSliderOpen(true); }}
            />
          ))}
          {post.imageUrls.length === 3 && (
            <div className="grid grid-cols-2 gap-2 w-full h-full">
              <div className="grid grid-rows-2 gap-2 h-full">
                <img 
                  src={post.imageUrls[1]} 
                  alt="Post image 1" 
                  className="rounded-lg w-full h-full object-cover cursor-pointer" 
                  onClick={() => { setSliderIndex(1); setIsSliderOpen(true); }}
                />
                <img 
                  src={post.imageUrls[2]} 
                  alt="Post image 2" 
                  className="rounded-lg w-full h-full object-cover cursor-pointer" 
                  onClick={() => { setSliderIndex(2); setIsSliderOpen(true); }}
                />
              </div>
              <div className="h-full">
                <img 
                  src={post.imageUrls[0]} 
                  alt="Post image 0" 
                  className="rounded-lg w-full h-full object-cover cursor-pointer" 
                  onClick={() => { setSliderIndex(0); setIsSliderOpen(true); }}
                />
              </div>
            </div>
          )}
          {post.imageUrls.length >= 4 && post.imageUrls.slice(0, 4).map((url: string, index: number) => (
            <div 
              key={index} 
              className="relative w-full h-full cursor-pointer rounded-lg overflow-hidden"
              onClick={() => { setSliderIndex(index); setIsSliderOpen(true); }}
            >
              <img src={url} alt={`Post image ${index}`} className="w-full h-full object-cover" />
              {index === 3 && post.imageUrls.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-3xl">
                  +{post.imageUrls.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Fallback for old posts with imageUrl */}
      {post.imageUrl && (!post.imageUrls || post.imageUrls.length === 0) && (
        <img 
          src={post.imageUrl} 
          alt="Post image" 
          className="rounded-lg w-full max-h-[400px] object-cover mb-3 cursor-pointer" 
          onClick={() => { setSliderIndex(0); setIsSliderOpen(true); }}
        />
      )}

      <div className="flex items-center justify-between text-muted-foreground pt-3 border-t border-border mt-3 text-sm">
        <div className="flex gap-4">
          <div className="flex gap-2 items-center">
            <button onClick={() => handleVote("W")} className={`flex items-center gap-2 pl-4 pr-1.5 py-1 rounded-full text-xs font-bold transition-colors ${hasUpvoted ? 'bg-green-500 text-white' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}>
              W <span className={`flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[10px] ${hasUpvoted ? 'bg-white/30' : 'bg-green-500/20'}`}>{upvotes}</span>
            </button>
            <button onClick={() => handleVote("L")} className={`flex items-center gap-2 pl-4 pr-1.5 py-1 rounded-full text-xs font-bold transition-colors ${hasDownvoted ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}>
              L <span className={`flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[10px] ${hasDownvoted ? 'bg-white/30' : 'bg-red-500/20'}`}>{downvotes}</span>
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
        <div className="border-t p-1 md:p-3">
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
        url={`${window.location.origin}/#${post._id}`} 
      />
      <ImageSliderModal
        isOpen={isSliderOpen}
        onClose={() => setIsSliderOpen(false)}
        images={post.imageUrls && post.imageUrls.length > 0 ? post.imageUrls : [post.imageUrl].filter(Boolean)}
        initialIndex={sliderIndex}
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
