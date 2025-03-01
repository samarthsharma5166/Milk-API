"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const transeciton_controller_1 = require("../controller/transeciton.controller");
const router = (0, express_1.Router)();
router.get('/getTransection', authMiddleware_1.authMiddleware, authMiddleware_1.isValidUser, transeciton_controller_1.getAllTransection);
router.get('/getTransection/:id', authMiddleware_1.authMiddleware, transeciton_controller_1.getAllTransection);
exports.default = router;
