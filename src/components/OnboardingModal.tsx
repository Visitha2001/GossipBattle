"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";

const DARK_COLORS = [
  "#d32f2f", "#c2185b", "#7b1fa2", "#512da8", 
  "#303f9f", "#1976d2", "#0288d1", "#0097a7", 
  "#00796b", "#388e3c", "#689f38", "#afb42b", 
  "#e64a19", "#5d4037", "#616161", "#455a64"
];

export function OnboardingModal() {
  const { user, setUser } = useAuthStore();
  const [handle, setHandle] = useState("@");
  const [handleColor, setHandleColor] = useState(DARK_COLORS[0]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If there's no user, or the user already has a handle, don't show the modal
  if (!user || user.handle) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (handle.length < 2 || !handle.startsWith("@")) {
      setError("Handle must start with @ and have at least 1 character.");
      return;
    }

    const lowerColor = handleColor.toLowerCase();
    if (lowerColor === "#ffffff" || lowerColor === "#000000" || lowerColor === "#fff" || lowerColor === "#000") {
      setError("Please choose a color other than black or white.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await api.user.onboarding({ handle, handleColor });
      setUser(data.user);
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith("@")) {
      val = "@" + val.replace(/@/g, "");
    }
    setHandle(val);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/40 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-md p-8 bg-card/80 backdrop-blur-md rounded-3xl shadow-2xl border border-border/50 animate-in zoom-in-95 duration-300 m-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-bounce">
            <span className="text-3xl">🎉</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">Welcome!</h2>
          <p className="text-muted-foreground">
            Choose a unique handle and a custom color to stand out in the arena.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold tracking-wide text-foreground/80">HANDLE</label>
            <div className="relative">
              <input
                type="text"
                value={handle}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-background/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-lg placeholder:text-muted-foreground/50"
                placeholder="@username"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold tracking-wide text-foreground/80">HANDLE COLOR</label>
            <div className="grid grid-cols-8 gap-2 bg-background/50 p-3 rounded-xl border border-border/50">
              {DARK_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setHandleColor(color)}
                  className={`w-8 h-8 rounded-full transition-transform ${handleColor === color ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1 ml-1 text-right font-mono uppercase tracking-wider">{handleColor}</p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm font-medium text-destructive animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 hover:scale-[1.02] disabled:hover:scale-100 disabled:opacity-50 transition-all shadow-lg shadow-primary/25 mt-4"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                Saving...
              </span>
            ) : "Enter the Arena"}
          </button>
        </form>
      </div>
    </div>
  );
}
