import { Router } from 'express';
import { FeltController } from '../controllers/FeltController';
import { authenticate } from '../../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Lazy load controller to prevent hang on server start
let controller: FeltController | null = null;
const getController = () => {
  if (!controller) {
    controller = new FeltController();
  }
  return controller;
};

/**
 * @route   POST /api/v1/production/felt
 * @desc    Create a new felt entry
 * @access  Private
 */
router.post('/', (req, res) => getController().create(req, res));

/**
 * @route   GET /api/v1/production/felt
 * @desc    Get all felt entries
 * @access  Private
 */
router.get('/', (req, res) => getController().getAll(req, res));

/**
 * @route   GET /api/v1/production/felt/active
 * @desc    Get active felts (in_felt status)
 * @access  Private
 */
router.get('/active', (req, res) => getController().getActive(req, res));

/**
 * @route   GET /api/v1/production/felt/:id
 * @desc    Get felt entry by ID
 * @access  Private
 */
router.get('/:id', (req, res) => getController().getById(req, res));

/**
 * @route   PUT /api/v1/production/felt/:id
 * @desc    Update felt entry
 * @access  Private
 */
router.put('/:id', (req, res) => getController().update(req, res));

/**
 * @route   POST /api/v1/production/felt/:id/complete
 * @desc    Complete felt process
 * @access  Private
 */
router.post('/:id/complete', (req, res) => getController().completeFelt(req, res));

export const feltRoutes = router;
