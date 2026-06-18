import { Router } from 'express';
import { FinishingController } from '../controllers/FinishingController';
import { authenticate } from '../../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Lazy load controller to prevent hang on server start
let controller: FinishingController | null = null;
const getController = () => {
  if (!controller) {
    controller = new FinishingController();
  }
  return controller;
};

/**
 * @route   POST /api/v1/production/finishing
 * @desc    Create a new finishing entry
 * @access  Private
 */
router.post('/', (req, res) => getController().create(req, res));

/**
 * @route   GET /api/v1/production/finishing
 * @desc    Get all finishing entries
 * @access  Private
 */
router.get('/', (req, res) => getController().getAll(req, res));

/**
 * @route   GET /api/v1/production/finishing/wip
 * @desc    Get finishing WIP
 * @access  Private
 */
router.get('/wip', (req, res) => getController().getWIP(req, res));

/**
 * @route   GET /api/v1/production/finishing/:id
 * @desc    Get finishing entry by ID
 * @access  Private
 */
router.get('/:id', (req, res) => getController().getById(req, res));

/**
 * @route   PUT /api/v1/production/finishing/:id
 * @desc    Update finishing entry
 * @access  Private
 */
router.put('/:id', (req, res) => getController().update(req, res));

/**
 * @route   PUT /api/v1/production/finishing/:id/output
 * @desc    Update finishing output (finished, rejected meters)
 * @access  Private
 */
router.put('/:id/output', (req, res) => getController().updateOutput(req, res));

export const finishingRoutes = router;
