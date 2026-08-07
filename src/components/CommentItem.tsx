import { useState } from "react";
import { Heart, Reply, EyeOff } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";

interface CommentItemProps {
  comment: any;
  postAuthorId: string;
  onReply: (commentId: string, handle: string) => void;
  onUpdate: () => void;
  replies?: any[];
}

export function CommentItem({ comment, postAuthorId, onReply, onUpdate, replies = [] }: CommentItemProps) {
  const { user } = useAuthStore();
  const [isLiked, setIsLiked] = useState(comment.likes?.includes(user?._id) || false);
  const [likes, setLikes] = useState(comment.likes?.length || 0);

  const handleLike = async () => {
    if (!user) return;
    try {
      const data = await api.comments.like(comment._id);
      setLikes(data.likes);
      setIsLiked(data.isLiked);
    } catch (err) {
      console.error(err);
    }
  };

  const handleHide = async () => {
    try {
      await api.comments.hide(comment._id);
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const isPostAuthor = user?._id === postAuthorId;
  const isHiddenForOthers = comment.isHidden && !isPostAuthor;

  const renderContent = (text: string) => {
    const parts = text.split(/([@#]\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return <span key={i} className="text-primary hover:underline cursor-pointer font-medium">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className={`flex flex-col gap-2 ${comment.parentComment ? 'ml-8 mt-2' : 'mt-4'}`}>
      <div className={`flex gap-2 ${comment.isHidden ? 'opacity-60' : ''}`}>
        <div
          className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold"
          style={{ backgroundColor: comment.author?.handleColor || "var(--primary)" }}
        >
          {comment.author?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="bg-muted p-2 rounded-lg text-sm inline-block min-w-[150px]">
            <div className="font-bold mr-2 text-xs mb-1 flex items-center justify-between">
              <span>{comment.author.handle}</span>
              {comment.isHidden && isPostAuthor && (
                <span className="text-[10px] bg-destructive/20 text-destructive px-1 rounded ml-2 border border-destructive/30">Hidden</span>
              )}
            </div>
            {isHiddenForOthers ? (
              <span className="text-muted-foreground italic text-xs">This comment was hidden by the author</span>
            ) : (
              <div>{renderContent(comment.content)}</div>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 ml-1">
            <button 
              onClick={handleLike} 
              className={`flex items-center gap-1 hover:text-primary ${isLiked ? 'text-primary' : ''}`}
            >
              <Heart size={12} className={isLiked ? 'fill-current' : ''} /> {likes}
            </button>
            {!comment.parentComment && (
              <button 
                onClick={() => onReply(comment._id, comment.author.handle)}
                className="flex items-center gap-1 hover:text-primary"
              >
                <Reply size={12} /> Reply
              </button>
            )}
            {isPostAuthor && (
              <button 
                onClick={handleHide}
                className="flex items-center gap-1 hover:text-destructive"
                title={comment.isHidden ? "Unhide comment" : "Hide comment"}
              >
                <EyeOff size={12} /> {comment.isHidden ? 'Unhide' : 'Hide'}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {replies.length > 0 && (
        <div className="space-y-1">
          {replies.map(reply => (
            <CommentItem 
              key={reply._id} 
              comment={reply} 
              postAuthorId={postAuthorId} 
              onReply={onReply}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
