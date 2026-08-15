"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { X, UserMinus, ShieldAlert, Edit2, Trash2 } from "lucide-react";

interface AdminPanelProps {
  groupId: string;
  members: any[];
  onUpdate: () => void;
  adminId: string;
  onEditGroup?: () => void;
  onDeleteGroup?: () => void;
}

export function AdminPanel({ groupId, members, onUpdate, adminId, onEditGroup, onDeleteGroup }: AdminPanelProps) {
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const handleRemoveMember = async (memberId: string) => {
    if (memberId === adminId) {
      toast.error("You cannot remove the admin.");
      return;
    }
    
    setIsRemoving(memberId);
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: memberId })
      });
      
      if (!res.ok) throw new Error("Failed to remove member");
      
      toast.success("Member removed");
      onUpdate();
    } catch (error) {
      toast.error("Error removing member");
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-4 mt-6 space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2 text-destructive font-bold">
          <ShieldAlert size={20} />
          <span>Admin Controls</span>
        </div>
        <div className="flex items-center gap-2">
          {onEditGroup && (
            <button
              onClick={onEditGroup}
              className="text-xs flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 px-2.5 py-1 rounded.full font-medium transition-colors"
            >
              <Edit2 size={13} /> Edit Group
            </button>
          )}
          {onDeleteGroup && (
            <button
              onClick={onDeleteGroup}
              className="text-xs flex items-center gap-1 bg-destructive/10 text-destructive hover:bg-destructive/20 px-2.5 py-1 rounded-full font-medium transition-colors"
            >
              <Trash2 size={13} /> Delete Group
            </button>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Manage Members ({members.length})</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {members.length === 1 && (
            <p className="text-xs text-muted-foreground italic">You are the only member in this group.</p>
          )}
          
          {members.map((member) => (
            <div key={member._id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold shrink-0"
                  style={{ backgroundColor: member.handleColor || "var(--primary)" }}
                >
                  {member.avatar ? (
                    <img src={member.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    member.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate flex items-center gap-2">
                    {member.name}
                    {member._id === adminId && (
                      <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded uppercase font-bold">Admin</span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">{member.handle}</span>
                </div>
              </div>
              
              {member._id !== adminId && (
                <button
                  onClick={() => handleRemoveMember(member._id)}
                  disabled={isRemoving === member._id}
                  className="text-xs flex items-center gap-1 text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-colors"
                  title="Remove Member"
                >
                  {isRemoving === member._id ? <X size={14} className="animate-spin" /> : <UserMinus size={14} />}
                  <span className="hidden sm:inline">Remove</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
