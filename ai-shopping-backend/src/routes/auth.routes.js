import { Router } from 'express';
import { register, login, logout, getMe, updateMe } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);

export default router;
