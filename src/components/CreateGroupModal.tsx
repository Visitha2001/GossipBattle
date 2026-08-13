"use client";

import { useState } from "react";
import { X, Loader2, Camera } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated?: () => void;
}

export function CreateGroupModal({ isOpen, onClose, onGroupCreated }: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      // In a real app we'd handle cover/profile images here via api.upload.image
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, category })
      });
      
      if (!res.ok) throw new Error("Failed to create group");
      
      const newGroup = await res.json();
      toast.success("Group created!");
      
      setName("");
      setBio("");
      setCategory("");
      onClose();
      
      if (onGroupCreated) {
        onGroupCreated();
      } else {
        router.push(`/groups/${newGroup._id}`);
      }
    } catch (error) {
      toast.error("Error creating group");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-border animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-xl font-bold">Create Group</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Group Name <span className="text-destructive">*</span></label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. Gaming Enthusiasts"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
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
              className="w-full border border-input bg-background rounded-md p-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="What is this group about?"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-full font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={!name.trim() || isSubmitting}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
