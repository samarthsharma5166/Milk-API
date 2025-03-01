"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const zone_controller_1 = require("../controller/zone.controller");
const router = (0, express_1.Router)();
router.post("/create", authMiddleware_1.authMiddleware, authMiddleware_1.isValidUser, zone_controller_1.createZone);
router.get("/getAllZone", authMiddleware_1.authMiddleware, authMiddleware_1.isValidUser, zone_controller_1.getAllZones);
router.put("/update/:id", authMiddleware_1.authMiddleware, authMiddleware_1.isValidUser, zone_controller_1.updateZone);
router.delete("/delete/:id", authMiddleware_1.authMiddleware, authMiddleware_1.isValidUser, zone_controller_1.deleteZone);
router.put("/update/:deliveryPersonId/:zoneId", authMiddleware_1.authMiddleware, authMiddleware_1.isValidUser, zone_controller_1.assignUpdateZone);
exports.default = router;
