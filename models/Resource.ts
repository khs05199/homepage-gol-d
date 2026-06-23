import { Schema, model, models } from "mongoose";
export { RESOURCE_FOLDERS } from "@/lib/resourceFolders";
export type { ResourceFolder } from "@/lib/resourceFolders";

const ResourceSchema = new Schema({
  folder: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, default: "" },
  imageUrls: [{ type: String }],
  attachments: [{
    name: { type: String },
    url: { type: String },
    type: { type: String },
  }],
  links: [{ type: String }],
  tags: [{ type: String }],
  authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ResourceSchema.index({ folder: 1, createdAt: -1 });

export default models.Resource || model("Resource", ResourceSchema);
