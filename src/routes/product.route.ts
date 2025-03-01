import { Router } from "express";
import { authMiddleware, isValidUser } from "../middleware/authMiddleware";
import { createProduct, deleteProduct, getProducts, getProductsById, searchProducts, updateProduct } from "../controller/product.controller";
const router = Router();

// route to create product only admin and manger
router.post("/create", authMiddleware,isValidUser,createProduct);
// route to get products all users
router.get('/get',getProducts)
// get product by Id
router.get('/get/:id',authMiddleware,getProductsById)
// update product only admin and manger
router.put('/update/:id',authMiddleware,isValidUser,updateProduct)
// delete product only admin and manger
router.delete('/delete/:id',authMiddleware,isValidUser,deleteProduct)
// product router 
router.get('/search',authMiddleware,searchProducts)

export default router






