"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";
import { Loader2, Plus, Users, Rss, Layers, X } from "lucide-react";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { PostCard } from "@/components/PostCard";

export default function GroupsPage() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<any[]>([]);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupFeed = async () => {
    setLoadingFeed(true);
    try {
      const res = await fetch("/api/groups/feed");
      if (res.ok) {
        const data = await res.json();
        setFeedPosts(data);
      }
    } catch (error) {
      console.error("Error fetching group feed:", error);
    } finally {
      setLoadingFeed(false);
    }
  };

  const loadData = async () => {
    await Promise.all([fetchGroups(), fetchGroupFeed()]);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 bg-background min-h-screen">
        {/* Main Feed Skeleton */}
        <main className="flex-1 max-w-[700px] mx-auto px-2 md:px-6 py-2 md:py-6 mt-1 md:mt-4 w-full z-10 relative">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
            <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-muted rounded animate-pulse hidden lg:block"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-sm h-48 animate-pulse"></div>
            ))}
          </div>
        </main>
        
        {/* Right Sidebar Skeleton */}
        <div className="hidden lg:block w-[320px] shrink-0" />
        <aside className="hidden lg:flex flex-col w-[320px] border-l border-border bg-background fixed right-0 top-16 bottom-0 z-20">
          <div className="p-5 flex-1 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="h-5 w-24 bg-muted rounded animate-pulse"></div>
              <div className="h-6 w-16 bg-muted rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 bg-muted/20 p-3 rounded-xl border border-border/50 animate-pulse">
                  <div className="w-12 h-12 rounded-lg bg-muted shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded"></div>
                    <div className="h-3 w-1/2 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    );
  }

  const createdGroups = groups.filter(g => g.admin === user?._id || g.admin?._id === user?._id);
  const joinedGroups = groups.filter(g => g.admin !== user?._id && g.admin?._id !== user?._id);

  return (
    <div className="flex flex-1 bg-background min-h-screen">
      {/* Main Feed */}
      <main className="flex-1 max-w-[700px] mx-auto px-2 md:px-6 py-2 md:py-6 mt-1 md:mt-4 z-10 relative">
        <div className="sticky top-16 z-30 bg-background/95 backdrop-blur pt-2 pb-2 flex items-center justify-between mb-4 border-b border-border">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Rss size={20} className="text-primary" /> Group Feed
          </h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors flex items-center gap-1 text-xs font-semibold px-3"
            >
              <Layers size={14} /> Groups
            </button>
            <span className="hidden lg:inline text-xs text-muted-foreground">Posts from your joined groups</span>
          </div>
        </div>

        {loadingFeed ? (
          <div className="space-y-4 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-sm h-48 animate-pulse flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 bg-muted rounded"></div>
                    <div className="h-3 w-24 bg-muted rounded"></div>
                  </div>
                </div>
                <div className="h-16 w-full bg-muted rounded mt-2"></div>
              </div>
            ))}
          </div>
        ) : feedPosts.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl shadow-sm px-4">
            <Rss className="mx-auto text-muted-foreground/40 mb-3" size={48} />
            <h3 className="text-lg font-bold mb-1">No Group Posts Yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              No activity found in your groups yet. Select a group on the right panel to post!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedPosts.map((post) => (
              <PostCard key={post._id} post={post} onUpdate={fetchGroupFeed} />
            ))}
          </div>
        )}
      </main>

      {/* Right Sidebar Placeholder (maintains layout width for the fixed sidebar on desktop) */}
      <div className="hidden lg:block w-[320px] shrink-0" />

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 top-16 bg-black/60 z-[90] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Right Sidebar (Fixed) */}
      <aside className={`
        fixed right-0 top-16 bottom-0 z-[95] lg:z-20 w-[320px] max-w-[85vw] bg-background border-l border-border flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "translate-x-full lg:translate-x-0 lg:shadow-none"}
      `}>
        <div className="p-5 flex-1">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <h3 className="font-bold flex items-center gap-2 text-base">
              <Layers size={18} className="text-primary" /> Your Groups ({groups.length})
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { setIsCreateModalOpen(true); setIsMobileSidebarOpen(false); }}
                className="bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1 rounded-full text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Plus size={14} /> New
              </button>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="lg:hidden p-1 hover:bg-muted rounded-full text-muted-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="text-center mt-8">
              <p className="text-sm text-muted-foreground mb-4">You haven't joined or created any groups yet.</p>
              <button 
                onClick={() => { setIsCreateModalOpen(true); setIsMobileSidebarOpen(false); }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-full text-sm font-medium transition-colors"
              >
                Create your first group
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {createdGroups.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Groups You Created</h4>
                  <div className="space-y-3">
                    {createdGroups.map((group) => (
                      <Link
                        key={group._id}
                        href={`/groups/${group._id}`}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className="flex items-center gap-3 bg-card hover:bg-muted/50 p-3 rounded-xl border border-border/50 transition-all group"
                      >
                        <div className="relative w-12 h-12 rounded-lg bg-muted flex items-center justify-center font-bold text-white overflow-hidden shrink-0" style={{ backgroundColor: "var(--primary)" }}>
                          {group.profileImage ? (
                            <img src={group.profileImage} alt={group.name} className="w-full h-full object-cover" />
                          ) : (
                            group.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{group.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span className="text-[10px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded truncate">
                              {group.category || "General"}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Users size={12} /> {group.members?.length || 1}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {joinedGroups.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Groups You Joined</h4>
                  <div className="space-y-3">
                    {joinedGroups.map((group) => (
                      <Link
                        key={group._id}
                        href={`/groups/${group._id}`}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className="flex items-center gap-3 bg-card hover:bg-muted/50 p-3 rounded-xl border border-border/50 transition-all group"
                      >
                        <div className="relative w-12 h-12 rounded-lg bg-muted flex items-center justify-center font-bold text-white overflow-hidden shrink-0" style={{ backgroundColor: "var(--primary)" }}>
                          {group.profileImage ? (
                            <img src={group.profileImage} alt={group.name} className="w-full h-full object-cover" />
                          ) : (
                            group.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{group.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span className="text-[10px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded truncate">
                              {group.category || "General"}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Users size={12} /> {group.members?.length || 1}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      <CreateGroupModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={loadData}
      />
    </div>
  );
}
