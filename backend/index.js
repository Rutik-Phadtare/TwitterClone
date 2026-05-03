import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import multer from "multer";           // ← FIX 1: only one multer import
import { v2 as cloudinary } from "cloudinary";
import nodemailer from "nodemailer";
import Razorpay from "razorpay";
import { UAParser } from "ua-parser-js";

import User from "./modals/user.js";
import Tweet from "./modals/tweet.js";
import LoginLog from "./modals/loginLog.js";
import Subscription from "./modals/subscription.js";
import { verifyToken } from "./middleware/auth.js";

dotenv.config();

// ─── Cloudinary ───────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Razorpay ─────────────────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── Nodemailer ───────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// ─── Multer instances ─────────────────────────────────────────────────────────
const upload      = multer();                                            // images
const audioUpload = multer({ limits: { fileSize: 100 * 1024 * 1024 } }); // audio 100MB

// ─── Plans ────────────────────────────────────────────────────────────────────
const PLANS = {
  bronze: { price: 10000,  limit: 3  },
  silver: { price: 30000,  limit: 5  },
  gold:   { price: 100000, limit: -1 }, // -1 = unlimited
};

// ─── OTP store (in-memory) ────────────────────────────────────────────────────
const otpStore = new Map();

// ─── App ──────────────────────────────────────────────────────────────────────
const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.send("Twiller backend is running ✅"));

// ─── DB + Server ──────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(process.env.PORT || 5000, () =>
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

// Register / upsert Firebase user into MongoDB
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
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// Get logged-in user's profile (reads email from token)
app.get("/loggedinuser", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).send({ error: "User not found" });
    return res.status(200).send(user);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// Update profile (only own profile)
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
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// TWEET ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Create tweet — FIX 2+3: look up MongoDB user, enforce subscription limit
app.post("/post", verifyToken, async (req, res) => {
  try {
    const content = (req.body.content || "").trim();
    if (!content) return res.status(400).send({ error: "Tweet content cannot be empty" });
    if (content.length > 280) return res.status(400).send({ error: "Tweet exceeds 280 characters" });

    // Always look up MongoDB user from the verified token
    const dbUser = await User.findOne({ email: req.user.email });
    if (!dbUser) return res.status(404).send({ error: "User not found — please register first" });

    // ── Subscription limit check ──────────────────────────────────────────────
const sub        = await Subscription.findOne({ userId: dbUser._id });
const tweetLimit = sub?.tweetLimit ?? 1;
const tweetsUsed = sub?.tweetsUsed ?? 0;

// -1 means unlimited — only check limit when tweetLimit is a positive number
if (tweetLimit !== -1 && tweetsUsed >= tweetLimit) {
  return res.status(403).send({
    error: `Tweet limit reached. You've used ${tweetsUsed}/${tweetLimit} tweets this month. Upgrade your plan to post more.`,
  });
}

const tweet = new Tweet({
  content,
  image:  req.body.image || null,
  audio:  req.body.audio || null,
  author: dbUser._id,
});
await tweet.save();

// Increment usage counter
if (sub) {
  sub.tweetsUsed += 1;
  await sub.save();
} else {
  // First tweet — create free plan subscription record
  await Subscription.create({
    userId:     dbUser._id,
    plan:       "free",
    tweetLimit: 1,
    tweetsUsed: 1,
  });
}

    const populated = await tweet.populate("author");
    return res.status(201).send(populated);
  } catch (error) {
    console.error("🔴 POST /post error:", error.message, error.errors);
    return res.status(400).send({ error: error.message });
  }
});

