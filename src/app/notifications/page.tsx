"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Loader2, Bell, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const data = await api.notifications.getAll();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      const eventSource = new EventSource('/api/notifications/stream');
      
      eventSource.onmessage = (event) => {
        try {
          const newNotif = JSON.parse(event.data);
          setNotifications(prev => {
            if (prev.find(n => n._id === newNotif._id)) return prev;
            return [newNotif, ...prev];
          });
        } catch (err) {
          console.error("Failed to parse SSE data", err);
        }
      };

      return () => {
        eventSource.close();
      };
    } else if (user === null) {
      router.push("/");
    }
  }, [user, router]);

  const handleMarkAsRead = async (id?: string) => {
    try {
      await api.notifications.markRead(id);
      if (id) {
        setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
      } else {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex flex-col flex-1 bg-background justify-center items-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-background min-h-screen">
      <main className="flex-1 w-full max-w-[700px] mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="text-primary" size={24} /> 
            Notifications
          </h1>
          {unreadCount > 0 && (
            <button 
              onClick={() => handleMarkAsRead()} 
              className="text-sm text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <Check size={16} /> Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl shadow-sm px-4">
            <Bell className="mx-auto text-muted-foreground/40 mb-3" size={48} />
            <h3 className="text-lg font-bold mb-1">No Notifications Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              When people interact with your posts or invite you to groups, you'll see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div 
                key={notif._id} 
                onClick={() => {
                  if (!notif.read) handleMarkAsRead(notif._id);
                  
                  if (notif.type === 'follow') {
                    router.push(`/profile/${notif.actor?.handle}`);
                  } else if (notif.type === 'group_invite') {
                    if (notif.group) {
                      const targetGroupId = typeof notif.group === 'object' ? notif.group?._id : notif.group;
                      router.push(`/groups/${targetGroupId}`);
                    }
                  } else if (notif.post) {
                    let url = `/#${notif.post}`;
                    if (notif.comment) {
                      url = `/?comment=${notif.comment}#${notif.post}`;
                    }
                    router.push(url);
                    
                    setTimeout(() => {
                      const el = document.getElementById(notif.post);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 500);
                  }
                }}
                className={`flex gap-3 items-start p-4 rounded-xl border transition-colors cursor-pointer ${
                  !notif.read ? 'bg-primary/5 border-primary/20' : 'bg-card border-border hover:bg-muted/50'
                }`}
              >
                {!notif.read && (
                  <div className="w-2.5 h-2.5 bg-primary rounded-full mt-2.5 shrink-0" />
                )}
                {notif.actor?.avatar ? (
                  <img src={notif.actor.avatar} alt="Avatar" className="h-10 w-10 rounded-full border shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold">{notif.actor?.name?.charAt(0)}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-base text-foreground">
                    <Link href={`/profile/${notif.actor?.handle}`} onClick={(e) => e.stopPropagation()}>
                      <span className="font-bold hover:underline" style={{ color: notif.actor?.handleColor }}>
                        {notif.actor?.name}
                      </span>
                    </Link>{" "}
                    <span className="text-muted-foreground">
                      {notif.type === 'mention' && "mentioned you in a post."}
                      {notif.type === 'follow' && "started following you."}
                      {notif.type === 'comment' && "commented on your post."}
                      {notif.type === 'battle' && "joined a battle on your post."}
                      {notif.type === 'like' && "liked your post/comment."}
                      {notif.type === 'share' && "shared your post."}
                      {notif.type === 'group_invite' && (typeof notif.group === 'object' && notif.group?.name ? `invited you to join "${notif.group.name}".` : "invited you to a group.")}
                    </span>
                  </p>
                  
                  {notif.type === 'group_invite' && (
                    <div className="mt-3 flex items-center gap-2">
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          const targetGroupId = typeof notif.group === 'object' ? notif.group?._id : notif.group;
                          try {
                            const res = await fetch(`/api/groups/${targetGroupId}/members`, { method: "POST" });
                            if (!res.ok) throw new Error("Failed to join");
                            toast.success("Joined group!");
                            handleMarkAsRead(notif._id);
                            router.push(`/groups/${targetGroupId}`);
                          } catch (err) {
                            toast.error("Failed to join group");
                          }
                        }}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-1.5 rounded-md text-sm font-semibold transition-colors shadow-sm"
                      >
                        Accept Invite
                      </button>
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notif._id);
                          toast.info("Invite declined");
                        }}
                        className="bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-1.5 rounded-md text-sm font-semibold transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  <span className="text-xs font-medium text-muted-foreground/60 block mt-1.5">
                    {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
