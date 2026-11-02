import { Router } from 'express';
import { prisma } from '../config/prisma.js';

const router = Router();

router.get('/', async (_req, res) => {
  let dbStatus = 'disconnected';
  let latencyMs = 0;

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    latencyMs = Date.now() - start;
    dbStatus = 'connected';
  } catch (error: any) {
    dbStatus = `error: ${error.message || 'connection failed'}`;
  }

  const isHealthy = dbStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      api: 'operational',
      database: dbStatus,
      latency: `${latencyMs}ms`,
    },
    version: '1.0.0-phase2',
  });
});

export default router;

