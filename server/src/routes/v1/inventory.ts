import { Router } from 'express';
import { InventoryController } from '../../controllers/InventoryController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const inventoryController = new InventoryController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v2/inventory
 * @desc    Create a new inventory item
 * @access  Private
 */
router.post('/', inventoryController.createInventoryItem.bind(inventoryController));

/**
 * @route   GET /api/v2/inventory
 * @desc    Get inventory items by company with pagination and filters
 * @access  Private
 */
router.get('/', inventoryController.getItemsByCompany.bind(inventoryController));

/**
 * @route   GET /api/v2/inventory/search
 * @desc    Search inventory items
 * @access  Private
 */
router.get('/search', inventoryController.searchItems.bind(inventoryController));

/**
 * @route   GET /api/v2/inventory/stats
 * @desc    Get inventory statistics
 * @access  Private
 */
router.get('/stats', inventoryController.getInventoryStats.bind(inventoryController));

/**
 * @route   GET /api/v2/inventory/alerts
 * @desc    Get inventory alerts
 * @access  Private
 */
router.get('/alerts', inventoryController.getInventoryAlerts.bind(inventoryController));

/**
 * @route   GET /api/v2/inventory/low-stock
 * @desc    Get low stock items
 * @access  Private
 */
router.get('/low-stock', inventoryController.getLowStockItems.bind(inventoryController));

/**
 * @route   GET /api/v2/inventory/code/:itemCode
 * @desc    Get inventory item by code
 * @access  Private
 */
router.get('/code/:itemCode', inventoryController.getItemByCode.bind(inventoryController));

/**
 * @route   GET /api/v2/inventory/:id
 * @desc    Get inventory item by ID
 * @access  Private
 */
router.get('/:id', inventoryController.getById.bind(inventoryController));

/**
 * @route   PUT /api/v2/inventory/:id
 * @desc    Update inventory item
 * @access  Private
 */
router.put('/:id', inventoryController.updateInventoryItem.bind(inventoryController));

/**
 * @route   POST /api/v2/inventory/:itemId/stock
 * @desc    Update stock (add/remove/adjust)
 * @access  Private
 */
router.post('/:itemId/stock', inventoryController.updateStock.bind(inventoryController));

/**
 * @route   POST /api/v2/inventory/:itemId/reserve
 * @desc    Reserve stock
 * @access  Private
 */
router.post('/:itemId/reserve', inventoryController.reserveStock.bind(inventoryController));

/**
 * @route   POST /api/v2/inventory/:itemId/release
 * @desc    Release reserved stock
 * @access  Private
 */
router.post('/:itemId/release', inventoryController.releaseReservedStock.bind(inventoryController));

/**
 * @route   DELETE /api/v2/inventory/:id
 * @desc    Delete inventory item (soft delete)
 * @access  Private
 */
router.delete('/:id', inventoryController.deleteInventoryItem.bind(inventoryController));

export default router;
