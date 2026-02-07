import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

// Test route
app.get('/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

// Post route for the scan
app.post('/api/analyze', async (req, res) => {
  const text = req.body?.text;
  // Here is where you will call OpenRouter
  // Then return the D3 data structure
  res.json({
    message: "Data received",
    nodes: [],
    links: [],
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});