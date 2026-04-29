"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * TopLoader — slim animated progress bar that fires on every route change.
 * Pure CSS animation, zero external dependencies.
 */
export default function TopLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const start = () => {
    clear();
    setWidth(0);
    setVisible(true);

    // Rapid initial burst to 30%, then slow crawl to 85%
    let w = 0;
    const tick = () => {
      if (w < 30) {
        w += 3;
      } else if (w < 60) {
        w += 1.2;
      } else if (w < 85) {
        w += 0.4;
      } else {
        return; // hold at 85 until finish()
      }
      setWidth(w);
      timerRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(tick);
      }, 50);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const finish = () => {
    clear();
    setWidth(100);
    timerRef.current = setTimeout(() => setVisible(false), 380);
  };

  // Fire on every pathname change
  useEffect(() => {
    start();
    const done = setTimeout(finish, 120); // complete quickly — SSR pages are fast
    return () => {
      clear();
      clearTimeout(done);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        height: "2px",
        pointerEvents: "none",
      }}
    >
      {/* Glow behind bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: `${width}%`,
          background: "linear-gradient(90deg, #1d9bf0, #60c8ff)",
          boxShadow: "0 0 10px 2px rgba(29,155,240,0.7)",
          transition:
            width === 100
              ? "width 0.22s ease-out, opacity 0.25s ease"
              : "width 0.3s ease",
          opacity: visible ? 1 : 0,
          borderRadius: "0 2px 2px 0",
        }}
      />
      {/* Sparkle tip */}
      <div
        style={{
          position: "absolute",
          top: "-3px",
          left: `calc(${width}% - 4px)`,
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "#60c8ff",
          boxShadow: "0 0 8px 3px rgba(96,200,255,0.6)",
          transition:
            width === 100
              ? "left 0.22s ease-out"
              : "left 0.3s ease",
          opacity: width > 0 && width < 100 ? 1 : 0,
        }}
      />
    </div>
  );
}