import express from 'express';
const router = express.Router();
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;
