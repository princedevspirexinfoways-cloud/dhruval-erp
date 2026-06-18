import { Router } from 'express';
import { SalesAnalyticsController } from '../../controllers/SalesAnalyticsController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const salesAnalyticsController = new SalesAnalyticsController();

router.use(authenticate);

// Customer Sales Analytics
router.get('/analytics', salesAnalyticsController.getCustomerSalesAnalytics.bind(salesAnalyticsController));
router.get('/reports/customer', salesAnalyticsController.getCustomerSalesReport.bind(salesAnalyticsController));
router.post('/export/customer', salesAnalyticsController.exportCustomerSalesReport.bind(salesAnalyticsController));

// Product Performance
router.get('/analytics/products', salesAnalyticsController.getProductSalesPerformance.bind(salesAnalyticsController));
router.get('/analytics/categories', salesAnalyticsController.getCategorySalesPerformance.bind(salesAnalyticsController));

// Sales Trends and Forecasting
router.get('/analytics/trends', salesAnalyticsController.getSalesTrends.bind(salesAnalyticsController));

// Customer Segmentation
router.get('/analytics/segmentation', salesAnalyticsController.getCustomerSegmentation.bind(salesAnalyticsController));

// Sales Team Performance
router.get('/analytics/team', salesAnalyticsController.getSalesTeamPerformance.bind(salesAnalyticsController));

export default router;
