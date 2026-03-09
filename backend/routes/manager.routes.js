const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");
const ctrl = require("../controllers/manager.controller");

// Manager dashboard stats (safe – no revenue/profit)
router.get(
    "/stats",
    verifyToken,
    allowRoles("admin", "manager"),
    ctrl.getManagerDashboardStats
);

module.exports = router;
