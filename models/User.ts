import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["회장", "부회장", "관리자", "서기", "동아리 전담 멘토", "부원"], default: "부원" },
  username: { type: String, unique: true, sparse: true },
  statusMessage: { type: String, default: "" },
  avatar: { type: String, default: "" },
  bio: { type: String, default: "" },
  skills: [String],
  age: { type: Number, default: null },
  grade: { type: String, default: "" },
  portfolioSlug: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: null },
});

export default models.User || model("User", UserSchema);
