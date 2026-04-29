import { useAuth } from "@/context/AuthContext";
import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Image, Smile, Calendar, MapPin, BarChart3, Globe, X, Loader2 } from "lucide-react";
import { Separator } from "./ui/separator";
import axios from "axios";
import axiosInstance from "@/lib/axiosInstance";

/* ── Scoped styles injected once ── */
const COMPOSER_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  .tc-wrap {
    font-family: 'DM Sans', sans-serif;
    background: #000;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    transition: border-color 0.2s;
  }
  .tc-wrap:focus-within {
    border-bottom-color: rgba(29,155,240,0.25);
  }

  .tc-textarea {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: clamp(1rem, 2.5vw, 1.18rem);
    font-weight: 400;
    line-height: 1.6;
    min-height: 90px;
    padding: 0;
    caret-color: #1d9bf0;
    transition: min-height 0.2s ease;
  }
  .tc-textarea::placeholder {
    color: rgba(255,255,255,0.28);
  }
  .tc-textarea:focus {
    min-height: 120px;
  }

  /* Toolbar icon buttons */
  .tc-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: #1d9bf0;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.15s ease, color 0.15s ease;
    position: relative;
    flex-shrink: 0;
  }
  .tc-icon-btn:hover {
    background: rgba(29,155,240,0.12);
    transform: scale(1.08);
  }
  .tc-icon-btn:active {
    transform: scale(0.94);
  }
  .tc-icon-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  /* Tooltip */
  .tc-icon-btn::after {
    content: attr(data-tip);
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    background: rgba(30,30,30,0.95);
    color: #fff;
    font-size: 0.68rem;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 6px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .tc-icon-btn:hover::after { opacity: 1; }

  /* Post button */
  .tc-post-btn {
    height: 36px;
    padding: 0 20px;
    border-radius: 9999px;
    border: none;
    background: linear-gradient(135deg, #1d9bf0 0%, #0e7fd8 100%);
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s;
    letter-spacing: 0.01em;
    flex-shrink: 0;
  }
  .tc-post-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 18px rgba(29,155,240,0.4);
  }
  .tc-post-btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: none;
  }
  .tc-post-btn:disabled {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.25);
    cursor: not-allowed;
  }

  /* Image preview */
  @keyframes previewIn {
    from { opacity: 0; transform: scale(0.96) translateY(6px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  .tc-preview {
    animation: previewIn 0.22s cubic-bezier(.22,.68,0,1.2) both;
    position: relative;
    display: inline-block;
    border-radius: 14px;
    overflow: hidden;
    margin-top: 12px;
    max-width: 100%;
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 4px 24px rgba(0,0,0,0.5);
  }
  .tc-preview img {
    display: block;
    max-width: 100%;
    max-height: 300px;
    object-fit: cover;
  }
  .tc-preview-remove {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(0,0,0,0.7);
    border: 1px solid rgba(255,255,255,0.15);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s, transform 0.15s;
    backdrop-filter: blur(6px);
  }
  .tc-preview-remove:hover {
    background: rgba(220,38,38,0.75);
    transform: scale(1.1);
  }

  /* Upload overlay shimmer while loading */
  @keyframes shimmerPulse {
    0%, 100% { opacity: 0.5; }
    50%       { opacity: 1; }
  }
  .tc-uploading-label {
    animation: shimmerPulse 1s ease-in-out infinite;
  }

  /* Ring progress */
  .tc-ring {
    transition: stroke-dashoffset 0.25s cubic-bezier(.4,0,.2,1),
                stroke 0.25s ease;
  }

  /* Audience badge */
  .tc-audience {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.78rem;
    font-weight: 600;
    color: #1d9bf0;
    background: rgba(29,155,240,0.08);
    border: 1px solid rgba(29,155,240,0.2);
    border-radius: 9999px;
    padding: 2px 10px 2px 7px;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .tc-audience:hover { background: rgba(29,155,240,0.15); cursor: pointer; }

  /* Divider line between avatar column and textarea */
  .tc-avatar-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }
  .tc-avatar-thread-line {
    width: 2px;
    flex: 1;
    min-height: 8px;
    background: linear-gradient(to bottom, rgba(255,255,255,0.12), transparent);
    border-radius: 1px;
    margin-top: 6px;
  }

  /* Fade-in on mount */
  @keyframes composerIn {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .tc-root { animation: composerIn 0.3s ease both; }

  /* Mobile adjustments */
  @media (max-width: 600px) {
    .tc-toolbar-label { display: none; }
    .tc-post-btn { padding: 0 16px; font-size: 0.85rem; }
    .tc-audience { font-size: 0.72rem; padding: 2px 8px 2px 6px; }
  }
`;

const TweetComposer = ({ onTweetPosted }: any) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageurl, setimageurl] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxLength = 200;

  /* Auto-resize textarea */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.max(90, el.scrollHeight) + "px";
  }, [content]);

  /* ── All original logic preserved exactly ── */
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!user || !content.trim()) return;
    try {
      const tweetdata = {
        author: user?._id,
        content,
        image: imageurl,
      };
      const res = await axiosInstance.post("/post", tweetdata);
      onTweetPosted(res.data);
      setContent("");
      setimageurl("");
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const characterCount = content.length;
  const isOverLimit = characterCount > maxLength;
  const isNearLimit = characterCount > maxLength * 0.8;
  const remaining = maxLength - characterCount;
  const ringRadius = 13;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringProgress = Math.min(characterCount / maxLength, 1);

  if (!user) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const image = e.target.files[0];
    if (!image.type.startsWith("image/")) {
      alert("Please select a valid image file (JPG, PNG, GIF, etc.).");
      return;
    }
    const maxSize = 32 * 1024 * 1024;
    if (image.size > maxSize) {
      alert("Image file is too large. Maximum size is 32MB.");
      return;
    }
    setIsLoading(true);
    const formdataimg = new FormData();
    formdataimg.set("image", image);
    try {
      const res = await axios.post(
        "https://api.imgbb.com/1/upload?key=118c68781cad7502f590ce9fc6ae87ab",
        formdataimg
      );
      const url = res.data.data.display_url;
      if (url) setimageurl(url);
    } catch (error: any) {
      console.error("Image upload failed:", error);
      if (error.response) console.error("Response data:", error.response.data);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  /* ── End original logic ── */

  const ringColor = isOverLimit ? "#ef4444" : isNearLimit ? "#eab308" : "#1d9bf0";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: COMPOSER_STYLES }} />

      <div className="tc-root tc-wrap" style={{ padding: "14px 16px 10px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>

          {/* Avatar column with thread line */}
          <div className="tc-avatar-col" style={{ paddingTop: "2px" }}>
            <Avatar style={{ width: 42, height: 42, flexShrink: 0, boxShadow: "0 0 0 2px rgba(29,155,240,0.2)" }}>
              <AvatarImage src={user.avatar} alt={user.displayName} />
              <AvatarFallback style={{ background: "linear-gradient(135deg,#1d9bf0,#0e5fa0)", color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
                {user.displayName[0]}
              </AvatarFallback>
            </Avatar>
            {(content.length > 0 || imageurl) && (
              <div className="tc-avatar-thread-line" />
            )}
          </div>

          {/* Right column */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <form onSubmit={handleSubmit}>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                className="tc-textarea"
                placeholder="What's happening?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
              />

              {/* Image preview */}
              {imageurl && (
                <div className="tc-preview">
                  <img src={imageurl} alt="Preview" />
                  <button
                    type="button"
                    className="tc-preview-remove"
                    onClick={() => setimageurl("")}
                    aria-label="Remove image"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </div>
              )}

              {/* Divider */}
              <div style={{ height: "1px", background: "linear-gradient(90deg, rgba(255,255,255,0.06), transparent)", margin: "10px 0 8px" }} />

              {/* Audience row */}
              {content.length > 0 && (
                <div style={{ marginBottom: "8px", display: "flex", alignItems: "center" }}>
                  <span className="tc-audience">
                    <Globe size={12} strokeWidth={2.5} />
                    <span className="tc-toolbar-label">Everyone can reply</span>
                  </span>
                </div>
              )}

              {/* Toolbar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {/* Left icons */}
                <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                  {/* Photo upload */}
                  <label
                    htmlFor="tweetImage"
                    className={`tc-icon-btn ${isLoading ? "tc-uploading-label" : ""}`}
                    data-tip="Photo"
                    style={{ cursor: isLoading ? "wait" : "pointer" }}
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
                    ) : (
                      <Image size={18} strokeWidth={2} />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      id="tweetImage"
                      style={{ display: "none" }}
                      onChange={handlePhotoUpload}
                      disabled={isLoading}
                    />
                  </label>

                  <button type="button" className="tc-icon-btn" data-tip="Poll">
                    <BarChart3 size={18} strokeWidth={2} />
                  </button>
                  <button type="button" className="tc-icon-btn" data-tip="Emoji">
                    <Smile size={18} strokeWidth={2} />
                  </button>
                  <button type="button" className="tc-icon-btn" data-tip="Schedule">
                    <Calendar size={18} strokeWidth={2} />
                  </button>
                  <button type="button" className="tc-icon-btn" data-tip="Location">
                    <MapPin size={18} strokeWidth={2} />
                  </button>
                </div>

                {/* Right: ring + post */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {/* Character ring */}
                  {characterCount > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <svg
                        width="30"
                        height="30"
                        viewBox="0 0 30 30"
                        style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
                      >
                        {/* Background track */}
                        <circle
                          cx="15" cy="15" r={ringRadius}
                          fill="none"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="2.5"
                        />
                        {/* Progress arc */}
                        <circle
                          cx="15" cy="15" r={ringRadius}
                          fill="none"
                          stroke={ringColor}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeDasharray={ringCirc}
                          strokeDashoffset={ringCirc * (1 - ringProgress)}
                          className="tc-ring"
                        />
                      </svg>
                      {isNearLimit && (
                        <span
                          style={{
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            color: ringColor,
                            minWidth: "20px",
                            textAlign: "center",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {remaining}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Vertical divider */}
                  {characterCount > 0 && (
                    <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.1)" }} />
                  )}

                  {/* Post button */}
                  <button
                    type="submit"
                    className="tc-post-btn"
                    disabled={!content.trim() || isOverLimit || isLoading}
                  >
                    {isLoading ? "Posting…" : "Post"}
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