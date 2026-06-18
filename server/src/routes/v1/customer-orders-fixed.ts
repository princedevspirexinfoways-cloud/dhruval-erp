import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// ✅ FIXED: Use lazy instantiation instead of immediate instantiation
// This prevents the controller from being created when the module is imported

/**
 * @route   POST /api/v1/customer-orders
 * @desc    Create a new customer order
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { CustomerOrderController } = await import('../../controllers/CustomerOrderController');
    const customerOrderController = new CustomerOrderController();
    await customerOrderController.createCustomerOrder(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/customer-orders
 * @desc    Get customer orders by company with pagination and filters
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { CustomerOrderController } = await import('../../controllers/CustomerOrderController');
    const customerOrderController = new CustomerOrderController();
    await customerOrderController.getOrdersByCompany(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/customer-orders/stats
 * @desc    Get customer order statistics
 * @access  Private
 */
router.get('/stats', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { CustomerOrderController } = await import('../../controllers/CustomerOrderController');
    const customerOrderController = new CustomerOrderController();
    await customerOrderController.getOrderStats(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/customer-orders/status/:status
 * @desc    Get customer orders by status
 * @access  Private
 */
router.get('/status/:status', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { CustomerOrderController } = await import('../../controllers/CustomerOrderController');
    const customerOrderController = new CustomerOrderController();
    await customerOrderController.getOrdersByStatus(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/customer-orders/customer/:customerId
 * @desc    Get orders by customer
 * @access  Private
 */
router.get('/customer/:customerId', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { CustomerOrderController } = await import('../../controllers/CustomerOrderController');
    const customerOrderController = new CustomerOrderController();
    await customerOrderController.getOrdersByCustomer(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/customer-orders/order/:orderNumber
 * @desc    Get customer order by number
 * @access  Private
 */
router.get('/order/:orderNumber', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { CustomerOrderController } = await import('../../controllers/CustomerOrderController');
    const customerOrderController = new CustomerOrderController();
    await customerOrderController.getOrderByNumber(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/customer-orders/:orderId/status
 * @desc    Update order status
 * @access  Private
 */
router.put('/:orderId/status', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { CustomerOrderController } = await import('../../controllers/CustomerOrderController');
    const customerOrderController = new CustomerOrderController();
    await customerOrderController.updateOrderStatus(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/customer-orders/:id
 * @desc    Update customer order
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { CustomerOrderController } = await import('../../controllers/CustomerOrderController');
    const customerOrderController = new CustomerOrderController();
    await customerOrderController.updateCustomerOrder(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/v1/customer-orders/:id
 * @desc    Cancel customer order
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { CustomerOrderController } = await import('../../controllers/CustomerOrderController');
    const customerOrderController = new CustomerOrderController();
    await customerOrderController.deleteCustomerOrder(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/customer-orders/:id
 * @desc    Get customer order by ID
 * @access  Private
 * @note    This route must be LAST to avoid catching other specific routes
 */
router.get('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { CustomerOrderController } = await import('../../controllers/CustomerOrderController');
    const customerOrderController = new CustomerOrderController();
    await customerOrderController.getCustomerOrderById(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;
