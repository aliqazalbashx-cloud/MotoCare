import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { authRouter } from './src/server/routes/auth.ts';
import { motorcyclesRouter } from './src/server/routes/motorcycles.ts';
import { servicesRouter } from './src/server/routes/services.ts';
import { schedulesRouter } from './src/server/routes/schedules.ts';
import { expensesRouter } from './src/server/routes/expenses.ts';
import { dashboardRouter } from './src/server/routes/dashboard.ts';
import { seedRouter, seedDemoUserAndData } from './src/server/routes/seed.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Mount API routers
  app.use('/api/auth', authRouter);
  app.use('/api/motorcycles', motorcyclesRouter);
  app.use('/api/services', servicesRouter);
  app.use('/api/schedules', schedulesRouter);
  app.use('/api/expenses', expensesRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/seed', seedRouter);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite middleware in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend build in production
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MotorCare server listening on http://0.0.0.0:${PORT}`);
  });

  // Automatically seed demo data on launch
  seedDemoUserAndData().catch((err) => {
    console.warn('Initial demo seed notice (non-fatal):', err.message);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
