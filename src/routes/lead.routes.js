import express from "express";
import { createLead } from "../controllers/leadController.js";
import { authenticateToken, isAdmin } from "../middleware/auth.js";

const router = express.Router();

/**
 * @route   POST /api/leads/create
 * @desc    Create a new lead (Admin Only)
 * @access  Private/Admin
 */
router.post(
  "/create", 
  authenticateToken, 
  isAdmin,           
  createLead         
);

export default router;