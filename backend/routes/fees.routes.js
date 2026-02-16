/**
 * Fees Routes
 */

const express = require("express");
const router = express.Router();
const feesController = require("../controllers/fees.controller");
const verifyToken = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

router.post("/structure", verifyToken, allowRoles("admin"), feesController.createFeeStructure);
router.get("/structure", verifyToken, allowRoles("admin", "faculty"), feesController.getAllFeeStructures);
router.post("/pay", verifyToken, allowRoles("admin"), feesController.recordPayment);
router.get("/payments", verifyToken, allowRoles("admin"), feesController.getAllPayments);
router.get("/payment/:student_id", verifyToken, allowRoles("admin", "faculty", "student"), feesController.getStudentPayments);

module.exports = router;
