/**
 * Public Site Routes
 * No authentication required — served publicly
 */

const express = require("express");
const router = express.Router();
const publicSiteController = require("../controllers/publicSite.controller");

// GET /api/public/:slug  — Get all public page data
router.get("/:slug", publicSiteController.getPublicPageData);

// POST /api/public/:slug/enquiry  — Submit enquiry form
router.post("/:slug/enquiry", publicSiteController.submitEnquiry);

module.exports = router;
