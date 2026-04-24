// models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    basePrice : { type:String},
    price: { type: Number, required: true },
    image: { type: String, required: true }, // Cloudinary URL
    category: { 
        type: {
            name: { type: String, required: true },        // main category
            subCategory: { type: String }                  // optional subcategory
        },
        required: true
    },
    
    quantity: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

// ✅ Prevent Overwrite Error
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
