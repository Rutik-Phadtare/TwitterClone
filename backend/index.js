import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import User from "./modals/user.js";
import Tweet from "./modals/tweet.js";
import { verifyToken } from "./middleware/auth.js";
import LoginLog from "./modals/loginLog.js";
import { UAParser } from "ua-parser-js";
import multer from "multer";
import Razorpay from "razorpay";
import nodemailer from "nodemailer";
import Subscription from "./modals/subscription.js";

const audioUpload = multer({ limits: { fileSize: 100 * 1024 * 1024 } });


dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const upload = multer();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));


// ─── Health check ────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("Twiller backend is running ✅");
});

// ─── DB + Server ──────────────────────────────────────────────────────────────
const port = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ─── Auth routes ─────────────────────────────────────────────────────────────

// Register / sync Firebase user into MongoDB (upsert on first login)
app.post("/register", verifyToken, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { email: req.user.email },
      {
        $setOnInsert: {
          email: req.user.email,
          name: req.body.name || req.user.name || "",
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

// Get logged-in user's profile
// backend/index.js — GET /loggedinuser
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
  if (req.user.email !== req.params.email) {
    return res.status(403).send({ error: "Forbidden" });
  }
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

// ─── Tweet routes ─────────────────────────────────────────────────────────────

// Create tweet
app.post("/post", verifyToken, async (req, res) => {
  try {
    if (!req.body.content || req.body.content.trim().length === 0) {
      return res.status(400).send({ error: "Tweet content cannot be empty" });
    }
    if (req.body.content.length > 280) {
      return res.status(400).send({ error: "Tweet exceeds 280 characters" });
    }
    const tweet = new Tweet(req.body);
    await tweet.save();
    return res.status(201).send(tweet);
} catch (error) {
  console.error("🔴 POST /post error:", error.message, error.errors); // ← add error.errors
  return res.status(400).send({ error: error.message });
}
});

// Get tweets (paginated — pass ?cursor=lastTweetId to load more)
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
      nextCursor:
        tweets.length === Number(limit)
          ? tweets[tweets.length - 1]._id
          : null,
    });
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// Delete tweet (only tweet owner)
app.delete("/post/:id", verifyToken, async (req, res) => {
  try {
    const tweet = await Tweet.findById(req.params.id);
    if (!tweet) return res.status(404).send({ error: "Tweet not found" });
    if (tweet.author.toString() !== req.user.uid) {
      return res.status(403).send({ error: "Forbidden" });
    }
    await Tweet.findByIdAndDelete(req.params.id);
    return res.status(200).send({ message: "Tweet deleted" });
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// Like / unlike toggle
app.post("/like/:tweetid", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const tweet = await Tweet.findById(req.params.tweetid);
    if (!tweet) return res.status(404).send({ error: "Tweet not found" });

    const alreadyLiked = tweet.likedBy.includes(userId);
    if (alreadyLiked) {
      tweet.likes = Math.max(0, tweet.likes - 1);
      tweet.likedBy = tweet.likedBy.filter((id) => id.toString() !== userId);
    } else {
      tweet.likes += 1;
      tweet.likedBy.push(userId);
    }
    await tweet.save();
    return res.send(tweet);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// Retweet / un-retweet toggle
app.post("/retweet/:tweetid", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const tweet = await Tweet.findById(req.params.tweetid);
    if (!tweet) return res.status(404).send({ error: "Tweet not found" });

    const alreadyRetweeted = tweet.retweetedBy.includes(userId);
    if (alreadyRetweeted) {
      tweet.retweets = Math.max(0, tweet.retweets - 1);
      tweet.retweetedBy = tweet.retweetedBy.filter(
        (id) => id.toString() !== userId
      );
    } else {
      tweet.retweets += 1;
      tweet.retweetedBy.push(userId);
    }
    await tweet.save();
    return res.send(tweet);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// ─── Image upload (Cloudinary) ────────────────────────────────────────────────
app.post("/upload-image", verifyToken, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "twiller",
      resource_type: "image",
    });
    return res.json({ url: result.secure_url });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "Upload failed" });
  }
});


// Simple in-memory OTP store (use Redis in production)
const otpStore = new Map();

