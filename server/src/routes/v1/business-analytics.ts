import { Router } from 'express';
import { BusinessAnalyticsController } from '../../controllers/BusinessAnalyticsController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const businessAnalyticsController = new BusinessAnalyticsController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v2/business-analytics
 * @desc    Create a new business analytics entry
 * @access  Private
 */
router.post('/', businessAnalyticsController.createAnalytics.bind(businessAnalyticsController));

/**
 * @route   GET /api/v2/business-analytics
 * @desc    Get business analytics by company with pagination and filters
 * @access  Private
 */
router.get('/', businessAnalyticsController.getAnalyticsByCompany.bind(businessAnalyticsController));

/**
 * @route   GET /api/v2/business-analytics/sales
 * @desc    Generate sales analytics
 * @access  Private
 */
router.get('/sales', businessAnalyticsController.generateSalesAnalytics.bind(businessAnalyticsController));

/**
 * @route   GET /api/v2/business-analytics/inventory
 * @desc    Generate inventory analytics
 * @access  Private
 */
router.get('/inventory', businessAnalyticsController.generateInventoryAnalytics.bind(businessAnalyticsController));

/**
 * @route   GET /api/v2/business-analytics/:id
 * @desc    Get business analytics by ID
 * @access  Private
 */
router.get('/:id', businessAnalyticsController.getAnalyticsById.bind(businessAnalyticsController));

export default router;
