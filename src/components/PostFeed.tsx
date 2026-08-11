"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { PostCard } from "./PostCard";
import { Button } from "./ui/button";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";

export function PostFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, setIsCreateModalOpen } = useAuthStore();

  const fetchPosts = async () => {
    try {
      const data = await api.posts.getAll();
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter(post => 
    post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author?.handle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-1 md:py-4">
        {/* Search Bar Skeleton */}
        <div className="mb-3 md:mb-6 flex gap-2 md:gap-3">
          <div className="flex-1 h-10 md:h-12 bg-card border border-border rounded-full shadow-sm animate-pulse"></div>
          {user && <div className="w-24 h-10 md:h-12 bg-primary/20 rounded-full animate-pulse"></div>}
        </div>
        
        {/* Post Skeletons */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-xl p-3 md:p-4 shadow-sm border border-border mb-3 md:mb-4 animate-pulse">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-muted"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
            </div>
            <div className="h-4 bg-muted rounded w-full mb-2"></div>
            <div className="h-4 bg-muted rounded w-5/6 mb-4"></div>
            <div className="h-48 bg-muted rounded-lg w-full mb-3"></div>
            <div className="flex items-center gap-4 border-t border-border pt-3">
              <div className="h-6 w-16 bg-muted rounded-full"></div>
              <div className="h-6 w-16 bg-muted rounded-full"></div>
              <div className="h-6 w-10 bg-muted rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (posts.length === 0) return <div className="text-center py-10 text-muted-foreground">No posts yet.</div>;

  return (
    <div className="max-w-2xl mx-auto py-1 md:py-4">
      <div className="mb-3 md:mb-6 flex gap-2 md:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search posts or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2 md:py-3 bg-card border border-border rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm h-10 md:h-12"
          />
        </div>
        {user && (
          <Button 
            onClick={() => setIsCreateModalOpen(true)} 
            className="rounded-full px-4 md:px-6 h-10 md:h-12 shadow-sm shrink-0 text-sm md:text-base"
          >
            Create Post
          </Button>
        )}
      </div>
      
      {posts.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-border">No posts yet.</div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-border">No matches found for "{searchQuery}".</div>
      ) : (
        filteredPosts.map((post) => (
          <PostCard key={post._id} post={post} onUpdate={fetchPosts} />
        ))
      )}
    </div>
  );
}
