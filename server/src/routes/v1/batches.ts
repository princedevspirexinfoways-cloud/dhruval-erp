import { Router } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth';
import { ProductionBatchController } from '../../controllers/ProductionBatchController';
import { BatchController } from '../../controllers/BatchController';

const router = Router();
const batchController = new BatchController();

// =============================================
// PRODUCTION BATCH OPERATIONS
// =============================================

// Test endpoint
router.get('/test', ProductionBatchController.testEndpoint);

// Get all production batches (for super admin) or company-specific batches
router.get('/',
  authenticate,
  requirePermission('inventory', 'batchManagement'),
  ProductionBatchController.getBatches
);

// Get all batches with stage management (super admin only)
router.get('/all-with-stages',
  authenticate,
  requirePermission('inventory', 'batchManagement'),
  ProductionBatchController.getAllBatchesWithStages
);

// Get all production batches for a specific company
router.get('/company/:companyId',
  authenticate,
  requirePermission('inventory', 'batchManagement'),
  ProductionBatchController.getBatches
);

// Get batch by ID
router.get('/:batchId',
  authenticate,
  requirePermission('inventory', 'batchManagement'),
  ProductionBatchController.getBatchById
);

// Create new production batch with material consumption
router.post('/',
  authenticate,
  requirePermission('inventory', 'batchManagement'),
  ProductionBatchController.createBatch
);

// Update batch status and progress
router.put('/:batchId',
  authenticate,
  requirePermission('inventory', 'batchManagement'),
  ProductionBatchController.updateBatch
);

// Update stage status
router.put('/:batchId/stages/:stageNumber/status',
  authenticate,
  requirePermission('production', 'stageManagement'),
  ProductionBatchController.updateStageStatus
);

// Update stage status (PATCH method for frontend compatibility)
router.patch('/:batchId/stages/:stageNumber/status',
  authenticate,
  requirePermission('production', 'stageManagement'),
  ProductionBatchController.updateStageStatus
);

// Bulk stage management (super admin only)
router.put('/bulk-stages',
  authenticate,
  requirePermission('production', 'stageManagement'),
  ProductionBatchController.bulkUpdateStages
);

// Add material consumption to a stage
router.post('/:batchId/stages/:stageNumber/consume-materials',
  authenticate,
  requirePermission('production', 'materialConsumption'),
  ProductionBatchController.consumeMaterial
);

// Record stage output
router.post('/:batchId/stages/:stageNumber/output',
  authenticate,
  requirePermission('production', 'stageManagement'),
  ProductionBatchController.addMaterialOutput
);

// Add quality check to a stage
router.post('/:batchId/stages/:stageNumber/quality-check',
  authenticate,
  requirePermission('production', 'qualityControl'),
  ProductionBatchController.addQualityCheck
);

// Pass quality gate
router.post('/:batchId/stages/:stageNumber/pass-quality',
  authenticate,
  requirePermission('production', 'qualityControl'),
  ProductionBatchController.passQualityGate
);

// Fail quality gate
router.post('/:batchId/stages/:stageNumber/fail-quality',
  authenticate,
  requirePermission('production', 'qualityControl'),
  ProductionBatchController.failQualityGate
);

// Get batch metrics and analytics
router.get('/:batchId/metrics',
  authenticate,
  requirePermission('inventory', 'batchManagement'),
  ProductionBatchController.getBatchMetrics
);

// Add cost to batch
router.post('/:batchId/costs',
  authenticate,
  requirePermission('production', 'costManagement'),
  ProductionBatchController.addCost
);

// Delete batch
router.delete('/:batchId',
  authenticate,
  requirePermission('inventory', 'batchManagement'),
  ProductionBatchController.deleteBatch
);

// Get batch dashboard
router.get('/dashboard/:companyId',
  authenticate,
  requirePermission('inventory', 'batchReports'),
  ProductionBatchController.getBatchDashboard
);

// =============================================
// INVENTORY BATCH OPERATIONS (Raw Material Batches)
// =============================================

// Get all inventory batches
router.get('/inventory/all',
  authenticate,
  requirePermission('inventory', 'batchManagement'),
  batchController.getAllBatches.bind(batchController)
);

// Create inventory batch
router.post('/inventory',
  authenticate,
  requirePermission('inventory', 'batchManagement'),
  batchController.createBatch.bind(batchController)
);

// Get inventory batch by ID
router.get('/inventory/:id',
  authenticate,
  requirePermission('inventory', 'batchManagement'),
  batchController.getBatchById.bind(batchController)
);

// Update inventory batch
router.put('/inventory/:id',
  authenticate,
  requirePermission('inventory', 'batchManagement'),
  batchController.updateBatch.bind(batchController)
);

// Material consumption routes
router.post('/:batchId/stages/:stageNumber/consume-materials', ProductionBatchController.consumeMaterial);
router.post('/:batchId/stages/:stageNumber/add-output', ProductionBatchController.addMaterialOutput);

// Working inventory routes
router.post('/:batchId/transfer-to-working-inventory', async (req, res) => {
  try {
    const { WorkingInventoryService } = await import('../../services/WorkingInventoryService');
    const workingInventoryService = new WorkingInventoryService();

    const result = await workingInventoryService.transferToWorkingInventory({
      batchId: req.params.batchId,
      materialInputs: req.body.materialInputs,
      transferredBy: (req as any).user?.userId || (req as any).user?.id
    });

    res.json({
      message: 'Materials transferred to working inventory successfully',
      workingInventoryItemIds: result
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error transferring to working inventory',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
