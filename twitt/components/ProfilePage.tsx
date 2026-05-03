"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Calendar, MapPin,
  Link as LinkIcon, MoreHorizontal, Camera,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import TweetCard from "./TweetCard";
import Editprofile from "./Editprofile";
import axiosInstance from "@/lib/axiosInstance";
import NotificationToggle from "./NotificationToggle";
// import loginHistory from "@/lib/loginHistory";

const STYLE_ID = "profile-page-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
    .pp-root * { box-sizing: border-box; }
    @keyframes pp-fadeUp {
      from { opacity:0; transform:translateY(16px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes pp-shimmer {
      0%   { background-position:-700px 0; }
      100% { background-position: 700px 0; }
    }
    @keyframes pp-scaleIn {
      from { opacity:0; transform:scale(0.94); }
      to   { opacity:1; transform:scale(1); }
    }
    @keyframes pp-bannerReveal {
      from { opacity:0; transform:scaleY(0.93); transform-origin:top; }
      to   { opacity:1; transform:scaleY(1); }
    }
    .pp-banner      { animation: pp-bannerReveal 0.45s cubic-bezier(0.22,1,0.36,1) both; }
    .pp-avatar-ring { animation: pp-scaleIn 0.4s 0.15s cubic-bezier(0.22,1,0.36,1) both; }
    .pp-info        { animation: pp-fadeUp 0.4s 0.22s cubic-bezier(0.22,1,0.36,1) both; }
    .pp-meta        { animation: pp-fadeUp 0.4s 0.3s  cubic-bezier(0.22,1,0.36,1) both; }
    .pp-tabs-wrap   { animation: pp-fadeUp 0.4s 0.36s cubic-bezier(0.22,1,0.36,1) both; }
    .pp-tweet-item  { animation: pp-fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both; }
    .pp-shimmer {
      background: linear-gradient(90deg,
        rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%
      );
      background-size: 700px 100%;
      animation: pp-shimmer 1.6s infinite linear;
      border-radius: 6px;
    }
    .pp-tab[data-state="active"] { color: #fff !important; font-weight: 700; }
    .pp-tab[data-state="active"]::after {
      content:''; position:absolute; bottom:0; left:50%;
      transform:translateX(-50%);
      width:44px; height:3px;
      background:#1d9bf0; border-radius:3px 3px 0 0;
    }
    .pp-tab { position:relative; transition: color 0.18s ease; }
    .pp-cam-overlay { opacity:0; transition:opacity 0.2s ease; }
    .pp-cam-trigger:hover .pp-cam-overlay { opacity:1; }
    .pp-edit-btn { transition: background 0.18s ease, transform 0.15s ease; }
    .pp-edit-btn:hover { background: rgba(255,255,255,0.1) !important; transform: scale(1.02); }
    .pp-edit-btn:active { transform: scale(0.97); }
    .pp-meta-link { transition: color 0.15s ease; }
    .pp-meta-link:hover { color: #1d9bf0 !important; }
    .pp-tweet-row {
      transition: background 0.16s ease;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .pp-tweet-row:hover { background: rgba(255,255,255,0.018); }
    @media (max-width: 600px) {
      .pp-banner-h  { height: 130px !important; }
      .pp-avatar-sz { width: 82px !important; height: 82px !important; }
      .pp-avatar-offset { bottom: -41px !important; }
      .pp-avatar-spacer { margin-top: 52px !important; }
      .pp-displayname { font-size: 20px !important; }
      .pp-meta-row { flex-wrap: wrap; gap: 8px !important; }
      .pp-tab-label { font-size: 12px !important; }
      .pp-header-name { font-size: 16px !important; }
    }
  `;
  document.head.appendChild(s);
}

const SkeletonTweet = ({ delay = 0 }: { delay?: number }) => (
  <div style={{
    display: "flex", gap: 12, padding: "16px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    animation: `pp-fadeUp 0.38s ${delay}s cubic-bezier(0.22,1,0.36,1) both`,
  }}>
    <div className="pp-shimmer" style={{ width: 42, height: 42, borderRadius: "50%", flexShrink: 0 }} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <div className="pp-shimmer" style={{ width: 100, height: 12 }} />
        <div className="pp-shimmer" style={{ width: 65, height: 12, opacity: 0.5 }} />
      </div>
      <div className="pp-shimmer" style={{ width: "90%", height: 12 }} />
      <div className="pp-shimmer" style={{ width: "72%", height: 12 }} />
    </div>
  </div>
);

const EmptyState = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div style={{ padding: "56px 24px", textAlign: "center", animation: "pp-fadeUp 0.4s ease both" }}>
    <div style={{
      width: 52, height: 52, borderRadius: "50%",
      background: "rgba(29,155,240,0.08)",
      border: "1px solid rgba(29,155,240,0.18)",
      display: "flex", alignItems: "center", justifyContent: "center",
      margin: "0 auto 16px", fontSize: 22,
    }}>✦</div>
    <h3 style={{ color: "#fff", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 18, margin: "0 0 6px" }}>{title}</h3>
    <p style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans',sans-serif", fontSize: 14, margin: 0 }}>{subtitle}</p>
  </div>
);

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("posts");
  const [showEditModal, setShowEditModal] = useState(false);
  const [bannerSrc, setBannerSrc] = useState<string | null>(null);
  const [tweets, setTweets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const fetchTweets = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/post");
      setTweets(res.data.tweets ?? []); // ← FIX: was res.data (an object, not array)
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets();
  }, []);

  if (!user) return null;

  // ← FIX: use .toString() — ObjectId objects are never === with plain string comparison
  const userTweets = tweets.filter(
    (tweet: any) => tweet.author?._id?.toString() === user._id?.toString()
  );

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBannerSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

<NotificationToggle />
  const TABS = [
    { value: "posts",      label: "Posts" },
    { value: "replies",    label: "Replies" },
    { value: "highlights", label: "Highlights" },
    { value: "articles",   label: "Articles" },
    { value: "media",      label: "Media" },
  ];

  return (
     <div className="pp-root" style={{ minHeight: "100vh", background: "#000", fontFamily: "'DM Sans',sans-serif", paddingBottom: 72 }}>

      {/* Sticky Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", gap: 20 }}>
          <button
            style={{
              width: 36, height: 36, borderRadius: "50%", border: "none",
              background: "transparent", color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.18s ease",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="pp-header-name" style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
              {user.displayName}
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
              {userTweets.length} post{userTweets.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Banner */}
      <input ref={bannerInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleBannerChange} />
      <div style={{ position: "relative" }}>
        <div
          className="pp-banner pp-banner-h pp-cam-trigger"
          style={{
            height: 200,
            background: bannerSrc
              ? `url(${bannerSrc}) center/cover no-repeat`
              : "linear-gradient(135deg, #0f1923 0%, #1a2a3a 40%, #0d1b2a 70%, #162032 100%)",
            position: "relative", overflow: "hidden", cursor: "pointer",
          }}
          onClick={() => bannerInputRef.current?.click()}
        >
          {!bannerSrc && (
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "radial-gradient(circle at 30% 50%, rgba(29,155,240,0.12) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(120,80,255,0.08) 0%, transparent 50%)",
            }} />
          )}
          <div className="pp-cam-overlay" style={{
            position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "#fff" }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(0,0,0,0.6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.25)",
              }}>
                <Camera size={20} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.3px" }}>Change banner</span>
            </div>
          </div>
        </div>

        {/* Avatar */}
        <div className="pp-avatar-ring pp-avatar-offset" style={{ position: "absolute", bottom: -50, left: 16, zIndex: 10 }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <div style={{
              position: "absolute", inset: -3, borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(29,155,240,0.6), rgba(120,80,255,0.4))",
              zIndex: -1,
            }} />
            <Avatar className="pp-avatar-sz" style={{ width: 100, height: 100, border: "4px solid #000", borderRadius: "50%", display: "block" }}>
              <AvatarImage src={user.avatar} alt={user.displayName} style={{ objectFit: "cover" }} />
              <AvatarFallback style={{ fontSize: 32, fontWeight: 700, background: "linear-gradient(135deg,#1d9bf0,#7950ff)", color: "#fff" }}>
                {user.displayName?.[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Edit button */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 16px" }}>
          <button
            className="pp-edit-btn"
            style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.28)",
              borderRadius: 9999, color: "#fff", fontFamily: "'DM Sans',sans-serif",
              fontWeight: 700, fontSize: 14, padding: "7px 18px", cursor: "pointer",
            }}
            onClick={() => setShowEditModal(true)}
          >
            Edit profile
          </button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="pp-avatar-spacer" style={{ marginTop: 62 }}>
        <div className="pp-info" style={{ padding: "0 16px 2px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className="pp-displayname" style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>
              {user.displayName}
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 14, color: "rgba(255,255,255,0.42)", fontWeight: 500 }}>
              @{user.username}
            </p>
          </div>
          <button
            style={{
              width: 34, height: 34, borderRadius: "50%", border: "none",
              background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.18s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        {user.bio && (
          <p style={{ margin: "10px 16px 0", color: "rgba(255,255,255,0.88)", fontSize: 14, lineHeight: 1.55, animation: "pp-fadeUp 0.4s 0.26s both" }}>
            {user.bio}
          </p>
        )}

        <div className="pp-meta pp-meta-row" style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 16px 14px", flexWrap: "wrap" }}>
          {[
            { icon: <MapPin size={14} />,    text: user.location || "Earth",       color: "rgba(255,255,255,0.45)" },
            { icon: <LinkIcon size={14} />,  text: user.website || "example.com",  color: "#1d9bf0", cls: "pp-meta-link" },
            { icon: <Calendar size={14} />,  text: `Joined ${user.joinedDate ? new Date(user.joinedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : ""}`, color: "rgba(255,255,255,0.45)" },
          ].map((m, i) => (
            <div key={i} className={m.cls} style={{ display: "flex", alignItems: "center", gap: 5, color: m.color, fontSize: 13 }}>
              <span style={{ opacity: 0.7 }}>{m.icon}</span>
              <span>{m.text}</span>
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0.07) 70%, transparent)" }} />
      </div>

      {/* Tabs */}
      <div className="pp-tabs-wrap">
        <Tabs value={activeTab} onValueChange={setActiveTab} style={{ width: "100%" }}>
          <TabsList style={{
            display: "grid", gridTemplateColumns: `repeat(${TABS.length}, 1fr)`,
            background: "transparent", borderRadius: 0, height: "auto", padding: 0,
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}>
            {TABS.map((t) => (
              <TabsTrigger
                key={t.value} value={t.value}
                className="pp-tab pp-tab-label"
                style={{
                  background: "transparent", border: "none", borderRadius: 0,
                  color: activeTab === t.value ? "#fff" : "rgba(255,255,255,0.4)",
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: 13, fontWeight: activeTab === t.value ? 700 : 500,
                  padding: "14px 4px", cursor: "pointer",
                  transition: "color 0.18s, background 0.18s",
                }}
                onMouseEnter={e => { if (t.value !== activeTab) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="posts" style={{ margin: 0 }}>
            {loading ? (
              [0, 0.06, 0.12, 0.18].map((d, i) => <SkeletonTweet key={i} delay={d} />)
            ) : userTweets.length === 0 ? (
              <EmptyState title="No posts yet" subtitle="When you post, it will show up here." />
            ) : (
              userTweets.map((tweet: any, idx: number) => (
                <div key={tweet._id} className="pp-tweet-item pp-tweet-row" style={{ animationDelay: `${Math.min(idx * 0.04, 0.3)}s` }}>
                  <TweetCard tweet={tweet} />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="replies" style={{ margin: 0 }}>
            <EmptyState title="No replies yet" subtitle="When you reply to a post, it will show up here." />
          </TabsContent>
          <TabsContent value="highlights" style={{ margin: 0 }}>
            <EmptyState title="Nothing highlighted" subtitle="Highlight posts you want pinned to your profile." />
          </TabsContent>
          <TabsContent value="articles" style={{ margin: 0 }}>
            <EmptyState title="No articles yet" subtitle="When you write articles, they will show up here." />
          </TabsContent>
          <TabsContent value="media" style={{ margin: 0 }}>
            <EmptyState title="No media yet" subtitle="Photos and videos you post will appear here." />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Modal */}
      <Editprofile
        isopen={showEditModal}
        onclose={() => { setShowEditModal(false); fetchTweets(); }}
      />
    </div>
  );
}