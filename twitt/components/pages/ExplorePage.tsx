"use client";
import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import TweetCard from "../TweetCard";

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [allTweets, setAllTweets] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get("/post").then(res => {
      const tweets = res.data.tweets ?? [];
      setAllTweets(tweets);
      setResults(tweets);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults(allTweets); return; }
    const q = query.toLowerCase();
    setResults(allTweets.filter((t: any) =>
      t.content?.toLowerCase().includes(q) ||
      t.author?.displayName?.toLowerCase().includes(q) ||
      t.author?.username?.toLowerCase().includes(q)
    ));
  }, [query, allTweets]);

  return (
    <div style={{ minHeight: "100vh", background: "#000" }}>
      {/* Sticky search bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(18px)",
        padding: "12px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ position: "relative" }}>
          <Search size={16} style={{
            position: "absolute", left: 14, top: "50%",
            transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)",
          }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search posts, people..."
            style={{
              width: "100%", padding: "11px 16px 11px 42px",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 9999, color: "#fff", fontSize: 15, outline: "none",
              fontFamily: "'DM Sans', sans-serif",
              boxSizing: "border-box",
            }}
            onFocus={e => (e.target.style.borderColor = "#1d9bf0")}
            onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
          />
        </div>
      </div>

      {/* Results */}
      <div>
        {loading ? (
          <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: 40 }}>Loading...</p>
        ) : results.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 20 }}>No results for "{query}"</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Try searching for something else.</p>
          </div>
        ) : (
          results.map((tweet: any) => <TweetCard key={tweet._id} tweet={tweet} />)
        )}
      </div>
    </div>
  );
}