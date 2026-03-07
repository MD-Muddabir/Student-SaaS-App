/**
 * Exam Routes
 */

const express = require("express");
const router = express.Router();
const examController = require("../controllers/exam.controller");
const verifyToken = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

router.post("/", verifyToken, allowRoles("admin", "faculty"), examController.createExam);
router.get("/", verifyToken, allowRoles("admin", "faculty"), examController.getAllExams);
router.post("/marks", verifyToken, allowRoles("admin", "faculty"), examController.enterMarks);
router.get("/:exam_id/marks", verifyToken, allowRoles("admin", "faculty"), examController.getExamMarks);
router.get("/results/:student_id", verifyToken, allowRoles("admin", "faculty", "student"), examController.getStudentResults);
router.delete("/:id", verifyToken, allowRoles("admin", "manager"), examController.deleteExam);

module.exports = router;
