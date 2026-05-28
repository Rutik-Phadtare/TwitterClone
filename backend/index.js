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

console.log("BREVO_API_KEY configured:", !!process.env.BREVO_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": process.env.BREVO_API_KEY },
    body: JSON.stringify({ sender: { name: "Twiller", email: process.env.BREVO_SENDER_EMAIL }, to: [{ email: to }], subject, htmlContent: html }),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(JSON.stringify(err)); }
  console.log("Email sent to:", to);
  return res.json();
};

cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
const upload = multer();
const audioUpload = multer({ limits: { fileSize: 100 * 1024 * 1024 } });
const msgUpload = multer({ limits: { fileSize: 20 * 1024 * 1024 } });

const PLANS = { bronze: { price: 10000, limit: 3 }, silver: { price: 30000, limit: 5 }, gold: { price: 100000, limit: -1 } };
const otpStore = new Map();
const smsOtpStore = new Map();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "https://twitter-clone-lime-alpha.vercel.app",
].filter(Boolean);

// Socket.io
const io = new SocketServer(httpServer, {
  cors: {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) return cb(null, true);
      cb(new Error("CORS blocked"));
    },
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("user:online", (userId) => {
    if (!userId) return;
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);
    socket.userId = userId;
    socket.join(`user:${userId}`);
    io.emit("presence:update", { userId, online: true });
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
      }
    }
  });
});

const isUserOnline = (userId) => onlineUsers.has(userId?.toString());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) return callback(null, true);
    callback(new Error("CORS blocked"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.get("/", (req, res) => res.send("Twiller backend is running"));

mongoose.connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("Connected to MongoDB");
    httpServer.listen(process.env.PORT || 5000, () => console.log("Server running on port", process.env.PORT || 5000));
  })
  .catch((err) => { console.error("MongoDB error:", err.message); process.exit(1); });

// AUTH
app.post("/register", verifyToken, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate({ email: req.user.email }, { $setOnInsert: { email: req.user.email, name: req.body.name || req.user.name || "", profilePic: req.body.profilePic || req.user.picture || "", ...req.body } }, { upsert: true, new: true });
    return res.status(200).send(user);
  } catch (e) { return res.status(400).send({ error: e.message }); }
});

app.get("/loggedinuser", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).send({ error: "User not found" });
    return res.status(200).send(user);
  } catch (e) { return res.status(400).send({ error: e.message }); }
});

app.patch("/userupdate/:email", verifyToken, async (req, res) => {
  if (req.user.email !== req.params.email) return res.status(403).send({ error: "Forbidden" });
  try {
    const updated = await User.findOneAndUpdate({ email: req.params.email }, { $set: req.body }, { new: true });
    if (!updated) return res.status(404).send({ error: "User not found" });
    return res.status(200).send(updated);
  } catch (e) { return res.status(400).send({ error: e.message }); }
});

// TWEETS
app.post("/post", verifyToken, async (req, res) => {
  try {
    const content = (req.body.content || "").trim();
    if (!content) return res.status(400).send({ error: "Content cannot be empty" });
    if (content.length > 280) return res.status(400).send({ error: "Tweet exceeds 280 characters" });
    const dbUser = await User.findOne({ email: req.user.email });
    if (!dbUser) return res.status(404).send({ error: "User not found" });
    const sub = await Subscription.findOne({ userId: dbUser._id });
    const tweetLimit = sub?.tweetLimit ?? 1;
    const tweetsUsed = sub?.tweetsUsed ?? 0;
    if (tweetLimit !== -1 && tweetsUsed >= tweetLimit) return res.status(403).send({ error: `Tweet limit reached. You've used ${tweetsUsed}/${tweetLimit} tweets this month.` });
    const tweet = new Tweet({ content, image: req.body.image || null, audio: req.body.audio || null, audioDuration: req.body.audioDuration || null, author: dbUser._id });
    await tweet.save();
    if (sub) { sub.tweetsUsed += 1; await sub.save(); } else await Subscription.create({ userId: dbUser._id, plan: "free", tweetLimit: 1, tweetsUsed: 1 });
    return res.status(201).send(await tweet.populate("author"));
  } catch (e) { return res.status(400).send({ error: e.message }); }
});

