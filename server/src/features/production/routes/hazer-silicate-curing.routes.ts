import { Router } from 'express';
import { HazerSilicateCuringController } from '../controllers/HazerSilicateCuringController';
import { authenticate } from '../../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Lazy load controller to prevent hang on server start
let controller: HazerSilicateCuringController | null = null;
const getController = () => {
  if (!controller) {
    controller = new HazerSilicateCuringController();
  }
  return controller;
};

/**
 * @route   POST /api/v1/production/hazer-silicate-curing
 * @desc    Create a new Hazer/Silicate/Curing entry
 * @access  Private
 */
router.post('/', (req, res) => getController().create(req, res));

/**
 * @route   GET /api/v1/production/hazer-silicate-curing
 * @desc    Get all process entries
 * @access  Private
 */
router.get('/', (req, res) => getController().getAll(req, res));

/**
 * @route   GET /api/v1/production/hazer-silicate-curing/wip
 * @desc    Get process WIP
 * @access  Private
 */
router.get('/wip', (req, res) => getController().getWIP(req, res));

/**
 * @route   GET /api/v1/production/hazer-silicate-curing/:id
 * @desc    Get process entry by ID
 * @access  Private
 */
router.get('/:id', (req, res) => getController().getById(req, res));

/**
 * @route   PUT /api/v1/production/hazer-silicate-curing/:id
 * @desc    Update process entry
 * @access  Private
 */
router.put('/:id', (req, res) => getController().update(req, res));

/**
 * @route   PUT /api/v1/production/hazer-silicate-curing/:id/output
 * @desc    Update process output (processed, loss meters)
 * @access  Private
 */
router.put('/:id/output', (req, res) => getController().updateOutput(req, res));

export const hazerSilicateCuringRoutes = router;
