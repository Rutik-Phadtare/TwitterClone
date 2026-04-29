"use client";

/**
 * PageShell
 * ──────────
 * Wraps the page content with:
 *  1. A branded SplashScreen while Firebase resolves auth state
 *  2. A smooth page-enter fade-up once ready
 *
 * Drop this around <Landing /> in page.tsx.
 * AuthContext must be a parent (AuthProvider wraps this).
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import SplashScreen from "./SplashScreen";

const SHELL_STYLES = `
  @keyframes shell-enter {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  .shell-enter {
    animation: shell-enter 0.4s cubic-bezier(0.16,1,0.3,1) both;
  }
`;

interface PageShellProps {
  children: React.ReactNode;
}

export default function PageShell({ children }: PageShellProps) {
  const { user } = useAuth();
  // `loading` is true until AuthContext has resolved the initial auth state.
  // We read it from context — adjust the property name if yours differs.
  const authCtx = useAuth() as any;
  const loading: boolean = authCtx.loading ?? authCtx.isLoading ?? false;

  const [splashLeaving, setSplashLeaving] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  // Minimum splash display: 900ms so it never flickers
  const MIN_SPLASH_MS = 900;
  const [minMet, setMinMet] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinMet(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  // Once auth is resolved AND minimum time has passed → start exit animation
  useEffect(() => {
    if (!loading && minMet && !splashDone) {
      setSplashLeaving(true);
      const t = setTimeout(() => setSplashDone(true), 420); // matches CSS exit duration
      return () => clearTimeout(t);
    }
  }, [loading, minMet, splashDone]);

  // If AuthContext has no `loading` property, skip splash immediately
  const hasLoadingState = "loading" in authCtx || "isLoading" in authCtx;
  if (!hasLoadingState && !splashDone) {
    // Skip splash — context doesn't expose loading state
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: SHELL_STYLES }} />
        <div className="shell-enter">{children}</div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SHELL_STYLES }} />

      {/* Splash — render until fully dismissed */}
      {!splashDone && <SplashScreen leaving={splashLeaving} />}

      {/* Page content — pre-rendered but invisible behind splash */}
      <div
        className={splashDone ? "shell-enter" : ""}
        style={{
          visibility: splashDone ? "visible" : "hidden",
          pointerEvents: splashDone ? "auto" : "none",
        }}
      >
        {children}
      </div>
    </>
  );
}