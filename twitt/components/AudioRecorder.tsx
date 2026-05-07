"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Mic, MicOff, Upload, Play, Pause,
  X, RefreshCw, Check, Loader2,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase =
  | "otp-gate"      // initial — explain OTP requirement
  | "otp-sending"   // waiting for /send-otp
  | "otp-sent"      // user entering 6-digit code
  | "otp-verifying" // waiting for /verify-otp
  | "ready"         // OTP verified — can record or upload file
  | "recording"     // MediaRecorder active
  | "recorded"      // blob ready — preview / redo / upload
  | "uploading";    // POST /upload-audio in flight

interface AudioRecorderProps {
  /** Called with the Cloudinary URL + duration (seconds) on successful upload */
  onAudioReady: (url: string, duration: number) => void;
  onClose: () => void;
}

// ─── Shared style helpers ─────────────────────────────────────────────────────
const primaryBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  width: "100%", padding: "11px 20px", borderRadius: 9999, border: "none",
  background: "linear-gradient(135deg,#1d9bf0 0%,#0e7fd8 100%)",
  color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
  fontFamily: "'DM Sans',sans-serif", transition: "opacity .15s,transform .15s",
  gap: 6,
};
const ghostBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: "11px 18px", borderRadius: 9999,
  border: "1px solid rgba(255,255,255,.12)",
  background: "transparent", color: "rgba(255,255,255,.7)",
  fontWeight: 600, fontSize: 13, cursor: "pointer",
  fontFamily: "'DM Sans',sans-serif", gap: 5,
};
const errText: React.CSSProperties = {
  color: "#ef4444", fontSize: 12, marginTop: 8, marginBottom: 0,
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function AudioRecorder({ onAudioReady, onClose }: AudioRecorderProps) {
  const [phase, setPhase]               = useState<Phase>("otp-gate");
  const [otpValue, setOtpValue]         = useState("");
  const [otpError, setOtpError]         = useState("");
  const [recordingTime, setRecordingTime] = useState(0); // seconds elapsed
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl]   = useState("");
  const [isPlaying, setIsPlaying]       = useState(false);
  const [uploadError, setUploadError]   = useState("");
  const [bars, setBars]                 = useState<number[]>(Array(24).fill(4));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef           = useRef<number | null>(null);
  const audioRef         = useRef<HTMLAudioElement | null>(null);
  const analyserRef      = useRef<AnalyserNode | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);
  const fileInputRef     = useRef<HTMLInputElement | null>(null);

  const MAX_SEC = 300; // 5 minutes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      rafRef.current   && cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      recordedUrl && URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // ── OTP ───────────────────────────────────────────────────────────────────
  const sendOtp = async () => {
    setPhase("otp-sending");
    setOtpError("");
    try {
      await axiosInstance.post("/send-otp");
      setPhase("otp-sent");
    } catch (err: any) {
      setOtpError(err.response?.data?.error || "Failed to send OTP — try again.");
      setPhase("otp-gate");
    }
  };

  const verifyOtp = async () => {
    if (otpValue.length !== 6) { setOtpError("Enter the 6-digit code."); return; }
    setPhase("otp-verifying");
    setOtpError("");
    try {
      await axiosInstance.post("/verify-otp", { otp: otpValue });
      setPhase("ready");
    } catch (err: any) {
      setOtpError(err.response?.data?.error || "Invalid or expired OTP.");
      setPhase("otp-sent");
    }
  };

  // ── Recording ─────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Waveform analyser
      const ctx      = new AudioContext();
      const source   = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const animateWave = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        setBars(Array.from({ length: 24 }, (_, i) => {
          const v = data[Math.floor(i * data.length / 24)];
          return Math.max(4, (v / 255) * 44);
        }));
        rafRef.current = requestAnimationFrame(animateWave);
      };
      animateWave();

      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        setPhase("recorded");
        stream.getTracks().forEach(t => t.stop());
        rafRef.current && cancelAnimationFrame(rafRef.current);
        setBars(Array(24).fill(4));
      };
      mr.start(100);
      mediaRecorderRef.current = mr;
      setPhase("recording");
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_SEC - 1) { stopRecording(); return MAX_SEC; }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setUploadError("Microphone access denied — check browser permissions.");
    }
  };

  const stopRecording = () => {
    timerRef.current && clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state === "recording")
      mediaRecorderRef.current.stop();
  };

  // ── File pick ─────────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      setUploadError("Please select an audio file."); return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setUploadError("File too large — max 100 MB."); return;
    }
    setUploadError("");
    setRecordedBlob(file);
    setRecordedUrl(URL.createObjectURL(file));
    setPhase("recorded");
    e.target.value = "";
  };

  // ── Upload ────────────────────────────────────────────────────────────────
  const uploadAudio = async () => {
    if (!recordedBlob) return;
    setPhase("uploading");
    setUploadError("");
    const form = new FormData();
    form.append("audio", recordedBlob, "recording.webm");
    try {
      const res = await axiosInstance.post("/upload-audio", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onAudioReady(res.data.url, res.data.duration);
    } catch (err: any) {
      setUploadError(err.response?.data?.error || "Upload failed — try again.");
      setPhase("recorded");
    }
  };

  const resetRecording = () => {
    recordedUrl && URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl("");
    setRecordingTime(0);
    setIsPlaying(false);
    setPhase("ready");
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else           { audioRef.current.play();  setIsPlaying(true);  }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes ar-spin   { to { transform: rotate(360deg); } }
        @keyframes ar-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ar-pulse  {
          0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
          50%     { box-shadow: 0 0 0 8px rgba(239,68,68,0.18); }
        }
        .ar-spin    { animation: ar-spin 1s linear infinite; }
        .ar-phase   { animation: ar-fadeIn 0.28s cubic-bezier(0.22,1,0.36,1) both; }
        .ar-rec-btn { animation: ar-pulse 2s ease-in-out infinite; }
        .ar-primary:hover:not(:disabled)  { opacity: .88; transform: translateY(-1px); }
        .ar-primary:active:not(:disabled) { transform: translateY(0); }
        .ar-primary:disabled { opacity: .45; cursor: not-allowed; }
        .ar-ghost:hover  { background: rgba(255,255,255,.06) !important; }
        .ar-ghost:active { background: rgba(255,255,255,.1) !important; }
      `}</style>

      <div style={{
        background: "#0e0e0e",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        padding: "20px 20px 18px",
        fontFamily: "'DM Sans',sans-serif",
        color: "#fff",
        width: "100%",
        boxSizing: "border-box",
      }}>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "rgba(29,155,240,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Mic size={16} color="#1d9bf0" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>Audio Tweet</div>
              <div style={{ color: "rgba(255,255,255,.35)", fontSize: 11 }}>Available 2 PM – 7 PM IST</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,.4)", padding: 6, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background .15s, color .15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.07)"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,.4)"; }}
          >
            <X size={17} />
          </button>
        </div>

        {/* ── Phase: OTP Gate ─────────────────────────────────────────────── */}
        {phase === "otp-gate" && (
          <div className="ar-phase" style={{ textAlign: "center" }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "rgba(29,155,240,0.08)",
              border: "1px solid rgba(29,155,240,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
            }}>
              <Mic size={22} color="#1d9bf0" />
            </div>
            <p style={{ color: "rgba(255,255,255,.55)", fontSize: 13, margin: "0 0 16px", lineHeight: 1.5 }}>
              Audio uploads require a one-time email verification to keep the feature secure.
            </p>
            <button className="ar-primary" style={primaryBtn} onClick={sendOtp}>
              Send Verification Code
            </button>
            {otpError && <p style={errText}>{otpError}</p>}
          </div>
        )}

        {/* ── Phase: OTP Sending ───────────────────────────────────────────── */}
        {phase === "otp-sending" && (
          <div className="ar-phase" style={{ textAlign: "center", padding: "24px 0" }}>
            <Loader2 size={30} color="#1d9bf0" className="ar-spin" />
            <p style={{ color: "rgba(255,255,255,.45)", marginTop: 12, fontSize: 13 }}>Sending code to your email…</p>
          </div>
        )}

        {/* ── Phase: OTP Entry ─────────────────────────────────────────────── */}
        {(phase === "otp-sent" || phase === "otp-verifying") && (
          <div className="ar-phase">
            <p style={{ color: "rgba(255,255,255,.55)", fontSize: 13, margin: "0 0 12px" }}>
              Enter the 6-digit code sent to your email:
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpValue}
              onChange={e => { setOtpValue(e.target.value.replace(/\D/g, "")); setOtpError(""); }}
              placeholder="000000"
              style={{
                width: "100%", boxSizing: "border-box",
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${otpError ? "rgba(239,68,68,.5)" : "rgba(255,255,255,.12)"}`,
                borderRadius: 12, padding: "13px 16px",
                color: "#fff", fontSize: 24, letterSpacing: 10,
                textAlign: "center", fontFamily: "monospace", outline: "none",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "#1d9bf0")}
              onBlur={e =>  (e.currentTarget.style.borderColor = otpError ? "rgba(239,68,68,.5)" : "rgba(255,255,255,.12)")}
            />
            {otpError && <p style={errText}>{otpError}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button className="ar-ghost" style={ghostBtn}
                onClick={() => { setPhase("otp-gate"); setOtpValue(""); setOtpError(""); }}>
                ← Resend
              </button>
              <button
                className="ar-primary"
                style={{ ...primaryBtn, flex: 1 }}
                disabled={phase === "otp-verifying" || otpValue.length !== 6}
                onClick={verifyOtp}
              >
                {phase === "otp-verifying"
                  ? <Loader2 size={15} className="ar-spin" />
                  : "Verify & Continue"
                }
              </button>
            </div>
          </div>
        )}

        {/* ── Phase: Ready (record or pick file) ──────────────────────────── */}
        {phase === "ready" && (
          <div className="ar-phase" style={{ textAlign: "center" }}>
            {/* Big record button */}
            <button
              onClick={startRecording}
              style={{
                width: 76, height: 76, borderRadius: "50%",
                background: "linear-gradient(135deg,#1d9bf0,#0e5fa0)",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 10px",
                boxShadow: "0 4px 22px rgba(29,155,240,0.4)",
                transition: "transform .16s ease, box-shadow .16s ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.07)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(29,155,240,0.55)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 22px rgba(29,155,240,0.4)";
              }}
            >
              <Mic size={30} color="#fff" />
            </button>
            <p style={{ color: "rgba(255,255,255,.4)", fontSize: 12, margin: "0 0 18px" }}>Tap to start recording</p>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.08)" }} />
              <span style={{ color: "rgba(255,255,255,.25)", fontSize: 11 }}>or upload a file</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.08)" }} />
            </div>

            <button className="ar-ghost" style={{ ...ghostBtn, width: "100%", justifyContent: "center" }}
              onClick={() => fileInputRef.current?.click()}>
              <Upload size={14} /> Choose audio file
            </button>
            <input ref={fileInputRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={handleFileSelect} />
            {uploadError && <p style={errText}>{uploadError}</p>}

            <p style={{ color: "rgba(255,255,255,.25)", fontSize: 11, marginTop: 14, lineHeight: 1.5 }}>
              Max 5 minutes · 100 MB · Only between 2 PM – 7 PM IST
            </p>
          </div>
        )}

        {/* ── Phase: Recording ──────────────────────────────────────────────── */}
        {phase === "recording" && (
          <div className="ar-phase" style={{ textAlign: "center" }}>
            {/* Live waveform */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 3, height: 52, marginBottom: 14,
            }}>
              {bars.map((h, i) => (
                <div key={i} style={{
                  width: 3, height: h, borderRadius: 3,
                  background: `rgba(29,155,240,${0.4 + (h / 44) * 0.6})`,
                  transition: "height 0.08s ease",
                }} />
              ))}
            </div>

            {/* Timer */}
            <div style={{ fontSize: 30, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: -1 }}>
              {fmt(recordingTime)}
            </div>
            <div style={{ color: "rgba(255,255,255,.35)", fontSize: 12, marginBottom: 18 }}>
              {fmt(MAX_SEC - recordingTime)} remaining
            </div>

            {/* Stop button */}
            <button
              className="ar-rec-btn"
              onClick={stopRecording}
              style={{
                width: 60, height: 60, borderRadius: "50%",
                background: "rgba(239,68,68,0.12)",
                border: "2px solid rgba(239,68,68,0.6)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto",
                transition: "transform .15s ease",
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              <MicOff size={22} color="#ef4444" />
            </button>
            <p style={{ color: "rgba(255,255,255,.3)", fontSize: 12, marginTop: 10 }}>Tap to stop recording</p>
          </div>
        )}

        {/* ── Phase: Recorded / Uploading ──────────────────────────────────── */}
        {(phase === "recorded" || phase === "uploading") && recordedUrl && (
          <div className="ar-phase">
            {/* Hidden audio element for playback */}
            <audio ref={audioRef} src={recordedUrl} onEnded={() => setIsPlaying(false)} style={{ display: "none" }} />

            {/* Preview card */}
            <div style={{
              background: "rgba(29,155,240,0.07)",
              border: "1px solid rgba(29,155,240,0.18)",
              borderRadius: 14, padding: "14px 16px", marginBottom: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  onClick={togglePlayback}
                  disabled={phase === "uploading"}
                  style={{
                    width: 42, height: 42, borderRadius: "50%",
                    background: "#1d9bf0", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, transition: "transform .15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                >
                  {isPlaying
                    ? <Pause size={16} color="#fff" />
                    : <Play  size={16} color="#fff" style={{ marginLeft: 2 }} />
                  }
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Voice recording</div>
                  <div style={{ color: "rgba(255,255,255,.4)", fontSize: 12 }}>
                    {recordingTime > 0 ? fmt(recordingTime) : "Ready to upload"} ·{" "}
                    <span style={{ color: "#1d9bf0" }}>preview ready</span>
                  </div>
                </div>
              </div>
            </div>

            {uploadError && (
              <div style={{
                display: "flex", gap: 8, alignItems: "flex-start",
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 10, padding: "10px 14px", marginBottom: 12,
              }}>
                <X size={13} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ color: "#ef4444", fontSize: 12, lineHeight: 1.4 }}>{uploadError}</span>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button className="ar-ghost" style={ghostBtn}
                onClick={resetRecording}
                disabled={phase === "uploading"}>
                <RefreshCw size={13} /> Redo
              </button>
              <button
                className="ar-primary"
                style={{ ...primaryBtn, flex: 1 }}
                disabled={phase === "uploading"}
                onClick={uploadAudio}
              >
                {phase === "uploading"
                  ? <><Loader2 size={14} className="ar-spin" /> Uploading…</>
                  : <><Check size={14} /> Use this audio</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}