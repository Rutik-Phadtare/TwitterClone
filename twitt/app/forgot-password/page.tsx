"use client";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/context/firebase";

const LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const generatePassword = (len = 12) =>
  Array.from({ length: len }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join("");

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [generatedPw, setGeneratedPw] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 1-per-day limit using localStorage
    const lastReset = localStorage.getItem("last-pw-reset");
    const today = new Date().toDateString();
    if (lastReset === today) {
      setError("You can use this option only one time per day.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      localStorage.setItem("last-pw-reset", today);
      setSent(true);
      setError("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 32 }}>
        <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>Reset password</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: "0 0 24px" }}>
          Enter your email and we'll send a reset link.
        </p>
        {sent ? (
          <p style={{ color: "#1d9bf0", textAlign: "center" }}>Check your inbox for the reset link.</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email address" required
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "12px 14px", color: "#fff", fontSize: 15, outline: "none" }}
            />
            {error && <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>{error}</p>}
            <button type="submit" style={{ background: "#1d9bf0", color: "#fff", border: "none", borderRadius: 9999, padding: "12px 0", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              Send reset link
            </button>
          </form>
        )}
        {/* Password generator */}
        <div style={{ marginTop: 32, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 24 }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 12px" }}>Or generate a new password (letters only):</p>
          <button onClick={() => setGeneratedPw(generatePassword())} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "10px 16px", color: "#fff", cursor: "pointer", fontSize: 14 }}>
            Generate password
          </button>
          {generatedPw && (
            <div style={{ marginTop: 12, background: "rgba(29,155,240,0.08)", border: "1px solid rgba(29,155,240,0.2)", borderRadius: 8, padding: "10px 14px" }}>
              <code style={{ color: "#1d9bf0", fontSize: 16, letterSpacing: 1 }}>{generatedPw}</code>
              <button onClick={() => navigator.clipboard.writeText(generatedPw)} style={{ marginLeft: 12, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12 }}>Copy</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}