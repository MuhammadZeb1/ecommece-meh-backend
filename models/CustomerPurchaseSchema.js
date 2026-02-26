// models/CustomerPurchase.js
import mongoose from "mongoose";

const customerPurchaseSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
  purchasedAt: { type: Date, default: Date.now },
});

export default mongoose.model("CustomerPurchase", customerPurchaseSchema);
