import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  image: { type: String, required: true },
  rawText: { type: String, required: true },
  extractedItems: [
    {
      name: { type: String, required: true },
      dosage: { type: String },
      rawText: { type: String, required: true },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);

export default Prescription;
