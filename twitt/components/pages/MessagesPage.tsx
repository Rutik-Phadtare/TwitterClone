"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Search, Send, Image, Smile, X, ArrowLeft,
  Trash2, Plus, ChevronDown,
} from "lucide-react";
import { io as socketIO, Socket } from "socket.io-client";
import axiosInstance from "@/lib/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLE_ID = "messages-page-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

    @keyframes mp-fadeIn  { from{opacity:0} to{opacity:1} }
    @keyframes mp-slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes mp-msgIn   { from{opacity:0;transform:translateY(8px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes mp-spin    { to{transform:rotate(360deg)} }
    @keyframes mp-pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }

    .mp-root { font-family:'DM Sans',sans-serif; display:flex; height:100vh; background:#000; overflow:hidden; }

    /* ── Conversation list — always full-width, single panel ── */
    .mp-list {
      width:100%; flex-shrink:0;
      display:flex; flex-direction:column;
      height:100%;
    }
    .mp-list.hidden { display:none; }
    .mp-chat { flex:1; width:100%; }
    .mp-chat.hidden { display:none; }

    .mp-conv-row {
      display:flex; align-items:center; gap:12px;
      padding:12px 16px; cursor:pointer;
      transition:background 0.15s ease;
      border-bottom:1px solid rgba(255,255,255,0.04);
    }
    .mp-conv-row:hover { background:rgba(255,255,255,0.04); }
    .mp-conv-row.active { background:rgba(29,155,240,0.08); }

    .mp-avatar-online { position:relative; flex-shrink:0; }
    .mp-online-dot {
      position:absolute; bottom:1px; right:1px;
      width:10px; height:10px; border-radius:50%;
      background:#00ba7c; border:2px solid #000;
    }

    /* ── Chat area ── */
    .mp-chat { flex:1; display:flex; flex-direction:column; height:100%; min-width:0; }

    .mp-messages {
      flex:1; overflow-y:auto; padding:16px;
      display:flex; flex-direction:column; gap:6px;
      scroll-behavior:smooth;
    }
    .mp-messages::-webkit-scrollbar { width:4px; }
    .mp-messages::-webkit-scrollbar-track { background:transparent; }
    .mp-messages::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12); border-radius:4px; }

    /* ── Message bubbles ── */
    .mp-msg-row {
      display:flex; align-items:flex-end; gap:8px;
      animation:mp-msgIn 0.2s cubic-bezier(0.22,1,0.36,1) both;
    }
    .mp-msg-row.mine { flex-direction:row-reverse; }

    .mp-bubble {
      max-width:72%;
      min-width:48px;
      padding:10px 14px;
      border-radius:18px; font-size:14px; line-height:1.5;
      word-break:break-word;
      white-space:pre-wrap;
      position:relative;
    }
    .mp-bubble.mine {
      background:linear-gradient(135deg,#1d9bf0,#0e7fd8);
      color:#fff; border-bottom-right-radius:4px;
    }
    .mp-bubble.theirs {
      background:rgba(255,255,255,0.1);
      color:rgba(255,255,255,0.9); border-bottom-left-radius:4px;
    }
    .mp-bubble.deleted { opacity:0.4; font-style:italic; }
    .mp-bubble img { max-width:100%; border-radius:12px; display:block; margin-top:4px; }
    .mp-bubble .mp-gif { max-width:220px; border-radius:12px; }
    .mp-bubble .mp-sticker { width:100px; height:100px; object-fit:contain; }
    .mp-bubble .mp-emoji-msg { font-size:36px; line-height:1.2; background:transparent !important; padding:4px 0 !important; }

    .mp-ts { font-size:11px; color:rgba(255,255,255,0.3); margin-top:4px; text-align:right; }
    .mp-msg-row.theirs .mp-ts { text-align:left; }

    /* ── Input bar ── */
    .mp-input-bar {
      display:flex; align-items:flex-end; gap:8px;
      padding:10px 14px;
      border-top:1px solid rgba(255,255,255,0.08);
      background:rgba(0,0,0,0.95);
    }
    .mp-textarea {
      flex:1; background:rgba(255,255,255,0.07);
      border:1px solid rgba(255,255,255,0.1);
      border-radius:20px; padding:10px 14px;
      color:#fff; font-family:'DM Sans',sans-serif; font-size:14px;
      outline:none; resize:none; max-height:120px; min-height:40px;
      line-height:1.5; caret-color:#1d9bf0;
      transition:border-color 0.15s;
    }
    .mp-textarea::placeholder { color:rgba(255,255,255,0.3); }
    .mp-textarea:focus { border-color:rgba(29,155,240,0.5); }

    .mp-icon-btn {
      width:38px; height:38px; border-radius:50%; border:none;
      background:transparent; color:rgba(255,255,255,0.5);
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; flex-shrink:0;
      transition:background 0.15s, color 0.15s;
    }
    .mp-icon-btn:hover { background:rgba(29,155,240,0.12); color:#1d9bf0; }
    .mp-icon-btn:disabled { opacity:0.3; cursor:not-allowed; }
    .mp-send-btn {
      width:38px; height:38px; border-radius:50%; border:none;
      background:#1d9bf0; color:#fff;
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; flex-shrink:0;
      transition:transform 0.15s, box-shadow 0.15s, opacity 0.15s;
    }
    .mp-send-btn:hover:not(:disabled) { transform:scale(1.08); box-shadow:0 4px 16px rgba(29,155,240,0.45); }
    .mp-send-btn:disabled { opacity:0.35; cursor:not-allowed; }

    /* ── Picker panel ── */
    .mp-picker {
      position:absolute; bottom:70px; left:0; right:0; z-index:200;
      background:#111; border-top:1px solid rgba(255,255,255,0.1);
      animation:mp-slideUp 0.22s cubic-bezier(0.22,1,0.36,1) both;
      max-height:320px; overflow:hidden;
    }
    .mp-picker-tabs {
      display:flex; border-bottom:1px solid rgba(255,255,255,0.08);
      padding:0 12px;
    }
    .mp-picker-tab {
      padding:10px 14px; background:none; border:none; color:rgba(255,255,255,0.4);
      font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600;
      cursor:pointer; transition:color 0.15s; border-bottom:2px solid transparent;
    }
    .mp-picker-tab.active { color:#1d9bf0; border-bottom-color:#1d9bf0; }

    /* Emoji grid */
    .mp-emoji-grid { display:flex; flex-wrap:wrap; gap:4px; padding:10px 12px; overflow-y:auto; max-height:240px; }
    .mp-emoji-btn { font-size:24px; padding:4px; border-radius:8px; background:none; border:none; cursor:pointer; transition:background 0.12s; line-height:1; }
    .mp-emoji-btn:hover { background:rgba(255,255,255,0.1); }

    /* GIF grid */
    .mp-gif-search { width:100%; padding:8px 12px; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.1); border-radius:9999px; color:#fff; font-family:'DM Sans',sans-serif; font-size:13px; outline:none; margin:10px 12px; width:calc(100% - 24px); }
    .mp-gif-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:4px; padding:0 12px 12px; overflow-y:auto; max-height:220px; }
    .mp-gif-item { border-radius:8px; overflow:hidden; cursor:pointer; aspect-ratio:4/3; }
    .mp-gif-item img { width:100%; height:100%; object-fit:cover; transition:transform 0.15s; }
    .mp-gif-item:hover img { transform:scale(1.04); }

    /* Sticker grid */
    .mp-sticker-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; padding:12px; overflow-y:auto; max-height:260px; }
    .mp-sticker-item { cursor:pointer; border-radius:12px; padding:4px; transition:background 0.12s; display:flex; align-items:center; justify-content:center; aspect-ratio:1; }
    .mp-sticker-item:hover { background:rgba(255,255,255,0.08); }
    .mp-sticker-item img { width:100%; height:100%; object-fit:contain; }

    /* Search new conv */
    .mp-new-conv-list { max-height:280px; overflow-y:auto; }
    .mp-search-user-row { display:flex; align-items:center; gap:10px; padding:10px 16px; cursor:pointer; transition:background 0.15s; }
    .mp-search-user-row:hover { background:rgba(255,255,255,0.05); }

    /* Typing indicator */
    .mp-typing { display:flex; align-items:center; gap:4px; padding:4px 8px; }
    .mp-typing-dot { width:6px; height:6px; border-radius:50%; background:#1d9bf0; animation:mp-pulse 1.2s ease-in-out infinite; }
    .mp-typing-dot:nth-child(2) { animation-delay:0.2s; }
    .mp-typing-dot:nth-child(3) { animation-delay:0.4s; }

    /* Empty state */
    .mp-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; flex:1; gap:12px; color:rgba(255,255,255,0.3); padding:40px 24px; text-align:center; }

    /* Delete hover */
    .mp-msg-row:hover .mp-delete-btn { opacity:1; }
    .mp-delete-btn { opacity:0; background:rgba(0,0,0,0.6); border:none; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:rgba(255,255,255,0.6); transition:opacity 0.15s, background 0.15s; flex-shrink:0; align-self:center; }
    .mp-delete-btn:hover { background:rgba(239,68,68,0.3); color:#ef4444; }

    .mp-spin { animation:mp-spin 0.8s linear infinite; }
  `;
  document.head.appendChild(s);
}

// ─── Built-in emoji list ──────────────────────────────────────────────────────
const EMOJIS = [
  "😀","😂","🥰","😍","🤩","😎","🥳","😭","😤","😡",
  "👍","👎","❤️","🔥","✨","💯","🎉","🙏","👏","💪",
  "😊","🤣","😅","😇","🤔","😏","🙄","😴","🤯","🥺",
  "💀","👻","🤖","👾","🎃","🌈","⚡","🌊","🍕","🍔",
  "🏆","🎯","🚀","💎","👑","🦋","🐶","🐱","🦊","🐼",
  "😘","🥲","😋","😜","🤪","😵","🤑","🤗","🫡","🫶",
  "💔","💕","💞","💝","🖤","💜","💙","💚","💛","🧡",
  "🌟","⭐","🌙","☀️","❄️","🌸","🌺","🌻","🍀","🎵",
];

// ─── Built-in sticker packs ───────────────────────────────────────────────────
const STICKERS = [
  { id: "s1",  url: "https://em-content.zobj.net/source/google/387/face-with-tears-of-joy_1f602.png",   label: "LOL" },
  { id: "s2",  url: "https://em-content.zobj.net/source/google/387/smiling-face-with-heart-eyes_1f60d.png", label: "Love" },
  { id: "s3",  url: "https://em-content.zobj.net/source/google/387/fire_1f525.png",                    label: "Fire" },
  { id: "s4",  url: "https://em-content.zobj.net/source/google/387/party-popper_1f389.png",            label: "Party" },
  { id: "s5",  url: "https://em-content.zobj.net/source/google/387/thumbs-up_1f44d.png",               label: "👍" },
  { id: "s6",  url: "https://em-content.zobj.net/source/google/387/broken-heart_1f494.png",            label: "Broken" },
  { id: "s7",  url: "https://em-content.zobj.net/source/google/387/rocket_1f680.png",                  label: "Rocket" },
  { id: "s8",  url: "https://em-content.zobj.net/source/google/387/crown_1f451.png",                   label: "Crown" },
  { id: "s9",  url: "https://em-content.zobj.net/source/google/387/sparkles_2728.png",                 label: "Sparkle" },
  { id: "s10", url: "https://em-content.zobj.net/source/google/387/hundred-points_1f4af.png",          label: "100" },
  { id: "s11", url: "https://em-content.zobj.net/source/google/387/trophy_1f3c6.png",                  label: "Trophy" },
  { id: "s12", url: "https://em-content.zobj.net/source/google/387/rainbow_1f308.png",                 label: "Rainbow" },
];

// ─── Time formatter ───────────────────────────────────────────────────────────
const fmtTime = (date: string) => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const fmtMsgTime = (date: string) =>
  new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ─── Socket singleton ─────────────────────────────────────────────────────────
let socketInstance: Socket | null = null;
const getSocket = () => {
  if (!socketInstance) {
    socketInstance = socketIO(
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000",
      { transports: ["websocket", "polling"], autoConnect: false }
    );
  }
  return socketInstance;
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════
export default function MessagesPage() {
  const { user }  = useAuth();
  const { lang }  = useLanguage();
  const socket    = getSocket();

  // ── State ─────────────────────────────────────────────────────────────────
  const [conversations,    setConversations]    = useState<any[]>([]);
  const [activeConv,       setActiveConv]       = useState<any>(null);
  const [messages,         setMessages]         = useState<any[]>([]);
  const [text,             setText]             = useState("");
  const [loadingConvs,     setLoadingConvs]     = useState(true);
  const [loadingMsgs,      setLoadingMsgs]      = useState(false);
  const [sending,          setSending]          = useState(false);
  const [typingUser,       setTypingUser]       = useState<string | null>(null);
  const [showPicker,       setShowPicker]       = useState(false);
  const [pickerTab,        setPickerTab]        = useState<"emoji"|"gif"|"sticker">("emoji");
  const [gifSearch,        setGifSearch]        = useState("");
  const [gifs,             setGifs]             = useState<any[]>([]);
  const [gifsLoading,      setGifsLoading]      = useState(false);
  const [showNewConv,      setShowNewConv]      = useState(false);
  const [userSearch,       setUserSearch]       = useState("");
  const [userResults,      setUserResults]      = useState<any[]>([]);
  const [uploadingImg,     setUploadingImg]     = useState(false);
  // Controls which panel is visible — always single-panel on every screen size
  const [view,             setView]             = useState<"list"|"chat">("list");

  const messagesEndRef   = useRef<HTMLDivElement>(null);
  const textareaRef      = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef     = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // ── Connect socket ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?._id) return;
    if (!socket.connected) socket.connect();
    socket.emit("user:online", user._id);

    socket.on("message:new", (msg: any) => {
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      setConversations(prev => prev.map(c =>
        c._id === msg.conversationId
          ? { ...c, lastMessage: { content: msg.content || `[${msg.type}]`, type: msg.type, createdAt: msg.createdAt }, unreadCount: msg.senderId?._id !== user._id ? (c.unreadCount || 0) + 1 : c.unreadCount }
          : c
      ).sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()));
    });

    socket.on("message:deleted", ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, deleted: true, content: "", mediaUrl: null } : m));
    });

    socket.on("typing:start", ({ userId, displayName }: any) => {
      if (userId !== user._id) setTypingUser(displayName);
    });
    socket.on("typing:stop", ({ userId }: any) => {
      if (userId !== user._id) setTypingUser(null);
    });

    socket.on("presence:update", ({ userId, online }: any) => {
      setConversations(prev => prev.map(c => ({
        ...c,
        online: c.otherUser?._id === userId ? online : c.online,
      })));
    });

    socket.on("conversation:updated", ({ conversationId, lastMessage, unreadCount }: any) => {
      setConversations(prev => prev.map(c => c._id === conversationId ? { ...c, lastMessage, unreadCount } : c));
    });

    return () => {
      socket.off("message:new");
      socket.off("message:deleted");
      socket.off("typing:start");
      socket.off("typing:stop");
      socket.off("presence:update");
      socket.off("conversation:updated");
    };
  }, [user?._id]);

  // ── Fetch conversations ───────────────────────────────────────────────────
  useEffect(() => {
    axiosInstance.get("/conversations")
      .then(res => setConversations(res.data))
      .catch(console.error)
      .finally(() => setLoadingConvs(false));
  }, []);

  // ── Open a conversation ───────────────────────────────────────────────────
  const openConversation = async (conv: any) => {
    if (activeConv?._id === conv._id) return;
    if (activeConv?._id) socket.emit("conversation:leave", activeConv._id);

    setActiveConv(conv);
    setMessages([]);
    setShowPicker(false);
    setLoadingMsgs(true);
    setView("chat"); // always navigate to chat panel

    socket.emit("conversation:join", conv._id);

    try {
      const res = await axiosInstance.get(`/conversations/${conv._id}/messages`);
      setMessages(res.data);
      setConversations(prev => prev.map(c => c._id === conv._id ? { ...c, unreadCount: 0 } : c));
    } catch (e) { console.error(e); }
    finally { setLoadingMsgs(false); }
  };

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  // ── Auto-grow textarea ────────────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [text]);

  // ── Typing indicator ──────────────────────────────────────────────────────
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (!activeConv) return;
    socket.emit("typing:start", { conversationId: activeConv._id, userId: user?._id, displayName: user?.displayName });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit("typing:stop", { conversationId: activeConv._id, userId: user?._id });
    }, 1500);
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async (type = "text", content = "", mediaUrl: string | null = null, tenorId: string | null = null) => {
    if (!activeConv) return;
    if (type === "text" && !content.trim()) return;
    setSending(true);
    socket.emit("typing:stop", { conversationId: activeConv._id, userId: user?._id });
    try {
      await axiosInstance.post(`/conversations/${activeConv._id}/messages`, { type, content, mediaUrl, tenorId });
      if (type === "text") setText("");
      setShowPicker(false);
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const handleSendText = () => sendMessage("text", text);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendText(); }
  };

  // ── Image upload ──────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    const fd = new FormData();
    fd.set("image", file);
    try {
      const res = await axiosInstance.post("/upload-message-image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      await sendMessage("image", "", res.data.url);
    } catch (e) { console.error(e); }
    finally { setUploadingImg(false); e.target.value = ""; }
  };

  // ── GIF search ────────────────────────────────────────────────────────────
  const searchGifs = useCallback(async (q: string) => {
    const apiKey = process.env.NEXT_PUBLIC_TENOR_API_KEY;
    if (!apiKey) { console.warn("No NEXT_PUBLIC_TENOR_API_KEY set"); return; }
    setGifsLoading(true);
    try {
      const endpoint = q.trim()
        ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=${apiKey}&limit=12&media_filter=gif`
        : `https://tenor.googleapis.com/v2/featured?key=${apiKey}&limit=12&media_filter=gif`;
      const res  = await fetch(endpoint);
      const data = await res.json();
      setGifs(data.results || []);
    } catch (e) { console.error(e); }
    finally { setGifsLoading(false); }
  }, []);

  useEffect(() => {
    if (pickerTab === "gif") searchGifs(gifSearch);
  }, [pickerTab, gifSearch, searchGifs]);

  const sendGif     = async (gif: any)                         => { const url = gif.media_formats?.gif?.url || gif.media_formats?.tinygif?.url; await sendMessage("gif", "", url, gif.id); };
  const sendSticker = async (sticker: { id: string; url: string }) => { await sendMessage("sticker", "", sticker.url); };
  const sendEmoji   = async (emoji: string)                    => { await sendMessage("emoji", emoji); };

  // ── Delete message ────────────────────────────────────────────────────────
  const deleteMessage = async (msgId: string) => {
    if (!activeConv) return;
    try { await axiosInstance.delete(`/conversations/${activeConv._id}/messages/${msgId}`); }
    catch (e) { console.error(e); }
  };

  // ── New conversation: search users ────────────────────────────────────────
  useEffect(() => {
    if (!userSearch.trim()) { setUserResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await axiosInstance.get(`/users/search?q=${encodeURIComponent(userSearch)}`);
        setUserResults(res.data);
      } catch (e) { console.error(e); }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const startConversation = async (participantId: string) => {
    try {
      const res = await axiosInstance.post("/conversations", { participantId });
      const newConv = res.data;
      setConversations(prev => prev.some(c => c._id === newConv._id) ? prev : [newConv, ...prev]);
      setShowNewConv(false);
      setUserSearch("");
      openConversation(newConv);
    } catch (e) { console.error(e); }
  };

  const getOther = (conv: any) =>
    conv.otherUser || conv.participants?.find((p: any) => p._id !== user?._id);

  // ── Render message bubble ─────────────────────────────────────────────────
  const renderBubble = (msg: any) => {
    const isMine = msg.senderId?._id === user?._id || msg.senderId === user?._id;
    if (msg.deleted) return <div className="mp-bubble" style={{ background: "transparent", color: "rgba(255,255,255,0.3)", fontSize: 13, fontStyle: "italic", padding: "4px 0" }}>Message deleted</div>;
    switch (msg.type) {
      case "image":   return <div className="mp-bubble" style={{ padding: 4, background: "transparent" }}><img src={msg.mediaUrl} alt="img" style={{ maxWidth: 240, borderRadius: 14, display: "block" }} /></div>;
      case "gif":     return <div className="mp-bubble" style={{ padding: 4, background: "transparent" }}><img src={msg.mediaUrl} alt="GIF" className="mp-gif" /></div>;
      case "sticker": return <div style={{ background: "transparent" }}><img src={msg.mediaUrl} alt="sticker" className="mp-sticker" /></div>;
      case "emoji":   return <div style={{ fontSize: 42, lineHeight: 1.2 }}>{msg.content}</div>;
      default:        return <div className={`mp-bubble ${isMine ? "mine" : "theirs"}`}>{msg.content}</div>;
    }
  };

  if (!user) return null;

  return (
    <div className="mp-root" style={{ position: "relative" }}>

      {/* ════════════════════════════════════
          PANEL 1 — Conversation list
      ════════════════════════════════════ */}
      <div className={`mp-list${view === "chat" ? " hidden" : ""}`}>

        {/* Header */}
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h1 style={{ color: "#fff", fontWeight: 800, fontSize: 20, margin: 0 }}>
              {t(lang, "messages")}
            </h1>
            <button
              onClick={() => setShowNewConv(v => !v)}
              style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              title="New message"
            >
              <Plus size={17} />
            </button>
          </div>

          {showNewConv && (
            <div style={{ animation: "mp-slideUp 0.2s ease both" }}>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                <input
                  placeholder="Search people..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  autoFocus
                  style={{ width: "100%", padding: "8px 10px 8px 32px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9999, color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              {userResults.length > 0 && (
                <div className="mp-new-conv-list" style={{ marginTop: 6, background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, overflow: "hidden" }}>
                  {userResults.map(u => (
                    <div key={u._id} className="mp-search-user-row" onClick={() => startConversation(u._id)}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <img src={u.avatar} alt={u.displayName} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} onError={e => (e.currentTarget.style.display = "none")} />
                      </div>
                      <div>
                        <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{u.displayName}</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>@{u.username}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conversation rows */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loadingConvs ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                  <div style={{ width: "55%", height: 12, background: "rgba(255,255,255,0.07)", borderRadius: 6 }} />
                  <div style={{ width: "75%", height: 11, background: "rgba(255,255,255,0.05)", borderRadius: 6 }} />
                </div>
              </div>
            ))
          ) : conversations.length === 0 ? (
            <div className="mp-empty" style={{ padding: "60px 24px" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(29,155,240,0.08)", border: "1px solid rgba(29,155,240,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Send size={22} color="#1d9bf0" />
              </div>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 17, margin: 0 }}>No conversations yet</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>Click + to start a new message</p>
            </div>
          ) : (
            conversations.map(conv => {
              const other    = getOther(conv);
              const isActive = activeConv?._id === conv._id;
              const lastMsg  = conv.lastMessage;
              return (
                <div key={conv._id} className={`mp-conv-row${isActive ? " active" : ""}`} onClick={() => openConversation(conv)}>
                  <div className="mp-avatar-online">
                    <Avatar style={{ width: 46, height: 46 }}>
                      <AvatarImage src={other?.avatar} style={{ objectFit: "cover" }} />
                      <AvatarFallback style={{ background: "linear-gradient(135deg,#1d9bf0,#7950ff)", color: "#fff", fontWeight: 700 }}>
                        {other?.displayName?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    {conv.online && <div className="mp-online-dot" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
                        {other?.displayName || "Unknown"}
                      </span>
                      {lastMsg?.createdAt && (
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, flexShrink: 0, marginLeft: 6 }}>
                          {fmtTime(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 170 }}>
                        {lastMsg ? (lastMsg.type === "text" ? lastMsg.content : `[${lastMsg.type}]`) : "Start a conversation"}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span style={{ background: "#1d9bf0", color: "#fff", borderRadius: "9999px", minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, padding: "0 4px", flexShrink: 0, marginLeft: 6 }}>
                          {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ════════════════════════════════════
          PANEL 2 — Chat window
      ════════════════════════════════════ */}
      <div className={`mp-chat${view === "list" ? " hidden" : ""}`} style={{ position: "relative" }}>
        {!activeConv ? (
          <div className="mp-empty">
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(29,155,240,0.08)", border: "1px solid rgba(29,155,240,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Send size={28} color="#1d9bf0" />
            </div>
            <p style={{ color: "#fff", fontWeight: 800, fontSize: 20, margin: 0 }}>Your Messages</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0 }}>Select a conversation or start a new one</p>
          </div>
        ) : (
          <>
            {/* Chat header — back button always visible */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.95)", flexShrink: 0 }}>
              <button className="mp-icon-btn" onClick={() => setView("list")} title="Back to conversations">
                <ArrowLeft size={20} />
              </button>

              {(() => {
                const other = getOther(activeConv);
                return (
                  <>
                    <div className="mp-avatar-online">
                      <Avatar style={{ width: 40, height: 40 }}>
                        <AvatarImage src={other?.avatar} style={{ objectFit: "cover" }} />
                        <AvatarFallback style={{ background: "linear-gradient(135deg,#1d9bf0,#7950ff)", color: "#fff", fontWeight: 700 }}>
                          {other?.displayName?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      {activeConv.online && <div className="mp-online-dot" />}
                    </div>
                    <div>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{other?.displayName}</div>
                      <div style={{ color: activeConv.online ? "#00ba7c" : "rgba(255,255,255,0.3)", fontSize: 12 }}>
                        {activeConv.online ? "Online" : `@${other?.username}`}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Messages */}
            <div className="mp-messages" ref={chatContainerRef}>
              {loadingMsgs ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", borderTop: "2px solid #1d9bf0" }} className="mp-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 24px", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
                  No messages yet. Say hello! 👋
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine    = msg.senderId?._id === user?._id || msg.senderId === user?._id;
                  const showAvatar = !isMine && (idx === 0 || messages[idx - 1]?.senderId?._id !== msg.senderId?._id);
                  return (
                    <div key={msg._id} className={`mp-msg-row${isMine ? " mine" : ""}`} style={{ alignItems: "flex-end" }}>
                      {!isMine && (
                        <div style={{ width: 28, flexShrink: 0 }}>
                          {showAvatar && (
                            <Avatar style={{ width: 28, height: 28 }}>
                              <AvatarImage src={msg.senderId?.avatar} style={{ objectFit: "cover" }} />
                              <AvatarFallback style={{ background: "linear-gradient(135deg,#1d9bf0,#7950ff)", color: "#fff", fontWeight: 700, fontSize: 11 }}>
                                {msg.senderId?.displayName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", maxWidth: "75%", minWidth: "50%" }}>
                        {renderBubble(msg)}
                        <span className="mp-ts">{fmtMsgTime(msg.createdAt)}</span>
                      </div>
                      {isMine && !msg.deleted && (
                        <button className="mp-delete-btn" onClick={() => deleteMessage(msg._id)} title="Delete">
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}

              {typingUser && (
                <div className="mp-msg-row" style={{ gap: 8 }}>
                  <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 18, padding: "10px 14px", display: "flex", alignItems: "center", gap: 4 }}>
                    <div className="mp-typing-dot" />
                    <div className="mp-typing-dot" />
                    <div className="mp-typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Picker panel */}
            {showPicker && (
              <div className="mp-picker">
                <div className="mp-picker-tabs">
                  {(["emoji", "gif", "sticker"] as const).map(tab => (
                    <button key={tab} className={`mp-picker-tab${pickerTab === tab ? " active" : ""}`} onClick={() => setPickerTab(tab)}>
                      {tab === "emoji" ? "😊 Emoji" : tab === "gif" ? "🎞 GIF" : "🎨 Stickers"}
                    </button>
                  ))}
                  <button onClick={() => setShowPicker(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "0 8px" }}>
                    <ChevronDown size={16} />
                  </button>
                </div>

                {pickerTab === "emoji" && (
                  <div className="mp-emoji-grid">
                    {EMOJIS.map(e => <button key={e} className="mp-emoji-btn" onClick={() => sendEmoji(e)}>{e}</button>)}
                  </div>
                )}

                {pickerTab === "gif" && (
                  <>
                    <input className="mp-gif-search" placeholder="Search GIFs..." value={gifSearch} onChange={e => setGifSearch(e.target.value)} />
                    <div className="mp-gif-grid">
                      {gifsLoading ? (
                        <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 20, color: "rgba(255,255,255,0.4)" }}>Loading GIFs…</div>
                      ) : gifs.length === 0 ? (
                        <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 20, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                          {process.env.NEXT_PUBLIC_TENOR_API_KEY ? "No GIFs found" : "Add NEXT_PUBLIC_TENOR_API_KEY to enable GIFs"}
                        </div>
                      ) : (
                        gifs.map(gif => (
                          <div key={gif.id} className="mp-gif-item" onClick={() => sendGif(gif)}>
                            <img src={gif.media_formats?.tinygif?.url || gif.media_formats?.gif?.url} alt={gif.title} loading="lazy" />
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}

                {pickerTab === "sticker" && (
                  <div className="mp-sticker-grid">
                    {STICKERS.map(s => (
                      <div key={s.id} className="mp-sticker-item" onClick={() => sendSticker(s)} title={s.label}>
                        <img src={s.url} alt={s.label} loading="lazy" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Input bar */}
            <div className="mp-input-bar">
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
              <button className="mp-icon-btn" onClick={() => fileInputRef.current?.click()} disabled={uploadingImg} title="Send image">
                {uploadingImg
                  ? <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid #1d9bf0" }} className="mp-spin" />
                  : <Image size={18} />
                }
              </button>
              <button className="mp-icon-btn" onClick={() => setShowPicker(v => !v)} style={{ color: showPicker ? "#1d9bf0" : undefined }} title="Emoji / GIF / Stickers">
                <Smile size={18} />
              </button>
              <textarea
                ref={textareaRef}
                className="mp-textarea"
                placeholder="Start a new message"
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={sending}
              />
              <button className="mp-send-btn" onClick={handleSendText} disabled={!text.trim() || sending} title="Send">
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}