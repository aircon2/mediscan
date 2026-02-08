import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ status: 'Backend is running' });
});

export default router;
