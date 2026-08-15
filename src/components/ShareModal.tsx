"use client";

import { X, Copy, Check, Search, UserPlus, Loader2, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  groupId?: string;
  groupMembers?: any[];
  title?: string;
}

export function ShareModal({ isOpen, onClose, url, groupId, groupMembers = [], title }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [invitedUserIds, setInvitedUserIds] = useState<string[]>([]);
  const [sendingInviteId, setSendingInviteId] = useState<string | null>(null);
  
  const { user } = useAuthStore();
  
  useEffect(() => {
    if (isOpen && groupId && user?.handle) {
      setLoadingFollowers(true);
      api.users.getProfile(user.handle)
        .then((data) => {
          setFollowers(data.user.followers || []);
        })
        .catch((err) => console.error("Failed to load followers for invite", err))
        .finally(() => setLoadingFollowers(false));
    }
  }, [isOpen, groupId, user?.handle]);

  if (!isOpen) return null;

  const registerShare = async () => {
    if (!user) return;
    try {
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
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTwitterShare = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent("Check this out!")}`, "_blank");
    registerShare();
  };

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
    registerShare();
  };

  const handleSendInvite = async (targetUserId: string) => {
    if (!groupId) return;
    setSendingInviteId(targetUserId);
    try {
      const res = await fetch(`/api/groups/${groupId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send invite");
      }
      
      toast.success("Invite sent successfully!");
      setInvitedUserIds((prev) => [...prev, targetUserId]);
    } catch (err: any) {
      toast.error(err.message || "Error sending invite");
    } finally {
      setSendingInviteId(null);
    }
  };

  const memberIds = groupMembers.map((m: any) => (typeof m === 'string' ? m : m._id));

  const filteredFollowers = followers.filter((f: any) => 
    f.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.handle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-xl border border-border animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {groupId ? <Users size={20} className="text-primary" /> : null}
            {title || (groupId ? "Share & Invite Members" : "Share Post")}
          </h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto space-y-5 pr-1">
          {/* Social Share & Copy Link */}
          <div>
            <div className="flex justify-center space-x-6 mb-4">
              <button 
                onClick={handleTwitterShare}
                className="flex flex-col items-center gap-1.5 text-muted-foreground hover:text-[#1DA1F2] transition-colors group"
              >
                <div className="p-3 bg-muted group-hover:bg-[#1DA1F2]/10 rounded-full flex items-center justify-center w-11 h-11 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                </div>
                <span className="text-xs font-medium">X / Twitter</span>
              </button>
              
              <button 
                onClick={handleFacebookShare}
                className="flex flex-col items-center gap-1.5 text-muted-foreground hover:text-[#4267B2] transition-colors group"
              >
                <div className="p-3 bg-muted group-hover:bg-[#4267B2]/10 rounded-full flex items-center justify-center w-11 h-11 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </div>
                <span className="text-xs font-medium">Facebook</span>
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                readOnly
                value={url}
                className="w-full rounded-lg border border-input bg-muted/40 px-3 py-2 pr-12 text-xs text-muted-foreground focus-visible:outline-none"
              />
              <button
                onClick={handleCopy}
                className="absolute right-1 top-1 bottom-1 px-2 text-muted-foreground hover:text-foreground rounded-md transition-colors flex items-center gap-1 text-xs font-medium bg-muted hover:bg-muted/80"
                title="Copy link"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Invite Followers Section for Groups */}
          {groupId && (
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <UserPlus size={16} className="text-primary" /> Invite Followers
                </h3>
                <span className="text-xs text-muted-foreground">{followers.length} followers</span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input 
                  type="text"
                  placeholder="Search followers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-muted/40 border border-input rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Followers List */}
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {loadingFollowers ? (
                  <div className="flex justify-center py-6">
                    <Loader2 size={20} className="animate-spin text-primary" />
                  </div>
                ) : filteredFollowers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4 italic">
                    {searchQuery ? "No followers match your search." : "No followers to invite yet."}
                  </p>
                ) : (
                  filteredFollowers.map((f: any) => {
                    const isMember = memberIds.includes(f._id);
                    const isInvited = invitedUserIds.includes(f._id);
                    const isSending = sendingInviteId === f._id;

                    return (
                      <div key={f._id} className="flex items-center justify-between p-2 hover:bg-muted/40 rounded-lg transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold shrink-0 overflow-hidden" 
                            style={{ backgroundColor: f.handleColor || "var(--primary)" }}
                          >
                            {f.avatar ? (
                              <img src={f.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              f.name?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-medium truncate">{f.name}</span>
                            <span className="text-[10px] text-muted-foreground truncate">{f.handle}</span>
                          </div>
                        </div>

                        {isMember ? (
                          <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-medium">
                            Joined
                          </span>
                        ) : isInvited ? (
                          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-semibold">
                            Invited
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSendInvite(f._id)}
                            disabled={isSending}
                            className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded-full font-medium transition-colors disabled:opacity-50 flex items-center gap-1 shadow-xs"
                          >
                            {isSending ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                            Invite
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
