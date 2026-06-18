import { Router } from 'express';
import { PurchaseController } from '../../controllers/PurchaseController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const purchaseController = new PurchaseController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/v1/purchase/stats
 * @desc    Get purchase statistics with company ID support
 * @access  Private
 */
router.get('/stats', purchaseController.getPurchaseStats.bind(purchaseController));

/**
 * @route   GET /api/v1/purchase/analytics
 * @desc    Get purchase analytics (combined overview + analytics)
 * @access  Private
 */
router.get('/analytics', purchaseController.getPurchaseAnalytics.bind(purchaseController));

/**
 * @route   GET /api/v1/purchase/orders
 * @desc    Get purchase orders with company ID filtering
 * @access  Private
 */
router.get('/orders', purchaseController.getPurchaseOrders.bind(purchaseController));

/**
 * @route   POST /api/v1/purchase/orders
 * @desc    Create a new purchase order with company ID handling
 * @access  Private
 */
router.post('/orders', purchaseController.createPurchaseOrder.bind(purchaseController));

/**
 * @route   GET /api/v1/purchase/orders/:id
 * @desc    Get purchase order by ID
 * @access  Private
 */
router.get('/orders/:id', purchaseController.getPurchaseOrderById.bind(purchaseController));

/**
 * @route   PUT /api/v1/purchase/orders/:id
 * @desc    Update purchase order
 * @access  Private
 */
router.put('/orders/:id', purchaseController.updatePurchaseOrder.bind(purchaseController));

/**
 * @route   DELETE /api/v1/purchase/orders/:id
 * @desc    Delete purchase order
 * @access  Private
 */
router.delete('/orders/:id', purchaseController.deletePurchaseOrder.bind(purchaseController));

/**
 * @route   PUT /api/v1/purchase/orders/:id/payment
 * @desc    Update purchase order payment status
 * @access  Private
 */
router.put('/orders/:id/payment', purchaseController.updatePaymentStatus.bind(purchaseController));

/**
 * @route   PUT /api/v1/purchase/orders/bulk-update
 * @desc    Bulk update purchase orders
 * @access  Private
 */
router.put('/orders/bulk-update', purchaseController.bulkUpdateOrders.bind(purchaseController));

/**
 * @route   GET /api/v1/purchase/orders/status/:status
 * @desc    Get purchase orders by status
 * @access  Private
 */
router.get('/orders/status/:status', purchaseController.getOrdersByStatus.bind(purchaseController));

/**
 * @route   GET /api/v1/purchase/orders/supplier/:supplierId
 * @desc    Get purchase orders by supplier
 * @access  Private
 */
router.get('/orders/supplier/:supplierId', purchaseController.getOrdersBySupplier.bind(purchaseController));

/**
 * @route   GET /api/v1/purchase/supplier-report
 * @desc    Get supplier purchase report
 * @access  Private
 */
router.get('/supplier-report', purchaseController.getSupplierReport.bind(purchaseController));

/**
 * @route   GET /api/v1/purchase/category-spend
 * @desc    Get category-wise spend analysis
 * @access  Private
 */
router.get('/category-spend', purchaseController.getCategorySpend.bind(purchaseController));

/**
 * @route   POST /api/v1/purchase/export/:format
 * @desc    Export purchase data
 * @access  Private
 */
router.post('/export/:format', purchaseController.exportPurchaseData.bind(purchaseController));

export default router;