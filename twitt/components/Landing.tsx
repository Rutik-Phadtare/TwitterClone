"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import AuthModal from "./Authmodel";
import TwitterLogo from "./Twitterlogo";
import { useAuth } from "@/context/AuthContext";
import Feed from "./Feed";

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --brand:        #1d9bf0;
    --brand-dim:    rgba(29,155,240,0.12);
    --brand-glow:   rgba(29,155,240,0.30);
    --brand-bright: rgba(29,155,240,0.55);
    --surface:      rgba(255,255,255,0.03);
    --surface-hover:rgba(255,255,255,0.06);
    --border:       rgba(255,255,255,0.08);
    --border-hover: rgba(255,255,255,0.16);
    --text-muted:   rgba(255,255,255,0.40);
    --text-sub:     rgba(255,255,255,0.65);
  }

  /* ── Animations ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes floatOrb {
    0%, 100% { transform: translateY(0px)   scale(1);    }
    50%       { transform: translateY(-28px) scale(1.04); }
  }
  @keyframes floatOrbSlow {
    0%, 100% { transform: translateY(0px)   scale(1);    }
    50%       { transform: translateY(-18px) scale(1.03); }
  }
  @keyframes logoGlow {
    0%, 100% { filter: drop-shadow(0 0 14px var(--brand-glow)); }
    50%       { filter: drop-shadow(0 0 34px var(--brand-bright)); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes gridFade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes scanline {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }

  .anim-0  { animation: fadeUp 0.6s cubic-bezier(.22,.68,0,1.15) 0.05s both; }
  .anim-1  { animation: fadeUp 0.6s cubic-bezier(.22,.68,0,1.15) 0.15s both; }
  .anim-2  { animation: fadeUp 0.6s cubic-bezier(.22,.68,0,1.15) 0.25s both; }
  .anim-3  { animation: fadeUp 0.6s cubic-bezier(.22,.68,0,1.15) 0.35s both; }
  .anim-4  { animation: fadeUp 0.6s cubic-bezier(.22,.68,0,1.15) 0.45s both; }
  .anim-5  { animation: fadeUp 0.6s cubic-bezier(.22,.68,0,1.15) 0.55s both; }
  .anim-logo { animation: fadeIn 1s ease 0.1s both; }

  /* ── Button base ── */
  .lp-btn {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    outline: none;
    border: none;
    transition: transform 0.16s ease, box-shadow 0.16s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .lp-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.06) 50%, transparent 65%);
    background-size: 250% 100%;
    opacity: 0;
    transition: opacity 0.22s;
  }
  .lp-btn:hover::before {
    opacity: 1;
    animation: shimmer 0.55s linear;
  }
  .lp-btn:hover  { transform: translateY(-1.5px); }
  .lp-btn:active { transform: translateY(0.5px); }

  /* ── Social buttons (Google / Apple) ── */
  .lp-social {
    width: 100%;
    height: 50px;
    border-radius: 9999px;
    border: 1px solid var(--border) !important;
    background: var(--surface) !important;
    color: #fff !important;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    font-size: 0.92rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    letter-spacing: 0.01em;
  }
  .lp-social:hover {
    border-color: var(--border-hover) !important;
    background: var(--surface-hover) !important;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
  }

  /* ── Primary CTA ── */
  .lp-primary {
    width: 100%;
    height: 50px;
    border-radius: 9999px;
    background: linear-gradient(135deg, #1d9bf0 0%, #0c7cd5 100%) !important;
    color: #fff !important;
    font-family: 'DM Sans', sans-serif;
    font-weight: 700;
    font-size: 0.95rem;
    letter-spacing: 0.015em;
    border: none !important;
  }
  .lp-primary:hover {
    box-shadow: 0 6px 32px var(--brand-glow), 0 2px 8px rgba(0,0,0,0.3) !important;
    background: linear-gradient(135deg, #2aa8ff 0%, #1385e0 100%) !important;
  }

  /* ── Login button ── */
  .lp-login {
    height: 42px;
    padding: 0 1.6rem;
    border-radius: 9999px;
    border: 1.5px solid rgba(29,155,240,0.45) !important;
    background: transparent !important;
    color: var(--brand) !important;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    font-size: 0.88rem;
    white-space: nowrap;
    letter-spacing: 0.01em;
    flex-shrink: 0;
  }
  .lp-login:hover {
    background: rgba(29,155,240,0.10) !important;
    border-color: var(--brand) !important;
    box-shadow: 0 0 18px var(--brand-dim) !important;
  }

  /* ── Divider ── */
  .lp-divider {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 2px 0;
    color: var(--text-muted);
    font-size: 0.68rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .lp-divider::before,
  .lp-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border), transparent);
  }

  /* ── Login card ── */
  .lp-login-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.1rem 1.4rem;
    border-radius: 18px;
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.022);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  /* ── Left panel (logo side) ── */
  .lp-left-panel {
    display: none;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
  }

  /* ── Responsive ── */
  @media (min-width: 1024px) {
    /* Left panel: takes all remaining space after right panel */
    .lp-left-panel {
      display: flex !important;
      flex: 1 1 0% !important;
      min-width: 0 !important;
    }
    .lp-mobile-logo { display: none !important; }

    /* Right panel: fixed comfortable width, never overflows */
    .lp-right-panel {
      flex: 0 0 600px !important;
      width: 600px !important;
      max-width: 600px !important;
      padding: 3rem 5rem 3rem 4rem !important;
      align-items: flex-start !important;
      overflow: hidden !important;
    }
    .lp-content-inner {
      width: 100% !important;
      max-width: 420px !important;
    }
  }

  @media (max-width: 1023px) {
    .lp-right-panel {
      max-width: 100% !important;
      width: 100% !important;
      padding: 2rem 1.5rem 2.5rem !important;
      align-items: center !important;
    }
    .lp-content-inner {
      width: 100% !important;
      max-width: 400px !important;
      margin: 0 auto !important;
    }
    .lp-headline h1 {
      font-size: clamp(2.2rem, 8vw, 3rem) !important;
      text-align: center !important;
    }
    .lp-headline h2 {
      font-size: clamp(1.15rem, 4vw, 1.5rem) !important;
      text-align: center !important;
    }
    .lp-login-card {
      flex-direction: column !important;
      text-align: center !important;
      gap: 0.85rem !important;
    }
    .lp-login-card p { font-size: 0.92rem !important; }
    .lp-login { width: 100% !important; justify-content: center !important; }
  }

  @media (max-width: 400px) {
    .lp-right-panel { padding: 1.5rem 1.1rem 2rem !important; }
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
`;

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode]           = useState<"login" | "signup">("signup");
  const { user, logout, googlesignin }    = useAuth();

  const openAuthModal = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  if (user) return <Feed />;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

      <div style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        fontFamily: "'DM Sans', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* ── Background layer ── */}
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>

          {/* Grid pattern */}
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(29,155,240,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(29,155,240,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            animation: "gridFade 1.5s ease both",
            maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          }} />

          {/* Top-left orb */}
          <div style={{
            position: "absolute",
            top: "-160px", left: "-100px",
            width: "600px", height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(29,155,240,0.15) 0%, transparent 68%)",
            animation: "floatOrb 9s ease-in-out infinite",
          }} />

          {/* Bottom-right orb */}
          <div style={{
            position: "absolute",
            bottom: "-100px", right: "5%",
            width: "420px", height: "420px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(29,155,240,0.09) 0%, transparent 70%)",
            animation: "floatOrbSlow 13s ease-in-out infinite reverse",
          }} />

          {/* Center subtle orb */}
          <div style={{
            position: "absolute",
            top: "40%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "800px", height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(29,155,240,0.04) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* Noise texture */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "200px",
            opacity: 0.7,
          }} />

          {/* Bottom vignette */}
          <div style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            height: "30%",
            background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
          }} />
        </div>

        {/* ══════════════════════════════════════════
            LEFT PANEL — Logo (desktop only)
        ══════════════════════════════════════════ */}
        <div className="lp-left-panel anim-logo" style={{ position: "relative", zIndex: 1 }}>
          {/* Subtle ring behind logo */}
          <div style={{
            position: "absolute",
            width: "360px", height: "360px",
            borderRadius: "50%",
            border: "1px solid rgba(29,155,240,0.08)",
            boxShadow: "0 0 80px rgba(29,155,240,0.06) inset",
          }} />
          <div style={{
            position: "absolute",
            width: "260px", height: "260px",
            borderRadius: "50%",
            border: "1px solid rgba(29,155,240,0.05)",
          }} />
          <div style={{ animation: "logoGlow 4.5s ease-in-out infinite", position: "relative", zIndex: 1 }}>
            <TwitterLogo className="text-white h-72 w-72" />
          </div>
        </div>

        {/* ══════════════════════════════════════════
            RIGHT PANEL — Auth content
        ══════════════════════════════════════════ */}
        <div
          className="lp-right-panel"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div className="lp-content-inner" style={{ display: "flex", flexDirection: "column", gap: "2.4rem" }}>

            {/* ── Mobile logo ── */}
            <div
              className="lp-mobile-logo anim-0"
              style={{ textAlign: "center", marginBottom: "0.5rem" }}
            >
              <div style={{ animation: "logoGlow 4s ease-in-out infinite", display: "inline-block" }}>
                <TwitterLogo size="xl" className="text-white mx-auto" />
              </div>
            </div>

            {/* ── Headline ── */}
            <div className="lp-headline anim-1">
              <h1 style={{
                fontFamily: "'Syne', sans-serif",
                /* Fits cleanly on one line within the 380px content area */
                fontSize: "clamp(2.4rem, 5vw, 3rem)",
                textAlign: "center",
                fontWeight: 800,
                lineHeight: 1.06,
                letterSpacing: "-0.035em",
                marginBottom: "0.75rem",
                background: "linear-gradient(150deg, #ffffff 30%, rgba(255,255,255,0.5) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                whiteSpace: "nowrap",
              }}>
                Happening
              </h1>
              <h1 style={{
                fontFamily: "'Syne', sans-serif",
                /* Fits cleanly on one line within the 380px content area */
                fontSize: "clamp(2.4rem, 5vw, 3rem)",
                textAlign: "center",
                fontWeight: 800,
                lineHeight: 1.06,
                letterSpacing: "-0.035em",
                marginBottom: "0.75rem",
                background: "linear-gradient(150deg, #ffffff 30%, rgba(255,255,255,0.5) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                whiteSpace: "nowrap",
              }}>
                now
              </h1>
              <h2 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "clamp(1.2rem, 2.5vw, 1.55rem)",
                fontWeight: 700,
                color: "rgba(255,255,255,0.85)",
                letterSpacing: "-0.02em",
              }}>
                Join today.
              </h2>
            </div>

            {/* ── Buttons ── */}
            <div className="anim-2" style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>

              {/* Google */}
              <button className="lp-btn lp-social" onClick={() => googlesignin()}>
                <svg style={{ width: 18, height: 18, flexShrink: 0 }} viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </button>

              {/* Apple */}
              <button className="lp-btn lp-social" onClick={() => googlesignin()}>
                <svg style={{ width: 18, height: 18, flexShrink: 0 }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Sign up with Apple
              </button>

              {/* Divider */}
              <div className="lp-divider anim-3">or</div>

              {/* Create account */}
              <button className="lp-btn lp-primary anim-3" onClick={() => openAuthModal("signup")}>
                Create account
              </button>

              {/* Terms */}
              <p className="anim-4" style={{
                fontSize: "0.70rem",
                color: "rgba(255,255,255,0.32)",
                lineHeight: 1.65,
                textAlign: "center",
                padding: "0 0.25rem",
              }}>
                By signing up, you agree to the{" "}
                <a href="#" style={{ color: "var(--brand)", textDecoration: "none" }}
                  onMouseOver={e => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseOut={e  => (e.currentTarget.style.textDecoration = "none")}>
                  Terms of Service
                </a>{" "}and{" "}
                <a href="#" style={{ color: "var(--brand)", textDecoration: "none" }}
                  onMouseOver={e => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseOut={e  => (e.currentTarget.style.textDecoration = "none")}>
                  Privacy Policy
                </a>
                , including{" "}
                <a href="#" style={{ color: "var(--brand)", textDecoration: "none" }}
                  onMouseOver={e => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseOut={e  => (e.currentTarget.style.textDecoration = "none")}>
                  Cookie Use
                </a>.
              </p>
            </div>

            {/* ── Already have account ── */}
            <div className="anim-5">
              <div className="lp-login-card">
                <p style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  color: "rgba(255,255,255,0.88)",
                  lineHeight: 1.3,
                }}>
                  Already have an account?
                </p>
                <button className="lp-btn lp-login" onClick={() => openAuthModal("login")}>
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