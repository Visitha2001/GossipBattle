import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { CommentItem } from "./CommentItem";
import { ConfirmModal } from "./ConfirmModal";
import Link from "next/link";

interface BattleItemProps {
  battle: any;
  postAuthorId: string;
  onUpdate: () => void;
  leftComments: any[];
  rightComments: any[];
  parentCommentAuthor?: string;
}

export function BattleItem({ battle, postAuthorId, onUpdate, leftComments, rightComments, parentCommentAuthor }: BattleItemProps) {
  const { user } = useAuthStore();
  const [upvotes, setUpvotes] = useState(battle.upvotes?.length || 0);
  const [downvotes, setDownvotes] = useState(battle.downvotes?.length || 0);
  const [hasUpvoted, setHasUpvoted] = useState(battle.upvotes?.includes(user?._id) || false);
  const [hasDownvoted, setHasDownvoted] = useState(battle.downvotes?.includes(user?._id) || false);

  const [leftComment, setLeftComment] = useState("");
  const [rightComment, setRightComment] = useState("");
  const [isLeftSubmitting, setIsLeftSubmitting] = useState(false);
  const [isRightSubmitting, setIsRightSubmitting] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = user?._id === postAuthorId || user?._id === battle.author._id;

  const handleVote = async (voteType: "W" | "L") => {
    if (!user) return;
    try {
      const data = await api.comments.vote(battle._id, voteType);
      setUpvotes(data.upvotes);
      setDownvotes(data.downvotes);
      setHasUpvoted(data.hasUpvoted);
      setHasDownvoted(data.hasDownvoted);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leftComment.trim()) return;
    setIsLeftSubmitting(true);
    try {
      await api.comments.create(battle.post, { 
        content: leftComment, 
        side: "left",
        parentComment: battle._id 
      });
      setLeftComment("");
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLeftSubmitting(false);
    }
  };

  const handleRightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rightComment.trim()) return;
    setIsRightSubmitting(true);
    try {
      await api.comments.create(battle.post, { 
        content: rightComment, 
        side: "right",
        parentComment: battle._id 
      });
      setRightComment("");
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRightSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.comments.delete(battle._id);
      setIsDeleteModalOpen(false);
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border mt-4 overflow-hidden">
      <div className="bg-muted/30 p-3 border-b border-border flex justify-between items-center">
        <div className="text-sm font-bold text-muted-foreground flex items-center gap-2">
          <span>
            Battle created by <Link href={`/profile/${battle.author?.handle}`}><span className="text-foreground hover:underline cursor-pointer" style={{ color: battle.author?.handleColor }}>{battle.author?.handle}</span></Link>
            {parentCommentAuthor && (
              <> on <Link href={`/profile/${parentCommentAuthor}`}><span className="text-foreground hover:underline cursor-pointer">{parentCommentAuthor}</span></Link>'s comment</>
            )}
          </span>
          {canDelete && (
            <button onClick={() => setIsDeleteModalOpen(true)} className="text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 size={14} />
            </button>
          )}
        </div>
        
        <div className="flex gap-1 items-center bg-muted/50 rounded-full px-2 py-1 text-xs">
          <button onClick={() => handleVote("W")} className="flex items-center gap-1 group">
            <span className={`w-4 h-4 flex items-center justify-center rounded text-[8px] font-bold border transition-colors ${hasUpvoted ? 'bg-green-500 border-green-500 text-white' : 'border-green-500 text-green-500 group-hover:bg-green-500/10'}`}>W</span>
            <span className={`font-medium ml-1 ${hasUpvoted ? 'text-green-500' : 'text-muted-foreground group-hover:text-green-500 transition-colors'}`}>{upvotes}</span>
          </button>
          <span className="mx-1 text-border">|</span>
          <button onClick={() => handleVote("L")} className="flex items-center gap-1 group">
            <span className={`w-4 h-4 flex items-center justify-center rounded text-[8px] font-bold border transition-colors ${hasDownvoted ? 'bg-red-500 border-red-500 text-white' : 'border-red-500 text-red-500 group-hover:bg-red-500/10'}`}>L</span>
            <span className={`font-medium ml-1 ${hasDownvoted ? 'text-red-500' : 'text-muted-foreground group-hover:text-red-500 transition-colors'}`}>{downvotes}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-0 relative">
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-background rounded-full w-12 h-12 items-center justify-center border-2 border-border shadow-lg font-extrabold italic text-xl bg-gradient-to-br from-red-500 to-blue-500 text-transparent bg-clip-text">VS</div>
        
        <div className="flex-1 bg-red-500/5 border-r border-border p-3 relative">
          <h4 className="text-red-500 font-bold mb-2 text-center border-b border-red-500/20 pb-2">Agree</h4>
          
          <div className="space-y-2 mb-4 text-left">
            {leftComments.map(c => (
              <CommentItem
                key={c._id}
                comment={c}
                postAuthorId={postAuthorId}
                onReply={() => {}}
                onUpdate={onUpdate}
                replies={[]}
                isInsideBattle={true}
              />
            ))}
          </div>

          {user && (
            <form onSubmit={handleLeftSubmit} className="mt-2 flex gap-2">
              <input
                type="text"
                value={leftComment}
                onChange={(e) => setLeftComment(e.target.value)}
                placeholder="Support Agree..."
                className="w-full border border-red-500/30 rounded-md px-3 py-1 text-sm bg-transparent focus:ring-1 focus:ring-red-500 focus:outline-none"
              />
              <button 
                type="submit" 
                disabled={!leftComment.trim() || isLeftSubmitting}
                className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-1 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[60px]"
              >
                {isLeftSubmitting ? <Loader2 size={14} className="animate-spin" /> : "Post"}
              </button>
            </form>
          )}
        </div>

        <div className="flex-1 bg-blue-500/5 p-3">
          <h4 className="text-blue-500 font-bold mb-2 text-center border-b border-blue-500/20 pb-2">Disagree</h4>
          
          <div className="space-y-2 mb-4 text-left">
            {rightComments.map(c => (
              <CommentItem
                key={c._id}
                comment={c}
                postAuthorId={postAuthorId}
                onReply={() => {}}
                onUpdate={onUpdate}
                replies={[]}
                isInsideBattle={true}
              />
            ))}
          </div>

          {user && (
            <form onSubmit={handleRightSubmit} className="mt-2 flex gap-2">
              <input
                type="text"
                value={rightComment}
                onChange={(e) => setRightComment(e.target.value)}
                placeholder="Support Disagree..."
                className="w-full border border-blue-500/30 rounded-md px-3 py-1 text-sm bg-transparent focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <button 
                type="submit" 
                disabled={!rightComment.trim() || isRightSubmitting}
                className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 px-3 py-1 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[60px]"
              >
                {isRightSubmitting ? <Loader2 size={14} className="animate-spin" /> : "Post"}
              </button>
            </form>
          )}
        </div>
      </div>
      
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Battle"
        description="Are you sure you want to delete this battle? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
