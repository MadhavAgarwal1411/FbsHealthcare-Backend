import express from 'express';
const router = express.Router();
import userController from "../controllers/userController.js";
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { updateUserValidation } from '../middleware/validators.js';

// All routes require authentication and admin role
router.use(authenticateToken, isAdmin);

// User management routes
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', updateUserValidation, userController.updateUser);
router.delete('/:id', userController.deleteUser);

// User login history
router.get('/:id/login-history', userController.getUserLoginHistory);

// Reset user password
router.post('/:id/reset-password', userController.resetUserPassword);

export default router;
