// controllers/productController.js

import Product from "../models/product.js";
import { parseCSV, parseExcel, uploadToCloudinary } from "../utils/fileHelpers.js";

// ------------------- CREATE / BULK UPLOAD -------------------
export const createOrUploadProducts = async (req, res) => {
  try {
    if (!req.file) {
  console.log("khab");
  return res.status(400).json({ message: "File or image is required" });
}


    const fileType = req.file.originalname.split(".").pop().toLowerCase();
    console.log("kkk")

    // ================= BULK UPLOAD =================
    if (["csv", "xlsx", "xls"].includes(fileType)) {
      let productsData = [];

      if (fileType === "csv") {
        productsData = await parseCSV(req.file.buffer);
      } else {
        productsData = parseExcel(req.file.buffer);
      }

      if (!productsData || productsData.length === 0) {
        return res.status(400).json({ message: "No valid data found in file" });
      }

      const formattedData = productsData
        .filter((p) => p.name)
        .map((p) => ({
          name: p.name.trim(),
          description: p.description || "",
          basePrice: p.basePrice ? String(p.basePrice) : "",
          price: p.price !== undefined ? Number(p.price) : 0,
          quantity: p.quantity !== undefined ? Number(p.quantity) : 0,
          image: p.image || "https://via.placeholder.com/150",
          category: {
            name: p.categoryName || "Uncategorized",
            subCategory: p.subCategory || "",
          },
        }));

      if (formattedData.length === 0) {
        return res
          .status(400)
          .json({ message: "No valid product names found in file." });
      }

      const createdProducts = await Product.insertMany(formattedData);

      return res.status(201).json({
        message: "Bulk products uploaded successfully",
        count: createdProducts.length,
        createdProducts,
      });
    }

    // ================= SINGLE PRODUCT =================
    const { name, description, price, basePrice,categoryName, subCategory, quantity } =
      req.body;

    if (!name || !categoryName) {
      return res
        .status(400)
        .json({ message: "Name and Category are required" });
    }

    const result = await uploadToCloudinary(req.file.buffer);

    const product = await Product.create({
      name: name.trim(),
      description: description || "",
      basePrice: basePrice || "",
      price: price !== undefined ? Number(price) : 0,
      quantity: quantity !== undefined ? Number(quantity) : 0,
      image: result.secure_url,
      category: {
        name: categoryName,
        subCategory: subCategory || "",
      },
    });

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (err) {
    console.error("Create Controller Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ------------------- READ ALL -------------------
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
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
      return res.status(404).json({ message: "Product not found" });

    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------- UPDATE -------------------
export const updateProduct = async (req, res) => {
  try {
    const { name, description, price,basePrice, categoryName, subCategory, quantity } =
      req.body;

    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    // If new image uploaded
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      product.image = result.secure_url;
    }

    if (name !== undefined) product.name = name.trim();
    if (basePrice !== undefined) product.basePrice = basePrice;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (quantity !== undefined) product.quantity = Number(quantity);

    if (categoryName !== undefined)
      product.category.name = categoryName;

    if (subCategory !== undefined)
      product.category.subCategory = subCategory;

    await product.save();

    res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (err) {
    console.error("Update Controller Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ------------------- DELETE -------------------
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product)
      return res.status(404).json({ message: "Product not found" });

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
