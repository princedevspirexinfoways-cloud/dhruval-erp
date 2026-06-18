import { Router } from 'express';
import { authenticate } from '../middleware/auth';
// import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();
// ✅ FIXED: Use lazy instantiation instead of immediate instantiation
// This prevents the controller from being created when the module is imported

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route POST /api/production-flow/:productionOrderId/initialize
 * @desc Initialize production flow for an order
 * @access Private
 */
router.post(
  '/:productionOrderId/initialize',
  [
    param('productionOrderId').isMongoId().withMessage('Valid production order ID is required')
  ],
  // validateRequest,
  async (req, res) => {
    try {
      const { ProductionFlowController } = await import('../controllers/ProductionFlowController');
      const productionFlowController = new ProductionFlowController();
      await productionFlowController.initializeFlow(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/production-flow/:productionOrderId/stages/:stageNumber/start
 * @desc Start a production stage
 * @access Private
 */
router.post(
  '/:productionOrderId/stages/:stageNumber/start',
  [
    param('productionOrderId').isMongoId().withMessage('Valid production order ID is required'),
    param('stageNumber').isInt({ min: 1 }).withMessage('Valid stage number is required'),
    body('startedBy').optional().isMongoId().withMessage('Valid user ID is required')
  ],
  // validateRequest,
  async (req, res) => {
    try {
      const { ProductionFlowController } = await import('../controllers/ProductionFlowController');
      const productionFlowController = new ProductionFlowController();
      await productionFlowController.startStage(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/production-flow/:productionOrderId/stages/:stageNumber/complete
 * @desc Complete a production stage
 * @access Private
 */
router.post(
  '/:productionOrderId/stages/:stageNumber/complete',
  [
    param('productionOrderId').isMongoId().withMessage('Valid production order ID is required'),
    param('stageNumber').isInt({ min: 1 }).withMessage('Valid stage number is required'),
    body('actualQuantity').optional().isFloat({ min: 0 }).withMessage('Actual quantity must be a positive number'),
    body('defectQuantity').optional().isFloat({ min: 0 }).withMessage('Defect quantity must be a positive number'),
    body('qualityGrade').optional().isIn(['A+', 'A', 'B+', 'B', 'C', 'Reject']).withMessage('Quality grade must be A+, A, B+, B, C, or Reject'),
    body('completedBy').optional().isMongoId().withMessage('Valid user ID is required'),
    body('images').optional().isArray().withMessage('Images must be an array'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    body('qualityNotes').optional().isString().withMessage('Quality notes must be a string')
  ],
  // validateRequest,
  async (req, res) => {
    try {
      const { ProductionFlowController } = await import('../controllers/ProductionFlowController');
      const productionFlowController = new ProductionFlowController();
      await productionFlowController.completeStage(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/production-flow/:productionOrderId/status
 * @desc Get production flow status
 * @access Private
 */
router.get(
  '/:productionOrderId/status',
  [
    param('productionOrderId').isMongoId().withMessage('Valid production order ID is required')
  ],
  // validateRequest,
  async (req, res) => {
    try {
      const { ProductionFlowController } = await import('../controllers/ProductionFlowController');
      const productionFlowController = new ProductionFlowController();
      await productionFlowController.getFlowStatus(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/production-flow/dashboard
 * @desc Get production flow dashboard
 * @access Private
 */
router.get(
  '/dashboard',
  async (req, res) => {
    try {
      const { ProductionFlowController } = await import('../controllers/ProductionFlowController');
      const productionFlowController = new ProductionFlowController();
      await productionFlowController.getFlowDashboard(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/production-flow/:productionOrderId/stages/:stageNumber/hold
 * @desc Hold a production stage
 * @access Private
 */
router.post(
  '/:productionOrderId/stages/:stageNumber/hold',
  [
    param('productionOrderId').isMongoId().withMessage('Valid production order ID is required'),
    param('stageNumber').isInt({ min: 1 }).withMessage('Valid stage number is required'),
    body('reason').notEmpty().withMessage('Reason for holding is required'),
    body('heldBy').optional().isMongoId().withMessage('Valid user ID is required')
  ],
  // validateRequest,
  async (req, res) => {
    try {
      const { ProductionFlowController } = await import('../controllers/ProductionFlowController');
      const productionFlowController = new ProductionFlowController();
      await productionFlowController.holdStage(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/production-flow/:productionOrderId/stages/:stageNumber/resume
 * @desc Resume a held production stage
 * @access Private
 */
router.post(
  '/:productionOrderId/stages/:stageNumber/resume',
  [
    param('productionOrderId').isMongoId().withMessage('Valid production order ID is required'),
    param('stageNumber').isInt({ min: 1 }).withMessage('Valid stage number is required'),
    body('resumedBy').optional().isMongoId().withMessage('Valid user ID is required')
  ],
  // validateRequest,
  async (req, res) => {
    try {
      const { ProductionFlowController } = await import('../controllers/ProductionFlowController');
      const productionFlowController = new ProductionFlowController();
      await productionFlowController.resumeStage(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/production-flow/summary
 * @desc Get stage-wise production summary
 * @access Private
 */
router.get(
  '/summary',
  [
    query('stageType').optional().isString().withMessage('Stage type must be a string'),
    query('dateFrom').optional().isISO8601().withMessage('Date from must be a valid date'),
    query('dateTo').optional().isISO8601().withMessage('Date to must be a valid date')
  ],
  // validateRequest,
  async (req, res) => {
    try {
      const { ProductionFlowController } = await import('../controllers/ProductionFlowController');
      const productionFlowController = new ProductionFlowController();
      await productionFlowController.getStageSummary(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/production-flow/analytics
 * @desc Get production flow analytics
 * @access Private
 */
router.get(
  '/analytics',
  [
    query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Period must be 7d, 30d, 90d, or 1y')
  ],
  // validateRequest,
  async (req, res) => {
    try {
      const { ProductionFlowController } = await import('../controllers/ProductionFlowController');
      const productionFlowController = new ProductionFlowController();
      await productionFlowController.getFlowAnalytics(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
);

export default router;
