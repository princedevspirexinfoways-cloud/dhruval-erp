import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// ✅ FIXED: Use lazy instantiation instead of immediate instantiation
// This prevents the controller from being created when the module is imported

/**
 * @route   POST /api/v1/purchase-orders
 * @desc    Create a new purchase order
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { PurchaseOrderController } = await import('../../controllers/PurchaseOrderController');
    const purchaseOrderController = new PurchaseOrderController();
    await purchaseOrderController.createPurchaseOrder(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/purchase-orders
 * @desc    Get purchase orders by company with pagination and filters
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { PurchaseOrderController } = await import('../../controllers/PurchaseOrderController');
    const purchaseOrderController = new PurchaseOrderController();
    await purchaseOrderController.getOrdersByCompany(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/purchase-orders/stats
 * @desc    Get purchase order statistics
 * @access  Private
 */
router.get('/stats', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { PurchaseOrderController } = await import('../../controllers/PurchaseOrderController');
    const purchaseOrderController = new PurchaseOrderController();
    await purchaseOrderController.getOrderStats(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/purchase-orders/status/:status
 * @desc    Get purchase orders by status
 * @access  Private
 */
router.get('/status/:status', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { PurchaseOrderController } = await import('../../controllers/PurchaseOrderController');
    const purchaseOrderController = new PurchaseOrderController();
    await purchaseOrderController.getOrdersByStatus(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/purchase-orders/supplier/:supplierId
 * @desc    Get orders by supplier
 * @access  Private
 */
router.get('/supplier/:supplierId', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { PurchaseOrderController } = await import('../../controllers/PurchaseOrderController');
    const purchaseOrderController = new PurchaseOrderController();
    await purchaseOrderController.getOrdersBySupplier(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/purchase-orders/:id
 * @desc    Get purchase order by ID
 * @access  Private
 * @note    This route must be LAST to avoid catching other specific routes
 */
router.get('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { PurchaseOrderController } = await import('../../controllers/PurchaseOrderController');
    const purchaseOrderController = new PurchaseOrderController();
    await purchaseOrderController.getPurchaseOrderById(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/purchase-orders/:id
 * @desc    Update purchase order
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { PurchaseOrderController } = await import('../../controllers/PurchaseOrderController');
    const purchaseOrderController = new PurchaseOrderController();
    await purchaseOrderController.updatePurchaseOrder(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/purchase-orders/:orderId/status
 * @desc    Update order status
 * @access  Private
 */
router.put('/:orderId/status', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { PurchaseOrderController } = await import('../../controllers/PurchaseOrderController');
    const purchaseOrderController = new PurchaseOrderController();
    await purchaseOrderController.updateOrderStatus(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/purchase-orders/:orderId/receive
 * @desc    Receive items for purchase order
 * @access  Private
 */
router.post('/:orderId/receive', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { PurchaseOrderController } = await import('../../controllers/PurchaseOrderController');
    const purchaseOrderController = new PurchaseOrderController();
    await purchaseOrderController.receiveItems(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/purchase-orders/:orderId/cancel
 * @desc    Cancel purchase order
 * @access  Private
 */
router.post('/:orderId/cancel', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { PurchaseOrderController } = await import('../../controllers/PurchaseOrderController');
    const purchaseOrderController = new PurchaseOrderController();
    await purchaseOrderController.cancelPurchaseOrder(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/v1/purchase-orders/:id
 * @desc    Delete purchase order
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { PurchaseOrderController } = await import('../../controllers/PurchaseOrderController');
    const purchaseOrderController = new PurchaseOrderController();
    await purchaseOrderController.deletePurchaseOrder(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;