app.get("/post", async (req, res) => {
  try {
    const { cursor, limit = 20 } = req.query;
    const tweets = await Tweet.find(cursor ? { _id: { $lt: cursor } } : {}).sort({ _id: -1 }).limit(Number(limit)).populate("author");
    return res.status(200).send({ tweets, nextCursor: tweets.length === Number(limit) ? tweets[tweets.length - 1]._id : null });
  } catch (e) { return res.status(400).send({ error: e.message }); }
});

app.patch("/post/:id", verifyToken, async (req, res) => {
  try {
    const content = (req.body.content || "").trim();
    if (!content || content.length > 280) return res.status(400).send({ error: "Invalid content" });
    const dbUser = await User.findOne({ email: req.user.email });
    const tweet = await Tweet.findById(req.params.id);
    if (!tweet) return res.status(404).send({ error: "Tweet not found" });
    if (tweet.author.toString() !== dbUser._id.toString()) return res.status(403).send({ error: "Forbidden" });
    tweet.content = content; tweet.edited = true; await tweet.save();
    return res.status(200).send(await tweet.populate("author"));
  } catch (e) { return res.status(400).send({ error: e.message }); }
});

app.delete("/post/:id", verifyToken, async (req, res) => {
  try {
    const dbUser = await User.findOne({ email: req.user.email });
    const tweet = await Tweet.findById(req.params.id);
    if (!tweet) return res.status(404).send({ error: "Tweet not found" });
    if (tweet.author.toString() !== dbUser._id.toString()) return res.status(403).send({ error: "Forbidden" });
    await Tweet.findByIdAndDelete(req.params.id);
    return res.status(200).send({ message: "Deleted" });
  } catch (e) { return res.status(400).send({ error: e.message }); }
});

app.post("/like/:tweetid", verifyToken, async (req, res) => {
  try {
    const dbUser = await User.findOne({ email: req.user.email });
    const tweet = await Tweet.findById(req.params.tweetid);
    if (!tweet) return res.status(404).send({ error: "Tweet not found" });
    const uid = dbUser._id.toString();
    const liked = tweet.likedBy.some(id => id.toString() === uid);
    if (liked) { tweet.likes = Math.max(0, tweet.likes - 1); tweet.likedBy = tweet.likedBy.filter(id => id.toString() !== uid); }
    else { tweet.likes += 1; tweet.likedBy.push(dbUser._id); }
    await tweet.save();
    return res.send(await tweet.populate("author"));
  } catch (e) { return res.status(400).send({ error: e.message }); }
});

app.post("/retweet/:tweetid", verifyToken, async (req, res) => {
  try {
    const dbUser = await User.findOne({ email: req.user.email });
    const tweet = await Tweet.findById(req.params.tweetid);
    if (!tweet) return res.status(404).send({ error: "Tweet not found" });
    const uid = dbUser._id.toString();
    const rt = tweet.retweetedBy.some(id => id.toString() === uid);
    if (rt) { tweet.retweets = Math.max(0, tweet.retweets - 1); tweet.retweetedBy = tweet.retweetedBy.filter(id => id.toString() !== uid); }
    else { tweet.retweets += 1; tweet.retweetedBy.push(dbUser._id); }
    await tweet.save();
    return res.send(await tweet.populate("author"));
  } catch (e) { return res.status(400).send({ error: e.message }); }
});

