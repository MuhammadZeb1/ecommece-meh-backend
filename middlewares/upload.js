import multer from "multer";

// Store files in memory
const storage = multer.memoryStorage();

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/csv', // ALLOW CSV
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // ALLOW XLSX
  'application/vnd.ms-excel' // ALLOW XLS
];

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    // Check by mimetype OR by file extension
    const isAllowed = allowedMimeTypes.includes(file.mimetype) || 
                     /\.(csv|xlsx|xls)$/i.test(file.originalname);
    
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDF, CSV, and Excel are allowed.'));
    }
  },
});


export default upload;
