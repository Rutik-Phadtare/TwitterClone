"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import AuthModal from "./Authmodel";
import TwitterLogo from "./Twitterlogo";
import { useAuth } from "@/context/AuthContext";
import Feed from "./Feed";

/* ─────────────────────────────────────────────
   Inline keyframes injected once via a <style> tag
   so we don't need an external CSS file.
───────────────────────────────────────────── */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --brand: #1d9bf0;
    --brand-dim: rgba(29,155,240,0.15);
    --brand-glow: rgba(29,155,240,0.35);
    --surface: rgba(255,255,255,0.04);
    --border: rgba(255,255,255,0.08);
    --text-muted: rgba(255,255,255,0.45);
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pulseRing {
    0%   { transform: scale(0.95); box-shadow: 0 0 0 0 var(--brand-glow); }
    70%  { transform: scale(1);    box-shadow: 0 0 0 18px transparent;   }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 transparent;      }
  }
  @keyframes meshMove {
    0%, 100% { background-position: 0% 50%; }
    50%       { background-position: 100% 50%; }
  }
  @keyframes floatOrb {
    0%, 100% { transform: translateY(0px) scale(1); }
    50%       { transform: translateY(-30px) scale(1.05); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes logoGlow {
    0%, 100% { filter: drop-shadow(0 0 12px var(--brand-glow)); }
    50%       { filter: drop-shadow(0 0 28px rgba(29,155,240,0.6)); }
  }

  .landing-btn {
    position: relative;
    overflow: hidden;
    transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
  }
  .landing-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.07) 50%, transparent 70%);
    background-size: 200% 100%;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .landing-btn:hover::after {
    opacity: 1;
    animation: shimmer 0.6s linear;
  }
  .landing-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(0,0,0,0.35);
  }
  .landing-btn:active {
    transform: translateY(0px);
  }

  .btn-primary:hover {
    box-shadow: 0 6px 28px var(--brand-glow) !important;
  }

  .glass-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border), transparent);
  }

  .anim-0 { animation: fadeUp 0.55s cubic-bezier(.22,.68,0,1.2) both; }
  .anim-1 { animation: fadeUp 0.55s cubic-bezier(.22,.68,0,1.2) 0.1s both; }
  .anim-2 { animation: fadeUp 0.55s cubic-bezier(.22,.68,0,1.2) 0.2s both; }
  .anim-3 { animation: fadeUp 0.55s cubic-bezier(.22,.68,0,1.2) 0.3s both; }
  .anim-4 { animation: fadeUp 0.55s cubic-bezier(.22,.68,0,1.2) 0.4s both; }
  .anim-5 { animation: fadeUp 0.55s cubic-bezier(.22,.68,0,1.2) 0.5s both; }
  .anim-logo { animation: fadeIn 0.8s ease both; }
