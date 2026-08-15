"use client";

import { useAuthStore } from "@/lib/store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, User as UserIcon, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function MobileNav() {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false); // Hide when scrolling down
      } else {
        setIsVisible(true); // Show when scrolling up
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    if (!user) return;
    
    // Quick check for unread notifications
    const checkUnread = async () => {
      try {
        const notifs = await api.notifications.getAll();
        setHasUnread(notifs.some((n: any) => !n.read));
      } catch (err) {
        // ignore
      }
    };
    checkUnread();

    const eventSource = new EventSource('/api/notifications/stream');
    eventSource.onmessage = (event) => {
      try {
        const newNotif = JSON.parse(event.data);
        if (!newNotif.read) setHasUnread(true);
      } catch (err) {}
    };
    return () => eventSource.close();
  }, [user]);

  if (!user) return null;

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "Groups",
      href: "/groups",
      icon: Users,
      isActive: pathname === "/groups" || pathname?.startsWith("/groups/"),
    },
    {
      label: "Alerts",
      href: "/notifications",
      icon: Bell,
      isActive: pathname === "/notifications",
      hasBadge: hasUnread,
    },
    {
      label: "Profile",
      href: `/profile/${user.handle}`,
      icon: UserIcon,
      isActive: pathname === `/profile/${user.handle}`,
    },
  ];

  return (
    <>
      {/* Spacer to prevent content from hiding behind the bottom nav */}
      <div className="md:hidden h-16 w-full shrink-0" />
      
      <div 
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/50 transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-around h-16 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.isActive;
            
            return (
              <Link 
                key={item.label} 
                href={item.href}
                className="relative flex flex-col items-center justify-center w-16 h-full transition-transform active:scale-95"
              >
                <div className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${active ? "text-primary translate-y-[-2px]" : "text-muted-foreground hover:text-foreground"}`}>
                  <div className="relative">
                    <Icon 
                      size={24} 
                      className={`transition-all duration-300 ${active ? "stroke-[2.5px]" : "stroke-2"}`} 
                    />
                    {item.hasBadge && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background animate-pulse"></span>
                    )}
                  </div>
                </div>
                {active && (
                  <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-full shadow-[0_2px_8px_rgba(124,58,237,0.5)] animate-in fade-in zoom-in duration-300" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
