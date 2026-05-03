"use client";

import React, { useState, useEffect } from "react";
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react";
import LoadingSpinner from "./loading-spinner";
import { useAuth } from "@/context/AuthContext";
import TwitterLogo from "./Twitterlogo";
import Link from "next/link";

/* ─────────────────────────────────────────────────────────────
   Interfaces — unchanged
───────────────────────────────────────────────────────────── */
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
}

/* ─────────────────────────────────────────────────────────────
   Scoped styles
───────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  /* Overlay enter/exit */
  @keyframes am-overlay-in  { from { opacity:0 } to { opacity:1 } }
  @keyframes am-overlay-out { from { opacity:1 } to { opacity:0 } }

  /* Card spring enter */
  @keyframes am-card-in {
    0%   { opacity:0; transform:scale(0.88) translateY(28px); }
    60%  { opacity:1; transform:scale(1.02) translateY(-4px); }
    100% { opacity:1; transform:scale(1)    translateY(0);    }
  }
  @keyframes am-card-out {
    from { opacity:1; transform:scale(1)    translateY(0);  }
    to   { opacity:0; transform:scale(0.93) translateY(18px); }
  }

  /* Field stagger */
  @keyframes am-field-in {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:translateY(0); }
  }

  /* Shake on error */
  @keyframes am-shake {
    0%,100% { transform:translateX(0); }
    20%      { transform:translateX(-7px); }
    40%      { transform:translateX(7px); }
    60%      { transform:translateX(-5px); }
    80%      { transform:translateX(5px); }
  }

  /* Logo glow pulse */
  @keyframes am-logo-glow {
    0%,100% { filter:drop-shadow(0 0 8px rgba(29,155,240,0.4)); }
    50%      { filter:drop-shadow(0 0 22px rgba(29,155,240,0.8)); }
  }

  /* Shimmer on submit button */
  @keyframes am-shimmer {
    0%   { background-position:-200% center; }
    100% { background-position: 200% center; }
  }

  /* Mode-switch slide */
  @keyframes am-slide-left  { from{opacity:0;transform:translateX(20px)}  to{opacity:1;transform:translateX(0)} }
  @keyframes am-slide-right { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }

  .am-overlay {
    position:fixed; inset:0; z-index:50;
    display:flex; align-items:center; justify-content:center;
    padding:16px;
    background:rgba(0,0,0,0.75);
    backdrop-filter:blur(6px);
    -webkit-backdrop-filter:blur(6px);
    animation:am-overlay-in 0.22s ease both;
  }
  .am-overlay.closing { animation:am-overlay-out 0.2s ease forwards; }

  /* Ambient orb behind card */
  .am-orb {
    position:absolute;
    top:-100px; left:50%; transform:translateX(-50%);
    width:500px; height:500px; border-radius:50%;
    background:radial-gradient(circle, rgba(29,155,240,0.12) 0%, transparent 65%);
    pointer-events:none;
  }

  .am-card {
    position:relative;
    width:100%; max-width:440px;
    background:#0a0a0a;
    border:1px solid rgba(255,255,255,0.09);
    border-radius:24px;
    overflow:hidden;
    box-shadow:0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(29,155,240,0.08);
    animation:am-card-in 0.45s cubic-bezier(.22,.68,0,1.2) both;
    font-family:'DM Sans',sans-serif;
  }
  .am-card.closing { animation:am-card-out 0.22s ease forwards; }
  .am-card.shake   { animation:am-shake 0.4s ease; }

  /* Top gradient accent */
  .am-card-accent {
    position:absolute; top:0; left:0; right:0; height:2px;
    background:linear-gradient(90deg,transparent,#1d9bf0 40%,#60c8ff 60%,transparent);
  }

  /* Header */
  .am-header {
    padding:28px 28px 0;
    display:flex; flex-direction:column; align-items:center; gap:16px;
    position:relative;
  }
  .am-close-btn {
    position:absolute; top:0; right:0;
    width:36px; height:36px; border-radius:50%;
    border:1px solid rgba(255,255,255,0.09);
    background:rgba(255,255,255,0.04);
    color:rgba(255,255,255,0.6);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer;
    transition:background .15s, color .15s, transform .15s, border-color .15s;
  }
  .am-close-btn:hover {
    background:rgba(255,255,255,0.1);
    color:#fff;
    border-color:rgba(255,255,255,0.2);
    transform:scale(1.08) rotate(90deg);
  }
  .am-logo-wrap {
    animation:am-logo-glow 3.5s ease-in-out infinite;
  }
  .am-title {
    font-family:'Syne',sans-serif;
    font-size:1.45rem; font-weight:800;
    letter-spacing:-0.025em;
    color:#fff;
    text-align:center;
  }
  .am-subtitle {
    font-size:0.8rem;
    color:rgba(255,255,255,0.35);
    text-align:center;
    margin-top:-8px;
  }

  /* Body */
  .am-body {
    padding:22px 28px 28px;
    display:flex; flex-direction:column; gap:16px;
  }

  /* Error banner */
  @keyframes am-err-in {
    from { opacity:0; transform:translateY(-6px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  .am-error-banner {
    display:flex; align-items:flex-start; gap:10px;
    background:rgba(239,68,68,0.08);
    border:1px solid rgba(239,68,68,0.28);
    border-radius:12px; padding:12px 14px;
    animation:am-err-in 0.25s ease both;
  }
  .am-error-banner span {
    font-size:0.82rem; color:#fca5a5; line-height:1.5;
  }

  /* Form */
  .am-form { display:flex; flex-direction:column; gap:14px; }

  /* Field */
  .am-field { display:flex; flex-direction:column; gap:5px; }
  .am-field.stagger-0 { animation:am-field-in 0.3s ease 0.05s both; }
  .am-field.stagger-1 { animation:am-field-in 0.3s ease 0.12s both; }
  .am-field.stagger-2 { animation:am-field-in 0.3s ease 0.19s both; }
  .am-field.stagger-3 { animation:am-field-in 0.3s ease 0.26s both; }

  .am-label {
    font-size:0.78rem; font-weight:600;
    color:rgba(255,255,255,0.55);
    letter-spacing:0.04em; text-transform:uppercase;
  }
  .am-input-wrap {
    position:relative;
    display:flex; align-items:center;
  }
  .am-input-icon {
    position:absolute; left:14px;
    color:rgba(255,255,255,0.28);
    pointer-events:none;
    transition:color .2s;
    display:flex;
  }
  .am-input-wrap:focus-within .am-input-icon { color:#1d9bf0; }

  .am-input {
    width:100%; height:46px;
    padding:0 42px;
    background:rgba(255,255,255,0.04);
    border:1px solid rgba(255,255,255,0.09);
    border-radius:12px;
    color:#fff;
    font-family:'DM Sans',sans-serif;
    font-size:0.92rem;
    outline:none;
    transition:background .2s, border-color .2s, box-shadow .2s;
    caret-color:#1d9bf0;
  }
  .am-input::placeholder { color:rgba(255,255,255,0.22); }
  .am-input:focus {
    background:rgba(255,255,255,0.07);
    border-color:rgba(29,155,240,0.6);
    box-shadow:0 0 0 3px rgba(29,155,240,0.12);
  }
  .am-input:disabled { opacity:0.5; cursor:not-allowed; }
  .am-input.has-error {
    border-color:rgba(239,68,68,0.5);
    box-shadow:0 0 0 3px rgba(239,68,68,0.08);
  }

  /* at-sign prefix for username */
  .am-input.at-pad { padding-left:30px; }
  .am-at-sign {
    position:absolute; left:12px;
    color:rgba(255,255,255,0.28);
    font-size:0.9rem; font-weight:500;
    pointer-events:none;
    transition:color .2s;
  }
  .am-input-wrap:focus-within .am-at-sign { color:#1d9bf0; }

  /* Eye toggle */
  .am-eye-btn {
    position:absolute; right:10px;
    background:none; border:none; cursor:pointer;
    color:rgba(255,255,255,0.28);
    display:flex; padding:6px;
    border-radius:6px;
    transition:color .15s, background .15s;
  }
  .am-eye-btn:hover {
    color:rgba(255,255,255,0.7);
    background:rgba(255,255,255,0.07);
  }

  /* Field error text */
  @keyframes am-ferr-in {
    from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)}
  }
  .am-field-err {
    font-size:0.75rem; color:#f87171;
    display:flex; align-items:center; gap:4px;
    animation:am-ferr-in 0.2s ease both;
  }

  /* Submit button */
  .am-submit-btn {
    width:100%; height:48px;
    border-radius:9999px; border:none;
    background:linear-gradient(135deg,#1d9bf0 0%,#0e7fd8 100%);
    background-size:200% 100%;
    color:#fff;
    font-family:'DM Sans',sans-serif;
    font-weight:700; font-size:0.95rem;
    cursor:pointer;
    transition:transform .15s, box-shadow .15s, opacity .15s;
    display:flex; align-items:center; justify-content:center; gap:8px;
    letter-spacing:0.01em;
    margin-top:4px;
  }
  .am-submit-btn:hover:not(:disabled) {
    transform:translateY(-1px);
    box-shadow:0 6px 24px rgba(29,155,240,0.45);
    animation:am-shimmer 0.7s linear;
  }
  .am-submit-btn:active:not(:disabled) { transform:translateY(0); box-shadow:none; }
  .am-submit-btn:disabled {
    background:rgba(255,255,255,0.08);
    color:rgba(255,255,255,0.25);
    cursor:not-allowed;
  }

  /* Divider */
  .am-divider {
    display:flex; align-items:center; gap:12px;
  }
  .am-divider-line {
    flex:1; height:1px;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent);
  }
  .am-divider-text {
    font-size:0.72rem; font-weight:600;
    color:rgba(255,255,255,0.3);
    letter-spacing:0.1em;
    text-transform:uppercase;
  }

  /* Mode switch */
  .am-mode-row {
    text-align:center;
    font-size:0.85rem;
    color:rgba(255,255,255,0.4);
  }
  .am-mode-btn {
    background:none; border:none; cursor:pointer;
    color:#1d9bf0; font-weight:700;
    font-family:'DM Sans',sans-serif; font-size:0.85rem;
    padding:0 4px; margin-left:2px;
    transition:color .15s;
    text-decoration:underline; text-underline-offset:2px;
    text-decoration-color:transparent;
    transition:color .15s, text-decoration-color .15s;
  }
  .am-mode-btn:hover { color:#60c8ff; text-decoration-color:#60c8ff; }
  .am-mode-btn:disabled { opacity:0.4; cursor:not-allowed; }

  /* Terms note */
  .am-terms {
    text-align:center;
    font-size:0.7rem;
    color:rgba(255,255,255,0.25);
    line-height:1.6;
  }
  .am-terms a { color:rgba(29,155,240,0.7); text-decoration:none; }
  .am-terms a:hover { color:#1d9bf0; }

  /* Slide animation classes applied on mode switch */
  .am-form-slide-left  { animation:am-slide-left  0.25s ease both; }
  .am-form-slide-right { animation:am-slide-right 0.25s ease both; }
`;

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */
export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
}: AuthModalProps) {
  /* ── All original logic preserved exactly ── */
  const { login, signup, isLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    displayName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* UI-only state */
  const [closing, setClosing] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);

  /* Sync initialMode prop */
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  /* Re-open resets closing flag */
  useEffect(() => {
    if (isOpen) setClosing(false);
  }, [isOpen]);

  if (!isOpen) return null;

  /* Animated close */
  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (mode === "signup") {
      if (!formData.username.trim()) {
        newErrors.username = "Username is required";
      } else if (formData.username.length < 3) {
        newErrors.username = "Username must be at least 3 characters";
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username =
          "Username can only contain letters, numbers, and underscores";
      }
      if (!formData.displayName.trim()) {
        newErrors.displayName = "Display name is required";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isLoading) {
      /* Shake card on validation fail */
      setShaking(true);
      setTimeout(() => setShaking(false), 420);
      return;
    }
    try {
      if (mode === "login") {
        await login(formData.email, formData.password);
      } else {
        await signup(
          formData.email,
          formData.password,
          formData.username,
          formData.displayName
        );
      }
      onClose();
      setFormData({ email: "", password: "", username: "", displayName: "" });
      setErrors({});
    } catch (error) {
      setErrors({ general: "Authentication failed. Please try again." });
      setShaking(true);
      setTimeout(() => setShaking(false), 420);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const switchMode = () => {
    const next = mode === "login" ? "signup" : "login";
    setSlideDir(next === "signup" ? "left" : "right");
    setMode(next);
    setErrors({});
    setFormData({ email: "", password: "", username: "", displayName: "" });
    setTimeout(() => setSlideDir(null), 300);
  };
  /* ── End original logic ── */

  const isSignup = mode === "signup";
  const slideClass = slideDir === "left"
    ? "am-form-slide-left"
    : slideDir === "right"
    ? "am-form-slide-right"
    : "";

  /* Field stagger index */
  let fieldIdx = 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Overlay */}
      <div
        className={`am-overlay${closing ? " closing" : ""}`}
        onClick={(e) => e.target === e.currentTarget && handleClose()}
        role="dialog"
        aria-modal="true"
        aria-label={isSignup ? "Create account" : "Sign in"}
      >
        {/* Ambient orb */}
        <div className="am-orb" aria-hidden />

        {/* Card */}
        <div className={`am-card${closing ? " closing" : ""}${shaking ? " shake" : ""}`}>
          {/* Top accent stripe */}
          <div className="am-card-accent" aria-hidden />

          {/* ── Header ── */}
          <div className="am-header">
            <button
              className="am-close-btn"
              onClick={handleClose}
              aria-label="Close"
              type="button"
            >
              <X size={16} strokeWidth={2.5} />
            </button>

            <div className="am-logo-wrap">
              <TwitterLogo size="xl" className="text-white" />
            </div>

            <div>
              <div className="am-title">
                {isSignup ? "Create your account" : "Sign in to X"}
              </div>
              <div className="am-subtitle">
                {isSignup
                  ? "Join the conversation today"
                  : "Welcome back — good to see you"}
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="am-body">
            {/* General error */}
            {errors.general && (
              <div className="am-error-banner">
                <AlertCircle
                  size={16}
                  style={{ color: "#f87171", flexShrink: 0, marginTop: 1 }}
                  strokeWidth={2}
                />
                <span>{errors.general}</span>
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className={`am-form ${slideClass}`}
              noValidate
            >
              {/* ── Sign-up only fields ── */}
              {isSignup && (
                <>
                  {/* Display name */}
                  <div className={`am-field stagger-${fieldIdx++}`}>
                    <label htmlFor="displayName" className="am-label">
                      Display Name
                    </label>
                    <div className="am-input-wrap">
                      <span className="am-input-icon">
                        <User size={16} strokeWidth={2} />
                      </span>
                      <input
                        id="displayName"
                        type="text"
                        placeholder="Your name"
                        value={formData.displayName}
                        onChange={(e) =>
                          handleInputChange("displayName", e.target.value)
                        }
                        className={`am-input${errors.displayName ? " has-error" : ""}`}
                        disabled={isLoading}
                        autoComplete="name"
                      />
                    </div>
                    {errors.displayName && (
                      <span className="am-field-err">
                        <AlertCircle size={12} strokeWidth={2} />
                        {errors.displayName}
                      </span>
                    )}
                  </div>

                  {/* Username */}
                  <div className={`am-field stagger-${fieldIdx++}`}>
                    <label htmlFor="username" className="am-label">
                      Username
                    </label>
                    <div className="am-input-wrap">
                      <span className="am-at-sign">@</span>
                      <input
                        id="username"
                        type="text"
                        placeholder="username"
                        value={formData.username}
                        onChange={(e) =>
                          handleInputChange("username", e.target.value)
                        }
                        className={`am-input at-pad${errors.username ? " has-error" : ""}`}
                        disabled={isLoading}
                        autoComplete="username"
                      />
                    </div>
                    {errors.username && (
                      <span className="am-field-err">
                        <AlertCircle size={12} strokeWidth={2} />
                        {errors.username}
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* Email */}
              <div className={`am-field stagger-${fieldIdx++}`}>
                <label htmlFor="email" className="am-label">
                  Email
                </label>
                <div className="am-input-wrap">
                  <span className="am-input-icon">
                    <Mail size={16} strokeWidth={2} />
                  </span>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`am-input${errors.email ? " has-error" : ""}`}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <span className="am-field-err">
                    <AlertCircle size={12} strokeWidth={2} />
                    {errors.email}
                  </span>
                )}
              </div>

              {/* Password */}
              <div className={`am-field stagger-${fieldIdx++}`}>
                <label htmlFor="password" className="am-label">
                  Password
                </label>
                <div className="am-input-wrap">
                  <span className="am-input-icon">
                    <Lock size={16} strokeWidth={2} />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={
                      isSignup ? "Min. 6 characters" : "Your password"
                    }
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={`am-input${errors.password ? " has-error" : ""}`}
                    style={{ paddingRight: "44px" }}
                    disabled={isLoading}
                    autoComplete={
                      isSignup ? "new-password" : "current-password"
                    }
                  />
                  <button
                    type="button"
                    className="am-eye-btn"
                    onClick={() => setShowPassword((p) => !p)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff size={16} strokeWidth={2} />
                    ) : (
                      <Eye size={16} strokeWidth={2} />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span className="am-field-err">
                    <AlertCircle size={12} strokeWidth={2} />
                    {errors.password}
                  </span>
                )}
              </div>

              {/* Forgot password — login mode only */}
              {!isSignup && (
                <div style={{ textAlign: "right", marginTop: 4 }}>
                  <Link
                    href="/forgot-password"
                    style={{
                      color: "#1d9bf0",
                      fontSize: 13,
                      textDecoration: "none",
                      fontWeight: 500,
                    }}
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="am-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>
                      {isSignup ? "Creating account…" : "Signing in…"}
                    </span>
                  </>
                ) : isSignup ? (
                  "Create account"
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="am-divider">
              <div className="am-divider-line" />
              <span className="am-divider-text">or</span>
              <div className="am-divider-line" />
            </div>

            {/* Mode switch */}
            <div className="am-mode-row">
              {isSignup
                ? "Already have an account?"
                : "Don't have an account?"}
              <button
                type="button"
                className="am-mode-btn"
                onClick={switchMode}
                disabled={isLoading}
              >
                {isSignup ? "Sign in" : "Sign up"}
              </button>
            </div>

            {/* Terms (sign-up only) */}
            {isSignup && (
              <div className="am-terms">
                By signing up you agree to our{" "}
                <a href="#">Terms of Service</a>,{" "}
                <a href="#">Privacy Policy</a> and{" "}
                <a href="#">Cookie Use</a>.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}