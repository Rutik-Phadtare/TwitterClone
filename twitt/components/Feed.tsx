import React, { useEffect, useState, useRef } from "react";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent } from "./ui/card";
import LoadingSpinner from "./loading-spinner";
import TweetCard from "./TweetCard";
import TweetComposer from "./TweetComposer";
import axiosInstance from "@/lib/axiosInstance";

// ─── Keyframe injection (runs once) ──────────────────────────────────────────
const STYLE_ID = "feed-animations";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');

    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position:  600px 0; }
    }
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(29,155,240,0); }
      50%       { box-shadow: 0 0 0 6px rgba(29,155,240,0.12); }
    }
    @keyframes tabIndicator {
      from { transform: scaleX(0); opacity: 0; }
      to   { transform: scaleX(1); opacity: 1; }
    }
    @keyframes spinnerRing {
      to { transform: rotate(360deg); }
    }
    @keyframes headerReveal {
      from { opacity: 0; transform: translateY(-12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .feed-tweet-item {
      animation: fadeSlideIn 0.38s cubic-bezier(0.22,1,0.36,1) both;
    }

    .feed-skeleton {
      background: linear-gradient(
        90deg,
        rgba(255,255,255,0.03) 25%,
        rgba(255,255,255,0.08) 50%,
        rgba(255,255,255,0.03) 75%
      );
      background-size: 600px 100%;
      animation: shimmer 1.6s infinite linear;
      border-radius: 8px;
    }

    .feed-tab-trigger[data-state="active"]::after {
      content: '';
      position: absolute;
      bottom: 0; left: 50%;
      transform: translateX(-50%) scaleX(1);
      width: 56px; height: 3px;
      background: #1d9bf0;
      border-radius: 2px 2px 0 0;
      animation: tabIndicator 0.22s ease-out both;
    }

    .feed-header-title {
      animation: headerReveal 0.3s ease-out both;
    }

    .feed-composer-wrapper {
      animation: fadeSlideIn 0.4s 0.1s cubic-bezier(0.22,1,0.36,1) both;
    }

    .feed-new-badge {
      animation: pulseGlow 2.4s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
const SkeletonTweet = ({ delay = 0 }: { delay?: number }) => (
  <div
    style={{
      display: "flex",
      gap: 12,
      padding: "16px 20px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      animation: `fadeSlideIn 0.4s ${delay}s cubic-bezier(0.22,1,0.36,1) both`,
    }}
  >
    {/* Avatar */}
    <div
      className="feed-skeleton"
      style={{ width: 42, height: 42, borderRadius: "50%", flexShrink: 0 }}
    />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Name row */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div className="feed-skeleton" style={{ width: 110, height: 13 }} />
        <div className="feed-skeleton" style={{ width: 70, height: 13, opacity: 0.5 }} />
      </div>
      {/* Lines */}
      <div className="feed-skeleton" style={{ width: "92%", height: 13 }} />
      <div className="feed-skeleton" style={{ width: "76%", height: 13 }} />
      {/* Action row */}
      <div style={{ display: "flex", gap: 28, marginTop: 4 }}>
        {[40, 40, 36].map((w, i) => (
          <div key={i} className="feed-skeleton" style={{ width: w, height: 11, opacity: 0.45 }} />
        ))}
      </div>
    </div>
  </div>
);

// ─── Divider ──────────────────────────────────────────────────────────────────
const GradientDivider = () => (
  <div
    style={{
      height: 1,
      background:
        "linear-gradient(90deg, transparent, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0.07) 70%, transparent)",
    }}
  />
);

// ─── Main Component ───────────────────────────────────────────────────────────
interface Tweet {
  _id: string;
  [key: string]: any;
}

const Feed = () => {
  const [tweets, setTweets] = useState<any[]>([]);
  const [loading, setloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou");
  const tweetsRef = useRef<HTMLDivElement>(null);

  // ── unchanged logic ────────────────────────────────────────────────────────
const fetchTweets = async () => {
    try {
      setloading(true);
      const res = await axiosInstance.get("/post");
      setTweets(res.data.tweets ?? []); // ← now reads the tweets array
    } catch (error) {
      console.error(error);
    } finally {
      setloading(false);
    }
  };

  useEffect(() => {
    fetchTweets();
  }, []);

  const handlenewtweet = (newtweet: any) => {
    setTweets((prev: any) => [newtweet, ...prev]);
  };
  // ──────────────────────────────────────────────────────────────────────────

  return (
      <div style={{ minHeight: "100vh",
      background: "#000",
      fontFamily: "'DM Sans', sans-serif",
      position: "relative",
      paddingBottom: 72 }
      }
      >
          {/* ── Sticky header ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "rgba(0,0,0,0.82)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Title row */}
        <div
          style={{
            padding: "14px 20px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h1
            className="feed-header-title"
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.3px",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Home
          </h1>

          {/* Subtle live indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(29,155,240,0.08)",
              border: "1px solid rgba(29,155,240,0.2)",
              borderRadius: 20,
              padding: "4px 10px",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#1d9bf0",
                display: "inline-block",
                boxShadow: "0 0 6px #1d9bf0",
              }}
            />
            <span style={{ fontSize: 11, color: "#1d9bf0", fontWeight: 600, letterSpacing: "0.4px" }}>
              LIVE
            </span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          defaultValue="foryou"
          onValueChange={(v) => setActiveTab(v as "foryou" | "following")}
          className="w-full"
        >
          <TabsList
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              background: "transparent",
              borderRadius: 0,
              height: "auto",
              padding: 0,
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {(["foryou", "following"] as const).map((val) => (
              <TabsTrigger
                key={val}
                value={val}
                className="feed-tab-trigger"
                style={{
                  position: "relative",
                  background: "transparent",
                  border: "none",
                  borderRadius: 0,
                  color: activeTab === val ? "#fff" : "rgba(255,255,255,0.45)",
                  fontWeight: activeTab === val ? 700 : 500,
                  fontSize: 15,
                  padding: "14px 0",
                  cursor: "pointer",
                  transition: "color 0.2s ease",
                  letterSpacing: "-0.1px",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {val === "foryou" ? "For you" : "Following"}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* ── Composer ── */}
      <div
        className="feed-composer-wrapper"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.012)",
        }}
      >
        <TweetComposer onTweetPosted={handlenewtweet} />
      </div>

      {/* ── Feed ── */}
      <div ref={tweetsRef}>
        {loading ? (
          // Skeleton loading
          <div>
            {[0, 0.06, 0.12, 0.18, 0.24].map((d, i) => (
              <React.Fragment key={i}>
                <SkeletonTweet delay={d} />
                {i < 4 && <GradientDivider />}
              </React.Fragment>
            ))}
          </div>
        ) : tweets.length === 0 ? (
          // Empty state
          <div
            style={{
              padding: "64px 24px",
              textAlign: "center",
              animation: "fadeSlideIn 0.4s ease both",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(29,155,240,0.1)",
                border: "1px solid rgba(29,155,240,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: 24,
              }}
            >
              ✦
            </div>
            <p
              style={{
                color: "rgba(255,255,255,0.5)",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                margin: 0,
              }}
            >
              Nothing here yet. Be the first to post.
            </p>
          </div>
        ) : (
          // Tweet list
          tweets.map((tweet: any, index: number) => (
            <div
              key={tweet._id}
              className="feed-tweet-item"
              style={{
                animationDelay: `${Math.min(index * 0.045, 0.35)}s`,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                transition: "background 0.18s ease",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLDivElement).style.background =
                  "rgba(255,255,255,0.018)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLDivElement).style.background = "transparent")
              }
            >
              <TweetCard tweet={tweet} />
            </div>
          ))
        )}
      </div>

      {/* ── Scroll-to-top FAB (appears when tweets exist) ── */}
      {tweets.length > 6 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="feed-new-badge"
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "#1d9bf0",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 18,
            boxShadow: "0 4px 20px rgba(29,155,240,0.4)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            zIndex: 30,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 6px 28px rgba(29,155,240,0.55)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 4px 20px rgba(29,155,240,0.4)";
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