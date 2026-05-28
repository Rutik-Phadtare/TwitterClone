"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MapPin, Calendar, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import axiosInstance from "@/lib/axiosInstance";
import TweetCard from "./TweetCard";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";

const STYLES = `
  @keyframes up-fadeIn  { from { opacity:0 } to { opacity:1 } }
  @keyframes up-slideUp {
    from { opacity:0; transform:translateY(24px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .up-overlay {
    position:fixed; inset:0; z-index:99999;
    background:rgba(0,0,0,0.8); backdrop-filter:blur(8px);
    display:flex; align-items:flex-start; justify-content:center;
    padding:0; overflow-y:auto;
    animation:up-fadeIn 0.2s ease both;
  }
  .up-card {
    width:100%; max-width:600px; min-height:100vh;
    background:#000; position:relative;
    animation:up-slideUp 0.3s cubic-bezier(0.22,1,0.36,1) both;
    font-family:'DM Sans',sans-serif;
  }
  .up-follow-btn {
    padding:8px 20px; border-radius:9999px;
    font-family:'DM Sans',sans-serif; font-size:14px; font-weight:700;
    cursor:pointer; transition:all 0.15s ease;
    border:1.5px solid;
  }
  .up-follow-btn.not-following {
    background:#fff; color:#000; border-color:#fff;
  }
  .up-follow-btn.not-following:hover {
    background:rgba(255,255,255,0.85);
  }
  .up-follow-btn.following {
    background:transparent; color:#fff;
    border-color:rgba(255,255,255,0.3);
  }
  .up-follow-btn.following:hover {
    background:rgba(239,68,68,0.1);
    border-color:#ef4444; color:#ef4444;
  }
`;

interface Props {
  userId:  string | null;
  onClose: () => void;
}

export default function UserProfileModal({ userId, onClose }: Props) {
  const { user: me } = useAuth();
  const { lang }     = useLanguage();

  // ── Portal mount guard (avoid SSR mismatch) ───────────────────────────────
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [profile,   setProfile]   = useState<any>(null);
  const [tweets,    setTweets]    = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [following, setFollowing] = useState(false);
  const [toggling,  setToggling]  = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setProfile(null);
    setTweets([]);
    Promise.all([
      axiosInstance.get(`/user/${userId}`),
      axiosInstance.get(`/user/${userId}/tweets`),
    ])
      .then(([profileRes, tweetsRes]) => {
        setProfile(profileRes.data);
        setFollowing(profileRes.data.isFollowing);
        setTweets(tweetsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  // Lock body scroll while open
  useEffect(() => {
    if (!userId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [userId]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleFollow = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      if (following) {
        await axiosInstance.delete(`/follow/${userId}`);
        setFollowing(false);
        setProfile((p: any) => ({
          ...p,
          followers: (p.followers || []).filter((id: any) => id !== me?._id),
        }));
      } else {
        await axiosInstance.post(`/follow/${userId}`);
        setFollowing(true);
        setProfile((p: any) => ({
          ...p,
          followers: [...(p.followers || []), me?._id],
        }));
      }
    } catch (err) {
      console.error("Follow error:", err);
    } finally {
      setToggling(false);
    }
  };

  // Don't render if no userId, or portal not mounted yet
  if (!userId || !mounted) return null;

  const isOwnProfile = me?._id?.toString() === userId;

  const modalContent = (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/*
        ── KEY FIX ──────────────────────────────────────────────────────────
        Rendered via createPortal into document.body — completely outside the
        TweetCard DOM tree. This escapes the card's CSS animation stacking
        context (tc-slideIn uses transform, which makes the card a containing
        block for position:fixed children). The portal bypasses all of that.
        ─────────────────────────────────────────────────────────────────────
      */}
      <div className="up-overlay" onClick={onClose}>
        <div className="up-card" onClick={e => e.stopPropagation()}>

          {/* ── Sticky header ── */}
          <div style={{
            position: "sticky", top: 0, zIndex: 10,
            background: "rgba(0,0,0,0.85)", backdropFilter: "blur(18px)",
            padding: "12px 16px", display: "flex", alignItems: "center", gap: 16,
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}>
            <button
              onClick={onClose}
              style={{
                background: "none", border: "none", color: "#fff",
                cursor: "pointer", padding: 6, borderRadius: "50%",
                display: "flex", alignItems: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
              aria-label="Close profile"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 style={{ color: "#fff", margin: 0, fontSize: 17, fontWeight: 700 }}>
                {profile?.displayName || "Profile"}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: 12 }}>
                {tweets.length} posts
              </p>
            </div>
          </div>

          {/* ── Loading state ── */}
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
              {t(lang, "loading")}
            </div>

          ) : profile ? (
            <>
              {/* Banner */}
              <div style={{
                height: 140,
                background: profile.banner
                  ? `url(${profile.banner}) center/cover`
                  : "linear-gradient(135deg,#0f1923,#1a2a3a,#0d1b2a)",
              }} />

              {/* Avatar + Follow button */}
              <div style={{
                padding: "0 16px 12px",
                display: "flex", alignItems: "flex-end", justifyContent: "space-between",
                marginTop: -40,
              }}>
                <div style={{ border: "4px solid #000", borderRadius: "50%", background: "#000" }}>
                  <Avatar style={{ width: 80, height: 80 }}>
                    <AvatarImage src={profile.avatar} style={{ objectFit: "cover" }} />
                    <AvatarFallback style={{
                      background: "linear-gradient(135deg,#1d9bf0,#7950ff)",
                      color: "#fff", fontWeight: 700, fontSize: 28,
                    }}>
                      {profile.displayName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {!isOwnProfile && (
                  <button
                    className={`up-follow-btn ${following ? "following" : "not-following"}`}
                    onClick={handleFollow}
                    disabled={toggling}
                  >
                    {toggling ? "..." : following ? t(lang, "unfollowUser") : t(lang, "followUser")}
                  </button>
                )}
              </div>

              {/* Profile info */}
              <div style={{ padding: "0 16px 16px" }}>
                <h2 style={{ color: "#fff", margin: "0 0 2px", fontSize: 20, fontWeight: 800 }}>
                  {profile.displayName}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.4)", margin: "0 0 10px", fontSize: 14 }}>
                  @{profile.username?.slice(0,8)}...
                </p>

                {profile.bio && (
                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.55, margin: "0 0 12px" }}>
                    {profile.bio}
                  </p>
                )}

                {/* Meta row */}
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
                  {profile.location && (
                    <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={13} /> {profile.location}
                    </span>
                  )}
                  {profile.joinedDate && (
                    <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                      <Calendar size={13} /> {t(lang, "joinedDate")} {new Date(profile.joinedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </span>
                  )}
                </div>

                {/* Followers / Following counts */}
                <div style={{ display: "flex", gap: 20 }}>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
                    <strong style={{ color: "#fff" }}>{profile.following?.length || 0}</strong>{" "}
                    {t(lang, "followingCount")}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
                    <strong style={{ color: "#fff" }}>{profile.followers?.length || 0}</strong>{" "}
                    {t(lang, "followers")}
                  </span>
                </div>
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />

              {/* User's tweets */}
              {tweets.length === 0 ? (
                <div style={{ padding: "40px 24px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                  No posts yet.
                </div>
              ) : (
                tweets.map(tweet => (
                  <TweetCard key={tweet._id} tweet={tweet} />
                ))
              )}
            </>
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>
              User not found.
            </div>
          )}
        </div>
      </div>
    </>
  );

  // ── Render into document.body via portal ──────────────────────────────────
  return createPortal(modalContent, document.body);
}