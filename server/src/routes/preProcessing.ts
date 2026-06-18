import express from 'express';
import { PreProcessingController } from '../controllers/PreProcessingController';
import { authenticate } from '../middleware/auth';
import { body, param, query, validationResult } from 'express-validator';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Validation middleware function
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Validation middleware
const validateBatchId = [
  param('id').isMongoId().withMessage('Invalid batch ID')
];

const validateStatusUpdate = [
  param('id').isMongoId().withMessage('Invalid batch ID'),
  body('status').isIn(['pending', 'in_progress', 'completed', 'on_hold', 'cancelled', 'quality_hold'])
    .withMessage('Invalid status'),
  body('notes').optional().isString().withMessage('Notes must be a string')
];

const validateBatchCreation = [
  body('productionOrderId').optional().custom((value) => {
    if (value && value !== '') {
      return require('mongoose').Types.ObjectId.isValid(value);
    }
    return true;
  }).withMessage('Invalid production order ID'),
  body('productionOrderNumber').optional().custom((value) => {
    if (value && value !== '') {
      return typeof value === 'string' && value.trim().length > 0;
    }
    return true;
  }).withMessage('Production order number must be a non-empty string'),
  body('greyFabricInwardId').optional().custom((value) => {
    if (value && value !== '') {
      return require('mongoose').Types.ObjectId.isValid(value);
    }
    return true;
  }).withMessage('Invalid grey fabric inward ID'),
  body('grnNumber').optional().custom((value) => {
    if (value && value !== '') {
      return typeof value === 'string' && value.trim().length > 0;
    }
    return true;
  }).withMessage('GRN number must be a non-empty string'),
  body('processType').isIn(['desizing', 'bleaching', 'scouring', 'mercerizing', 'combined'])
    .withMessage('Invalid process type'),
  body('processName').notEmpty().withMessage('Process name is required'),
  body('inputMaterials').isArray().withMessage('Input materials array is required'),
  body('chemicalRecipe').isObject().withMessage('Chemical recipe is required'),
  body('processParameters').isObject().withMessage('Process parameters are required'),
  body('machineAssignment').isObject().withMessage('Machine assignment is required'),
  body('workerAssignment').isObject().withMessage('Worker assignment is required'),
  body('timing').isObject().withMessage('Timing information is required'),
  body('qualityControl').isObject().withMessage('Quality control information is required'),
  body('outputMaterial').isObject().withMessage('Output material information is required'),
  body('wasteManagement').isObject().withMessage('Waste management information is required'),
  body('costs').isObject().withMessage('Cost information is required')
];

const validateBatchUpdate = [
  param('id').isMongoId().withMessage('Invalid batch ID'),
  body('processParameters').optional().isObject(),
  body('qualityControl').optional().isObject(),
  body('outputMaterial').optional().isObject(),
  body('costs').optional().isObject(),
  body('notes').optional().isString(),
  body('specialInstructions').optional().isString()
];

const validateQueryParams = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'in_progress', 'completed', 'on_hold', 'cancelled', 'quality_hold'])
    .withMessage('Invalid status filter'),
  query('processType').optional().isIn(['desizing', 'bleaching', 'scouring', 'mercerizing', 'combined'])
    .withMessage('Invalid process type filter')
];

// Routes
router.get('/', validateQueryParams, validateRequest, PreProcessingController.getAllPreProcessingBatches);
router.get('/analytics', PreProcessingController.getPreProcessingAnalytics);
router.get('/:id', validateBatchId, validateRequest, PreProcessingController.getPreProcessingBatch);
router.post('/', validateBatchCreation, validateRequest, PreProcessingController.createPreProcessingBatch);
router.put('/:id', validateBatchUpdate, validateRequest, PreProcessingController.updatePreProcessingBatch);
router.patch('/:id/status', validateStatusUpdate, validateRequest, PreProcessingController.updatePreProcessingStatus);
router.delete('/:id', validateBatchId, validateRequest, PreProcessingController.deletePreProcessingBatch);

export default router;
