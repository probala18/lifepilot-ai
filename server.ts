import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import apiRoutes from './server/routes/api.js';
import authRoutes from './server/routes/auth.js';
import { initDatabase } from './server/db/database.js';
import { startReminderCron } from './server/cron/reminderCron.js';

async function startServer() {
  const app = express();
  const preferredPort = Number(process.env.PORT || 3000);
  const host = '0.0.0.0';

  // Initialize SQLite database (creates tables if needed)
  initDatabase();

  // Middleware
  app.use(express.json());
  app.use(cookieParser());

  // Attach default local user so tasks and assistant requests work without login
  app.use((req: any, _res, next) => {
    req.user = {
      sub: 'local_user',
      email: 'user@lifepilot.local',
      name: 'LifePilot User',
    };
    next();
  });

  // Auth routes (optional, backwards compatibility)
  app.use('/api/auth', authRoutes);

  // All AI and task routes completely open
  app.use('/api', apiRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    app.use(express.static('dist'));
  }

  const listenWithFallback = (port: number): void => {
    const server = app.listen(port, host, () => {
      console.log(`Server running on http://localhost:${port}`);
      startReminderCron();
    });

    server.on('error', (err: any) => {
      if (err?.code === 'EADDRINUSE') {
        console.warn(`[server] Port ${port} is busy. Retrying on ${port + 1}...`);
        listenWithFallback(port + 1);
        return;
      }

      console.error('[server] Failed to start server:', err);
      process.exit(1);
    });
  };

  listenWithFallback(preferredPort);
}

startServer();
