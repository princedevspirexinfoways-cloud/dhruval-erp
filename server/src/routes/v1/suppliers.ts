import { Router } from 'express';
import { SupplierController } from '../../controllers/SupplierController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const supplierController = new SupplierController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v2/suppliers
 * @desc    Create a new supplier
 * @access  Private
 */
router.post('/', supplierController.createSupplier.bind(supplierController));

/**
 * @route   GET /api/v2/suppliers
 * @desc    Get suppliers by company with pagination and filters
 * @access  Private
 */
router.get('/', supplierController.getSuppliersByCompany.bind(supplierController));

/**
 * @route   GET /api/v2/suppliers/search
 * @desc    Search suppliers
 * @access  Private
 */
router.get('/search', supplierController.searchSuppliers.bind(supplierController));

/**
 * @route   GET /api/v2/suppliers/stats
 * @desc    Get supplier statistics
 * @access  Private
 */
router.get('/stats', supplierController.getSupplierStats.bind(supplierController));

/**
 * @route   GET /api/v2/suppliers/category/:category
 * @desc    Get suppliers by category
 * @access  Private
 */
router.get('/category/:category', supplierController.getSuppliersByCategory.bind(supplierController));

/**
 * @route   GET /api/v2/suppliers/code/:supplierCode
 * @desc    Get supplier by code
 * @access  Private
 */
router.get('/code/:supplierCode', supplierController.getSupplierByCode.bind(supplierController));

/**
 * @route   GET /api/v2/suppliers/:id
 * @desc    Get supplier by ID
 * @access  Private
 */
router.get('/:id', supplierController.getSupplierById.bind(supplierController));

/**
 * @route   PUT /api/v2/suppliers/:id
 * @desc    Update supplier
 * @access  Private
 */
router.put('/:id', supplierController.updateSupplier.bind(supplierController));

/**
 * @route   PUT /api/v2/suppliers/:id/rating
 * @desc    Update supplier rating
 * @access  Private
 */
router.put('/:id/rating', supplierController.updateSupplierRating.bind(supplierController));

/**
 * @route   DELETE /api/v2/suppliers/:id
 * @desc    Delete supplier (soft delete)
 * @access  Private
 */
router.delete('/:id', supplierController.deleteSupplier.bind(supplierController));

/**
 * @route   GET /api/v2/suppliers/:id/orders
 * @desc    Get supplier orders
 * @access  Private
 */
router.get('/:id/orders', supplierController.getSupplierOrders.bind(supplierController));

export default router;
