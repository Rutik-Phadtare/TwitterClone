"use client";
import React from "react";
import { Mail, Lock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";

export default function MessagesPage() {
  const { lang } = useLanguage();
  return (
    <div style={{ minHeight: "100vh", background: "#000" }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(18px)",
        padding: "16px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0 }}>
          {t(lang, "messages")}
        </h1>
      </div>
      <div style={{ padding: "64px 24px", textAlign: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "rgba(29,155,240,0.1)",
          border: "1px solid rgba(29,155,240,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
        }}>
          <Mail size={24} color="#1d9bf0" />
        </div>
        <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 24, margin: "0 0 8px" }}>
          {t(lang, "welcomeInbox")}
        </h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, margin: "0 0 24px" }}>
          {t(lang, "messagingComing")}
        </p>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12, padding: "10px 16px",
          color: "rgba(255,255,255,0.5)", fontSize: 13,
        }}>
          <Lock size={14} />
          End-to-end encrypted
        </div>
      </div>
    </div>
  );
}