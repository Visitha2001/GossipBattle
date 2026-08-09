"use client";

import { useEffect, useState, useRef } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { LogOut, Bell, Check, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();
  const { user, setUser, isLoading, setIsLoading, setIsCreateModalOpen } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const data = await api.auth.me();
        setUser(data.user);
      } catch (error) {
        console.error("Auth check failed", error);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, [setUser, setIsLoading]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      const eventSource = new EventSource('/api/notifications/stream');
      
      eventSource.onmessage = (event) => {
        try {
          const newNotif = JSON.parse(event.data);
          setNotifications(prev => {
            // Check if it already exists to prevent duplicates
            if (prev.find(n => n._id === newNotif._id)) return prev;
            
            // Show toast for new notification
            let msg = `${newNotif.actor?.name || 'Someone'}`;
            if (newNotif.type === 'mention') msg += " mentioned you in a post.";
            else if (newNotif.type === 'follow') msg += " started following you.";
            else if (newNotif.type === 'comment') msg += " commented on your post.";
            else if (newNotif.type === 'battle') msg += " joined a battle on your post.";
            else if (newNotif.type === 'like') msg += " liked your post/comment.";
            else if (newNotif.type === 'share') msg += " shared your post.";
            toast(msg, { icon: "🔔" });

            return [newNotif, ...prev];
          });
        } catch (err) {
          console.error("Failed to parse SSE data", err);
        }
      };

      return () => {
        eventSource.close();
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const data = await api.notifications.getAll();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const data = await api.auth.google(credentialResponse.credential);
      setUser(data.user);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-colors duration-300">
      <div className="container flex h-16 items-center justify-between mx-auto px-4 md:px-6 gap-2">
        <div className="flex items-center space-x-2 md:space-x-4">
          <Link href="/">
            <span className="font-extrabold text-xl md:text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500 hover:opacity-80 transition-opacity cursor-pointer">
              GossipBattle
            </span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          <ThemeToggle />
          
          {isLoading ? (
            <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
          ) : user ? (
            <div className="flex items-center space-x-2 md:space-x-4 shrink-0">
              <div className="relative flex items-center" ref={notificationsRef}>
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2 rounded-full hover:bg-muted transition-colors focus:outline-none"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-background"></span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-md border bg-popover text-popover-foreground shadow-md outline-none max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between p-3 border-b">
                      <h4 className="font-semibold">Notifications</h4>
                      {unreadCount > 0 && (
                        <button onClick={() => handleMarkAsRead()} className="text-xs text-primary hover:underline flex items-center gap-1">
                          <Check size={12} /> Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">No notifications yet.</div>
                    ) : (
                      <div className="divide-y divide-border">
                        {notifications.map((notif) => (
                          <div 
                            key={notif._id} 
                            onClick={() => {
                              if (!notif.read) handleMarkAsRead(notif._id);
                              
                              if (notif.type === 'follow') {
                                setIsNotificationsOpen(false);
                                router.push(`/profile/${notif.actor?.handle}`);
                              } else if (notif.post) {
                                setIsNotificationsOpen(false);
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
                                }, 100);
                              }
                            }}
                            className={`p-3 text-sm cursor-pointer hover:bg-muted/50 transition-colors ${!notif.read ? 'bg-primary/5' : ''}`}
                          >
                            <div className="flex gap-2 items-start">
                              {!notif.read && (
                                <div className="w-2 h-2 bg-primary rounded-full mt-3 shrink-0" />
                              )}
                              {notif.actor?.avatar ? (
                                <img src={notif.actor.avatar} alt="Avatar" className="h-8 w-8 rounded-full border" />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                  <span className="text-xs font-medium">{notif.actor?.name?.charAt(0)}</span>
                                </div>
                              )}
                              <div>
                                <p>
                                  <Link href={`/profile/${notif.actor?.handle}`} onClick={(e) => e.stopPropagation()}>
                                    <span className="font-semibold hover:underline" style={{ color: notif.actor?.handleColor }}>
                                      {notif.actor?.name}
                                    </span>
                                  </Link>{" "}
                                  {notif.type === 'mention' && "mentioned you in a post."}
                                  {notif.type === 'follow' && "started following you."}
                                  {notif.type === 'comment' && "commented on your post."}
                                  {notif.type === 'battle' && "joined a battle on your post."}
                                  {notif.type === 'like' && "liked your post/comment."}
                                  {notif.type === 'share' && "shared your post."}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(notif.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>


              <div className="relative flex items-center" ref={dropdownRef}>
                <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 focus:outline-none"
                title="Profile"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="h-8 w-8 rounded-full border hover:ring-2 hover:ring-primary transition-all" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center hover:ring-2 hover:ring-primary transition-all">
                    <span className="text-sm font-medium">{user.name.charAt(0)}</span>
                  </div>
                )}
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-66 rounded-md border bg-popover text-popover-foreground shadow-md outline-none">
                  <div className="flex items-center space-x-3 p-4 border-b">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="h-10 w-10 rounded-full border" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/50 flex items-center justify-center">
                        <span className="text-base font-medium">{user.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      {user.handle && (
                        <p 
                          className="text-xs font-semibold leading-none mt-1"
                          style={{ color: user.handleColor || 'inherit' }}
                        >
                          {user.handle}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="p-1">
                    {user.handle && (
                      <Link
                        href={`/profile/${user.handle}`}
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-muted transition-colors cursor-pointer"
                      >
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-red-600 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.error("Login Failed")}
                useOneTap
                theme="outline"
                shape="pill"
                text="signin_with"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
