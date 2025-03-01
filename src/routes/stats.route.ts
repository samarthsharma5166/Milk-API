import { Router } from "express";
import { orderStats, productStats, transectionStats, userStats } from "../controller/stats.controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();


router.get('/user',authMiddleware,userStats)
router.get('/order',authMiddleware,orderStats)
router.get('/transection',authMiddleware,transectionStats)
router.get('/products',authMiddleware,productStats)

export default router