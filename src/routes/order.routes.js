import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  assignOrder,
  updateOrderStatus,
  markDelivered,
  initiateRTO,
  markRTOReceived,
  deleteOrder,
} from "../controllers/order.controller.js";
import { protect } from "../middleware/auth.js";
// import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.use(protect);

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);

router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/deliver", markDelivered);

// router.post("/:id/assign", authorize("admin"), assignOrder);
router.post("/:id/rto", initiateRTO);
// router.patch("/:id/rto/received", authorize("admin"), markRTOReceived);

// router.delete("/:id", authorize("admin"), deleteOrder);

export default router;
