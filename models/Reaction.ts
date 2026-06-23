import { Schema, model, models } from "mongoose";

const ReactionSchema = new Schema({
  postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  reactionType: { type: String, enum: ["check", "thumbsup", "heart"], required: true },
  createdAt: { type: Date, default: Date.now },
});

// 유저당 게시글 + 반응 타입 중복 방지
ReactionSchema.index({ postId: 1, userId: 1, reactionType: 1 }, { unique: true });

export default models.Reaction || model("Reaction", ReactionSchema);