`;

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const { user, logout, googlesignin } = useAuth();

  const openAuthModal = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  if (user) {
    return <Feed />;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

      <div
        style={{
          minHeight: "100vh",
          background: "#000",
          color: "#fff",
          display: "flex",
          fontFamily: "'DM Sans', sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ── Ambient background orbs ── */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          {/* Top-left blue orb */}
          <div
            style={{
              position: "absolute",
              top: "-120px",
              left: "-80px",
              width: "520px",
              height: "520px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(29,155,240,0.18) 0%, transparent 70%)",
              animation: "floatOrb 8s ease-in-out infinite",
            }}
          />
          {/* Bottom-right accent orb */}
          <div
            style={{
              position: "absolute",
              bottom: "-80px",
              right: "10%",
              width: "380px",
              height: "380px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(29,155,240,0.10) 0%, transparent 70%)",
              animation: "floatOrb 11s ease-in-out infinite reverse",
            }}
          />
          {/* Subtle noise overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
              backgroundRepeat: "repeat",
              backgroundSize: "180px",
              opacity: 0.6,
            }}
          />
        </div>

        {/* ── Left panel – Logo ── */}
        <div
          className="anim-logo"
          style={{
            display: "none",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
          }}
          // Tailwind lg:flex equivalent via inline media query workaround — keep Tailwind class too
        >
          <div
            style={{
              animation: "logoGlow 4s ease-in-out infinite",
              display: "flex",
            }}
          >
            <TwitterLogo className="text-white h-80 w-80" />
          </div>
        </div>

        {/* Tailwind version of left panel for lg screens */}
        <div
          className="hidden lg:flex lg:flex-1 items-center justify-center anim-logo"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div style={{ animation: "logoGlow 4s ease-in-out infinite" }}>
            <TwitterLogo className="text-white h-80 w-80" />
          </div>
        </div>

        {/* ── Right panel – Content ── */}
        <div
          className="flex-1 lg:flex-1"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "2rem 2rem 2rem 2rem",
            maxWidth: "560px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden anim-0" style={{ marginBottom: "2.5rem", textAlign: "center" }}>
            <div style={{ animation: "logoGlow 4s ease-in-out infinite", display: "inline-block" }}>
              <TwitterLogo size="xl" className="text-white mx-auto" />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            {/* Headline */}
            <div className="anim-1">
              <h1
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "clamp(2.6rem, 5vw, 3.8rem)",
                  fontWeight: 800,
                  lineHeight: 1.08,
                  letterSpacing: "-0.03em",
                  marginBottom: "1rem",
                  background: "linear-gradient(135deg, #fff 40%, rgba(255,255,255,0.55))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Happening now
              </h1>
              <h2
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.88)",
                  letterSpacing: "-0.02em",
                }}
              >
                Join today.
              </h2>
            </div>

            {/* Auth buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "340px" }}>
              {/* Google */}
              <button
                className="landing-btn"
                onClick={() => googlesignin()}
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#fff",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
                style-anim-class="anim-2"
              >
                <div className="anim-2" style={{ display: "contents" }}>
                  <svg style={{ width: 18, height: 18, flexShrink: 0 }} viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </div>
              </button>

              {/* Apple */}
              <button
                className="landing-btn anim-2"
                onClick={() => googlesignin()}
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#fff",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              >
                <svg style={{ width: 18, height: 18, flexShrink: 0 }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Sign up with Apple
              </button>

              {/* Divider */}
              <div className="anim-3" style={{ position: "relative", display: "flex", alignItems: "center", margin: "4px 0" }}>
                <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }} />
                <span style={{ padding: "0 14px", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
                  or
                </span>
                <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }} />
              </div>

              {/* Create account CTA */}
              <button
                className="landing-btn btn-primary anim-3"
                onClick={() => openAuthModal("signup")}
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "9999px",
                  border: "none",
                  background: "linear-gradient(135deg, #1d9bf0 0%, #0e7fd8 100%)",
                  color: "#fff",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  letterSpacing: "0.01em",
                }}
              >
                Create account
              </button>

              {/* Terms */}
              <p className="anim-4" style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.38)", lineHeight: 1.6, marginTop: "2px" }}>
                By signing up, you agree to the{" "}
                <a href="#" style={{ color: "#1d9bf0", textDecoration: "none" }} onMouseOver={e => (e.currentTarget.style.textDecoration = "underline")} onMouseOut={e => (e.currentTarget.style.textDecoration = "none")}>
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" style={{ color: "#1d9bf0", textDecoration: "none" }} onMouseOver={e => (e.currentTarget.style.textDecoration = "underline")} onMouseOut={e => (e.currentTarget.style.textDecoration = "none")}>
                  Privacy Policy
                </a>
                , including{" "}
                <a href="#" style={{ color: "#1d9bf0", textDecoration: "none" }} onMouseOver={e => (e.currentTarget.style.textDecoration = "underline")} onMouseOut={e => (e.currentTarget.style.textDecoration = "none")}>
                  Cookie Use
                </a>
                .
              </p>
            </div>

            {/* Login section */}
            <div className="anim-5" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Glass card separator */}
              <div style={{
                padding: "1.25rem 1.5rem",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.025)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
              }}>
                <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "1rem", margin: 0, color: "rgba(255,255,255,0.9)" }}>
                  Already have an account?
                </p>
                <button
                  className="landing-btn"
                  onClick={() => openAuthModal("login")}
                  style={{
                    height: "40px",
                    padding: "0 1.5rem",
                    borderRadius: "9999px",
                    border: "1px solid rgba(29,155,240,0.5)",
                    background: "transparent",
                    color: "#1d9bf0",
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "border-color 0.2s, background 0.2s",
                  }}
                  onMouseOver={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(29,155,240,0.08)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#1d9bf0";
                  }}
                  onMouseOut={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(29,155,240,0.5)";
                  }}
                >
                  Log in
                </button>
              </div>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      </div>
    </>
  );
}