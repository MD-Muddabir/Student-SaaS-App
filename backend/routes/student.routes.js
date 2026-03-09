const express = require("express");
const router = express.Router();
const studentController = require("../controllers/student.controller");
const verifyToken = require("../middlewares/auth.middleware");
const checkSubscription = require("../middlewares/subscription.middleware");
const allowRoles = require("../middlewares/role.middleware");
const { checkStudentLimit } = require("../middlewares/planLimits.middleware");
const checkManagerPermission = require("../middlewares/checkManagerPermission");


// All routes require authentication and valid subscription
router.use(verifyToken, checkSubscription);

// Stats Route (must be before :id)
router.get("/stats", allowRoles("super_admin", "admin", "faculty"), studentController.getStudentStats);

// CRUD Routes
// router.post("/", allowRoles("admin", "faculty"), studentController.createStudent);
router.get("/me", allowRoles("student"), studentController.getMe);
router.post("/", allowRoles("super_admin", "admin", "faculty", "manager"), checkManagerPermission("students.create"), checkStudentLimit, studentController.createStudent);

router.get("/", allowRoles("super_admin", "admin", "faculty", "manager"), checkManagerPermission("students.read", ["fees", "attendance", "reports"]), studentController.getAllStudents);
router.get("/:id", allowRoles("super_admin", "admin", "faculty", "student", "manager"), checkManagerPermission("students.read", ["fees", "attendance", "reports"]), studentController.getStudentById);
router.put("/:id", allowRoles("super_admin", "admin", "faculty", "student", "manager"), checkManagerPermission("students.update"), studentController.updateStudent);
router.delete("/:id", allowRoles("super_admin", "admin", "manager"), checkManagerPermission("students.delete"), studentController.deleteStudent);

module.exports = router;
