"use client";

import { Search, Star, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

// ─── Inject styles once ───────────────────────────────────────────────────────
const STYLE_ID = 'right-sidebar-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

    @keyframes rs-fadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes rs-fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes rs-shimmer {
      0%   { background-position: -500px 0; }
      100% { background-position:  500px 0; }
    }
    @keyframes rs-sparkle {
      0%, 100% { transform: scale(1)   rotate(0deg);   opacity: 1; }
      50%       { transform: scale(1.2) rotate(15deg);  opacity: 0.8; }
    }
    @keyframes rs-searchFocus {
      from { box-shadow: 0 0 0 0 rgba(29,155,240,0); }
      to   { box-shadow: 0 0 0 3px rgba(29,155,240,0.25); }
    }
    @keyframes rs-followPop {
      0%   { transform: scale(1); }
      40%  { transform: scale(0.93); }
      100% { transform: scale(1); }
    }
    @keyframes rs-cardReveal {
      from { opacity: 0; transform: translateY(18px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0)    scale(1); }
    }

    .rs-root {
      font-family: 'DM Sans', sans-serif;
      animation: rs-fadeIn 0.4s ease both;
    }

    /* Search */
    .rs-search-wrap {
      position: relative;
      animation: rs-fadeUp 0.4s 0.05s cubic-bezier(0.22,1,0.36,1) both;
    }
    .rs-search-input {
      width: 100%;
      padding: 11px 16px 11px 44px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 9999px;
      color: #fff;
      font-family: 'DM Sans', sans-serif;
      font-size: 14px;
      outline: none;
      transition:
        background 0.2s ease,
        border-color 0.2s ease,
        box-shadow 0.2s ease;
    }
    .rs-search-input::placeholder { color: rgba(255,255,255,0.35); }
    .rs-search-input:focus {
      background: rgba(255,255,255,0.08);
      border-color: rgba(29,155,240,0.6);
      box-shadow: 0 0 0 3px rgba(29,155,240,0.15);
    }
    .rs-search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: rgba(255,255,255,0.35);
      pointer-events: none;
      transition: color 0.2s ease;
    }
    .rs-search-wrap:focus-within .rs-search-icon {
      color: #1d9bf0;
    }

    /* Cards */
    .rs-card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 18px;
      overflow: hidden;
      transition: border-color 0.2s ease;
    }
    .rs-card:hover {
      border-color: rgba(255,255,255,0.11);
    }

    /* Premium card */
    .rs-premium-card {
      animation: rs-cardReveal 0.45s 0.1s cubic-bezier(0.22,1,0.36,1) both;
      position: relative;
      overflow: hidden;
    }
    .rs-premium-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        135deg,
        rgba(29,155,240,0.07) 0%,
        rgba(120,80,255,0.05) 60%,
        transparent 100%
      );
      pointer-events: none;
    }
    .rs-premium-shimmer {
      position: absolute;
      top: -60%;
      left: -60%;
      width: 220%;
      height: 220%;
      background: linear-gradient(
        105deg,
        transparent 40%,
        rgba(29,155,240,0.06) 50%,
        transparent 60%
      );
      background-size: 500px 100%;
      animation: rs-shimmer 3.5s infinite linear;
      pointer-events: none;
    }
    .rs-premium-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 9px 20px;
      background: var(--brand, #1d9bf0);
      color: #fff;
      border: none;
      border-radius: 9999px;
      font-family: 'DM Sans', sans-serif;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition:
        background 0.18s ease,
        transform 0.15s cubic-bezier(0.22,1,0.36,1),
        box-shadow 0.2s ease;
    }
    .rs-premium-btn:hover {
      background: #1a8cd8;
      transform: scale(1.03);
      box-shadow: 0 4px 20px rgba(29,155,240,0.45);
    }
    .rs-premium-btn:active { transform: scale(0.97); }

    /* Who to follow */
    .rs-follow-card {
      animation: rs-cardReveal 0.45s 0.18s cubic-bezier(0.22,1,0.36,1) both;
    }

    .rs-follow-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      cursor: pointer;
      transition: background 0.16s ease;
      border-radius: 12px;
      margin: 0 4px;
    }
    .rs-follow-row:hover {
      background: rgba(255,255,255,0.05);
    }

    /* Avatar wrapper */
    .rs-avatar-wrap {
      position: relative;
      flex-shrink: 0;
    }
    .rs-avatar-wrap::after {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(29,155,240,0.5), rgba(120,80,255,0.35));
      z-index: -1;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .rs-follow-row:hover .rs-avatar-wrap::after { opacity: 1; }

    /* Verified badge */
    .rs-verified {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #1d9bf0;
      flex-shrink: 0;
    }

    /* Follow button */
    .rs-follow-btn {
      margin-left: auto;
      flex-shrink: 0;
      padding: 6px 16px;
      border-radius: 9999px;
      border: 1px solid rgba(255,255,255,0.85);
      background: transparent;
      color: #fff;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition:
        background 0.16s ease,
        color 0.16s ease,
        border-color 0.16s ease,
        transform 0.15s cubic-bezier(0.22,1,0.36,1);
    }
    .rs-follow-btn:hover {
      background: #fff;
      color: #000;
      transform: scale(1.04);
    }
    .rs-follow-btn:active {
      animation: rs-followPop 0.25s ease both;
    }
    .rs-follow-btn.following {
      background: transparent;
      border-color: rgba(255,255,255,0.2);
      color: rgba(255,255,255,0.5);
    }

    /* Show more */
    .rs-show-more {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 10px 16px;
      background: transparent;
      border: none;
      color: #1d9bf0;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      text-align: left;
      border-radius: 0 0 18px 18px;
      transition: background 0.16s ease, color 0.16s ease;
    }
    .rs-show-more:hover {
      background: rgba(29,155,240,0.06);
      color: #1a8cd8;
    }

    /* Footer */
    .rs-footer {
      animation: rs-fadeUp 0.4s 0.28s cubic-bezier(0.22,1,0.36,1) both;
    }
    .rs-footer-link {
      color: rgba(255,255,255,0.28);
      text-decoration: none;
      font-size: 12px;
      transition: color 0.15s ease;
    }
    .rs-footer-link:hover { color: rgba(255,255,255,0.55); }

    /* Sparkle icon */
    .rs-sparkle-icon {
      animation: rs-sparkle 2.8s ease-in-out infinite;
      color: #FFD700;
    }

    /* Section title */
    .rs-section-title {
      font-size: 18px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.3px;
      margin: 0;
      padding: 16px 16px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Divider */
    .rs-divider {
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255,255,255,0.06) 30%,
        rgba(255,255,255,0.06) 70%,
        transparent
      );
      margin: 4px 0;
    }
  `;
  document.head.appendChild(s);
}

// ─── Static data (unchanged) ──────────────────────────────────────────────────
const suggestions = [
  {
    id: '1',
    username: 'narendramodi',
    displayName: 'Narendra Modi',
    avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400',
    verified: true,
  },
  {
    id: '2',
    username: 'akshaykumar',
    displayName: 'Akshay Kumar',
    avatar: 'https://images.pexels.com/photos/1382735/pexels-photo-1382735.jpeg?auto=compress&cs=tinysrgb&w=400',
    verified: true,
  },
  {
    id: '3',
    username: 'rashtrapatibhvn',
    displayName: 'President of India',
    avatar: 'https://images.pexels.com/photos/1080213/pexels-photo-1080213.jpeg?auto=compress&cs=tinysrgb&w=400',
    verified: true,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function RightSidebar() {
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  const toggleFollow = (id: string) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div
      className="rs-root"
      style={{
        width: 320,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        minHeight: '100vh',
      }}
    >
      {/* ── Search ── */}
      <div className="rs-search-wrap">
        <Search size={16} className="rs-search-icon" />
        <input
          className="rs-search-input"
          placeholder="Search"
          type="search"
        />
      </div>

      {/* ── Premium Card ── */}
      <div className="rs-card rs-premium-card">
        <div className="rs-premium-shimmer" />
        <div style={{ padding: '18px 18px 16px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Sparkles size={18} className="rs-sparkle-icon" />
            <h3
              style={{
                margin: 0,
                color: '#fff',
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: '-0.2px',
              }}
            >
              Subscribe to Premium
            </h3>
          </div>
          <p
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 13,
              lineHeight: 1.55,
              margin: '0 0 14px',
            }}
          >
            Unlock new features and if eligible, receive a share of revenue.
          </p>
          <button className="rs-premium-btn">
            <Star size={13} strokeWidth={2.5} />
            Subscribe
          </button>
        </div>
      </div>

      {/* ── Who to Follow ── */}
      <div className="rs-card rs-follow-card">
        <p className="rs-section-title">
          You might like
        </p>

        <div className="rs-divider" />

        <div style={{ padding: '6px 0 4px' }}>
          {suggestions.map((user, idx) => (
            <div
              key={user.id}
              className="rs-follow-row"
              style={{
                animation: `rs-fadeUp 0.38s ${0.2 + idx * 0.07}s cubic-bezier(0.22,1,0.36,1) both`,
              }}
            >
              {/* Avatar */}
              <div className="rs-avatar-wrap">
                <Avatar style={{ width: 40, height: 40 }}>
                  <AvatarImage src={user.avatar} alt={user.displayName} />
                  <AvatarFallback
                    style={{
                      background: 'linear-gradient(135deg,#1d9bf0,#7950ff)',
                      color: '#fff',
                      fontWeight: 700,
                    }}
                  >
                    {user.displayName[0]}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span
                    style={{
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 14,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 110,
                    }}
                  >
                    {user.displayName}
                  </span>
                  {user.verified && (
                    <span className="rs-verified">
                      <svg width="9" height="9" viewBox="0 0 20 20" fill="white">
                        <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                      </svg>
                    </span>
                  )}
                </div>
                <span
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 12,
                    display: 'block',
                    marginTop: 1,
                  }}
                >
                  @{user.username}
                </span>
              </div>

              {/* Follow button */}
              <button
                className={`rs-follow-btn${followed.has(user.id) ? ' following' : ''}`}
                onClick={() => toggleFollow(user.id)}
              >
                {followed.has(user.id) ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>

        <div className="rs-divider" />

        <button className="rs-show-more">
          Show more
          <ChevronRight size={14} style={{ marginTop: 1 }} />
        </button>
      </div>

      {/* ── Footer ── */}
      <div className="rs-footer" style={{ padding: '4px 4px 16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', marginBottom: 8 }}>
          {['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Accessibility', 'Ads info'].map(
            (link) => (
              <a key={link} href="#" className="rs-footer-link">
                {link}
              </a>
            )
          )}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>© 2024 X Corp.</div>
      </div>
    </div>
  );
}