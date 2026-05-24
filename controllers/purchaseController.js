import AdminPurchase from "../models/AdminPurchaseSchema.js";
import CustomerPurchase from "../models/CustomerPurchaseSchema.js";
import Product from "../models/Product.js";

// =================== Analytics & Reporting ===================

/**
 * Generates Pharmacy Reports and Best Sellers
 * Pulls basePrice from Product model via populate for profit math
 */
export const getAdminAnalytics = async (req, res) => {
  try {
    const { period } = req.query; // 'daily', 'weekly', 'monthly'
    let startDate = new Date(0);

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

    // Populate "product" to access basePrice and image for reporting
    const purchases = await AdminPurchase.find({
      purchasedAt: { $gte: startDate },
    }).populate("product");

    let totalSales = 0;
    let totalProfit = 0;
    let productSalesMap = {}; 

    purchases.forEach((item) => {
      const salePrice = item.price || 0;
      const quantity = item.quantity || 0;
      
      // Convert basePrice (String in model) to Number for math
      const basePrice = Number(item.product?.basePrice) || 0;
      const totalCost = basePrice * quantity;

      totalSales += salePrice;
      totalProfit += (salePrice - totalCost);

      const productId = item.product?._id?.toString() || "unknown";
      
      if (!productSalesMap[productId]) {
        productSalesMap[productId] = { 
          name: item.product?.name || "Deleted Product", 
          genericName: item.product?.genericName || "N/A",
          image: item.product?.image || "", 
          unitsSold: 0, 
          revenue: 0 
        };
      }
      productSalesMap[productId].unitsSold += quantity;
      productSalesMap[productId].revenue += salePrice;
    });

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

// =================== Purchase Operations ===================

/**
 * Process purchase and decrement inventory
 */
export const createPurchase = async (req, res) => {
  try {
    const { items } = req.body; 
    const userId = req.user._id;

    const processedItems = [];

    for (const item of items) {
      const { productId, quantity } = item;

      const product = await Product.findById(productId);
      if (!product) continue; // Skip if product doesn't exist

      if (quantity > product.quantity) {
        return res.status(400).json({ 
          message: `Stock low for ${product.name}. Available: ${product.quantity}` 
        });
      }

      const finalPrice = product.price * quantity;

      // Create Admin record for bookkeeping
      const adminPurchase = await AdminPurchase.create({
        product: product._id,
        customer: userId,
        quantity,
        price: finalPrice,
      });
console.log("User creating purchase:", req.user?._id);
      // Create Customer record for their dashboard
      const customerPurchase = await CustomerPurchase.create({
        product: product._id,
        customer: userId, // Ensure this field exists in CustomerPurchaseSchema
        quantity,
        price: finalPrice,
      });

      // Update Inventory
      product.quantity -= quantity;
      await product.save();

      processedItems.push({ adminPurchase, customerPurchase });
    }

    res.status(201).json({ 
      message: "Order placed successfully", 
      count: processedItems.length 
    });
  } catch (err) {
    res.status(500).json({ message: "Purchase failed", error: err.message });
  }
};

// =================== Retrieval Operations ===================

export const getAllAdminPurchases = async (req, res) => {
  try {
    const purchases = await AdminPurchase.find()
      .populate("product", "name genericName price image batchNumber expiryDate")
      .populate("customer", "name email")
      .sort("-purchasedAt");

    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getCustomerPurchases = async (req, res) => {
  try {
    // CRITICAL: Filter by the logged-in user's ID
    const purchases = await CustomerPurchase.find({ customer: req.user._id })
      .populate("product", "name genericName price image dosageForm strength expiryDate")
      .sort("-purchasedAt");
      
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// =================== Deletion Operations ===================

export const deletePurchaseByAdmin = async (req, res) => {
  try {
    const { purchaseId } = req.params;

    const adminPurchase = await AdminPurchase.findById(purchaseId);
    if (!adminPurchase) return res.status(404).json({ message: "Record not found" });

    // Remove from both logs
    await AdminPurchase.findByIdAndDelete(purchaseId);
    await CustomerPurchase.findOneAndDelete({ 
      product: adminPurchase.product, 
      customer: adminPurchase.customer 
    });

    res.json({ message: "Purchase history cleared by admin" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const deletePurchaseByCustomer = async (req, res) => {
  try {
    const { purchaseId } = req.params;

    // Verify user owns this record before deleting
    const purchase = await CustomerPurchase.findOne({ 
      _id: purchaseId, 
      customer: req.user._id 
    });

    if (!purchase) return res.status(404).json({ message: "Record not found" });

    await CustomerPurchase.findByIdAndDelete(purchaseId);
    res.json({ message: "Removed from your history" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};