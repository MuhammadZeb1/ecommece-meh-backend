import express from "express";
import {
  createPurchase,
  getAllAdminPurchases,
  getCustomerPurchases,
  deletePurchaseByAdmin,
  deletePurchaseByCustomer,
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
// Admin sees all purchases
router.get("/admin", authMiddleware, getAllAdminPurchases);

// Admin deletes a purchase (also deletes from customer)
router.delete("/admin/:purchaseId", authMiddleware, deletePurchaseByAdmin);

export default router;
