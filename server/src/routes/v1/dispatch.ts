import { Router } from 'express';
import { DispatchController } from '../../controllers/DispatchController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const dispatchController = new DispatchController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v2/dispatch
 * @desc    Create a new dispatch entry
 * @access  Private
 */
router.post('/', dispatchController.createDispatch.bind(dispatchController));

/**
 * @route   GET /api/v2/dispatch
 * @desc    Get dispatches by company with pagination and filters
 * @access  Private
 */
router.get('/', dispatchController.getDispatchesByCompany.bind(dispatchController));

/**
 * @route   GET /api/v2/dispatch/stats
 * @desc    Get dispatch statistics
 * @access  Private
 */
router.get('/stats', dispatchController.getDispatchStats.bind(dispatchController));

/**
 * @route   PUT /api/v2/dispatch/:dispatchId/status
 * @desc    Update dispatch status
 * @access  Private
 */
router.put('/:dispatchId/status', dispatchController.updateDispatchStatus.bind(dispatchController));

/**
 * @route   GET /api/v2/dispatch/:id
 * @desc    Get dispatch by ID
 * @access  Private
 */
router.get('/:id', dispatchController.getDispatchById.bind(dispatchController));

/**
 * @route   PUT /api/v2/dispatch/:id
 * @desc    Update dispatch
 * @access  Private
 */
router.put('/:id', dispatchController.updateDispatch.bind(dispatchController));

export default router;
