"use client";

import React, { useEffect } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import TweetCard from "./TweetCard";

interface TweetDetailPageProps {
  tweet: any;
  onBack: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (updated: any) => void;
}

export default function TweetDetailPage({ tweet, onBack, onDelete, onEdit }: TweetDetailPageProps) {
  // Scroll to top when detail opens
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Sticky header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(0,0,0,0.92)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgb(47,51,54)",
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "0 16px",
          height: 53,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: "50%",
            transition: "background 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 20, letterSpacing: "-0.3px" }}>
          Post
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, width: "100%" }}>
        {/* tdp-card-wrap class disables tc-slideIn animation via CSS — no blank flash */}
        <div className="tdp-card-wrap">
          <TweetCard
            tweet={tweet}
            isDetail
            onDelete={(id) => { onDelete?.(id); onBack(); }}
            onEdit={onEdit}
          />
        </div>

        {/* Replies placeholder */}
        <div
          style={{
            borderTop: "1px solid rgb(47,51,54)",
            padding: "52px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(29,155,240,0.06)",
              border: "1px solid rgba(29,155,240,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MessageCircle size={20} color="rgba(255,255,255,0.25)" strokeWidth={1.5} />
          </div>
          <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 14 }}>
            No replies yet
          </span>
        </div>
      </div>
    </div>
  );
}