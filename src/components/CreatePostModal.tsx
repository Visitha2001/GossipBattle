"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { X, Image as ImageIcon } from "lucide-react";

export function CreatePostModal({ isOpen, onClose, onPostCreated }: { isOpen: boolean; onClose: () => void; onPostCreated: () => void }) {
  const { user } = useAuthStore();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchType, setSearchType] = useState<"mention" | "hashtag" | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ start: number, word: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  useEffect(() => {
    if (!searchType || !cursorPosition || cursorPosition.word.length < 2) {
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
    
    const prefix = searchType === "mention" ? "@" : "#";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;

    setLoading(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        const uploadRes = await api.upload.image(imageFile);
        imageUrl = uploadRes.url;
      }

      await api.posts.create({ content, imageUrl });

      setContent("");
      setImageFile(null);
      onPostCreated();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-card p-4 shadow-lg border border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create Post</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 mb-4 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextChange}
              onSelect={handleTextChange}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[100px]"
              placeholder="What's on your mind? Use @ to mention or # for tags."
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
                          <span className="text-xs text-muted-foreground">@{s.handle}</span>
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

            {imageFile && (
              <div className="relative rounded-md overflow-hidden border border-border">
                <img 
                  src={URL.createObjectURL(imageFile)} 
                  alt="Preview" 
                  className="w-full h-auto max-h-[300px] object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageFile(null)}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <label className="cursor-pointer flex items-center gap-2 text-sm text-primary hover:text-primary-600 transition-colors">
              <ImageIcon size={20} />
              <span>Add Image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </label>

            <button
              type="submit"
              disabled={loading || (!content.trim() && !imageFile)}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
