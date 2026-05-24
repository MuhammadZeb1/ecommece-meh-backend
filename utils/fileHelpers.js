import csv from "csv-parser";
import XLSX from "xlsx";
import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";
import path from "path";
import pdfParse from "pdf-parse";
import { createWorker } from 'tesseract.js';

const getTesseractConfig = () => {
  const basePath = process.cwd();
  return {
    workerPath: path.join(basePath, 'node_modules', 'tesseract.js', 'dist', 'worker.min.js'),
    corePath: path.join(basePath, 'node_modules', 'tesseract.js-core', 'tesseract-core.wasm.js'),
    langPath: 'https://tessdata.projectnaptha.com/4.0.0',
  };
};

// 1. Upload image buffer to Cloudinary
export const uploadToCloudinary = (buffer, folder = "products", resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: resourceType }, (err, result) => {
      if (result) resolve(result);
      else reject(err);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// 2. Robust CSV Parser
export const parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    streamifier.createReadStream(buffer)
      .pipe(csv({
        separator: ',',
        // Aggressively clean headers (removes BOM, quotes, and whitespace)
        mapHeaders: ({ header }) => header.replace(/^\uFEFF/g, '').trim().replace(/^["']|["']$/g, '')
      }))
      .on("data", (data) => {
        // Clean each value in the row
        const cleanedRow = {};
        Object.keys(data).forEach(key => {
          cleanedRow[key.trim()] = data[key] ? data[key].trim() : "";
        });

        // Only add if there is a name (prevents empty row insertion)
        if (cleanedRow.name) {
          results.push(cleanedRow);
        }
      })
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
};

export const extractTextFromPdfBuffer = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    return data?.text?.trim() || '';
  } catch (error) {
    console.error('PDF text extraction failed:', error);
    return '';
  }
};

export const extractTextFromImageBuffer = async (buffer) => {
  const config = getTesseractConfig();
  const worker = createWorker({
    ...config,
    logger: (message) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[TESSERACT]', message);
      }
    },
  });

  try {
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data } = await worker.recognize(buffer);
    return data?.text?.trim() || '';
  } catch (error) {
    console.error('Tesseract OCR failed:', error);
    return '';
  } finally {
    try {
      await worker.terminate();
    } catch (terminateError) {
      console.warn('Unable to terminate Tesseract worker:', terminateError?.message || terminateError);
    }
  }
};

export const extractTextFromBuffer = async (buffer, mimeType) => {
  if (mimeType === 'application/pdf') {
    return extractTextFromPdfBuffer(buffer);
  }
  return extractTextFromImageBuffer(buffer);
};

// 3. Robust Excel Parser
export const parseExcel = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // sheet_to_json handles headers well, but we use defval to avoid undefined fields
  return XLSX.utils.sheet_to_json(worksheet, { 
    defval: "", 
    raw: false 
  });
};