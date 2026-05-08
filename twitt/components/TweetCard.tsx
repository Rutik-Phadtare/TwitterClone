"use client";

import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  MoreHorizontal,
  Bookmark,
  Mic,          // ← NEW: for audio tweet badge
  Play,         // ← NEW
  Pause,        // ← NEW
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axiosInstance";
import { sendTweetNotification } from "@/lib/notificationUtils";
import { timeAgo } from "@/lib/timeAgo";
import { formatTweetContent } from "@/lib/formatTweetContent";

const STYLE_ID = "tweetcard-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

    /* ── Keyframes ── */
    @keyframes tc-heartPop {
      0%   { transform: scale(1); }
      20%  { transform: scale(1.55) rotate(-10deg); }
      50%  { transform: scale(0.85); }
      75%  { transform: scale(1.2) rotate(4deg); }
      100% { transform: scale(1) rotate(0deg); }
    }
    @keyframes tc-heartBurst {
      0%   { opacity: 1; transform: translate(-50%,-50%) scale(0); }
      60%  { opacity: 0.6; transform: translate(-50%,-50%) scale(1.8); }
      100% { opacity: 0; transform: translate(-50%,-50%) scale(2.4); }
    }
    @keyframes tc-retweetSpin {
      0%   { transform: scale(1) rotate(0deg); }
      40%  { transform: scale(0.82) rotate(200deg); }
      100% { transform: scale(1) rotate(360deg); }
    }
    @keyframes tc-countPop {
      0%   { transform: translateY(0);    opacity: 1; }
      30%  { transform: translateY(-6px); opacity: 0; }
      60%  { transform: translateY(6px);  opacity: 0; }
      100% { transform: translateY(0);    opacity: 1; }
    }
    @keyframes tc-ripple {
      from { transform: scale(0); opacity: 0.55; }
      to   { transform: scale(2.6); opacity: 0; }
    }
    @keyframes tc-imageFade {
      from { opacity: 0; transform: scale(1.04); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes tc-moreMenuPop {
      from { opacity: 0; transform: scale(0.86) translateY(-8px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes tc-shareShake {
      0%,100% { transform: translateX(0) rotate(0); }
      20%     { transform: translateX(-3px) rotate(-10deg); }
      60%     { transform: translateX(3px) rotate(10deg); }
    }
    @keyframes tc-avatarGlow {
      0%,100% { box-shadow: 0 0 0 0 rgba(29,155,240,0); }
      50%     { box-shadow: 0 0 0 4px rgba(29,155,240,0.2); }
    }
    @keyframes tc-slideIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes tc-bookmarkBounce {
      0%   { transform: translateY(0) scale(1); }
      30%  { transform: translateY(-5px) scale(1.2); }
      60%  { transform: translateY(1px) scale(0.92); }
      100% { transform: translateY(0) scale(1); }
    }
    @keyframes tc-shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    @keyframes tc-dot-pulse {
      0%,100% { opacity: 0.3; transform: scale(1); }
      50%     { opacity: 1; transform: scale(1.4); }
    }

    /* ── NEW: audio waveform bars pulse while playing ── */
    @keyframes tc-wave-bar {
      0%,100% { transform: scaleY(0.4); }
      50%     { transform: scaleY(1); }
    }

    /* ── Card ── */
    .tc-card {
      font-family: 'DM Sans', sans-serif;
      background: #000;
      border: none;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      padding: 14px 16px 10px;
      cursor: pointer;
      transition: background 0.22s ease;
      position: relative;
      animation: tc-slideIn 0.32s cubic-bezier(0.22,1,0.36,1) both;
    }
    .tc-card:hover { background: rgba(255,255,255,0.022); }
    .tc-card:hover .tc-more-btn { opacity: 1; }

    .tc-card::before {
      content: '';
      position: absolute;
      left: 0; top: 20%; bottom: 20%;
      width: 2.5px;
      background: linear-gradient(to bottom, transparent, #1d9bf0, transparent);
      border-radius: 0 2px 2px 0;
      opacity: 0;
      transition: opacity 0.25s ease;
    }
    .tc-card:hover::before { opacity: 0.6; }

    /* ── Avatar ── */
    .tc-avatar-wrap { position: relative; flex-shrink: 0; margin-top: 2px; }
    .tc-avatar-ring {
      position: absolute; inset: -3px; border-radius: 50%;
      background: conic-gradient(#1d9bf0, #7950ff, #1d9bf0);
      opacity: 0; transition: opacity 0.28s ease; z-index: 0;
    }
    .tc-avatar-ring::after {
      content: ''; position: absolute; inset: 2px; border-radius: 50%;
      background: #000; z-index: 1;
    }
    .tc-card:hover .tc-avatar-ring { opacity: 1; }
    .tc-avatar-inner {
      position: relative; z-index: 2; border-radius: 50%;
      overflow: hidden; width: 44px; height: 44px;
      transition: transform 0.22s ease;
    }
    .tc-card:hover .tc-avatar-inner { transform: scale(1.04); }

    /* ── Header row ── */
    .tc-header { display: flex; align-items: flex-start; gap: 5px; flex-wrap: wrap; margin-bottom: 7px; }
    .tc-display-name {
      color: #fff; font-weight: 700; font-size: 15px;
      line-height: 1.3; letter-spacing: -0.1px; position: relative;
    }
    .tc-display-name::after {
      content: ''; position: absolute; bottom: -1px; left: 0;
      width: 0; height: 1px; background: #fff; transition: width 0.22s ease;
    }
    .tc-display-name:hover::after { width: 100%; }
    .tc-username  { color: rgba(255,255,255,0.38); font-size: 14px; font-weight: 400; }
    .tc-dot       { color: rgba(255,255,255,0.25); font-size: 14px; }
    .tc-timestamp { color: rgba(255,255,255,0.32); font-size: 13px; }
    .tc-verified  {
      display: inline-flex; align-items: center; justify-content: center;
      width: 17px; height: 17px; border-radius: 50%; background: #1d9bf0;
      flex-shrink: 0; margin-top: 1px; box-shadow: 0 0 6px rgba(29,155,240,0.5);
    }

    /* ── More button ── */
    .tc-more-btn {
      margin-left: auto; width: 32px; height: 32px; border-radius: 50%; border: none;
      background: transparent; color: rgba(255,255,255,0.35);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; opacity: 0;
      transition: background 0.15s ease, color 0.15s ease, opacity 0.2s ease, transform 0.15s ease;
      flex-shrink: 0;
    }
    .tc-more-btn:hover { background: rgba(29,155,240,0.12); color: #1d9bf0; transform: rotate(90deg); }

    /* ── More menu ── */
    .tc-more-menu {
      position: absolute; top: 44px; right: 16px; background: #16181c;
      border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 6px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04);
      z-index: 50; min-width: 190px;
      animation: tc-moreMenuPop 0.22s cubic-bezier(0.22,1,0.36,1) both;
    }
    .tc-more-menu-item {
      display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 9px;
      color: rgba(255,255,255,0.85); font-size: 14px; font-weight: 500;
      font-family: 'DM Sans', sans-serif; cursor: pointer; border: none;
      background: transparent; width: 100%; text-align: left;
      transition: background 0.14s ease, color 0.14s ease, padding-left 0.14s ease;
    }
    .tc-more-menu-item:hover { background: rgba(255,255,255,0.07); padding-left: 18px; }

    /* ── Content ── */
    .tc-content {
      color: rgba(255,255,255,0.9); font-size: 15px; line-height: 1.65;
      margin-bottom: 10px; word-break: break-word;
    }

    /* ── Image ── */
    .tc-image-wrap {
      border-radius: 16px; overflow: hidden; margin-bottom: 12px;
      border: 1px solid rgba(255,255,255,0.08); position: relative;
    }
    .tc-image-wrap::after {
      content: ''; position: absolute; inset: 0; border-radius: 16px;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06); pointer-events: none;
    }
    .tc-image-wrap img {
      width: 100%; max-height: 380px; object-fit: cover; display: block;
      animation: tc-imageFade 0.45s ease both;
      transition: transform 0.4s ease, filter 0.3s ease;
    }
    .tc-image-wrap:hover img { transform: scale(1.02); filter: brightness(0.92); }

    /* ── NEW: Audio player ── */
    .tc-audio-player {
      display: flex; align-items: center; gap: 10px;
      background: rgba(29,155,240,0.06);
      border: 1px solid rgba(29,155,240,0.15);
      border-radius: 14px; padding: 10px 14px;
      margin-bottom: 12px;
      transition: border-color 0.2s ease;
    }
    .tc-audio-player:hover { border-color: rgba(29,155,240,0.3); }
    .tc-audio-play-btn {
      width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
      background: #1d9bf0; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      box-shadow: 0 2px 12px rgba(29,155,240,0.35);
    }
    .tc-audio-play-btn:hover { transform: scale(1.08); box-shadow: 0 4px 18px rgba(29,155,240,0.5); }
    .tc-audio-play-btn:active { transform: scale(0.95); }
    .tc-audio-waveform {
      display: flex; align-items: center; gap: 2.5px; height: 28px; flex: 1;
    }
    .tc-audio-bar {
      width: 3px; border-radius: 3px; background: rgba(29,155,240,0.5);
      transform-origin: center bottom;
      transition: background 0.2s ease;
    }
    .tc-audio-bar.playing {
      background: #1d9bf0;
    }
    .tc-audio-badge {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 11px; font-weight: 600; color: rgba(29,155,240,0.8);
      background: rgba(29,155,240,0.08);
      border: 1px solid rgba(29,155,240,0.15);
      border-radius: 9999px; padding: 2px 8px 2px 6px;
      margin-bottom: 6px;
    }

    /* ── Action bar ── */
    .tc-actions {
      display: flex; align-items: center; gap: 0;
      margin-top: 6px; max-width: 440px;
    }
    .tc-action-btn {
      display: flex; align-items: center; gap: 6px; padding: 7px 10px;
      border-radius: 9999px; border: none; background: transparent;
      color: rgba(255,255,255,0.38); font-family: 'DM Sans', sans-serif;
      font-size: 13px; font-weight: 500; cursor: pointer;
      position: relative; overflow: hidden;
      transition: color 0.18s ease, background 0.18s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .tc-action-btn .tc-action-icon { transition: transform 0.2s cubic-bezier(0.22,1,0.36,1), color 0.18s ease; flex-shrink: 0; }
    .tc-action-count { min-width: 16px; display: inline-block; transition: all 0.22s ease; font-variant-numeric: tabular-nums; }
    .tc-ripple {
      position: absolute; border-radius: 50%; width: 34px; height: 34px;
      top: 50%; left: 50%; transform: translate(-50%,-50%) scale(0); pointer-events: none;
    }
    .tc-heart-burst {
      position: absolute; width: 40px; height: 40px; border-radius: 50%;
      border: 2px solid #f91880; top: 50%; left: 50%;
      transform: translate(-50%,-50%) scale(0); pointer-events: none; opacity: 0;
    }
    .tc-heart-burst.fire { animation: tc-heartBurst 0.4s ease-out forwards; }

    .tc-comment-btn:hover { background: rgba(29,155,240,0.1); color: #1d9bf0; }
    .tc-comment-btn:hover .tc-action-icon { transform: scale(1.18) rotate(-10deg); color: #1d9bf0; }
    .tc-comment-btn .tc-ripple { background: rgba(29,155,240,0.3); }

    .tc-retweet-btn:hover { background: rgba(0,186,124,0.1); color: #00ba7c; }
    .tc-retweet-btn:hover .tc-action-icon { color: #00ba7c; }
    .tc-retweet-btn.active { color: #00ba7c; }
    .tc-retweet-btn.active .tc-action-icon { color: #00ba7c; filter: drop-shadow(0 0 4px rgba(0,186,124,0.5)); }
    .tc-retweet-btn .tc-ripple { background: rgba(0,186,124,0.3); }
    .tc-retweet-btn.spinning .tc-action-icon { animation: tc-retweetSpin 0.55s cubic-bezier(0.22,1,0.36,1) both; }

    .tc-like-btn:hover { background: rgba(249,24,128,0.1); color: #f91880; }
    .tc-like-btn:hover .tc-action-icon { color: #f91880; }
    .tc-like-btn.active { color: #f91880; }
    .tc-like-btn.active .tc-action-icon { color: #f91880; filter: drop-shadow(0 0 5px rgba(249,24,128,0.55)); }
    .tc-like-btn.popping .tc-action-icon { animation: tc-heartPop 0.45s cubic-bezier(0.22,1,0.36,1) both; }
    .tc-like-btn .tc-ripple { background: rgba(249,24,128,0.28); }
    .tc-like-btn.active .tc-action-count { animation: tc-countPop 0.28s ease both; color: #f91880; }

    .tc-share-btn:hover { background: rgba(29,155,240,0.1); color: #1d9bf0; }
    .tc-share-btn:hover .tc-action-icon { animation: tc-shareShake 0.4s ease both; color: #1d9bf0; }
    .tc-share-btn .tc-ripple { background: rgba(29,155,240,0.3); }

    .tc-bookmark-btn { margin-left: auto; }
    .tc-bookmark-btn:hover { background: rgba(29,155,240,0.1); color: #1d9bf0; }
    .tc-bookmark-btn:hover .tc-action-icon { transform: scale(1.15) translateY(-2px); color: #1d9bf0; }
    .tc-bookmark-btn.active { color: #1d9bf0; }
    .tc-bookmark-btn.active .tc-action-icon { fill: #1d9bf0; color: #1d9bf0; }
    .tc-bookmark-btn.bouncing .tc-action-icon { animation: tc-bookmarkBounce 0.4s cubic-bezier(0.22,1,0.36,1) both; }

    .tc-card.new-tweet {
      background: linear-gradient(90deg, rgba(29,155,240,0.04) 0%, rgba(29,155,240,0.02) 50%, rgba(0,0,0,0) 100%);
    }
  `;
  document.head.appendChild(s);
}

function fireRipple(el: HTMLElement) {
  const ripple = el.querySelector(".tc-ripple") as HTMLElement | null;
  if (!ripple) return;
  ripple.style.animation = "none";
  void ripple.offsetWidth;
  ripple.style.animation = "tc-ripple 0.52s ease-out forwards";
}

// ─── Decorative static waveform bars (vary height by index) ──────────────────
const WAVE_PATTERN = [8, 14, 20, 28, 18, 24, 32, 16, 22, 28, 12, 26, 20, 32, 18, 14, 24, 20, 16, 10, 22, 28, 18, 12];

// ─── Duration formatter ───────────────────────────────────────────────────────
const fmtTime = (s: number) => `${Math.floor(s / 60)}:${Math.round(s % 60).toString().padStart(2, "0")}`;

export default function TweetCard({ tweet }: any) {
  const { user } = useAuth();
  const [tweetstate, settweetstate]       = useState(tweet);
  const [likePopping, setLikePopping]     = useState(false);
  const [heartBurst, setHeartBurst]       = useState(false);
  const [retweetSpinning, setRetweetSpinning] = useState(false);
  const [bookmarkBouncing, setBookmarkBouncing] = useState(false);
  const [showMenu, setShowMenu]           = useState(false);
  const [isNew, setIsNew]                 = useState(true);

  // ── NEW: audio player state ───────────────────────────────────────────────
  const [audioPlaying, setAudioPlaying]   = useState(false);
  const [audioProgress, setAudioProgress] = useState(0); // 0–1
  const [audioCurrent, setAudioCurrent]   = useState(0); // seconds
  const audioElemRef                      = useRef<HTMLAudioElement | null>(null);
  const progressRafRef                    = useRef<number | null>(null);
  // ─────────────────────────────────────────────────────────────────────────

  const cardRef = useRef<HTMLDivElement>(null);
  const [bookmarked, setBookmarked] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    return saved.includes(tweet._id);
  });

  useEffect(() => {
    const t = setTimeout(() => setIsNew(false), 1500);
    return () => clearTimeout(t);
  }, []);

  // ── NEW: update audio progress via rAF ───────────────────────────────────
  useEffect(() => {
    const el = audioElemRef.current;
    if (!el) return;
    const tick = () => {
      if (!el.duration) return;
      setAudioCurrent(el.currentTime);
      setAudioProgress(el.currentTime / el.duration);
      if (!el.paused) progressRafRef.current = requestAnimationFrame(tick);
    };
    const onPlay  = () => { setAudioPlaying(true);  progressRafRef.current = requestAnimationFrame(tick); };
    const onPause = () => { setAudioPlaying(false); progressRafRef.current && cancelAnimationFrame(progressRafRef.current); };
    const onEnded = () => { setAudioPlaying(false); setAudioProgress(0); setAudioCurrent(0); };
    el.addEventListener("play",  onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("play",  onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      progressRafRef.current && cancelAnimationFrame(progressRafRef.current);
    };
  }, [tweetstate.audio]);
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (tweetstate.isLiked) {
      sendTweetNotification(tweetstate.content);
    }
  }, [tweetstate]);

  const likeTweet = async (tweetId: string) => {
    try {
      const res = await axiosInstance.post(`/like/${tweetId}`);
      settweetstate(res.data);
    } catch (error: any) {
      console.error("Like error:", error.response?.data || error.message);
    }
  };

  const retweetTweet = async (tweetId: string) => {
    try {
      const res = await axiosInstance.post(`/retweet/${tweetId}`);
      settweetstate(res.data);
    } catch (error: any) {
      console.error("Retweet error:", error.response?.data || error.message);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000)     return (num / 1_000).toFixed(1) + "K";
    return num?.toString() ?? "0";
  };

  const isLiked = tweetstate.likedBy?.some(
    (id: any) => id?.toString() === user?._id?.toString(),
  );
  const isRetweet = tweetstate.retweetedBy?.some(
    (id: any) => id?.toString() === user?._id?.toString(),
  );

  const handleLike = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    fireRipple(e.currentTarget);
    setLikePopping(true);
    if (!isLiked) { setHeartBurst(true); setTimeout(() => setHeartBurst(false), 500); }
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

  const handleBookmark = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const saved = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    const newSaved = bookmarked
      ? saved.filter((id: string) => id !== tweetstate._id)
      : [...saved, tweetstate._id];
    localStorage.setItem("bookmarks", JSON.stringify(newSaved));
    setBookmarked((v: boolean) => !v);
    setBookmarkBouncing(true);
    setTimeout(() => setBookmarkBouncing(false), 450);
  };

  // ── NEW: toggle audio playback ────────────────────────────────────────────
  const handleAudioToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = audioElemRef.current;
    if (!el) return;
    if (audioPlaying) el.pause();
    else              el.play().catch(() => {});
  };

  // ── NEW: seek by clicking the progress bar ────────────────────────────────
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const el = audioElemRef.current;
    if (!el || !el.duration) return;
    const rect  = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    el.currentTime = ratio * el.duration;
    setAudioProgress(ratio);
  };
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      ref={cardRef}
      className={`tc-card${isNew ? " new-tweet" : ""}`}
      onClick={() => setShowMenu(false)}
    >
      {/* More menu */}
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
        <div className="tc-avatar-wrap" style={{ width: 44, height: 44 }}>
          <div className="tc-avatar-ring" />
          <div className="tc-avatar-inner">
            <Avatar style={{ width: 44, height: 44 }}>
              <AvatarImage src={tweetstate.author?.avatar} alt={tweetstate.author?.displayName} style={{ objectFit: "cover" }} />
              <AvatarFallback style={{ background: "linear-gradient(135deg,#1d9bf0,#7950ff)", color: "#fff", fontWeight: 700, fontSize: 16 }}>
                {tweetstate.author?.displayName?.[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div className="tc-header">
            <span className="tc-display-name">{tweetstate.author?.displayName}</span>

            {tweetstate.author?.verified && (
              <span className="tc-verified">
                <svg width="9" height="9" viewBox="0 0 20 20" fill="white">
                  <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
              </span>
            )}

            <span className="tc-username">@{tweetstate.author?.username}</span>
            <span className="tc-dot">·</span>
            <span className="tc-timestamp">{tweetstate.timestamp && timeAgo(tweetstate.timestamp)}</span>

            <button
              className="tc-more-btn"
              onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
            >
              <MoreHorizontal size={17} />
            </button>
          </div>

          {/* Content */}
          <div className="tc-content">{formatTweetContent(tweetstate.content)}</div>

          {/* Image */}
          {tweetstate.image && (
            <div className="tc-image-wrap">
              <img src={tweetstate.image} alt="Tweet media" loading="lazy" />
            </div>
          )}

          {/* ── NEW: Audio Player ───────────────────────────────────────────── */}
          {tweetstate.audio && (
            <div onClick={e => e.stopPropagation()}>
              {/* Hidden audio element */}
              <audio ref={audioElemRef} src={tweetstate.audio} preload="metadata" style={{ display: "none" }} />

              {/* Badge */}
              <div className="tc-audio-badge">
                <Mic size={10} />
                Audio tweet
              </div>

              {/* Player card */}
              <div className="tc-audio-player">
                {/* Play / Pause */}
                <button className="tc-audio-play-btn" onClick={handleAudioToggle}>
                  {audioPlaying
                    ? <Pause size={15} color="#fff" />
                    : <Play  size={15} color="#fff" style={{ marginLeft: 2 }} />
                  }
                </button>

                {/* Waveform + progress */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                  {/* Clickable waveform */}
                  <div
                    className="tc-audio-waveform"
                    onClick={handleSeek}
                    style={{ cursor: "pointer", position: "relative" }}
                  >
                    {WAVE_PATTERN.map((h, i) => {
                      const filled = i / WAVE_PATTERN.length < audioProgress;
                      return (
                        <div
                          key={i}
                          className={`tc-audio-bar${audioPlaying ? " playing" : ""}`}
                          style={{
                            height: h,
                            background: filled ? "#1d9bf0" : "rgba(255,255,255,0.15)",
                            animation: audioPlaying
                              ? `tc-wave-bar ${0.5 + (i % 5) * 0.12}s ease-in-out infinite alternate`
                              : "none",
                            animationDelay: `${i * 0.04}s`,
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Time */}
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "rgba(255,255,255,.4)", fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
                      {fmtTime(audioCurrent)}
                    </span>
                    {tweetstate.audioDuration && (
                      <span style={{ color: "rgba(255,255,255,.25)", fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
                        {fmtTime(tweetstate.audioDuration)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* ───────────────────────────────────────────────────────────────── */}

          {/* ── Actions ── */}
          <div className="tc-actions">
            {/* Comment */}
            <button className="tc-action-btn tc-comment-btn" onClick={(e) => { e.stopPropagation(); fireRipple(e.currentTarget); }}>
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
              <div className={`tc-heart-burst${heartBurst ? " fire" : ""}`} />
              <Heart size={17} className="tc-action-icon" style={{ fill: isLiked ? "#f91880" : "none" }} />
              <span className="tc-action-count">{formatNumber(tweetstate.likes ?? 0)}</span>
            </button>

            {/* Share */}
            <button className="tc-action-btn tc-share-btn" onClick={(e) => { e.stopPropagation(); fireRipple(e.currentTarget); }}>
              <div className="tc-ripple" />
              <Share size={17} className="tc-action-icon" />
            </button>

            {/* Bookmark */}
            <button
              className={`tc-action-btn tc-bookmark-btn${bookmarked ? " active" : ""}${bookmarkBouncing ? " bouncing" : ""}`}
              onClick={handleBookmark}
            >
              <Bookmark size={16} className="tc-action-icon" style={{ fill: bookmarked ? "#1d9bf0" : "none" }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}