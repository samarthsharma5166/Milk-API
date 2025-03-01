import { isValid } from "date-fns";
import { Router } from "express";
import { authMiddleware, isValidUser } from "../middleware/authMiddleware";
import { assignUpdateZone, createZone, deleteZone, getAllZones, updateZone } from "../controller/zone.controller";

const router = Router();

router.post("/create", authMiddleware,isValidUser,createZone);
router.get("/getAllZone", authMiddleware,isValidUser,getAllZones);
router.put("/update/:id", authMiddleware, isValidUser, updateZone);
router.delete("/delete/:id", authMiddleware, isValidUser,deleteZone);
router.put(
  "/update/:deliveryPersonId/:zoneId",
  authMiddleware,
  isValidUser,
  assignUpdateZone
);

export default router