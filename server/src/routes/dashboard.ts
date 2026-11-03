import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController.js';

const router = Router();

// GET /api/dashboard/summary (Real PostgreSQL metrics, distribution, activities, upcoming tasks)
router.get('/summary', AnalyticsController.getDashboardSummary);

// GET /api/dashboard/lead-acquisition-velocity?period=7d|30d|90d|6m
router.get('/lead-acquisition-velocity', AnalyticsController.getLeadAcquisitionVelocity);

export default router;
