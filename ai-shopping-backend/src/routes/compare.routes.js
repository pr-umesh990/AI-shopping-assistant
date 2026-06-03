import { Router } from 'express';
import { compare, getAiVerdict } from '../controllers/compare.controller.js';

const router = Router();

router.get('/', compare);
router.get('/ai-verdict', getAiVerdict);

export default router;
