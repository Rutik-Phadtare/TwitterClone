import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }],
  lastMessage: {
    content:   { type: String, default: "" },
    type:      { type: String, default: "text" },
    senderId:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date },
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: new Map(),
  },
}, { timestamps: true });

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

export default mongoose.model("Conversation", ConversationSchema);