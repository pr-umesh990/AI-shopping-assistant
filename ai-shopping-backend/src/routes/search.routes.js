import { Router } from 'express';
import { search, getAiSummary, getSuggestions } from '../controllers/search.controller.js';
import { searchLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.post('/', searchLimiter, search);
router.get('/ai-summary', getAiSummary);
router.get('/suggestions', getSuggestions);

export default router;
