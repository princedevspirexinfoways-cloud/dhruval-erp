import { Router } from 'express';
import { PackingController } from '../controllers/PackingController';
import { authenticate } from '../../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Lazy load controller to prevent hang on server start
let controller: PackingController | null = null;
const getController = () => {
  if (!controller) {
    controller = new PackingController();
  }
  return controller;
};

/**
 * @route   POST /api/v1/production/packing
 * @desc    Create a new packing entry
 * @access  Private
 */
router.post('/', (req, res) => getController().create(req, res));

/**
 * @route   GET /api/v1/production/packing
 * @desc    Get all packing entries
 * @access  Private
 */
router.get('/', (req, res) => getController().getAll(req, res));

/**
 * @route   GET /api/v1/production/packing/dispatch-ready
 * @desc    Get dispatch ready packings
 * @access  Private
 */
router.get('/dispatch-ready', (req, res) => getController().getDispatchReady(req, res));

/**
 * @route   GET /api/v1/production/packing/:id
 * @desc    Get packing entry by ID
 * @access  Private
 */
router.get('/:id', (req, res) => getController().getById(req, res));

/**
 * @route   PUT /api/v1/production/packing/:id
 * @desc    Update packing entry
 * @access  Private
 */
router.put('/:id', (req, res) => getController().update(req, res));

/**
 * @route   PUT /api/v1/production/packing/:id/packing
 * @desc    Update packing (packed bale, meter)
 * @access  Private
 */
router.put('/:id/packing', (req, res) => getController().updatePacking(req, res));

export const packingRoutes = router;
