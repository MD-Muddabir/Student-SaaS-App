/**
 * Subject Routes
 */

const express = require("express");
const router = express.Router();
const subjectController = require("../controllers/subject.controller");
const verifyToken = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");
const checkManagerPermission = require("../middlewares/checkManagerPermission");


router.post("/", verifyToken, allowRoles("admin", "manager"), checkManagerPermission("subjects.create"), subjectController.createSubject);
router.get("/", verifyToken, allowRoles("admin", "faculty", "manager", "student"), checkManagerPermission("subjects.read"), subjectController.getAllSubjects);
router.get("/:id", verifyToken, allowRoles("admin", "faculty", "manager"), checkManagerPermission("subjects.read"), subjectController.getSubjectById);
router.put("/:id", verifyToken, allowRoles("admin", "manager"), checkManagerPermission("subjects.update"), subjectController.updateSubject);
router.delete("/:id", verifyToken, allowRoles("admin", "manager"), checkManagerPermission("subjects.delete"), subjectController.deleteSubject);

module.exports = router;
