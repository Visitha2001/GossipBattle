"use client";

import { useEffect, useState, useRef } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

export function Header() {
  const { user, setUser, isLoading, setIsLoading } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
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
      <div className="container flex h-16 items-center justify-between mx-auto px-6">
        <div className="flex items-center space-x-4">
          <span className="font-extrabold text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">
            GossipBattle
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          {isLoading ? (
            <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
          ) : user ? (
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
