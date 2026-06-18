import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();
// ✅ FIXED: Use lazy instantiation instead of immediate instantiation
// This prevents the controller from being created when the module is imported

router.use(authenticate);

// Supplier Purchase Analytics
router.get('/analytics', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { PurchaseAnalyticsController } = await import('../../controllers/PurchaseAnalyticsController');
    const purchaseAnalyticsController = new PurchaseAnalyticsController();
    await purchaseAnalyticsController.getSupplierPurchaseAnalytics(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
router.get('/reports/supplier', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { PurchaseAnalyticsController } = await import('../../controllers/PurchaseAnalyticsController');
    const purchaseAnalyticsController = new PurchaseAnalyticsController();
    await purchaseAnalyticsController.getSupplierPurchaseReport(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
router.post('/export/supplier', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { PurchaseAnalyticsController } = await import('../../controllers/PurchaseAnalyticsController');
    const purchaseAnalyticsController = new PurchaseAnalyticsController();
    await purchaseAnalyticsController.exportSupplierPurchaseReport(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Category Performance
router.get('/analytics/categories', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { PurchaseAnalyticsController } = await import('../../controllers/PurchaseAnalyticsController');
    const purchaseAnalyticsController = new PurchaseAnalyticsController();
    await purchaseAnalyticsController.getCategoryPurchasePerformance(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Material Tracking
router.get('/analytics/chemicals', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { PurchaseAnalyticsController } = await import('../../controllers/PurchaseAnalyticsController');
    const purchaseAnalyticsController = new PurchaseAnalyticsController();
    await purchaseAnalyticsController.getChemicalsPurchaseTracking(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
router.get('/analytics/fabrics', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { PurchaseAnalyticsController } = await import('../../controllers/PurchaseAnalyticsController');
    const purchaseAnalyticsController = new PurchaseAnalyticsController();
    await purchaseAnalyticsController.getGreyFabricPurchaseTracking(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
router.get('/analytics/packing', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { PurchaseAnalyticsController } = await import('../../controllers/PurchaseAnalyticsController');
    const purchaseAnalyticsController = new PurchaseAnalyticsController();
    await purchaseAnalyticsController.getPackingMaterialPurchaseTracking(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Trends and Analysis
router.get('/analytics/trends', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { PurchaseAnalyticsController } = await import('../../controllers/PurchaseAnalyticsController');
    const purchaseAnalyticsController = new PurchaseAnalyticsController();
    await purchaseAnalyticsController.getPurchaseTrends(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
router.get('/analytics/supplier-performance', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { PurchaseAnalyticsController } = await import('../../controllers/PurchaseAnalyticsController');
    const purchaseAnalyticsController = new PurchaseAnalyticsController();
    await purchaseAnalyticsController.getSupplierPerformanceAnalysis(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
router.get('/analytics/cost-analysis', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { PurchaseAnalyticsController } = await import('../../controllers/PurchaseAnalyticsController');
    const purchaseAnalyticsController = new PurchaseAnalyticsController();
    await purchaseAnalyticsController.getPurchaseCostAnalysis(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;
