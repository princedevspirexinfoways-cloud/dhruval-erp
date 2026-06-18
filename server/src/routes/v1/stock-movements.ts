import { Router } from 'express';
import { StockMovementController } from '../../controllers/StockMovementController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const stockMovementController = new StockMovementController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v2/stock-movements
 * @desc    Create a new stock movement
 * @access  Private
 */
router.post('/', stockMovementController.createStockMovement.bind(stockMovementController));

/**
 * @route   GET /api/v2/stock-movements
 * @desc    Get stock movements by company with pagination and filters
 * @access  Private
 */
router.get('/', stockMovementController.getMovementsByCompany.bind(stockMovementController));

/**
 * @route   GET /api/v2/stock-movements/search
 * @desc    Search stock movements
 * @access  Private
 */
router.get('/search', stockMovementController.searchMovements.bind(stockMovementController));

/**
 * @route   GET /api/v2/stock-movements/stats
 * @desc    Get stock movement statistics
 * @access  Private
 */
router.get('/stats', stockMovementController.getMovementStats.bind(stockMovementController));

/**
 * @route   GET /api/v2/stock-movements/recent
 * @desc    Get recent stock movements
 * @access  Private
 */
router.get('/recent', stockMovementController.getRecentMovements.bind(stockMovementController));

/**
 * @route   GET /api/v2/stock-movements/item/:itemId
 * @desc    Get movements by item
 * @access  Private
 */
router.get('/item/:itemId', stockMovementController.getMovementsByItem.bind(stockMovementController));

/**
 * @route   GET /api/v2/stock-movements/warehouse/:warehouseId
 * @desc    Get movements by warehouse
 * @access  Private
 */
router.get('/warehouse/:warehouseId', stockMovementController.getMovementsByWarehouse.bind(stockMovementController));

/**
 * @route   GET /api/v2/stock-movements/reference/:referenceNumber
 * @desc    Get movements by reference number
 * @access  Private
 */
router.get('/reference/:referenceNumber', stockMovementController.getMovementsByReference.bind(stockMovementController));

/**
 * @route   GET /api/v2/stock-movements/:id
 * @desc    Get stock movement by ID
 * @access  Private
 */
router.get('/:id', stockMovementController.getStockMovementById.bind(stockMovementController));

/**
 * @route   PUT /api/v2/stock-movements/:id
 * @desc    Update stock movement
 * @access  Private
 */
router.put('/:id', stockMovementController.updateStockMovement.bind(stockMovementController));

/**
 * @route   GET /api/v2/stock-movements/inventory-levels
 * @desc    Get current inventory levels
 * @access  Private
 */
router.get('/inventory-levels', stockMovementController.getInventoryLevels.bind(stockMovementController));

/**
 * @route   POST /api/v2/stock-movements/generate-number
 * @desc    Generate movement number
 * @access  Private
 */
router.post('/generate-number', stockMovementController.generateMovementNumber.bind(stockMovementController));

export default router;
