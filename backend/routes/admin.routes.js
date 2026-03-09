const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");
const adminController = require("../controllers/admin.controller");
const checkSubscription = require("../middlewares/subscription.middleware");

const { getUsageStats } = require("../middlewares/planLimits.middleware");

// Dashboard Stats
router.get(
    "/stats",
    verifyToken,
    checkSubscription,
    allowRoles("admin", "manager"),
    adminController.getDashboardStats
);

// Plan Usage Stats
router.get(
    "/usage",
    verifyToken,
    checkSubscription,
    allowRoles("admin", "manager"),
    getUsageStats
);

// --- Admin Management Routes ---

// Get all admins
router.get(
    "/admins",
    verifyToken,
    checkSubscription,
    allowRoles("admin"),
    adminController.getAllAdmins
);

// Create new admin
router.post(
    "/admins",
    verifyToken,
    checkSubscription,
    allowRoles("admin"),
    adminController.createAdmin
);

// Delete admin
router.delete(
    "/admins/:id",
    verifyToken,
    checkSubscription,
    allowRoles("admin"),
    adminController.deleteAdmin
);

// Update admin
router.put(
    "/admins/:id",
    verifyToken,
    checkSubscription,
    allowRoles("admin"),
    adminController.updateAdmin
);

module.exports = router;
