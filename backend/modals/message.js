import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
    index: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["text", "image", "gif", "sticker", "emoji"],
    default: "text",
  },
  content:    { type: String, default: "" },   // text or emoji string
  mediaUrl:   { type: String, default: null },  // image / gif / sticker URL
  tenorId:    { type: String, default: null },  // Tenor GIF id for dedup
  read:       { type: Boolean, default: false },
  readAt:     { type: Date,    default: null },
  deleted:    { type: Boolean, default: false },
}, { timestamps: true });

MessageSchema.index({ conversationId: 1, createdAt: -1 });

export default mongoose.model("Message", MessageSchema);