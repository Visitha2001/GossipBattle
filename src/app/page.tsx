"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { PostFeed } from "@/components/PostFeed";
import { CreatePostModal } from "@/components/CreatePostModal";

export default function Home() {
  const { user, isCreateModalOpen, setIsCreateModalOpen } = useAuthStore();
  const [refreshFeedKey, setRefreshFeedKey] = useState(0);

  return (
    <div className="flex flex-col flex-1 bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[150px]" />
      </div>

      <main className="flex flex-1 flex-col items-center w-full max-w-5xl mx-auto px-6 py-6 z-10">
        <div className="w-full mt-4">
          <PostFeed key={refreshFeedKey} />
        </div>

        <CreatePostModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          onPostCreated={() => setRefreshFeedKey(prev => prev + 1)} 
        />
      </main>
    </div>
  );
}

