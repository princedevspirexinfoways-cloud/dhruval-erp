import { Router } from 'express';
import { PrintingController } from '../controllers/PrintingController';
import { authenticate } from '../../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Lazy load controller to prevent hang on server start
let controller: PrintingController | null = null;
const getController = () => {
  if (!controller) {
    controller = new PrintingController();
  }
  return controller;
};

/**
 * @route   POST /api/v1/production/printing
 * @desc    Create a new printing entry
 * @access  Private
 */
router.post('/', (req, res) => getController().create(req, res));

/**
 * @route   GET /api/v1/production/printing
 * @desc    Get all printing entries
 * @access  Private
 */
router.get('/', (req, res) => getController().getAll(req, res));

/**
 * @route   GET /api/v1/production/printing/wip
 * @desc    Get printing WIP (Work In Progress)
 * @access  Private
 */
router.get('/wip', (req, res) => getController().getWIP(req, res));

/**
 * @route   GET /api/v1/production/printing/:id
 * @desc    Get printing entry by ID
 * @access  Private
 */
router.get('/:id', (req, res) => getController().getById(req, res));

/**
 * @route   PUT /api/v1/production/printing/:id
 * @desc    Update printing entry
 * @access  Private
 */
router.put('/:id', (req, res) => getController().update(req, res));

/**
 * @route   PUT /api/v1/production/printing/:id/output
 * @desc    Update printing output (printed, rejected meters)
 * @access  Private
 */
router.put('/:id/output', (req, res) => getController().updateOutput(req, res));

export const printingRoutes = router;
