import { Router } from 'express';

const router = Router();

// Simple test route to prevent server hanging
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Visitor routes working',
    timestamp: new Date().toISOString()
  });
});

export default router;
