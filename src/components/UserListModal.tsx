"use client";

import { X, Search } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: any[];
  onFollowToggle?: () => void;
}

export function UserListModal({ isOpen, onClose, title, users, onFollowToggle }: UserListModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user: currentUser } = useAuthStore();

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.handle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFollowToggle = async (userId: string) => {
    if (!currentUser) return;
    const isCurrentlyFollowing = currentUser.following?.includes(userId);
    
    // Optimistic update
    const newFollowing = isCurrentlyFollowing
      ? (currentUser.following || []).filter((id: string) => id !== userId)
      : [...(currentUser.following || []), userId];
      
    useAuthStore.getState().setUser({ ...currentUser, following: newFollowing });

    try {
      await api.users.follow(userId);
      if (onFollowToggle) onFollowToggle();
    } catch (err) {
      console.error(err);
      // Revert on error
      useAuthStore.getState().setUser({ ...currentUser, following: currentUser.following });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg border border-border animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="relative mb-4 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">No users found.</p>
          ) : (
            filteredUsers.map((u) => (
              <div key={u._id} className="flex items-center justify-between">
                <Link href={`/profile/${u.handle}`} onClick={onClose} className="flex items-center gap-3 group">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 border"
                    style={{ backgroundColor: u.handleColor || "var(--primary)" }}
                  >
                    {u.avatar ? (
                      <img src={u.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      u.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold group-hover:underline text-sm">{u.name}</span>
                    <span className="text-xs group-hover:underline" style={{ color: u.handleColor }}>{u.handle}</span>
                  </div>
                </Link>
                {currentUser && currentUser._id !== u._id && (
                  <button 
                    onClick={() => handleFollowToggle(u._id)}
                    className={`text-xs border px-3 py-1.5 rounded-full transition-colors ${
                      currentUser?.following?.includes(u._id)
                        ? "border-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                        : "border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
                    }`}
                  >
                    {currentUser?.following?.includes(u._id) ? "Unfollow" : "Follow"}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
