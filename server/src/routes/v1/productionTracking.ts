import { Router } from 'express';
import { ProductionTrackingController } from '../../controllers/ProductionTrackingController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const productionTrackingController = new ProductionTrackingController();

router.use(authenticate);

// Production Tracking Data
router.get('/tracking', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionTrackingController } = await import('../../controllers/ProductionTrackingController');
    const productionTrackingController = new ProductionTrackingController();
    await productionTrackingController.getProductionTrackingData(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Printing Status
router.get('/printing-status', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionTrackingController } = await import('../../controllers/ProductionTrackingController');
    const productionTrackingController = new ProductionTrackingController();
    await productionTrackingController.getPrintingStatus(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Job Work Tracking
router.get('/job-work-tracking', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionTrackingController } = await import('../../controllers/ProductionTrackingController');
    const productionTrackingController = new ProductionTrackingController();
    await productionTrackingController.getJobWorkTracking(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Process Tracking
router.get('/process-tracking', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionTrackingController } = await import('../../controllers/ProductionTrackingController');
    const productionTrackingController = new ProductionTrackingController();
    await productionTrackingController.getProcessTracking(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Production Summaries
router.get('/daily-summary', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionTrackingController } = await import('../../controllers/ProductionTrackingController');
    const productionTrackingController = new ProductionTrackingController();
    await productionTrackingController.getDailyProductionSummary(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
router.get('/machine-summary', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionTrackingController } = await import('../../controllers/ProductionTrackingController');
    const productionTrackingController = new ProductionTrackingController();
    await productionTrackingController.getMachineWiseSummary(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Production Management
router.patch('/update-status', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionTrackingController } = await import('../../controllers/ProductionTrackingController');
    const productionTrackingController = new ProductionTrackingController();
    await productionTrackingController.updateProductionStatus(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
router.post('/start-stage', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionTrackingController } = await import('../../controllers/ProductionTrackingController');
    const productionTrackingController = new ProductionTrackingController();
    await productionTrackingController.startProductionStage(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
router.post('/complete-stage', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionTrackingController } = await import('../../controllers/ProductionTrackingController');
    const productionTrackingController = new ProductionTrackingController();
    await productionTrackingController.completeProductionStage(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Efficiency and Analytics
router.get('/efficiency', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionTrackingController } = await import('../../controllers/ProductionTrackingController');
    const productionTrackingController = new ProductionTrackingController();
    await productionTrackingController.getProductionEfficiency(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Real-time Dashboard
router.get('/realtime-dashboard', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionTrackingController } = await import('../../controllers/ProductionTrackingController');
    const productionTrackingController = new ProductionTrackingController();
    await productionTrackingController.getRealTimeProductionDashboard(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;
