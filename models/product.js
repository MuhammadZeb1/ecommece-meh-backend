// models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Brand Name (e.g., Panadol)
    genericName: { type: String, required: true }, // Chemical Name (e.g., Paracetamol)
    description: { type: String },
    
    // Medical Specifics
    dosageForm: { 
        type: String, 
        enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops'], 
        required: true 
    },
    strength: { type: String, required: true }, // e.g., 500mg or 10ml
    
    basePrice: { type: String },
    price: { type: Number, required: true },
    image: { type: String, required: true }, // Cloudinary URL
    
    category: { 
        type: {
            name: { type: String, required: true },        // e.g., Antibiotics, Pain Relief
            subCategory: { type: String }                  // e.g., Adult, Pediatric
        },
        required: true
    },

    // Pharmacy Logic
    requiresPrescription: { type: Boolean, default: false },
    sideEffects: [{ type: String }],
    howToUse: { type: String },
    
    // Inventory & Safety
    quantity: { type: Number, required: true },
<<<<<<< HEAD
    sku: { type: String, }, // Stock Keeping Unit
=======
    sku: { type: String, unique: true }, // Stock Keeping Unit
>>>>>>> 11b00b4 (for deployment)
    batchNumber: { type: String },
    expiryDate: { type: Date, required: true },
    
    isDiscontinued: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

// Create an index to make searching by Generic Name fast
productSchema.index({ name: 'text', genericName: 'text', description: 'text' });

// ✅ Prevent Overwrite Error
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;