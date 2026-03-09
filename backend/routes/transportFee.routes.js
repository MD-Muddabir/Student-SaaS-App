const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");
const checkManagerPermission = require("../middlewares/checkManagerPermission");
const ctrl = require("../controllers/transportFee.controller");

// All routes need auth + admin/manager role
router.get(
    "/",
    verifyToken,
    allowRoles("admin", "manager"),
    ctrl.getAllTransportFees
);

router.post(
    "/",
    verifyToken,
    allowRoles("admin", "manager"),
    checkManagerPermission("transport"),
    ctrl.createTransportFee
);

router.put(
    "/:id",
    verifyToken,
    allowRoles("admin", "manager"),
    checkManagerPermission("transport"),
    ctrl.updateTransportFee
);

router.delete(
    "/:id",
    verifyToken,
    allowRoles("admin", "manager"),
    checkManagerPermission("transport"),
    ctrl.deleteTransportFee
);

module.exports = router;
