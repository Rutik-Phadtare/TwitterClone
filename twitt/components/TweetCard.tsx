"use client";

import React, { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  MoreHorizontal,
  Bookmark,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axiosInstance";

// ─── Inject styles once ───────────────────────────────────────────────────────
const STYLE_ID = "tweetcard-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

    /* ── Keyframes ── */
    @keyframes tc-heartPop {
      0%   { transform: scale(1); }
      25%  { transform: scale(1.45) rotate(-8deg); }
      50%  { transform: scale(0.88); }
      75%  { transform: scale(1.18); }
      100% { transform: scale(1); }
    }
    @keyframes tc-retweetSpin {
      0%   { transform: scale(1) rotate(0deg); }
      40%  { transform: scale(0.85) rotate(180deg); }
      100% { transform: scale(1) rotate(360deg); }
    }
    @keyframes tc-countPop {
      0%   { transform: translateY(0);    opacity: 1; }
      30%  { transform: translateY(-5px); opacity: 0; }
      60%  { transform: translateY(5px);  opacity: 0; }
      100% { transform: translateY(0);    opacity: 1; }
    }
    @keyframes tc-ripple {
      from { transform: scale(0); opacity: 0.5; }
      to   { transform: scale(2.8); opacity: 0; }
    }
    @keyframes tc-imageFade {
      from { opacity: 0; transform: scale(1.03); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes tc-moreMenuPop {
      from { opacity: 0; transform: scale(0.88) translateY(-6px); }
      to   { opacity: 1; transform: scale(1)    translateY(0); }
    }
    @keyframes tc-shareShake {
      0%,100% { transform: translateX(0); }
      20%      { transform: translateX(-3px) rotate(-8deg); }
      60%      { transform: translateX(3px) rotate(8deg); }
    }

    /* ── Card ── */
    .tc-card {
      font-family: 'DM Sans', sans-serif;
      background: #000;
      border: none;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      padding: 14px 16px;
      cursor: pointer;
      transition: background 0.18s ease;
      position: relative;
    }
    .tc-card:hover { background: rgba(255,255,255,0.018); }
    .tc-card:hover .tc-more-btn { opacity: 1; }

    /* ── Avatar ── */
    .tc-avatar-wrap {
      position: relative;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .tc-avatar-wrap::after {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(29,155,240,0.5), rgba(120,80,255,0.35));
      z-index: -1;
      opacity: 0;
      transition: opacity 0.22s ease;
    }
    .tc-card:hover .tc-avatar-wrap::after { opacity: 1; }

    /* ── Header row ── */
    .tc-header {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 7px;
    }
    .tc-display-name {
      color: #fff;
      font-weight: 700;
      font-size: 15px;
      line-height: 1.3;
      letter-spacing: -0.1px;
    }
    .tc-username {
      color: rgba(255,255,255,0.4);
      font-size: 14px;
      font-weight: 400;
    }
    .tc-dot {
      color: rgba(255,255,255,0.3);
      font-size: 14px;
    }
    .tc-timestamp {
      color: rgba(255,255,255,0.35);
      font-size: 13px;
    }
    .tc-verified {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 17px; height: 17px;
      border-radius: 50%;
      background: #1d9bf0;
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* ── More button ── */
    .tc-more-btn {
      margin-left: auto;
      width: 32px; height: 32px;
      border-radius: 50%;
      border: none;
      background: transparent;
      color: rgba(255,255,255,0.4);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      opacity: 0;
      transition: background 0.15s ease, color 0.15s ease, opacity 0.15s ease;
      flex-shrink: 0;
    }
    .tc-more-btn:hover {
      background: rgba(29,155,240,0.12);
      color: #1d9bf0;
    }

    /* ── More menu ── */
    .tc-more-menu {
      position: absolute;
      top: 44px; right: 16px;
      background: #16181c;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      padding: 6px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.7);
      z-index: 50;
      min-width: 180px;
      animation: tc-moreMenuPop 0.2s cubic-bezier(0.22,1,0.36,1) both;
    }
    .tc-more-menu-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px;
      border-radius: 9px;
      color: rgba(255,255,255,0.85);
      font-size: 14px; font-weight: 500;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      border: none; background: transparent; width: 100%; text-align: left;
      transition: background 0.14s ease;
    }
    .tc-more-menu-item:hover { background: rgba(255,255,255,0.07); }

    /* ── Content ── */
    .tc-content {
      color: rgba(255,255,255,0.92);
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 10px;
      word-break: break-word;
    }

    /* ── Image ── */
    .tc-image-wrap {
      border-radius: 14px;
      overflow: hidden;
      margin-bottom: 10px;
      border: 1px solid rgba(255,255,255,0.07);
    }
    .tc-image-wrap img {
      width: 100%;
      max-height: 380px;
      object-fit: cover;
      display: block;
      animation: tc-imageFade 0.4s ease both;
    }
    .tc-image-wrap img:hover { filter: brightness(0.95); transition: filter 0.2s ease; }

    /* ── Action bar ── */
    .tc-actions {
      display: flex;
      align-items: center;
      gap: 0;
      margin-top: 4px;
      max-width: 420px;
    }

    /* ── Action button base ── */
    .tc-action-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 10px;
      border-radius: 9999px;
      border: none;
      background: transparent;
      color: rgba(255,255,255,0.42);
      font-family: 'DM Sans', sans-serif;
      font-size: 13px; font-weight: 500;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: color 0.18s ease, background 0.18s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .tc-action-btn .tc-action-icon {
      transition: transform 0.18s cubic-bezier(0.22,1,0.36,1), color 0.18s ease;
      flex-shrink: 0;
    }
    .tc-action-count {
      min-width: 16px;
      display: inline-block;
      transition: all 0.2s ease;
    }

    /* Ripple */
    .tc-ripple {
      position: absolute;
      border-radius: 50%;
      width: 32px; height: 32px;
      top: 50%; left: 50%;
      transform: translate(-50%,-50%) scale(0);
      pointer-events: none;
    }

    /* ── Comment btn ── */
    .tc-comment-btn:hover {
      background: rgba(29,155,240,0.1);
      color: #1d9bf0;
    }
    .tc-comment-btn:hover .tc-action-icon {
      transform: scale(1.15) rotate(-8deg);
      color: #1d9bf0;
    }
    .tc-comment-btn .tc-ripple { background: rgba(29,155,240,0.3); }

    /* ── Retweet btn ── */
    .tc-retweet-btn:hover {
      background: rgba(0,186,124,0.1);
      color: #00ba7c;
    }
    .tc-retweet-btn:hover .tc-action-icon { color: #00ba7c; }
    .tc-retweet-btn.active { color: #00ba7c; }
    .tc-retweet-btn.active .tc-action-icon { color: #00ba7c; }
    .tc-retweet-btn .tc-ripple { background: rgba(0,186,124,0.3); }
    .tc-retweet-btn.spinning .tc-action-icon {
      animation: tc-retweetSpin 0.55s cubic-bezier(0.22,1,0.36,1) both;
    }

    /* ── Like btn ── */
    .tc-like-btn:hover {
      background: rgba(249,24,128,0.1);
      color: #f91880;
    }
    .tc-like-btn:hover .tc-action-icon { color: #f91880; }
    .tc-like-btn.active {
      color: #f91880;
    }
    .tc-like-btn.active .tc-action-icon {
      color: #f91880;
      filter: drop-shadow(0 0 4px rgba(249,24,128,0.5));
    }
    .tc-like-btn.popping .tc-action-icon {
      animation: tc-heartPop 0.45s cubic-bezier(0.22,1,0.36,1) both;
    }
    .tc-like-btn .tc-ripple { background: rgba(249,24,128,0.28); }
    .tc-like-btn.active .tc-action-count {
      animation: tc-countPop 0.3s ease both;
    }

    /* ── Share btn ── */
    .tc-share-btn:hover {
      background: rgba(29,155,240,0.1);
      color: #1d9bf0;
    }
    .tc-share-btn:hover .tc-action-icon {
      animation: tc-shareShake 0.4s ease both;
      color: #1d9bf0;
    }
    .tc-share-btn .tc-ripple { background: rgba(29,155,240,0.3); }

    /* ── Bookmark btn ── */
    .tc-bookmark-btn {
      margin-left: auto;
    }
    .tc-bookmark-btn:hover {
      background: rgba(29,155,240,0.1);
      color: #1d9bf0;
    }
    .tc-bookmark-btn:hover .tc-action-icon {
      transform: scale(1.15) translateY(-2px);
      color: #1d9bf0;
    }
    .tc-bookmark-btn.active {
      color: #1d9bf0;
    }
    .tc-bookmark-btn.active .tc-action-icon {
      fill: #1d9bf0;
      color: #1d9bf0;
    }
  `;
  document.head.appendChild(s);
}

// ─── Ripple helper ────────────────────────────────────────────────────────────
function fireRipple(el: HTMLElement) {
  const ripple = el.querySelector(".tc-ripple") as HTMLElement | null;
  if (!ripple) return;
  ripple.style.animation = "none";
  void ripple.offsetWidth;
  ripple.style.animation = "tc-ripple 0.5s ease-out forwards";
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TweetCard({ tweet }: any) {
  const { user } = useAuth();
  const [tweetstate, settweetstate] = useState(tweet);
  const [likePopping, setLikePopping] = useState(false);
  const [retweetSpinning, setRetweetSpinning] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // ── unchanged logic ──────────────────────────────────────────────────────
  const likeTweet = async (tweetId: string) => {
    try {
      const res = await axiosInstance.post(`/like/${tweetId}`, {
        userId: user?._id,
      });
      settweetstate(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const retweetTweet = async (tweetId: string) => {
    try {
      const res = await axiosInstance.post(`/retweet/${tweetId}`, {
        userId: user?._id,
      });
      settweetstate(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num?.toString() ?? "0";
  };

  const isLiked = tweetstate.likedBy?.includes(user?._id);
  const isRetweet = tweetstate.retweetedBy?.includes(user?._id);
  // ────────────────────────────────────────────────────────────────────────

  const handleLike = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    fireRipple(e.currentTarget);
    setLikePopping(true);
    setTimeout(() => setLikePopping(false), 500);
    likeTweet(tweetstate._id);
  };

  const handleRetweet = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    fireRipple(e.currentTarget);
    setRetweetSpinning(true);
    setTimeout(() => setRetweetSpinning(false), 600);
    retweetTweet(tweetstate._id);
  };

  return (
    <div
      ref={cardRef}
      className="tc-card"
      onClick={() => setShowMenu(false)}
    >
      {/* ── More menu (context) ── */}
      {showMenu && (
        <div className="tc-more-menu">
          {["Copy link", "Embed post", "Report post"].map((item) => (
            <button
              key={item}
              className="tc-more-menu-item"
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        {/* ── Avatar ── */}
        <div className="tc-avatar-wrap">
          <Avatar style={{ width: 44, height: 44 }}>
            <AvatarImage
              src={tweetstate.author.avatar}
              alt={tweetstate.author.displayName}
              style={{ objectFit: "cover" }}
            />
            <AvatarFallback
              style={{
                background: "linear-gradient(135deg,#1d9bf0,#7950ff)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              {tweetstate.author.displayName?.[0]}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div className="tc-header">
            <span className="tc-display-name">{tweetstate.author.displayName}</span>

            {tweetstate.author.verified && (
              <span className="tc-verified">
                <svg width="9" height="9" viewBox="0 0 20 20" fill="white">
                  <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
              </span>
            )}

            <span className="tc-username">@{tweetstate.author.username}</span>
            <span className="tc-dot">·</span>
            <span className="tc-timestamp">
              {tweetstate.timestamp &&
                new Date(tweetstate.timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
            </span>

            {/* More button */}
            <button
              className="tc-more-btn"
              onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
            >
              <MoreHorizontal size={17} />
            </button>
          </div>

          {/* Content */}
          <div className="tc-content">{tweetstate.content}</div>

          {/* Image */}
          {tweetstate.image && (
            <div className="tc-image-wrap">
              <img src={tweetstate.image} alt="Tweet media" loading="lazy" />
            </div>
          )}

          {/* ── Actions ── */}
          <div className="tc-actions">

            {/* Comment */}
            <button
              className="tc-action-btn tc-comment-btn"
              onClick={(e) => { e.stopPropagation(); fireRipple(e.currentTarget); }}
            >
              <div className="tc-ripple" />
              <MessageCircle size={17} className="tc-action-icon" />
              <span className="tc-action-count">{formatNumber(tweetstate.comments ?? 0)}</span>
            </button>

            {/* Retweet */}
            <button
              className={`tc-action-btn tc-retweet-btn${isRetweet ? " active" : ""}${retweetSpinning ? " spinning" : ""}`}
              onClick={handleRetweet}
            >
              <div className="tc-ripple" />
              <Repeat2 size={17} className="tc-action-icon" />
              <span className="tc-action-count">{formatNumber(tweetstate.retweets ?? 0)}</span>
            </button>

            {/* Like */}
            <button
              className={`tc-action-btn tc-like-btn${isLiked ? " active" : ""}${likePopping ? " popping" : ""}`}
              onClick={handleLike}
            >
              <div className="tc-ripple" />
              <Heart
                size={17}
                className="tc-action-icon"
                style={{ fill: isLiked ? "#f91880" : "none" }}
              />
              <span className="tc-action-count">{formatNumber(tweetstate.likes ?? 0)}</span>
            </button>

            {/* Share */}
            <button
              className="tc-action-btn tc-share-btn"
              onClick={(e) => { e.stopPropagation(); fireRipple(e.currentTarget); }}
            >
              <div className="tc-ripple" />
              <Share size={17} className="tc-action-icon" />
            </button>

            {/* Bookmark */}
            <button
              className={`tc-action-btn tc-bookmark-btn${bookmarked ? " active" : ""}`}
              onClick={(e) => { e.stopPropagation(); setBookmarked((v) => !v); }}
            >
              <Bookmark
                size={16}
                className="tc-action-icon"
                style={{ fill: bookmarked ? "#1d9bf0" : "none" }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}