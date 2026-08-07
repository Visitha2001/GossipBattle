"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { CommentItem } from "./CommentItem";

export function CommentSection({ postId, postAuthorId }: { postId: string, postAuthorId: string }) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [side, setSide] = useState<"none" | "left" | "right">("none");
  const [replyingTo, setReplyingTo] = useState<{ id: string; handle: string } | null>(null);

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

    try {
      await api.comments.create(postId, { 
        content: newComment, 
        side,
        parentComment: replyingTo?.id
      });
      setNewComment("");
      setReplyingTo(null);
      fetchComments();
    } catch (err) {
      console.error(err);
    }
  };

  // Grouping comments by side
  const leftComments = comments.filter(c => c.side === "left");
  const rightComments = comments.filter(c => c.side === "right");
  const neutralComments = comments.filter(c => c.side === "none");

  const isBattle = leftComments.length > 0 || rightComments.length > 0;

  return (
    <div className="space-y-4">
      {/* Battle View */}
      {isBattle && (
        <div className="flex gap-4">
          <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <h4 className="text-red-500 font-bold mb-2 text-center border-b border-red-500/20 pb-2">Red Side</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {leftComments.map(c => (
                <div key={c._id} className="bg-background rounded p-2 text-sm shadow-sm border border-red-500/20">
                  <div className="font-bold text-xs text-red-500">{c.author.handle}</div>
                  <div>{c.content}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <h4 className="text-blue-500 font-bold mb-2 text-center border-b border-blue-500/20 pb-2">Blue Side</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {rightComments.map(c => (
                <div key={c._id} className="bg-background rounded p-2 text-sm shadow-sm border border-blue-500/20">
                  <div className="font-bold text-xs text-blue-500">{c.author.handle}</div>
                  <div>{c.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
              replies={neutralComments.filter(reply => reply.parentComment === c._id)}
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
          <div className="flex gap-2">
            {!replyingTo && (
              <select 
                value={side} 
                onChange={(e) => setSide(e.target.value as any)}
                className="px-2 py-1 text-xs border border-input rounded-md bg-transparent"
              >
                <option value="none">Normal</option>
                <option value="left">Red Side</option>
                <option value="right">Blue Side</option>
              </select>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyingTo ? "Write a reply..." : "Write a comment... use @username to mention"}
              className="flex-1 border border-input rounded-md px-3 py-1 text-sm bg-transparent"
            />
            <button type="submit" className="bg-primary text-primary-foreground px-4 rounded-md text-sm">
              {replyingTo ? "Reply" : "Post"}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center text-sm text-muted-foreground mt-4">Sign in to comment</div>
      )}
    </div>
  );
}
