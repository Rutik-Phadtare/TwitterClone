"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Heart, MessageCircle, Repeat2, Share, MoreHorizontal, Bookmark,
  Mic, Play, Pause, Pencil, Trash2, Check, X as XIcon, AlertTriangle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axiosInstance";
import { sendTweetNotification } from "@/lib/notificationUtils";
import { timeAgo } from "@/lib/timeAgo";
import { formatTweetContent } from "@/lib/formatTweetContent";
import UserProfileModal from "./UserProfileModal";
import { createPortal } from "react-dom";

const STYLE_ID = "tweetcard-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

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
    @keyframes tc-wave-bar {
      0%,100% { transform: scaleY(0.4); }
      50%     { transform: scaleY(1); }
    }
    @keyframes tc-deleteShake {
      0%,100% { transform: translateX(0); }
      20%     { transform: translateX(-4px); }
      40%     { transform: translateX(4px); }
      60%     { transform: translateX(-3px); }
      80%     { transform: translateX(2px); }
    }
    @keyframes tc-editExpand {
      from { opacity: 0; transform: scaleY(0.94); transform-origin: top; }
      to   { opacity: 1; transform: scaleY(1); }
    }
    @keyframes tc-confirmIn {
      from { opacity: 0; transform: scale(0.92) translateY(4px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes tc-fadeOut {
      from { opacity: 1; transform: translateY(0) scale(1); max-height: 300px; }
      to   { opacity: 0; transform: translateY(-8px) scale(0.98); max-height: 0; padding: 0; }
    }

    .tc-card {
      font-family: 'DM Sans', sans-serif;
      background: #000;
      border: none;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      padding: 14px 16px 10px;
      cursor: pointer;
      transition: background 0.22s ease;
      position: relative;
      z-index: 0;
      animation: tc-slideIn 0.32s cubic-bezier(0.22,1,0.36,1) both;
    }

    /* ── FIX: When inside TweetDetailPage, skip animation so card is
       instantly visible — no black/blank flash on open ── */
    .tc-card.is-detail {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }

    .tc-card:hover { background: rgba(255,255,255,0.022); }
    .tc-card:hover .tc-more-btn { opacity: 1; }
    .tc-card::before {
      content: '';
      position: absolute; left: 0; top: 20%; bottom: 20%;
      width: 2.5px;
      background: linear-gradient(to bottom, transparent, #1d9bf0, transparent);
      border-radius: 0 2px 2px 0; opacity: 0; transition: opacity 0.25s ease;
    }
    .tc-card:hover::before { opacity: 0.6; }
    .tc-card.is-deleting { animation: tc-fadeOut 0.4s ease forwards; pointer-events: none; overflow: hidden; }
    .tc-card.is-editing { cursor: default; }
    .tc-card.is-editing::before { opacity: 0 !important; }
    .tc-card.menu-open { z-index: 100; }

    .tc-avatar-wrap { position: relative; flex-shrink: 0; margin-top: 2px; }
    .tc-avatar-ring {
      position: absolute; inset: -3px; border-radius: 50%;
      background: conic-gradient(#1d9bf0, #7950ff, #1d9bf0);
      opacity: 0; transition: opacity 0.28s ease; z-index: 0;
    }
    .tc-avatar-ring::after {
      content: ''; position: absolute; inset: 2px; border-radius: 50%; background: #000; z-index: 1;
    }
    .tc-card:hover .tc-avatar-ring { opacity: 1; }
    .tc-avatar-inner {
      position: relative; z-index: 2; border-radius: 50%;
      overflow: hidden; width: 44px; height: 44px; transition: transform 0.22s ease;
    }
    .tc-card:hover .tc-avatar-inner { transform: scale(1.04); }

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
    .tc-edited-badge {
      display: inline-flex; align-items: center; gap: 3px;
      color: rgba(255,255,255,0.3); font-size: 11px; font-weight: 500;
      border: 1px solid rgba(255,255,255,0.1); border-radius: 9999px;
      padding: 1px 7px; margin-left: 2px;
    }
    .tc-verified {
      display: inline-flex; align-items: center; justify-content: center;
      width: 17px; height: 17px; border-radius: 50%; background: #1d9bf0;
      flex-shrink: 0; margin-top: 1px; box-shadow: 0 0 6px rgba(29,155,240,0.5);
    }

    .tc-more-btn {
      margin-left: auto; width: 32px; height: 32px; border-radius: 50%; border: none;
      background: transparent; color: rgba(255,255,255,0.35);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; opacity: 0;
      transition: background 0.15s ease, color 0.15s ease, opacity 0.2s ease, transform 0.15s ease;
      flex-shrink: 0;
    }
    .tc-more-btn:hover { background: rgba(29,155,240,0.12); color: #1d9bf0; transform: rotate(90deg); }

    .tc-more-menu {
      position: absolute; top: 44px; right: 16px; background: #16181c;
      border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 6px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04);
      z-index: 9999; min-width: 190px;
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
    .tc-more-menu-item.tc-danger { color: #f4212e; }
    .tc-more-menu-item.tc-danger:hover { background: rgba(244,33,46,0.1); padding-left: 18px; }
    .tc-more-menu-sep { height: 1px; background: rgba(255,255,255,0.07); margin: 4px 0; }

    .tc-edit-area {
      animation: tc-editExpand 0.22s cubic-bezier(0.22,1,0.36,1) both;
      background: rgba(29,155,240,0.04);
      border: 1px solid rgba(29,155,240,0.25);
      border-radius: 14px; padding: 12px 14px; margin-bottom: 10px;
    }
    .tc-edit-textarea {
      width: 100%; background: transparent; border: none; outline: none;
      resize: none; color: #fff; font-family: 'DM Sans', sans-serif;
      font-size: 15px; line-height: 1.65; caret-color: #1d9bf0;
    }
    .tc-edit-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
    .tc-edit-count { font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; }
    .tc-edit-actions { display: flex; align-items: center; gap: 8px; }
    .tc-edit-cancel-btn {
      height: 32px; padding: 0 14px; border-radius: 9999px; border: 1px solid rgba(255,255,255,0.2);
      background: transparent; color: rgba(255,255,255,0.7);
      font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: background 0.15s, transform 0.12s;
      display: flex; align-items: center; gap: 5px;
    }
    .tc-edit-cancel-btn:hover { background: rgba(255,255,255,0.07); transform: scale(1.02); }
    .tc-edit-save-btn {
      height: 32px; padding: 0 16px; border-radius: 9999px; border: none;
      background: #1d9bf0; color: #fff;
      font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700;
      cursor: pointer; transition: transform 0.12s, box-shadow 0.15s, opacity 0.15s;
      display: flex; align-items: center; gap: 5px;
    }
    .tc-edit-save-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(29,155,240,0.4); }
    .tc-edit-save-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

    /* REPLACE this in your style block */
.tc-delete-confirm {
  animation: tc-confirmIn 0.22s cubic-bezier(0.22,1,0.36,1) both;
  position: fixed;          /* ← was: absolute */
  inset: 0;
  z-index: 9999;            /* ← was: 60 */
  border-radius: 0;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  flex-direction: column; gap: 14px;
  padding: 24px;
}
    .tc-delete-confirm-box { text-align: center; max-width: 300px; }
    .tc-delete-icon-wrap {
      width: 48px; height: 48px; border-radius: 50%;
      background: rgba(244,33,46,0.12); border: 1px solid rgba(244,33,46,0.25);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 14px; animation: tc-deleteShake 0.4s 0.1s ease both;
    }
    .tc-delete-title { color: #fff; font-family: 'DM Sans', sans-serif; font-weight: 800; font-size: 17px; margin: 0 0 6px; letter-spacing: -0.2px; }
    .tc-delete-sub { color: rgba(255,255,255,0.45); font-family: 'DM Sans', sans-serif; font-size: 13px; margin: 0 0 18px; line-height: 1.5; }
    .tc-delete-buttons { display: flex; gap: 10px; justify-content: center; }
    .tc-delete-cancel {
      height: 36px; padding: 0 20px; border-radius: 9999px; border: 1px solid rgba(255,255,255,0.2);
      background: transparent; color: rgba(255,255,255,0.8);
      font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: background 0.14s;
    }
    .tc-delete-cancel:hover { background: rgba(255,255,255,0.07); }
    .tc-delete-confirm-btn {
      height: 36px; padding: 0 20px; border-radius: 9999px; border: none;
      background: #f4212e; color: #fff;
      font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700;
      cursor: pointer; transition: transform 0.12s, box-shadow 0.15s, opacity 0.15s;
      display: flex; align-items: center; gap: 6px;
    }
    .tc-delete-confirm-btn:hover:not(:disabled) { transform: scale(1.04); box-shadow: 0 4px 18px rgba(244,33,46,0.4); }
    .tc-delete-confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .tc-content { color: rgba(255,255,255,0.9); font-size: 15px; line-height: 1.65; margin-bottom: 10px; word-break: break-word; }
    .tc-image-wrap { border-radius: 16px; overflow: hidden; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.08); position: relative; }
    .tc-image-wrap::after { content: ''; position: absolute; inset: 0; border-radius: 16px; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06); pointer-events: none; }
    .tc-image-wrap img { width: 100%; max-height: 380px; object-fit: cover; display: block; animation: tc-imageFade 0.45s ease both; transition: transform 0.4s ease, filter 0.3s ease; }
    .tc-image-wrap:hover img { transform: scale(1.02); filter: brightness(0.92); }

    .tc-audio-player { display: flex; align-items: center; gap: 10px; background: rgba(29,155,240,0.06); border: 1px solid rgba(29,155,240,0.15); border-radius: 14px; padding: 10px 14px; margin-bottom: 12px; transition: border-color 0.2s ease; }
    .tc-audio-player:hover { border-color: rgba(29,155,240,0.3); }
    .tc-audio-play-btn { width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0; background: #1d9bf0; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.15s ease, box-shadow 0.15s ease; box-shadow: 0 2px 12px rgba(29,155,240,0.35); }
    .tc-audio-play-btn:hover { transform: scale(1.08); box-shadow: 0 4px 18px rgba(29,155,240,0.5); }
    .tc-audio-waveform { display: flex; align-items: center; gap: 2.5px; height: 28px; flex: 1; }
    .tc-audio-bar { width: 3px; border-radius: 3px; background: rgba(29,155,240,0.5); transform-origin: center bottom; transition: background 0.2s ease; }
    .tc-audio-bar.playing { background: #1d9bf0; }
    .tc-audio-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: rgba(29,155,240,0.8); background: rgba(29,155,240,0.08); border: 1px solid rgba(29,155,240,0.15); border-radius: 9999px; padding: 2px 8px 2px 6px; margin-bottom: 6px; }

    .tc-actions { display: flex; align-items: center; gap: 0; margin-top: 6px; max-width: 440px; }
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
    .tc-ripple { position: absolute; border-radius: 50%; width: 34px; height: 34px; top: 50%; left: 50%; transform: translate(-50%,-50%) scale(0); pointer-events: none; }
    .tc-heart-burst { position: absolute; width: 40px; height: 40px; border-radius: 50%; border: 2px solid #f91880; top: 50%; left: 50%; transform: translate(-50%,-50%) scale(0); pointer-events: none; opacity: 0; }
    .tc-heart-burst.fire { animation: tc-heartBurst 0.4s ease-out forwards; }

    .tc-comment-btn:hover { background: rgba(29,155,240,0.1); color: #1d9bf0; }
    .tc-comment-btn:hover .tc-action-icon { transform: scale(1.18) rotate(-10deg); color: #1d9bf0; }
    .tc-comment-btn .tc-ripple { background: rgba(29,155,240,0.3); }

    .tc-retweet-btn:hover { background: rgba(0,186,124,0.1); color: #00ba7c; }
    .tc-retweet-btn.active { color: #00ba7c; }
    .tc-retweet-btn.active .tc-action-icon { color: #00ba7c; filter: drop-shadow(0 0 4px rgba(0,186,124,0.5)); }
    .tc-retweet-btn .tc-ripple { background: rgba(0,186,124,0.3); }
    .tc-retweet-btn.spinning .tc-action-icon { animation: tc-retweetSpin 0.55s cubic-bezier(0.22,1,0.36,1) both; }

    .tc-like-btn:hover { background: rgba(249,24,128,0.1); color: #f91880; }
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

    /* ── Detail page: skip entry animation so card is visible immediately ── */
    .tc-card.is-detail {
      animation: none !important;
      opacity: 1 !important;
      transform: translateY(0) !important;
    }

    /* ── Fallback: parent-selector approach (belt + suspenders) ── */
    .tdp-card-wrap .tc-card {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
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

const WAVE_PATTERN = [8,14,20,28,18,24,32,16,22,28,12,26,20,32,18,14,24,20,16,10,22,28,18,12];
const fmtTime = (s: number) => `${Math.floor(s/60)}:${Math.round(s%60).toString().padStart(2,"0")}`;


interface TweetCardProps {
  tweet: any;
  onDelete?: (tweetId: string) => void;
  onEdit?: (updatedTweet: any) => void;
  onCardClick?: (tweet: any) => void;   // ← add this
  isDetail?: boolean;
}
export default function TweetCard({ tweet, onDelete, onEdit, onCardClick, isDetail = false }: TweetCardProps) {
  const { user } = useAuth();
  const [tweetstate, settweetstate]             = useState(tweet);
  const [likePopping, setLikePopping]           = useState(false);
  const [heartBurst, setHeartBurst]             = useState(false);
  const [retweetSpinning, setRetweetSpinning]   = useState(false);
  const [bookmarkBouncing, setBookmarkBouncing] = useState(false);
  const [showMenu, setShowMenu]                 = useState(false);
  const [isNew, setIsNew]                       = useState(!isDetail);
  const [editMode, setEditMode]                 = useState(false);
  const [editContent, setEditContent]           = useState(tweet.content);
  const [isSaving, setIsSaving]                 = useState(false);
  const editRef                                 = useRef<HTMLTextAreaElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting]               = useState(false);
  const [deletingAnim, setDeletingAnim]           = useState(false);
  const [audioPlaying, setAudioPlaying]           = useState(false);
  const [audioProgress, setAudioProgress]         = useState(0);
  const [audioCurrent, setAudioCurrent]           = useState(0);
  const audioElemRef                              = useRef<HTMLAudioElement | null>(null);
  const progressRafRef                            = useRef<number | null>(null);
  const cardRef                                   = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [bookmarked, setBookmarked] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    return saved.includes(tweet._id);
  });
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  const isOwner = user?._id?.toString() === tweetstate.author?._id?.toString();
  const MAX = 280;

  useEffect(() => {
    const t = setTimeout(() => setIsNew(false), 1500);
    return () => clearTimeout(t);
  }, []);
  
  useEffect(() => {
  if (!showMenu) return;
  const close = () => setShowMenu(false);
  window.addEventListener("scroll", close, true); // true = capture phase catches all scroll
  return () => window.removeEventListener("scroll", close, true);
}, [showMenu]);

  useEffect(() => {
    if (editMode && editRef.current) {
      editRef.current.style.height = "auto";
      editRef.current.style.height = editRef.current.scrollHeight + "px";
      editRef.current.focus();
    }
  }, [editMode, editContent]);

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
    const onPause = () => { setAudioPlaying(false); progressRafRef.current && cancelAnimationFrame(progressRafRef.current!); };
    const onEnded = () => { setAudioPlaying(false); setAudioProgress(0); setAudioCurrent(0); };
    el.addEventListener("play",  onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("play",  onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      progressRafRef.current && cancelAnimationFrame(progressRafRef.current!);
    };
  }, [tweetstate.audio]);

  useEffect(() => {
    if (tweetstate?._id && tweetstate?.content && tweetstate?.author?.displayName) {
      sendTweetNotification(tweetstate._id, tweetstate.content, tweetstate.author.displayName);
    }
  }, []);

  const likeTweet = async (tweetId: string) => {
    try { const res = await axiosInstance.post(`/like/${tweetId}`); settweetstate(res.data); }
    catch (error: any) { console.error("Like error:", error.response?.data || error.message); }
  };

  const retweetTweet = async (tweetId: string) => {
    try { const res = await axiosInstance.post(`/retweet/${tweetId}`); settweetstate(res.data); }
    catch (error: any) { console.error("Retweet error:", error.response?.data || error.message); }
  };

  const handleDeleteConfirmed = async () => {
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/post/${tweetstate._id}`);
      setDeletingAnim(true);
      setTimeout(() => onDelete?.(tweetstate._id), 380);
    } catch (error: any) {
      console.error("Delete error:", error.response?.data || error.message);
      setIsDeleting(false); setShowDeleteConfirm(false);
    }
  };

  const handleEditSave = async () => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === tweetstate.content || trimmed.length > MAX) return;
    setIsSaving(true);
    try {
      const res = await axiosInstance.patch(`/post/${tweetstate._id}`, { content: trimmed });
      const updated = { ...tweetstate, content: trimmed, edited: true, ...res.data };
      settweetstate(updated); onEdit?.(updated); setEditMode(false);
    } catch (error: any) { console.error("Edit error:", error.response?.data || error.message); }
    finally { setIsSaving(false); }
  };

  const handleEditCancel = () => { setEditContent(tweetstate.content); setEditMode(false); };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000)     return (num / 1_000).toFixed(1) + "K";
    return num?.toString() ?? "0";
  };

  const isLiked   = tweetstate.likedBy?.some((id: any) => id?.toString() === user?._id?.toString());
  const isRetweet = tweetstate.retweetedBy?.some((id: any) => id?.toString() === user?._id?.toString());

  const handleLike = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); fireRipple(e.currentTarget);
    setLikePopping(true);
    if (!isLiked) { setHeartBurst(true); setTimeout(() => setHeartBurst(false), 500); }
    setTimeout(() => setLikePopping(false), 500);
    likeTweet(tweetstate._id);
  };

  const handleRetweet = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); fireRipple(e.currentTarget);
    setRetweetSpinning(true); setTimeout(() => setRetweetSpinning(false), 600);
    retweetTweet(tweetstate._id);
  };

  const handleBookmark = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const saved = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    const newSaved = bookmarked ? saved.filter((id: string) => id !== tweetstate._id) : [...saved, tweetstate._id];
    localStorage.setItem("bookmarks", JSON.stringify(newSaved));
    setBookmarked((v: boolean) => !v);
    setBookmarkBouncing(true); setTimeout(() => setBookmarkBouncing(false), 450);
  };

  const handleAudioToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = audioElemRef.current;
    if (!el) return;
    if (audioPlaying) el.pause(); else el.play().catch(() => {});
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const el = audioElemRef.current;
    if (!el || !el.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    el.currentTime = ratio * el.duration; setAudioProgress(ratio);
  };

  const editRemaining = MAX - editContent.length;
  const editColor = editContent.length > MAX ? "#ef4444" : editContent.length > MAX * 0.8 ? "#eab308" : "rgba(255,255,255,0.3)";

  // Build className — add "is-detail" when rendered inside TweetDetailPage
  const cardClass = [
    "tc-card",
    isNew      ? "new-tweet"  : "",
    editMode   ? "is-editing" : "",
    deletingAnim ? "is-deleting" : "",
    showMenu   ? "menu-open"  : "",
    isDetail   ? "is-detail"  : "",   // ← disables tc-slideIn animation
  ].filter(Boolean).join(" ");

  return (
    <div
      ref={cardRef}
      className={cardClass}
      onClick={(e) => {
  setShowMenu(false);
}}
    >
      {/* Delete confirmation overlay */}
     {showDeleteConfirm && typeof document !== "undefined" && createPortal(
  <div
    onClick={e => { e.stopPropagation(); if (!isDeleting) setShowDeleteConfirm(false); }}
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 99999,
      background: "rgba(0,0,0,0.75)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      animation: "tc-confirmIn 0.22s cubic-bezier(0.22,1,0.36,1) both",
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: "#16181c",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        padding: "28px 32px",
        textAlign: "center",
        maxWidth: 320,
        width: "90%",
        boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
      }}
    >
      <div className="tc-delete-icon-wrap">
        <AlertTriangle size={22} color="#f4212e" />
      </div>
      <h3 className="tc-delete-title">Delete this post?</h3>
      <p className="tc-delete-sub">
        This can't be undone and will be removed for everyone.
      </p>
      <div className="tc-delete-buttons">
        <button
          className="tc-delete-cancel"
          onClick={() => setShowDeleteConfirm(false)}
          disabled={isDeleting}
        >
          Cancel
        </button>
        <button
          className="tc-delete-confirm-btn"
          onClick={handleDeleteConfirmed}
          disabled={isDeleting}
        >
          <Trash2 size={14} />
          {isDeleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  </div>,
  document.body   // ← renders outside ALL parent stacking contexts
)}

      {/* More menu */}
      {showMenu && typeof document !== "undefined" && createPortal(
  <>
    {/* Invisible backdrop to close menu on outside click */}
    <div
      style={{ position: "fixed", inset: 0, zIndex: 99998 }}
      onClick={e => { e.stopPropagation(); setShowMenu(false); }}
    />
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: "fixed",
        top: menuPos.top,
        right: menuPos.right,
        zIndex: 99999,
        background: "#16181c",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 14,
        padding: 6,
        boxShadow: "0 12px 40px rgba(0,0,0,0.8)",
        minWidth: 190,
        animation: "tc-moreMenuPop 0.22s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      {isOwner ? (
        <>
          <button className="tc-more-menu-item" onClick={e => {
            e.stopPropagation();
            setShowMenu(false);
            setEditContent(tweetstate.content);
            setEditMode(true);
          }}>
            <Pencil size={14} style={{ opacity: 0.7 }} /> Edit post
          </button>
          <div className="tc-more-menu-sep" />
          <button className="tc-more-menu-item tc-danger" onClick={e => {
            e.stopPropagation();
            setShowMenu(false);
            setShowDeleteConfirm(true);
          }}>
            <Trash2 size={14} /> Delete post
          </button>
          <div className="tc-more-menu-sep" />
          {["Copy link", "Embed post"].map(item => (
            <button key={item} className="tc-more-menu-item"
              onClick={e => { e.stopPropagation(); setShowMenu(false); }}>
              {item}
            </button>
          ))}
        </>
      ) : (
        ["Copy link", "Embed post", "Report post"].map(item => (
          <button key={item} className="tc-more-menu-item"
            onClick={e => { e.stopPropagation(); setShowMenu(false); }}>
            {item}
          </button>
        ))
      )}
    </div>
  </>,
  document.body
)}

      <div style={{ display: "flex", gap: 12 }}>

        {/* Avatar — opens profile modal, stops propagation so card onClick doesn't fire */}
        <div className="tc-avatar-wrap" style={{ width: 44, height: 44, cursor: "pointer" }}
          onClick={e => { e.stopPropagation(); setViewingUserId(tweetstate.author?._id); }}>
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

        {/* Body — clicking anywhere in here navigates to detail.
            Avatar, username, buttons all stopPropagation to override this. */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            cursor: onCardClick ? "pointer" : "default",
          }}
          onClick={e => {
            e.stopPropagation();
            setShowMenu(false);
            if (!editMode && !showDeleteConfirm) onCardClick?.(tweetstate);
          }}
        >
          <div className="tc-header">
            {/* Display name — opens profile, stops propagation */}
            <span className="tc-display-name" style={{ cursor: "pointer" }}
              onClick={e => { e.stopPropagation(); setViewingUserId(tweetstate.author?._id); }}>
              {tweetstate.author?.displayName}
            </span>

            {tweetstate.author?.verified && (
              <span className="tc-verified">
                <svg width="9" height="9" viewBox="0 0 20 20" fill="white">
                  <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
              </span>
            )}

            <span className="tc-username">@{tweetstate.author?.username?.slice(0, 8)}...</span>
            <span className="tc-dot">·</span>
            <span className="tc-timestamp">{tweetstate.timestamp && timeAgo(tweetstate.timestamp)}</span>
            {tweetstate.edited && <span className="tc-edited-badge"><Pencil size={9} /> edited</span>}

            <button
            ref={moreButtonRef}
            className="tc-more-btn"
            onClick={e => {
              e.stopPropagation();
              const rect = moreButtonRef.current?.getBoundingClientRect();
              if (rect) {
                setMenuPos({
                  top: rect.bottom + 6,
                  right: window.innerWidth - rect.right,
                });
              }
              setShowMenu(v => !v);
            }}
          >
            <MoreHorizontal size={17} />
          </button>
          </div>

          {/* Content / Edit */}
          {editMode ? (
            <div className="tc-edit-area" onClick={e => e.stopPropagation()}>
              <textarea ref={editRef} className="tc-edit-textarea" value={editContent}
                onChange={e => setEditContent(e.target.value)} rows={3} disabled={isSaving} />
              <div className="tc-edit-footer">
                <span className="tc-edit-count" style={{ color: editColor }}>{editRemaining < 40 ? editRemaining : ""}</span>
                <div className="tc-edit-actions">
                  <button className="tc-edit-cancel-btn" onClick={handleEditCancel} disabled={isSaving}>
                    <XIcon size={13} strokeWidth={2.5} /> Cancel
                  </button>
                  <button className="tc-edit-save-btn" onClick={handleEditSave}
                    disabled={isSaving || !editContent.trim() || editContent.trim() === tweetstate.content || editContent.length > MAX}>
                    <Check size={13} strokeWidth={2.5} /> {isSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="tc-content">
              {formatTweetContent(tweetstate.content)}
            </div>
          )}

          {/* Image */}
          {tweetstate.image && (
            <div className="tc-image-wrap">
              <img src={tweetstate.image} alt="Tweet media" loading="lazy" />
            </div>
          )}

          {/* Audio — stops propagation so card onClick doesn't fire */}
          {tweetstate.audio && (
            <div onClick={e => e.stopPropagation()}>
              <audio ref={audioElemRef} src={tweetstate.audio} preload="metadata" style={{ display: "none" }} />
              <div className="tc-audio-badge"><Mic size={10} /> Audio tweet</div>
              <div className="tc-audio-player">
                <button className="tc-audio-play-btn" onClick={handleAudioToggle}>
                  {audioPlaying ? <Pause size={15} color="#fff" /> : <Play size={15} color="#fff" style={{ marginLeft: 2 }} />}
                </button>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div className="tc-audio-waveform" onClick={handleSeek} style={{ cursor: "pointer" }}>
                    {WAVE_PATTERN.map((h, i) => {
                      const filled = i / WAVE_PATTERN.length < audioProgress;
                      return (
                        <div key={i} className={`tc-audio-bar${audioPlaying ? " playing" : ""}`}
                          style={{ height: h, background: filled ? "#1d9bf0" : "rgba(255,255,255,0.15)",
                            animation: audioPlaying ? `tc-wave-bar ${0.5 + (i%5)*0.12}s ease-in-out infinite alternate` : "none",
                            animationDelay: `${i*0.04}s` }} />
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "rgba(255,255,255,.4)", fontSize: 11, fontVariantNumeric: "tabular-nums" }}>{fmtTime(audioCurrent)}</span>
                    {tweetstate.audioDuration && <span style={{ color: "rgba(255,255,255,.25)", fontSize: 11, fontVariantNumeric: "tabular-nums" }}>{fmtTime(tweetstate.audioDuration)}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons — all stop propagation */}
          <div className="tc-actions">
            <button className="tc-action-btn tc-comment-btn" onClick={e => { e.stopPropagation(); fireRipple(e.currentTarget); }}>
              <div className="tc-ripple" />
              <MessageCircle size={17} className="tc-action-icon" />
              <span className="tc-action-count">{formatNumber(tweetstate.comments ?? 0)}</span>
            </button>
            <button className={`tc-action-btn tc-retweet-btn${isRetweet?" active":""}${retweetSpinning?" spinning":""}`} onClick={handleRetweet}>
              <div className="tc-ripple" />
              <Repeat2 size={17} className="tc-action-icon" />
              <span className="tc-action-count">{formatNumber(tweetstate.retweets ?? 0)}</span>
            </button>
            <button className={`tc-action-btn tc-like-btn${isLiked?" active":""}${likePopping?" popping":""}`} onClick={handleLike}>
              <div className="tc-ripple" />
              <div className={`tc-heart-burst${heartBurst?" fire":""}`} />
              <Heart size={17} className="tc-action-icon" style={{ fill: isLiked ? "#f91880" : "none" }} />
              <span className="tc-action-count">{formatNumber(tweetstate.likes ?? 0)}</span>
            </button>
            <button className="tc-action-btn tc-share-btn" onClick={e => { e.stopPropagation(); fireRipple(e.currentTarget); }}>
              <div className="tc-ripple" />
              <Share size={17} className="tc-action-icon" />
            </button>
            <button className={`tc-action-btn tc-bookmark-btn${bookmarked?" active":""}${bookmarkBouncing?" bouncing":""}`} onClick={handleBookmark}>
              <Bookmark size={16} className="tc-action-icon" style={{ fill: bookmarked ? "#1d9bf0" : "none" }} />
            </button>
          </div>
        </div>
      </div>

      <UserProfileModal userId={viewingUserId} onClose={() => setViewingUserId(null)} />
    </div>
  );
}