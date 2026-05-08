"use client";
import React, { useState, useEffect } from "react";
import { Bell, BellOff, AlertCircle, CheckCircle } from "lucide-react";
import { requestNotificationPermission, areNotificationsEnabled } from "@/lib/notificationUtils";

const STYLES = `
  @keyframes nt-fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .nt-root {
    font-family: 'DM Sans', sans-serif;
    animation: nt-fadeIn 0.3s ease both;
  }
  .nt-track {
    position: relative;
    width: 44px; height: 24px;
    border-radius: 12px;
    cursor: pointer;
    border: none;
    transition: background 0.25s ease;
    flex-shrink: 0;
  }
  .nt-thumb {
    position: absolute;
    top: 3px; left: 3px;
    width: 18px; height: 18px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.25s cubic-bezier(0.22,1,0.36,1),
                box-shadow 0.25s ease;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }
  .nt-track.on  { background: #1d9bf0; }
  .nt-track.off { background: rgba(255,255,255,0.2); }
  .nt-track.on  .nt-thumb { transform: translateX(20px); }
  .nt-track:hover { opacity: 0.85; }

  .nt-keyword {
    display: inline-flex; align-items: center;
    padding: 3px 10px; border-radius: 9999px;
    font-size: 12px; font-weight: 600;
    background: rgba(29,155,240,0.1);
    border: 1px solid rgba(29,155,240,0.25);
    color: #1d9bf0;
    transition: background 0.15s;
  }
  .nt-keyword:hover {
    background: rgba(29,155,240,0.18);
  }

  .nt-status {
    display: flex; align-items: center; gap: 7px;
    padding: 10px 14px; border-radius: 10px;
    font-size: 13px; font-weight: 500;
    animation: nt-fadeIn 0.25s ease both;
  }
  .nt-status.granted  { background: rgba(29,155,240,0.08); color: #1d9bf0; border: 1px solid rgba(29,155,240,0.2); }
  .nt-status.denied   { background: rgba(239,68,68,0.08);  color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
  .nt-status.default  { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.1); }
`;

export default function NotificationToggle() {
  const [enabled,    setEnabled]    = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [mounted,    setMounted]    = useState(false);

  useEffect(() => {
    setMounted(true);
    if ("Notification" in window) {
      setPermission(Notification.permission);
      setEnabled(areNotificationsEnabled());
    }
  }, []);

  if (!mounted) return null;

  const browserSupports = "Notification" in window;

  const handleToggle = async () => {
    if (!browserSupports) return;

    if (!enabled) {
      // Turning ON — request permission first
      const granted = await requestNotificationPermission();
      if (granted) {
        setEnabled(true);
        setPermission("granted");
        localStorage.setItem("twiller-notifications-enabled", "true");

        // Send a test notification so user knows it works
        new Notification("🔔 Twiller notifications enabled!", {
          body: "You'll be notified when tweets mention cricket or science.",
          icon: "/favicon.ico",
          tag: "twiller-test",
        });
      } else {
        setPermission(Notification.permission as NotificationPermission);
      }
    } else {
      // Turning OFF — just update preference, can't revoke browser permission
      setEnabled(false);
      localStorage.setItem("twiller-notifications-enabled", "false");
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="nt-root" style={{
        padding: "16px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: enabled ? "rgba(29,155,240,0.12)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${enabled ? "rgba(29,155,240,0.3)" : "rgba(255,255,255,0.1)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s, border-color 0.2s",
            }}>
              {enabled
                ? <Bell size={16} color="#1d9bf0" />
                : <BellOff size={16} color="rgba(255,255,255,0.4)" />
              }
            </div>
            <div>
              <p style={{ color: "#fff", margin: 0, fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>
                Tweet notifications
              </p>
              <p style={{ color: "rgba(255,255,255,0.4)", margin: "2px 0 0", fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>
                Get notified for trending topics
              </p>
            </div>
          </div>

          {/* Toggle switch */}
          {browserSupports && (
            <button
              className={`nt-track ${enabled ? "on" : "off"}`}
              onClick={handleToggle}
              aria-label={enabled ? "Disable notifications" : "Enable notifications"}
            >
              <div className="nt-thumb" />
            </button>
          )}
        </div>

        {/* Permission status */}
        <div style={{ marginTop: 12 }}>
          {!browserSupports ? (
            <div className="nt-status denied">
              <AlertCircle size={14} />
              Your browser doesn't support notifications
            </div>
          ) : permission === "granted" && enabled ? (
            <div className="nt-status granted">
              <CheckCircle size={14} />
              Notifications are active
            </div>
          ) : permission === "denied" ? (
            <div className="nt-status denied">
              <AlertCircle size={14} />
              Notifications blocked — enable in browser settings (🔒 in address bar)
            </div>
          ) : (
            <div className="nt-status default">
              <Bell size={14} />
              Toggle on to enable notifications
            </div>
          )}
        </div>

        {/* Trigger keywords */}
        <div style={{ marginTop: 14 }}>
          <p style={{
            color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "0 0 8px",
            textTransform: "uppercase", letterSpacing: 1, fontFamily: "'DM Sans',sans-serif",
          }}>
            Trigger keywords
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["cricket", "science"].map(kw => (
              <span key={kw} className="nt-keyword">#{kw}</span>
            ))}
          </div>
          <p style={{
            color: "rgba(255,255,255,0.25)", fontSize: 11, margin: "10px 0 0",
            fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5,
          }}>
            Any tweet containing these words will trigger a browser popup notification.
          </p>
        </div>
      </div>
    </>
  );
}