// UPLOADS
app.post("/upload-image", verifyToken, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const result = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${Buffer.from(req.file.buffer).toString("base64")}`, { folder: "twiller" });
    return res.json({ url: result.secure_url });
  } catch (e) { return res.status(500).json({ error: "Upload failed" }); }
});

// Task 4: Audio uploads restricted to 2:00 PM – 7:00 PM IST
app.post("/upload-audio", verifyToken, audioUpload.single("audio"), async (req, res) => {
  const now  = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hour = now.getHours();
  if (hour < 14 || hour >= 19) return res.status(403).json({ error: "Audio uploads only allowed between 2:00 PM and 7:00 PM IST" });

  if (!req.file) return res.status(400).json({ error: "No audio file" });
  try {
    const result = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${Buffer.from(req.file.buffer).toString("base64")}`, { resource_type: "video", folder: "twiller-audio" });
    if (result.duration > 300) { await cloudinary.uploader.destroy(result.public_id, { resource_type: "video" }); return res.status(400).json({ error: "Audio must be under 5 minutes" }); }
    return res.json({ url: result.secure_url, duration: result.duration });
  } catch (e) { return res.status(500).json({ error: "Audio upload failed" }); }
});

app.post("/upload-message-image", verifyToken, msgUpload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const result = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${Buffer.from(req.file.buffer).toString("base64")}`, { folder: "twiller-messages" });
    return res.json({ url: result.secure_url });
  } catch (e) { return res.status(500).json({ error: "Upload failed" }); }
});

// OTP
app.post("/send-otp", verifyToken, async (req, res) => {
  try {
    const existing = otpStore.get(req.user.email);
    if (existing && (Date.now() - existing.createdAt) < 60_000) return res.json({ message: "OTP already sent" });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(req.user.email, { otp, expires: Date.now() + 600_000, createdAt: Date.now() });
    await sendEmail({ to: req.user.email, subject: "Your Twiller verification code", html: `<div style="font-family:sans-serif;padding:24px;background:#f9f9f9;border-radius:12px"><h2 style="color:#1d9bf0">Twiller Verification</h2><p>Your code:</p><div style="font-size:40px;font-weight:bold;letter-spacing:12px;padding:20px 0">${otp}</div><p style="color:#888;font-size:13px">Expires in 10 minutes.</p></div>` });
    return res.json({ message: "OTP sent" });
  } catch (e) { return res.status(500).json({ error: "Failed to send OTP", detail: e.message }); }
});

app.post("/verify-otp", verifyToken, async (req, res) => {
  const record = otpStore.get(req.user.email);
  if (!record || record.otp !== req.body.otp || Date.now() > record.expires) return res.status(400).json({ error: "Invalid or expired OTP" });
  otpStore.delete(req.user.email);
  return res.json({ message: "OTP verified" });
});

app.post("/send-sms-otp", verifyToken, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone required" });
    const existing = smsOtpStore.get(phone);
    if (existing && (Date.now() - existing.createdAt) < 60_000) return res.json({ message: "OTP already sent" });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    smsOtpStore.set(phone, { otp, expires: Date.now() + 600_000, createdAt: Date.now() });
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const r = await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&message=Your+Twiller+OTP+is+${otp}.+Valid+5+minutes.&language=english&route=q&numbers=${cleanPhone}`, { headers: { "cache-control": "no-cache" } });
    const d = await r.json();
    if (!d.return) throw new Error(d.message || "SMS failed");
    return res.json({ message: "OTP sent" });
  } catch (e) { return res.status(500).json({ error: "Failed to send SMS OTP", detail: e.message }); }
});

app.post("/verify-sms-otp", verifyToken, async (req, res) => {
  const { phone, otp } = req.body;
  const record = smsOtpStore.get(phone);
  if (!record || record.otp !== otp || Date.now() > record.expires) return res.status(400).json({ error: "Invalid or expired OTP" });
  smsOtpStore.delete(phone);
  return res.json({ message: "OTP verified" });
});

