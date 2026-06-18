import { Router } from 'express';
import { ReportController } from '../../controllers/ReportController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const reportController = new ReportController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v2/reports
 * @desc    Create a new report
 * @access  Private
 */
router.post('/', reportController.createReport.bind(reportController));

/**
 * @route   GET /api/v2/reports
 * @desc    Get reports by company with pagination and filters
 * @access  Private
 */
router.get('/', reportController.getReportsByCompany.bind(reportController));

/**
 * @route   GET /api/v2/reports/stats
 * @desc    Get report statistics
 * @access  Private
 */
router.get('/stats', reportController.getReportStats.bind(reportController));

/**
 * @route   GET /api/v2/reports/generate/sales
 * @desc    Generate sales report
 * @access  Private
 */
router.get('/generate/sales', reportController.generateSalesReport.bind(reportController));

/**
 * @route   GET /api/v2/reports/generate/inventory
 * @desc    Generate inventory report
 * @access  Private
 */
router.get('/generate/inventory', reportController.generateInventoryReport.bind(reportController));

/**
 * @route   GET /api/v2/reports/generate/production
 * @desc    Generate production report
 * @access  Private
 */
router.get('/generate/production', reportController.generateProductionReport.bind(reportController));

/**
 * @route   GET /api/v2/reports/generate/purchase/supplier-wise
 * @desc    Generate supplier-wise purchase report
 * @access  Private
 */
router.get('/generate/purchase/supplier-wise', reportController.generateSupplierWisePurchaseReport.bind(reportController));

/**
 * @route   GET /api/v2/reports/generate/purchase/summary
 * @desc    Generate purchase summary report
 * @access  Private
 */
router.get('/generate/purchase/summary', reportController.generatePurchaseSummaryReport.bind(reportController));

/**
 * @route   GET /api/v2/reports/:id
 * @desc    Get report by ID
 * @access  Private
 */
router.get('/:id', reportController.getReportById.bind(reportController));

export default router;
