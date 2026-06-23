import { Schema, model, models } from "mongoose";

const ProjectSchema = new Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ["논문", "개발", "공모전"], required: true },
  description: { type: String, default: "" },
  leadId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  approvalStatus: {
    type: String,
    enum: ["진행중", "검토대기", "승인", "거절"],
    default: "검토대기",
  },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
  metadata: { type: Schema.Types.Mixed, default: {} },
  startDate: { type: Date },
  completionDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default models.Project || model("Project", ProjectSchema);
