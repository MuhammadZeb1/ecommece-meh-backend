import express from 'express';
import upload from '../middlewares/upload.js';
import { scanPrescription, scanPrescriptionPdf, getPrescriptions } from '../controllers/prescriptionController.js';
import protect from '../middlewares/authMiddlewares.js';

const router = express.Router();

router.post('/scan', upload.single('file'), scanPrescription);
router.post('/scan/pdf', upload.single('file'), scanPrescriptionPdf);
router.get('/', protect, getPrescriptions);

export default router;
