import { Schema, model, models } from "mongoose";

const CommentSchema = new Schema({
  postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

CommentSchema.index({ postId: 1, createdAt: 1 });

export default models.Comment || model("Comment", CommentSchema);
