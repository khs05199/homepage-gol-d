import { Schema, model, models } from "mongoose";

const FundLedgerSchema = new Schema({
  type: { type: String, enum: ["수입", "지출"], required: true },
  amount: { type: Number, required: true },
  category: { type: String, enum: ["회비", "활동비", "상품비"], required: true },
  description: { type: String, default: "" },
  date: { type: Date, required: true },
  balance: { type: Number, required: true },
  recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

FundLedgerSchema.index({ date: -1 });

export default models.FundLedger || model("FundLedger", FundLedgerSchema);
