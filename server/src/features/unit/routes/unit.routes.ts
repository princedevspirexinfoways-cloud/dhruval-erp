import { Router } from 'express';
import { UnitController } from '../controllers/UnitController';
import { authenticate } from '../../../middleware/auth';

const router = Router();
const unitController = new UnitController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v1/units
 * @desc    Create a new unit
 * @access  Private
 */
router.post('/', unitController.createUnit);

/**
 * @route   GET /api/v1/units
 * @desc    Get all units by company
 * @access  Private
 */
router.get('/', unitController.getUnitsByCompany);

/**
 * @route   POST /api/v1/units/convert
 * @desc    Convert quantity between units
 * @access  Private
 */
router.post('/convert', unitController.convertQuantity);

/**
 * @route   GET /api/v1/units/:id
 * @desc    Get unit by ID
 * @access  Private
 */
router.get('/:id', unitController.getUnitById);

/**
 * @route   PUT /api/v1/units/:id
 * @desc    Update unit
 * @access  Private
 */
router.put('/:id', unitController.updateUnit);

/**
 * @route   DELETE /api/v1/units/:id
 * @desc    Delete unit (soft delete)
 * @access  Private
 */
router.delete('/:id', unitController.deleteUnit);

export default router;
