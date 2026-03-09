/**
 * Announcement Routes
 */

const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcement.controller");
const verifyToken = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

router.get("/unread-count", verifyToken, announcementController.getUnreadCount);
router.post("/viewed", verifyToken, announcementController.markAsViewed);
router.post("/", verifyToken, allowRoles("admin", "manager", "faculty"), announcementController.createAnnouncement);
router.get("/", verifyToken, announcementController.getAllAnnouncements);
router.delete("/:id", verifyToken, allowRoles("admin", "manager"), announcementController.deleteAnnouncement);

module.exports = router;
