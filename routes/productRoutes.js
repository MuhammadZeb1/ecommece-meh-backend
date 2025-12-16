import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from "../controllers/productController.js";
import upload from "../middlewares/upload.js"
import protect from "../middlewares/authMiddlewares.js";

const router = express.Router();

// Public routes
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Protected routes
router.post("/create",  upload.single("image"), createProduct);
router.put("/update/:id", protect, upload.single("image"), updateProduct);
router.delete("/delete/:id", protect, deleteProduct);

export default router;
