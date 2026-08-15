"use client";

import { useEffect, useState, use } from "react";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { PostCard } from "@/components/PostCard";
import { CreatePostModal } from "@/components/CreatePostModal";
import { EditGroupModal } from "@/components/EditGroupModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ShareModal } from "@/components/ShareModal";
import { AdminPanel } from "@/components/group/AdminPanel";
import { Loader2, Users, Share2, LogOut, Edit2, Trash2, MoreHorizontal, ShieldAlert, X } from "lucide-react";
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  
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

  const handleDeleteGroup = async () => {
    setIsDeletingGroup(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete group");
      toast.success("Group deleted successfully");
      router.push('/groups');
    } catch (error) {
      toast.error("Error deleting group");
    } finally {
      setIsDeletingGroup(false);
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

            {/* Header Actions & 3-Dots Menu */}
            <div className="flex items-center gap-2 pb-3 sm:pb-4 z-10 relative">
              {isMember && (
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-full font-medium transition-colors shadow-sm text-sm"
                >
                  Post to Group
                </button>
              )}

              {/* Standalone Share Icon Button */}
              <button 
                onClick={() => setIsShareModalOpen(true)}
                className="p-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-full transition-colors shadow-sm flex items-center justify-center"
                title="Share & Invite"
              >
                <Share2 size={18} />
              </button>

              {/* 3-Dots Menu Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-full transition-colors shadow-sm flex items-center justify-center"
                  title="Group Options"
                >
                  <MoreHorizontal size={18} />
                </button>

                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsMenuOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-40 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-150">
                      {isAdmin && (
                        <>
                          <button 
                            onClick={() => { setIsMenuOpen(false); setIsEditModalOpen(true); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2.5 text-foreground font-medium transition-colors"
                          >
                            <Edit2 size={16} /> Edit Group
                          </button>
                          <button 
                            onClick={() => { setIsMenuOpen(false); setIsAdminModalOpen(true); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2.5 text-foreground font-medium transition-colors"
                          >
                            <ShieldAlert size={16} /> Manage Members
                          </button>
                          <div className="my-1 border-t border-border" />
                          <button 
                            onClick={() => { setIsMenuOpen(false); setIsDeleteModalOpen(true); }}
                            className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2.5 font-medium transition-colors"
                          >
                            <Trash2 size={16} /> Delete Group
                          </button>
                        </>
                      )}

                      {isMember && !isAdmin && (
                        <button 
                          onClick={() => { setIsMenuOpen(false); handleLeaveGroup(); }}
                          className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2.5 font-medium transition-colors"
                        >
                          <LogOut size={16} /> Leave Group
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
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
                          <span className="text-[10px] bg-primary/20 text-primary px-1 rounded uppercase font-semibold">Admin</span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">{member.handle}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onPostCreated={fetchGroupData} 
        groupId={groupId}
      />

      <EditGroupModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        group={group}
        onGroupUpdated={fetchGroupData}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url={typeof window !== "undefined" ? window.location.href : ""}
        groupId={group._id}
        groupMembers={group.members}
        title={`Share & Invite to ${group.name}`}
      />

      {/* Admin Member Management Modal */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-border animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-lg font-bold flex items-center gap-2 text-destructive">
                <ShieldAlert size={20} /> Group Member Controls
              </h2>
              <button onClick={() => setIsAdminModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 max-h-[80vh] overflow-y-auto">
              <AdminPanel 
                groupId={group._id} 
                members={group.members} 
                onUpdate={fetchGroupData} 
                adminId={user?._id || ""} 
                onEditGroup={() => { setIsAdminModalOpen(false); setIsEditModalOpen(true); }}
                onDeleteGroup={() => { setIsAdminModalOpen(false); setIsDeleteModalOpen(true); }}
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteGroup}
        title="Delete Group"
        description={`Are you sure you want to delete "${group.name}"? This action cannot be undone and will delete all group content.`}
        confirmText="Delete Group"
        isLoading={isDeletingGroup}
      />
    </div>
  );
}
