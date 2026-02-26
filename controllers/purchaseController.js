import AdminPurchase from "../models/AdminPurchaseSchema.js";
import CustomerPurchase from "../models/CustomerPurchaseSchema.js";
import Product from "../models/Product.js";

// Create a purchase (Customer buys a product)
export const createPurchase = async (req, res) => {
  try {
    const { items } = req.body; 
    console.log("items",items)
    const userId = req.user._id;

    const adminPurchases = [];
    const customerPurchases = [];

    for (let i = 0; i < items.length; i++) {
      const { productId, quantity } = items[i];

      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ message: "Product not found" });
      if (quantity > product.quantity)
        return res.status(400).json({ message: `Quantity exceeds stock for ${product.name}` });

      // AdminPurchase
      const adminPurchase = new AdminPurchase({
        product: product._id,
        customer: userId,
        quantity,
        price: product.price * quantity,
      });
      await adminPurchase.save();
      adminPurchases.push(adminPurchase);

      // CustomerPurchase
      const customerPurchase = new CustomerPurchase({
        product: product._id,
        quantity,
        price: product.price * quantity,
      });
      await customerPurchase.save();
      customerPurchases.push(customerPurchase);

      // Reduce product stock
      product.quantity -= quantity;
      await product.save();
    }

    res.status(201).json({ message: "Purchase successful", adminPurchases, customerPurchases });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// Get all purchases for Admin
export const getAllAdminPurchases = async (req, res) => {
  try {
    const purchases = await AdminPurchase.find()
      .populate({
        path: "product",
        select: "name price image"
      })
      .populate({
        path: "customer",
        select: "name email"
      });

    res.json(purchases);
  } catch (err) {
    console.error("Admin purchases error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// Get all purchases for Customer
export const getCustomerPurchases = async (req, res) => {
  try {
    const purchases = await CustomerPurchase.find({ })
      .populate({
        path: "product",
        select: "name price image"
      })
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete purchase by Admin (also delete from customer)
export const deletePurchaseByAdmin = async (req, res) => {
  try {
    const { purchaseId } = req.params;

    const adminPurchase = await AdminPurchase.findById(purchaseId);
    if (!adminPurchase) return res.status(404).json({ message: "Purchase not found" });

    // Delete from AdminPurchase
    await AdminPurchase.findByIdAndDelete(purchaseId);

    // Delete corresponding CustomerPurchase
    await CustomerPurchase.findOneAndDelete({ product: adminPurchase.product });

    res.json({ message: "Purchase deleted by admin" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete purchase by Customer (does NOT affect Admin)
export const deletePurchaseByCustomer = async (req, res) => {
  try {
    const { purchaseId } = req.params;

    const purchase = await CustomerPurchase.findById(purchaseId);
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });

    await CustomerPurchase.findByIdAndDelete(purchaseId);

    res.json({ message: "Purchase deleted by customer" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
