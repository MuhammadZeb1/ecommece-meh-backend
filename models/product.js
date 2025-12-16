// models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    image: { type: String, required: true }, // Cloudinary URL
    category: { 
        type: {
            name: { type: String, required: true },        // main category
            subCategory: { type: String }                  // optional subcategory
        },
        required: true
    },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Product', productSchema);
