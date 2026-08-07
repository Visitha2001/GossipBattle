import { useState } from "react";
import { Reply, EyeOff, ArrowUp, ArrowDown, Edit2, Trash2, Swords } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { ConfirmModal } from "./ConfirmModal";
import { BattleItem } from "./BattleItem";

interface CommentItemProps {
  comment: any;
  postAuthorId: string;
  onReply: (commentId: string, handle: string) => void;
  onUpdate: () => void;
  replies?: any[];
  allComments?: any[];
  isInsideBattle?: boolean;
}

export function CommentItem({ comment, postAuthorId, onReply, onUpdate, replies = [], allComments = [], isInsideBattle = false }: CommentItemProps) {
  const { user } = useAuthStore();
  const [upvotes, setUpvotes] = useState(comment.upvotes?.length || 0);
  const [downvotes, setDownvotes] = useState(comment.downvotes?.length || 0);
  const [hasUpvoted, setHasUpvoted] = useState(comment.upvotes?.includes(user?._id) || false);
  const [hasDownvoted, setHasDownvoted] = useState(comment.downvotes?.includes(user?._id) || false);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleVote = async (voteType: "W" | "L") => {
    if (!user) return;
    try {
      const data = await api.comments.vote(comment._id, voteType);
      setUpvotes(data.upvotes);
      setDownvotes(data.downvotes);
      setHasUpvoted(data.hasUpvoted);
      setHasDownvoted(data.hasDownvoted);
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    setIsSavingEdit(true);
    try {
      await api.comments.edit(comment._id, editContent);
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.comments.delete(comment._id);
      setIsDeleteModalOpen(false);
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartBattle = async () => {
    if (!user) return;
    try {
      await api.comments.create(comment.post, {
        content: "Battle Created",
        isBattle: true,
        parentComment: comment._id
      });
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const isPostAuthor = user?._id === postAuthorId;
  const isCommentAuthor = user?._id === comment.author._id;
  const canDelete = isPostAuthor || isCommentAuthor;
  const isHiddenForOthers = comment.isHidden && !isPostAuthor;

  const renderContent = (text: string) => {
    const parts = text.split(/([@#]\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        const handle = part.substring(1);
        return <span key={i} className="text-primary hover:underline cursor-pointer font-medium">{handle}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className={`flex flex-col gap-2 ${comment.parentComment && !isInsideBattle ? 'ml-8 mt-2 relative' : 'mt-3'}`}>
      <div className={`flex gap-2 ${comment.isHidden ? 'opacity-60' : ''}`}>
        <div
          className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold"
          style={{ backgroundColor: comment.author?.handleColor || "var(--primary)" }}
        >
          {comment.author?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="bg-muted px-4 py-2 rounded-2xl rounded-tl-sm text-sm inline-block min-w-[150px] relative border border-primary/40">
            {/* Optional tail for the bubble */}
            <div className="absolute top-0 -left-1 w-2 h-2 bg-muted rounded-br-sm" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>
            
            <div className="font-bold mr-2 text-xs mb-1 flex items-center justify-between">
              <span style={{ color: comment.author?.handleColor }}>@{comment.author?.handle?.replace('@', '')}</span>
              <div className="flex items-center">
                {comment.isHidden && isPostAuthor && (
                  <span className="text-[10px] bg-destructive/20 text-destructive px-1 rounded ml-2 border border-destructive/30 mr-2">Hidden</span>
                )}
                {isCommentAuthor && (
                  <button onClick={() => setIsEditing(!isEditing)} className="text-muted-foreground hover:text-primary ml-2">
                    <Edit2 size={12} />
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => setIsDeleteModalOpen(true)} className="text-muted-foreground hover:text-destructive ml-2">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
            {isHiddenForOthers ? (
              <span className="text-muted-foreground italic text-xs">This comment was hidden by the author</span>
            ) : isEditing ? (
              <form onSubmit={handleEditSubmit} className="mt-1">
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-background border border-input rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-1">
                  <button type="button" onClick={() => setIsEditing(false)} className="text-[10px] text-muted-foreground">Cancel</button>
                  <button type="submit" disabled={isSavingEdit} className="text-[10px] bg-primary text-primary-foreground px-2 rounded">Save</button>
                </div>
              </form>
            ) : (
              <div>{renderContent(comment.content)}</div>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 ml-1">
            <div className="flex gap-1 items-center bg-muted/50 rounded-full px-2 py-0.5">
              <button onClick={() => handleVote("W")} className={`flex items-center hover:text-green-500 transition-colors ${hasUpvoted ? 'text-green-500' : ''}`}>
                <ArrowUp size={12} />
                <span className="font-medium ml-1">{upvotes}</span>
              </button>
              <span className="mx-1 text-border/50">|</span>
              <button onClick={() => handleVote("L")} className={`flex items-center hover:text-red-500 transition-colors ${hasDownvoted ? 'text-red-500' : ''}`}>
                <ArrowDown size={12} />
                <span className="font-medium ml-1">{downvotes}</span>
              </button>
            </div>
            {!comment.parentComment && (
              <>
                <button 
                  onClick={() => onReply(comment._id, comment.author.handle)}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <Reply size={12} /> Reply
                </button>
                <button 
                  onClick={handleStartBattle}
                  className="flex items-center gap-1 hover:text-primary ml-2"
                >
                  <Swords size={12} /> Start Battle
                </button>
              </>
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
      
      {!isHiddenForOthers && replies.length > 0 && (
        <div className="space-y-1 border-l-2 border-primary/30 ml-3 pl-3 pt-1 mt-1">
          {replies.map(reply => (
            reply.isBattle ? (
              <BattleItem
                key={reply._id}
                battle={reply}
                postAuthorId={postAuthorId}
                onUpdate={onUpdate}
                leftComments={allComments.filter((c: any) => c.parentComment === reply._id && c.side === "left")}
                rightComments={allComments.filter((c: any) => c.parentComment === reply._id && c.side === "right")}
                parentCommentAuthor={comment.author?.handle}
              />
            ) : (
              <CommentItem 
                key={reply._id} 
                comment={reply} 
                postAuthorId={postAuthorId} 
                onReply={onReply}
                onUpdate={onUpdate}
                replies={allComments.filter((c: any) => c.parentComment === reply._id)}
                allComments={allComments}
              />
            )
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
