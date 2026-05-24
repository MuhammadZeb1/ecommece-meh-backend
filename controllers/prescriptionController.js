import Prescription from '../models/prescription.js';
import PDFDocument from 'pdfkit';
import { uploadToCloudinary, extractTextFromBuffer } from '../utils/fileHelpers.js';

const parsePrescriptionText = (rawText) => {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .map((line) => {
      const dosageMatch = line.match(/(\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|iu|tablet|tab|capsule|caps|syrup|drops|puff|spray)\b)/i);
      const dosage = dosageMatch?.[0]?.trim() ?? '';
      const name = line.replace(dosage, '').replace(/[^a-zA-Z0-9\s\-\/]/g, '').trim();

      return {
        rawText: line,
        name: name || line,
        dosage,
      };
    })
    .filter((item) => item.rawText);
};

export const scanPrescription = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Prescription image is required.' });
    }

    const resourceType = req.file.mimetype === 'application/pdf' ? 'auto' : 'image';
    const uploadResult = await uploadToCloudinary(req.file.buffer, 'prescriptions', resourceType);
    const rawText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
    const extractedItems = rawText ? parsePrescriptionText(rawText) : [];

    const prescription = await Prescription.create({
      user: req.user?._id,
      image: uploadResult.secure_url,
      rawText,
      extractedItems,
    });

    res.status(201).json({
      message: 'Prescription uploaded successfully',
      prescription,
      rawText,
      extractedItems,
      fileType: req.file.mimetype,
    });
  } catch (err) {
    console.error('Prescription scan error:', err);
    res.status(500).json({ message: 'Prescription scan failed', error: err.message });
  }
};

const createPrescriptionPdf = (res, { fileName, fileType, rawText, extractedItems }) => {
  const doc = new PDFDocument({ margin: 40 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="prescription-scan.pdf"');

  doc.pipe(res);

  doc.fontSize(18).text('Prescription OCR Result', { align: 'center' });
  doc.moveDown();
  doc.fontSize(11).text(`Source file: ${fileName}`);
  doc.text(`File type: ${fileType}`);
  doc.moveDown();

  doc.fontSize(13).text('Extracted text:', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).text(rawText || 'No text detected', {
    align: 'left',
    lineGap: 4,
  });
  doc.moveDown();

  doc.fontSize(13).text('Detected medicines:', { underline: true });
  doc.moveDown(0.5);

  if (extractedItems.length > 0) {
    extractedItems.forEach((item, index) => {
      const doseLabel = item.dosage ? ` (${item.dosage})` : '';
      doc.fontSize(11).text(`${index + 1}. ${item.name}${doseLabel}`, {
        continued: false,
      });
      if (item.rawText) {
        doc.fontSize(10).fillColor('gray').text(`   ${item.rawText}`);
        doc.fillColor('black');
      }
      doc.moveDown(0.3);
    });
  } else {
    doc.fontSize(11).text('No medicines detected');
  }

  doc.end();
};

export const scanPrescriptionPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Prescription file is required.' });
    }

    const rawText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
    const extractedItems = rawText ? parsePrescriptionText(rawText) : [];

    createPrescriptionPdf(res, {
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      rawText,
      extractedItems,
    });
  } catch (err) {
    console.error('Prescription PDF generation error:', err);
    res.status(500).json({ message: 'Prescription PDF generation failed', error: err.message });
  }
};

export const getPrescriptions = async (req, res) => {
  try {
    const query = req.user?._id ? { user: req.user._id } : {};
    const prescriptions = await Prescription.find(query).sort('-createdAt');

    res.status(200).json(prescriptions);
  } catch (err) {
    console.error('Get prescriptions error:', err);
    res.status(500).json({ message: 'Failed to load prescriptions', error: err.message });
  }
};
