"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const order_controller_1 = require("../controller/order.controller");
const router = (0, express_1.Router)();
router.post('/confirm/:productId', authMiddleware_1.authMiddleware, order_controller_1.confirmOrder);
router.get('/subscribed', authMiddleware_1.authMiddleware, order_controller_1.getSubscribedOrder);
// update subscribed order
router.put('/update/:id', authMiddleware_1.authMiddleware, order_controller_1.updateOrder);
// get user order
router.get('/getMyOrder', authMiddleware_1.authMiddleware, order_controller_1.getMyOrder);
router.get("/getOrder", authMiddleware_1.authMiddleware, order_controller_1.getAllOrder);
exports.default = router;
