"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Image, Smile, Calendar, MapPin,
  BarChart3, Globe, X, Loader2, Mic,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import axios from "axios";
import axiosInstance from "@/lib/axiosInstance";
import AudioRecorder from "./AudioRecorder"; // ← NEW
import { t } from "@/lib/i18n";
import { useLanguage } from "@/context/LanguageContext";


const COMPOSER_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
  .tc-wrap {
    font-family: 'DM Sans', sans-serif;
    background: #000;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    transition: border-color 0.2s;
  }
  .tc-wrap:focus-within { border-bottom-color: rgba(29,155,240,0.25); }
  .tc-textarea {
    width: 100%; background: transparent; border: none; outline: none;
    resize: none; color: #fff; font-family: 'DM Sans', sans-serif;
    font-size: clamp(1rem, 2.5vw, 1.18rem); font-weight: 400;
    line-height: 1.6; min-height: 90px; padding: 0; caret-color: #1d9bf0;
    transition: min-height 0.2s ease;
  }
  .tc-textarea::placeholder { color: rgba(255,255,255,0.28); }
  .tc-textarea:focus { min-height: 120px; }
  .tc-icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 36px; height: 36px; border-radius: 50%; border: none;
    background: transparent; color: #1d9bf0; cursor: pointer;
    transition: background 0.15s ease, transform 0.15s ease;
    position: relative; flex-shrink: 0;
  }
  .tc-icon-btn:hover { background: rgba(29,155,240,0.12); transform: scale(1.08); }
  .tc-icon-btn:active { transform: scale(0.94); }
  .tc-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .tc-icon-btn::after {
    content: attr(data-tip); position: absolute;
    bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);
    background: rgba(30,30,30,0.95); color: #fff; font-size: 0.68rem;
    font-weight: 500; padding: 3px 8px; border-radius: 6px;
    white-space: nowrap; pointer-events: none; opacity: 0;
    transition: opacity 0.15s; border: 1px solid rgba(255,255,255,0.08);
  }
  .tc-icon-btn:hover::after { opacity: 1; }

  /* Mic button active state — glowing when audio is attached */
  .tc-icon-btn.tc-mic-active {
    background: rgba(29,155,240,0.15);
    color: #1d9bf0;
    box-shadow: 0 0 0 2px rgba(29,155,240,0.3);
  }

  .tc-post-btn {
    height: 36px; padding: 0 20px; border-radius: 9999px; border: none;
    background: linear-gradient(135deg, #1d9bf0 0%, #0e7fd8 100%);
    color: #fff; font-family: 'DM Sans', sans-serif; font-weight: 700;
    font-size: 0.9rem; cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s;
    flex-shrink: 0;
  }
  .tc-post-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 18px rgba(29,155,240,0.4); }
  .tc-post-btn:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
  .tc-post-btn:disabled { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.25); cursor: not-allowed; }
  @keyframes previewIn {
    from { opacity: 0; transform: scale(0.96) translateY(6px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  .tc-preview {
    animation: previewIn 0.22s cubic-bezier(.22,.68,0,1.2) both;
    position: relative; display: inline-block; border-radius: 14px;
    overflow: hidden; margin-top: 12px; max-width: 100%;
    border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 24px rgba(0,0,0,0.5);
  }
  .tc-preview img { display: block; max-width: 100%; max-height: 300px; object-fit: cover; }
  .tc-preview-remove {
    position: absolute; top: 8px; right: 8px; width: 28px; height: 28px;
    border-radius: 50%; background: rgba(0,0,0,0.7);
    border: 1px solid rgba(255,255,255,0.15); color: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background 0.15s, transform 0.15s;
    backdrop-filter: blur(6px);
  }
  .tc-preview-remove:hover { background: rgba(220,38,38,0.75); transform: scale(1.1); }

  /* ── Audio preview pill ── */
  @keyframes audioPillIn {
    from { opacity: 0; transform: translateY(6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .tc-audio-preview {
    animation: audioPillIn 0.24s cubic-bezier(0.22,1,0.36,1) both;
    display: flex; align-items: center; gap: 10;
    background: rgba(29,155,240,0.07);
    border: 1px solid rgba(29,155,240,0.2);
    border-radius: 12px; padding: 10px 14px;
    margin-top: 12px;
  }

  /* ── AudioRecorder slide-in panel ── */
  @keyframes recorderSlideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .tc-recorder-panel {
    animation: recorderSlideIn 0.28s cubic-bezier(0.22,1,0.36,1) both;
    margin-top: 14px;
  }

  .tc-ring { transition: stroke-dashoffset 0.25s cubic-bezier(.4,0,.2,1), stroke 0.25s ease; }
  .tc-audience {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 0.78rem; font-weight: 600; color: #1d9bf0;
    background: rgba(29,155,240,0.08); border: 1px solid rgba(29,155,240,0.2);
    border-radius: 9999px; padding: 2px 10px 2px 7px; white-space: nowrap;
  }
  .tc-audience:hover { background: rgba(29,155,240,0.15); cursor: pointer; }
  .tc-avatar-col { display: flex; flex-direction: column; align-items: center; }
  .tc-avatar-thread-line {
    width: 2px; flex: 1; min-height: 8px;
    background: linear-gradient(to bottom, rgba(255,255,255,0.12), transparent);
    border-radius: 1px; margin-top: 6px;
  }
  @media (max-width: 480px) {
    .tc-wrap { padding: 10px 12px 8px !important; }
    .tc-textarea { font-size: 1rem !important; min-height: 80px !important; }
    .tc-post-btn { height: 32px !important; padding: 0 14px !important; font-size: 0.85rem !important; }
  }
  @keyframes composerIn {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .tc-root { animation: composerIn 0.3s ease both; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .tc-spin { animation: spin 1s linear infinite; }
  .tc-error {
    display: flex; align-items: center; gap: 8px;
    background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25);
    border-radius: 10px; padding: 10px 14px; margin-top: 10px;
    color: #ef4444; font-size: 0.82rem; line-height: 1.4;
  }
  @media (max-width: 600px) {
    .tc-toolbar-label { display: none; }
    .tc-post-btn { padding: 0 16px; font-size: 0.85rem; }
  }
`;

// ─── Tiny audio duration formatter ───────────────────────────────────────────
const fmtDuration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const TweetComposer = ({ onTweetPosted }: { onTweetPosted: (tweet: any) => void }) => {
  const { user } = useAuth();
  const [content, setContent]             = useState("");
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const isSubmittingRef                   = useRef(false);
  const [isUploading, setIsUploading]     = useState(false);
  const [imageurl, setImageurl]           = useState("");
  const [postError, setPostError]         = useState("");
  const textareaRef                       = useRef<HTMLTextAreaElement>(null);
  const maxLength = 280;

  // ── NEW: audio state ──────────────────────────────────────────────────────
  const [audioUrl, setAudioUrl]           = useState("");        // cloudinary URL
  const [audioDuration, setAudioDuration] = useState<number>(0); // seconds
  const [showRecorder, setShowRecorder]   = useState(false);     // toggle panel
  // ─────────────────────────────────────────────────────────────────────────

  const { lang } = useLanguage();

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.max(90, el.scrollHeight) + "px";
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError("");
    if (!user || !content.trim()) return;

    if (!user._id) {
      setPostError("Profile not fully loaded yet — please refresh the page.");
      return;
    }

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const res = await axiosInstance.post("/post", {
        content:       content.trim(),
        image:         imageurl       || null,
        audio:         audioUrl       || null,  // ← NEW
        audioDuration: audioDuration  || null,  // ← NEW
      });
      onTweetPosted(res.data);
      setContent("");
      setImageurl("");
      setAudioUrl("");         // ← NEW: clear after post
      setAudioDuration(0);    // ← NEW
      setShowRecorder(false); // ← NEW
    } catch (error: any) {
      const serverMsg  = error.response?.data?.error
                      || error.response?.data?.message
                      || (typeof error.response?.data === "string" ? error.response.data : null);
      const statusCode = error.response?.status;
      const networkErr = !error.response && error.message;

      if (statusCode === 403) {
        setPostError(serverMsg || "Tweet limit reached. Please upgrade your plan.");
      } else if (statusCode === 401) {
        setPostError("Session expired — please log out and log in again.");
      } else if (statusCode === 404) {
        setPostError(
          process.env.NODE_ENV === "development"
            ? `Backend not reachable (404). Check NEXT_PUBLIC_BACKEND_URL in .env.local — current value: "${process.env.NEXT_PUBLIC_BACKEND_URL || "not set, using http://localhost:5000"}"`
            : "Could not connect to server. Please try again."
        );
      } else if (networkErr) {
        setPostError(`Network error: ${error.message}`);
      } else {
        setPostError(serverMsg || "Something went wrong. Please try again.");
      }

      console.error("[TweetComposer] POST /post failed →", {
        status: statusCode,
        data:   error.response?.data,
        url:    error.config?.baseURL + error.config?.url,
      });
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const image = e.target.files[0];
    if (!image.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }
    if (image.size > 32 * 1024 * 1024) {
      alert("Image too large. Maximum size is 32MB.");
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.set("image", image);
    try {
      const res = await axios.post(
        "https://api.imgbb.com/1/upload?key=118c68781cad7502f590ce9fc6ae87ab",
        formData
      );
      const url = res.data?.data?.display_url;
      if (url) setImageurl(url);
    } catch (error: any) {
      console.error("[TweetComposer] Image upload failed:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
    e.target.value = "";
  };

  // ── NEW: callback from AudioRecorder on successful upload ─────────────────
  const handleAudioReady = (url: string, duration: number) => {
    setAudioUrl(url);
    setAudioDuration(duration);
    setShowRecorder(false); // collapse the recorder panel
  };
  // ─────────────────────────────────────────────────────────────────────────

  const characterCount = content.length;
  const isOverLimit    = characterCount > maxLength;
  const isNearLimit    = characterCount > maxLength * 0.8;
  const remaining      = maxLength - characterCount;
  const ringRadius     = 13;
  const ringCirc       = 2 * Math.PI * ringRadius;
  const ringProgress   = Math.min(characterCount / maxLength, 1);
  const ringColor      = isOverLimit ? "#ef4444" : isNearLimit ? "#eab308" : "#1d9bf0";
  const isBusy         = isSubmitting || isUploading;

  if (!user) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: COMPOSER_STYLES }} />
      <div className="tc-root tc-wrap" style={{ padding: "14px 16px 10px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>

          {/* Avatar column */}
          <div className="tc-avatar-col" style={{ paddingTop: 2 }}>
            <Avatar style={{ width: 42, height: 42, flexShrink: 0, boxShadow: "0 0 0 2px rgba(29,155,240,0.2)" }}>
              <AvatarImage src={user.avatar} alt={user.displayName} />
              <AvatarFallback style={{ background: "linear-gradient(135deg,#1d9bf0,#0e5fa0)", color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
                {user.displayName?.[0]}
              </AvatarFallback>
            </Avatar>
            {(content.length > 0 || imageurl || audioUrl) && <div className="tc-avatar-thread-line" />}
          </div>

          {/* Right column */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <form onSubmit={handleSubmit}>
              <textarea
                ref={textareaRef}
                className="tc-textarea"
                placeholder={t(lang, "whatsHappening")}
                value={content}
                onChange={(e) => { setContent(e.target.value); setPostError(""); }}
                rows={3}
                disabled={isSubmitting}
              />

              {/* Image preview */}
              {imageurl && (
                <div className="tc-preview">
                  <img src={imageurl} alt="Preview" />
                  <button type="button" className="tc-preview-remove" onClick={() => setImageurl("")} aria-label="Remove image">
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </div>
              )}

              {/* ── NEW: Audio preview pill ─────────────────────────────── */}
              {audioUrl && (
                <div className="tc-audio-preview" style={{ gap: 10 }}>
                  {/* Pulse dot indicating audio attached */}
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    background: "rgba(29,155,240,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Mic size={15} color="#1d9bf0" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: "#fff" }}>
                      Audio attached
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>
                      {audioDuration > 0 ? fmtDuration(audioDuration) : "Ready"}
                    </div>
                  </div>
                  {/* Native audio preview (tiny) */}
                  <audio controls src={audioUrl} style={{ height: 28, maxWidth: 140, flexShrink: 0 }} />
                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => { setAudioUrl(""); setAudioDuration(0); }}
                    style={{
                      background: "transparent", border: "none", cursor: "pointer",
                      color: "rgba(255,255,255,.4)", padding: 4, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "color .15s",
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.4)")}
                    aria-label="Remove audio"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </div>
              )}
              {/* ──────────────────────────────────────────────────────────── */}

              {/* ── NEW: AudioRecorder panel (slides in below) ────────────── */}
              {showRecorder && !audioUrl && (
                <div className="tc-recorder-panel">
                  <AudioRecorder
                    onAudioReady={handleAudioReady}
                    onClose={() => setShowRecorder(false)}
                  />
                </div>
              )}
              {/* ──────────────────────────────────────────────────────────── */}

              {/* Inline error banner */}
              {postError && (
                <div className="tc-error">
                  <X size={14} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                  {postError}
                </div>
              )}

              <div style={{ height: 1, background: "linear-gradient(90deg, rgba(255,255,255,0.06), transparent)", margin: "10px 0 8px" }} />

              {content.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <span className="tc-audience">
                    <Globe size={12} strokeWidth={2.5} />
                    <span className="tc-toolbar-label">Everyone can reply</span>
                  </span>
                </div>
              )}

              {/* Toolbar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {/* Image upload */}
                  <label
                    htmlFor="tweetImage"
                    className="tc-icon-btn"
                    data-tip="Photo"
                    style={{ cursor: isBusy ? "wait" : "pointer", opacity: isBusy ? 0.6 : 1 }}
                  >
                    {isUploading
                      ? <Loader2 size={18} className="tc-spin" />
                      : <Image size={18} strokeWidth={2} />
                    }
                    <input
                      type="file" accept="image/*" id="tweetImage"
                      style={{ display: "none" }}
                      onChange={handlePhotoUpload}
                      disabled={isBusy}
                    />
                  </label>

                  <button type="button" className="tc-icon-btn" data-tip="Poll"     disabled={isBusy}><BarChart3 size={18} strokeWidth={2} /></button>
                  <button type="button" className="tc-icon-btn" data-tip="Emoji"    disabled={isBusy}><Smile    size={18} strokeWidth={2} /></button>
                  <button type="button" className="tc-icon-btn" data-tip="Schedule" disabled={isBusy}><Calendar size={18} strokeWidth={2} /></button>
                  <button type="button" className="tc-icon-btn" data-tip="Location" disabled={isBusy}><MapPin   size={18} strokeWidth={2} /></button>

                  {/* ── NEW: Mic / Audio tweet button ────────────────────── */}
                  <button
                    type="button"
                    data-tip="Audio tweet"
                    className={`tc-icon-btn${audioUrl ? " tc-mic-active" : ""}`}
                    disabled={isBusy}
                    onClick={() => {
                      // If audio already attached, clicking removes it (toggle off)
                      if (audioUrl) {
                        setAudioUrl("");
                        setAudioDuration(0);
                        setShowRecorder(false);
                      } else {
                        setShowRecorder(v => !v);
                      }
                    }}
                  >
                    <Mic size={18} strokeWidth={2} />
                  </button>
                  {/* ──────────────────────────────────────────────────────── */}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {characterCount > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="30" height="30" viewBox="0 0 30 30" style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
                        <circle cx="15" cy="15" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                        <circle cx="15" cy="15" r={ringRadius} fill="none" stroke={ringColor} strokeWidth="2.5"
                          strokeLinecap="round" strokeDasharray={ringCirc}
                          strokeDashoffset={ringCirc * (1 - ringProgress)} className="tc-ring"
                        />
                      </svg>
                      {isNearLimit && (
                        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: ringColor, minWidth: 20, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                          {remaining}
                        </span>
                      )}
                    </div>
                  )}

                  {characterCount > 0 && (
                    <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />
                  )}

                  <button
                    type="submit"
                    className="tc-post-btn"
                    disabled={!content.trim() || isOverLimit || isBusy}
                  >
                    {isSubmitting ? t(lang, "loading") : t(lang, "post")}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default TweetComposer;