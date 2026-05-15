"use client";
import React, { useState, useEffect, useRef } from "react";
import { Globe, X, ArrowLeft, CheckCircle, RefreshCw, Phone } from "lucide-react";
// import {
//   RecaptchaVerifier,
//   signInWithPhoneNumber,
//   type ConfirmationResult,
// } from "firebase/auth";
//import { secondaryAuth } from "@/context/firebase";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axiosInstance";
import { LANGUAGES, type Language, t } from "@/lib/i18n";

const STYLES = `
  @keyframes ls-fadeIn  { from { opacity:0 } to { opacity:1 } }
  @keyframes ls-slideUp {
    from { opacity:0; transform:translateY(20px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes ls-shake {
    0%,100% { transform:translateX(0) }
    20%     { transform:translateX(-6px) }
    60%     { transform:translateX(6px) }
  }
  @keyframes ls-spin { to { transform:rotate(360deg) } }
  @keyframes ls-success {
    0%   { transform:scale(0.7); opacity:0 }
    60%  { transform:scale(1.1) }
    100% { transform:scale(1); opacity:1 }
  }

  .ls-overlay {
    position:fixed; inset:0; z-index:2000;
    background:rgba(0,0,0,0.78);
    backdrop-filter:blur(10px);
    display:flex; align-items:center; justify-content:center;
    padding:16px;
    animation:ls-fadeIn 0.2s ease both;
  }
  .ls-card {
    width:100%; max-width:420px;
    background:#0f0f0f;
    border:1px solid rgba(255,255,255,0.1);
    border-radius:22px;
    padding:28px 24px;
    animation:ls-slideUp 0.32s cubic-bezier(0.22,1,0.36,1) both;
    font-family:'DM Sans',sans-serif;
    position:relative;
  }
  .ls-close {
    position:absolute; top:16px; right:16px;
    background:none; border:none; color:rgba(255,255,255,0.4);
    cursor:pointer; padding:6px; border-radius:50%;
    transition:background 0.15s,color 0.15s;
    display:flex; align-items:center; justify-content:center;
  }
  .ls-close:hover { background:rgba(255,255,255,0.08); color:#fff; }

  .ls-lang-grid {
    display:grid; grid-template-columns:1fr 1fr;
    gap:10px; margin-top:18px;
  }
  .ls-lang-btn {
    display:flex; align-items:center; gap:10px;
    padding:12px 14px; border-radius:14px;
    border:1.5px solid rgba(255,255,255,0.1);
    background:rgba(255,255,255,0.04);
    color:rgba(255,255,255,0.85);
    font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600;
    cursor:pointer; transition:all 0.15s ease; text-align:left;
  }
  .ls-lang-btn:hover { background:rgba(29,155,240,0.1); border-color:rgba(29,155,240,0.35); color:#fff; }
  .ls-lang-btn.active {
    background:rgba(29,155,240,0.15); border-color:#1d9bf0; color:#fff;
  }
  .ls-lang-btn .ls-flag { font-size:22px; }
  .ls-lang-btn .ls-names { display:flex; flex-direction:column; gap:1px; }
  .ls-lang-btn .ls-native { font-size:11px; color:rgba(255,255,255,0.4); font-weight:500; }

  .ls-input {
    width:100%; padding:12px 14px; border-radius:12px;
    background:rgba(255,255,255,0.06);
    border:1.5px solid rgba(255,255,255,0.1);
    color:#fff; font-family:'DM Sans',sans-serif; font-size:15px;
    outline:none; transition:border-color 0.15s,box-shadow 0.15s;
    caret-color:#1d9bf0;
  }
  .ls-input::placeholder { color:rgba(255,255,255,0.3); }
  .ls-input:focus {
    border-color:rgba(29,155,240,0.6);
    box-shadow:0 0 0 3px rgba(29,155,240,0.12);
  }
  .ls-input.error {
    border-color:#ef4444;
    box-shadow:0 0 0 3px rgba(239,68,68,0.12);
    animation:ls-shake 0.35s ease both;
  }

  .ls-btn {
    width:100%; padding:13px; border-radius:9999px; border:none;
    background:linear-gradient(135deg,#1d9bf0,#0e7fd8);
    color:#fff; font-family:'DM Sans',sans-serif;
    font-size:15px; font-weight:700; cursor:pointer;
    transition:transform 0.15s,box-shadow 0.15s,opacity 0.15s;
    display:flex; align-items:center; justify-content:center; gap:8px;
  }
  .ls-btn:hover:not(:disabled) {
    transform:translateY(-1px);
    box-shadow:0 6px 24px rgba(29,155,240,0.4);
  }
  .ls-btn:disabled { opacity:0.45; cursor:not-allowed; }
  .ls-btn-outline {
    width:100%; padding:11px; border-radius:9999px;
    border:1px solid rgba(255,255,255,0.2);
    background:transparent; color:rgba(255,255,255,0.7);
    font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600;
    cursor:pointer; transition:background 0.15s;
  }
  .ls-btn-outline:hover { background:rgba(255,255,255,0.07); }

  .ls-otp-row {
    display:flex; gap:10px; justify-content:center; margin:22px 0;
  }
  .ls-otp-digit {
    width:48px; height:56px;
    background:rgba(255,255,255,0.06);
    border:1.5px solid rgba(255,255,255,0.12);
    border-radius:12px; color:#fff;
    font-size:22px; font-weight:700; text-align:center;
    font-family:'DM Sans',sans-serif; outline:none;
    transition:border-color 0.15s,box-shadow 0.15s;
    caret-color:#1d9bf0;
  }
  .ls-otp-digit:focus {
    border-color:#1d9bf0;
    box-shadow:0 0 0 3px rgba(29,155,240,0.18);
  }
  .ls-otp-digit.filled { border-color:rgba(29,155,240,0.5); }
  .ls-otp-digit.error  {
    border-color:#ef4444;
    box-shadow:0 0 0 3px rgba(239,68,68,0.15);
    animation:ls-shake 0.35s ease both;
  }

  .ls-error-msg { color:#ef4444; font-size:13px; text-align:center; margin-top:8px; }
  .ls-info-msg  { color:rgba(255,255,255,0.4); font-size:13px; text-align:center; }
  .ls-spin-icon { animation:ls-spin 0.8s linear infinite; }
  .ls-success-icon { animation:ls-success 0.4s cubic-bezier(0.22,1,0.36,1) both; }
`;

