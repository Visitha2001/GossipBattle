"use client";

import { useEffect, useState, use } from "react";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { PostCard } from "@/components/PostCard";
import { CreatePostModal } from "@/components/CreatePostModal";
import { AdminPanel } from "@/components/group/AdminPanel";
import { Loader2, Users, Camera, Settings, Share2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.groupId;
  
  const { user } = useAuthStore();
  const [group, setGroup] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const router = useRouter();

  const fetchGroupData = async () => {
    try {
      const [groupRes, postsRes] = await Promise.all([
        fetch(`/api/groups/${groupId}`),
        fetch(`/api/groups/${groupId}/posts`)
      ]);
      
      if (!groupRes.ok) {
        if (groupRes.status === 404) {
          router.push('/groups');
          toast.error("Group not found");
        }
        return;
      }
      
      const groupData = await groupRes.json();
      setGroup(groupData);
      
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading group");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const handleLeaveGroup = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: user._id })
      });
      
      if (res.ok) {
        toast.success("Left group successfully");
        router.push('/groups');
      } else {
        toast.error("Error leaving group");
      }
    } catch (error) {
      toast.error("Error leaving group");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 justify-center items-center h-[calc(100vh-4rem)] bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!group) return null;

  const isAdmin = user && group.admin._id === user._id;
  const isMember = user && group.members.some((m: any) => m._id === user._id);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto py-4 md:py-6 px-2 md:px-4">
        {/* Cover Photo */}
        <div className="relative w-full h-48 md:h-64 bg-muted rounded-xl overflow-hidden shadow-sm">
          {group.coverImage ? (
            <img src={group.coverImage} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/30 to-purple-600/30" />
          )}
        </div>

        {/* Profile Info */}
        <div className="relative sm:-mt-2 -mt-18 sm:px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-16 mb-2">
            <div className="flex items-end gap-4 relative z-10">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl border-4 border-background flex items-center justify-center text-3xl font-bold text-white overflow-hidden shadow-md bg-muted" style={{ backgroundColor: "var(--primary)" }}>
                {group.profileImage ? (
                  <img src={group.profileImage} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  group.name.charAt(0).toUpperCase()
                )}
              </div>
              
              <div className="pb-3 pt-20 sm:pb-4">
                <h1 className="text-2xl font-bold leading-tight">{group.name}</h1>
                <p className="text-sm text-primary font-medium">{group.category || "General"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pb-3 sm:pb-4 z-10">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied to clipboard!");
                }}
                className="bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-full font-medium transition-colors shadow-sm flex items-center gap-2 text-sm"
              >
                <Share2 size={16} /> Share
              </button>
              
              {isMember && !isAdmin && (
                <button 
                  onClick={handleLeaveGroup}
                  className="bg-destructive/10 text-destructive hover:bg-destructive/20 px-4 py-2 rounded-full font-medium transition-colors shadow-sm flex items-center gap-2 text-sm"
                >
                  <LogOut size={16} /> Leave
                </button>
              )}
            </div>
          </div>

          <div className="mt-2 max-w-2xl relative z-10">
            <p className="text-foreground whitespace-pre-wrap">{group.bio || "No description provided."}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1"><Users size={16} /> {group.members.length} members</div>
              <div>Admin: {group.admin.handle}</div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-bold">Group Feed</h3>
              {isMember && (
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-1.5 rounded-full text-sm font-medium transition-colors shadow-sm"
                >
                  Post to Group
                </button>
              )}
            </div>
            
            {!isMember ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border shadow-sm">
                <Users className="mx-auto text-muted-foreground/50 mb-3" size={48} />
                <h3 className="text-lg font-bold">Members Only</h3>
                <p className="text-muted-foreground text-sm">You must be a member of this group to view posts.</p>
              </div>
            ) : posts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 bg-card rounded-xl border border-border shadow-sm">No posts in this group yet. Be the first to post!</p>
            ) : (
              posts.map((post) => (
                <PostCard key={post._id} post={post} onUpdate={fetchGroupData} />
              ))
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <h3 className="font-bold mb-3">Members ({group.members.length})</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {group.members.map((member: any) => (
                  <div key={member._id} className="flex items-center gap-2 group cursor-pointer">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold shrink-0" style={{ backgroundColor: member.handleColor || "var(--primary)" }}>
                      {member.avatar ? <img src={member.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : member.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium group-hover:underline truncate flex items-center gap-2">
                        {member.name}
                        {member._id === group.admin._id && (
                          <span className="text-[10px] bg-primary/20 text-primary px-1 rounded uppercase">Admin</span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">{member.handle}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {isAdmin && (
              <AdminPanel 
                groupId={group._id} 
                members={group.members} 
                onUpdate={fetchGroupData} 
                adminId={user._id} 
              />
            )}
          </div>
        </div>
      </main>

      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onPostCreated={fetchGroupData} 
        groupId={groupId}
      />
    </div>
  );
}
