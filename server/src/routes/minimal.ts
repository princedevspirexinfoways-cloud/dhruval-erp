import { Router } from 'express';

const router = Router();

// Minimal test route
router.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

export default router;

