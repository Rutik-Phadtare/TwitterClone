import dotenv from "dotenv";
dotenv.config();

import admin from "firebase-admin";

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  // This will tell you exactly which value is missing
  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ Missing Firebase env vars:", {
      FIREBASE_PROJECT_ID: projectId ? "✅" : "❌ MISSING",
      FIREBASE_CLIENT_EMAIL: clientEmail ? "✅" : "❌ MISSING",
      FIREBASE_PRIVATE_KEY: privateKey ? "✅" : "❌ MISSING",
    });
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).send({ error: "Unauthorized" });
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).send({ error: "Invalid or expired token" });
  }
};