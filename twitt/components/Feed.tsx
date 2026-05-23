import React, { useEffect, useRef, useState } from "react";
import TweetCard from "./TweetCard";
import TweetComposer from "./TweetComposer";
import TweetDetailPage from "./TweetDetailPage";
import axiosInstance from "@/lib/axiosInstance";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLE_ID = "feed-animations-v2";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

    @keyframes fadeSlideIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position:  600px 0; }
    }
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(29,155,240,0); }
      50%       { box-shadow: 0 0 0 6px rgba(29,155,240,0.12); }
    }
    @keyframes indicatorIn {
      from { transform: translateX(-50%) scaleX(0.3); opacity: 0; }
      to   { transform: translateX(-50%) scaleX(1);   opacity: 1; }
    }

    .feed-tweet-item {
      animation: fadeSlideIn 0.35s cubic-bezier(0.22,1,0.36,1) both;
      border-bottom: 1px solid rgb(47,51,54);
      transition: background 0.15s ease;
    }
    .feed-tweet-item:hover { background: rgba(255,255,255,0.016); }

    .feed-skeleton {
      background: linear-gradient(
        90deg,
        rgba(255,255,255,0.04) 25%,
        rgba(255,255,255,0.09) 50%,
        rgba(255,255,255,0.04) 75%
      );
      background-size: 600px 100%;
      animation: shimmer 1.5s infinite linear;
      border-radius: 6px;
    }

    .feed-composer-wrapper {
      animation: fadeSlideIn 0.35s 0.08s cubic-bezier(0.22,1,0.36,1) both;
      border-bottom: 1px solid rgb(47,51,54);
    }

    .feed-fab { animation: pulseGlow 2.4s ease-in-out infinite; }

    .x-tabs-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      width: 100%;
      height: 53px;
    }

    .x-tab {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0;
      outline: none;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s ease;
    }
    .x-tab:hover { background: rgba(255,255,255,0.03); }

    .x-tab-label {
      font-family: 'DM Sans', sans-serif;
      font-size: 15px;
      font-weight: 500;
      color: rgb(113,118,123);
      transition: color 0.15s ease, font-weight 0.1s ease;
    }
    .x-tab.active .x-tab-label {
      color: #e7e9ea;
      font-weight: 700;
    }

    .x-tab-indicator {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%) scaleX(0);
      height: 4px;
      width: 56px;
      background: #1d9bf0;
      border-radius: 9999px;
      opacity: 0;
      transition: opacity 0.15s ease;
    }
    .x-tab.active .x-tab-indicator {
      opacity: 1;
      animation: indicatorIn 0.22s cubic-bezier(0.34,1.2,0.64,1) forwards;
    }

    /* Disable slide-in animation for TweetDetailPage card */
    .tdp-card-wrap .tc-card {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
  `;
  document.head.appendChild(style);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonTweet = ({ delay = 0 }: { delay?: number }) => (
  <div style={{
    display: "flex", gap: 12,
    padding: "12px 16px",
    borderBottom: "1px solid rgb(47,51,54)",
    animation: `fadeSlideIn 0.4s ${delay}s cubic-bezier(0.22,1,0.36,1) both`,
  }}>
    <div className="feed-skeleton" style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div className="feed-skeleton" style={{ width: 100, height: 13 }} />
        <div className="feed-skeleton" style={{ width: 65, height: 13, opacity: 0.5 }} />
      </div>
      <div className="feed-skeleton" style={{ width: "90%", height: 13 }} />
      <div className="feed-skeleton" style={{ width: "72%", height: 13 }} />
      <div style={{ display: "flex", gap: 24, marginTop: 4 }}>
        {[38, 38, 34].map((w, i) => (
          <div key={i} className="feed-skeleton" style={{ width: w, height: 11, opacity: 0.4 }} />
        ))}
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Feed = () => {
  const [tweets,        setTweets]        = useState<any[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [activeTab,     setActiveTab]     = useState<"foryou" | "following">("foryou");
  const [selectedTweet, setSelectedTweet] = useState<any | null>(null);
  const tweetsRef = useRef<HTMLDivElement>(null);
  const { lang } = useLanguage();

  const fetchTweets = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/post");
      setTweets(res.data.tweets ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTweets(); }, []);

  const handleNewTweet = (newTweet: any) => {
    setTweets((prev) => [newTweet, ...prev]);
  };

  const handleTweetDeleted = (id: string) => {
    setTweets(prev => prev.filter((tw) => tw._id !== id));
  };

  const handleTweetEdited = (updated: any) => {
    setTweets(prev => prev.map((tw) => tw._id === updated._id ? updated : tw));
  };

  // ── Early return — render detail page when a tweet is selected ──────────────
  if (selectedTweet) {
    return (
      <TweetDetailPage
        tweet={selectedTweet}
        onBack={() => setSelectedTweet(null)}
        onDelete={(id) => {
          handleTweetDeleted(id);
          setSelectedTweet(null);
        }}
        onEdit={(updated) => {
          handleTweetEdited(updated);
          setSelectedTweet(updated);
        }}
      />
    );
  }
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      fontFamily: "'DM Sans', sans-serif",
      paddingBottom: 80,
    }}>

      {/* Sticky header — tabs */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgb(47,51,54)",
      }}>
        <div className="x-tabs-list" role="tablist">
          {(["foryou", "following"] as const).map((val) => (
            <button
              key={val}
              role="tab"
              aria-selected={activeTab === val}
              className={`x-tab${activeTab === val ? " active" : ""}`}
              onClick={() => setActiveTab(val)}
            >
              <span className="x-tab-label">
                {val === "foryou" ? t(lang, "forYou") : t(lang, "following")}
              </span>
              <span className="x-tab-indicator" />
            </button>
          ))}
        </div>
      </div>

      {/* Composer */}
      <div className="feed-composer-wrapper">
        <TweetComposer onTweetPosted={handleNewTweet} />
      </div>

      {/* Feed */}
      <div ref={tweetsRef}>
        {loading ? (
          <>
            {[0, 0.07, 0.14, 0.21, 0.28].map((d, i) => (
              <SkeletonTweet key={i} delay={d} />
            ))}
          </>
        ) : tweets.length === 0 ? (
          <div style={{
            padding: "72px 24px",
            textAlign: "center",
            animation: "fadeSlideIn 0.4s ease both",
          }}>
            <div style={{
              width: 52, height: 52,
              borderRadius: "50%",
              background: "rgba(29,155,240,0.08)",
              border: "1px solid rgba(29,155,240,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
              fontSize: 22,
            }}>
              ✦
            </div>
            <p style={{ color: "rgb(113,118,123)", fontSize: 15, margin: 0 }}>
              {t(lang, "nothingYet")}
            </p>
          </div>
        ) : (
          tweets.map((tweet: any, index: number) => (
            <div
              key={tweet._id}
              className="feed-tweet-item"
              style={{ animationDelay: `${Math.min(index * 0.04, 0.3)}s` }}
            >
              <TweetCard
                tweet={tweet}
                onCardClick={(tw) => {
                  // Only open detail if author is fully populated
                  if (tw.author?.displayName) setSelectedTweet(tw);
                }}
                onDelete={handleTweetDeleted}
                onEdit={handleTweetEdited}
              />
            </div>
          ))
        )}
      </div>

      {/* Scroll-to-top FAB */}
      {tweets.length > 6 && (
        <button
          className="feed-fab"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            position: "fixed",
            bottom: 28, right: 28,
            width: 44, height: 44,
            borderRadius: "50%",
            background: "#1d9bf0",
            border: "none",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff",
            fontSize: 18,
            boxShadow: "0 4px 20px rgba(29,155,240,0.4)",
            transition: "transform 0.18s ease, box-shadow 0.18s ease",
            zIndex: 30,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(29,155,240,0.55)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(29,155,240,0.4)";
          }}
          title="Back to top"
        >
          ↑
        </button>
      )}
    </div>
  );
};

export default Feed;