import { Router } from "express";
import { changeDeliveryForOrderItem, confirmDelivery, deleteDeliveryPerson, deliveryPersonLogin, deliveryPersonSingUp, getAllDeliveryPerson, getAssignedDeliveries, getDeliverPerson, pickDeliveries, sendDeliveryOtp, shiftDelivery } from "../controller/deliveryPerson.controller";
import { authMiddleware, isValidUser } from "../middleware/authMiddleware";

const router = Router();


router.post('/signup',deliveryPersonSingUp);
router.post('/login',deliveryPersonLogin);
router.get('/me',authMiddleware,getDeliverPerson);
router.get("/deliveries/:deliveryPersonId", getAssignedDeliveries);
router.put("/pickedUp/:orderId/:deliveryId",authMiddleware, pickDeliveries);
router.put("/delivered/:orderId/:deliveryId",authMiddleware, pickDeliveries);
router.put("/delivered/otp/:orderId/:deliveryId",authMiddleware, sendDeliveryOtp);
router.put("/delivered/confirm/:orderId/:deliveryId",authMiddleware, confirmDelivery);
router.get("/getDeliveryPersons",authMiddleware,isValidUser,getAllDeliveryPerson);

router.put("/shift-delivery/:deliveryId/:newDeliveryPersonId",authMiddleware,shiftDelivery);
router.delete("/delete-delivery-person/:deliveryPersonId",authMiddleware,isValidUser,deleteDeliveryPerson);
router.put("/change-delivery/:orderItemId/:newDeliveryPersonId",authMiddleware,changeDeliveryForOrderItem);

export default router;