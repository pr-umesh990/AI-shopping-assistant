import { Router } from 'express';
import { trackClick } from '../controllers/affiliate.controller.js';

const router = Router();

router.post('/click', trackClick);

export default router;
