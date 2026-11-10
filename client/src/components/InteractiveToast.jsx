// client/src/components/InteractiveToast.jsx
// Smart interactive toast wrapper for react-hot-toast:
// 1. Desktop: Hovering anywhere over the toast card morphs the status icon into an [✕] button at first glance (0 extra space taken).
// 2. Mobile: Swipe right to smoothly slide off and dismiss without needing any close button.
// 3. Eliminates blocked navbar/profile button annoyance.

import React, { useState, useRef } from 'react';
import { ToastBar, toast } from 'react-hot-toast';
import { FaTimes } from 'react-icons/fa';

export default function InteractiveToast({ t }) {
  const [isHovering, setIsHovering] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDismissing, setIsDismissing] = useState(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef(false);

  // ── Mobile Swipe-Right Gestures ─────────────────────────────────────────────
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = false;
  };

  const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartX.current;
    const deltaY = currentY - touchStartY.current;

    // Detect if movement is primarily horizontal to the right
    if (deltaX > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
      isHorizontalSwipe.current = true;
      setSwipeOffset(Math.max(0, deltaX));
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 60) {
      // Swiped far enough -> animate off-screen to the right and dismiss
      setIsDismissing(true);
      setSwipeOffset(350);
      setTimeout(() => {
        toast.dismiss(t.id);
      }, 180);
    } else {
      // Snap back to original position
      setSwipeOffset(0);
    }
    isHorizontalSwipe.current = false;
  };

  return (
    <div
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateX(${swipeOffset}px)`,
        opacity: isDismissing ? 0 : Math.max(0.2, 1 - swipeOffset / 200),
        transition: isHorizontalSwipe.current ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.22s ease',
        willChange: 'transform, opacity',
        touchAction: 'pan-y',
      }}
      className="cursor-default select-none"
    >
      <ToastBar
        toast={t}
        style={{
          ...t.style,
          borderRadius: '14px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        }}
      >
        {({ icon, message }) => (
          <div className="flex items-center gap-2.5 max-w-sm">
            {/* ── Hover-to-X Morphing Icon Button (triggers when hovering ANYWHERE on toast) ── */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toast.dismiss(t.id);
              }}
              className="relative w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer focus:outline-none transition-transform hover:scale-115 active:scale-90"
              title="Click to dismiss notification"
              aria-label="Dismiss notification"
            >
              {/* Default status icon (✔ / ✖ / loader) */}
              <span
                className={`transition-all duration-200 flex items-center justify-center ${
                  isHovering ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'
                }`}
              >
                {icon}
              </span>

              {/* Hover [✕] indicator — visible whenever mouse is over ANY part of the toast card */}
              <span
                className={`absolute inset-0 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/80 flex items-center justify-center text-[10px] font-black transition-all duration-200 shadow-xs hover:bg-red-200 dark:hover:bg-red-900 ${
                  isHovering ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90 pointer-events-none'
                }`}
              >
                <FaTimes size={10} />
              </span>
            </button>

            {/* Notification message */}
            <div className="text-xs sm:text-sm font-semibold leading-snug">
              {message}
            </div>
          </div>
        )}
      </ToastBar>
    </div>
  );
}
