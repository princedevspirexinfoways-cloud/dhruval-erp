import { Router } from 'express';
import { WarehouseController } from '../../controllers/WarehouseController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const warehouseController = new WarehouseController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v2/warehouses
 * @desc    Create a new warehouse
 * @access  Private
 */
router.post('/', warehouseController.createWarehouse.bind(warehouseController));

/**
 * @route   GET /api/v2/warehouses
 * @desc    Get warehouses by company with pagination and filters
 * @access  Private
 */
router.get('/', warehouseController.getWarehousesByCompany.bind(warehouseController));

/**
 * @route   GET /api/v2/warehouses/search
 * @desc    Search warehouses
 * @access  Private
 */
router.get('/search', warehouseController.searchWarehouses.bind(warehouseController));

/**
 * @route   GET /api/v2/warehouses/stats
 * @desc    Get warehouse statistics
 * @access  Private
 */
router.get('/stats', warehouseController.getWarehouseStats.bind(warehouseController));

/**
 * @route   GET /api/v2/warehouses/type/:warehouseType
 * @desc    Get warehouses by type
 * @access  Private
 */
router.get('/type/:warehouseType', warehouseController.getWarehousesByType.bind(warehouseController));

/**
 * @route   GET /api/v2/warehouses/code/:warehouseCode
 * @desc    Get warehouse by code
 * @access  Private
 */
router.get('/code/:warehouseCode', warehouseController.getWarehouseByCode.bind(warehouseController));

/**
 * @route   GET /api/v2/warehouses/:id
 * @desc    Get warehouse by ID
 * @access  Private
 */
router.get('/:id', warehouseController.getWarehouseById.bind(warehouseController));

/**
 * @route   PUT /api/v2/warehouses/:id
 * @desc    Update warehouse
 * @access  Private
 */
router.put('/:id', warehouseController.updateWarehouse.bind(warehouseController));

/**
 * @route   PUT /api/v2/warehouses/:warehouseId/capacity
 * @desc    Update warehouse capacity
 * @access  Private
 */
router.put('/:warehouseId/capacity', warehouseController.updateWarehouseCapacity.bind(warehouseController));

/**
 * @route   POST /api/v2/warehouses/:warehouseId/zones
 * @desc    Add storage zone
 * @access  Private
 */
router.post('/:warehouseId/zones', warehouseController.addStorageZone.bind(warehouseController));

/**
 * @route   GET /api/v2/warehouses/:warehouseId/utilization
 * @desc    Get warehouse utilization
 * @access  Private
 */
router.get('/:warehouseId/utilization', warehouseController.getWarehouseUtilization.bind(warehouseController));

/**
 * @route   DELETE /api/v2/warehouses/:id
 * @desc    Delete warehouse (soft delete)
 * @access  Private
 */
router.delete('/:id', warehouseController.deleteWarehouse.bind(warehouseController));

export default router;
