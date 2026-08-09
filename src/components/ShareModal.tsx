"use client";

import { X, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

export function ShareModal({ isOpen, onClose, url }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const { user } = useAuthStore();
  
  if (!isOpen) return null;

  const registerShare = async () => {
    if (!user) return;
    try {
      // Just extract ID from hash or path if needed, but since share endpoint expects ID
      const idMatch = url.match(/#([a-zA-Z0-9_]+)$/) || url.match(/\/post\/([a-zA-Z0-9_]+)$/);
      if (idMatch && idMatch[1]) {
        await api.posts.share(idMatch[1]);
      }
    } catch (err) {
      console.error("Failed to register share", err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    registerShare();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTwitterShare = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent("Check out this gossip!")}`, "_blank");
    registerShare();
  };

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
    registerShare();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-lg border border-border animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Share Post</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex justify-center space-x-6 mb-6">
          <button 
            onClick={handleTwitterShare}
            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-[#1DA1F2] transition-colors"
          >
            <div className="p-3 bg-muted rounded-full flex items-center justify-center w-12 h-12">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </div>
            <span className="text-sm font-medium">Twitter</span>
          </button>
          
          <button 
            onClick={handleFacebookShare}
            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-[#4267B2] transition-colors"
          >
            <div className="p-3 bg-muted rounded-full flex items-center justify-center w-12 h-12">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </div>
            <span className="text-sm font-medium">Facebook</span>
          </button>
        </div>
        
        <div className="relative">
          <input
            type="text"
            readOnly
            value={url}
            className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 pr-12 text-sm text-muted-foreground focus-visible:outline-none"
          />
          <button
            onClick={handleCopy}
            className="absolute right-1 top-1 p-1.5 text-muted-foreground hover:text-foreground rounded-md transition-colors"
            title="Copy link"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
