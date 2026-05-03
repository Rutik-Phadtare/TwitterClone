"use client";
import React, { useState, useEffect } from "react";
import { Monitor, Smartphone, Tablet, Globe, Clock, RefreshCw } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";

const STYLES = `
  @keyframes lh-fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lh-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
  }
  .lh-skel {
    background: linear-gradient(90deg,
      rgba(255,255,255,0.04) 25%,
      rgba(255,255,255,0.09) 50%,
      rgba(255,255,255,0.04) 75%
    );
    background-size: 400px 100%;
    animation: lh-shimmer 1.5s infinite linear;
    border-radius: 6px;
  }
  .lh-row {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    animation: lh-fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both;
    transition: background 0.15s;
  }
  .lh-row:hover { background: rgba(255,255,255,0.02); }
  .lh-row:last-child { border-bottom: none; }
  .lh-icon-wrap {
    width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .lh-badge {
    display: inline-flex; align-items: center;
    padding: 2px 8px; border-radius: 9999px;
    font-size: 11px; font-weight: 600;
    letter-spacing: 0.3px;
  }
`;

const deviceIcon = (device: string) => {
  const d = device?.toLowerCase() || "";
  if (d === "mobile")  return <Smartphone size={18} />;
  if (d === "tablet")  return <Tablet size={18} />;
  return <Monitor size={18} />;
};

const deviceColor = (device: string) => {
  const d = device?.toLowerCase() || "";
  if (d === "mobile") return { bg: "rgba(249,24,128,0.12)", color: "#f91880" };
  if (d === "tablet") return { bg: "rgba(234,179,8,0.12)",  color: "#eab308" };
  return { bg: "rgba(29,155,240,0.12)", color: "#1d9bf0" };
};

const browserColor = (browser: string) => {
  const b = browser?.toLowerCase() || "";
  if (b.includes("chrome"))  return { bg: "rgba(29,155,240,0.1)",  color: "#1d9bf0",  label: "Chrome (OTP required)" };
  if (b.includes("edge") || b.includes("microsoft")) return { bg: "rgba(0,120,212,0.1)", color: "#0078d4", label: browser };
  if (b.includes("firefox")) return { bg: "rgba(255,149,0,0.1)",   color: "#ff9500",  label: browser };
  if (b.includes("safari"))  return { bg: "rgba(99,200,255,0.1)",  color: "#63c8ff",  label: browser };
  return { bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", label: browser };
};

const timeAgo = (date: string): string => {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800)return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function LoginHistory() {
  const [logs, setLogs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/login-history");
      setLogs(res.data);
    } catch {
      setError("Failed to load login history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 16px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div>
            <h3 style={{ color: "#fff", fontSize: 17, fontWeight: 700, margin: "0 0 3px" }}>
              Login history
            </h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>
              Last 20 sessions
            </p>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 9999, padding: "6px 12px", color: "rgba(255,255,255,0.6)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              fontFamily: "'DM Sans', sans-serif",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          >
            <RefreshCw size={12} style={loading ? { animation: "otp-spin 0.8s linear infinite" } : {}} />
            Refresh
          </button>
        </div>

        {/* Legend */}
        <div style={{
          display: "flex", gap: 16, padding: "10px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          flexWrap: "wrap",
        }}>
          {[
            { color: "#1d9bf0", label: "Chrome — OTP required" },
            { color: "#0078d4", label: "Microsoft — no OTP" },
            { color: "#f91880", label: "Mobile — time restricted" },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          // Skeleton
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="lh-skel" style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="lh-skel" style={{ width: "55%", height: 12 }} />
                <div className="lh-skel" style={{ width: "38%", height: 11, opacity: 0.6 }} />
              </div>
              <div className="lh-skel" style={{ width: 60, height: 20, borderRadius: 9999, flexShrink: 0 }} />
            </div>
          ))
        ) : error ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "#ef4444", fontSize: 14 }}>
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: "48px 16px", textAlign: "center" }}>
            <Globe size={32} color="rgba(255,255,255,0.2)" style={{ margin: "0 auto 12px", display: "block" }} />
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0 }}>No login history yet</p>
          </div>
        ) : (
          logs.map((log, i) => {
            const dc = deviceColor(log.device);
            const bc = browserColor(log.browser);
            return (
              <div key={log._id || i} className="lh-row" style={{ animationDelay: `${i * 0.04}s` }}>

                {/* Device icon */}
                <div className="lh-icon-wrap" style={{ background: dc.bg, color: dc.color }}>
                  {deviceIcon(log.device)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    {/* Browser badge */}
                    <span className="lh-badge" style={{ background: bc.bg, color: bc.color }}>
                      {bc.label || log.browser}
                    </span>
                    {/* Device badge */}
                    <span className="lh-badge" style={{ background: dc.bg, color: dc.color, textTransform: "capitalize" }}>
                      {log.device || "desktop"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                      {log.os || "Unknown OS"}
                    </span>
                    {log.ip && (
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "monospace" }}>
                        {log.ip}
                      </span>
                    )}
                  </div>
                </div>

                {/* Time */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.3)", fontSize: 12, flexShrink: 0 }}>
                  <Clock size={11} />
                  {timeAgo(log.timestamp)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}