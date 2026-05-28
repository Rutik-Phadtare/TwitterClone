import dotenv from "dotenv";
dotenv.config();

import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import Razorpay from "razorpay";
import { UAParser } from "ua-parser-js";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";

import User from "./modals/user.js";
import Tweet from "./modals/tweet.js";
import LoginLog from "./modals/loginLog.js";
import Subscription from "./modals/subscription.js";
import Conversation from "./modals/conversation.js";
import Message from "./modals/message.js";
import { verifyToken } from "./middleware/auth.js";

console.log("📧 BREVO_API_KEY configured:", !!process.env.BREVO_API_KEY);

// ── Brevo HTTP email sender ───────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender:      { name: "Twiller", email: process.env.BREVO_SENDER_EMAIL },
      to:          [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(JSON.stringify(err)); }
  console.log("✅ Email sent via Brevo API to:", to);
  return res.json();
};

// ── Cloudinary ────────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Razorpay ──────────────────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── Multer ────────────────────────────────────────────────────────────────────
const upload      = multer();
const audioUpload = multer({ limits: { fileSize: 100 * 1024 * 1024 } });
const msgUpload   = multer({ limits: { fileSize: 20 * 1024 * 1024 } });

// ── Plans & OTP stores ────────────────────────────────────────────────────────
const PLANS = {
  bronze: { price: 10000,  limit: 3  },
  silver: { price: 30000,  limit: 5  },
  gold:   { price: 100000, limit: -1 },
};
const otpStore    = new Map();
const smsOtpStore = new Map();

// ── Express + HTTP server + Socket.io ─────────────────────────────────────────
const app        = express();
const httpServer = createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "https://twitter-clone-lime-alpha.vercel.app",
].filter(Boolean);

const io = new SocketServer(httpServer, {
  cors: {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app"))
        return cb(null, true);
      cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// ── Online users map: userId → Set of socket IDs ─────────────────────────────
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("user:online", (userId) => {
    if (!userId) return;
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);
    socket.userId = userId;
    socket.join(`user:${userId}`);
    io.emit("presence:update", { userId, online: true });
    console.log(`👤 User ${userId} online`);
  });

  socket.on("conversation:join",  (convId) => { if (convId) socket.join(`conv:${convId}`); });
  socket.on("conversation:leave", (convId) => { if (convId) socket.leave(`conv:${convId}`); });

  socket.on("typing:start", ({ conversationId, userId, displayName }) => {
    socket.to(`conv:${conversationId}`).emit("typing:start", { userId, displayName });
  });
  socket.on("typing:stop", ({ conversationId, userId }) => {
    socket.to(`conv:${conversationId}`).emit("typing:stop", { userId });
  });
  socket.on("messages:read", ({ conversationId, userId }) => {
    socket.to(`conv:${conversationId}`).emit("messages:read", { conversationId, userId });
  });

  socket.on("disconnect", () => {
    const uid = socket.userId;
    if (uid && onlineUsers.has(uid)) {
      onlineUsers.get(uid).delete(socket.id);
      if (onlineUsers.get(uid).size === 0) {
        onlineUsers.delete(uid);
        io.emit("presence:update", { userId: uid, online: false });
        console.log(`👤 User ${uid} offline`);
      }
    }
    console.log("🔌 Socket disconnected:", socket.id);
  });
});

const isUserOnline = (userId) => onlineUsers.has(userId?.toString());

// ── CORS + body parser ────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith(".vercel.app")) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.get("/", (req, res) => res.send("Twiller backend is running ✅"));

// ── MongoDB — NOTE: use httpServer.listen (not app.listen) for Socket.io ─────
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    httpServer.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

app.post("/register", verifyToken, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { email: req.user.email },
      {
        $setOnInsert: {
          email:      req.user.email,
          name:       req.body.name       || req.user.name    || "",
          profilePic: req.body.profilePic || req.user.picture || "",
          ...req.body,
        },
      },
      { upsert: true, new: true }
    );
    return res.status(200).send(user);
  } catch (error) { return res.status(400).send({ error: error.message }); }
});

app.get("/loggedinuser", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).send({ error: "User not found" });
    return res.status(200).send(user);
  } catch (error) { return res.status(400).send({ error: error.message }); }
});