app.post("/send-otp", verifyToken, async (req, res) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(req.user.email, { otp, expires: Date.now() + 10 * 60 * 1000 });
  // For now log it — wire up Nodemailer/Twilio for real delivery
  console.log(`OTP for ${req.user.email}: ${otp}`);
  res.json({ message: "OTP sent" });
});

app.post("/verify-otp", verifyToken, async (req, res) => {
  const record = otpStore.get(req.user.email);
  if (!record || record.otp !== req.body.otp || Date.now() > record.expires) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }
  otpStore.delete(req.user.email);
  res.json({ message: "OTP verified" });
});

app.post("/login-event", verifyToken, async (req, res) => {
  try {
    const ua = new UAParser(req.headers["user-agent"]);
    const browser = ua.getBrowser().name || "Unknown";
    const os = ua.getOS().name || "Unknown";
    const deviceType = ua.getDevice().type || "desktop";
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    // Mobile time restriction: 10AM–1PM IST only
    if (deviceType === "mobile") {
      const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const hour = now.getHours();
      if (hour < 10 || hour >= 13) {
        return res.status(403).json({ error: "Mobile login only allowed 10AM–1PM IST" });
      }
    }

    const user = await User.findOne({ email: req.user.email });
    await LoginLog.create({ userId: user._id, browser, os, device: deviceType, ip });

    // Chrome requires OTP — return flag to frontend
    const requiresOtp = browser?.toLowerCase().includes("chrome");
    res.json({ requiresOtp, browser, os, device: deviceType });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/login-history", verifyToken, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  const logs = await LoginLog.find({ userId: user._id }).sort({ timestamp: -1 }).limit(20);
  res.json(logs);
});

app.post("/upload-audio", verifyToken, audioUpload.single("audio"), async (req, res) => {
  // Time gate: 2PM–7PM IST only
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hour = now.getHours();
  if (hour < 14 || hour >= 19) {
    return res.status(403).json({ error: "Audio uploads only allowed 2PM–7PM IST" });
  }
  if (!req.file) return res.status(400).json({ error: "No audio file" });

  try {
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataURI, {
      resource_type: "video", // Cloudinary uses 'video' for audio
      folder: "twiller-audio",
    });
    // Check duration (Cloudinary returns it)
    if (result.duration > 300) { // 5 minutes
      await cloudinary.uploader.destroy(result.public_id, { resource_type: "video" });
      return res.status(400).json({ error: "Audio must be under 5 minutes" });
    }
    res.json({ url: result.secure_url, duration: result.duration });
  } catch (error) {
    res.status(500).json({ error: "Audio upload failed" });
  }
});


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLANS = {
  bronze: { price: 10000, limit: 3 },  // paise (₹100)
  silver: { price: 30000, limit: 5 },  // ₹300
  gold:   { price: 100000, limit: Infinity }, // ₹1000
};

app.post("/create-order", verifyToken, async (req, res) => {
  // Time gate: 10AM–11AM IST only
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hour = now.getHours();
  if (hour < 10 || hour >= 11) {
    return res.status(403).json({ error: "Payments only accepted 10AM–11AM IST" });
  }
  const plan = PLANS[req.body.plan];
  if (!plan) return res.status(400).json({ error: "Invalid plan" });

  const order = await razorpay.orders.create({
    amount: plan.price,
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  });
  res.json({ orderId: order.id, amount: plan.price });
});

app.post("/verify-payment", verifyToken, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
  const crypto = await import("crypto");
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expected !== razorpay_signature) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  const user = await User.findOne({ email: req.user.email });
  const planData = PLANS[plan];
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await Subscription.findOneAndUpdate(
    { userId: user._id },
    { plan, tweetLimit: planData.limit, tweetsUsed: 0, expiresAt },
    { upsert: true }
  );

  // Send invoice email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Twiller subscription invoice",
    html: `<h2>Thank you for subscribing!</h2><p>Plan: <strong>${plan}</strong></p><p>Payment ID: ${razorpay_payment_id}</p><p>Expires: ${expiresAt.toDateString()}</p>`,
  });

  res.json({ message: "Payment verified", plan });
});