// LOGIN HISTORY
// Task 3: Mobile login restricted to 10:00 AM – 1:00 PM IST
app.post("/login-event", verifyToken, async (req, res) => {
  try {
    const ua = new UAParser(req.headers["user-agent"]);
    const browser = ua.getBrowser().name || "Unknown";
    const os = ua.getOS().name || "Unknown";
    const deviceType = ua.getDevice().type || "desktop";
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
    const bl = browser.toLowerCase();
    const isMicrosoft = bl.includes("edge") || bl.includes("msie") || bl.includes("trident");

    if (deviceType === "mobile") {
      const now  = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const hour = now.getHours();
      if (hour < 10 || hour >= 13)
        return res.status(403).json({ error: "Mobile login only allowed between 10:00 AM and 1:00 PM IST." });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: "User not found" });
    await LoginLog.create({ userId: user._id, browser, os, device: deviceType, ip });
    const isChromium = (bl.includes("chrome") || bl.includes("chromium")) && !isMicrosoft;
    return res.json({ requiresOtp: isChromium, browser, os, device: deviceType, isMicrosoft });
  } catch (e) { return res.status(400).json({ error: e.message }); }
});

app.get("/login-history", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    const logs = await LoginLog.find({ userId: user._id }).sort({ timestamp: -1 }).limit(20);
    return res.json(logs);
  } catch (e) { return res.status(400).json({ error: e.message }); }
});

// FOLLOW / UNFOLLOW
app.post("/follow/:userId", verifyToken, async (req, res) => {
  try {
    const me = await User.findOne({ email: req.user.email });
    const target = await User.findById(req.params.userId);
    if (!me || !target) return res.status(404).json({ error: "User not found" });
    if (me._id.toString() === target._id.toString()) return res.status(400).json({ error: "Cannot follow yourself" });
    if (me.following?.some(id => id.toString() === target._id.toString())) return res.status(400).json({ error: "Already following" });
    await User.findByIdAndUpdate(me._id,     { $addToSet: { following: target._id } });
    await User.findByIdAndUpdate(target._id, { $addToSet: { followers: me._id } });
    return res.json({ message: "Followed", following: true });
  } catch (e) { return res.status(400).json({ error: e.message }); }
});

app.delete("/follow/:userId", verifyToken, async (req, res) => {
  try {
    const me = await User.findOne({ email: req.user.email });
    const target = await User.findById(req.params.userId);
    if (!me || !target) return res.status(404).json({ error: "User not found" });
    await User.findByIdAndUpdate(me._id,     { $pull: { following: target._id } });
    await User.findByIdAndUpdate(target._id, { $pull: { followers: me._id } });
    return res.json({ message: "Unfollowed", following: false });
  } catch (e) { return res.status(400).json({ error: e.message }); }
});

app.get("/user/:userId", verifyToken, async (req, res) => {
  try {
    const me = await User.findOne({ email: req.user.email });
    const user = await User.findById(req.params.userId).select("displayName username avatar banner bio location website joinedDate followers following");
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ ...user.toObject(), isFollowing: me.following?.some(id => id.toString() === user._id.toString()) });
  } catch (e) { return res.status(400).json({ error: e.message }); }
});

app.get("/user/:userId/tweets", verifyToken, async (req, res) => {
  try {
    const tweets = await Tweet.find({ author: req.params.userId }).sort({ _id: -1 }).limit(20).populate("author");
    return res.json(tweets);
  } catch (e) { return res.status(400).json({ error: e.message }); }
});

// MESSAGING
app.get("/users/search", verifyToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const me = await User.findOne({ email: req.user.email });
    const regex = new RegExp(q, "i");
    const users = await User.find({ _id: { $ne: me._id }, $or: [{ displayName: regex }, { username: regex }] }).select("displayName username avatar").limit(8);
    return res.json(users);
  } catch (e) { return res.status(400).json({ error: e.message }); }
});

app.get("/users/:userId/online", verifyToken, (req, res) => {
  return res.json({ online: isUserOnline(req.params.userId) });
});

