import mongoose from "mongoose";
const UserSchema = mongoose.Schema({
  username: { type: String, required: true },
  displayName: { type: String, required: true },
  avatar: { type: String, required: true },
  banner: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  bio: { type: String, default: "" },
  location: { type: String, default: "" },
  website: { type: String, default: "" },
  joinedDate: { type: Date, default: Date.now },
  // ADD to your User schema:
followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
});

export default mongoose.model("User", UserSchema);