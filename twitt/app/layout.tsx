import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import TopLoader from "@/components/TopLoader"; // adjust path if needed

/* ── Distinctive font pair ─────────────────────────
   Syne  → editorial display / headings (replaces Geist)
   DM Sans → refined body copy (replaces Geist Mono)
   Both self-hosted via next/font — zero layout shift.
─────────────────────────────────────────────────── */
const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

/* ── Metadata (unchanged) ── */
export const metadata: Metadata = {
  title: "X Clone - Social Media Platform",
  description: "A modern Twitter clone built with Next.js",
  icons: {
    icon: "/favicon.ico",
  },
};

/* ── Global design-token CSS injected into <head> ── */
const GLOBAL_CSS = `
  /* ── Design tokens ── */
  :root {
    --brand:        #1d9bf0;
    --brand-dim:    rgba(29,155,240,0.14);
    --brand-glow:   rgba(29,155,240,0.35);
    --brand-dark:   #0e7fd8;
    --surface:      rgba(255,255,255,0.04);
    --border:       rgba(255,255,255,0.08);
    --border-hover: rgba(255,255,255,0.14);
    --text-primary: #e7e9ea;
    --text-muted:   rgba(255,255,255,0.45);
    --text-dim:     rgba(255,255,255,0.25);
    --bg:           #000000;
    --bg-elevated:  #0f0f0f;
    --radius-pill:  9999px;
    --radius-card:  16px;
    --shadow-glow:  0 0 22px rgba(29,155,240,0.3);
    --font-display: var(--font-syne), 'Syne', system-ui, sans-serif;
    --font-body:    var(--font-dm-sans), 'DM Sans', system-ui, sans-serif;
    --ease-spring:  cubic-bezier(0.22, 0.68, 0, 1.2);
    --ease-out:     cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* ── Base reset ── */
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }

  body {
    background: var(--bg);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 15px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overscroll-behavior: none;
  }

  /* ── Typography scale ── */
  h1, h2, h3, h4 {
    font-family: var(--font-display);
    letter-spacing: -0.025em;
    line-height: 1.1;
    color: #fff;
  }

  /* ── Custom scrollbar (WebKit) ── */
  ::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
    border-radius: 10px;
    transition: background 0.2s;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(29,155,240,0.45);
  }
  /* Firefox */
  * {
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.1) transparent;
  }

  /* ── Text selection ── */
  ::selection {
    background: rgba(29,155,240,0.28);
    color: #fff;
  }
  ::-moz-selection {
    background: rgba(29,155,240,0.28);
    color: #fff;
  }

  /* ── Focus ring ── */
  :focus-visible {
    outline: 2px solid var(--brand);
    outline-offset: 3px;
    border-radius: 4px;
  }

  /* ── Link defaults ── */
  a {
    color: var(--brand);
    text-decoration: none;
    transition: color 0.15s;
  }
  a:hover { color: #60c8ff; }

  /* ── Image defaults ── */
  img, video {
    max-width: 100%;
    display: block;
  }

  /* ── Shared utility animations ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.94); }
    to   { opacity: 1; transform: scale(1);    }
  }
  @keyframes slideRight {
    from { opacity: 0; transform: translateX(-12px); }
    to   { opacity: 1; transform: translateX(0);     }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes floatOrb {
    0%, 100% { transform: translateY(0)   scale(1);    }
    50%       { transform: translateY(-28px) scale(1.04); }
  }
  @keyframes logoGlow {
    0%, 100% { filter: drop-shadow(0 0 10px var(--brand-glow)); }
    50%       { filter: drop-shadow(0 0 26px rgba(29,155,240,0.55)); }
  }
  @keyframes pulseRing {
    0%   { box-shadow: 0 0 0 0 var(--brand-glow); }
    70%  { box-shadow: 0 0 0 10px transparent; }
    100% { box-shadow: 0 0 0 0 transparent; }
  }

  /* ── Page-entry animation (applied once on mount) ── */
  @keyframes pageEnter {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  .page-enter {
    animation: pageEnter 0.35s var(--ease-out) both;
  }

  /* ── Skeleton loading shimmer ── */
  .skeleton {
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0.04) 25%,
      rgba(255,255,255,0.09) 50%,
      rgba(255,255,255,0.04) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.4s ease infinite;
    border-radius: 6px;
  }

  /* ── Glass card utility ── */
  .glass {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border);
    border-radius: var(--radius-card);
  }
  .glass:hover {
    border-color: var(--border-hover);
  }

  /* ── Smooth transition helper ── */
  .transition-base {
    transition: all 0.18s var(--ease-out);
  }

  /* ── Mobile safe area ── */
  @supports (padding: max(0px)) {
    body {
      padding-left:   max(0px, env(safe-area-inset-left));
      padding-right:  max(0px, env(safe-area-inset-right));
      padding-bottom: max(0px, env(safe-area-inset-bottom));
    }
  }

  /* ── Reduced motion ── */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <head>
        {/* Global design tokens & base styles */}
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      </head>
      <body className="antialiased">
        {/* Animated top progress bar on every route change */}
        <TopLoader />
        {children}
      </body>
    </html>
  );
}