"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";
import { Loader2, Plus, Users } from "lucide-react";
import { CreateGroupModal } from "@/components/CreateGroupModal";

export default function GroupsPage() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col flex-1 bg-background justify-center items-center h-[calc(100vh-4rem)]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-background relative overflow-hidden">
      <main className="w-full max-w-[1000px] mx-auto px-4 py-6 z-10 relative mt-4 min-h-[calc(100vh-8rem)]">
        <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="text-primary" /> Your Groups
            </h1>
            <p className="text-muted-foreground mt-1">Discover and manage communities you are part of.</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={18} />
            Create Group
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-xl shadow-sm">
            <Users className="mx-auto text-muted-foreground/50 mb-4" size={64} />
            <h2 className="text-2xl font-bold mb-2">No Groups Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You haven't joined any groups yet. Create one to start building your community or wait for an invite!
            </p>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-full font-medium transition-colors"
            >
              Create Your First Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <Link href={`/groups/${group._id}`} key={group._id} className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors shadow-sm hover:shadow-md">
                <div className="h-32 bg-muted relative">
                  {group.coverImage ? (
                    <img src={group.coverImage} alt={group.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-500/30" />
                  )}
                  <div className="absolute -bottom-6 left-4 w-16 h-16 rounded-xl border-4 border-card bg-muted flex items-center justify-center text-xl font-bold text-white overflow-hidden shadow-sm" style={{ backgroundColor: "var(--primary)" }}>
                    {group.profileImage ? (
                      <img src={group.profileImage} alt={group.name} className="w-full h-full object-cover" />
                    ) : (
                      group.name.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>
                <div className="p-4 pt-8 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">{group.name}</h3>
                  <p className="text-xs text-primary font-medium mb-2">{group.category || "General"}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-4">
                    {group.bio || "No description provided."}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground pt-4 border-t border-border mt-auto">
                    <Users size={14} className="mr-1" />
                    {group.members?.length || 1} members
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <CreateGroupModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={fetchGroups}
      />
    </div>
  );
}
