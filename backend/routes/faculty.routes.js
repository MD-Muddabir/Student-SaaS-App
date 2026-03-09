/**
 * Faculty Routes
 * Defines API endpoints for faculty management
 */

const express = require("express");
const router = express.Router();
const facultyController = require("../controllers/faculty.controller");
const verifyToken = require("../middlewares/auth.middleware");
const checkSubscription = require("../middlewares/subscription.middleware");
const allowRoles = require("../middlewares/role.middleware");

/**
 * @route   POST /api/faculty
 * @desc    Create a new faculty member
 * @access  Admin only
 */
const { checkFacultyLimit } = require("../middlewares/planLimits.middleware");
const checkManagerPermission = require("../middlewares/checkManagerPermission");

router.get("/me", verifyToken, checkSubscription, allowRoles("faculty"), facultyController.getMe);
router.post("/", verifyToken, checkSubscription, allowRoles("admin", "manager"), checkManagerPermission("faculty.create"), checkFacultyLimit, facultyController.createFaculty);

/**
 * @route   GET /api/faculty
 * @desc    Get all faculty members with pagination and search
 * @access  Admin, Faculty
 */
router.get("/", verifyToken, checkSubscription, allowRoles("admin", "faculty", "manager"), checkManagerPermission("faculty.read"), facultyController.getAllFaculty);

/**
 * @route   GET /api/faculty/:id
 * @desc    Get faculty by ID
 * @access  Admin, Faculty (own record)
 */
router.get("/:id", verifyToken, checkSubscription, allowRoles("admin", "faculty", "manager"), checkManagerPermission("faculty.read"), facultyController.getFacultyById);

/**
 * @route   PUT /api/faculty/:id
 * @desc    Update faculty details
 * @access  Admin, Faculty (own record)
 */
router.put("/:id", verifyToken, checkSubscription, allowRoles("admin", "faculty", "manager"), checkManagerPermission("faculty.update"), facultyController.updateFaculty);

/**
 * @route   DELETE /api/faculty/:id
 * @desc    Delete faculty
 * @access  Admin only
 */
router.delete("/:id", verifyToken, checkSubscription, allowRoles("admin", "manager"), checkManagerPermission("faculty.delete"), facultyController.deleteFaculty);

module.exports = router;
