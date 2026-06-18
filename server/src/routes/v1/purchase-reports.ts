import { Router } from 'express';
import { PurchaseReportsController } from '../../controllers/PurchaseReportsController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const reportsController = new PurchaseReportsController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/v1/purchase/reports/vendor-wise
 * @desc    Get vendor-wise purchase summary
 * @access  Private
 */
router.get('/vendor-wise', reportsController.getVendorWiseSummary.bind(reportsController));

/**
 * @route   GET /api/v1/purchase/reports/item-wise
 * @desc    Get item-wise purchase report
 * @access  Private
 */
router.get('/item-wise', reportsController.getItemWiseReport.bind(reportsController));

/**
 * @route   GET /api/v1/purchase/reports/category-wise
 * @desc    Get category-wise purchase report
 * @access  Private
 */
router.get('/category-wise', reportsController.getCategoryWiseReport.bind(reportsController));

/**
 * @route   GET /api/v1/purchase/reports/date-range
 * @desc    Get date range purchase report
 * @access  Private
 */
router.get('/date-range', reportsController.getDateRangeReport.bind(reportsController));

/**
 * @route   POST /api/v1/purchase/reports/export/:reportType/:format
 * @desc    Export purchase report (xlsx or pdf)
 * @access  Private
 */
router.post('/export/:reportType/:format', reportsController.exportReport.bind(reportsController));

export default router;











