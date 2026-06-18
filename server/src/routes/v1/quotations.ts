import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router: Router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// ✅ FIXED: Use lazy instantiation instead of immediate instantiation
// This prevents the controller from being created when the module is imported

/**
 * @route   POST /api/v1/quotations
 * @desc    Create a new quotation
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { QuotationController } = await import('../../controllers/QuotationController');
    const quotationController = new QuotationController();
    await quotationController.createQuotation(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/quotations
 * @desc    Get quotations by company with pagination and filters
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { QuotationController } = await import('../../controllers/QuotationController');
    const quotationController = new QuotationController();
    await quotationController.getQuotationsByCompany(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/quotations/stats
 * @desc    Get quotation statistics
 * @access  Private
 */
router.get('/stats', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { QuotationController } = await import('../../controllers/QuotationController');
    const quotationController = new QuotationController();
    await quotationController.getQuotationStats(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/quotations/expired
 * @desc    Get expired quotations
 * @access  Private
 */
router.get('/expired', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { QuotationController } = await import('../../controllers/QuotationController');
    const quotationController = new QuotationController();
    await quotationController.getExpiredQuotations(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/quotations/customer/:customerId
 * @desc    Get quotations by customer
 * @access  Private
 */
router.get('/customer/:customerId', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { QuotationController } = await import('../../controllers/QuotationController');
    const quotationController = new QuotationController();
    await quotationController.getQuotationsByCustomer(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/quotations/:id
 * @desc    Get quotation by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { QuotationController } = await import('../../controllers/QuotationController');
    const quotationController = new QuotationController();
    await quotationController.getQuotationById(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/quotations/:id
 * @desc    Update quotation
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { QuotationController } = await import('../../controllers/QuotationController');
    const quotationController = new QuotationController();
    await quotationController.updateQuotation(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/quotations/:quotationId/status
 * @desc    Update quotation status
 * @access  Private
 */
router.put('/:quotationId/status', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { QuotationController } = await import('../../controllers/QuotationController');
    const quotationController = new QuotationController();
    await quotationController.updateQuotationStatus(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/quotations/:quotationId/convert
 * @desc    Convert quotation to order
 * @access  Private
 */
router.post('/:quotationId/convert', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { QuotationController } = await import('../../controllers/QuotationController');
    const quotationController = new QuotationController();
    await quotationController.convertToOrder(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/v1/quotations/:id
 * @desc    Cancel quotation
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { QuotationController } = await import('../../controllers/QuotationController');
    const quotationController = new QuotationController();
    await quotationController.deleteQuotation(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;
