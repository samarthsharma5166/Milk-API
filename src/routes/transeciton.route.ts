import { Router } from "express";
import { authMiddleware, isValidUser } from "../middleware/authMiddleware";
import { getAllTransection, getMyTransection } from "../controller/transeciton.controller";

const router = Router();

router.get('/getTransection',authMiddleware,isValidUser,getAllTransection)
router.get("/getTransection/:id", authMiddleware, getMyTransection);

export default router;