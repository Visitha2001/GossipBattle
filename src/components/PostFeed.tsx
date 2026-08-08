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

  if (loading) return <div className="text-center py-10 text-muted-foreground animate-pulse">Loading feed...</div>;
  if (posts.length === 0) return <div className="text-center py-10 text-muted-foreground">No posts yet.</div>;

  return (
    <div className="max-w-2xl mx-auto py-4">
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search posts or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm h-12"
          />
        </div>
        {user && (
          <Button 
            onClick={() => setIsCreateModalOpen(true)} 
            className="rounded-full px-6 h-12 shadow-sm shrink-0"
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
