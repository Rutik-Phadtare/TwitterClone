"use client";
import React, { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import TweetCard from "../TweetCard";
import axiosInstance from "@/lib/axiosInstance";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  useEffect(() => {
    // Load bookmarked tweet IDs from localStorage
    const saved = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    if (saved.length === 0) return;
    axiosInstance.get("/post").then(res => {
      const all = res.data.tweets ?? [];
      setBookmarks(all.filter((t: any) => saved.includes(t._id)));
    });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#000" }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(18px)",
        padding: "16px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0 }}>Bookmarks</h1>
      </div>
      {bookmarks.length === 0 ? (
        <div style={{ padding: "64px 24px", textAlign: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "rgba(29,155,240,0.1)",
            border: "1px solid rgba(29,155,240,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <Bookmark size={24} color="#1d9bf0" />
          </div>
          <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 24, margin: "0 0 8px" }}>
            Save posts for later
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, margin: 0 }}>
            Bookmark any post to find it here later.
          </p>
        </div>
      ) : (
        bookmarks.map((tweet: any) => <TweetCard key={tweet._id} tweet={tweet} />)
      )}
    </div>
  );
}