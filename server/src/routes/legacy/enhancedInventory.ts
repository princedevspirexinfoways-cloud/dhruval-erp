import { Router } from 'express';
import { EnhancedInventoryController } from '@/controllers/EnhancedInventoryController';
import { BatchController } from '@/controllers/BatchController';
import { authenticate } from '@/middleware/auth';

const router = Router();
const enhancedInventoryController = new EnhancedInventoryController();
const batchController = new BatchController();

// Apply authentication to all routes
router.use(authenticate);

// Enhanced Inventory Routes
router.get('/summary',
  enhancedInventoryController.getInventorySummary.bind(enhancedInventoryController)
);

router.get('/product-summary',
  enhancedInventoryController.getProductSummary.bind(enhancedInventoryController)
);

router.get('/location-wise',
  enhancedInventoryController.getLocationWiseInventory.bind(enhancedInventoryController)
);

router.get('/ageing-analysis',
  enhancedInventoryController.getAgeingAnalysis.bind(enhancedInventoryController)
);

router.get('/advanced-search',
  enhancedInventoryController.advancedSearch.bind(enhancedInventoryController)
);

// Batch Management Routes
router.get('/batches',
  batchController.getAllBatches.bind(batchController)
);

router.get('/batches/:id',
  batchController.getBatchById.bind(batchController)
);

router.post('/batches',
  batchController.createBatch.bind(batchController)
);

router.put('/batches/:id',
  batchController.updateBatch.bind(batchController)
);

router.get('/batches/summary/by-stage',
  batchController.getBatchSummaryByStage.bind(batchController)
);

router.put('/batches/:id/process-stage',
  batchController.updateProcessStage.bind(batchController)
);

export default router;
