"use client";

import { useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/lib/store";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

export function Header() {
  const { user, setUser, isLoading, setIsLoading } = useAuthStore();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Auth check failed", error);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, [setUser, setIsLoading]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between mx-auto px-4">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-xl">GossipBattle</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          {isLoading ? (
            <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
          ) : user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium hidden md:block">{user.name}</span>
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="h-8 w-8 rounded-full border" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium">{user.name.charAt(0)}</span>
                </div>
              )}
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Button>
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.error("Login Failed")}
              useOneTap
              theme="filled_black"
              shape="pill"
            />
          )}
        </div>
      </div>
    </header>
  );
}
