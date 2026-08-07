"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { CommentItem } from "./CommentItem";
import { BattleItem } from "./BattleItem";
import { Swords, Loader2, SmilePlus } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';

export function CommentSection({ postId, postAuthorId }: { postId: string, postAuthorId: string }) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; handle: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fetchComments = async () => {
    try {
      const data = await api.comments.getAll(postId);
      setComments(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await api.comments.create(postId, { 
        content: newComment, 
        parentComment: replyingTo?.id
      });
      setNewComment("");
      setReplyingTo(null);
      fetchComments();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const neutralComments = comments.filter(c => !c.isBattle && c.side === "none");
  
  return (
    <div className="space-y-4">
      {/* Neutral Comments */}
      {neutralComments.length > 0 && (
        <div className="space-y-1 mt-4">
          {neutralComments.filter(c => !c.parentComment).map(c => (
            <CommentItem
              key={c._id}
              comment={c}
              postAuthorId={postAuthorId}
              onReply={(id, handle) => setReplyingTo({ id, handle })}
              onUpdate={fetchComments}
              replies={comments.filter(reply => reply.parentComment === c._id)}
              allComments={comments}
            />
          ))}
        </div>
      )}

      {user ? (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
          {replyingTo && (
            <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted p-2 rounded">
              <span>Replying to <strong>@{replyingTo.handle}</strong></span>
              <button type="button" onClick={() => setReplyingTo(null)} className="hover:text-foreground">Cancel</button>
            </div>
          )}
          <div className="flex gap-2 relative">
            <button 
              type="button" 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
            >
              <SmilePlus size={16} />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-10 left-0 z-50">
                <EmojiPicker onEmojiClick={(emojiObject) => {
                  setNewComment((prev) => prev + emojiObject.emoji);
                  setShowEmojiPicker(false);
                }} />
              </div>
            )}
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyingTo ? "Write a reply..." : "Write a comment... use @username to mention"}
              className="flex-1 border border-input rounded-md px-3 py-1 text-sm bg-transparent"
            />
            <button type="submit" disabled={isSubmitting || !newComment.trim()} className="bg-primary text-primary-foreground px-4 rounded-md text-sm flex items-center disabled:opacity-50 min-w-[70px] justify-center">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : (replyingTo ? "Reply" : "Post")}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center text-sm text-muted-foreground mt-4">Sign in to comment</div>
      )}
    </div>
  );
}
