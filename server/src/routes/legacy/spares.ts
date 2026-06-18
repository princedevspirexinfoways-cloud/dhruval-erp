import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { SpareController } from '../controllers/SpareController';
import { authenticate } from '../middleware/auth';

const router = Router();
const spareController = new SpareController();

// Apply authentication middleware to all routes
router.use(authenticate);

// Validation middleware
const createSpareValidation = [
  body('spareCode')
    .notEmpty()
    .withMessage('Spare code is required')
    .isLength({ max: 100 })
    .withMessage('Spare code must be less than 100 characters'),
  body('spareName')
    .notEmpty()
    .withMessage('Spare name is required')
    .isLength({ max: 255 })
    .withMessage('Spare name must be less than 255 characters'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['mechanical', 'electrical', 'electronic', 'hydraulic', 'pneumatic', 'consumable', 'tool', 'safety', 'other'])
    .withMessage('Invalid category'),
  body('partNumber')
    .notEmpty()
    .withMessage('Part number is required')
    .isLength({ max: 100 })
    .withMessage('Part number must be less than 100 characters'),
  body('manufacturer')
    .notEmpty()
    .withMessage('Manufacturer is required')
    .isLength({ max: 100 })
    .withMessage('Manufacturer must be less than 100 characters'),
  body('stock.unit')
    .notEmpty()
    .withMessage('Stock unit is required'),
  body('stock.reorderLevel')
    .isNumeric()
    .withMessage('Reorder level must be a number')
    .isFloat({ min: 0 })
    .withMessage('Reorder level must be non-negative'),
  body('stock.minStockLevel')
    .isNumeric()
    .withMessage('Minimum stock level must be a number')
    .isFloat({ min: 0 })
    .withMessage('Minimum stock level must be non-negative'),
  body('stock.maxStockLevel')
    .isNumeric()
    .withMessage('Maximum stock level must be a number')
    .isFloat({ min: 0 })
    .withMessage('Maximum stock level must be non-negative'),
  body('maintenance.criticality')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid criticality level')
];

const updateSpareValidation = [
  body('spareCode')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Spare code must be less than 100 characters'),
  body('spareName')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Spare name must be less than 255 characters'),
  body('category')
    .optional()
    .isIn(['mechanical', 'electrical', 'electronic', 'hydraulic', 'pneumatic', 'consumable', 'tool', 'safety', 'other'])
    .withMessage('Invalid category'),
  body('partNumber')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Part number must be less than 100 characters'),
  body('manufacturer')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Manufacturer must be less than 100 characters'),
  body('maintenance.criticality')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid criticality level')
];

const stockUpdateValidation = [
  body('quantity')
    .isNumeric()
    .withMessage('Quantity must be a number')
    .isFloat({ min: 0 })
    .withMessage('Quantity must be non-negative'),
  body('type')
    .isIn(['inward', 'outward', 'adjustment'])
    .withMessage('Invalid stock update type'),
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters')
];

const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid spare ID')
];

const spareCodeValidation = [
  param('spareCode')
    .notEmpty()
    .withMessage('Spare code is required')
];

const categoryValidation = [
  param('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['mechanical', 'electrical', 'electronic', 'hydraulic', 'pneumatic', 'consumable', 'tool', 'safety', 'other'])
    .withMessage('Invalid category')
];

/**
 * @route   POST /api/v1/spares
 * @desc    Create a new spare
 * @access  Private
 */
router.post('/', createSpareValidation, spareController.createSpare.bind(spareController));

/**
 * @route   GET /api/v1/spares
 * @desc    Get spares by company with filtering and pagination
 * @access  Private
 */
router.get('/', spareController.getSparesByCompany.bind(spareController));

/**
 * @route   GET /api/v1/spares/stats
 * @desc    Get spare statistics
 * @access  Private
 */
router.get('/stats', spareController.getSpareStats.bind(spareController));

/**
 * @route   GET /api/v1/spares/low-stock
 * @desc    Get low stock spares
 * @access  Private
 */
router.get('/low-stock', spareController.getLowStockSpares.bind(spareController));

/**
 * @route   GET /api/v1/spares/category/:category
 * @desc    Get spares by category
 * @access  Private
 */
router.get('/category/:category', categoryValidation, spareController.getSparesByCategory.bind(spareController));

/**
 * @route   GET /api/v1/spares/check-code/:spareCode
 * @desc    Check spare code uniqueness
 * @access  Private
 */
router.get('/check-code/:spareCode', spareCodeValidation, spareController.checkSpareCodeUnique.bind(spareController));

/**
 * @route   GET /api/v1/spares/:id
 * @desc    Get spare by ID
 * @access  Private
 */
router.get('/:id', idValidation, spareController.getSpareById.bind(spareController));

/**
 * @route   PUT /api/v1/spares/:id
 * @desc    Update spare
 * @access  Private
 */
router.put('/:id', [...idValidation, ...updateSpareValidation], spareController.updateSpare.bind(spareController));

/**
 * @route   POST /api/v1/spares/:spareId/stock
 * @desc    Update spare stock
 * @access  Private
 */
router.post('/:spareId/stock', [
  param('spareId').isMongoId().withMessage('Invalid spare ID'),
  ...stockUpdateValidation
], spareController.updateStock.bind(spareController));

/**
 * @route   DELETE /api/v1/spares/:id
 * @desc    Delete spare
 * @access  Private
 */
router.delete('/:id', idValidation, spareController.deleteSpare.bind(spareController));

export default router;
