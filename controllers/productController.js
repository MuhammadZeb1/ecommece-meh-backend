import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// Helper to upload image buffer to Cloudinary
const uploadToCloudinary = (buffer, folder = "products") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// ------------------- CREATE -------------------
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, categoryName, subCategory } = req.body;
    if (!req.file) return res.status(400).json({ message: "Image is required" });

    const result = await uploadToCloudinary(req.file.buffer);

    const product = await Product.create({
      name,
      description,
      price,
      image: result.secure_url,
      category: { name: categoryName, subCategory },
    });

    res.status(201).json({ message: "Product created", product });
  } catch (err) {
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
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------- UPDATE -------------------
export const updateProduct = async (req, res) => {
  try {
    const { name, description, price, categoryName, subCategory } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // If new image is uploaded, replace it
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      product.image = result.secure_url;
    }

    // Update fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category.name = categoryName || product.category.name;
    product.category.subCategory = subCategory || product.category.subCategory;

    await product.save();

    res.status(200).json({ message: "Product updated", product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------- DELETE -------------------
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    await product.remove();
    res.status(200).json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
