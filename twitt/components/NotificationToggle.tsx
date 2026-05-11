"use client";
import React, { useState, useEffect, useRef } from "react";
import { Bell, BellOff, ChevronDown, AlertCircle, CheckCircle } from "lucide-react";
import {
  requestNotificationPermission,
  areNotificationsEnabled,
  getSelectedCategories,
  setSelectedCategories,
  ALL_CATEGORIES,
} from "@/lib/notificationUtils";

const STYLES = `
  @keyframes nt-fadeIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .nt-track {
    position: relative; width: 36px; height: 20px;
    border-radius: 10px; cursor: pointer; border: none;
    transition: background 0.25s ease; flex-shrink: 0;
  }
  .nt-thumb {
    position: absolute; top: 2px; left: 2px;
    width: 16px; height: 16px; border-radius: 50%; background: #fff;
    transition: transform 0.25s cubic-bezier(0.22,1,0.36,1);
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }
  .nt-track.on  { background: #1d9bf0; }
  .nt-track.off { background: rgba(255,255,255,0.18); }
  .nt-track.on  .nt-thumb { transform: translateX(16px); }

  .nt-dropdown {
    animation: nt-fadeIn 0.18s ease both;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }

  .nt-cat-chip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 9999px; cursor: pointer;
    font-size: 12px; font-weight: 600; border: 1.5px solid;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.12s ease; user-select: none;
  }
  .nt-cat-chip.on {
    background: rgba(29,155,240,0.12);
    border-color: #1d9bf0; color: #1d9bf0;
  }
  .nt-cat-chip.off {
    background: rgba(255,255,255,0.03);
    border-color: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.4);
  }
  .nt-cat-chip.off:hover {
    border-color: rgba(255,255,255,0.22);
    color: rgba(255,255,255,0.7);
    background: rgba(255,255,255,0.06);
  }
  .nt-cat-chip.on:hover { background: rgba(29,155,240,0.2); }
`;

export default function NotificationToggle() {
  const [open,       setOpen]       = useState(false);
  const [enabled,    setEnabled]    = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [selected,   setSelected]   = useState<string[]>([]);
  const [minError,   setMinError]   = useState(false);
  const [mounted,    setMounted]    = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if ("Notification" in window) {
      setPermission(Notification.permission);
      setEnabled(areNotificationsEnabled());
    }
    setSelected(getSelectedCategories());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!mounted) return null;

  const browserSupports = "Notification" in window;

  const handleToggle = async () => {
    if (!browserSupports) return;
    if (!enabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setEnabled(true);
        setPermission("granted");
        localStorage.setItem("twiller-notifications-enabled", "true");
        new Notification("🔔 Twiller notifications on!", {
          body: `Watching: ${selected.join(", ")}`,
          icon: "/favicon.ico",
          tag:  "twiller-test",
        });
      } else {
        setPermission(Notification.permission as NotificationPermission);
      }
    } else {
      setEnabled(false);
      localStorage.setItem("twiller-notifications-enabled", "false");
    }
  };

  const toggleCategory = (catId: string) => {
    setMinError(false);
    setSelected(prev => {
      if (prev.includes(catId)) {
        if (prev.length <= 2) { setMinError(true); return prev; }
        const next = prev.filter(c => c !== catId);
        setSelectedCategories(next);
        return next;
      } else {
        const next = [...prev, catId];
        setSelectedCategories(next);
        return next;
      }
    });
  };

  const statusColor = permission === "granted" && enabled
    ? "#1d9bf0"
    : permission === "denied"
    ? "#ef4444"
    : "rgba(255,255,255,0.35)";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div ref={dropRef} style={{ borderBottom: open ? "none" : "1px solid rgba(255,255,255,0.07)", fontFamily: "'DM Sans',sans-serif" }}>

        {/* ── Compact trigger row ── */}
        <div
          onClick={() => setOpen(o => !o)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px", cursor: "pointer",
            transition: "background 0.15s",
            background: open ? "rgba(255,255,255,0.02)" : "transparent",
          }}
          onMouseEnter={e => { if (!open) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
          onMouseLeave={e => { if (!open) e.currentTarget.style.background = "transparent"; }}
        >
          {/* Left: icon + label */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: enabled ? "rgba(29,155,240,0.1)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${enabled ? "rgba(29,155,240,0.25)" : "rgba(255,255,255,0.08)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {enabled
                ? <Bell size={13} color="#1d9bf0" />
                : <BellOff size={13} color="rgba(255,255,255,0.35)" />
              }
            </div>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Notifications</span>
            {/* Status dot */}
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: statusColor, display: "inline-block",
            }} />
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
              {selected.length} categories
            </span>
          </div>

          {/* Right: toggle + chevron */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {browserSupports && (
              <button
                className={`nt-track ${enabled ? "on" : "off"}`}
                onClick={e => { e.stopPropagation(); handleToggle(); }}
                aria-label="Toggle notifications"
              >
                <div className="nt-thumb" />
              </button>
            )}
            <ChevronDown
              size={14}
              color="rgba(255,255,255,0.3)"
              style={{
                transition: "transform 0.2s",
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </div>
        </div>

        {/* ── Dropdown panel ── */}
        {open && (
          <div className="nt-dropdown" style={{ padding: "12px 16px 14px" }}>

            {/* Permission status */}
            {permission === "denied" ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 12px", borderRadius: 8, marginBottom: 12,
                background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)",
                color: "#ef4444", fontSize: 12,
              }}>
                <AlertCircle size={12} />
                Blocked — enable in browser settings (🔒 in address bar)
              </div>
            ) : permission === "granted" && enabled ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 12px", borderRadius: 8, marginBottom: 12,
                background: "rgba(29,155,240,0.07)", border: "1px solid rgba(29,155,240,0.18)",
                color: "#1d9bf0", fontSize: 12,
              }}>
                <CheckCircle size={12} />
                Active — popup alerts enabled
              </div>
            ) : null}

            {/* Category label */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                Alert categories
              </span>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
                {selected.length} / {ALL_CATEGORIES.length} selected
              </span>
            </div>

            {/* Category chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ALL_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`nt-cat-chip ${selected.includes(cat.id) ? "on" : "off"}`}
                  onClick={() => toggleCategory(cat.id)}
                >
                  <span style={{ fontSize: 12 }}>{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Min error */}
            {minError && (
              <p style={{ color: "#eab308", fontSize: 11, margin: "8px 0 0" }}>
                ⚠ Minimum 2 categories required
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}