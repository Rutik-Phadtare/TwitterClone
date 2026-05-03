"use client";

import { Search, Star, ChevronRight, Sparkles } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import axiosInstance from '@/lib/axiosInstance';

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
    @keyframes rs-skeletonShimmer {
      0%   { background-position: -400px 0; }
      100% { background-position:  400px 0; }
    }
    @keyframes rs-sparkle {
      0%, 100% { transform: scale(1)   rotate(0deg);  opacity: 1;   }
      50%       { transform: scale(1.2) rotate(15deg); opacity: 0.8; }
    }
    @keyframes rs-followPop {
      0%   { transform: scale(1);    }
      40%  { transform: scale(0.93); }
      100% { transform: scale(1);    }
    }
    @keyframes rs-cardReveal {
      from { opacity: 0; transform: translateY(18px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0)    scale(1);    }
    }

    .rs-root { font-family: 'DM Sans', sans-serif; animation: rs-fadeIn 0.4s ease both; }

    /* Hide scrollbar but keep scroll functional — works in both Chrome and Edge */
    .rs-root::-webkit-scrollbar { display: none; }
    .rs-root { -ms-overflow-style: none; scrollbar-width: none; }

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
      transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .rs-search-input::placeholder { color: rgba(255,255,255,0.35); }
    .rs-search-input:focus {
      background: rgba(255,255,255,0.08);
      border-color: rgba(29,155,240,0.6);
      box-shadow: 0 0 0 3px rgba(29,155,240,0.15);
    }
    .rs-search-icon {
      position: absolute; left: 14px; top: 50%;
      transform: translateY(-50%);
      color: rgba(255,255,255,0.35);
      pointer-events: none;
      transition: color 0.2s ease;
    }
    .rs-search-wrap:focus-within .rs-search-icon { color: #1d9bf0; }

    /* Cards */
    .rs-card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 18px;
      overflow: hidden;
      transition: border-color 0.2s ease;
    }
    .rs-card:hover { border-color: rgba(255,255,255,0.11); }

    /* Premium */
    .rs-premium-card {
      animation: rs-cardReveal 0.45s 0.1s cubic-bezier(0.22,1,0.36,1) both;
      position: relative; overflow: hidden;
    }
    .rs-premium-card::before {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(29,155,240,0.07) 0%, rgba(120,80,255,0.05) 60%, transparent 100%);
      pointer-events: none;
    }
    .rs-premium-shimmer {
      position: absolute; top: -60%; left: -60%;
      width: 220%; height: 220%;
      background: linear-gradient(105deg, transparent 40%, rgba(29,155,240,0.06) 50%, transparent 60%);
      background-size: 500px 100%;
      animation: rs-shimmer 3.5s infinite linear;
      pointer-events: none;
    }
    .rs-premium-btn {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 9px 20px;
      background: #1d9bf0;
      color: #fff; border: none; border-radius: 9999px;
      font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700;
      cursor: pointer;
      transition: background 0.18s ease, transform 0.15s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s ease;
    }
    .rs-premium-btn:hover { background: #1a8cd8; transform: scale(1.03); box-shadow: 0 4px 20px rgba(29,155,240,0.45); }
    .rs-premium-btn:active { transform: scale(0.97); }

    /* Follow card */
    .rs-follow-card { animation: rs-cardReveal 0.45s 0.18s cubic-bezier(0.22,1,0.36,1) both; }

    .rs-follow-row {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 16px;
      cursor: pointer;
      transition: background 0.16s ease;
      border-radius: 12px;
      margin: 0 4px;
    }
    .rs-follow-row:hover { background: rgba(255,255,255,0.05); }

    .rs-avatar-wrap { position: relative; flex-shrink: 0; }
    .rs-avatar-wrap::after {
      content: '';
      position: absolute; inset: -2px; border-radius: 50%;
      background: linear-gradient(135deg, rgba(29,155,240,0.5), rgba(120,80,255,0.35));
      z-index: -1; opacity: 0;
      transition: opacity 0.2s ease;
    }
    .rs-follow-row:hover .rs-avatar-wrap::after { opacity: 1; }

    .rs-verified {
      display: inline-flex; align-items: center; justify-content: center;
      width: 16px; height: 16px; border-radius: 50%;
      background: #1d9bf0; flex-shrink: 0;
    }

    .rs-follow-btn {
      margin-left: auto; flex-shrink: 0;
      padding: 6px 16px; border-radius: 9999px;
      border: 1px solid rgba(255,255,255,0.85);
      background: transparent; color: #fff;
      font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700;
      cursor: pointer;
      transition: background 0.16s ease, color 0.16s ease, border-color 0.16s ease, transform 0.15s cubic-bezier(0.22,1,0.36,1);
    }
    .rs-follow-btn:hover { background: #fff; color: #000; transform: scale(1.04); }
    .rs-follow-btn:active { animation: rs-followPop 0.25s ease both; }
    .rs-follow-btn.following { background: transparent; border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.5); }

    .rs-show-more {
      display: flex; align-items: center; gap: 4px;
      padding: 10px 16px;
      background: transparent; border: none;
      color: #1d9bf0;
      font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
      cursor: pointer; width: 100%; text-align: left;
      border-radius: 0 0 18px 18px;
      transition: background 0.16s ease, color 0.16s ease;
    }
    .rs-show-more:hover { background: rgba(29,155,240,0.06); color: #1a8cd8; }

    /* Skeleton shimmer */
    .rs-skel {
      background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.05) 75%);
      background-size: 400px 100%;
      animation: rs-skeletonShimmer 1.4s infinite linear;
      border-radius: 8px;
    }

    .rs-footer { animation: rs-fadeUp 0.4s 0.28s cubic-bezier(0.22,1,0.36,1) both; }
    .rs-footer-link { color: rgba(255,255,255,0.28); text-decoration: none; font-size: 12px; transition: color 0.15s ease; }
    .rs-footer-link:hover { color: rgba(255,255,255,0.55); }

    .rs-sparkle-icon { animation: rs-sparkle 2.8s ease-in-out infinite; color: #FFD700; }

    .rs-section-title {
      font-size: 18px; font-weight: 800; color: #fff;
      letter-spacing: -0.3px; margin: 0;
      padding: 16px 16px 12px;
      display: flex; align-items: center; gap: 8px;
    }
    .rs-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent);
      margin: 4px 0;
    }
  `;
  document.head.appendChild(s);
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
const SkeletonUser = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', margin: '0 4px' }}>
    <div className="rs-skel" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div className="rs-skel" style={{ width: '55%', height: 12 }} />
      <div className="rs-skel" style={{ width: '38%', height: 11, opacity: 0.6 }} />
    </div>
    <div className="rs-skel" style={{ width: 68, height: 30, borderRadius: 9999, flexShrink: 0 }} />
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────
export default function RightSidebar({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [followed,    setFollowed]    = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);

  // ── Fetch real users ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/suggested-users');
        setSuggestions(res.data);
      } catch (err) {
        console.error('Failed to fetch suggested users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, []);

  const toggleFollow = (id: string) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Helper: get initials from name ────────────────────────────────────────
  const getInitials = (user: any) => {
    const name = user.displayName || user.email || '';
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  const getHandle = (user: any) =>
    user.username || user.email?.split('@')[0] || 'user';

  return (
    <div
      className="rs-root"
      style={{
        width: 320,
        // Sticky so it stays in view while the main feed scrolls
        position: 'sticky',
        top: 0,
        // Fixed height + independent scroll so content is never clipped in Chrome
        height: '100vh',
        overflowY: 'auto',
        // Internal padding
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        // Prevent the sidebar itself from shrinking inside a flex parent
        flexShrink: 0,
      }}
    >
      {/* ── Search ── */}
      <div className="rs-search-wrap">
        <Search size={16} className="rs-search-icon" />
        <input className="rs-search-input" placeholder="Search" type="search" />
      </div>

      {/* ── Premium Card ── */}
      <div className="rs-card rs-premium-card">
        <div className="rs-premium-shimmer" />
        <div style={{ padding: '18px 18px 16px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Sparkles size={18} className="rs-sparkle-icon" />
            <h3 style={{ margin: 0, color: '#fff', fontSize: 17, fontWeight: 800, letterSpacing: '-0.2px' }}>
              Subscribe to Premium
            </h3>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.55, margin: '0 0 14px' }}>
            Unlock new features and if eligible, receive a share of revenue.
          </p>
          <button className="rs-premium-btn" onClick={() => onNavigate?.('subscription')}>
            <Star size={13} strokeWidth={2.5} />
            Subscribe
          </button>
        </div>
      </div>

      {/* ── Who to Follow ── */}
      <div className="rs-card rs-follow-card">
        <p className="rs-section-title">You might like</p>
        <div className="rs-divider" />

        <div style={{ padding: '6px 0 4px' }}>
          {loading ? (
            <>
              <SkeletonUser />
              <SkeletonUser />
              <SkeletonUser />
            </>
          ) : suggestions.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
              No suggestions yet
            </div>
          ) : (
            suggestions.map((user, idx) => (
              <div
                key={user._id}
                className="rs-follow-row"
                style={{ animation: `rs-fadeUp 0.38s ${0.2 + idx * 0.07}s cubic-bezier(0.22,1,0.36,1) both` }}
              >
                {/* Avatar */}
                <div className="rs-avatar-wrap">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.displayName}
                      referrerPolicy="no-referrer"
                      style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                        (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{
                    width: 40, height: 40,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#1d9bf0,#7950ff)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    display: user.avatar ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {getInitials(user)}
                  </div>
                </div>

                {/* Name + handle */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{
                      color: '#fff', fontWeight: 700, fontSize: 14,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110,
                    }}>
                      {user.displayName || getHandle(user)}
                    </span>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, display: 'block', marginTop: 1 }}>
                    @{getHandle(user)}
                  </span>
                </div>

                {/* Follow button */}
                <button
                  className={`rs-follow-btn${followed.has(user._id) ? ' following' : ''}`}
                  onClick={() => toggleFollow(user._id)}
                >
                  {followed.has(user._id) ? 'Following' : 'Follow'}
                </button>
              </div>
            ))
          )}
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
          {['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Accessibility', 'Ads info'].map((link) => (
            <a key={link} href="#" className="rs-footer-link">{link}</a>
          ))}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>© 2026 X Corp. Made by Rutik....</div>
      </div>
    </div>
  );
}