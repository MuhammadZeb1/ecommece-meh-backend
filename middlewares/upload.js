import multer from "multer";

// Store files in memory
const storage = multer.memoryStorage();

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    // Check by mimetype OR file extension
    const isAllowed =
      allowedMimeTypes.includes(file.mimetype) ||
      /\.(csv|xlsx|xls)$/i.test(file.originalname);

    if (isAllowed) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only images, PDF, CSV, and Excel files are allowed."
        )
      );
    }
  },
});

export default upload;