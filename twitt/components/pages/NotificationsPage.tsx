"use client";
import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import NotificationToggle from "../NotificationToggle";
import axiosInstance from "@/lib/axiosInstance";
import { TRIGGER_KEYWORDS, sendTweetNotification } from "@/lib/notificationUtils";

interface NotificationItem {
  id: string;
  type: "keyword";
  keyword: string;
  author: string;
  content: string;
  avatar: string;
  time: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load existing saved notifications from localStorage
    const saved = localStorage.getItem("twiller-notification-history");
    if (saved) {
      try { setNotifications(JSON.parse(saved)); } catch {}
    }

    // Fetch tweets and find any matching keywords — build notification list
    axiosInstance.get("/post").then(res => {
      const tweets = res.data.tweets ?? [];
      const matched: NotificationItem[] = [];

      tweets.forEach((tweet: any) => {
        const content = tweet.content || "";
        const lower   = content.toLowerCase();
        const keyword = TRIGGER_KEYWORDS.find(k => lower.includes(k));
        if (keyword) {
          matched.push({
            id:      tweet._id,
            type:    "keyword",
            keyword,
            author:  tweet.author?.displayName || "Someone",
            content,
            avatar:  tweet.author?.avatar || "",
            time:    tweet.timestamp,
          });
        }
      });

      // Sort newest first, keep last 50
      matched.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      const trimmed = matched.slice(0, 50);
      setNotifications(trimmed);
      localStorage.setItem("twiller-notification-history", JSON.stringify(trimmed));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const timeAgo = (date: string) => {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60)    return "just now";
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Sticky header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(18px)",
        padding: "16px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0 }}>Notifications</h1>
      </div>

      {/* Notification settings toggle */}
      <NotificationToggle />

      {/* Section header */}
      <div style={{
        padding: "14px 16px 10px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
          Keyword alerts
        </p>
        {notifications.length > 0 && (
          <button
            onClick={() => {
              setNotifications([]);
              localStorage.removeItem("twiller-notification-history");
            }}
            style={{
              background: "none", border: "none", color: "rgba(255,255,255,0.3)",
              fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
              transition: "color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Notification list */}
      {loading ? (
        // Skeleton
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{
            display: "flex", gap: 12, padding: "14px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.06)", flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ width: "60%", height: 12, background: "rgba(255,255,255,0.06)", borderRadius: 6 }} />
              <div style={{ width: "85%", height: 12, background: "rgba(255,255,255,0.04)", borderRadius: 6 }} />
            </div>
          </div>
        ))
      ) : notifications.length === 0 ? (
        // Empty state
        <div style={{ padding: "64px 24px", textAlign: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "rgba(29,155,240,0.1)",
            border: "1px solid rgba(29,155,240,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <Bell size={24} color="#1d9bf0" />
          </div>
          <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 22, margin: "0 0 8px" }}>
            Nothing to see here — yet
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: "0 0 16px" }}>
            Tweets mentioning <strong style={{ color: "#1d9bf0" }}>cricket</strong> or <strong style={{ color: "#1d9bf0" }}>science</strong> will appear here.
          </p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0 }}>
            Enable the toggle above to also get browser popup notifications.
          </p>
        </div>
      ) : (
        // Notification rows
        notifications.map((notif, i) => (
          <div
            key={notif.id}
            style={{
              display: "flex", gap: 12, padding: "14px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              transition: "background 0.15s",
              animation: `fadeIn 0.3s ${i * 0.04}s ease both`,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            {/* Avatar */}
            <div style={{ flexShrink: 0 }}>
              {notif.avatar ? (
                <img src={notif.avatar} alt={notif.author}
                  style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  background: "linear-gradient(135deg,#1d9bf0,#7950ff)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 16,
                }}>
                  {notif.author[0]}
                </div>
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                {/* Keyword badge */}
                <span style={{
                  background: "rgba(29,155,240,0.12)", border: "1px solid rgba(29,155,240,0.25)",
                  color: "#1d9bf0", fontSize: 11, fontWeight: 700,
                  padding: "2px 8px", borderRadius: 9999,
                }}>
                  #{notif.keyword}
                </span>
                <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{notif.author}</span>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
                  {timeAgo(notif.time)}
                </span>
              </div>
              {/* Highlight keyword in content */}
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, margin: 0, lineHeight: 1.5, wordBreak: "break-word" }}>
                {notif.content.split(new RegExp(`(${notif.keyword})`, "gi")).map((part, j) =>
                  part.toLowerCase() === notif.keyword.toLowerCase()
                    ? <mark key={j} style={{ background: "rgba(29,155,240,0.25)", color: "#1d9bf0", borderRadius: 3, padding: "0 2px" }}>{part}</mark>
                    : part
                )}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}