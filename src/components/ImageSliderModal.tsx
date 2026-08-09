"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function ImageSliderModal({ 
  isOpen, 
  onClose, 
  images, 
  initialIndex = 0 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  images: string[]; 
  initialIndex?: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, initialIndex]);

  if (!isOpen || images.length === 0) return null;

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >


      <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12" onClick={(e) => e.stopPropagation()}>
        {images.length > 1 && (
          <button 
            onClick={handlePrevious}
            className="absolute left-4 md:left-8 z-[110] p-3 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors"
          >
            <ChevronLeft size={32} />
          </button>
        )}

        <div className="relative inline-flex max-w-full max-h-full animate-in zoom-in-95 duration-200">
          <img 
            src={images[currentIndex]} 
            alt={`Image ${currentIndex + 1} of ${images.length}`} 
            className="max-w-full max-h-full object-contain select-none"
          />
          <button 
            onClick={onClose} 
            className="absolute top-2 right-2 z-[110] p-1.5 text-white/90 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {images.length > 1 && (
          <button 
            onClick={handleNext}
            className="absolute right-4 md:right-8 z-[110] p-3 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors"
          >
            <ChevronRight size={32} />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div 
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-[110] bg-black/40 p-2 rounded-xl max-w-[90vw] overflow-x-auto hide-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((src, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`relative w-12 h-12 shrink-0 rounded-md overflow-hidden transition-all ${idx === currentIndex ? 'ring-2 ring-white scale-105 opacity-100' : 'opacity-50 hover:opacity-100'}`}
            >
              <img src={src} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
