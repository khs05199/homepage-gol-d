import { Schema, model, models } from "mongoose";

const ClubInfoSchema = new Schema({
  meaningOfName: { type: String, default: "" },
  coreValues: [{
    title: { type: String },
    description: { type: String },
  }],
  thingsToLearn: [{ type: String }],
  mainActivities: [{
    description: { type: String },
    imageUrl: { type: String },
  }],
  photos: [{ type: String }],
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
});

export default models.ClubInfo || model("ClubInfo", ClubInfoSchema);
