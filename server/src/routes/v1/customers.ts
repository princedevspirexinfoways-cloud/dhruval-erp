import { Router } from 'express';
import { CustomerController } from '../../controllers/CustomerController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const customerController = new CustomerController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v1/customers
 * @desc    Create a new customer
 * @access  Private
 */
router.post('/', customerController.createCustomer.bind(customerController));

/**
 * @route   POST /api/v1/customers/find-or-create
 * @desc    Find or create customer for Sales (auto-save on first entry when typing new customer)
 * @access  Private
 */
router.post('/find-or-create', customerController.findOrCreate.bind(customerController));

/**
 * @route   GET /api/v1/customers
 * @desc    Get customers by company with pagination and filters
 * @access  Private
 */
router.get('/', customerController.getCustomersByCompany.bind(customerController));

/**
 * @route   GET /api/v2/customers/all
 * @desc    Get all customers across companies (Super Admin only)
 * @access  Private
 */
router.get('/all', customerController.getAllCustomers.bind(customerController));

/**
 * @route   GET /api/v2/customers/search
 * @desc    Search customers
 * @access  Private
 */
router.get('/search', customerController.searchCustomers.bind(customerController));

/**
 * @route   GET /api/v2/customers/stats
 * @desc    Get customer statistics
 * @access  Private
 */
router.get('/stats', customerController.getCustomerStats.bind(customerController));

/**
 * @route   GET /api/v2/customers/code/:customerCode
 * @desc    Get customer by code
 * @access  Private
 */
router.get('/code/:customerCode', customerController.getCustomerByCode.bind(customerController));

/**
 * @route   GET /api/v2/customers/:id
 * @desc    Get customer by ID
 * @access  Private
 */
router.get('/:id', customerController.getCustomerById.bind(customerController));

/**
 * @route   PUT /api/v2/customers/:id
 * @desc    Update customer
 * @access  Private
 */
router.put('/:id', customerController.updateCustomer.bind(customerController));

/**
 * @route   PUT /api/v2/customers/:id/credit-limit
 * @desc    Update customer credit limit
 * @access  Private
 */
router.put('/:id/credit-limit', customerController.updateCreditLimit.bind(customerController));

/**
 * @route   DELETE /api/v2/customers/:id
 * @desc    Delete customer (soft delete)
 * @access  Private
 */
router.delete('/:id', customerController.deleteCustomer.bind(customerController));

export default router;
