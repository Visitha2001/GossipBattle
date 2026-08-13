"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { X, Image as ImageIcon, SmilePlus, Loader2 } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';

const FEELINGS = ["Happy", "Excited", "Angry", "Sad", "Cool", "Loved", "Crazy", "Tired"];

export function CreatePostModal({ isOpen, onClose, onPostCreated, editPost, groupId }: { isOpen: boolean; onClose: () => void; onPostCreated: () => void; editPost?: any; groupId?: string }) {
  const { user } = useAuthStore();
  const [content, setContent] = useState(editPost?.content || "");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(editPost?.imageUrls || (editPost?.imageUrl ? [editPost.imageUrl] : []));
  const [feeling, setFeeling] = useState<string>(editPost?.feeling || "");
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchType, setSearchType] = useState<"mention" | "hashtag" | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ start: number, word: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!searchType || !cursorPosition || cursorPosition.word.length < 1) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const query = cursorPosition.word.substring(1); // remove @ or #
        if (searchType === "mention") {
          const res = await api.users.search(query);
          setSuggestions(res);
        } else {
          const res = await api.hashtags.search(query);
          setSuggestions(res);
        }
      } catch (e) {
        console.error(e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchType, cursorPosition]);

  useEffect(() => {
    if (isOpen) {
      if (editPost) {
        setContent(editPost.content || "");
        setFeeling(editPost.feeling || "");
        setExistingImageUrls(editPost.imageUrls || (editPost.imageUrl ? [editPost.imageUrl] : []));
      } else {
        setContent("");
        setFeeling("");
        setExistingImageUrls([]);
      }
      setImageFiles([]);
    }
  }, [isOpen, editPost]);

  if (!isOpen) return null;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = text.slice(0, cursor);
    const words = textBeforeCursor.split(/[\s\n]/);
    const currentWord = words[words.length - 1];

    if (currentWord.startsWith("@")) {
      setSearchType("mention");
      setCursorPosition({ start: cursor - currentWord.length, word: currentWord });
    } else if (currentWord.startsWith("#")) {
      setSearchType("hashtag");
      setCursorPosition({ start: cursor - currentWord.length, word: currentWord });
    } else {
      setSearchType(null);
      setCursorPosition(null);
      setSuggestions([]);
    }
  };

  const insertSuggestion = (suggestionText: string) => {
    if (!cursorPosition || !textareaRef.current) return;
    
    const before = content.slice(0, cursorPosition.start);
    // find end of current word (in case they typed more after we fetched)
    const afterMatch = content.slice(cursorPosition.start).match(/^[@#]\S+/);
    const wordLength = afterMatch ? afterMatch[0].length : cursorPosition.word.length;
    const after = content.slice(cursorPosition.start + wordLength);
    
    const prefix = searchType === "mention" ? (suggestionText.startsWith('@') ? "" : "@") : (suggestionText.startsWith('#') ? "" : "#");
    const newContent = `${before}${prefix}${suggestionText} ${after}`;
    
    setContent(newContent);
    setSearchType(null);
    setCursorPosition(null);
    setSuggestions([]);
    
    // Set focus back
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const onEmojiClick = (emojiObject: any) => {
    if (!textareaRef.current) return;
    
    const cursor = textareaRef.current.selectionStart;
    const text = content;
    const newText = text.slice(0, cursor) + emojiObject.emoji + text.slice(cursor);
    setContent(newText);
    
    // If the emoji picker was opened next to feeling, also add it to feeling?
    // The requirement says "add emogies to feelings of posts". I'll just append it to feeling.
    // Wait, the prompt says "add emogies to feelings of posts". Let's update the feelings array or allow custom feeling with emoji. 
    // I'll add an option to insert emoji in text or use emoji picker for feeling. 
    // For simplicity, let's just append the emoji to the text content.
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && imageFiles.length === 0) return;

    setLoading(true);
    try {
      const newImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        // Upload images concurrently
        const uploadPromises = imageFiles.map(file => api.upload.image(file));
        const uploadResults = await Promise.all(uploadPromises);
        uploadResults.forEach(res => newImageUrls.push(res.url));
      }

      const allImageUrls = [...existingImageUrls, ...newImageUrls];

      if (editPost) {
        await api.posts.edit(editPost._id, { content, imageUrls: allImageUrls, feeling: feeling || undefined });
      } else {
        await api.posts.create({ content, imageUrls: allImageUrls, feeling: feeling || undefined, group: groupId });
      }

      setContent("");
      setImageFiles([]);
      setExistingImageUrls([]);
      setFeeling("");
      onPostCreated();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-card p-4 shadow-lg border border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{editPost ? "Edit Post" : "Create Post"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="relative">
          {loading && (
            <div className="absolute inset-0 bg-background/50 z-20 flex items-center justify-center rounded-md backdrop-blur-[1px]">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          )}
          <div className="flex flex-col gap-4 mb-4 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextChange}
              onSelect={handleTextChange}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[100px]"
              placeholder="What's on your mind? Use @ to mention or # for tags."
              disabled={loading}
            />
            
            {suggestions.length > 0 && (
              <div className="absolute top-[100px] left-0 w-full max-h-40 overflow-y-auto bg-popover border border-border rounded-md shadow-md z-10">
                {suggestions.map((s, i) => (
                  <div 
                    key={i} 
                    className="p-2 hover:bg-muted cursor-pointer flex items-center gap-2 text-sm"
                    onClick={() => insertSuggestion(searchType === "mention" ? s.handle : s.name)}
                  >
                    {searchType === "mention" ? (
                      <>
                        <div
                          className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold"
                          style={{ backgroundColor: s.handleColor || "var(--primary)" }}
                        >
                          {s.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{s.name}</span>
                          <span className="text-xs text-muted-foreground">{s.handle?.startsWith('@') ? s.handle : `@${s.handle}`}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between w-full">
                        <span className="font-medium">#{s.name}</span>
                        <span className="text-xs text-muted-foreground">{s.count} posts</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {(imageFiles.length > 0 || existingImageUrls.length > 0) && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {existingImageUrls.map((url, i) => (
                  <div key={`existing-${i}`} className="relative rounded-md overflow-hidden border border-border h-24">
                    <img 
                      src={url} 
                      alt={`Existing ${i}`} 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setExistingImageUrls(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {imageFiles.map((file, i) => (
                  <div key={`new-${i}`} className="relative rounded-md overflow-hidden border border-border h-24">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`New Preview ${i}`} 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between mb-4 relative">
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <SmilePlus size={18} />
              </button>
              <input 
                type="text"
                list="feelings-list"
                value={feeling} 
                onChange={(e) => setFeeling(e.target.value)}
                placeholder="Feeling..."
                className="bg-transparent border border-input rounded-md px-2 py-1 text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-32"
              />
              <datalist id="feelings-list">
                {FEELINGS.map(f => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>
            {showEmojiPicker && (
              <div className="absolute top-10 left-0 z-50">
                <EmojiPicker onEmojiClick={(emojiObject) => {
                  setFeeling((prev) => prev + emojiObject.emoji);
                  setShowEmojiPicker(false);
                }} />
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <label className="cursor-pointer flex items-center gap-2 text-sm text-primary hover:text-primary-600 transition-colors">
              <ImageIcon size={20} />
              <span>Add Images</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    setImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                  }
                }}
              />
            </label>

            <button
              type="submit"
              disabled={loading || (!content.trim() && imageFiles.length === 0 && existingImageUrls.length === 0)}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  {editPost ? "Saving..." : "Posting..."}
                </>
              ) : (editPost ? "Save" : "Post")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
