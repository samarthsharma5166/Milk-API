"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const deliveryPerson_controller_1 = require("../controller/deliveryPerson.controller");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post('/signup', deliveryPerson_controller_1.deliveryPersonSingUp);
router.post('/login', deliveryPerson_controller_1.deliveryPersonLogin);
router.get('/me', authMiddleware_1.authMiddleware, deliveryPerson_controller_1.getDeliverPerson);
router.get("/deliveries/:deliveryPersonId", deliveryPerson_controller_1.getAssignedDeliveries);
router.put("/pickedUp/:orderId/:deliveryId", authMiddleware_1.authMiddleware, deliveryPerson_controller_1.pickDeliveries);
router.put("/delivered/:orderId/:deliveryId", authMiddleware_1.authMiddleware, deliveryPerson_controller_1.pickDeliveries);
router.put("/delivered/otp/:orderId/:deliveryId", authMiddleware_1.authMiddleware, deliveryPerson_controller_1.sendDeliveryOtp);
router.put("/delivered/confirm/:orderId/:deliveryId", authMiddleware_1.authMiddleware, deliveryPerson_controller_1.confirmDelivery);
// admin 
router.get("/getDeliveryPersons", authMiddleware_1.authMiddleware, authMiddleware_1.isValidUser, deliveryPerson_controller_1.getAllDeliveryPerson);
exports.default = router;
