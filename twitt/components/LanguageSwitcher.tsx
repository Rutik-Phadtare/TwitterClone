"use client";
import React, { useState, useEffect, useRef } from "react";
import { Globe, X, ArrowLeft, CheckCircle, RefreshCw, Phone } from "lucide-react";
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
  .ls-input {
    width:100%; padding:12px 14px; border-radius:12px; box-sizing:border-box;
    background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.1);
    color:#fff; font-family:'DM Sans',sans-serif; font-size:15px;
    outline:none; transition:border-color 0.15s,box-shadow 0.15s; caret-color:#1d9bf0;
  }
  .ls-input::placeholder { color:rgba(255,255,255,0.3); }
  .ls-input:focus { border-color:rgba(29,155,240,0.6); box-shadow:0 0 0 3px rgba(29,155,240,0.12); }
  .ls-input.error { border-color:#ef4444; box-shadow:0 0 0 3px rgba(239,68,68,0.12); animation:ls-shake 0.35s ease both; }
  .ls-otp-digit {
    width:48px; height:56px; background:rgba(255,255,255,0.06);
    border:1.5px solid rgba(255,255,255,0.12); border-radius:12px; color:#fff;
    font-size:22px; font-weight:700; text-align:center;
    font-family:'DM Sans',sans-serif; outline:none;
    transition:border-color 0.15s,box-shadow 0.15s; caret-color:#1d9bf0;
  }
  .ls-otp-digit:focus { border-color:#1d9bf0; box-shadow:0 0 0 3px rgba(29,155,240,0.18); }
  .ls-otp-digit.filled { border-color:rgba(29,155,240,0.5); }
  .ls-otp-digit.error  { border-color:#ef4444; box-shadow:0 0 0 3px rgba(239,68,68,0.15); animation:ls-shake 0.35s ease both; }
  .ls-spin-icon    { animation:ls-spin 0.8s linear infinite; }
  .ls-success-icon { animation:ls-success 0.4s cubic-bezier(0.22,1,0.36,1) both; }
`;

type Step = "picker" | "phone" | "phone-otp" | "email-otp" | "success";

interface LanguageSwitcherProps {
  /** Controlled mode: Sidebar passes open state + close handler */
  isOpen?:   boolean;
  onClose?:  () => void;
  /** Trigger mode: renders only the button (Sidebar handles portal) */
  triggerOnly?: boolean;
}

export default function LanguageSwitcher({
  isOpen:    controlledOpen,
  onClose:   controlledClose,
  triggerOnly = false,
}: LanguageSwitcherProps) {
  const { lang, setLang } = useLanguage();
  const { user }          = useAuth();

  // Uncontrolled state (used when Sidebar doesn't control it)
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open         = isControlled ? controlledOpen! : internalOpen;
  const handleClose  = () => { isControlled ? controlledClose?.() : setInternalOpen(false); };
  const handleOpen   = () => { isControlled ? {} : setInternalOpen(true); };

  const [step,       setStep]       = useState<Step>("picker");
  const [targetLang, setTargetLang] = useState<Language | null>(null);
  const [phone,      setPhone]      = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [sending,    setSending]    = useState(false);
  const [digits,     setDigits]     = useState(["","","","","",""]);
  const [verifying,  setVerifying]  = useState(false);
  const [otpError,   setOtpError]   = useState("");
  const [countdown,  setCountdown]  = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("picker"); setTargetLang(null); setPhone(""); setPhoneError("");
        setDigits(["","","","","",""]); setOtpError(""); setSending(false); setVerifying(false);
      }, 300);
    }
  }, [open]);

  const handleSelectLang = (code: Language) => {
    if (code === lang) { handleClose(); return; }
    if (code === "en") { setLang("en"); handleClose(); return; }
    setTargetLang(code);
    if (code === "fr") { sendEmailOtp(); setStep("email-otp"); }
    else setStep("phone");
  };

  const sendEmailOtp = async () => {
    try { await axiosInstance.post("/send-otp"); setCountdown(60); }
    catch (err) { console.error(err); }
  };

  const verifyEmailOtp = async (code: string) => {
    setVerifying(true); setOtpError("");
    try { await axiosInstance.post("/verify-otp", { otp: code }); applyLanguageChange(); }
    catch { setOtpError("Incorrect code. Please try again."); setDigits(["","","","","",""]); inputRefs.current[0]?.focus(); }
    finally { setVerifying(false); }
  };

  const sendPhoneOtp = async () => {
    const cleaned = phone.trim();
    if (!cleaned) { setPhoneError("Phone number is required"); return; }
    const d = cleaned.replace(/\D/g, "");
    if (d.length < 10) { setPhoneError("Enter a valid 10-digit Indian mobile number"); return; }
    setSending(true); setPhoneError("");
    try { await axiosInstance.post("/send-sms-otp", { phone: d.slice(-10) }); setStep("phone-otp"); setCountdown(60); }
    catch (err: any) { setPhoneError(err?.response?.data?.detail || "Failed to send OTP. Try again."); }
    finally { setSending(false); }
  };

  const verifyPhoneOtp = async (code: string) => {
    const d = phone.trim().replace(/\D/g, "").slice(-10);
    setVerifying(true); setOtpError("");
    try { await axiosInstance.post("/verify-sms-otp", { phone: d, otp: code }); applyLanguageChange(); }
    catch { setOtpError("Incorrect code. Please try again."); setDigits(["","","","","",""]); inputRefs.current[0]?.focus(); }
    finally { setVerifying(false); }
  };

  const applyLanguageChange = () => {
    if (targetLang) setLang(targetLang);
    setStep("success");
    setTimeout(() => handleClose(), 1400);
  };

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits); setOtpError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (value && index === 5) {
      const code = [...newDigits.slice(0,5), value.slice(-1)].join("");
      if (code.length === 6) submitOtp(code);
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "Enter") { const code = digits.join(""); if (code.length === 6) submitOtp(code); }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) { setDigits(text.split("")); inputRefs.current[5]?.focus(); submitOtp(text); }
  };

  const submitOtp = (code: string) => {
    if (step === "email-otp") verifyEmailOtp(code); else verifyPhoneOtp(code);
  };

  const currentCode      = digits.join("");
  const selectedLangMeta = LANGUAGES.find(l => l.code === lang);

  // ── Shared inline styles ───────────────────────────────────────────────────
  const S = {
    overlay: {
      position: "fixed" as const, inset: 0, zIndex: 99999,
      background: "rgba(0,0,0,0.82)", backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, animation: "ls-fadeIn 0.2s ease both",
      fontFamily: "'DM Sans', sans-serif",
    },
    card: {
      width: "100%", maxWidth: 420, background: "#0f0f0f",
      border: "1px solid rgba(255,255,255,0.1)", borderRadius: 22,
      padding: "28px 24px", position: "relative" as const,
      animation: "ls-slideUp 0.32s cubic-bezier(0.22,1,0.36,1) both",
      boxSizing: "border-box" as const,
    },
    closeBtn: {
      position: "absolute" as const, top: 16, right: 16,
      background: "none", border: "none", color: "rgba(255,255,255,0.4)",
      cursor: "pointer", padding: 6, borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
    },
    langBtn: (active: boolean) => ({
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 14px", borderRadius: 14,
      border: active ? "1.5px solid #1d9bf0" : "1.5px solid rgba(255,255,255,0.1)",
      background: active ? "rgba(29,155,240,0.15)" : "rgba(255,255,255,0.04)",
      color: "#fff", fontFamily: "'DM Sans',sans-serif",
      fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left" as const,
    }),
    btn: (disabled = false) => ({
      width: "100%", padding: 13, borderRadius: 9999, border: "none",
      background: disabled ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#1d9bf0,#0e7fd8)",
      color: disabled ? "rgba(255,255,255,0.25)" : "#fff",
      fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    }),
    btnOutline: {
      width: "100%", padding: 11, borderRadius: 9999,
      border: "1px solid rgba(255,255,255,0.2)", background: "transparent",
      color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans',sans-serif",
      fontSize: 14, fontWeight: 600, cursor: "pointer",
    },
    backBtn: {
      background: "none", border: "none", color: "rgba(255,255,255,0.5)",
      cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
      marginBottom: 16, padding: 0, fontFamily: "'DM Sans',sans-serif", fontSize: 13,
    },
    otpRow:   { display: "flex", gap: 10, justifyContent: "center", margin: "22px 0" },
    errorMsg: { color: "#ef4444", fontSize: 13, textAlign: "center" as const, marginTop: 8 },
    infoMsg:  { color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center" as const },
  };

  // ── Modal JSX ──────────────────────────────────────────────────────────────
  const modal = open ? (
    <div style={S.overlay} onClick={handleClose}>
      <div style={S.card} onClick={e => e.stopPropagation()}>
        <style dangerouslySetInnerHTML={{ __html: STYLES }} />
        <button style={S.closeBtn} onClick={handleClose}><X size={18} /></button>

        {/* Picker */}
        {step === "picker" && (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              <Globe size={20} color="#1d9bf0" />
              <h2 style={{ color:"#fff", margin:0, fontSize:18, fontWeight:800 }}>{t(lang,"selectLanguage")}</h2>
            </div>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, margin:0 }}>
              French requires email OTP · Others require phone OTP
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:18 }}>
              {LANGUAGES.map(l => (
                <button key={l.code} style={S.langBtn(lang === l.code)} onClick={() => handleSelectLang(l.code)}>
                  <span style={{ fontSize:22 }}>{l.flag}</span>
                  <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                    <span>{l.label}</span>
                    <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:500 }}>{l.nativeName}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Enter Phone */}
        {step === "phone" && (
          <>
            <button style={S.backBtn} onClick={() => setStep("picker")}><ArrowLeft size={15} /> Back</button>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
              <div style={{ width:44, height:44, borderRadius:"50%", background:"rgba(29,155,240,0.1)", border:"1px solid rgba(29,155,240,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Phone size={20} color="#1d9bf0" />
              </div>
              <div>
                <h2 style={{ color:"#fff", margin:0, fontSize:18, fontWeight:800 }}>Verify phone</h2>
                <p style={{ color:"rgba(255,255,255,0.4)", margin:0, fontSize:13 }}>
                  Switching to {LANGUAGES.find(l => l.code === targetLang)?.flag} {LANGUAGES.find(l => l.code === targetLang)?.label}
                </p>
              </div>
            </div>
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:13, margin:"12px 0 16px", lineHeight:1.5 }}>
              Enter your phone number. We'll send a one-time code via SMS.
            </p>
            <input className={`ls-input${phoneError?" error":""}`} type="tel" placeholder="9876543210"
              value={phone} onChange={e => { setPhone(e.target.value); setPhoneError(""); }}
              onKeyDown={e => e.key === "Enter" && sendPhoneOtp()} autoFocus />
            {phoneError && <p style={S.errorMsg}>{phoneError}</p>}
            <div style={{ marginTop:12, padding:"10px 14px", borderRadius:10, background:"rgba(29,155,240,0.06)", border:"1px solid rgba(29,155,240,0.15)" }}>
              <p style={{ color:"#1d9bf0", fontSize:12, margin:0, fontWeight:600 }}>📱 Enter your 10-digit Indian mobile number</p>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:12, margin:"4px 0 0" }}>A real SMS will be sent to your number</p>
            </div>
            <div style={{ marginTop:16 }}>
              <button style={S.btn(sending || !phone.trim())} onClick={sendPhoneOtp} disabled={sending || !phone.trim()}>
                {sending ? <><RefreshCw size={15} className="ls-spin-icon" /> Sending…</> : "Send OTP"}
              </button>
            </div>
          </>
        )}

        {/* Phone OTP */}
        {step === "phone-otp" && (
          <>
            <button style={S.backBtn} onClick={() => setStep("phone")}><ArrowLeft size={15} /> Back</button>
            <h2 style={{ color:"#fff", margin:"0 0 6px", fontSize:18, fontWeight:800 }}>Enter SMS code</h2>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, margin:0 }}>
              Code sent to <strong style={{ color:"rgba(255,255,255,0.7)" }}>{phone}</strong>
            </p>
            <div style={S.otpRow} onPaste={handlePaste}>
              {digits.map((d,i) => (
                <input key={i} ref={el => { inputRefs.current[i]=el; }}
                  className={`ls-otp-digit${otpError?" error":""}${d?" filled":""}`}
                  type="text" inputMode="numeric" maxLength={1} value={d}
                  onChange={e => handleDigitChange(i,e.target.value)}
                  onKeyDown={e => handleDigitKeyDown(i,e)} autoFocus={i===0} disabled={verifying} />
              ))}
            </div>
            {otpError && <p style={S.errorMsg}>{otpError}</p>}
            <button style={{ ...S.btn(currentCode.length<6||verifying), marginBottom:10 }}
              onClick={() => submitOtp(currentCode)} disabled={currentCode.length<6||verifying}>
              {verifying ? <><RefreshCw size={15} className="ls-spin-icon" /> Verifying…</> : t(lang,"verifyOtp")}
            </button>
            <div style={{ textAlign:"center" }}>
              {countdown > 0
                ? <p style={S.infoMsg}>Resend in <strong style={{ color:"rgba(255,255,255,0.5)" }}>{countdown}s</strong></p>
                : <button style={S.btnOutline} onClick={() => setStep("phone")}>Resend code</button>}
            </div>
          </>
        )}

        {/* Email OTP */}
        {step === "email-otp" && (
          <>
            <button style={S.backBtn} onClick={() => setStep("picker")}><ArrowLeft size={15} /> Back</button>
            <h2 style={{ color:"#fff", margin:"0 0 6px", fontSize:18, fontWeight:800 }}>🇫🇷 Verify email</h2>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, margin:0 }}>
              Code sent to <strong style={{ color:"rgba(255,255,255,0.7)" }}>{user?.email}</strong>
            </p>
            <div style={S.otpRow} onPaste={handlePaste}>
              {digits.map((d,i) => (
                <input key={i} ref={el => { inputRefs.current[i]=el; }}
                  className={`ls-otp-digit${otpError?" error":""}${d?" filled":""}`}
                  type="text" inputMode="numeric" maxLength={1} value={d}
                  onChange={e => handleDigitChange(i,e.target.value)}
                  onKeyDown={e => handleDigitKeyDown(i,e)} autoFocus={i===0} disabled={verifying} />
              ))}
            </div>
            {otpError && <p style={S.errorMsg}>{otpError}</p>}
            <button style={{ ...S.btn(currentCode.length<6||verifying), marginBottom:10 }}
              onClick={() => submitOtp(currentCode)} disabled={currentCode.length<6||verifying}>
              {verifying ? <><RefreshCw size={15} className="ls-spin-icon" /> Verifying…</> : t(lang,"verifyOtp")}
            </button>
            <div style={{ textAlign:"center" }}>
              {countdown > 0
                ? <p style={S.infoMsg}>Resend in <strong style={{ color:"rgba(255,255,255,0.5)" }}>{countdown}s</strong></p>
                : <button style={S.btnOutline} onClick={() => { sendEmailOtp(); setCountdown(60); }}>Resend email</button>}
            </div>
          </>
        )}

        {/* Success */}
        {step === "success" && (
          <div style={{ textAlign:"center", padding:"12px 0" }}>
            <CheckCircle size={52} color="#1d9bf0" className="ls-success-icon" style={{ margin:"0 auto 16px", display:"block" }} />
            <h2 style={{ color:"#fff", fontSize:20, fontWeight:800, margin:"0 0 6px" }}>Language changed!</h2>
            <p style={{ color:"rgba(255,255,255,0.45)", fontSize:14, margin:0 }}>
              {LANGUAGES.find(l => l.code === targetLang)?.flag}{" "}
              Now showing in {LANGUAGES.find(l => l.code === targetLang)?.label}
            </p>
          </div>
        )}
      </div>
    </div>
  ) : null;

  // ── Trigger-only mode: Sidebar handles the portal ─────────────────────────
  if (triggerOnly) return null; // Sidebar renders trigger itself

  // ── Standalone mode (uncontrolled): renders trigger + modal together ──────
  return (
    <>
      <button
        onClick={handleOpen}
        style={{
          display:"flex", alignItems:"center", gap:10, width:"100%",
          padding:"10px 12px", borderRadius:12, background:"transparent", border:"none",
          color:"rgba(255,255,255,0.7)", cursor:"pointer",
          fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:500, transition:"background 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background="rgba(255,255,255,0.06)")}
        onMouseLeave={e => (e.currentTarget.style.background="transparent")}
      >
        <Globe size={20} />
        <span>{selectedLangMeta?.flag} {selectedLangMeta?.nativeName}</span>
      </button>
      {modal}
    </>
  );
}

// ── Named export: just the modal content (for Sidebar portal usage) ──────────
export function LanguageSwitcherModal({ onClose }: { onClose: () => void }) {
  return <LanguageSwitcher isOpen={true} onClose={onClose} />;
}