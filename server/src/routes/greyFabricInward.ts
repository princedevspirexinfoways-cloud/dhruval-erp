import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth';

const router = Router();
// ✅ FIXED: Use lazy instantiation instead of immediate instantiation
// This prevents the controller from being created when the module is imported

// Apply authentication middleware to all routes
router.use(authenticate);

// Validation middleware
const validateCreate = [
  body('productionOrderId').isMongoId().withMessage('Valid production order ID is required'),
  body('supplierId').isMongoId().withMessage('Valid supplier ID is required'),
  body('fabricType').notEmpty().withMessage('Fabric type is required'),
  body('fabricColor').notEmpty().withMessage('Fabric color is required'),
  body('fabricWeight').isFloat({ min: 0 }).withMessage('Fabric weight must be a positive number'),
  body('fabricWidth').isFloat({ min: 0 }).withMessage('Fabric width must be a positive number'),
  body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
  body('unit').isIn(['meters', 'yards', 'pieces']).withMessage('Unit must be meters, yards, or pieces'),
  body('quality').isIn(['A+', 'A', 'B+', 'B', 'C', 'D']).withMessage('Quality must be A+, A, B+, B, C, or D'),
  body('expectedAt').optional().isISO8601().withMessage('Expected date must be a valid ISO date'),
  body('remarks').optional().isString().withMessage('Remarks must be a string'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('costBreakdown.fabricCost').optional().isFloat({ min: 0 }).withMessage('Fabric cost must be a positive number'),
  body('costBreakdown.transportationCost').optional().isFloat({ min: 0 }).withMessage('Transportation cost must be a positive number'),
  body('costBreakdown.inspectionCost').optional().isFloat({ min: 0 }).withMessage('Inspection cost must be a positive number')
];

const validateUpdate = [
  param('id').isMongoId().withMessage('Valid GRN ID is required'),
  body('fabricType').optional().notEmpty().withMessage('Fabric type cannot be empty'),
  body('fabricColor').optional().notEmpty().withMessage('Fabric color cannot be empty'),
  body('fabricWeight').optional().isFloat({ min: 0 }).withMessage('Fabric weight must be a positive number'),
  body('fabricWidth').optional().isFloat({ min: 0 }).withMessage('Fabric width must be a positive number'),
  body('quantity').optional().isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
  body('unit').optional().isIn(['meters', 'yards', 'pieces']).withMessage('Unit must be meters, yards, or pieces'),
  body('quality').optional().isIn(['A+', 'A', 'B+', 'B', 'C', 'D']).withMessage('Quality must be A+, A, B+, B, C, or D'),
  body('status').optional().isIn(['pending', 'in_transit', 'received', 'rejected']).withMessage('Status must be pending, in_transit, received, or rejected'),
  body('receivedAt').optional().isISO8601().withMessage('Received date must be a valid ISO date'),
  body('expectedAt').optional().isISO8601().withMessage('Expected date must be a valid ISO date'),
  body('remarks').optional().isString().withMessage('Remarks must be a string'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('costBreakdown.fabricCost').optional().isFloat({ min: 0 }).withMessage('Fabric cost must be a positive number'),
  body('costBreakdown.transportationCost').optional().isFloat({ min: 0 }).withMessage('Transportation cost must be a positive number'),
  body('costBreakdown.inspectionCost').optional().isFloat({ min: 0 }).withMessage('Inspection cost must be a positive number')
];

const validateMarkAsReceived = [
  param('id').isMongoId().withMessage('Valid GRN ID is required'),
  body('receivedAt').optional().isISO8601().withMessage('Received date must be a valid ISO date'),
  body('qualityChecks').optional().isArray().withMessage('Quality checks must be an array')
];

const validateQualityCheck = [
  param('id').isMongoId().withMessage('Valid GRN ID is required'),
  body('parameters.colorFastness').isFloat({ min: 0, max: 5 }).withMessage('Color fastness must be between 0 and 5'),
  body('parameters.tensileStrength').isFloat({ min: 0 }).withMessage('Tensile strength must be a positive number'),
  body('parameters.tearStrength').isFloat({ min: 0 }).withMessage('Tear strength must be a positive number'),
  body('parameters.shrinkage').isFloat({ min: 0, max: 100 }).withMessage('Shrinkage must be between 0 and 100'),
  body('defects').optional().isArray().withMessage('Defects must be an array'),
  body('notes').optional().isString().withMessage('Notes must be a string')
];

const validateQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'in_transit', 'received', 'rejected']).withMessage('Invalid status'),
  query('quality').optional().isIn(['A+', 'A', 'B+', 'B', 'C', 'D']).withMessage('Invalid quality'),
  query('fabricType').optional().isString().withMessage('Fabric type must be a string'),
  query('supplierId').optional().isMongoId().withMessage('Invalid supplier ID'),
  query('dateFrom').optional().isISO8601().withMessage('Date from must be a valid ISO date'),
  query('dateTo').optional().isISO8601().withMessage('Date to must be a valid ISO date'),
  query('search').optional().isString().withMessage('Search must be a string')
];

