"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const product_controller_1 = require("../controller/product.controller");
const router = (0, express_1.Router)();
// route to create product only admin and manger
router.post("/create", authMiddleware_1.authMiddleware, authMiddleware_1.isValidUser, product_controller_1.createProduct);
// route to get products all users
router.get('/get', product_controller_1.getProducts);
// get product by Id
router.get('/get/:id', authMiddleware_1.authMiddleware, product_controller_1.getProductsById);
// update product only admin and manger
router.put('/update/:id', authMiddleware_1.authMiddleware, authMiddleware_1.isValidUser, product_controller_1.updateProduct);
// delete product only admin and manger
router.delete('/delete/:id', authMiddleware_1.authMiddleware, authMiddleware_1.isValidUser, product_controller_1.deleteProduct);
// product router 
router.get('/search', authMiddleware_1.authMiddleware, product_controller_1.searchProducts);
exports.default = router;
