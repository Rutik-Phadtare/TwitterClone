"use client";

import React, { useState } from 'react';
import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  User,
  MoreHorizontal,
  Settings,
  LogOut,
  Feather,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import TwitterLogo from '../Twitterlogo';
import { useAuth } from '@/context/AuthContext';

// ─── Inject styles once ───────────────────────────────────────────────────────
const STYLE_ID = 'sidebar-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

    @keyframes sb-fadeIn {
      from { opacity: 0; transform: translateX(-12px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes sb-popIn {
      from { opacity: 0; transform: scale(0.93) translateY(6px); }
      to   { opacity: 1; transform: scale(1)    translateY(0); }
    }
    @keyframes sb-badgePulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(29,155,240,0.55); }
      50%       { box-shadow: 0 0 0 5px rgba(29,155,240,0); }
    }
    @keyframes sb-postGlow {
      0%, 100% { box-shadow: 0 4px 20px rgba(29,155,240,0.35); }
      50%       { box-shadow: 0 4px 28px rgba(29,155,240,0.55); }
    }
    @keyframes sb-logoReveal {
      from { opacity: 0; transform: scale(0.8) rotate(-8deg); }
      to   { opacity: 1; transform: scale(1)   rotate(0deg);  }
    }

    .sb-root {
      font-family: 'DM Sans', sans-serif;
      animation: sb-fadeIn 0.4s cubic-bezier(0.22,1,0.36,1) both;
    }

    /* Nav items */
    .sb-nav-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
      padding: 13px 16px;
      border-radius: 9999px;
      border: none;
      background: transparent;
      color: rgba(255,255,255,0.9);
      cursor: pointer;
      text-align: left;
      font-family: 'DM Sans', sans-serif;
      font-size: 17px;
      font-weight: 500;
      letter-spacing: -0.1px;
      transition:
        background 0.16s ease,
        color 0.16s ease,
        transform 0.15s cubic-bezier(0.22,1,0.36,1);
      animation: sb-fadeIn 0.4s cubic-bezier(0.22,1,0.36,1) both;
    }
    .sb-nav-item:hover {
      background: rgba(255,255,255,0.08);
      transform: translateX(3px);
    }
    .sb-nav-item:active {
      transform: translateX(2px) scale(0.98);
    }
    .sb-nav-item.active {
      font-weight: 800;
      color: #fff;
    }
    .sb-nav-item.active .sb-nav-icon {
      color: var(--brand, #1d9bf0);
      filter: drop-shadow(0 0 6px rgba(29,155,240,0.5));
    }

    /* Active pill indicator */
    .sb-nav-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 60%;
      background: var(--brand, #1d9bf0);
      border-radius: 0 3px 3px 0;
      box-shadow: 0 0 8px rgba(29,155,240,0.6);
    }

    .sb-nav-icon {
      flex-shrink: 0;
      transition: color 0.16s ease, filter 0.16s ease;
    }

    /* Badge */
    .sb-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 5px;
      border-radius: 9999px;
      background: var(--brand, #1d9bf0);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      animation: sb-badgePulse 2.5s ease-in-out infinite;
      margin-left: auto;
    }

    /* Post button */
    .sb-post-btn {
      width: 100%;
      padding: 14px 0;
      border-radius: 9999px;
      border: none;
      background: var(--brand, #1d9bf0);
      color: #fff;
      font-family: 'DM Sans', sans-serif;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.1px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      animation: sb-postGlow 3s ease-in-out infinite;
      transition:
        background 0.18s ease,
        transform 0.15s cubic-bezier(0.22,1,0.36,1),
        box-shadow 0.18s ease;
    }
    .sb-post-btn:hover {
      background: #1a8cd8;
      transform: scale(1.025);
      box-shadow: 0 6px 28px rgba(29,155,240,0.55);
    }
    .sb-post-btn:active {
      transform: scale(0.97);
    }

    /* Logo wrapper */
    .sb-logo {
      animation: sb-logoReveal 0.5s 0.05s cubic-bezier(0.22,1,0.36,1) both;
      display: inline-flex;
      padding: 10px;
      border-radius: 9999px;
      transition: background 0.18s ease;
      cursor: pointer;
    }
    .sb-logo:hover {
      background: rgba(255,255,255,0.07);
    }

    /* User card */
    .sb-user-card {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 12px;
      border-radius: 9999px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-family: 'DM Sans', sans-serif;
      text-align: left;
      transition: background 0.18s ease, transform 0.15s cubic-bezier(0.22,1,0.36,1);
      animation: sb-fadeIn 0.4s 0.35s cubic-bezier(0.22,1,0.36,1) both;
    }
    .sb-user-card:hover {
      background: rgba(255,255,255,0.07);
      transform: scale(1.01);
    }
    .sb-user-card:active {
      transform: scale(0.98);
    }

    /* Dropdown */
    .sb-dropdown-content {
      background: #16181c !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
      border-radius: 16px !important;
      padding: 6px !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.4) !important;
      animation: sb-popIn 0.2s cubic-bezier(0.22,1,0.36,1) both;
      min-width: 220px !important;
    }
    .sb-dropdown-item {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      padding: 11px 14px !important;
      border-radius: 10px !important;
      color: rgba(255,255,255,0.9) !important;
      font-family: 'DM Sans', sans-serif !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      cursor: pointer !important;
      transition: background 0.15s ease !important;
    }
    .sb-dropdown-item:hover {
      background: rgba(255,255,255,0.07) !important;
    }
    .sb-dropdown-item.danger {
      color: #f4212e !important;
    }
    .sb-dropdown-item.danger:hover {
      background: rgba(244,33,46,0.1) !important;
    }
    .sb-dropdown-sep {
      height: 1px !important;
      background: rgba(255,255,255,0.07) !important;
      margin: 4px 0 !important;
    }

    /* Avatar ring */
    .sb-avatar-ring {
      position: relative;
      flex-shrink: 0;
    }
    .sb-avatar-ring::after {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(29,155,240,0.6), rgba(121,80,255,0.4));
      z-index: -1;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .sb-user-card:hover .sb-avatar-ring::after {
      opacity: 1;
    }

    /* Sidebar border glow on scroll */
    .sb-border-line {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 1px;
      background: linear-gradient(
        to bottom,
        transparent 0%,
        rgba(255,255,255,0.07) 20%,
        rgba(255,255,255,0.07) 80%,
        transparent 100%
      );
    }

    /* Section divider */
    .sb-section-divider {
      height: 1px;
      margin: 8px 12px;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255,255,255,0.06) 40%,
        rgba(255,255,255,0.06) 60%,
        transparent
      );
    }

    /* Tooltip for icon-only mode */
    .sb-nav-label {
      flex: 1;
    }
  `;
  document.head.appendChild(s);
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface SidebarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Sidebar({ currentPage = 'home', onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const [hovered, setHovered] = useState<string | null>(null);

  // ── unchanged navigation config ───────────────────────────────────────────
  const navigation = [
    { name: 'Home',          icon: Home,          current: currentPage === 'home',          page: 'home' },
    { name: 'Explore',       icon: Search,        current: currentPage === 'explore',       page: 'explore' },
    { name: 'Notifications', icon: Bell,          current: currentPage === 'notifications', page: 'notifications', badge: true },
    { name: 'Messages',      icon: Mail,          current: currentPage === 'messages',      page: 'messages' },
    { name: 'Bookmarks',     icon: Bookmark,      current: currentPage === 'bookmarks',     page: 'bookmarks' },
    { name: 'Profile',       icon: User,          current: currentPage === 'profile',       page: 'profile' },
    { name: 'More',          icon: MoreHorizontal, current: currentPage === 'more',          page: 'more' },
  ];
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="sb-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: 260,
        background: '#000',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Gradient border right edge */}
      <div className="sb-border-line" />

      {/* ── Logo ── */}
      <div style={{ padding: '14px 16px 8px' }}>
        <div className="sb-logo">
          <TwitterLogo size="lg" className="text-white" />
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, padding: '4px 10px', overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navigation.map((item, idx) => (
            <li key={item.name}>
              <button
                className={`sb-nav-item${item.current ? ' active' : ''}`}
                style={{ animationDelay: `${0.05 + idx * 0.04}s` }}
                onClick={() => onNavigate?.(item.page)}
                onMouseEnter={() => setHovered(item.page)}
                onMouseLeave={() => setHovered(null)}
              >
                <item.icon
                  className="sb-nav-icon"
                  size={22}
                  strokeWidth={item.current ? 2.5 : 2}
                />
                <span className="sb-nav-label">{item.name}</span>
                {item.badge && (
                  <span className="sb-badge">3</span>
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* ── Post button ── */}
        <div style={{ marginTop: 18, padding: '0 6px' }}>
          <button className="sb-post-btn">
            <Feather size={17} strokeWidth={2.5} />
            Post
          </button>
        </div>
      </nav>

      {/* ── User card ── */}
      {user && (
        <div
          style={{
            padding: '10px 10px 14px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="sb-user-card">
                <div className="sb-avatar-ring">
                  <Avatar style={{ width: 40, height: 40 }}>
                    <AvatarImage src={user.avatar} alt={user.displayName} />
                    <AvatarFallback
                      style={{
                        background: 'linear-gradient(135deg,#1d9bf0,#7950ff)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 16,
                      }}
                    >
                      {user.displayName[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 14,
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.displayName}
                  </div>
                  <div
                    style={{
                      color: 'rgba(255,255,255,0.42)',
                      fontSize: 13,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    @{user.username}
                  </div>
                </div>

                <MoreHorizontal
                  size={17}
                  style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}
                />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="sb-dropdown-content"
              side="top"
              align="start"
              sideOffset={8}
            >
              {/* User info header */}
              <div
                style={{
                  padding: '10px 14px 8px',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  marginBottom: 4,
                }}
              >
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
                  {user.displayName}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                  @{user.username}
                </div>
              </div>

              <DropdownMenuItem className="sb-dropdown-item">
                <Settings size={15} style={{ opacity: 0.7 }} />
                Settings &amp; privacy
              </DropdownMenuItem>

              <DropdownMenuSeparator className="sb-dropdown-sep" />

              <DropdownMenuItem
                className="sb-dropdown-item danger"
                onClick={logout}
              >
                <LogOut size={15} />
                Log out @{user.username}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}