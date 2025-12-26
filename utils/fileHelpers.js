import csv from "csv-parser";
import XLSX from "xlsx";
import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";

// 1. Upload image buffer to Cloudinary
export const uploadToCloudinary = (buffer, folder = "products") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
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