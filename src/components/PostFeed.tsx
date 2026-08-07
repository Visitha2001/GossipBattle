"use client";

import { useEffect, useState } from "react";
import { PostCard } from "./PostCard";
import { api } from "@/lib/api";

export function PostFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="text-center py-10 text-muted-foreground animate-pulse">Loading feed...</div>;
  if (posts.length === 0) return <div className="text-center py-10 text-muted-foreground">No posts yet.</div>;

  return (
    <div className="max-w-2xl mx-auto py-4">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} onUpdate={fetchPosts} />
      ))}
    </div>
  );
}
