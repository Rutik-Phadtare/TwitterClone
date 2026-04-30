import mongoose from "mongoose";
const LoginLogSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  browser:  String,
  os:       String,
  device:   String, // desktop | mobile | tablet
  ip:       String,
  timestamp:{ type: Date, default: Date.now },
});
export default mongoose.model("LoginLog", LoginLogSchema);