import 'dotenv/config';
import { createApp } from './app.js';
import { mountBusinessRoutes } from './routes/index.js';

const PORT = Number(process.env.PORT ?? 3300);

const app = createApp(mountBusinessRoutes);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
  });
}

export default app;
