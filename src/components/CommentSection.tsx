"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { CommentItem } from "./CommentItem";
import { BattleItem } from "./BattleItem";
import { Swords, Loader2, SmilePlus, Image as ImageIcon, Paperclip } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';
import { GifPicker } from 'gif-picker-react';
import { Tenor } from 'gif-picker-react/providers/tenor';
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function CommentSection({ postId, postAuthorId }: { postId: string, postAuthorId: string }) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; handle: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && !selectedImage && !gifUrl) return;

    if (!user) return; // Should not happen as input is hidden if not logged in

    setIsSubmitting(true);
    const toastId = selectedImage ? toast.loading("Uploading image...") : undefined;
    
    // Optimistic comment creation
    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      _id: tempId,
      content: newComment,
      imageUrl: gifUrl || (selectedImage ? URL.createObjectURL(selectedImage) : undefined),
      author: user,
      createdAt: new Date().toISOString(),
      upvotes: [],
      downvotes: [],
      side: "none",
      isBattle: false,
      parentComment: replyingTo?.id,
      post: postId
    };

    setComments(prev => [...prev, optimisticComment]);
    
    const commentContent = newComment;
    const commentImage = selectedImage;
    const commentGif = gifUrl;
    const commentReplyingTo = replyingTo;

    setNewComment("");
    setSelectedImage(null);
    setGifUrl(null);
    setImagePreview(null);
    setReplyingTo(null);

    try {
      let imageUrl = commentGif || undefined;
      if (commentImage) {
        const uploadRes = await api.upload.image(commentImage);
        imageUrl = uploadRes.url;
      }

      await api.comments.create(postId, { 
        content: commentContent, 
        imageUrl,
        parentComment: commentReplyingTo?.id
      });
      
      if (toastId) toast.success("Comment posted!", { id: toastId });
      fetchComments(); // Fetch real comments to replace the optimistic one
    } catch (err) {
      console.error(err);
      if (toastId) toast.error("Failed to post comment", { id: toastId });
      // Revert optimistic comment
      setComments(prev => prev.filter(c => c._id !== tempId));
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
          {imagePreview && (
            <div className="relative inline-block mt-2 mb-2">
              <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg border border-border object-contain" />
              <button 
                type="button" 
                onClick={() => { setSelectedImage(null); setGifUrl(null); setImagePreview(null); }}
                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          )}
          <div className="flex items-start gap-2 relative">
            <div className="relative flex items-center">
              <button 
                type="button" 
                onClick={() => {
                  setShowAttachmentMenu(!showAttachmentMenu);
                  if (showAttachmentMenu) {
                    setShowEmojiPicker(false);
                    setShowGifPicker(false);
                  }
                }}
                className={`p-2 rounded-full transition-colors shrink-0 flex items-center justify-center ${showAttachmentMenu ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                <Paperclip size={16} />
              </button>
              
              {showAttachmentMenu && (
                <div className="absolute bottom-full left-0 mb-2 p-2 bg-popover border border-border rounded-xl shadow-lg flex items-center gap-2 z-50">
                  <button 
                    type="button" 
                    onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}
                    className="p-2 bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
                    title="Emoji"
                  >
                    <SmilePlus size={16} />
                  </button>
                  <label className="p-2 bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center justify-center" title="Image">
                    <ImageIcon size={16} />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { 
                      setGifUrl(null); 
                      handleImageSelect(e); 
                      setShowAttachmentMenu(false);
                    }} />
                  </label>
                  <button 
                    type="button" 
                    onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }}
                    className="p-2 bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center font-bold text-[10px] w-8 h-8"
                    title="GIF"
                  >
                    GIF
                  </button>
                </div>
              )}
            </div>
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-50">
                <EmojiPicker theme={"dark" as any} onEmojiClick={(emojiObject) => {
                  setNewComment((prev) => prev + emojiObject.emoji);
                  setShowEmojiPicker(false);
                }} />
              </div>
            )}
            {showGifPicker && (
              <div className="absolute bottom-12 left-10 z-50">
                <GifPicker theme={"dark" as any} provider={Tenor("LIVDSRZULELA")} onGifClick={(gif) => {
                  setGifUrl(gif.imageUrl);
                  setImagePreview(gif.imageUrl);
                  setShowGifPicker(false);
                }} />
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={handleTextChange}
              onSelect={handleTextChange}
              placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
              className="flex-1 border border-input rounded-md px-3 py-2 text-sm bg-transparent h-10 resize-none overflow-hidden leading-tight"
              rows={1}
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
            <button type="submit" disabled={isSubmitting || (!newComment.trim() && !selectedImage && !gifUrl)} className="bg-primary text-primary-foreground px-4 rounded-full text-sm flex items-center disabled:opacity-50 min-w-[70px] justify-center h-10 shrink-0">
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
