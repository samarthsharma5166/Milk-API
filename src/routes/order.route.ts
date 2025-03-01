import { Router } from "express";
import { authMiddleware, isValidUser } from "../middleware/authMiddleware";
import { confirmOrder, getAllOrder, getMyOrder, getSubscribedOrder, updateOrder } from "../controller/order.controller";
const router = Router();


router.post('/confirm/:productId',authMiddleware,confirmOrder)

router.get('/subscribed',authMiddleware,getSubscribedOrder)

// update subscribed order
router.put('/update/:id',authMiddleware,updateOrder)

// get user order
router.get('/getMyOrder',authMiddleware,getMyOrder)

router.get("/getOrder", authMiddleware, getAllOrder);

export default router;