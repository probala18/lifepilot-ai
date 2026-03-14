import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import apiRoutes from './server/routes/api.js';
import authRoutes from './server/routes/auth.js';
import { requireAuth } from './server/middleware/requireAuth.js';
import { initDatabase } from './server/db/database.js';
import { startReminderCron } from './server/cron/reminderCron.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite database (creates tables if needed)
  initDatabase();

  // Middleware
  app.use(express.json());
  app.use(cookieParser());

  // Auth routes are public – no session required
  app.use('/api/auth', authRoutes);

  // All other AI routes require a valid session
  app.use('/api', requireAuth, apiRoutes);

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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    startReminderCron();
  });
}

startServer();
