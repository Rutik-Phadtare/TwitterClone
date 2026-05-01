"use client";

/**
 * SplashScreen
 * ─────────────
 * Shown while Firebase auth state is resolving.
 * Pure CSS animations — zero dependencies.
 * Automatically fades itself out after `minDuration` ms
 * so it never blocks a fast load.
 */

import { useEffect, useState } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');

  @keyframes splash-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes splash-fade-out {
    from { opacity: 1; transform: scale(1);    }
    to   { opacity: 0; transform: scale(1.04); }
  }
  @keyframes splash-logo-in {
    0%   { opacity: 0; transform: scale(0.7) rotate(-8deg); }
    60%  { opacity: 1; transform: scale(1.08) rotate(2deg); }
    100% { opacity: 1; transform: scale(1)   rotate(0deg); }
  }
  @keyframes splash-logo-glow {
    0%, 100% { filter: drop-shadow(0 0 14px rgba(29,155,240,0.5)); }
    50%       { filter: drop-shadow(0 0 32px rgba(29,155,240,0.85)); }
  }
  @keyframes splash-text-in {
    from { opacity: 0; transform: translateY(10px) letterSpacing(0.3em); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes splash-dot-bounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.35; }
    40%            { transform: scale(1);   opacity: 1;    }
  }
  @keyframes splash-ring-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes splash-orb-float {
    0%, 100% { transform: translateY(0)   scale(1);    }
    50%       { transform: translateY(-20px) scale(1.06); }
  }
  @keyframes splash-bar-fill {
    0%   { width: 0%; }
    30%  { width: 45%; }
    70%  { width: 72%; }
    100% { width: 92%; }
  }

  .splash-root {
    position: fixed;
    inset: 0;
    z-index: 99999;
    background: #000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    animation: splash-fade-in 0.3s ease both;
  }
  .splash-root.leaving {
    animation: splash-fade-out 0.4s ease forwards;
    pointer-events: none;
  }

  /* Ambient orbs */
  .splash-orb-1 {
    position: absolute;
    top: -80px; left: -60px;
    width: 420px; height: 420px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(29,155,240,0.15) 0%, transparent 70%);
    animation: splash-orb-float 7s ease-in-out infinite;
    pointer-events: none;
  }
  .splash-orb-2 {
    position: absolute;
    bottom: -60px; right: -40px;
    width: 320px; height: 320px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(29,155,240,0.09) 0%, transparent 70%);
    animation: splash-orb-float 10s ease-in-out infinite reverse;
    pointer-events: none;
  }

  /* Content */
  .splash-content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
  }

  /* Logo wrapper */
  .splash-logo-wrap {
    position: relative;
    width: 88px;
    height: 88px;
    animation: splash-logo-in 0.65s cubic-bezier(0.22,0.68,0,1.2) 0.1s both,
               splash-logo-glow 3s ease-in-out 0.8s infinite;
  }
  .splash-logo-wrap svg {
    width: 100%;
    height: 100%;
  }

  /* Spinning ring around logo */
  .splash-ring {
    position: absolute;
    inset: -10px;
    border-radius: 50%;
    border: 1.5px solid transparent;
    border-top-color: rgba(29,155,240,0.7);
    border-right-color: rgba(29,155,240,0.2);
    animation: splash-ring-spin 1.1s linear infinite;
  }
  .splash-ring-2 {
    position: absolute;
    inset: -18px;
    border-radius: 50%;
    border: 1px solid transparent;
    border-bottom-color: rgba(29,155,240,0.35);
    animation: splash-ring-spin 2.2s linear infinite reverse;
  }

  /* App name */
  .splash-name {
    font-family: 'Syne', sans-serif;
    font-size: 1.35rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #fff;
    animation: splash-text-in 0.4s ease 0.55s both;
  }
  .splash-name span {
    color: #1d9bf0;
  }

  /* Tagline */
  .splash-tagline {
    font-family: 'DM Sans', 'Segoe UI', sans-serif;
    font-size: 0.78rem;
    font-weight: 400;
    color: rgba(255,255,255,0.35);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-top: -20px;
    animation: splash-text-in 0.4s ease 0.7s both;
  }

  /* Loading dots */
  .splash-dots {
    display: flex;
    gap: 7px;
    animation: splash-text-in 0.4s ease 0.75s both;
  }
  .splash-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #1d9bf0;
  }
  .splash-dot:nth-child(1) { animation: splash-dot-bounce 1.2s ease-in-out 0s   infinite; }
  .splash-dot:nth-child(2) { animation: splash-dot-bounce 1.2s ease-in-out 0.2s infinite; }
  .splash-dot:nth-child(3) { animation: splash-dot-bounce 1.2s ease-in-out 0.4s infinite; }

  /* Progress bar */
  .splash-progress-track {
    width: 160px;
    height: 2px;
    background: rgba(255,255,255,0.07);
    border-radius: 2px;
    overflow: hidden;
    animation: splash-text-in 0.4s ease 0.8s both;
  }
  .splash-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #000000, #60c8ff);
    border-radius: 2px;
    animation: splash-bar-fill 2s ease-out 0.3s both;
    box-shadow: 0 0 8px rgba(29,155,240,0.6);
  }

  /* Bottom brand */
  .splash-bottom {
    position: absolute;
    bottom: 32px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.7rem;
    color: rgba(255,255,255,0.18);
    letter-spacing: 0.05em;
    animation: splash-fade-in 0.5s ease 1s both;
  }
`;

/* Twitter / X bird SVG — inline so no network request */
function XLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

interface SplashScreenProps {
  /** If true, plays the fade-out exit animation */
  leaving?: boolean;
}

export default function SplashScreen({ leaving = false }: SplashScreenProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className={`splash-root${leaving ? " leaving" : ""}`} role="status" aria-label="Loading…">
        {/* Ambient orbs */}
        <div className="splash-orb-1" aria-hidden />
        <div className="splash-orb-2" aria-hidden />

        <div className="splash-content">
          {/* Logo with spinning rings */}
          <div className="splash-logo-wrap" aria-hidden>
            <div className="splash-ring-2" />
            <div className="splash-ring" />
            <XLogo />
          </div>

          {/* Name */}
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <div className="splash-name">
              X <span>Clone</span>
            </div>
            <div className="splash-tagline">Social · Real-time · Open</div>
          </div>

          {/* Animated progress bar */}
          <div className="splash-progress-track" aria-hidden>
            <div className="splash-progress-fill" />
          </div>

          {/* Bouncing dots */}
          <div className="splash-dots" aria-hidden>
            <div className="splash-dot" />
            <div className="splash-dot" />
            <div className="splash-dot" />
          </div>
        </div>

        {/* Bottom credit */}
        <div className="splash-bottom">Built with Next.js · Firebase</div>
      </div>
    </>
  );
}