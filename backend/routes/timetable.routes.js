const express = require("express");
const router = express.Router();
const timetableController = require("../controllers/timetable.controller");
const verifyToken = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

// Slot Routes
router.post("/slots", verifyToken, allowRoles("admin"), timetableController.createSlot);
router.get("/slots", verifyToken, timetableController.getSlots);
router.delete("/slots/:id", verifyToken, allowRoles("admin"), timetableController.deleteSlot);

// Timetable Entry Routes
router.post("/", verifyToken, allowRoles("admin"), timetableController.createTimetableEntry);
router.put("/:id", verifyToken, allowRoles("admin"), timetableController.updateTimetableEntry);
router.delete("/:id", verifyToken, allowRoles("admin"), timetableController.deleteTimetableEntry);
router.get("/class/:class_id", verifyToken, timetableController.getTimetableByClass);
router.get("/faculty/:faculty_id", verifyToken, timetableController.getTimetableByFaculty);

module.exports = router;
