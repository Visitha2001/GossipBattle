"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { CommentItem } from "./CommentItem";
import { BattleItem } from "./BattleItem";
import { Swords, Loader2, SmilePlus } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';
import { useSearchParams } from "next/navigation";

export function CommentSection({ postId, postAuthorId }: { postId: string, postAuthorId: string }) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; handle: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchType, setSearchType] = useState<"mention" | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ start: number, word: string } | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const searchParams = useSearchParams();
  const [hasScrolled, setHasScrolled] = useState(false);

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

  useEffect(() => {
    if (comments.length > 0 && !hasScrolled) {
      const commentId = searchParams?.get("comment");
      if (commentId) {
        setTimeout(() => {
          const el = document.getElementById(`comment-${commentId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add("ring-2", "ring-primary", "ring-offset-2", "rounded-xl", "transition-all", "duration-1000", "p-2");
            setTimeout(() => {
              el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "p-2");
            }, 3000);
          }
        }, 500);
        setHasScrolled(true);
      }
    }
  }, [comments, searchParams, hasScrolled]);

  useEffect(() => {
    if (!searchType || !cursorPosition || cursorPosition.word.length < 1) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const query = cursorPosition.word.substring(1);
        if (searchType === "mention") {
          const res = await api.users.search(query);
          setSuggestions(res);
        }
      } catch (e) {
        console.error(e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchType, cursorPosition]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNewComment(text);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = text.slice(0, cursor);
    const words = textBeforeCursor.split(/[\s\n]/);
    const currentWord = words[words.length - 1];

    if (currentWord.startsWith("@")) {
      setSearchType("mention");
      setCursorPosition({ start: cursor - currentWord.length, word: currentWord });
    } else {
      setSearchType(null);
      setCursorPosition(null);
      setSuggestions([]);
    }
  };

  const insertSuggestion = (suggestionText: string) => {
    if (!cursorPosition || !textareaRef.current) return;
    
    const before = newComment.slice(0, cursorPosition.start);
    const afterMatch = newComment.slice(cursorPosition.start).match(/^@\S+/);
    const wordLength = afterMatch ? afterMatch[0].length : cursorPosition.word.length;
    const after = newComment.slice(cursorPosition.start + wordLength);
    
    const prefix = suggestionText.startsWith('@') ? "" : "@";
    const newContent = `${before}${prefix}${suggestionText} ${after}`;
    
    setNewComment(newContent);
    setSearchType(null);
    setCursorPosition(null);
    setSuggestions([]);
    
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

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
          <div className="flex items-start gap-2 relative">
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
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={handleTextChange}
              onSelect={handleTextChange}
              placeholder={replyingTo ? "Write a reply..." : "Write a comment... use @username to mention"}
              className="flex-1 border border-input rounded-md px-3 py-2 text-sm bg-transparent min-h-[40px] max-h-[150px] resize-y"
              rows={2}
            />
            {suggestions.length > 0 && (
              <div className="absolute bottom-full mb-1 left-[40px] w-64 max-h-40 overflow-y-auto bg-popover border border-border rounded-md shadow-md z-10">
                {suggestions.map((s, i) => (
                  <div 
                    key={i} 
                    className="p-2 hover:bg-muted cursor-pointer flex items-center gap-2 text-sm"
                    onClick={() => insertSuggestion(s.handle)}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold"
                      style={{ backgroundColor: s.handleColor || "var(--primary)" }}
                    >
                      {s.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">{s.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{s.handle?.startsWith('@') ? s.handle : `@${s.handle}`}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button type="submit" disabled={isSubmitting || !newComment.trim()} className="bg-primary text-primary-foreground px-4 rounded-md text-sm flex items-center disabled:opacity-50 min-w-[70px] justify-center h-10 mt-0.5">
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