// Get tweets — paginated
app.get("/post", async (req, res) => {
  try {
    const { cursor, limit = 20 } = req.query;
    const query = cursor ? { _id: { $lt: cursor } } : {};
    const tweets = await Tweet.find(query)
      .sort({ _id: -1 })
      .limit(Number(limit))
      .populate("author");
    return res.status(200).send({
      tweets,
      nextCursor: tweets.length === Number(limit) ? tweets[tweets.length - 1]._id : null,
    });
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// Delete tweet (owner only)
app.delete("/post/:id", verifyToken, async (req, res) => {
  try {
    const dbUser = await User.findOne({ email: req.user.email });
    const tweet  = await Tweet.findById(req.params.id);
    if (!tweet)   return res.status(404).send({ error: "Tweet not found" });
    if (tweet.author.toString() !== dbUser._id.toString())
      return res.status(403).send({ error: "Forbidden" });
    await Tweet.findByIdAndDelete(req.params.id);
    return res.status(200).send({ message: "Tweet deleted" });
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// Like / unlike toggle — FIX 2: use MongoDB _id not Firebase uid
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
    return res.send(tweet);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// Retweet / un-retweet toggle — FIX 2: use MongoDB _id not Firebase uid
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
    return res.send(tweet);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// UPLOAD ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Image upload
app.post("/upload-image", verifyToken, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });
    const b64     = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const result  = await cloudinary.uploader.upload(dataURI, {
      folder: "twiller", resource_type: "image",
    });
    return res.json({ url: result.secure_url });
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({ error: "Upload failed" });
  }
});

// Audio upload (2PM–7PM IST only)
app.post("/upload-audio", verifyToken, audioUpload.single("audio"), async (req, res) => {
  const now  = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hour = now.getHours();
  if (hour < 14 || hour >= 19)
    return res.status(403).json({ error: "Audio uploads only allowed 2PM–7PM IST" });
  if (!req.file) return res.status(400).json({ error: "No audio file" });

  try {
    const b64     = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const result  = await cloudinary.uploader.upload(dataURI, {
      resource_type: "video", folder: "twiller-audio",
    });
    if (result.duration > 300) {
      await cloudinary.uploader.destroy(result.public_id, { resource_type: "video" });
      return res.status(400).json({ error: "Audio must be under 5 minutes" });
    }
    return res.json({ url: result.secure_url, duration: result.duration });
  } catch (error) {
    return res.status(500).json({ error: "Audio upload failed" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// OTP ROUTES  — FIX 5: actually sends email via Nodemailer
// ═══════════════════════════════════════════════════════════════════════════════

app.post("/send-otp", verifyToken, async (req, res) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(req.user.email, { otp, expires: Date.now() + 10 * 60 * 1000 });

    // Send via email (Nodemailer)
    await transporter.sendMail({
      from:    process.env.EMAIL_USER,
      to:      req.user.email,
      subject: "Your Twiller verification code",
      html:    `
        <div style="font-family:sans-serif;max-width:400px">
          <h2 style="color:#1d9bf0">Your OTP</h2>
          <p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#000">${otp}</p>
          <p style="color:#666">This code expires in 10 minutes. Do not share it.</p>
        </div>`,
    });

    return res.json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("OTP send error:", error);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.post("/verify-otp", verifyToken, async (req, res) => {
  const record = otpStore.get(req.user.email);
  if (!record || record.otp !== req.body.otp || Date.now() > record.expires)
    return res.status(400).json({ error: "Invalid or expired OTP" });
  otpStore.delete(req.user.email);
  return res.json({ message: "OTP verified" });
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN HISTORY
// ═══════════════════════════════════════════════════════════════════════════════

        app.post("/login-event", verifyToken, async (req, res) => {
          try {
            const ua         = new UAParser(req.headers["user-agent"]);
            const browser    = ua.getBrowser().name  || "Unknown";
            const os         = ua.getOS().name       || "Unknown";
            const deviceType = ua.getDevice().type   || "desktop";
            const ip         = req.headers["x-forwarded-for"]?.split(",")[0]
                              || req.socket.remoteAddress;

            const browserLower = (browser || "").toLowerCase();

            // ── Microsoft browser — skip OTP entirely ─────────────────────────────
            const isMicrosoft = browserLower.includes("edge")    ||
                                browserLower.includes("msie")    ||
                                browserLower.includes("trident") ||
                                browserLower.includes("ie");

            // ── Mobile time restriction: 10AM–1PM IST only ────────────────────────
            if (deviceType === "mobile") {
              const now  = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
              const hour = now.getHours();
              if (hour < 10 || hour >= 13) {
                return res.status(403).json({
                  error: "Mobile login only allowed between 10:00 AM and 1:00 PM IST.",
                });
              }
            }

            const user = await User.findOne({ email: req.user.email });
            if (!user) return res.status(404).json({ error: "User not found" });

            await LoginLog.create({ userId: user._id, browser, os, device: deviceType, ip });

            // Chrome = OTP required. Microsoft = free pass. Everything else = no OTP.
            const requiresOtp = browserLower.includes("chrome") && !isMicrosoft;

            return res.json({ requiresOtp, browser, os, device: deviceType, isMicrosoft });
          } catch (error) {
            return res.status(400).json({ error: error.message });
          }
        });
app.get("/login-history", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    const logs = await LoginLog.find({ userId: user._id })
      .sort({ timestamp: -1 }).limit(20);
    return res.json(logs);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION / PAYMENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Get current subscription
app.get("/subscription", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    const sub  = await Subscription.findOne({ userId: user._id });
    return res.json(sub || { plan: "free", tweetLimit: 1, tweetsUsed: 0 });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Create Razorpay order (10AM–11AM IST only)
app.post("/create-order", verifyToken, async (req, res) => {
  try {
  // const now  = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  // const hour = now.getHours();
  // if (hour < 10 || hour >= 11)
  // return res.status(403).json({ error: "Payments only accepted 10AM–11AM IST" });

    const plan = PLANS[req.body.plan];
    if (!plan) return res.status(400).json({ error: "Invalid plan" });

    const order = await razorpay.orders.create({
      amount:   plan.price,
      currency: "INR",
      receipt:  `receipt_${Date.now()}`,
    });
    return res.json({ orderId: order.id, amount: plan.price });
  }
   catch (error) {            // FIX 4: was missing try/catch
    return res.status(500).json({ error: error.message });
  }
});

// Verify payment + activate subscription + send invoice
app.post("/verify-payment", verifyToken, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    const crypto   = await import("crypto");
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
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

    // Invoice email
    await transporter.sendMail({
      from:    process.env.EMAIL_USER,
      to:      user.email,
      subject: "Twiller — Subscription Invoice",
      html: `
        <div style="font-family:sans-serif;max-width:500px;padding:24px">
          <h1 style="color:#1d9bf0">Twiller</h1>
          <h2>Thank you for subscribing! 🎉</h2>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:8px;border:1px solid #eee">Plan</td><td style="padding:8px;border:1px solid #eee"><strong>${plan.toUpperCase()}</strong></td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Tweet limit</td><td style="padding:8px;border:1px solid #eee">${planData.limit === Infinity ? "Unlimited" : planData.limit} per month</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Payment ID</td><td style="padding:8px;border:1px solid #eee">${razorpay_payment_id}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Expires</td><td style="padding:8px;border:1px solid #eee">${expiresAt.toDateString()}</td></tr>
          </table>
        </div>`,
    });

    return res.json({ message: "Payment verified and subscription activated", plan });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/suggested-users", verifyToken, async (req, res) => {
  try {
    const users = await User.find({ email: { $ne: req.user.email } })
  .select("displayName email avatar username")  // ← correct field names
  .limit(5)
  .lean();
    return res.json(users);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});