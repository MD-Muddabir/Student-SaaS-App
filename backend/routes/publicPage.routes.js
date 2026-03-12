/**
 * Admin Public Page Routes
 * All routes protected by JWT auth
 * Requires active plan with public_page feature
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const verifyToken = require("../middlewares/auth.middleware");
const publicPageController = require("../controllers/publicPage.controller");

// ── Multer setup for local file uploads ──────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads', 'public');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `pub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only jpg, jpeg, png, webp files are allowed'), false);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ── All routes require authentication ────────────────────────────
router.use(verifyToken);

// Check if feature is available
router.get('/check-feature', publicPageController.checkPublicPageFeature);

// Main profile routes
router.get('/', publicPageController.getPublicPage);
router.post('/', upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'cover_photo', maxCount: 1 }
]), publicPageController.createOrUpdatePublicPage);
router.put('/', upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'cover_photo', maxCount: 1 }
]), publicPageController.createOrUpdatePublicPage);

// Publish/Unpublish
router.post('/publish', publicPageController.publishPage);
router.post('/unpublish', publicPageController.unpublishPage);

// Gallery
router.post('/gallery', upload.single('photo'), publicPageController.uploadGalleryPhoto);
router.delete('/gallery/:id', publicPageController.deleteGalleryPhoto);

// Reviews
router.post('/reviews', publicPageController.addReview);
router.put('/reviews/:id', publicPageController.updateReview);
router.delete('/reviews/:id', publicPageController.deleteReview);

// Data for wizard
router.get('/faculty', publicPageController.getFacultyList);
router.get('/subjects', publicPageController.getSubjectList);

module.exports = router;