// ── Step types ────────────────────────────────────────────────────────────────
type Step = "picker" | "phone" | "phone-otp" | "email-otp" | "success";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const { user }          = useAuth();

  const [open,       setOpen]       = useState(false);
  const [step,       setStep]       = useState<Step>("picker");
  const [targetLang, setTargetLang] = useState<Language | null>(null);

  // Phone flow state
  const [phone,        setPhone]        = useState("");
  const [phoneError,   setPhoneError]   = useState("");
  const [sending,      setSending]      = useState(false);
  // const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  // const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  // const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // OTP state (shared between phone + email flows)
  const [digits,    setDigits]    = useState(["","","","","",""]);
  const [verifying, setVerifying] = useState(false);
  const [otpError,  setOtpError]  = useState("");
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Reset state when modal closes
  // REPLACE the cleanup useEffect:
useEffect(() => {
  if (!open) {
    setTimeout(() => {
      setStep("picker");
      setTargetLang(null);
      setPhone("");
      setPhoneError("");
      setDigits(["","","","","",""]);
      setOtpError("");
      setSending(false);
      setVerifying(false);
    }, 300);
  }
}, [open]);

  // ── Language selected ───────────────────────────────────────────────────────
  const handleSelectLang = (code: Language) => {
    if (code === lang) { setOpen(false); return; }
    if (code === "en") { setLang("en"); setOpen(false); return; }

    setTargetLang(code);

    if (code === "fr") {
      // French → email OTP
      sendEmailOtp();
      setStep("email-otp");
    } else {
      // Other languages → phone OTP
      setStep("phone");
    }
  };

  // ── Email OTP (French) ──────────────────────────────────────────────────────
  const sendEmailOtp = async () => {
    try {
      await axiosInstance.post("/send-otp");
      setCountdown(60);
    } catch (err) {
      console.error("Failed to send email OTP:", err);
    }
  };

  const verifyEmailOtp = async (code: string) => {
    setVerifying(true);
    setOtpError("");
    try {
      await axiosInstance.post("/verify-otp", { otp: code });
      applyLanguageChange();
    } catch {
      setOtpError("Incorrect code. Please try again.");
      setDigits(["","","","","",""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  // ── Phone OTP (non-French, non-English) ─────────────────────────────────────
  // const initRecaptcha = () => {
  //   if (recaptchaRef.current) return; // already initialized
  //   if (!recaptchaContainerRef.current) return;

  //   recaptchaRef.current = new RecaptchaVerifier(
  //     secondaryAuth,
  //     recaptchaContainerRef.current,
  //     {
  //       size:     "invisible",
  //       callback: () => {},
  //     }
  //   );
  // };

 // REPLACE sendPhoneOtp:
const sendPhoneOtp = async () => {
  const cleaned = phone.trim();
  if (!cleaned) { setPhoneError("Phone number is required"); return; }

  // Accept formats: 9876543210 or +91 9876543210
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 10) {
    setPhoneError("Enter a valid 10-digit Indian mobile number");
    return;
  }

  setSending(true);
  setPhoneError("");

  try {
    await axiosInstance.post("/send-sms-otp", { phone: digits.slice(-10) });
    setStep("phone-otp");
    setCountdown(60);
  } catch (err: any) {
    setPhoneError(err?.response?.data?.detail || "Failed to send OTP. Try again.");
  } finally {
    setSending(false);
  }
};

// REPLACE verifyPhoneOtp:
const verifyPhoneOtp = async (code: string) => {
  const digits = phone.trim().replace(/\D/g, "").slice(-10);
  setVerifying(true);
  setOtpError("");
  try {
    await axiosInstance.post("/verify-sms-otp", { phone: digits, otp: code });
    applyLanguageChange();
  } catch {
    setOtpError("Incorrect code. Please try again.");
    setDigits(["","","","","",""]);
    inputRefs.current[0]?.focus();
  } finally {
    setVerifying(false);
  }
};

  // ── Apply verified language change ──────────────────────────────────────────
  const applyLanguageChange = () => {
    if (targetLang) setLang(targetLang);
    setStep("success");
    setTimeout(() => setOpen(false), 1400);
  };

  // ── OTP input handlers (shared) ─────────────────────────────────────────────
  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setOtpError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (value && index === 5) {
      const code = [...newDigits.slice(0,5), value.slice(-1)].join("");
      if (code.length === 6) submitOtp(code);
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
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

  const submitOtp = (code: string) => {
    if (step === "email-otp") verifyEmailOtp(code);
    else verifyPhoneOtp(code);
  };

  const currentCode = digits.join("");

  // ── Render ──────────────────────────────────────────────────────────────────
  const selectedLangMeta = LANGUAGES.find(l => l.code === lang);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* ── Invisible reCAPTCHA container ── */}
      {/* <div ref={recaptchaContainerRef} id="ls-recaptcha" style={{ display: "none" }} /> */}

      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", padding: "10px 12px", borderRadius: 12,
          background: "transparent", border: "none",
          color: "rgba(255,255,255,0.7)", cursor: "pointer",
          fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 500,
          transition: "background 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <Globe size={20} />
        <span>{selectedLangMeta?.flag} {selectedLangMeta?.nativeName}</span>
      </button>

      {/* ── Modal ── */}
      {open && (
        <div className="ls-overlay" onClick={() => setOpen(false)}>
          <div className="ls-card" onClick={e => e.stopPropagation()}>

            {/* Close */}
            <button className="ls-close" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>

            {/* ════ Step: Picker ════ */}
            {step === "picker" && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <Globe size={20} color="#1d9bf0" />
                  <h2 style={{ color: "#fff", margin: 0, fontSize: 18, fontWeight: 800 }}>
                    {t(lang, "selectLanguage")}
                  </h2>
                </div>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>
                  French requires email OTP · Others require phone OTP
                </p>

                <div className="ls-lang-grid">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      className={`ls-lang-btn${lang === l.code ? " active" : ""}`}
                      onClick={() => handleSelectLang(l.code)}
                    >
                      <span className="ls-flag">{l.flag}</span>
                      <div className="ls-names">
                        <span>{l.label}</span>
                        <span className="ls-native">{l.nativeName}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ════ Step: Enter Phone ════ */}
            {step === "phone" && (
              <>
                <button
                  onClick={() => setStep("picker")}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 16, padding: 0, fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}
                >
                  <ArrowLeft size={15} /> Back
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(29,155,240,0.1)", border: "1px solid rgba(29,155,240,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Phone size={20} color="#1d9bf0" />
                  </div>
                  <div>
                    <h2 style={{ color: "#fff", margin: 0, fontSize: 18, fontWeight: 800 }}>Verify phone</h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: 13 }}>
                      Switching to {LANGUAGES.find(l => l.code === targetLang)?.flag} {LANGUAGES.find(l => l.code === targetLang)?.label}
                    </p>
                  </div>
                </div>

                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "12px 0 16px", lineHeight: 1.5 }}>
                  Enter your phone number with country code. We'll send a one-time code via SMS.
                </p>

                <input
                  className={`ls-input${phoneError ? " error" : ""}`}
                  type="tel"
                  placeholder="9876543210 (Indian mobile number)"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setPhoneError(""); }}
                  onKeyDown={e => e.key === "Enter" && sendPhoneOtp()}
                  autoFocus
                />
                {phoneError && <p className="ls-error-msg">{phoneError}</p>}

                {/* ── Hint box ── */}
                <div style={{
                  marginTop: 12, padding: "10px 14px", borderRadius: 10,
                  background: "rgba(29,155,240,0.06)",
                  border: "1px solid rgba(29,155,240,0.15)",
                }}>
                  <p style={{ color: "#1d9bf0", fontSize: 12, margin: 0, fontWeight: 600 }}>
                    📱 Enter your 10-digit Indian mobile number
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "4px 0 0" }}>
                    A real SMS will be sent to your number
                  </p>
                </div>

                <div style={{ marginTop: 16 }}>
                  <button className="ls-btn" onClick={sendPhoneOtp} disabled={sending || !phone.trim()}>
                    {sending
                      ? <><RefreshCw size={15} className="ls-spin-icon" /> Sending…</>
                      : "Send OTP"
                    }
                  </button>
                </div>
              </>
            )}

            {/* ════ Step: Phone OTP ════ */}
            {step === "phone-otp" && (
              <>
                <button
                  onClick={() => setStep("phone")}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 16, padding: 0, fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}
                >
                  <ArrowLeft size={15} /> Back
                </button>

                <h2 style={{ color: "#fff", margin: "0 0 6px", fontSize: 18, fontWeight: 800 }}>Enter SMS code</h2>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>
                  Code sent to <strong style={{ color: "rgba(255,255,255,0.7)" }}>{phone}</strong>
                </p>

                <div className="ls-otp-row" onPaste={handlePaste}>
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el; }}
                      className={`ls-otp-digit${otpError ? " error" : ""}${d ? " filled" : ""}`}
                      type="text" inputMode="numeric" maxLength={1}
                      value={d}
                      onChange={e => handleDigitChange(i, e.target.value)}
                      onKeyDown={e => handleDigitKeyDown(i, e)}
                      autoFocus={i === 0}
                      disabled={verifying}
                    />
                  ))}
                </div>

                {otpError && <p className="ls-error-msg">{otpError}</p>}

                <button
                  className="ls-btn"
                  onClick={() => submitOtp(currentCode)}
                  disabled={currentCode.length < 6 || verifying}
                  style={{ marginBottom: 10 }}
                >
                  {verifying
                    ? <><RefreshCw size={15} className="ls-spin-icon" /> Verifying…</>
                    : t(lang, "verifyOtp")
                  }
                </button>

                <div style={{ textAlign: "center" }}>
                  {countdown > 0
                    ? <p className="ls-info-msg">Resend in <strong style={{ color: "rgba(255,255,255,0.5)" }}>{countdown}s</strong></p>
                    : <button className="ls-btn-outline" onClick={() => { setStep("phone"); }}>
                        Resend code
                      </button>
                  }
                </div>
              </>
            )}

            {/* ════ Step: Email OTP (French) ════ */}
            {step === "email-otp" && (
              <>
                <button
                  onClick={() => setStep("picker")}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 16, padding: 0, fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}
                >
                  <ArrowLeft size={15} /> Back
                </button>

                <h2 style={{ color: "#fff", margin: "0 0 6px", fontSize: 18, fontWeight: 800 }}>
                  🇫🇷 Verify email
                </h2>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>
                  Code sent to <strong style={{ color: "rgba(255,255,255,0.7)" }}>{user?.email}</strong>
                </p>

                <div className="ls-otp-row" onPaste={handlePaste}>
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el; }}
                      className={`ls-otp-digit${otpError ? " error" : ""}${d ? " filled" : ""}`}
                      type="text" inputMode="numeric" maxLength={1}
                      value={d}
                      onChange={e => handleDigitChange(i, e.target.value)}
                      onKeyDown={e => handleDigitKeyDown(i, e)}
                      autoFocus={i === 0}
                      disabled={verifying}
                    />
                  ))}
                </div>

                {otpError && <p className="ls-error-msg">{otpError}</p>}

                <button
                  className="ls-btn"
                  onClick={() => submitOtp(currentCode)}
                  disabled={currentCode.length < 6 || verifying}
                  style={{ marginBottom: 10 }}
                >
                  {verifying
                    ? <><RefreshCw size={15} className="ls-spin-icon" /> Verifying…</>
                    : t(lang, "verifyOtp")
                  }
                </button>

                <div style={{ textAlign: "center" }}>
                  {countdown > 0
                    ? <p className="ls-info-msg">Resend in <strong style={{ color: "rgba(255,255,255,0.5)" }}>{countdown}s</strong></p>
                    : <button className="ls-btn-outline" onClick={() => { sendEmailOtp(); setCountdown(60); }}>
                        Resend email
                      </button>
                  }
                </div>
              </>
            )}

            {/* ════ Step: Success ════ */}
            {step === "success" && (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <CheckCircle
                  size={52} color="#1d9bf0"
                  className="ls-success-icon"
                  style={{ margin: "0 auto 16px", display: "block" }}
                />
                <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>
                  Language changed!
                </h2>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, margin: 0 }}>
                  {LANGUAGES.find(l => l.code === targetLang)?.flag}{" "}
                  Now showing in {LANGUAGES.find(l => l.code === targetLang)?.label}
                </p>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}