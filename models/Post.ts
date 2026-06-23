import { Schema, model, models } from "mongoose";

const PostSchema = new Schema({
  authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  projectId: { type: Schema.Types.ObjectId, ref: "Project" },
  meetingId: { type: Schema.Types.ObjectId, ref: "Meeting" },
  resourceId: { type: Schema.Types.ObjectId, ref: "Resource" },
  fundLedgerId: { type: Schema.Types.ObjectId, ref: "FundLedger" },
  title: { type: String, required: true },
  category: {
    type: String,
    enum: ["공지", "프로젝트", "회의", "자료", "재정"],
    required: true,
  },
  content: { type: String, required: true },
  imageUrl: { type: String },
  attachments: [{
    name: { type: String },
    url: { type: String },
    type: { type: String },
  }],
  viewCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  reactions: {
    check: { type: Number, default: 0 },
    thumbsup: { type: Number, default: 0 },
    heart: { type: Number, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },
});

PostSchema.index({ category: 1, createdAt: -1 });
PostSchema.index({ authorId: 1 });

export default models.Post || model("Post", PostSchema);
