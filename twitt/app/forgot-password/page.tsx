"use client";
import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/context/firebase";
import TwitterLogo from "@/components/Twitterlogo";
import { Eye, EyeOff, RefreshCw, Copy, Check, ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

// ── Password generator — letters only, no numbers or special chars ──
const LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const generatePassword = (length = 14): string =>
  Array.from({ length }, () =>
    LETTERS[Math.floor(Math.random() * LETTERS.length)]
  ).join("");

// ── 1-per-day limit key ──
const RESET_KEY = "twiller-pw-reset-date";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

  @keyframes fp-fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fp-shake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-6px); }
    60%     { transform: translateX(6px); }
  }
  @keyframes fp-success {
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes fp-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes fp-float {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-12px); }
  }

  .fp-root * { box-sizing: border-box; }

  .fp-card {
    width: 100%;
    max-width: 440px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 20px;
    padding: 36px 32px;
    animation: fp-fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both;
    font-family: 'DM Sans', sans-serif;
  }

  .fp-input {
    width: 100%;
    padding: 13px 16px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .fp-input:focus {
    border-color: #1d9bf0;
    box-shadow: 0 0 0 3px rgba(29,155,240,0.15);
  }
  .fp-input::placeholder { color: rgba(255,255,255,0.3); }
  .fp-input.error {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239,68,68,0.12);
    animation: fp-shake 0.35s ease both;
  }

  .fp-btn-primary {
    width: 100%;
    padding: 13px 0;
    border-radius: 9999px;
    border: none;
    background: linear-gradient(135deg, #1d9bf0, #0e7fd8);
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
  }
  .fp-btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(29,155,240,0.4);
  }
  .fp-btn-primary:active:not(:disabled) { transform: translateY(0); }
  .fp-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .fp-btn-ghost {
    padding: 9px 16px;
    border-radius: 9999px;
    border: 1px solid rgba(255,255,255,0.15);
    background: transparent;
    color: rgba(255,255,255,0.7);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .fp-btn-ghost:hover {
    background: rgba(255,255,255,0.07);
    color: #fff;
    border-color: rgba(255,255,255,0.3);
  }

  .fp-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
    margin: 28px 0;
  }

  .fp-pw-box {
    background: rgba(29,155,240,0.07);
    border: 1px solid rgba(29,155,240,0.2);
    border-radius: 12px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    animation: fp-fadeUp 0.35s ease both;
  }

  .fp-success-box {
    text-align: center;
    animation: fp-success 0.4s cubic-bezier(0.22,1,0.36,1) both;
  }

  .fp-error-msg {
    color: #ef4444;
    font-size: 13px;
    margin: 6px 0 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .fp-warning-box {
    background: rgba(234,179,8,0.1);
    border: 1px solid rgba(234,179,8,0.3);
    border-radius: 10px;
    padding: 12px 14px;
    color: #eab308;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 16px;
    animation: fp-fadeUp 0.3s ease both;
  }

  .fp-tab {
    flex: 1;
    padding: 10px 0;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: rgba(255,255,255,0.45);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .fp-tab.active {
    background: rgba(29,155,240,0.15);
    color: #1d9bf0;
  }
  .fp-tab:hover:not(.active) {
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.7);
  }

  .fp-spin { animation: fp-spin 0.8s linear infinite; }
  .fp-float { animation: fp-float 3s ease-in-out infinite; }
`;

export default function ForgotPasswordPage() {
  const [tab, setTab]             = useState<"email" | "phone">("email");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [sent, setSent]           = useState(false);
  const [sending, setSending]     = useState(false);
  const [error, setError]         = useState("");
  const [fieldError, setFieldError] = useState(false);
  const [generatedPw, setGeneratedPw] = useState("");
  const [copied, setCopied]       = useState(false);
  const [showPw, setShowPw]       = useState(false);

  // ── 1-per-day check ──────────────────────────────────────────────────────
  const checkDailyLimit = (): boolean => {
    const last  = localStorage.getItem(RESET_KEY);
    const today = new Date().toDateString();
    if (last === today) return false; // already used today
    return true;
  };

  const markUsedToday = () => {
    localStorage.setItem(RESET_KEY, new Date().toDateString());
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldError(false);

    // Daily limit
    if (!checkDailyLimit()) {
      setError("You can use this option only one time per day.");
      return;
    }

    // Validation
    const value = tab === "email" ? email.trim() : phone.trim();
    if (!value) {
      setFieldError(true);
      setError(tab === "email" ? "Please enter your email address." : "Please enter your phone number.");
      return;
    }
    if (tab === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setFieldError(true);
      setError("Please enter a valid email address.");
      return;
    }
    if (tab === "phone" && !/^\+?[\d\s\-]{8,15}$/.test(value)) {
      setFieldError(true);
      setError("Please enter a valid phone number.");
      return;
    }

    setSending(true);
    try {
      if (tab === "email") {
        await sendPasswordResetEmail(auth, value);
      } else {
        // Phone: we can only send Firebase reset to email
        // In production you'd look up the email from the phone via your backend
        // For now we tell the user to use email instead
        setError("Phone reset is not yet supported. Please use your email address.");
        setSending(false);
        return;
      }
      markUsedToday();
      setSent(true);
    } catch (err: any) {
      const code = err.code || "";
      if (code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else if (code === "auth/invalid-email") {
        setError("This email address is not valid.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait before trying again.");
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
      setFieldError(true);
    } finally {
      setSending(false);
    }
  };

  // ── Copy password ─────────────────────────────────────────────────────────
  const copyPassword = () => {
    if (!generatedPw) return;
    navigator.clipboard.writeText(generatedPw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Already used today? ───────────────────────────────────────────────────
  const alreadyUsedToday =
    typeof window !== "undefined" &&
    localStorage.getItem(RESET_KEY) === new Date().toDateString();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div
        className="fp-root"
        style={{
          minHeight: "100vh",
          background: "#000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background orb */}
        <div style={{
          position: "absolute", top: "-100px", left: "50%",
          transform: "translateX(-50%)",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(29,155,240,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div className="fp-card">
          {/* Back link */}
          <Link
            href="/"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 500,
              textDecoration: "none", marginBottom: 24,
              transition: "color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
          >
            <ArrowLeft size={14} />
            Back to login
          </Link>

          {/* Logo */}
          <div className="fp-float" style={{ marginBottom: 20, textAlign: "center" }}>
            <TwitterLogo size="md" className="text-white mx-auto" />
          </div>

          {sent ? (
            /* ── Success state ── */
            <div className="fp-success-box">
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "rgba(29,155,240,0.1)",
                border: "1px solid rgba(29,155,240,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <Mail size={24} color="#1d9bf0" />
              </div>
              <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>
                Check your inbox
              </h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>
                We sent a password reset link to <strong style={{ color: "#fff" }}>{email}</strong>.
                It may take a minute to arrive.
              </p>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0 }}>
                Didn't receive it? Check your spam folder, or come back tomorrow to try again.
              </p>
            </div>
          ) : (
            <>
              <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 6px", textAlign: "center" }}>
                Reset your password
              </h1>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, textAlign: "center", margin: "0 0 24px" }}>
                Enter your details and we'll send you a reset link.
              </p>

              {/* Daily limit warning */}
              {alreadyUsedToday && (
                <div className="fp-warning-box">
                  ⚠️ You can use this option only one time per day.
                </div>
              )}

              {/* Tab switcher */}
              <div style={{
                display: "flex", gap: 4,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 10, padding: 4, marginBottom: 20,
              }}>
                <button
                  className={`fp-tab${tab === "email" ? " active" : ""}`}
                  onClick={() => { setTab("email"); setError(""); setFieldError(false); }}
                >
                  Email
                </button>
                <button
                  className={`fp-tab${tab === "phone" ? " active" : ""}`}
                  onClick={() => { setTab("phone"); setError(""); setFieldError(false); }}
                >
                  Phone number
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {tab === "email" ? (
                  <input
                    className={`fp-input${fieldError ? " error" : ""}`}
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setFieldError(false); setError(""); }}
                    autoComplete="email"
                    disabled={alreadyUsedToday}
                  />
                ) : (
                  <input
                    className={`fp-input${fieldError ? " error" : ""}`}
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setFieldError(false); setError(""); }}
                    autoComplete="tel"
                    disabled={alreadyUsedToday}
                  />
                )}

                {error && (
                  <p className="fp-error-msg">
                    <span>⚠</span> {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="fp-btn-primary"
                  style={{ marginTop: 18 }}
                  disabled={sending || alreadyUsedToday}
                >
                  {sending ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <RefreshCw size={15} className="fp-spin" />
                      Sending…
                    </span>
                  ) : "Send reset link"}
                </button>
              </form>
            </>
          )}

          {/* ── Divider ── */}
          <div className="fp-divider" />

          {/* ── Password generator ── */}
          <div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 12px", fontWeight: 500 }}>
              Need a new password? Generate one instantly:
            </p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "0 0 12px" }}>
              Letters only — no numbers or special characters
            </p>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button
                className="fp-btn-ghost"
                onClick={() => { setGeneratedPw(generatePassword()); setCopied(false); }}
                style={{ flex: 1, justifyContent: "center" }}
              >
                <RefreshCw size={13} />
                Generate password
              </button>
            </div>

            {generatedPw && (
              <div className="fp-pw-box">
                {/* Show/hide toggle */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: 1 }}>
                    Generated password
                  </p>
                  <code style={{
                    color: "#1d9bf0",
                    fontSize: showPw ? 18 : 14,
                    letterSpacing: showPw ? 2 : 4,
                    fontWeight: 700,
                    wordBreak: "break-all",
                    filter: showPw ? "none" : "blur(5px)",
                    transition: "filter 0.2s, font-size 0.2s",
                    userSelect: showPw ? "text" : "none",
                    display: "block",
                  }}>
                    {generatedPw}
                  </code>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => setShowPw(v => !v)}
                    style={{
                      background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8, padding: "6px 10px", color: "rgba(255,255,255,0.6)",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                  >
                    {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                    {showPw ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={copyPassword}
                    style={{
                      background: copied ? "rgba(29,155,240,0.15)" : "rgba(255,255,255,0.07)",
                      border: `1px solid ${copied ? "rgba(29,155,240,0.4)" : "rgba(255,255,255,0.12)"}`,
                      borderRadius: 8, padding: "6px 10px",
                      color: copied ? "#1d9bf0" : "rgba(255,255,255,0.6)",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12,
                      transition: "all 0.15s",
                    }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            )}

            {generatedPw && (
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 8 }}>
                💡 Save this password somewhere safe — it won't be shown again once you leave this page.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}