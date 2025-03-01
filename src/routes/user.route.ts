import { Router } from "express";
import { addMoneyToWallet, deleteUser, getAllUser, logout, OtpSender, SignUp, updateAddress, updateStatus, userData, verifyOtp } from "../controller/user.controller";
import { authMiddleware, isValidUser } from "../middleware/authMiddleware";
import { getProductsById } from "../controller/product.controller";

const router = Router();
router.post("/signup",SignUp);
router.post("/otp", OtpSender);
router.post("/login",verifyOtp)
router.get("/me",authMiddleware,userData);
router.put('/updateAdress',authMiddleware,updateAddress);
router.put("/updateStatus", authMiddleware, updateStatus);
router.get("/getProduct", getProductsById);
router.get('/getAllUser',authMiddleware,isValidUser,getAllUser)
router.delete('/delete/:id',authMiddleware,isValidUser,deleteUser)
router.put("/addMoney", authMiddleware,isValidUser ,addMoneyToWallet);
router.get("/logout",authMiddleware,logout)

export default router;
