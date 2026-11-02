import app from './app.js';
import { config } from './config/index.js';
import { prisma } from './config/prisma.js';

const server = app.listen(config.port, () => {
  console.log(`[FlowDesk AI Server] Listening on http://localhost:${config.port}`);
  console.log(`[Environment] Mode: ${config.nodeEnv} | CORS Origin: ${config.clientOrigin}`);
  console.log(`[Demo Workspace] Scoped ID: ${config.demoWorkspaceId}`);
});

const gracefulShutdown = async (signal: string) => {
  console.log(`[FlowDesk AI Server] ${signal} signal received: closing HTTP server and database pool...`);
  server.close(async () => {
    console.log('[FlowDesk AI Server] HTTP server closed');
    try {
      await prisma.$disconnect();
      console.log('[FlowDesk AI Server] Database connections closed cleanly');
      process.exit(0);
    } catch (err) {
      console.error('[FlowDesk AI Server] Error during database disconnect:', err);
      process.exit(1);
    }
  });

  // Force shutdown after 10s if graceful closure hangs
  setTimeout(() => {
    console.error('[FlowDesk AI Server] Graceful shutdown timed out, force terminating');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

