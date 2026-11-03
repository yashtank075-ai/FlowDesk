import { Router } from 'express';
import { SearchController } from '../controllers/searchController.js';

const router = Router();

// GET /api/search?q=query&type=all|leads|customers|enquiries|follow-ups&limit=5
router.get('/', SearchController.search);

export default router;
