import mongoose from "mongoose";
const SubscriptionSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  plan:      { type: String, enum: ["free", "bronze", "silver", "gold"], default: "free" },
  tweetLimit:{ type: Number, default: 1 },
  tweetsUsed:{ type: Number, default: 0 },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});
export default mongoose.model("Subscription", SubscriptionSchema);