app.patch("/userupdate/:email", verifyToken, async (req, res) => {
  if (req.user.email !== req.params.email)
    return res.status(403).send({ error: "Forbidden" });
  try {
    const updated = await User.findOneAndUpdate(
      { email: req.params.email },
      { $set: req.body },
      { new: true, upsert: false }
    );
    if (!updated) return res.status(404).send({ error: "User not found" });
    return res.status(200).send(updated);
  } catch (error) { return res.status(400).send({ error: error.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// TWEET ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

app.post("/post", verifyToken, async (req, res) => {
  try {
    const content = (req.body.content || "").trim();
    if (!content)             return res.status(400).send({ error: "Tweet content cannot be empty" });
    if (content.length > 280) return res.status(400).send({ error: "Tweet exceeds 280 characters" });

    const dbUser = await User.findOne({ email: req.user.email });
    if (!dbUser) return res.status(404).send({ error: "User not found — please register first" });

    const sub        = await Subscription.findOne({ userId: dbUser._id });
    const tweetLimit = sub?.tweetLimit ?? 1;
    const tweetsUsed = sub?.tweetsUsed ?? 0;

    if (tweetLimit !== -1 && tweetsUsed >= tweetLimit) {
      return res.status(403).send({
        error: `Tweet limit reached. You've used ${tweetsUsed}/${tweetLimit} tweets this month. Upgrade your plan to post more.`,
      });
    }

    const tweet = new Tweet({
      content,
      image:         req.body.image         || null,
      audio:         req.body.audio         || null,
      audioDuration: req.body.audioDuration || null,
      author:        dbUser._id,
    });
    await tweet.save();

    if (sub) { sub.tweetsUsed += 1; await sub.save(); }
    else { await Subscription.create({ userId: dbUser._id, plan: "free", tweetLimit: 1, tweetsUsed: 1 }); }

    const populated = await tweet.populate("author");
    return res.status(201).send(populated);
  } catch (error) {
    console.error("🔴 POST /post error:", error.message, error.errors);
    return res.status(400).send({ error: error.message });
  }
});

app.get("/post", async (req, res) => {
  try {
    const { cursor, limit = 20 } = req.query;
    const query  = cursor ? { _id: { $lt: cursor } } : {};
    const tweets = await Tweet.find(query)
      .sort({ _id: -1 })
      .limit(Number(limit))
      .populate("author");
    return res.status(200).send({
      tweets,
      nextCursor: tweets.length === Number(limit) ? tweets[tweets.length - 1]._id : null,
    });
  } catch (error) { return res.status(400).send({ error: error.message }); }
});

app.patch("/post/:id", verifyToken, async (req, res) => {
  try {
    const content = (req.body.content || "").trim();
    if (!content)             return res.status(400).send({ error: "Content cannot be empty" });
    if (content.length > 280) return res.status(400).send({ error: "Tweet exceeds 280 characters" });

    const dbUser = await User.findOne({ email: req.user.email });
    if (!dbUser) return res.status(404).send({ error: "User not found" });

    const tweet = await Tweet.findById(req.params.id);
    if (!tweet)  return res.status(404).send({ error: "Tweet not found" });

    if (tweet.author.toString() !== dbUser._id.toString())
      return res.status(403).send({ error: "Forbidden — you can only edit your own tweets" });

    tweet.content = content;
    tweet.edited  = true;
    await tweet.save();

    const populated = await tweet.populate("author");
    return res.status(200).send(populated);
  } catch (error) { return res.status(400).send({ error: error.message }); }
});

app.delete("/post/:id", verifyToken, async (req, res) => {
  try {
    const dbUser = await User.findOne({ email: req.user.email });
    const tweet  = await Tweet.findById(req.params.id);
    if (!tweet)  return res.status(404).send({ error: "Tweet not found" });
    if (tweet.author.toString() !== dbUser._id.toString())
      return res.status(403).send({ error: "Forbidden" });
    await Tweet.findByIdAndDelete(req.params.id);
    return res.status(200).send({ message: "Tweet deleted" });
  } catch (error) { return res.status(400).send({ error: error.message }); }
});

// ── Like — populate author so avatar/name survive after toggle ────────────────
app.post("/like/:tweetid", verifyToken, async (req, res) => {
  try {
    const dbUser = await User.findOne({ email: req.user.email });
    if (!dbUser) return res.status(404).send({ error: "User not found" });

    const tweet = await Tweet.findById(req.params.tweetid);
    if (!tweet)  return res.status(404).send({ error: "Tweet not found" });

    const userId       = dbUser._id.toString();
    const alreadyLiked = tweet.likedBy.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      tweet.likes   = Math.max(0, tweet.likes - 1);
      tweet.likedBy = tweet.likedBy.filter((id) => id.toString() !== userId);
    } else {
      tweet.likes += 1;
      tweet.likedBy.push(dbUser._id);
    }

    await tweet.save();
    return res.send(await tweet.populate("author"));
  } catch (error) { return res.status(400).send({ error: error.message }); }
});

// ── Retweet — populate author so avatar/name survive after toggle ─────────────
app.post("/retweet/:tweetid", verifyToken, async (req, res) => {
  try {
    const dbUser = await User.findOne({ email: req.user.email });
    if (!dbUser) return res.status(404).send({ error: "User not found" });

    const tweet = await Tweet.findById(req.params.tweetid);
    if (!tweet)  return res.status(404).send({ error: "Tweet not found" });

    const userId           = dbUser._id.toString();
    const alreadyRetweeted = tweet.retweetedBy.some((id) => id.toString() === userId);

    if (alreadyRetweeted) {
      tweet.retweets    = Math.max(0, tweet.retweets - 1);
      tweet.retweetedBy = tweet.retweetedBy.filter((id) => id.toString() !== userId);
    } else {
      tweet.retweets += 1;
      tweet.retweetedBy.push(dbUser._id);
    }

    await tweet.save();
    return res.send(await tweet.populate("author"));
  } catch (error) { return res.status(400).send({ error: error.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// UPLOAD ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

app.post("/upload-image", verifyToken, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });
    const b64     = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const result  = await cloudinary.uploader.upload(dataURI, { folder: "twiller", resource_type: "image" });
    return res.json({ url: result.secure_url });
  } catch (error) { return res.status(500).json({ error: "Upload failed" }); }
});

// ── TASK: Audio uploads restricted to 2:00 PM – 7:00 PM IST ──────────────────
app.post("/upload-audio", verifyToken, audioUpload.single("audio"), async (req, res) => {
  const now  = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hour = now.getHours();
  if (hour < 14 || hour >= 19)
    return res.status(403).json({ error: "Audio uploads only allowed between 2:00 PM and 7:00 PM IST" });

  if (!req.file) return res.status(400).json({ error: "No audio file" });
  try {
    const b64     = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const result  = await cloudinary.uploader.upload(dataURI, {
      resource_type: "video",
      folder:        "twiller-audio",
    });
    if (result.duration > 300) {
      await cloudinary.uploader.destroy(result.public_id, { resource_type: "video" });
      return res.status(400).json({ error: "Audio must be under 5 minutes" });
    }
    return res.json({ url: result.secure_url, duration: result.duration });
  } catch (error) { return res.status(500).json({ error: "Audio upload failed" }); }
});

// ── Upload image for chat messages ────────────────────────────────────────────
app.post("/upload-message-image", verifyToken, msgUpload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });
    const b64     = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const result  = await cloudinary.uploader.upload(dataURI, { folder: "twiller-messages", resource_type: "image" });
    return res.json({ url: result.secure_url });
  } catch (error) { return res.status(500).json({ error: "Upload failed" }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// OTP ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

app.post("/send-otp", verifyToken, async (req, res) => {
  try {
    console.log("📧 Sending OTP to:", req.user.email);

    const existing = otpStore.get(req.user.email);
    if (existing && existing.createdAt && (Date.now() - existing.createdAt) < 60_000)
      return res.json({ message: "OTP already sent — check your email" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(req.user.email, { otp, expires: Date.now() + 10 * 60 * 1000, createdAt: Date.now() });

    await sendEmail({
      to:      req.user.email,
      subject: "Your Twiller verification code",
      html: `
        <div style="font-family:sans-serif;max-width:400px;padding:24px;background:#f9f9f9;border-radius:12px">
          <h2 style="color:#1d9bf0;margin:0 0 16px">Twiller — Verify your login</h2>
          <p style="color:#333;margin:0 0 8px">Your one-time verification code:</p>
          <div style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#000;padding:20px 0;text-align:center">${otp}</div>
          <p style="color:#888;font-size:13px;margin:16px 0 0">Expires in 10 minutes. Do not share this code.</p>
        </div>`,
    });

    return res.json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("❌ OTP send error:", error.message);
    return res.status(500).json({ error: "Failed to send OTP", detail: error.message });
  }
});

app.post("/verify-otp", verifyToken, async (req, res) => {
  const record = otpStore.get(req.user.email);
  if (!record || record.otp !== req.body.otp || Date.now() > record.expires)
    return res.status(400).json({ error: "Invalid or expired OTP" });
  otpStore.delete(req.user.email);
  return res.json({ message: "OTP verified" });
});

app.post("/send-sms-otp", verifyToken, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number required" });

    const existing = smsOtpStore.get(phone);
    if (existing && (Date.now() - existing.createdAt) < 60_000)
      return res.json({ message: "OTP already sent — check your SMS" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    smsOtpStore.set(phone, { otp, expires: Date.now() + 10 * 60 * 1000, createdAt: Date.now() });

    console.log(`📱 Sending SMS OTP to: ${phone}`);

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&message=Your+Twiller+verification+OTP+is+${otp}.+Valid+for+5+minutes.&language=english&route=q&numbers=${cleanPhone}`;

    const response = await fetch(url, { method: "GET", headers: { "cache-control": "no-cache" } });
    const data = await response.json();
    console.log("Fast2SMS response:", data);

    if (!data.return) throw new Error(data.message || "SMS send failed");

    console.log(`✅ SMS OTP sent to ${phone}`);
    return res.json({ message: "OTP sent to your phone" });
  } catch (error) {
    console.error("❌ SMS OTP error:", error.message);
    return res.status(500).json({ error: "Failed to send SMS OTP", detail: error.message });
  }
});

app.post("/verify-sms-otp", verifyToken, async (req, res) => {
  const { phone, otp } = req.body;
  const record = smsOtpStore.get(phone);
  if (!record || record.otp !== otp || Date.now() > record.expires)
    return res.status(400).json({ error: "Invalid or expired OTP" });
  smsOtpStore.delete(phone);
  return res.json({ message: "OTP verified" });
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN HISTORY
// ── TASK: Mobile login restricted to 10:00 AM – 1:00 PM IST ──────────────────
// ═══════════════════════════════════════════════════════════════════════════════

app.post("/login-event", verifyToken, async (req, res) => {
  try {
    const ua         = new UAParser(req.headers["user-agent"]);
    const browser    = ua.getBrowser().name  || "Unknown";
    const os         = ua.getOS().name       || "Unknown";
    const deviceType = ua.getDevice().type   || "desktop";
    const ip         = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    const browserLower = (browser || "").toLowerCase();
    const isMicrosoft  = browserLower.includes("edge")    ||
                         browserLower.includes("msie")    ||
                         browserLower.includes("trident") ||
                         browserLower.includes("ie");

    // ── Mobile login time restriction: 10:00 AM – 1:00 PM IST ───────────────
    if (deviceType === "mobile") {
      const now  = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const hour = now.getHours();
      if (hour < 10 || hour >= 13)
        return res.status(403).json({ error: "Mobile login only allowed between 10:00 AM and 1:00 PM IST." });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: "User not found" });

    await LoginLog.create({ userId: user._id, browser, os, device: deviceType, ip });

    const isChromium  = (browserLower.includes("chrome") || browserLower.includes("chromium")) && !isMicrosoft;
    const requiresOtp = isChromium;

    console.log(`🔐 login-event: browser=${browser} device=${deviceType} requiresOtp=${requiresOtp} isMicrosoft=${isMicrosoft}`);
    return res.json({ requiresOtp, browser, os, device: deviceType, isMicrosoft });
  } catch (error) { return res.status(400).json({ error: error.message }); }
});

app.get("/login-history", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    const logs = await LoginLog.find({ userId: user._id }).sort({ timestamp: -1 }).limit(20);
    return res.json(logs);
  } catch (error) { return res.status(400).json({ error: error.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// FOLLOW / UNFOLLOW ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

app.post("/follow/:userId", verifyToken, async (req, res) => {
  try {
    const me     = await User.findOne({ email: req.user.email });
    const target = await User.findById(req.params.userId);
    if (!me || !target) return res.status(404).json({ error: "User not found" });
    if (me._id.toString() === target._id.toString())
      return res.status(400).json({ error: "Cannot follow yourself" });

    const alreadyFollowing = me.following?.some(id => id.toString() === target._id.toString());
    if (alreadyFollowing) return res.status(400).json({ error: "Already following" });

    await User.findByIdAndUpdate(me._id,     { $addToSet: { following: target._id } });
    await User.findByIdAndUpdate(target._id, { $addToSet: { followers: me._id     } });

    return res.json({ message: "Followed", following: true });
  } catch (error) { return res.status(400).json({ error: error.message }); }
});

app.delete("/follow/:userId", verifyToken, async (req, res) => {
  try {
    const me     = await User.findOne({ email: req.user.email });
    const target = await User.findById(req.params.userId);
    if (!me || !target) return res.status(404).json({ error: "User not found" });

    await User.findByIdAndUpdate(me._id,     { $pull: { following: target._id } });
    await User.findByIdAndUpdate(target._id, { $pull: { followers: me._id     } });

    return res.json({ message: "Unfollowed", following: false });
  } catch (error) { return res.status(400).json({ error: error.message }); }
});

app.get("/user/:userId", verifyToken, async (req, res) => {
  try {
    const me   = await User.findOne({ email: req.user.email });
    const user = await User.findById(req.params.userId)
      .select("displayName username avatar banner bio location website joinedDate followers following");
    if (!user) return res.status(404).json({ error: "User not found" });

    const isFollowing = me.following?.some(id => id.toString() === user._id.toString());
    return res.json({ ...user.toObject(), isFollowing });
  } catch (error) { return res.status(400).json({ error: error.message }); }
});

app.get("/user/:userId/tweets", verifyToken, async (req, res) => {
  try {
    const tweets = await Tweet.find({ author: req.params.userId })
      .sort({ _id: -1 })
      .limit(20)
      .populate("author");
    return res.json(tweets);
  } catch (error) { return res.status(400).json({ error: error.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGING ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Search users to start a conversation
app.get("/users/search", verifyToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 1) return res.json([]);
    const me    = await User.findOne({ email: req.user.email });
    const regex = new RegExp(q, "i");
    const users = await User.find({
      _id: { $ne: me._id },
      $or: [{ displayName: regex }, { username: regex }],
    }).select("displayName username avatar").limit(8);
    return res.json(users);
  } catch (error) { return res.status(400).json({ error: error.message }); }
});

// Online status for a specific user
app.get("/users/:userId/online", verifyToken, (req, res) => {
  return res.json({ online: isUserOnline(req.params.userId) });
});

// Get or create a conversation between two users
app.post("/conversations", verifyToken, async (req, res) => {
  try {
    const me            = await User.findOne({ email: req.user.email });
    const { participantId } = req.body;
    if (!participantId) return res.status(400).json({ error: "participantId required" });
    if (me._id.toString() === participantId)
      return res.status(400).json({ error: "Cannot message yourself" });

    const other = await User.findById(participantId).select("displayName username avatar");
    if (!other) return res.status(404).json({ error: "User not found" });

    let conv = await Conversation.findOne({
      participants: { $all: [me._id, other._id], $size: 2 },
    }).populate("participants", "displayName username avatar");

    if (!conv) {
      conv = await Conversation.create({ participants: [me._id, other._id] });
      conv = await conv.populate("participants", "displayName username avatar");
    }

    return res.json(conv);
  } catch (error) { return res.status(400).json({ error: error.message }); }
});

// List all conversations for logged-in user
app.get("/conversations", verifyToken, async (req, res) => {
  try {
    const me    = await User.findOne({ email: req.user.email });
    const convs = await Conversation.find({ participants: me._id })
      .sort({ updatedAt: -1 })
      .populate("participants", "displayName username avatar");

    const enriched = convs.map(c => {
      const other = c.participants.find(p => p._id.toString() !== me._id.toString());
      return {
        ...c.toObject(),
        otherUser:   other,
        online:      other ? isUserOnline(other._id.toString()) : false,
        unreadCount: c.unreadCounts?.get(me._id.toString()) || 0,
      };
    });

    return res.json(enriched);
  } catch (error) { return res.status(400).json({ error: error.message }); }
});

// Get messages for a conversation
app.get("/conversations/:convId/messages", verifyToken, async (req, res) => {
  try {
    const me   = await User.findOne({ email: req.user.email });
    const conv = await Conversation.findById(req.params.convId);
    if (!conv) return res.status(404).json({ error: "Conversation not found" });
    if (!conv.participants.some(p => p.toString() === me._id.toString()))
      return res.status(403).json({ error: "Forbidden" });

    const { before, limit = 40 } = req.query;
    const query = { conversationId: conv._id, deleted: false };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate("senderId", "displayName username avatar");

    await Message.updateMany(
      { conversationId: conv._id, senderId: { $ne: me._id }, read: false },
      { read: true, readAt: new Date() }
    );

    conv.unreadCounts?.set(me._id.toString(), 0);
    await conv.save();

    return res.json(messages.reverse());
  } catch (error) { return res.status(400).json({ error: error.message }); }
});

// Send a message
app.post("/conversations/:convId/messages", verifyToken, async (req, res) => {
  try {
    const me   = await User.findOne({ email: req.user.email });
    const conv = await Conversation.findById(req.params.convId);
    if (!conv) return res.status(404).json({ error: "Conversation not found" });
    if (!conv.participants.some(p => p.toString() === me._id.toString()))
      return res.status(403).json({ error: "Forbidden" });

    const { type = "text", content = "", mediaUrl = null } = req.body;
    if (type === "text" && !content.trim()) return res.status(400).json({ error: "Empty message" });

    const msg       = await Message.create({ conversationId: conv._id, senderId: me._id, type, content: content.trim(), mediaUrl });
    const populated = await msg.populate("senderId", "displayName username avatar");

    conv.lastMessage = {
      content:   type === "text" ? content.trim() : `[${type}]`,
      type,
      senderId:  me._id,
      createdAt: new Date(),
    };

    const otherId = conv.participants.find(p => p.toString() !== me._id.toString());
    if (otherId) {
      const prev = conv.unreadCounts?.get(otherId.toString()) || 0;
      conv.unreadCounts?.set(otherId.toString(), prev + 1);
    }
    await conv.save();

    // Real-time delivery
    io.to(`conv:${conv._id}`).emit("message:new", populated);
    conv.participants.forEach(pid => {
      io.to(`user:${pid}`).emit("conversation:updated", {
        conversationId: conv._id.toString(),
        lastMessage:    conv.lastMessage,
        unreadCount:    conv.unreadCounts?.get(pid.toString()) || 0,
      });
    });

    return res.status(201).json(populated);
  } catch (error) { return res.status(400).json({ error: error.message }); }
});

// Delete a message (soft delete)
app.delete("/conversations/:convId/messages/:msgId", verifyToken, async (req, res) => {
  try {
    const me  = await User.findOne({ email: req.user.email });
    const msg = await Message.findById(req.params.msgId);
    if (!msg) return res.status(404).json({ error: "Message not found" });
    if (msg.senderId.toString() !== me._id.toString())
      return res.status(403).json({ error: "Forbidden" });

    msg.deleted = true; msg.content = ""; msg.mediaUrl = null;
    await msg.save();

    io.to(`conv:${req.params.convId}`).emit("message:deleted", { messageId: msg._id });
    return res.json({ message: "Deleted" });
  } catch (error) { return res.status(400).json({ error: error.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION / PAYMENT ROUTES
// ── TASK: Payments restricted to 10:00 AM – 11:00 AM IST ─────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

app.get("/subscription", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    const sub  = await Subscription.findOne({ userId: user._id });
    return res.json(sub || { plan: "free", tweetLimit: 1, tweetsUsed: 0 });
  } catch (error) { return res.status(400).json({ error: error.message }); }
});

app.post("/create-order", verifyToken, async (req, res) => {
  // ── Payment time restriction: 10:00 AM – 11:00 AM IST ────────────────────
  const now  = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hour = now.getHours();
  if (hour < 10 || hour >= 11)
    return res.status(403).json({ error: "Payments only accepted between 10:00 AM and 11:00 AM IST" });

  try {
    const plan = PLANS[req.body.plan];
    if (!plan) return res.status(400).json({ error: "Invalid plan" });
    const order = await razorpay.orders.create({
      amount:   plan.price,
      currency: "INR",
      receipt:  `receipt_${Date.now()}`,
    });
    return res.json({ orderId: order.id, amount: plan.price });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.post("/demo-payment", verifyToken, async (req, res) => {
  if (process.env.DEMO_MODE !== "true")
    return res.status(403).json({ error: "Demo mode not enabled" });
  try {
    const { plan } = req.body;
    const planData = PLANS[plan];
    if (!planData) return res.status(400).json({ error: "Invalid plan" });

    const user      = await User.findOne({ email: req.user.email });
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const fakePid   = `demo_pay_${Date.now()}`;

    await Subscription.findOneAndUpdate(
      { userId: user._id },
      { plan, tweetLimit: planData.limit, tweetsUsed: 0, expiresAt },
      { upsert: true, new: true }
    );

    await sendEmail({
      to:      user.email,
      subject: "Twiller — Subscription Invoice (Demo)",
      html: `
        <div style="font-family:sans-serif;max-width:500px;padding:24px">
          <h1 style="color:#1d9bf0">Twiller</h1>
          <h2>Thank you for subscribing! 🎉</h2>
          <p style="color:#888">(Demo mode — no real money charged)</p>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:8px;border:1px solid #eee">Plan</td><td style="padding:8px;border:1px solid #eee"><strong>${plan.toUpperCase()}</strong></td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Tweet limit</td><td style="padding:8px;border:1px solid #eee">${planData.limit === -1 ? "Unlimited" : planData.limit} per month</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Payment ID</td><td style="padding:8px;border:1px solid #eee">${fakePid}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Expires</td><td style="padding:8px;border:1px solid #eee">${expiresAt.toDateString()}</td></tr>
          </table>
        </div>`,
    });

    return res.json({ message: "Demo payment successful", plan, paymentId: fakePid });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.post("/verify-payment", verifyToken, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
    const crypto   = await import("crypto");
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature)
      return res.status(400).json({ error: "Invalid payment signature" });

    const user     = await User.findOne({ email: req.user.email });
    const planData = PLANS[plan];
    if (!planData) return res.status(400).json({ error: "Invalid plan" });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await Subscription.findOneAndUpdate(
      { userId: user._id },
      { plan, tweetLimit: planData.limit, tweetsUsed: 0, expiresAt },
      { upsert: true, new: true }
    );

    await sendEmail({
      to:      user.email,
      subject: "Twiller — Subscription Invoice",
      html: `
        <div style="font-family:sans-serif;max-width:500px;padding:24px">
          <h1 style="color:#1d9bf0">Twiller</h1>
          <h2>Thank you for subscribing! 🎉</h2>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:8px;border:1px solid #eee">Plan</td><td style="padding:8px;border:1px solid #eee"><strong>${plan.toUpperCase()}</strong></td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Tweet limit</td><td style="padding:8px;border:1px solid #eee">${planData.limit === -1 ? "Unlimited" : planData.limit} per month</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Payment ID</td><td style="padding:8px;border:1px solid #eee">${razorpay_payment_id}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Expires</td><td style="padding:8px;border:1px solid #eee">${expiresAt.toDateString()}</td></tr>
          </table>
        </div>`,
    });

    return res.json({ message: "Payment verified and subscription activated", plan });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUGGESTED USERS
// ═══════════════════════════════════════════════════════════════════════════════

app.get("/suggested-users", verifyToken, async (req, res) => {
  try {
    const me    = await User.findOne({ email: req.user.email });
    const users = await User.find({ email: { $ne: req.user.email } })
      .select("displayName email avatar username followers following")
      .limit(5)
      .lean();

    const withStatus = users.map(u => ({
      ...u,
      isFollowing:    me.following?.some(id => id.toString() === u._id.toString()) || false,
      followersCount: u.followers?.length || 0,
    }));

    return res.json(withStatus);
  } catch (error) { return res.status(400).json({ error: error.message }); }
});