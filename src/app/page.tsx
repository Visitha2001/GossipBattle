"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { PostFeed } from "@/components/PostFeed";
import { CreatePostModal } from "@/components/CreatePostModal";

export default function Home() {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshFeedKey, setRefreshFeedKey] = useState(0);

  return (
    <div className="flex flex-col flex-1 bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[150px]" />
      </div>

      <main className="flex flex-1 flex-col items-center w-full max-w-5xl mx-auto px-6 py-12 z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
            Welcome to the new era of gossip
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
            The Ultimate <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">
              GossipBattle Arena
            </span>
          </h1>
          
          <p className="max-w-xl mx-auto text-lg text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            Join the community, claim your unique handle, and start battling.
          </p>

          {user && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-6 px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 hover:scale-105 transition-all shadow-lg shadow-primary/25"
            >
              Create Post
            </button>
          )}
        </div>

        <div className="w-full">
          <PostFeed key={refreshFeedKey} />
        </div>

        <CreatePostModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onPostCreated={() => setRefreshFeedKey(prev => prev + 1)} 
        />
      </main>
    </div>
  );
}

