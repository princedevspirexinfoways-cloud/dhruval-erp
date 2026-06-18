import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();
// ✅ FIXED: Use lazy instantiation instead of immediate instantiation
// This prevents the controller from being created when the module is imported

// Apply authentication to all routes
router.use(authenticate);

// Batch CRUD operations
router.post('/', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionBatchController } = await import('../controllers/ProductionBatchController');
    await ProductionBatchController.createBatch(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
router.get('/company/:companyId', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionBatchController } = await import('../controllers/ProductionBatchController');
    await ProductionBatchController.getBatches(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
router.get('/:batchId', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionBatchController } = await import('../controllers/ProductionBatchController');
    await ProductionBatchController.getBatchById(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
router.put('/:batchId', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionBatchController } = await import('../controllers/ProductionBatchController');
    await ProductionBatchController.updateBatch(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
router.delete('/:batchId', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionBatchController } = await import('../controllers/ProductionBatchController');
    await ProductionBatchController.deleteBatch(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Batch dashboard
router.get('/company/:companyId/dashboard', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionBatchController } = await import('../controllers/ProductionBatchController');
    await ProductionBatchController.getBatchDashboard(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Stage management
router.put('/:batchId/stage/:stageNumber/status', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionBatchController } = await import('../controllers/ProductionBatchController');
    await ProductionBatchController.updateStageStatus(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Material management
router.post('/:batchId/stage/:stageNumber/consume-material', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionBatchController } = await import('../controllers/ProductionBatchController');
    await ProductionBatchController.consumeMaterial(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
router.post('/:batchId/stage/:stageNumber/material-output', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionBatchController } = await import('../controllers/ProductionBatchController');
    await ProductionBatchController.addMaterialOutput(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Quality management
router.post('/:batchId/stage/:stageNumber/quality-check', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionBatchController } = await import('../controllers/ProductionBatchController');
    await ProductionBatchController.addQualityCheck(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
router.post('/:batchId/stage/:stageNumber/quality-gate/pass', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionBatchController } = await import('../controllers/ProductionBatchController');
    await ProductionBatchController.passQualityGate(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
router.post('/:batchId/stage/:stageNumber/quality-gate/fail', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionBatchController } = await import('../controllers/ProductionBatchController');
    await ProductionBatchController.failQualityGate(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Cost management
router.post('/:batchId/cost', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionBatchController } = await import('../controllers/ProductionBatchController');
    await ProductionBatchController.addCost(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Analytics and metrics
router.get('/:batchId/metrics', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionBatchController } = await import('../controllers/ProductionBatchController');
    await ProductionBatchController.getBatchMetrics(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;
