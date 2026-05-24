// controllers/productController.js

import Product from "../models/product.js";
import { parseCSV, parseExcel, uploadToCloudinary } from "../utils/fileHelpers.js";

// ------------------- CREATE / BULK UPLOAD -------------------
export const createOrUploadProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "File or image is required",
      });
    }

    const fileType = req.file.originalname
      .split(".")
      .pop()
      .toLowerCase();

    // ================= BULK UPLOAD =================
    if (["csv", "xlsx", "xls"].includes(fileType)) {
      let productsData = [];

      if (fileType === "csv") {
        productsData = await parseCSV(req.file.buffer);
      } else {
        productsData = parseExcel(req.file.buffer);
      }

      if (!productsData || productsData.length === 0) {
        return res.status(400).json({
          message: "No valid data found in file",
        });
      }

      const formattedData = productsData
        .filter((p) => p.name)
        .map((p) => ({
          name: p.name.trim(),

          genericName: p.genericName
            ? p.genericName.trim()
            : p.name.trim(),

          description: p.description || "",

          basePrice: p.basePrice
            ? String(p.basePrice)
            : "",

          price:
            p.price !== undefined
              ? Number(p.price)
              : 0,

          quantity:
            p.quantity !== undefined
              ? Number(p.quantity)
              : 0,

          image:
            p.image ||
            "https://via.placeholder.com/150",

          dosageForm:
            p.dosageForm || "Tablet",

          strength:
            p.strength || "N/A",

          // ✅ SKU ADDED
          sku: p.sku ? p.sku.trim() : undefined,

          requiresPrescription:
            String(p.requiresPrescription)
              .toLowerCase() === "true",

          expiryDate: p.expiryDate
            ? new Date(p.expiryDate)
            : new Date(
                Date.now() + 31536000000
              ),

          category: {
            name:
              p.categoryName ||
              "Uncategorized",

            subCategory:
              p.subCategory || "",
          },
        }));

      const createdProducts =
        await Product.insertMany(formattedData);

      return res.status(201).json({
        message:
          "Bulk medicines uploaded successfully",

        count: createdProducts.length,

        createdProducts,
      });
    }

    // ================= SINGLE PRODUCT =================
    const {
      name,
      genericName,
      description,
      price,
      basePrice,
      categoryName,
      subCategory,
      quantity,
      dosageForm,
      strength,
      requiresPrescription,
      expiryDate,
      sku, // ✅ ADDED
    } = req.body;

    if (
      !name ||
      !categoryName ||
      !genericName
    ) {
      return res.status(400).json({
        message:
          "Brand Name, Generic Name, and Category are required",
      });
    }

    const result = await uploadToCloudinary(
      req.file.buffer
    );

    const product = await Product.create({
      name: name.trim(),

      genericName:
        genericName.trim(),

      description:
        description || "",

      basePrice:
        basePrice || "",

      price:
        Number(price) || 0,

      quantity:
        Number(quantity) || 0,

      image:
        result.secure_url,

      dosageForm:
        dosageForm || "Tablet",

      strength:
        strength || "",

      // ✅ SKU SAVED
      sku: sku
        ? sku.trim()
        : undefined,

      requiresPrescription:
        requiresPrescription === "true" ||
        requiresPrescription === true,

      expiryDate:
        expiryDate
          ? new Date(expiryDate)
          : undefined,

      category: {
        name: categoryName,

        subCategory:
          subCategory || "",
      },
    });

    res.status(201).json({
      message:
        "Medicine created successfully",

      product,
    });
  } catch (err) {
    console.error(
      "Create Controller Error:",
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
};

// ------------------- READ ALL -------------------
export const getAllProducts = async (req, res) => {
  try {
    // We sort by expiryDate so admin can see what is expiring soonest
    const products = await Product.find().sort({ expiryDate: 1 });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------- READ SINGLE -------------------
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Medicine not found" });

    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------- UPDATE -------------------
export const updateProduct = async (req, res) => {
  try {
   const {
  name,
  genericName,
  description,
  price,
  basePrice,
  categoryName,
  subCategory,
  quantity,
  dosageForm,
  strength,
  requiresPrescription,
  expiryDate,
  sku
} = req.body;

    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Medicine not found" });

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      product.image = result.secure_url;
    }

    // Update basic fields
    if (name !== undefined) product.name = name.trim();
    if (genericName !== undefined) product.genericName = genericName.trim();
    if (basePrice !== undefined) product.basePrice = basePrice;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (quantity !== undefined) product.quantity = Number(quantity);
    if (sku !== undefined) product.sku = sku.trim(); // ADDED SKU UPDATE LOGIC
    
    // Update medical fields
    if (dosageForm !== undefined) product.dosageForm = dosageForm;
    if (strength !== undefined) product.strength = strength;
    if (requiresPrescription !== undefined) {
        product.requiresPrescription = requiresPrescription === 'true' || requiresPrescription === true;
    }
    if (expiryDate !== undefined) product.expiryDate = new Date(expiryDate);

    // Update category
    if (categoryName !== undefined) product.category.name = categoryName;
    if (subCategory !== undefined) product.category.subCategory = subCategory;

    await product.save();

    res.status(200).json({
      message: "Medicine updated successfully",
      product,
    });
  } catch (err) {
    console.error("Update Controller Error:", err);
    res.status(500).json({ message: err.message });
  }
};


export const getExpiryAlerts = async (req, res) => {
  try {
    const days = Number(req.query.days) || 7;
    const now = new Date();
    const upcoming = new Date();
    upcoming.setDate(now.getDate() + days);

    const expiringSoon = await Product.find({
      expiryDate: { $gte: now, $lte: upcoming },
      quantity: { $gt: 0 },
    }).sort({ expiryDate: 1 });

    const expired = await Product.find({
      expiryDate: { $lt: now },
    }).sort({ expiryDate: 1 });

    const lowStock = await Product.find({
      quantity: { $lte: 10, $gt: 0 },
    }).sort({ quantity: 1 });

    res.status(200).json({
      expiringSoon,
      expired,
      lowStock,
      thresholdDays: days,
    });
  } catch (err) {
    res.status(500).json({ message: 'Expiry alert lookup failed', error: err.message });
  }
};

// ------------------- DELETE -------------------
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Medicine not found" });

    res.status(200).json({ message: "Medicine deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};