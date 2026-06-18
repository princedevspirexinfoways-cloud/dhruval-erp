import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// ✅ FIXED: Use lazy instantiation instead of immediate instantiation
// This prevents the controller from being created when the module is imported

// =============================================
// SALES DASHBOARD (Overview + Analytics Combined)
// =============================================

/**
 * @route   GET /api/v1/sales/dashboard
 * @desc    Get comprehensive sales dashboard data (Overview + Analytics)
 * @access  Private
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { SalesController } = await import('../../controllers/SalesController');
    const salesController = new SalesController();
    await salesController.getSalesDashboard(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/sales/stats
 * @desc    Get sales statistics
 * @access  Private
 */
router.get('/stats', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { SalesController } = await import('../../controllers/SalesController');
    const salesController = new SalesController();
    await salesController.getSalesStats(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/sales/analytics
 * @desc    Get sales analytics
 * @access  Private
 */
router.get('/analytics', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { SalesController } = await import('../../controllers/SalesController');
    const salesController = new SalesController();
    await salesController.getSalesAnalytics(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// =============================================
// SALES ORDERS CRUD OPERATIONS
// =============================================

/**
 * @route   GET /api/v1/sales/orders
 * @desc    Get all sales orders with filtering
 * @access  Private
 */
router.get('/orders', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { SalesController } = await import('../../controllers/SalesController');
    const salesController = new SalesController();
    await salesController.getSalesOrders(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/sales/orders
 * @desc    Create a new sales order
 * @access  Private
 */
router.post('/orders', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { SalesController } = await import('../../controllers/SalesController');
    const salesController = new SalesController();
    await salesController.createSalesOrder(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/sales/orders/:id
 * @desc    Get sales order by ID
 * @access  Private
 */
router.get('/orders/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { SalesController } = await import('../../controllers/SalesController');
    const salesController = new SalesController();
    await salesController.getSalesOrderById(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/sales/orders/:id
 * @desc    Update sales order
 * @access  Private
 */
router.put('/orders/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { SalesController } = await import('../../controllers/SalesController');
    const salesController = new SalesController();
    await salesController.updateSalesOrder(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/v1/sales/orders/:id
 * @desc    Delete sales order
 * @access  Private
 */
router.delete('/orders/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { SalesController } = await import('../../controllers/SalesController');
    const salesController = new SalesController();
    await salesController.deleteSalesOrder(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/sales/orders/:id/payment
 * @desc    Update payment status
 * @access  Private
 */
router.put('/orders/:id/payment', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { SalesController } = await import('../../controllers/SalesController');
    const salesController = new SalesController();
    await salesController.updatePaymentStatus(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/sales/orders/bulk-update
 * @desc    Bulk update orders
 * @access  Private
 */
router.put('/orders/bulk-update', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { SalesController } = await import('../../controllers/SalesController');
    const salesController = new SalesController();
    await salesController.bulkUpdateOrders(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// =============================================
// SALES REPORTS & ANALYTICS
// =============================================

/**
 * @route   GET /api/v1/sales/reports/customer
 * @desc    Get customer sales report
 * @access  Private
 */
router.get('/reports/customer', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { SalesController } = await import('../../controllers/SalesController');
    const salesController = new SalesController();
    await salesController.getCustomerSalesReport(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/sales/reports/products
 * @desc    Get product sales performance
 * @access  Private
 */
router.get('/reports/products', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { SalesController } = await import('../../controllers/SalesController');
    const salesController = new SalesController();
    await salesController.getProductSalesPerformance(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/sales/trends
 * @desc    Get sales trends
 * @access  Private
 */
router.get('/trends', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { SalesController } = await import('../../controllers/SalesController');
    const salesController = new SalesController();
    await salesController.getSalesTrends(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/sales/team-performance
 * @desc    Get sales team performance
 * @access  Private
 */
router.get('/team-performance', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { SalesController } = await import('../../controllers/SalesController');
    const salesController = new SalesController();
    await salesController.getSalesTeamPerformance(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// =============================================
// EXPORT FUNCTIONALITY
// =============================================

/**
 * @route   POST /api/v1/sales/export/:format
 * @desc    Export sales data
 * @access  Private
 */
router.post('/export/:format', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { SalesController } = await import('../../controllers/SalesController');
    const salesController = new SalesController();
    await salesController.exportSalesData(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;
