"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import Link from "next/link";

export function FollowersPanel() {
  const { user } = useAuthStore();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSuggestions();
    }
  }, [user]);

  const fetchSuggestions = async () => {
    try {
      const data = await api.users.suggestions();
      setSuggestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetId: string) => {
    try {
      const res = await api.users.follow(targetId);
      if (res.following) {
        toast.success("Followed user successfully!");
        // Remove from suggestions
        setSuggestions(suggestions.filter(s => s._id !== targetId));
      }
    } catch (err) {
      toast.error("Failed to follow user");
    }
  };

  if (!user) return null;
  if (loading) return <div className="animate-pulse bg-card p-4 rounded-xl w-full">Loading suggestions...</div>;
  if (suggestions.length === 0) return null;

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm border border-border sticky top-24 w-full">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <UserPlus size={18} /> Suggested to Follow
      </h3>
      <div className="space-y-4">
        {suggestions.map((suggestion) => (
          <div key={suggestion._id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: suggestion.handleColor || "var(--primary)" }}
              >
                {suggestion.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <Link href={`/profile/${suggestion.handle}`} className="hover:underline text-sm font-semibold truncate max-w-[100px]">
                  <span>{suggestion.name}</span>
                </Link>
                <Link href={`/profile/${suggestion.handle}`} className="hover:underline text-xs text-muted-foreground truncate max-w-[100px]">
                  <span>{suggestion.handle}</span>
                </Link>
              </div>
            </div>
            <button
              onClick={() => handleFollow(suggestion._id)}
              className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1 rounded-full hover:bg-primary/90 transition-colors"
            >
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
