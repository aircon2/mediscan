import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { initStore } from './lib/store';
import healthRoutes from './routes/health';
import apiRoutes from './routes/api';

dotenv.config({ path: path.join(__dirname, '.env') });

initStore();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

app.use('/health', healthRoutes);
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
