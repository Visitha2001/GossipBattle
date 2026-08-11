"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { PostFeed } from "@/components/PostFeed";
import { CreatePostModal } from "@/components/CreatePostModal";
import { FollowersPanel } from "@/components/FollowersPanel";
import { GoToTop } from "@/components/GoToTop";

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

      <main className="w-full max-w-[1400px] mx-auto px-2 md:px-6 py-2 md:py-6 z-10 relative flex justify-center items-start mt-1 md:mt-4 min-h-[calc(100vh-8rem)]">
        <div className="w-full max-w-2xl shrink-0">
          <PostFeed key={refreshFeedKey} />
        </div>
        
        <div className="hidden lg:block absolute left-[50%] top-2 md:top-6 bottom-0 w-[264px] xl:w-[304px] ml-[336px] pl-10 pointer-events-none">
          <div className="pointer-events-auto w-full sticky top-2 md:top-6">
            <FollowersPanel />
          </div>
        </div>

        <CreatePostModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          onPostCreated={() => setRefreshFeedKey(prev => prev + 1)} 
        />
        <GoToTop />
      </main>
    </div>
  );
}

