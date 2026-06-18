import { Router } from 'express';
import { WashingController } from '../controllers/WashingController';
import { authenticate } from '../../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Lazy load controller to prevent hang on server start
let controller: WashingController | null = null;
const getController = () => {
  if (!controller) {
    controller = new WashingController();
  }
  return controller;
};

/**
 * @route   POST /api/v1/production/washing
 * @desc    Create a new washing entry
 * @access  Private
 */
router.post('/', (req, res) => getController().create(req, res));

/**
 * @route   GET /api/v1/production/washing
 * @desc    Get all washing entries
 * @access  Private
 */
router.get('/', (req, res) => getController().getAll(req, res));

/**
 * @route   GET /api/v1/production/washing/wip
 * @desc    Get washing WIP
 * @access  Private
 */
router.get('/wip', (req, res) => getController().getWIP(req, res));

/**
 * @route   GET /api/v1/production/washing/:id
 * @desc    Get washing entry by ID
 * @access  Private
 */
router.get('/:id', (req, res) => getController().getById(req, res));

/**
 * @route   PUT /api/v1/production/washing/:id
 * @desc    Update washing entry
 * @access  Private
 */
router.put('/:id', (req, res) => getController().update(req, res));

/**
 * @route   PUT /api/v1/production/washing/:id/output
 * @desc    Update washing output (washed, shrinkage meters)
 * @access  Private
 */
router.put('/:id/output', (req, res) => getController().updateOutput(req, res));

export const washingRoutes = router;
