import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// ✅ FIXED: Use lazy instantiation instead of immediate instantiation
// This prevents the controller from being created when the module is imported

/**
 * @route   POST /api/v1/invoices
 * @desc    Create a new invoice
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { InvoiceController } = await import('../../controllers/InvoiceController');
    const invoiceController = new InvoiceController();
    await invoiceController.createInvoice(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/invoices/generate-number
 * @desc    Generate next invoice number for a company
 * @access  Private
 */
router.post('/generate-number', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { InvoiceController } = await import('../../controllers/InvoiceController');
    const invoiceController = new InvoiceController();
    await invoiceController.generateInvoiceNumber(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/invoices
 * @desc    Get invoices by company with pagination and filters
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { InvoiceController } = await import('../../controllers/InvoiceController');
    const invoiceController = new InvoiceController();
    await invoiceController.getInvoicesByCompany(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/invoices/stats
 * @desc    Get invoice statistics
 * @access  Private
 */
router.get('/stats', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { InvoiceController } = await import('../../controllers/InvoiceController');
    const invoiceController = new InvoiceController();
    await invoiceController.getInvoiceStats(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/invoices/overdue
 * @desc    Get overdue invoices
 * @access  Private
 */
router.get('/overdue', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { InvoiceController } = await import('../../controllers/InvoiceController');
    const invoiceController = new InvoiceController();
    await invoiceController.getOverdueInvoices(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/invoices/customer/:customerId
 * @desc    Get invoices by customer
 * @access  Private
 */
router.get('/customer/:customerId', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { InvoiceController } = await import('../../controllers/InvoiceController');
    const invoiceController = new InvoiceController();
    await invoiceController.getInvoicesByCustomer(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/invoices/:id
 * @desc    Get invoice by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { InvoiceController } = await import('../../controllers/InvoiceController');
    const invoiceController = new InvoiceController();
    await invoiceController.getInvoiceById(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/invoices/:id
 * @desc    Update invoice
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { InvoiceController } = await import('../../controllers/InvoiceController');
    const invoiceController = new InvoiceController();
    await invoiceController.updateInvoice(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/invoices/:invoiceId/status
 * @desc    Update invoice status
 * @access  Private
 */
router.put('/:invoiceId/status', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { InvoiceController } = await import('../../controllers/InvoiceController');
    const invoiceController = new InvoiceController();
    await invoiceController.updateInvoiceStatus(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/invoices/:invoiceId/payment
 * @desc    Record payment for invoice
 * @access  Private
 */
router.post('/:invoiceId/payment', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { InvoiceController } = await import('../../controllers/InvoiceController');
    const invoiceController = new InvoiceController();
    await invoiceController.recordPayment(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/v1/invoices/:id
 * @desc    Cancel invoice
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { InvoiceController } = await import('../../controllers/InvoiceController');
    const invoiceController = new InvoiceController();
    await invoiceController.deleteInvoice(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/invoices/:id/pdf
 * @desc    Generate PDF for invoice
 * @access  Private
 */
router.get('/:id/pdf', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { InvoiceController } = await import('../../controllers/InvoiceController');
    const invoiceController = new InvoiceController();
    await invoiceController.generateInvoicePDF(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/invoices/preview
 * @desc    Preview invoice before saving
 * @access  Private
 */
router.post('/preview', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { InvoiceController } = await import('../../controllers/InvoiceController');
    const invoiceController = new InvoiceController();
    await invoiceController.previewInvoice(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;
