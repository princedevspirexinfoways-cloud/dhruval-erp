import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();
// ✅ FIXED: Use lazy instantiation instead of immediate instantiation
// This prevents the controller from being created when the module is imported

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/v1/advanced-reports
 * @desc    Get advanced reports by company
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { AdvancedReportController } = await import('../../controllers/AdvancedReportController');
    const advancedReportController = new AdvancedReportController();
    await advancedReportController.getReportsByCompany(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/advanced-reports
 * @desc    Create new advanced report
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { AdvancedReportController } = await import('../../controllers/AdvancedReportController');
    const advancedReportController = new AdvancedReportController();
    await advancedReportController.createReport(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/advanced-reports/:id
 * @desc    Get advanced report by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { AdvancedReportController } = await import('../../controllers/AdvancedReportController');
    const advancedReportController = new AdvancedReportController();
    await advancedReportController.getReportById(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/advanced-reports/:id
 * @desc    Update advanced report
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { AdvancedReportController } = await import('../../controllers/AdvancedReportController');
    const advancedReportController = new AdvancedReportController();
    await advancedReportController.updateReport(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/v1/advanced-reports/:id
 * @desc    Delete advanced report
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { AdvancedReportController } = await import('../../controllers/AdvancedReportController');
    const advancedReportController = new AdvancedReportController();
    await advancedReportController.deleteReport(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/advanced-reports/category/:category
 * @desc    Get reports by category
 * @access  Private
 */
router.get('/category/:category', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { AdvancedReportController } = await import('../../controllers/AdvancedReportController');
    const advancedReportController = new AdvancedReportController();
    await advancedReportController.getReportsByCategory(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/advanced-reports/scheduled
 * @desc    Get scheduled reports
 * @access  Private
 */
router.get('/scheduled', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { AdvancedReportController } = await import('../../controllers/AdvancedReportController');
    const advancedReportController = new AdvancedReportController();
    await advancedReportController.getScheduledReports(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/advanced-reports/templates
 * @desc    Get report templates
 * @access  Private
 */
router.get('/templates', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { AdvancedReportController } = await import('../../controllers/AdvancedReportController');
    const advancedReportController = new AdvancedReportController();
    await advancedReportController.getReportTemplates(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/advanced-reports/public
 * @desc    Get public reports
 * @access  Private
 */
router.get('/public', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { AdvancedReportController } = await import('../../controllers/AdvancedReportController');
    const advancedReportController = new AdvancedReportController();
    await advancedReportController.getPublicReports(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/advanced-reports/:id/generate
 * @desc    Generate report
 * @access  Private
 */
router.post('/:id/generate', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { AdvancedReportController } = await import('../../controllers/AdvancedReportController');
    const advancedReportController = new AdvancedReportController();
    await advancedReportController.generateReport(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/advanced-reports/:id/export
 * @desc    Export report
 * @access  Private
 */
router.post('/:id/export', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { AdvancedReportController } = await import('../../controllers/AdvancedReportController');
    const advancedReportController = new AdvancedReportController();
    await advancedReportController.exportReport(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/advanced-reports/:id/clone
 * @desc    Clone report as template
 * @access  Private
 */
router.post('/:id/clone', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { AdvancedReportController } = await import('../../controllers/AdvancedReportController');
    const advancedReportController = new AdvancedReportController();
    await advancedReportController.cloneReport(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/advanced-reports/:id/status
 * @desc    Get report generation status
 * @access  Private
 */
router.get('/:id/status', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { AdvancedReportController } = await import('../../controllers/AdvancedReportController');
    const advancedReportController = new AdvancedReportController();
    await advancedReportController.getReportStatus(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/advanced-reports/:id/schedule
 * @desc    Update report schedule
 * @access  Private
 */
router.put('/:id/schedule', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { AdvancedReportController } = await import('../../controllers/AdvancedReportController');
    const advancedReportController = new AdvancedReportController();
    await advancedReportController.updateSchedule(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/advanced-reports/:id/distribution
 * @desc    Update report distribution
 * @access  Private
 */
router.put('/:id/distribution', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { AdvancedReportController } = await import('../../controllers/AdvancedReportController');
    const advancedReportController = new AdvancedReportController();
    await advancedReportController.updateDistribution(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/advanced-reports/:id/access-control
 * @desc    Update report access control
 * @access  Private
 */
router.put('/:id/access-control', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { AdvancedReportController } = await import('../../controllers/AdvancedReportController');
    const advancedReportController = new AdvancedReportController();
    await advancedReportController.updateAccessControl(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/advanced-reports/:id/analytics
 * @desc    Get report analytics
 * @access  Private
 */
router.get('/:id/analytics', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { AdvancedReportController } = await import('../../controllers/AdvancedReportController');
    const advancedReportController = new AdvancedReportController();
    await advancedReportController.getReportAnalytics(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/advanced-reports/:id/access
 * @desc    Grant access to report
 * @access  Private
 */
router.post('/:id/access', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { AdvancedReportController } = await import('../../controllers/AdvancedReportController');
    const advancedReportController = new AdvancedReportController();
    await advancedReportController.grantAccess(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/v1/advanced-reports/:id/access/:userId
 * @desc    Revoke access to report
 * @access  Private
 */
router.delete('/:id/access/:userId', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { AdvancedReportController } = await import('../../controllers/AdvancedReportController');
    const advancedReportController = new AdvancedReportController();
    await advancedReportController.revokeAccess(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/advanced-reports/search
 * @desc    Search reports
 * @access  Private
 */
router.get('/search', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { AdvancedReportController } = await import('../../controllers/AdvancedReportController');
    const advancedReportController = new AdvancedReportController();
    await advancedReportController.searchReports(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;
