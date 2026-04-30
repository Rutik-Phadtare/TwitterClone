"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import axiosInstance from "@/lib/axiosInstance";
import { useAuth } from "@/context/AuthContext";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "hi", label: "हिन्दी" },
  { code: "pt", label: "Português" },
  { code: "zh", label: "中文" },
  { code: "fr", label: "Français" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingLang, setPendingLang] = useState("");
  const [error, setError] = useState("");

  const selectLanguage = async (code: string) => {
    if (code === i18n.language) return;
    setPendingLang(code);
    // All languages require OTP — French via email, others via SMS
    try {
      await axiosInstance.post("/send-otp", {
        type: code === "fr" ? "email" : "sms",
        email: user?.email,
      });
      setOtpSent(true);
    } catch { setError("Failed to send OTP"); }
  };

  const verifyOtp = async () => {
    try {
      await axiosInstance.post("/verify-otp", { otp, email: user?.email });
      i18n.changeLanguage(pendingLang);
      localStorage.setItem("preferred-lang", pendingLang);
      setOtpSent(false);
      setOtp("");
      setPendingLang("");
    } catch { setError("Invalid OTP"); }
  };

  return (
    <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <p style={{ color: "#fff", fontWeight: 600, margin: "0 0 12px" }}>Language</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {LANGUAGES.map(lang => (
          <button key={lang.code} onClick={() => selectLanguage(lang.code)} style={{
            padding: "6px 14px", borderRadius: 9999, fontSize: 13, cursor: "pointer",
            background: i18n.language === lang.code ? "#1d9bf0" : "rgba(255,255,255,0.07)",
            color: i18n.language === lang.code ? "#fff" : "rgba(255,255,255,0.7)",
            border: "1px solid", borderColor: i18n.language === lang.code ? "#1d9bf0" : "rgba(255,255,255,0.15)",
          }}>{lang.label}</button>
        ))}
      </div>
      {otpSent && (
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP"
            style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "10px 14px", color: "#fff", outline: "none" }} />
          <button onClick={verifyOtp} style={{ background: "#1d9bf0", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", cursor: "pointer", fontWeight: 600 }}>Verify</button>
        </div>
      )}
      {error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 8 }}>{error}</p>}
    </div>
  );
}