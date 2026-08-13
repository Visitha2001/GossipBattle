"use client";

import { useEffect, useState, use } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { PostCard } from "@/components/PostCard";
import { Loader2, Edit2, Camera, SmilePlus, Search } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';
import { toast } from "sonner";
import Link from "next/link";
import { UserListModal } from "@/components/UserListModal";
import { CreatePostModal } from "@/components/CreatePostModal";

export default function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const resolvedParams = use(params);
  const handle = resolvedParams.handle;
  const { user, isCreateModalOpen, setIsCreateModalOpen } = useAuthStore();
  
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const [followingSearch, setFollowingSearch] = useState("");
  const [followersSearch, setFollowersSearch] = useState("");

  const filteredFollowing = (profile?.following || []).filter((f: any) => 
    f.name?.toLowerCase().includes(followingSearch.toLowerCase()) || 
    f.handle?.toLowerCase().includes(followingSearch.toLowerCase())
  );
  const displayedFollowing = followingSearch ? filteredFollowing : filteredFollowing.slice(0, 5);

  const filteredFollowers = (profile?.followers || []).filter((f: any) => 
    f.name?.toLowerCase().includes(followersSearch.toLowerCase()) || 
    f.handle?.toLowerCase().includes(followersSearch.toLowerCase())
  );
  const displayedFollowers = followersSearch ? filteredFollowers : filteredFollowers.slice(0, 5);

  const fetchProfile = async () => {
    try {
      const data = await api.users.getProfile(handle);
      setProfile(data.user);
      setPosts(data.posts);
      setEditBio(data.user.bio || "");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProfile();
  }, [handle]);

  const handleSaveBio = async () => {
    setIsSaving(true);
    try {
      await api.users.updateProfile(profile.handle, { bio: editBio });
      setProfile({ ...profile, bio: editBio });
      setIsEditing(false);
      toast.success("Bio updated!");
    } catch (err) {
      toast.error("Failed to update bio");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    // Optimistic UI could be here, but we'll upload then update
    const toastId = toast.loading("Uploading cover photo...");
    try {
      const uploadRes = await api.upload.image(file);
      await api.users.updateProfile(profile.handle, { coverPhoto: uploadRes.url });
      setProfile({ ...profile, coverPhoto: uploadRes.url });
      toast.success("Cover photo updated!", { id: toastId });
    } catch (err) {
      toast.error("Upload failed", { id: toastId });
    }
  };
  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    const toastId = toast.loading("Uploading profile picture...");
    try {
      const uploadRes = await api.upload.image(file);
      await api.users.updateProfile(profile.handle, { avatar: uploadRes.url });
      setProfile({ ...profile, avatar: uploadRes.url });
      toast.success("Profile picture updated!", { id: toastId });
    } catch (err) {
      toast.error("Upload failed", { id: toastId });
    }
  };

  const handleFollowToggle = async (userId: string, isCurrentlyFollowing: boolean) => {
    // Optimistic UI update
    setProfile((prev: any) => {
      let newFollowers = [...(prev.followers || [])];
      
      if (isCurrentlyFollowing) {
        newFollowers = newFollowers.filter((f: any) => f._id !== user?._id);
      } else {
        newFollowers.push({ _id: user?._id, name: user?.name, handle: user?.handle, avatar: user?.avatar, handleColor: user?.handleColor });
      }
      return { ...prev, followers: newFollowers };
    });

    if (user) {
      const newFollowingList = isCurrentlyFollowing
        ? (user.following || []).filter((id: string) => id !== userId)
        : [...(user.following || []), userId];
      useAuthStore.getState().setUser({ ...user, following: newFollowingList });
    }

    try {
      await api.users.follow(userId);
      // We don't fetchProfile() here to avoid a UI flicker. The optimistic update handles it instantly.
    } catch (err) {
      toast.error("Failed to update follow status");
      fetchProfile(); // Revert by fetching real state
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-5xl mx-auto py-4 md:py-6 px-2 md:px-4">
          <div className="relative w-full h-48 md:h-64 bg-muted rounded-xl animate-pulse"></div>
          <div className="relative sm:-mt-2 -mt-18 sm:px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-16 mb-2">
              <div className="flex items-end gap-4 relative z-10">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-background bg-muted animate-pulse"></div>
                <div className="pb-3 pt-20 sm:pb-4 space-y-2">
                  <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="mt-2 h-4 w-full max-w-2xl bg-muted rounded animate-pulse"></div>
            <div className="mt-2 h-4 w-3/4 max-w-xl bg-muted rounded animate-pulse"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-xl text-muted-foreground">User not found.</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?._id === profile._id;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto py-4 md:py-6 px-2 md:px-4">
        {/* Cover Photo */}
        <div className="relative w-full h-48 md:h-64 bg-muted rounded-xl overflow-hidden shadow-sm">
          {profile.coverPhoto ? (
            <img src={profile.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/5" />
          )}
          {isOwnProfile && (
            <label className="absolute top-4 right-4 sm:bottom-4 sm:top-auto bg-black/60 hover:bg-black/80 text-white p-2 rounded-full cursor-pointer transition-colors backdrop-blur-sm shadow-md z-20">
              <Camera size={20} />
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverPhotoUpload} />
            </label>
          )}
        </div>

        {/* Profile Info */}
        <div className="relative sm:-mt-2 -mt-18 sm:px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-16 mb-2">
            <div className="flex items-end gap-4 relative z-10">
              <div className="relative group shrink-0">
                <div 
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-background flex items-center justify-center text-3xl font-bold text-white overflow-hidden shadow-md bg-muted"
                  style={{ backgroundColor: profile.handleColor || "var(--primary)" }}
                >
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    profile.name.charAt(0).toUpperCase()
                  )}
                </div>
                {isOwnProfile && (
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full cursor-pointer transition-opacity backdrop-blur-[2px]">
                    <Camera size={24} className="text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                )}
              </div>
              
              <div className="pb-3 pt-20 sm:pb-4">
                <h1 className="text-2xl font-bold leading-tight">{profile.name}</h1>
                <p className="font-semibold opacity-90 text-sm" style={{ color: profile.handleColor }}>{profile.handle}</p>
              </div>
            </div>

            {/* Follow/Stats section */}
            <div className="flex items-center gap-6 pb-3 sm:pb-4 text-sm z-10">
              <button onClick={() => setIsFollowersModalOpen(true)} className="flex flex-col items-center hover:opacity-80 transition-opacity">
                <span className="font-bold text-lg">{profile.followers?.length || 0}</span>
                <span className="text-muted-foreground">Followers</span>
              </button>
              <button onClick={() => setIsFollowingModalOpen(true)} className="flex flex-col items-center hover:opacity-80 transition-opacity">
                <span className="font-bold text-lg">{profile.following?.length || 0}</span>
                <span className="text-muted-foreground">Following</span>
              </button>
              {!isOwnProfile && user && (
                <button
                  onClick={() => handleFollowToggle(profile._id, profile.followers?.some((f: any) => f._id === user._id))}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-full font-medium ml-2 transition-colors shadow-sm"
                >
                  {profile.followers?.some((f: any) => f._id === user._id) ? "Unfollow" : "Follow"}
                </button>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="mt-2 max-w-2xl relative z-10">
            {isEditing ? (
              <div className="flex flex-col gap-2 relative">
                <div className="relative">
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full border border-input bg-transparent rounded-md p-2 pl-9 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
                    placeholder="Write something about yourself... you can use @mentions or #hashtags"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute top-2 left-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <SmilePlus size={16} />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute top-full left-0 z-50 mt-1">
                      <EmojiPicker theme={"dark" as any} onEmojiClick={(emojiObject) => {
                        setEditBio((prev) => prev + emojiObject.emoji);
                        setShowEmojiPicker(false);
                      }} />
                    </div>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setIsEditing(false); setShowEmojiPicker(false); }} className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors">Cancel</button>
                  <button onClick={handleSaveBio} disabled={isSaving} className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="group flex flex-col items-start gap-2 relative">
                <p className="text-foreground whitespace-pre-wrap flex-1">{profile.bio || "No bio provided yet."}</p>
                {isOwnProfile && (
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 hover:bg-muted px-2 py-1 rounded-md transition-colors mt-1">
                    <Edit2 size={12} /> Edit Bio
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content Section: Posts and Follows */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-bold">Posts</h3>
              {isOwnProfile && (
                <button 
                  onClick={() => setIsCreateModalOpen(true)} 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-1.5 rounded-full text-sm font-medium transition-colors shadow-sm"
                >
                  Create Post
                </button>
              )}
            </div>
            {posts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No posts to display.</p>
            ) : (
              posts.map((post) => (
                <PostCard key={post._id} post={post} onUpdate={fetchProfile} />
              ))
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <h3 className="font-bold mb-3">Following ({profile.following?.length || 0})</h3>
              
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input 
                  type="text"
                  placeholder="Search following..."
                  value={followingSearch}
                  onChange={(e) => setFollowingSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-muted/50 border border-input rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {displayedFollowing.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No matches found.</p>
                ) : (
                  displayedFollowing.map((f: any) => (
                    <div key={f._id} className="flex items-center justify-between">
                      <Link href={`/profile/${f.handle}`} className="flex items-center gap-2 group cursor-pointer">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold shrink-0" style={{ backgroundColor: f.handleColor || "var(--primary)" }}>
                          {f.avatar ? <img src={f.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : f.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium group-hover:underline truncate">{f.name}</span>
                          <span className="text-xs group-hover:underline truncate" style={{ color: f.handleColor }}>{f.handle}</span>
                        </div>
                      </Link>
                      {isOwnProfile && (
                        <button 
                          onClick={() => handleFollowToggle(f._id, true)}
                          className="text-[10px] bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground px-2 py-1 rounded transition-colors shrink-0"
                        >
                          Unfollow
                        </button>
                      )}
                    </div>
                  ))
                )}
                {!followingSearch && profile.following?.length > 5 && (
                  <button onClick={() => setIsFollowingModalOpen(true)} className="text-xs text-primary hover:underline w-full text-center mt-2">View all</button>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <h3 className="font-bold mb-3">Followers ({profile.followers?.length || 0})</h3>
              
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input 
                  type="text"
                  placeholder="Search followers..."
                  value={followersSearch}
                  onChange={(e) => setFollowersSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-muted/50 border border-input rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {displayedFollowers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No matches found.</p>
                ) : (
                  displayedFollowers.map((f: any) => (
                    <div key={f._id} className="flex items-center justify-between">
                      <Link href={`/profile/${f.handle}`} className="flex items-center gap-2 group cursor-pointer">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold shrink-0" style={{ backgroundColor: f.handleColor || "var(--primary)" }}>
                          {f.avatar ? <img src={f.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : f.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium group-hover:underline truncate">{f.name}</span>
                          <span className="text-xs group-hover:underline truncate" style={{ color: f.handleColor }}>{f.handle}</span>
                        </div>
                      </Link>
                    </div>
                  ))
                )}
                {!followersSearch && profile.followers?.length > 5 && (
                  <button onClick={() => setIsFollowersModalOpen(true)} className="text-xs text-primary hover:underline w-full text-center mt-2">View all</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <UserListModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        title="Followers"
        users={profile.followers || []}
        onFollowToggle={fetchProfile}
      />
      <UserListModal
        isOpen={isFollowingModalOpen}
        onClose={() => setIsFollowingModalOpen(false)}
        title="Following"
        users={profile.following || []}
        onFollowToggle={fetchProfile}
      />
      
      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onPostCreated={fetchProfile} 
      />
    </div>
  );
}
