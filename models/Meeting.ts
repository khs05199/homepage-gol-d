import { Schema, model, models } from "mongoose";

const MeetingSchema = new Schema({
  title: { type: String, required: true },
  agenda: { type: String, default: "" },
  status: { type: String, enum: ["계획", "진행중", "완료"], default: "계획" },
  notes: { type: String, default: "" },
  participantIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
  date: { type: Date, required: true },
  locationOrLink: { type: String, default: "" },
  imageUrl: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

MeetingSchema.index({ date: -1 });
MeetingSchema.index({ status: 1 });

export default models.Meeting || model("Meeting", MeetingSchema);
