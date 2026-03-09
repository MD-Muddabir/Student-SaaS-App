const express = require("express");
const router = express.Router();
const parentController = require("../controllers/parent.controller");
const verifyToken = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

// Admin routes for parent management
router.post(
    "/",
    verifyToken,
    allowRoles("admin", "manager"),
    parentController.createParent
);

router.get(
    "/",
    verifyToken,
    allowRoles("admin", "manager"),
    parentController.getAllParents
);

// Parent Portal Routes
router.get(
    "/dashboard",
    verifyToken,
    allowRoles("parent"),
    parentController.getDashboard
);

router.get(
    "/student/:id",
    verifyToken,
    allowRoles("parent"),
    parentController.getStudentProfile
);

router.get(
    "/attendance/:studentId",
    verifyToken,
    allowRoles("parent"),
    parentController.getStudentAttendance
);

router.get(
    "/results/:studentId",
    verifyToken,
    allowRoles("parent"),
    parentController.getStudentResults
);

router.get(
    "/fees/:studentId",
    verifyToken,
    allowRoles("parent"),
    parentController.getStudentFees
);

router.get(
    "/notes/:classId",
    verifyToken,
    allowRoles("parent"),
    parentController.getNotes
);

module.exports = router;
