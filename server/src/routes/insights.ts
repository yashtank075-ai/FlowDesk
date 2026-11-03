import { Router } from 'express';
import { InsightsController } from '../controllers/insightsController.js';

const router = Router();

// GET /api/insights (Calculated AI business metrics, attention items, pipeline scores, and recommendations)
router.get('/', InsightsController.getInsights);

export default router;

