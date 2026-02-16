const express = require("express");
const router = express.Router();
const studentController = require("../controllers/student.controller");
const verifyToken = require("../middlewares/auth.middleware");
const checkSubscription = require("../middlewares/subscription.middleware");
const allowRoles = require("../middlewares/role.middleware");

// All routes require authentication and valid subscription
router.use(verifyToken, checkSubscription);

// Stats Route (must be before :id)
router.get("/stats", allowRoles("admin", "faculty"), studentController.getStudentStats);

// CRUD Routes
router.post("/", allowRoles("admin", "faculty"), studentController.createStudent);
router.get("/", allowRoles("admin", "faculty"), studentController.getAllStudents);
router.get("/:id", allowRoles("admin", "faculty", "student"), studentController.getStudentById);
router.put("/:id", allowRoles("admin", "faculty"), studentController.updateStudent);
router.delete("/:id", allowRoles("admin"), studentController.deleteStudent);

module.exports = router;
