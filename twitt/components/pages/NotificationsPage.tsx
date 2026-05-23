"use client";
import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import NotificationToggle from "../NotificationToggle";
import axiosInstance from "@/lib/axiosInstance";
import {
  getSelectedCategories,
  ALL_CATEGORIES,
  setNotificationCount,
} from "@/lib/notificationUtils";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";

interface NotificationItem {
  id:      string;
  type:    "keyword";
  keyword: string;
  author:  string;
  content: string;
  avatar:  string;
  time:    string;
}

// ── Persistent clear: store timestamp of last "Clear all" ─────────────────────
const CLEARED_AT_KEY = "twiller-notifications-cleared-at";

const getClearedAt = (): number => {
  try { return parseInt(localStorage.getItem(CLEARED_AT_KEY) || "0", 10); }
  catch { return 0; }
};

const saveClearedAt = () => {
  localStorage.setItem(CLEARED_AT_KEY, Date.now().toString());
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading,       setLoading]        = useState(true);
  const [selected,      setSelected]       = useState<string[]>([]);

  const fetchNotifications = () => {
    setLoading(true);
    const cats      = getSelectedCategories();
    const clearedAt = getClearedAt();
    setSelected(cats);

    axiosInstance.get("/post").then(res => {
      const tweets  = res.data.tweets ?? [];
      const matched: NotificationItem[] = [];

      tweets.forEach((tweet: any) => {
        const content   = tweet.content || "";
        const lower     = content.toLowerCase();
        const tweetTime = new Date(tweet.timestamp).getTime();

        // Skip anything before last "Clear all"
        if (tweetTime <= clearedAt) return;

        // ✅ Only match #hashtag format e.g. #news #cricket
        const cat = ALL_CATEGORIES.find(
          c => cats.includes(c.id) && lower.includes(`#${c.id}`)
        );
        if (!cat) return;

        matched.push({
          id:      tweet._id,
          type:    "keyword",
          keyword: cat.id,
          author:  tweet.author?.displayName || "Someone",
          content,
          avatar:  tweet.author?.avatar || "",
          time:    tweet.timestamp,
        });
      });

      matched.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      const trimmed = matched.slice(0, 50);
      setNotifications(trimmed);

      // Sync badge count to sidebar
      setNotificationCount(0);

    }).catch(console.error).finally(() => setLoading(false));
  };

  const { lang } = useLanguage();

  useEffect(() => {
  setNotificationCount(0); // ← clear badge immediately when page opens
  fetchNotifications();
}, []);

  useEffect(() => {
    const handler = () => fetchNotifications();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const handleClearAll = () => {
    saveClearedAt();          // persist — survives page re-visit
    setNotifications([]);     // clear UI
    setNotificationCount(0);  // clear sidebar badge
  };

  const timeAgo = (date: string) => {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60)    return "just now";
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  const getCatMeta = (id: string) =>
    ALL_CATEGORIES.find(c => c.id === id) || { emoji: "🔔", label: id };

  return (
    <div style={{ minHeight: "100vh", background: "#000", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Sticky header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(18px)",
        padding: "16px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0 }}>{t(lang, "notificationsTitle")}</h1>
      </div>

      {/* Compact notification settings dropdown */}
      <NotificationToggle />

      {/* Section header */}
      <div style={{
        padding: "12px 16px 10px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <p style={{
          color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0,
          fontWeight: 600, textTransform: "uppercase", letterSpacing: 1,
        }}>
          {t(lang, "keywordAlerts")} {notifications.length > 0 && `(${notifications.length})`}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={fetchNotifications}
            style={{
              background: "none", border: "none",
              color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif", transition: "color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#1d9bf0")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
          >
            ↻ Refresh
          </button>
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{
                background: "none", border: "none",
                color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif", transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
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
        <div style={{ padding: "64px 24px", textAlign: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "rgba(29,155,240,0.1)", border: "1px solid rgba(29,155,240,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <Bell size={24} color="#1d9bf0" />
          </div>
          <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 22, margin: "0 0 8px" }}>
            {t(lang, "nothingToSee")}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: "0 0 8px" }}>
            Tweets with <strong style={{ color: "#1d9bf0" }}>#hashtags</strong> from your selected categories will appear here.
          </p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0 }}>
            Watching: {selected.map(id => `#${id}`).join(", ")}
          </p>
        </div>
      ) : (
        notifications.map((notif) => {
          const cat = getCatMeta(notif.keyword);
          return (
            <div
              key={notif.id}
              style={{
                display: "flex", gap: 12, padding: "14px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
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

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{
                    background: "rgba(29,155,240,0.12)", border: "1px solid rgba(29,155,240,0.25)",
                    color: "#1d9bf0", fontSize: 11, fontWeight: 700,
                    padding: "2px 8px", borderRadius: 9999,
                  }}>
                    {cat.emoji} #{notif.keyword}
                  </span>
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{notif.author}</span>
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
                    {timeAgo(notif.time)}
                  </span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, margin: 0, lineHeight: 1.5, wordBreak: "break-word" }}>
                  {notif.content.split(new RegExp(`(#${notif.keyword})`, "gi")).map((part, j) =>
                    part.toLowerCase() === `#${notif.keyword}`.toLowerCase()
                      ? <mark key={j} style={{ background: "rgba(29,155,240,0.25)", color: "#1d9bf0", borderRadius: 3, padding: "0 2px" }}>{part}</mark>
                      : part
                  )}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}