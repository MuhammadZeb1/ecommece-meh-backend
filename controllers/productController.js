// controllers/productController.js
import Product from "../models/Product.js";
import { parseCSV, parseExcel, uploadToCloudinary } from "../utils/fileHelpers.js";

export const createOrUploadProducts = async (req, res) => {
  console.log("first")
  try {
    if (!req.file) return res.status(400).json({ message: "File or image is required" });

    const fileType = req.file.originalname.split(".").pop().toLowerCase();
    console.log("2")

    // ----- BULK UPLOAD -----
    if (["csv", "xlsx", "xls"].includes(fileType)) {
      let productsData = [];

      if (fileType === "csv") {
        productsData = await parseCSV(req.file.buffer);
      } else {
        productsData = parseExcel(req.file.buffer);
      }

      // Check if productsData is empty or undefined
      if (!productsData || productsData.length === 0) {
        console.log("No valid data found in the file.");
        return res.status(400).json({ message: "No valid data found in the file." });

      }

      console.log("Parsed Data Sample:", productsData[0]);

      // Format data and filter out rows missing the 'name' field
      const formattedData = productsData
        .filter((p) => p.name) // Skip rows where name is missing
        .map((p) => ({
          name: p.name.trim(),
          description: p.description || "",
          price: Number(p.price) || 0,
          image: p.image || "", 
          category: { 
            name: p.categoryName || "Uncategorized", 
            subCategory: p.subCategory || "" 
          },
        }));

      if (formattedData.length === 0) {
        return res.status(400).json({ message: "No valid product names found in file." });
      }

      const createdProducts = await Product.insertMany(formattedData);
      return res.status(201).json({ message: "Bulk products uploaded", createdProducts });
    }

    // ----- SINGLE IMAGE UPLOAD -----
    const { name, description, price, categoryName, subCategory } = req.body;
    const result = await uploadToCloudinary(req.file.buffer);

    const product = await Product.create({
      name,
      description,
      price: Number(price) || 0,
      image: result.secure_url,
      category: { name: categoryName, subCategory },
    });

    res.status(201).json({ message: "Product created", product });

  } catch (err) {
    console.error("Controller Error:", err);
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
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
