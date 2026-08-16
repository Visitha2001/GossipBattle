"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { usePathname } from "next/navigation";

export function GoToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [mountTime] = useState(Date.now());
  const pathname = usePathname();

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = async () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    if (pathname === "/") {
      try {
        const res = await fetch(`/api/posts/check-new?since=${mountTime}`);
        const data = await res.json();
        if (data.hasNew) {
          window.scrollTo(0, 0);
          if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
          }
          window.location.reload();
        }
      } catch (err) {
        console.error("Failed to check for new posts:", err);
      }
    }
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-20 md:bottom-8 right-8 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all z-50 animate-in fade-in slide-in-from-bottom-4"
      aria-label="Go to top"
    >
      <ArrowUp size={24} />
    </button>
  );
}
