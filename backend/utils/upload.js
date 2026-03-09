const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "..", "uploads", "notes");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, "note-" + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter based on allowed types
const allowedTypes = [
    "application/pdf", // PDF
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
    "application/msword", // DOC
    "application/vnd.ms-powerpoint", // PPT
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PPTX
    "image/jpeg", // JPEG
    "image/png", // PNG
    "image/jpg", // JPG
    "application/zip", // ZIP
    "application/x-zip-compressed" // ZIP alternative
];

const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only PDF, DOCX, PPT, IMAGE, and ZIP are allowed."), false);
    }
};

// Multer upload instance
const uploadNote = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20 MB max file size
    },
    fileFilter: fileFilter
});

module.exports = {
    uploadNote
};
