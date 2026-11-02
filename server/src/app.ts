import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { authenticateUser, requireWorkspace } from './middleware/auth.js';
import { resolveWorkspace } from './middleware/workspace.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import workspaceRouter from './routes/workspace.js';
import leadsRouter from './routes/leads.js';
import customersRouter from './routes/customers.js';
import enquiriesRouter from './routes/enquiries.js';
import followUpsRouter from './routes/followUps.js';

const app = express();

// Trust reverse proxies (such as Render / Cloudflare) to ensure accurate client IP and secure cookies
if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

// Security & Logging Middlewares
app.use(helmet());
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  })
);
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Public Health Check
app.use('/api/health', healthRouter);

// Authentication & Identity Routes
app.use('/api/auth', authRouter);

// Workspace & Team Management Routes
app.use('/api/workspace', workspaceRouter);

// Authenticated & Workspace-scoped Business Resource Routes
app.use('/api/leads', authenticateUser, requireWorkspace, resolveWorkspace, leadsRouter);
app.use('/api/customers', authenticateUser, requireWorkspace, resolveWorkspace, customersRouter);
app.use('/api/enquiries', authenticateUser, requireWorkspace, resolveWorkspace, enquiriesRouter);
app.use('/api/follow-ups', authenticateUser, requireWorkspace, resolveWorkspace, followUpsRouter);

// Centralized 404 & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