app.post("/conversations", verifyToken, async (req, res) => {
  try {
    const me = await User.findOne({ email: req.user.email });
    const { participantId } = req.body;
    if (!participantId) return res.status(400).json({ error: "participantId required" });
    if (me._id.toString() === participantId) return res.status(400).json({ error: "Cannot message yourself" });
    const other = await User.findById(participantId).select("displayName username avatar");
    if (!other) return res.status(404).json({ error: "User not found" });
    let conv = await Conversation.findOne({ participants: { $all: [me._id, other._id], $size: 2 } }).populate("participants", "displayName username avatar");
    if (!conv) {
      conv = await Conversation.create({ participants: [me._id, other._id] });
      conv = await conv.populate("participants", "displayName username avatar");
    }
    return res.json(conv);
  } catch (e) { return res.status(400).json({ error: e.message }); }
});

app.get("/conversations", verifyToken, async (req, res) => {
  try {
    const me = await User.findOne({ email: req.user.email });
    const convs = await Conversation.find({ participants: me._id }).sort({ updatedAt: -1 }).populate("participants", "displayName username avatar");
    const enriched = convs.map(c => {
      const other = c.participants.find(p => p._id.toString() !== me._id.toString());
      return { ...c.toObject(), otherUser: other, online: other ? isUserOnline(other._id.toString()) : false, unreadCount: c.unreadCounts?.get(me._id.toString()) || 0 };
    });
    return res.json(enriched);
  } catch (e) { return res.status(400).json({ error: e.message }); }
});

app.get("/conversations/:convId/messages", verifyToken, async (req, res) => {
  try {
    const me = await User.findOne({ email: req.user.email });
    const conv = await Conversation.findById(req.params.convId);
    if (!conv) return res.status(404).json({ error: "Conversation not found" });
    if (!conv.participants.some(p => p.toString() === me._id.toString())) return res.status(403).json({ error: "Forbidden" });
    const { before, limit = 40 } = req.query;
    const query = { conversationId: conv._id, deleted: false };
    if (before) query.createdAt = { $lt: new Date(before) };
    const messages = await Message.find(query).sort({ createdAt: -1 }).limit(Number(limit)).populate("senderId", "displayName username avatar");
    await Message.updateMany({ conversationId: conv._id, senderId: { $ne: me._id }, read: false }, { read: true, readAt: new Date() });
    conv.unreadCounts?.set(me._id.toString(), 0);
    await conv.save();
    return res.json(messages.reverse());
  } catch (e) { return res.status(400).json({ error: e.message }); }
});

app.post("/conversations/:convId/messages", verifyToken, async (req, res) => {
  try {
    const me = await User.findOne({ email: req.user.email });
    const conv = await Conversation.findById(req.params.convId);
    if (!conv) return res.status(404).json({ error: "Conversation not found" });
    if (!conv.participants.some(p => p.toString() === me._id.toString())) return res.status(403).json({ error: "Forbidden" });
    const { type = "text", content = "", mediaUrl = null } = req.body;
    if (type === "text" && !content.trim()) return res.status(400).json({ error: "Empty message" });
    const msg = await Message.create({ conversationId: conv._id, senderId: me._id, type, content: content.trim(), mediaUrl });
    const populated = await msg.populate("senderId", "displayName username avatar");
    conv.lastMessage = { content: type === "text" ? content.trim() : `[${type}]`, type, senderId: me._id, createdAt: new Date() };
    const otherId = conv.participants.find(p => p.toString() !== me._id.toString());
    if (otherId) {
      const prev = conv.unreadCounts?.get(otherId.toString()) || 0;
      conv.unreadCounts?.set(otherId.toString(), prev + 1);
    }
    await conv.save();
    io.to(`conv:${conv._id}`).emit("message:new", populated);
    conv.participants.forEach(pid => {
      io.to(`user:${pid}`).emit("conversation:updated", {
        conversationId: conv._id.toString(),
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCounts?.get(pid.toString()) || 0,
      });
    });
    return res.status(201).json(populated);
  } catch (e) { return res.status(400).json({ error: e.message }); }
});

