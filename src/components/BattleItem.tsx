import React, { useState, useEffect, useRef } from "react";
import { Trash2, Loader2, MoreHorizontal, SmilePlus, Image as ImageIcon, Paperclip } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';
import { GifPicker } from 'gif-picker-react';
import { Tenor } from 'gif-picker-react/providers/tenor';
import { toast } from "sonner";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchType, setSearchType] = useState<"mention" | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ start: number, word: string } | null>(null);
  const [activeInput, setActiveInput] = useState<"left" | "right" | null>(null);
  const leftInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);

  const [activeMenu, setActiveMenu] = useState<"left" | "right" | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);

  const [leftImagePreview, setLeftImagePreview] = useState<string | null>(null);
  const [leftSelectedImage, setLeftSelectedImage] = useState<File | null>(null);
  const [leftGifUrl, setLeftGifUrl] = useState<string | null>(null);

  const [rightImagePreview, setRightImagePreview] = useState<string | null>(null);
  const [rightSelectedImage, setRightSelectedImage] = useState<File | null>(null);
  const [rightGifUrl, setRightGifUrl] = useState<string | null>(null);


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

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>, side: "left" | "right") => {
    const text = e.target.value;
    if (side === "left") setLeftComment(text);
    else setRightComment(text);
    
    setActiveInput(side);

    const cursor = e.target.selectionStart;
    if (cursor === null) return;
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
    if (!cursorPosition || !activeInput) return;
    
    const isLeft = activeInput === "left";
    const currentText = isLeft ? leftComment : rightComment;
    
    const before = currentText.slice(0, cursorPosition.start);
    const afterMatch = currentText.slice(cursorPosition.start).match(/^@\S+/);
    const wordLength = afterMatch ? afterMatch[0].length : cursorPosition.word.length;
    const after = currentText.slice(cursorPosition.start + wordLength);
    
    const prefix = suggestionText.startsWith('@') ? "" : "@";
    const newContent = `${before}${prefix}${suggestionText} ${after}`;
    
    if (isLeft) setLeftComment(newContent);
    else setRightComment(newContent);
    
    setSearchType(null);
    setCursorPosition(null);
    setSuggestions([]);
    
    setTimeout(() => {
      if (isLeft) leftInputRef.current?.focus();
      else rightInputRef.current?.focus();
    }, 0);
  };

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
    if (!leftComment.trim() && !leftSelectedImage && !leftGifUrl) return;
    setIsLeftSubmitting(true);
    const toastId = leftSelectedImage ? toast.loading("Uploading image...") : undefined;
    try {
      let imageUrl = leftGifUrl || undefined;
      if (leftSelectedImage) {
        const uploadRes = await api.upload.image(leftSelectedImage);
        imageUrl = uploadRes.url;
      }
      await api.comments.create(battle.post, { 
        content: leftComment, 
        side: "left",
        parentComment: battle._id,
        imageUrl
      });
      setLeftComment("");
      setLeftSelectedImage(null);
      setLeftGifUrl(null);
      setLeftImagePreview(null);
      if (toastId) toast.success("Posted!", { id: toastId });
      onUpdate();
    } catch (err) {
      console.error(err);
      if (toastId) toast.error("Failed to post", { id: toastId });
    } finally {
      setIsLeftSubmitting(false);
    }
  };

  const handleRightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rightComment.trim() && !rightSelectedImage && !rightGifUrl) return;
    setIsRightSubmitting(true);
    const toastId = rightSelectedImage ? toast.loading("Uploading image...") : undefined;
    try {
      let imageUrl = rightGifUrl || undefined;
      if (rightSelectedImage) {
        const uploadRes = await api.upload.image(rightSelectedImage);
        imageUrl = uploadRes.url;
      }
      await api.comments.create(battle.post, { 
        content: rightComment, 
        side: "right",
        parentComment: battle._id,
        imageUrl
      });
      setRightComment("");
      setRightSelectedImage(null);
      setRightGifUrl(null);
      setRightImagePreview(null);
      if (toastId) toast.success("Posted!", { id: toastId });
      onUpdate();
    } catch (err) {
      console.error(err);
      if (toastId) toast.error("Failed to post", { id: toastId });
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
    <div className="bg-card rounded-lg border border-border mt-3 md:mt-4 overflow-hidden">
      <div className="bg-muted/30 p-2 md:p-3 border-b border-border flex justify-between items-center">
        <div className="text-sm font-bold text-muted-foreground flex items-center gap-2">
          <span>
            Battle created by <Link href={`/profile/${battle.author?.handle}`}><span className="text-foreground hover:underline cursor-pointer" style={{ color: battle.author?.handleColor }}>{battle.author?.handle}</span></Link>
            {parentCommentAuthor && (
              <> on <Link href={`/profile/${parentCommentAuthor}`}><span className="text-foreground hover:underline cursor-pointer">{parentCommentAuthor}</span></Link>'s comment</>
            )}
          </span>
          {canDelete && (
            <div className="relative ml-2">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
              >
                <MoreHorizontal size={14} />
              </button>
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
                  <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-md shadow-md z-20 w-28 overflow-hidden flex flex-col py-1">
                    <button 
                      onClick={() => { setIsMenuOpen(false); setIsDeleteModalOpen(true); }} 
                      className="w-full text-left px-3 py-2 text-xs text-destructive hover:bg-muted flex items-center gap-2"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="flex gap-2 items-center">
          <button onClick={() => handleVote("W")} className={`flex items-center gap-2 pl-4 pr-1.5 py-1 rounded-full text-xs font-bold transition-colors ${hasUpvoted ? 'bg-green-500 text-white' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}>
            W <span className={`flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[10px] ${hasUpvoted ? 'bg-white/30' : 'bg-green-500/20'}`}>{upvotes}</span>
          </button>
          <button onClick={() => handleVote("L")} className={`flex items-center gap-2 pl-4 pr-1.5 py-1 rounded-full text-xs font-bold transition-colors ${hasDownvoted ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}>
            L <span className={`flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[10px] ${hasDownvoted ? 'bg-white/30' : 'bg-red-500/20'}`}>{downvotes}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-0 relative">
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-background rounded-full w-12 h-12 items-center justify-center border-2 border-border shadow-lg font-extrabold italic text-xl bg-gradient-to-br from-red-500 to-blue-500 text-transparent bg-clip-text">VS</div>
        
        <div className="flex-1 bg-red-500/5 border-r border-border p-2 md:p-3 relative">
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
            <div className="mt-2">
              {leftImagePreview && (
                <div className="relative inline-block mt-2 mb-2">
                  <img src={leftImagePreview} alt="Preview" className="max-h-24 rounded-lg border border-border object-contain" />
                  <button 
                    type="button" 
                    onClick={() => { setLeftSelectedImage(null); setLeftGifUrl(null); setLeftImagePreview(null); }}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                  >
                    ×
                  </button>
                </div>
              )}
              <form onSubmit={handleLeftSubmit} className="flex gap-2 relative items-center">
                <div className="flex-1 relative flex items-center gap-1">
                  <div className="relative flex items-center shrink-0">
                    <button 
                      type="button" 
                      onClick={() => {
                        setActiveMenu(activeMenu === "left" ? null : "left");
                        if (activeMenu !== "left") {
                          setShowEmoji(false);
                          setShowGif(false);
                        }
                      }}
                      className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${activeMenu === "left" ? 'bg-red-500 text-white' : 'text-red-500 hover:bg-red-500/10'}`}
                    >
                      <Paperclip size={14} />
                    </button>
                    
                    {activeMenu === "left" && (
                      <div className="absolute bottom-full left-0 mb-2 p-1.5 bg-popover border border-border rounded-xl shadow-lg flex items-center gap-1 z-50">
                        <button 
                          type="button" 
                          onClick={() => { setShowEmoji(!showEmoji); setShowGif(false); }}
                          className="p-1.5 bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <SmilePlus size={14} />
                        </button>
                        <label className="p-1.5 bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center justify-center">
                          <ImageIcon size={14} />
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => { 
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              setLeftSelectedImage(file);
                              setLeftImagePreview(URL.createObjectURL(file));
                              setLeftGifUrl(null);
                              setActiveMenu(null);
                            }
                          }} />
                        </label>
                        <button 
                          type="button" 
                          onClick={() => { setShowGif(!showGif); setShowEmoji(false); }}
                          className="p-1.5 bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center font-bold text-[8px] w-7 h-7"
                        >
                          GIF
                        </button>
                      </div>
                    )}
                  </div>
                  {activeMenu === "left" && showEmoji && (
                    <div className="absolute bottom-10 left-0 z-50">
                      <EmojiPicker theme={"dark" as any} onEmojiClick={(e) => {
                        setLeftComment((prev) => prev + e.emoji);
                        setShowEmoji(false);
                        setActiveMenu(null);
                      }} />
                    </div>
                  )}
                  {activeMenu === "left" && showGif && (
                    <div className="absolute bottom-10 left-0 z-50 bg-popover rounded-xl overflow-hidden border shadow-lg w-[280px]">
                      <GifPicker provider={Tenor("LIVDSRZULELA")} onGifClick={(gif) => {
                        setLeftGifUrl(gif.imageUrl);
                        setLeftImagePreview(gif.imageUrl);
                        setLeftSelectedImage(null);
                        setShowGif(false);
                        setActiveMenu(null);
                      }} />
                    </div>
                  )}
                  
                  <input
                    ref={leftInputRef}
                    type="text"
                    value={leftComment}
                    onChange={(e) => handleTextChange(e, "left")}
                    onSelect={(e: any) => handleTextChange(e, "left")}
                    placeholder="Support Agree..."
                    className="w-full border border-red-500/30 rounded-md px-2 py-1 text-xs bg-transparent focus:ring-1 focus:ring-red-500 focus:outline-none"
                  />
                  {suggestions.length > 0 && activeInput === "left" && (
                    <div className="absolute bottom-full mb-1 left-0 w-64 max-h-40 overflow-y-auto bg-popover border border-border rounded-md shadow-md z-20">
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
                </div>
                <button 
                  type="submit" 
                  disabled={(!leftComment.trim() && !leftSelectedImage && !leftGifUrl) || isLeftSubmitting}
                  className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[50px] shrink-0"
                >
                  {isLeftSubmitting ? <Loader2 size={12} className="animate-spin" /> : "Post"}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="flex-1 bg-blue-500/5 p-2 md:p-3">
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
            <div className="mt-2">
              {rightImagePreview && (
                <div className="relative inline-block mt-2 mb-2">
                  <img src={rightImagePreview} alt="Preview" className="max-h-24 rounded-lg border border-border object-contain" />
                  <button 
                    type="button" 
                    onClick={() => { setRightSelectedImage(null); setRightGifUrl(null); setRightImagePreview(null); }}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                  >
                    ×
                  </button>
                </div>
              )}
              <form onSubmit={handleRightSubmit} className="flex gap-2 relative items-center">
                <div className="flex-1 relative flex items-center gap-1">
                  <div className="relative flex items-center shrink-0">
                    <button 
                      type="button" 
                      onClick={() => {
                        setActiveMenu(activeMenu === "right" ? null : "right");
                        if (activeMenu !== "right") {
                          setShowEmoji(false);
                          setShowGif(false);
                        }
                      }}
                      className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${activeMenu === "right" ? 'bg-blue-500 text-white' : 'text-blue-500 hover:bg-blue-500/10'}`}
                    >
                      <Paperclip size={14} />
                    </button>
                    
                    {activeMenu === "right" && (
                      <div className="absolute bottom-full left-0 mb-2 p-1.5 bg-popover border border-border rounded-xl shadow-lg flex items-center gap-1 z-50">
                        <button 
                          type="button" 
                          onClick={() => { setShowEmoji(!showEmoji); setShowGif(false); }}
                          className="p-1.5 bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <SmilePlus size={14} />
                        </button>
                        <label className="p-1.5 bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center justify-center">
                          <ImageIcon size={14} />
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => { 
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              setRightSelectedImage(file);
                              setRightImagePreview(URL.createObjectURL(file));
                              setRightGifUrl(null);
                              setActiveMenu(null);
                            }
                          }} />
                        </label>
                        <button 
                          type="button" 
                          onClick={() => { setShowGif(!showGif); setShowEmoji(false); }}
                          className="p-1.5 bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center font-bold text-[8px] w-7 h-7"
                        >
                          GIF
                        </button>
                      </div>
                    )}
                  </div>
                  {activeMenu === "right" && showEmoji && (
                    <div className="absolute bottom-10 left-0 z-50">
                      <EmojiPicker theme={"dark" as any} onEmojiClick={(e) => {
                        setRightComment((prev) => prev + e.emoji);
                        setShowEmoji(false);
                        setActiveMenu(null);
                      }} />
                    </div>
                  )}
                  {activeMenu === "right" && showGif && (
                    <div className="absolute bottom-10 left-0 z-50 bg-popover rounded-xl overflow-hidden border shadow-lg w-[280px]">
                      <GifPicker provider={Tenor("LIVDSRZULELA")} onGifClick={(gif) => {
                        setRightGifUrl(gif.imageUrl);
                        setRightImagePreview(gif.imageUrl);
                        setRightSelectedImage(null);
                        setShowGif(false);
                        setActiveMenu(null);
                      }} />
                    </div>
                  )}
                  
                  <input
                    ref={rightInputRef}
                    type="text"
                    value={rightComment}
                    onChange={(e) => handleTextChange(e, "right")}
                    onSelect={(e: any) => handleTextChange(e, "right")}
                    placeholder="Support Disagree..."
                    className="w-full border border-blue-500/30 rounded-md px-2 py-1 text-xs bg-transparent focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  {suggestions.length > 0 && activeInput === "right" && (
                    <div className="absolute bottom-full mb-1 left-0 w-64 max-h-40 overflow-y-auto bg-popover border border-border rounded-md shadow-md z-20">
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
                </div>
                <button 
                  type="submit" 
                  disabled={(!rightComment.trim() && !rightSelectedImage && !rightGifUrl) || isRightSubmitting}
                  className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[50px] shrink-0"
                >
                  {isRightSubmitting ? <Loader2 size={12} className="animate-spin" /> : "Post"}
                </button>
              </form>
            </div>
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
