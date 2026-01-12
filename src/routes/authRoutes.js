import express from "express";
const router = express.Router();

// Changed: Use default import for authController
import authController from "../controllers/authController.js";

// Changed: Use named imports for middleware to match the 'export { ... }' in auth.js
import { authenticateToken, isAdmin } from "../middleware/auth.js";
import {
  registerValidation,
  loginValidation,
} from "../middleware/validators.js";

// Public routes
router.post("/login", loginValidation, authController.login);

// Protected routes (require authentication)
router.get("/profile", authenticateToken, authController.getProfile);
router.post("/logout", authenticateToken, authController.logout);
router.post(
  "/change-password",
  authenticateToken,
  authController.changePassword
);

// Admin only routes
router.post(
  "/register",
  authenticateToken,
  isAdmin,
  registerValidation,
  authController.register
);

export default router;
