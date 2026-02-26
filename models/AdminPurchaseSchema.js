// models/AdminPurchase.js
import mongoose from "mongoose";

const adminPurchaseSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
  purchasedAt: { type: Date, default: Date.now },
});

export default mongoose.model("AdminPurchase", adminPurchaseSchema);