app.delete("/conversations/:convId/messages/:msgId", verifyToken, async (req, res) => {
  try {
    const me = await User.findOne({ email: req.user.email });
    const msg = await Message.findById(req.params.msgId);
    if (!msg) return res.status(404).json({ error: "Not found" });
    if (msg.senderId.toString() !== me._id.toString()) return res.status(403).json({ error: "Forbidden" });
    msg.deleted = true; msg.content = ""; msg.mediaUrl = null; await msg.save();
    io.to(`conv:${req.params.convId}`).emit("message:deleted", { messageId: msg._id });
    return res.json({ message: "Deleted" });
  } catch (e) { return res.status(400).json({ error: e.message }); }
});

// SUBSCRIPTION / PAYMENTS
app.get("/subscription", verifyToken, async (req, res) => {
  try { const user = await User.findOne({ email: req.user.email }); const sub = await Subscription.findOne({ userId: user._id }); return res.json(sub || { plan: "free", tweetLimit: 1, tweetsUsed: 0 }); }
  catch (e) { return res.status(400).json({ error: e.message }); }
});

// Task 1: Payments restricted to 10:00 AM – 11:00 AM IST
app.post("/create-order", verifyToken, async (req, res) => {
  const now  = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hour = now.getHours();
  if (hour < 10 || hour >= 11) return res.status(403).json({ error: "Payments only accepted between 10:00 AM and 11:00 AM IST" });

  try { const plan = PLANS[req.body.plan]; if (!plan) return res.status(400).json({ error: "Invalid plan" }); const order = await razorpay.orders.create({ amount: plan.price, currency: "INR", receipt: `receipt_${Date.now()}` }); return res.json({ orderId: order.id, amount: plan.price }); }
  catch (e) { return res.status(500).json({ error: e.message }); }
});

app.post("/demo-payment", verifyToken, async (req, res) => {
  if (process.env.DEMO_MODE !== "true") return res.status(403).json({ error: "Demo mode not enabled" });
  try {
    const { plan } = req.body; const planData = PLANS[plan]; if (!planData) return res.status(400).json({ error: "Invalid plan" });
    const user = await User.findOne({ email: req.user.email }); const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); const fakePid = `demo_pay_${Date.now()}`;
    await Subscription.findOneAndUpdate({ userId: user._id }, { plan, tweetLimit: planData.limit, tweetsUsed: 0, expiresAt }, { upsert: true, new: true });
    await sendEmail({ to: user.email, subject: "Twiller — Subscription Invoice (Demo)", html: `<div style="font-family:sans-serif;padding:24px"><h1 style="color:#1d9bf0">Twiller</h1><h2>Thank you for subscribing!</h2><p>Plan: ${plan.toUpperCase()} | Expires: ${expiresAt.toDateString()}</p></div>` });
    return res.json({ message: "Demo payment successful", plan, paymentId: fakePid });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.post("/verify-payment", verifyToken, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
    const crypto = await import("crypto");
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    if (expected !== razorpay_signature) return res.status(400).json({ error: "Invalid signature" });
    const user = await User.findOne({ email: req.user.email }); const planData = PLANS[plan]; if (!planData) return res.status(400).json({ error: "Invalid plan" });
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await Subscription.findOneAndUpdate({ userId: user._id }, { plan, tweetLimit: planData.limit, tweetsUsed: 0, expiresAt }, { upsert: true, new: true });
    await sendEmail({ to: user.email, subject: "Twiller — Subscription Invoice", html: `<div style="font-family:sans-serif;padding:24px"><h1 style="color:#1d9bf0">Twiller</h1><h2>Thank you for subscribing!</h2><p>Plan: ${plan.toUpperCase()} | Payment: ${razorpay_payment_id} | Expires: ${expiresAt.toDateString()}</p></div>` });
    return res.json({ message: "Payment verified", plan });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.get("/suggested-users", verifyToken, async (req, res) => {
  try {
    const me = await User.findOne({ email: req.user.email });
    const users = await User.find({ email: { $ne: req.user.email } }).select("displayName email avatar username followers following").limit(5).lean();
    return res.json(users.map(u => ({ ...u, isFollowing: me.following?.some(id => id.toString() === u._id.toString()) || false, followersCount: u.followers?.length || 0 })));
  } catch (e) { return res.status(400).json({ error: e.message }); }
});