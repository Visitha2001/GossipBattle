"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Camera } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: any;
  onGroupUpdated: () => void;
}

export function EditGroupModal({ isOpen, onClose, group, onGroupUpdated }: EditGroupModalProps) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (group) {
      setName(group.name || "");
      setBio(group.bio || "");
      setCategory(group.category || "");
      setCoverImage(group.coverImage || "");
      setProfileImage(group.profileImage || "");
    }
  }, [group]);

  if (!isOpen || !group) return null;

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setUploadingCover(true);
    try {
      const res = await api.upload.image(file);
      setCoverImage(res.url);
      toast.success("Cover image uploaded!");
    } catch (error) {
      toast.error("Failed to upload cover image");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setUploadingProfile(true);
    try {
      const res = await api.upload.image(file);
      setProfileImage(res.url);
      toast.success("Profile image uploaded!");
    } catch (error) {
      toast.error("Failed to upload profile image");
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/groups/${group._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, category, coverImage, profileImage })
      });
      
      if (!res.ok) throw new Error("Failed to update group");
      
      toast.success("Group updated successfully!");
      onClose();
      onGroupUpdated();
    } catch (error) {
      toast.error("Error updating group");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-border animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-xl font-bold">Edit Group</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          {/* Cover & Profile Upload */}
          <div className="relative w-full h-36 bg-muted rounded-xl overflow-hidden border border-border group">
            {coverImage ? (
              <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary/30 to-purple-600/30 flex items-center justify-center text-xs text-muted-foreground">
                No Cover Image
              </div>
            )}
            <label className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full cursor-pointer transition-colors backdrop-blur-sm">
              {uploadingCover ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </label>

            <div className="absolute left-4 bottom-2 w-16 h-16 rounded-xl border-2 border-background bg-muted flex items-center justify-center overflow-hidden shadow-md group/avatar">
              {profileImage ? (
                <img src={profileImage} alt="Profile Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-muted-foreground">{name ? name.charAt(0).toUpperCase() : "G"}</span>
              )}
              <label className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                {uploadingProfile ? <Loader2 size={16} className="animate-spin text-white" /> : <Camera size={16} className="text-white" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleProfileUpload} />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Group Name <span className="text-destructive">*</span></label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="">Select a category</option>
              <option value="Gaming">Gaming</option>
              <option value="Technology">Technology</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Sports">Sports</option>
              <option value="Music">Music</option>
              <option value="Art & Design">Art & Design</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full border border-input bg-background rounded-md p-2 min-h-[90px] text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="What is this group about?"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-full text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={!name.trim() || isSubmitting || uploadingCover || uploadingProfile}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
