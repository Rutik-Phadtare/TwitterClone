"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Home, Search, Bell, Mail, Bookmark, User,
  MoreHorizontal, Settings, LogOut, Feather, Star, Globe,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import TwitterLogo from '../Twitterlogo';
import { useAuth } from '@/context/AuthContext';
import { ALL_CATEGORIES, getSelectedCategories } from '@/lib/notificationUtils';
import axiosInstance from '@/lib/axiosInstance';
import { LanguageSwitcherModal } from "../LanguageSwitcher";
import { createPortal } from "react-dom";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";
import { LANGUAGES } from "@/lib/i18n";

const LAST_READ_KEY  = "twiller-notif-last-read";
const COUNT_KEY      = "twiller-notification-count";

const getLastRead   = () => { try { return parseInt(localStorage.getItem(LAST_READ_KEY) || "0", 10); } catch { return 0; } };
const getSavedCount = () => { try { return parseInt(localStorage.getItem(COUNT_KEY)      || "0", 10); } catch { return 0; } };

const STYLE_ID = 'sidebar-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
    @keyframes sb-fadeIn  { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
    @keyframes sb-popIn   { from{opacity:0;transform:scale(0.93) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }
    @keyframes sb-badgePop{ 0%{transform:scale(0)} 70%{transform:scale(1.2)} 100%{transform:scale(1)} }
    @keyframes sb-badgePulse{ 0%,100%{box-shadow:0 0 0 0 rgba(29,155,240,0.55)} 50%{box-shadow:0 0 0 5px rgba(29,155,240,0)} }
    @keyframes sb-postGlow { 0%,100%{box-shadow:0 4px 20px rgba(29,155,240,0.35)} 50%{box-shadow:0 4px 28px rgba(29,155,240,0.55)} }
    @keyframes sb-logoReveal{ from{opacity:0;transform:scale(0.8) rotate(-8deg)} to{opacity:1;transform:scale(1) rotate(0)} }

    .sb-root { font-family:'DM Sans',sans-serif; animation:sb-fadeIn 0.4s cubic-bezier(0.22,1,0.36,1) both; }
    .sb-root::-webkit-scrollbar{display:none} .sb-root{-ms-overflow-style:none;scrollbar-width:none}

    .sb-nav-item {
      position:relative; display:flex; align-items:center; gap:16px; width:100%;
      padding:13px 16px; border-radius:9999px; border:none; background:transparent;
      color:rgba(255,255,255,0.9); cursor:pointer; text-align:left;
      font-family:'DM Sans',sans-serif; font-size:17px; font-weight:500; letter-spacing:-0.1px;
      transition:background 0.16s ease,color 0.16s ease,transform 0.15s cubic-bezier(0.22,1,0.36,1);
      animation:sb-fadeIn 0.4s cubic-bezier(0.22,1,0.36,1) both;
    }
    .sb-nav-item:hover { background:rgba(255,255,255,0.08); transform:translateX(3px); }
    .sb-nav-item:active { transform:translateX(2px) scale(0.98); }
    .sb-nav-item.active { font-weight:800; color:#fff; }
    .sb-nav-item.active .sb-nav-icon { color:var(--brand,#1d9bf0); filter:drop-shadow(0 0 6px rgba(29,155,240,0.5)); }
    .sb-nav-item.active::before {
      content:''; position:absolute; left:0; top:50%; transform:translateY(-50%);
      width:3px; height:60%; background:var(--brand,#1d9bf0);
      border-radius:0 3px 3px 0; box-shadow:0 0 8px rgba(29,155,240,0.6);
    }
    .sb-nav-icon { flex-shrink:0; transition:color 0.16s ease,filter 0.16s ease; }

    .sb-badge {
      display:flex; align-items:center; justify-content:center;
      min-width:20px; height:20px; padding:0 5px; border-radius:9999px;
      background:var(--brand,#1d9bf0); color:#fff; font-size:11px; font-weight:700;
      animation:sb-badgePop 0.3s cubic-bezier(0.22,1,0.36,1),sb-badgePulse 2.5s 0.3s ease-in-out infinite;
      margin-left:auto;
    }

    .sb-post-btn {
      width:100%; padding:14px 0; border-radius:9999px; border:none;
      background:var(--brand,#1d9bf0); color:#fff; font-family:'DM Sans',sans-serif;
      font-size:16px; font-weight:800; cursor:pointer;
      display:flex; align-items:center; justify-content:center; gap:8px;
      animation:sb-postGlow 3s ease-in-out infinite;
      transition:background 0.18s ease,transform 0.15s cubic-bezier(0.22,1,0.36,1),box-shadow 0.18s ease;
    }
    .sb-post-btn:hover { background:#1a8cd8; transform:scale(1.025); box-shadow:0 6px 28px rgba(29,155,240,0.55); }
    .sb-post-btn:active { transform:scale(0.97); }

    .sb-logo {
      animation:sb-logoReveal 0.5s 0.05s cubic-bezier(0.22,1,0.36,1) both;
      display:inline-flex; padding:10px; border-radius:9999px;
      transition:background 0.18s ease; cursor:pointer;
    }
    .sb-logo:hover { background:rgba(255,255,255,0.07); }

    .sb-user-card {
      display:flex; align-items:center; gap:12px; width:100%; padding:10px 12px;
      border-radius:9999px; border:none; background:transparent; cursor:pointer;
      font-family:'DM Sans',sans-serif; text-align:left;
      transition:background 0.18s ease,transform 0.15s cubic-bezier(0.22,1,0.36,1);
      animation:sb-fadeIn 0.4s 0.35s cubic-bezier(0.22,1,0.36,1) both;
    }
    .sb-user-card:hover { background:rgba(255,255,255,0.07); transform:scale(1.01); }
    .sb-user-card:active { transform:scale(0.98); }

    .sb-dropdown-content {
      background:#16181c !important; border:1px solid rgba(255,255,255,0.1) !important;
      border-radius:16px !important; padding:6px !important;
      box-shadow:0 8px 32px rgba(0,0,0,0.7),0 2px 8px rgba(0,0,0,0.4) !important;
      animation:sb-popIn 0.2s cubic-bezier(0.22,1,0.36,1) both; min-width:220px !important;
    }
    .sb-dropdown-item {
      display:flex !important; align-items:center !important; gap:10px !important;
      padding:11px 14px !important; border-radius:10px !important;
      color:rgba(255,255,255,0.9) !important; font-family:'DM Sans',sans-serif !important;
      font-size:14px !important; font-weight:500 !important; cursor:pointer !important;
      transition:background 0.15s ease !important;
    }
    .sb-dropdown-item:hover { background:rgba(255,255,255,0.07) !important; }
    .sb-dropdown-item.danger { color:#f4212e !important; }
    .sb-dropdown-item.danger:hover { background:rgba(244,33,46,0.1) !important; }
    .sb-dropdown-sep { height:1px !important; background:rgba(255,255,255,0.07) !important; margin:4px 0 !important; }

    .sb-avatar-ring { position:relative; flex-shrink:0; }
    .sb-avatar-ring::after {
      content:''; position:absolute; inset:-2px; border-radius:50%;
      background:linear-gradient(135deg,rgba(29,155,240,0.6),rgba(121,80,255,0.4));
      z-index:-1; opacity:0; transition:opacity 0.2s ease;
    }
    .sb-user-card:hover .sb-avatar-ring::after { opacity:1; }

    .sb-border-line {
      position:absolute; right:0; top:0; bottom:0; width:1px;
      background:linear-gradient(to bottom,transparent 0%,rgba(255,255,255,0.07) 20%,rgba(255,255,255,0.07) 80%,transparent 100%);
    }
    .sb-nav-label { flex:1; }

    /* ── Language trigger button ── */
    .sb-lang-btn {
      display:flex; align-items:center; gap:10px; width:100%;
      padding:10px 12px; border-radius:12px; background:transparent; border:none;
      color:rgba(255,255,255,0.7); cursor:pointer;
      font-family:'DM Sans',sans-serif; font-size:15px; font-weight:500;
      transition:background 0.15s;
    }
    .sb-lang-btn:hover { background:rgba(255,255,255,0.06); }
  `;
  document.head.appendChild(s);
}

interface SidebarProps {
  currentPage?: string;
  onNavigate?:  (page: string) => void;
}

export default function Sidebar({ currentPage = 'home', onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const { lang }         = useLanguage();
  const [notifCount,   setNotifCount]   = useState(0);
  const [langOpen,     setLangOpen]     = useState(false);  // ← controls language modal
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedLangMeta = LANGUAGES.find(l => l.code === lang);

  const pollNotifications = async () => {
    try {
      const lastRead = getLastRead();
      const cats     = getSelectedCategories();
      const res      = await axiosInstance.get("/post");
      const tweets   = res.data.tweets ?? [];
      const count = tweets.filter((tweet: any) => {
        const content   = (tweet.content || "").toLowerCase();
        const tweetTime = new Date(tweet.timestamp).getTime();
        if (tweetTime <= lastRead) return false;
        return ALL_CATEGORIES.some(c => cats.includes(c.id) && content.includes(`#${c.id}`));
      }).length;
      setNotifCount(count);
      localStorage.setItem(COUNT_KEY, count.toString());
    } catch {}
  };

  useEffect(() => {
    setNotifCount(getSavedCount());
    pollNotifications();
    pollRef.current = setInterval(pollNotifications, 60_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (currentPage === "notifications") {
      setNotifCount(0);
      localStorage.setItem(COUNT_KEY,    "0");
      localStorage.setItem(LAST_READ_KEY, Date.now().toString());
    }
  }, [currentPage]);

  // Close lang modal on scroll
  useEffect(() => {
    if (!langOpen) return;
    const close = () => setLangOpen(false);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [langOpen]);

  const navigation = [
    { name: t(lang, "home"),          icon: Home,           page: "home",          current: currentPage === "home" },
    { name: t(lang, "explore"),       icon: Search,         page: "explore",       current: currentPage === "explore" },
    { name: t(lang, "notifications"), icon: Bell,           page: "notifications", current: currentPage === "notifications", badge: true },
    { name: t(lang, "messages"),      icon: Mail,           page: "messages",      current: currentPage === "messages" },
    { name: t(lang, "bookmarks"),     icon: Bookmark,       page: "bookmarks",     current: currentPage === "bookmarks" },
    { name: t(lang, "profile"),       icon: User,           page: "profile",       current: currentPage === "profile" },
    { name: t(lang, "subscribe"),     icon: Star,           page: "subscription",  current: currentPage === "subscription" },
    { name: t(lang, "more"),          icon: MoreHorizontal, page: "more",          current: currentPage === "more" },
  ];

  return (
    <>
      <div
        className="sb-root"
        style={{
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0,
          height: '100vh', overflowY: 'auto',
          width: 260, background: '#000', flexShrink: 0,
        }}
      >
        <div className="sb-border-line" />

        {/* Logo */}
        <div style={{ padding: '14px 16px 8px' }}>
          <div className="sb-logo"><TwitterLogo size="lg" className="text-white" /></div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '4px 10px' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {navigation.map((item, idx) => (
              <li key={item.name}>
                <button
                  className={`sb-nav-item${item.current ? ' active' : ''}`}
                  style={{ animationDelay: `${0.05 + idx * 0.04}s` }}
                  onClick={() => onNavigate?.(item.page)}
                >
                  <item.icon className="sb-nav-icon" size={22} strokeWidth={item.current ? 2.5 : 2} />
                  <span className="sb-nav-label">{item.name}</span>
                  {item.badge && notifCount > 0 && currentPage !== "notifications" && (
                    <span className="sb-badge">{notifCount > 99 ? "99+" : notifCount}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {/* ── Language trigger button (inline in sidebar) ── */}
          <div style={{ marginTop: 8, paddingRight: 12 }}>
            <button
              className="sb-lang-btn"
              onClick={() => setLangOpen(true)}
            >
              <Globe size={20} />
              <span>{selectedLangMeta?.flag} {selectedLangMeta?.nativeName}</span>
            </button>
          </div>

          {/* Post button */}
          <div style={{ marginTop: 18, marginBottom: 35, padding: '0 6px' }}>
            <button className="sb-post-btn" onClick={() => onNavigate?.('home')}>
              <Feather size={17} strokeWidth={2.5} /> {t(lang, "post")}
            </button>
          </div>
        </nav>

        {/* User card */}
        {user && (
          <div style={{ padding: '10px 10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="sb-user-card">
                  <div className="sb-avatar-ring">
                    <Avatar style={{ width: 40, height: 40 }}>
                      <AvatarImage src={user.avatar} alt={user.displayName} />
                      <AvatarFallback style={{ background: 'linear-gradient(135deg,#1d9bf0,#7950ff)', color: '#fff', fontWeight: 700, fontSize: 16 }}>
                        {user.displayName[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.displayName}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      @{user.username}
                    </div>
                  </div>
                  <MoreHorizontal size={17} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="sb-dropdown-content" side="top" align="start" sideOffset={8}>
                <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 4 }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{user.displayName}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>@{user.username}</div>
                </div>
                <DropdownMenuItem className="sb-dropdown-item">
                  <Settings size={15} style={{ opacity: 0.7 }} /> Settings &amp; privacy
                </DropdownMenuItem>
                <DropdownMenuSeparator className="sb-dropdown-sep" />
                <DropdownMenuItem className="sb-dropdown-item danger" onClick={logout}>
                  <LogOut size={15} /> Log out @{user.username}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* ── Language modal via portal → renders on document.body, outside sidebar ── */}
      {langOpen && typeof document !== "undefined" && createPortal(
        <LanguageSwitcherModal onClose={() => setLangOpen(false)} />,
        document.body
      )}
    </>
  );
}