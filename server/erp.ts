import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers';
import { ensureDatabase } from './db';

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/trpc', createExpressMiddleware({
  router: appRouter,
  createContext: () => ({})
}));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'gbm-erp', time: new Date().toISOString() }));

app.get('/api/bootstrap', async (_req, res) => {
  const bootstrap = await appRouter.createCaller({})(
    appRouter._def.procedures.bootstrap
  );
  res.json(bootstrap);
});

app.get('/api/settings', async (_req, res) => {
  const settings = await appRouter.createCaller({})('settings');
  res.json({ settings });
});

app.put('/api/settings', async (req, res) => {
  const result = await appRouter.createCaller({})('settingsUpdate', { input: req.body });
  res.json(result);
});

app.get('/api/products', async (_req, res) => {
  const products = await appRouter.createCaller({})('products');
  res.json({ products });
});

app.get('/api/documents', async (_req, res) => {
  const documents = await appRouter.createCaller({})('documents');
  res.json({ documents });
});

app.get('/api/reports', async (_req, res) => {
  const reports = await appRouter.createCaller({})('reports');
  res.json(reports);
});

async function start() {
  await ensureDatabase();
  app.listen(port, () => console.log(`GBM ERP running on http://localhost:${port}`));
}

start();
