import AdminPurchase from "../models/AdminPurchaseSchema.js";
import CustomerPurchase from "../models/CustomerPurchaseSchema.js";
import Product from "../models/Product.js";

// =================== Analytics & Reporting ===================

/**
 * Generates Daily, Weekly, and Monthly reports
 * and identifies best-selling products by sorting them.
 */
export const getAdminAnalytics = async (req, res) => {
  try {
    const { period } = req.query; // 'daily', 'weekly', 'monthly'
    let startDate = new Date(0);

    // 1. Determine the Start Date for the filter
    if (period === "daily") {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "weekly") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "monthly") {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    }
    // If period is "all", startDate remains new Date(0)

    const purchases = await AdminPurchase.find({
      purchasedAt: { $gte: startDate },
    }).populate("product");

    let totalSales = 0;
    let totalProfit = 0;
    let productSalesMap = {}; 

    // 3. Process data in a single loop
    purchases.forEach((item) => {
      const salePrice = item.price || 0;
      const quantity = item.quantity || 0;
      const basePrice = item.product?.basePrice || 0;
      const costPrice = basePrice * quantity;

      totalSales += salePrice;
      totalProfit += (salePrice - costPrice);

      const productId = item.product?._id?.toString() || "unknown";
      
      if (!productSalesMap[productId]) {
        productSalesMap[productId] = { 
          name: item.product?.name || "Deleted Product", 
          image: item.product?.image || "", 
          unitsSold: 0, 
          revenue: 0 
        };
      }
      productSalesMap[productId].unitsSold += quantity;
      productSalesMap[productId].revenue += salePrice;
    });

    // 4. Sort products by unitsSold (Highest to Lowest)
    const sortedProducts = Object.values(productSalesMap).sort(
      (a, b) => b.unitsSold - a.unitsSold
    );

    res.json({
      summary: {
        totalSales: Number(totalSales.toFixed(2)),
        totalProfit: Number(totalProfit.toFixed(2)),
        totalLoss: totalProfit < 0 ? Number(Math.abs(totalProfit).toFixed(2)) : 0,
      },
      bestSellingProducts: sortedProducts,
      totalTransactions: purchases.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Analytics Error", error: err.message });
  }
};
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
