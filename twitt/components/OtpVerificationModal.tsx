"use client";
import React, { useState, useRef, useEffect } from "react";
import { Shield, X, RefreshCw, CheckCircle } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";

const STYLES = `
  @keyframes otp-fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes otp-slideUp {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes otp-shake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-8px); }
    60%     { transform: translateX(8px); }
  }
  @keyframes otp-success {
    0%   { transform: scale(0.8); opacity: 0; }
    60%  { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes otp-spin { to { transform: rotate(360deg); } }

  .otp-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
    animation: otp-fadeIn 0.2s ease both;
  }
  .otp-card {
    width: 100%; max-width: 400px;
    background: #0f0f0f;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px;
    padding: 32px 28px;
    animation: otp-slideUp 0.35s cubic-bezier(0.22,1,0.36,1) both;
    font-family: 'DM Sans', sans-serif;
    position: relative;
  }
  .otp-input-row {
    display: flex; gap: 10px; justify-content: center;
    margin: 24px 0;
  }
  .otp-digit {
    width: 48px; height: 56px;
    background: rgba(255,255,255,0.06);
    border: 1.5px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    color: #fff; font-size: 22px; font-weight: 700;
    text-align: center; outline: none;
    font-family: 'DM Sans', sans-serif;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    caret-color: #1d9bf0;
  }
  .otp-digit:focus {
    border-color: #1d9bf0;
    box-shadow: 0 0 0 3px rgba(29,155,240,0.18);
    background: rgba(29,155,240,0.06);
  }
  .otp-digit.error {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239,68,68,0.15);
    animation: otp-shake 0.35s ease both;
  }
  .otp-digit.filled {
    border-color: rgba(29,155,240,0.5);
    background: rgba(29,155,240,0.06);
  }
  .otp-btn {
    width: 100%; padding: 13px 0; border-radius: 9999px; border: none;
    background: linear-gradient(135deg, #1d9bf0, #0e7fd8);
    color: #fff; font-family: 'DM Sans', sans-serif;
    font-size: 15px; font-weight: 700; cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
  }
  .otp-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(29,155,240,0.4);
  }
  .otp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .otp-resend {
    background: none; border: none; color: #1d9bf0;
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    font-weight: 600; cursor: pointer;
    transition: color 0.15s; padding: 0;
  }
  .otp-resend:hover { color: #1a8cd8; }
  .otp-resend:disabled { color: rgba(255,255,255,0.25); cursor: not-allowed; }
  .otp-spin { animation: otp-spin 0.8s linear infinite; }
  .otp-success-icon { animation: otp-success 0.4s cubic-bezier(0.22,1,0.36,1) both; }
`;

interface Props {
  isOpen:  boolean;
  onClose: () => void;     // called after successful verification
  onLogout: () => void;    // called if user dismisses without verifying
}

export default function OtpVerificationModal({ isOpen, onClose, onLogout }: Props) {
  const [digits, setDigits]       = useState(["", "", "", "", "", ""]);
  const [error, setError]         = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess]     = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs                 = useRef<(HTMLInputElement | null)[]>([]);

  // Start countdown when modal opens
  useEffect(() => {
    if (isOpen) {
      setCountdown(60);
      setDigits(["", "", "", "", "", ""]);
      setError("");
      setSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;  // digits only
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1); // only last char
    setDigits(newDigits);
    setError("");

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all filled
    if (value && index === 5) {
      const code = [...newDigits.slice(0, 5), value.slice(-1)].join("");
      if (code.length === 6) submitOtp(code);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      const code = digits.join("");
      if (code.length === 6) submitOtp(code);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setDigits(text.split(""));
      inputRefs.current[5]?.focus();
      submitOtp(text);
    }
  };

  const submitOtp = async (code: string) => {
    setVerifying(true);
    setError("");
    try {
      await axiosInstance.post("/verify-otp", { otp: code });
      setSuccess(true);
      setTimeout(() => onClose(), 1200);
    } catch {
      setError("Incorrect code. Please try again.");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const resendOtp = async () => {
    setResending(true);
    setError("");
    setDigits(["", "", "", "", "", ""]);
    try {
      await axiosInstance.post("/send-otp");
      setCountdown(60);
      inputRefs.current[0]?.focus();
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const code = digits.join("");

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="otp-overlay">
        <div className="otp-card">

          {/* Close — logs user out if dismissed */}
          <button
            onClick={onLogout}
            style={{
              position: "absolute", top: 16, right: 16,
              background: "none", border: "none", color: "rgba(255,255,255,0.4)",
              cursor: "pointer", padding: 4, borderRadius: "50%",
              transition: "color 0.15s, background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            <X size={18} />
          </button>

          {success ? (
            /* ── Success state ── */
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <CheckCircle
                size={52} color="#1d9bf0"
                className="otp-success-icon"
                style={{ margin: "0 auto 16px", display: "block" }}
              />
              <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>
                Identity verified
              </h2>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, margin: 0 }}>
                Welcome back!
              </p>
            </div>
          ) : (
            <>
              {/* Icon + header */}
              <div style={{ textAlign: "center", marginBottom: 4 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: "rgba(29,155,240,0.1)",
                  border: "1px solid rgba(29,155,240,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                }}>
                  <Shield size={24} color="#1d9bf0" />
                </div>
                <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>
                  Verify your identity
                </h2>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                  Chrome requires extra verification. We've sent a 6-digit code to your registered email.
                </p>
              </div>

              {/* OTP inputs */}
              <div className="otp-input-row" onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    className={`otp-digit${error ? " error" : ""}${d ? " filled" : ""}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    autoFocus={i === 0}
                    disabled={verifying || success}
                  />
                ))}
              </div>

              {error && (
                <p style={{
                  color: "#ef4444", fontSize: 13, textAlign: "center",
                  margin: "-12px 0 16px",
                }}>
                  {error}
                </p>
              )}

              {/* Verify button */}
              <button
                className="otp-btn"
                onClick={() => submitOtp(code)}
                disabled={code.length < 6 || verifying}
              >
                {verifying ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <RefreshCw size={15} className="otp-spin" />
                    Verifying…
                  </span>
                ) : "Verify"}
              </button>

              {/* Resend */}
              <div style={{ textAlign: "center", marginTop: 16 }}>
                {countdown > 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, margin: 0 }}>
                    Resend code in <strong style={{ color: "rgba(255,255,255,0.5)" }}>{countdown}s</strong>
                  </p>
                ) : (
                  <button className="otp-resend" onClick={resendOtp} disabled={resending}>
                    {resending ? "Sending…" : "Resend code"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}