const validateAnalytics = [
  query('period').optional().isIn(['7d', '30d', '90d']).withMessage('Period must be 7d, 30d, or 90d'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date')
];

const validateAddLot = [
  param('id').isMongoId().withMessage('Valid GRN ID is required'),
  body('lotData.lotNumber').notEmpty().withMessage('Lot number is required'),
  body('lotData.lotQuantity').isFloat({ min: 0 }).withMessage('Lot quantity must be a positive number'),
  body('lotData.lotUnit').isIn(['meters', 'yards', 'pieces']).withMessage('Lot unit must be meters, yards, or pieces'),
  body('lotData.qualityGrade').optional().isIn(['A+', 'A', 'B+', 'B', 'C']).withMessage('Quality grade must be A+, A, B+, B, or C'),
  body('lotData.costPerUnit').optional().isFloat({ min: 0 }).withMessage('Cost per unit must be a positive number'),
  body('lotData.warehouseId').optional().isMongoId().withMessage('Valid warehouse ID is required'),
  body('lotData.expiryDate').optional().isISO8601().withMessage('Expiry date must be a valid ISO date')
];

const validateUpdateLotStatus = [
  param('id').isMongoId().withMessage('Valid GRN ID is required'),
  param('lotNumber').notEmpty().withMessage('Lot number is required'),
  body('status').isIn(['active', 'consumed', 'damaged', 'reserved']).withMessage('Status must be active, consumed, damaged, or reserved'),
  body('remarks').optional().isString().withMessage('Remarks must be a string')
];

const validateStockSummary = [
  query('fabricType').optional().isString().withMessage('Fabric type must be a string'),
  query('color').optional().isString().withMessage('Color must be a string'),
  query('gsm').optional().isFloat({ min: 0 }).withMessage('GSM must be a positive number')
];

// Routes
router.get('/', validateQuery, async (req, res) => {
  try {
    const { GreyFabricInwardController } = await import('../controllers/GreyFabricInwardController');
    const controller = new GreyFabricInwardController();
    await controller.getAll(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.get('/analytics', validateAnalytics, async (req, res) => {
  try {
    const { GreyFabricInwardController } = await import('../controllers/GreyFabricInwardController');
    const controller = new GreyFabricInwardController();
    await controller.getAnalytics(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.get('/:id', param('id').isMongoId().withMessage('Valid GRN ID is required'), async (req, res) => {
  try {
    const { GreyFabricInwardController } = await import('../controllers/GreyFabricInwardController');
    const controller = new GreyFabricInwardController();
    await controller.getById(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.post('/', validateCreate, async (req, res) => {
  try {
    const { GreyFabricInwardController } = await import('../controllers/GreyFabricInwardController');
    const controller = new GreyFabricInwardController();
    await controller.create(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.put('/:id', validateUpdate, async (req, res) => {
  try {
    const { GreyFabricInwardController } = await import('../controllers/GreyFabricInwardController');
    const controller = new GreyFabricInwardController();
    await controller.update(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.delete('/:id', param('id').isMongoId().withMessage('Valid GRN ID is required'), async (req, res) => {
  try {
    const { GreyFabricInwardController } = await import('../controllers/GreyFabricInwardController');
    const controller = new GreyFabricInwardController();
    await controller.delete(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.post('/:id/receive', validateMarkAsReceived, async (req, res) => {
  try {
    const { GreyFabricInwardController } = await import('../controllers/GreyFabricInwardController');
    const controller = new GreyFabricInwardController();
    await controller.markAsReceived(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.post('/:id/quality-check', validateQualityCheck, async (req, res) => {
  try {
    const { GreyFabricInwardController } = await import('../controllers/GreyFabricInwardController');
    const controller = new GreyFabricInwardController();
    await controller.addQualityCheck(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// New Grey Stock Management Routes

// Get stock summary
router.get('/stock/summary', validateStockSummary, async (req, res) => {
  try {
    const { GreyFabricInwardController } = await import('../controllers/GreyFabricInwardController');
    const controller = new GreyFabricInwardController();
    await controller.getStockSummary(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get lot details for a specific entry
router.get('/:id/lots', param('id').isMongoId().withMessage('Valid GRN ID is required'), async (req, res) => {
  try {
    const { GreyFabricInwardController } = await import('../controllers/GreyFabricInwardController');
    const controller = new GreyFabricInwardController();
    await controller.getLotDetails(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Add new lot to existing entry
router.post('/:id/lots', validateAddLot, async (req, res) => {
  try {
    const { GreyFabricInwardController } = await import('../controllers/GreyFabricInwardController');
    const controller = new GreyFabricInwardController();
    await controller.addLot(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update lot status
router.put('/:id/lots/:lotNumber/status', validateUpdateLotStatus, async (req, res) => {
  try {
    const { GreyFabricInwardController } = await import('../controllers/GreyFabricInwardController');
    const controller = new GreyFabricInwardController();
    await controller.updateLotStatus(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Client Material Management Routes

// Get all clients material summary
router.get('/client-materials/summary', async (req, res) => {
  try {
    const { GreyFabricInwardController } = await import('../controllers/GreyFabricInwardController');
    const controller = new GreyFabricInwardController();
    await controller.getAllClientsMaterialSummary(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get specific client material summary
router.get('/client-materials/summary/:clientId', async (req, res) => {
  try {
    const { GreyFabricInwardController } = await import('../controllers/GreyFabricInwardController');
    const controller = new GreyFabricInwardController();
    await controller.getClientMaterialSummary(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get client material balance
router.get('/client-materials/balance/:clientId', async (req, res) => {
  try {
    const { GreyFabricInwardController } = await import('../controllers/GreyFabricInwardController');
    const controller = new GreyFabricInwardController();
    await controller.getClientMaterialBalance(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get client material history
router.get('/client-materials/history/:clientId', async (req, res) => {
  try {
    const { GreyFabricInwardController } = await import('../controllers/GreyFabricInwardController');
    const controller = new GreyFabricInwardController();
    await controller.getClientMaterialHistory(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get client materials for return
router.get('/client-materials/for-return', async (req, res) => {
  try {
    const { GreyFabricInwardController } = await import('../controllers/GreyFabricInwardController');
    const controller = new GreyFabricInwardController();
    await controller.getClientMaterialsForReturn(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Return client material
router.post('/:id/return-client-material', [
  param('id').isMongoId().withMessage('Valid GRN ID is required'),
  body('returnQuantity').isFloat({ min: 0 }).withMessage('Return quantity must be a positive number'),
  body('returnReason').notEmpty().withMessage('Return reason is required'),
  body('returnDate').optional().isISO8601().withMessage('Return date must be a valid ISO date'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    const { GreyFabricInwardController } = await import('../controllers/GreyFabricInwardController');
    const controller = new GreyFabricInwardController();
    await controller.returnClientMaterial(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Production Output Management Routes

// Add production output for client material
router.post('/:id/production-output', [
  param('id').isMongoId().withMessage('Valid GRN ID is required'),
  body('productionOrderId').isMongoId().withMessage('Valid production order ID is required'),
  body('productionOrderNumber').notEmpty().withMessage('Production order number is required'),
  body('outputQuantity').isFloat({ min: 0 }).withMessage('Output quantity must be a positive number'),
  body('outputUnit').isIn(['meters', 'yards', 'pieces', 'kg', 'tons']).withMessage('Invalid output unit'),
  body('outputType').isIn(['finished_goods', 'semi_finished', 'waste']).withMessage('Invalid output type'),
  body('qualityGrade').isIn(['A+', 'A', 'B+', 'B', 'C']).withMessage('Invalid quality grade'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    const { GreyFabricInwardController } = await import('../controllers/GreyFabricInwardController');
    const controller = new GreyFabricInwardController();
    await controller.addProductionOutput(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update production output status
router.put('/:id/production-output/:productionOrderId/status', [
  param('id').isMongoId().withMessage('Valid GRN ID is required'),
  param('productionOrderId').isMongoId().withMessage('Valid production order ID is required'),
  body('status').isIn(['pending', 'completed', 'returned_to_client', 'kept_as_stock']).withMessage('Invalid status'),
  body('clientReturnQuantity').optional().isFloat({ min: 0 }).withMessage('Client return quantity must be a positive number'),
  body('keptAsStockQuantity').optional().isFloat({ min: 0 }).withMessage('Kept as stock quantity must be a positive number'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    const { GreyFabricInwardController } = await import('../controllers/GreyFabricInwardController');
    const controller = new GreyFabricInwardController();
    await controller.updateProductionOutputStatus(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update material consumption
router.put('/:id/material-consumption', [
  param('id').isMongoId().withMessage('Valid GRN ID is required'),
  body('consumedQuantity').isFloat({ min: 0 }).withMessage('Consumed quantity must be a positive number'),
  body('wasteQuantity').isFloat({ min: 0 }).withMessage('Waste quantity must be a positive number'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    const { GreyFabricInwardController } = await import('../controllers/GreyFabricInwardController');
    const controller = new GreyFabricInwardController();
    await controller.updateMaterialConsumption(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;
