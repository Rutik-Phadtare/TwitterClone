"use client";
import { useState, useEffect } from "react";
import { requestNotificationPermission } from "@/lib/notificationUtils";

export default function NotificationToggle() {
  const [enabled, setEnabled] = useState(
    () => localStorage.getItem("notifications-enabled") !== "false"
  );

  const toggle = async () => {
    if (!enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) { alert("Please allow notifications in browser settings."); return; }
    }
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("notifications-enabled", String(next));
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <div>
        <p style={{ color: "#fff", margin: 0, fontWeight: 600 }}>Tweet notifications</p>
        <p style={{ color: "rgba(255,255,255,0.4)", margin: "2px 0 0", fontSize: 13 }}>
          Get notified for cricket and science tweets
        </p>
      </div>
      <button onClick={toggle} style={{
        width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
        background: enabled ? "#1d9bf0" : "rgba(255,255,255,0.15)",
        transition: "background 0.2s", position: "relative",
      }}>
        <span style={{
          position: "absolute", top: 2, left: enabled ? 22 : 2,
          width: 20, height: 20, borderRadius: "50%", background: "#fff",
          transition: "left 0.2s",
        }} />
      </button>
    </div>
  );
}