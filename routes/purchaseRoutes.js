import express from "express";
import {
  createPurchase,
  getAllAdminPurchases,
  getCustomerPurchases,
  deletePurchaseByAdmin,
  deletePurchaseByCustomer,
  getAdminAnalytics // ✅ Import the new analytics controller
} from "../controllers/purchaseController.js";
import authMiddleware from "../middlewares/authMiddlewares.js";

const router = express.Router();

// =================== Customer Routes ===================
// Customer makes a purchase
router.post("/customer", authMiddleware, createPurchase);

// Customer sees his purchases
router.get("/customer", authMiddleware, getCustomerPurchases);

// Customer deletes his purchase (does not affect admin)
router.delete("/customer/:purchaseId", authMiddleware, deletePurchaseByCustomer);

// =================== Admin Routes ===================

// ✅ Admin sees sales analytics (Daily, Weekly, Monthly)
// Access via: GET /api/purchases/admin/analytics?period=weekly
router.get("/admin/analytics", authMiddleware, getAdminAnalytics);

// Admin sees all purchases
router.get("/admin", authMiddleware, getAllAdminPurchases);

// Admin deletes a purchase (also deletes from customer)
router.delete("/admin/:purchaseId", authMiddleware, deletePurchaseByAdmin);

export default router;