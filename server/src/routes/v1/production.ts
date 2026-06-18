import { Router } from 'express';
import { ProductionController } from '../../controllers/ProductionController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const productionController = new ProductionController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v2/production
 * @desc    Create a new production order
 * @access  Private
 */
router.post('/', productionController.createProductionOrder.bind(productionController));

/**
 * @route   GET /api/v2/production
 * @desc    Get production orders by company with pagination and filters
 * @access  Private
 */
router.get('/', productionController.getProductionOrdersByCompany.bind(productionController));

/**
 * @route   GET /api/v2/production/stats
 * @desc    Get production statistics
 * @access  Private
 */
router.get('/stats', productionController.getProductionStats.bind(productionController));

/**
 * @route   GET /api/v2/production/status/:status
 * @desc    Get production orders by status
 * @access  Private
 */
router.get('/status/:status', productionController.getOrdersByStatus.bind(productionController));

/**
 * @route   GET /api/v2/production/order/:orderNumber
 * @desc    Get production order by number
 * @access  Private
 */
router.get('/order/:orderNumber', productionController.getOrderByNumber.bind(productionController));

/**
 * @route   GET /api/v2/production/:id
 * @desc    Get production order by ID
 * @access  Private
 */
router.get('/:id', productionController.getProductionOrderById.bind(productionController));

/**
 * @route   PUT /api/v2/production/:id
 * @desc    Update production order
 * @access  Private
 */
router.put('/:id', productionController.updateProductionOrder.bind(productionController));

/**
 * @route   POST /api/v2/production/:orderId/start
 * @desc    Start production
 * @access  Private
 */
router.post('/:orderId/start', productionController.startProduction.bind(productionController));

/**
 * @route   POST /api/v2/production/:orderId/complete-stage
 * @desc    Complete production stage
 * @access  Private
 */
router.post('/:orderId/complete-stage', productionController.completeStage.bind(productionController));

/**
 * @route   POST /api/v2/production/:orderId/complete
 * @desc    Complete production
 * @access  Private
 */
router.post('/:orderId/complete', productionController.completeProduction.bind(productionController));

/**
 * @route   POST /api/v2/production/:orderId/cancel
 * @desc    Cancel production
 * @access  Private
 */
router.post('/:orderId/cancel', productionController.cancelProduction.bind(productionController));

export default router;
