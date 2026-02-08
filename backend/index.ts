import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { initStore } from './lib/store';
import healthRoutes from './routes/health';
import apiRoutes from './routes/api';
import scanRoutes from './routes/scan';

dotenv.config({ path: path.join(__dirname, '.env') });

initStore();

const app = express();
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 5001;

app.use('/health', healthRoutes);
app.use('/api', apiRoutes);
app.use('/api', scanRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
