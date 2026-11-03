import { Router } from 'express';
import { ExportController } from '../controllers/exportController.js';

const router = Router();

// GET /api/export/:type?format=csv|pdf
// (leads, customers, enquiries, follow-ups, analytics)
router.get('/:type', ExportController.export);

export default router;

