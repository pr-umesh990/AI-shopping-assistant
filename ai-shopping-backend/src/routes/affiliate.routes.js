import { Router } from 'express';
import { trackClick } from '../controllers/affiliate.controller.js';
import { optionalProtect } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/click', optionalProtect, trackClick);

export default router;
