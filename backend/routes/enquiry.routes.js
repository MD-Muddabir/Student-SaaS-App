/**
 * Admin Enquiries Routes (Public Page Inbox)
 */

const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth.middleware");
const publicPageController = require("../controllers/publicPage.controller");

router.use(verifyToken);

// GET  /api/admin/enquiries           — Get all enquiries for this institute
router.get("/", publicPageController.getEnquiries);

// PUT  /api/admin/enquiries/:id/status — Update enquiry status
router.put("/:id/status", publicPageController.updateEnquiryStatus);

module.exports = router;
