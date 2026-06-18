import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();
// ✅ FIXED: Use lazy instantiation instead of immediate instantiation
// This prevents the controller from being created when the module is imported

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/v1/production-dashboard
 * @desc    Get production dashboard by company
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionDashboardController } = await import('../../controllers/ProductionDashboardController');
    const productionDashboardController = new ProductionDashboardController();
    await productionDashboardController.getDashboardByCompany(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/production-dashboard
 * @desc    Create new production dashboard
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionDashboardController } = await import('../../controllers/ProductionDashboardController');
    const productionDashboardController = new ProductionDashboardController();
    await productionDashboardController.createDashboard(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/production-dashboard/machine/:machineId
 * @desc    Get machine status from dashboard
 * @access  Private
 */
router.get('/machine/:machineId', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionDashboardController } = await import('../../controllers/ProductionDashboardController');
    const productionDashboardController = new ProductionDashboardController();
    await productionDashboardController.getMachineStatus(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/production-dashboard/machine/:machineId
 * @desc    Update machine status in dashboard
 * @access  Private
 */
router.put('/machine/:machineId', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionDashboardController } = await import('../../controllers/ProductionDashboardController');
    const productionDashboardController = new ProductionDashboardController();
    await productionDashboardController.updateMachineStatus(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/production-dashboard/daily-summary
 * @desc    Get daily production summary
 * @access  Private
 */
router.get('/daily-summary', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionDashboardController } = await import('../../controllers/ProductionDashboardController');
    const productionDashboardController = new ProductionDashboardController();
    await productionDashboardController.getDailySummary(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/production-dashboard/daily-summary
 * @desc    Add daily production summary
 * @access  Private
 */
router.post('/daily-summary', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionDashboardController } = await import('../../controllers/ProductionDashboardController');
    const productionDashboardController = new ProductionDashboardController();
    await productionDashboardController.addDailySummary(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/production-dashboard/printing-status
 * @desc    Get printing status for all machines
 * @access  Private
 */
router.get('/printing-status', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionDashboardController } = await import('../../controllers/ProductionDashboardController');
    const productionDashboardController = new ProductionDashboardController();
    await productionDashboardController.getPrintingStatus(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/production-dashboard/printing-status/:machineId
 * @desc    Update printing status for specific machine
 * @access  Private
 */
router.put('/printing-status/:machineId', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionDashboardController } = await import('../../controllers/ProductionDashboardController');
    const productionDashboardController = new ProductionDashboardController();
    await productionDashboardController.updatePrintingStatus(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/production-dashboard/alerts
 * @desc    Get active alerts
 * @access  Private
 */
router.get('/alerts', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionDashboardController } = await import('../../controllers/ProductionDashboardController');
    const productionDashboardController = new ProductionDashboardController();
    await productionDashboardController.getActiveAlerts(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/production-dashboard/alerts
 * @desc    Add new alert
 * @access  Private
 */
router.post('/alerts', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionDashboardController } = await import('../../controllers/ProductionDashboardController');
    const productionDashboardController = new ProductionDashboardController();
    await productionDashboardController.addAlert(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/production-dashboard/alerts/:alertIndex/acknowledge
 * @desc    Acknowledge alert
 * @access  Private
 */
router.put('/alerts/:alertIndex/acknowledge', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionDashboardController } = await import('../../controllers/ProductionDashboardController');
    const productionDashboardController = new ProductionDashboardController();
    await productionDashboardController.acknowledgeAlert(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/production-dashboard/alerts/:alertIndex/resolve
 * @desc    Resolve alert
 * @access  Private
 */
router.put('/alerts/:alertIndex/resolve', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionDashboardController } = await import('../../controllers/ProductionDashboardController');
    const productionDashboardController = new ProductionDashboardController();
    await productionDashboardController.resolveAlert(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/production-dashboard/performance
 * @desc    Get performance metrics
 * @access  Private
 */
router.get('/performance', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionDashboardController } = await import('../../controllers/ProductionDashboardController');
    const productionDashboardController = new ProductionDashboardController();
    await productionDashboardController.getPerformanceMetrics(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/production-dashboard/performance
 * @desc    Update performance metrics
 * @access  Private
 */
router.put('/performance', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionDashboardController } = await import('../../controllers/ProductionDashboardController');
    const productionDashboardController = new ProductionDashboardController();
    await productionDashboardController.updatePerformanceMetrics(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/production-dashboard/config
 * @desc    Get dashboard configuration
 * @access  Private
 */
router.get('/config', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionDashboardController } = await import('../../controllers/ProductionDashboardController');
    const productionDashboardController = new ProductionDashboardController();
    await productionDashboardController.getDashboardConfig(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/production-dashboard/config
 * @desc    Update dashboard configuration
 * @access  Private
 */
router.put('/config', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { ProductionDashboardController } = await import('../../controllers/ProductionDashboardController');
    const productionDashboardController = new ProductionDashboardController();
    await productionDashboardController.updateDashboardConfig(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;
