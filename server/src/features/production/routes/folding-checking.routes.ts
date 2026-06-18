import { Router } from 'express';
import { FoldingCheckingController } from '../controllers/FoldingCheckingController';
import { authenticate } from '../../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Lazy load controller to prevent hang on server start
let controller: FoldingCheckingController | null = null;
const getController = () => {
  if (!controller) {
    controller = new FoldingCheckingController();
  }
  return controller;
};

/**
 * @route   POST /api/v1/production/folding-checking
 * @desc    Create a new folding + checking entry
 * @access  Private
 */
router.post('/', (req, res) => getController().create(req, res));

/**
 * @route   GET /api/v1/production/folding-checking
 * @desc    Get all folding + checking entries
 * @access  Private
 */
router.get('/', (req, res) => getController().getAll(req, res));

/**
 * @route   GET /api/v1/production/folding-checking/:id
 * @desc    Get folding + checking entry by ID
 * @access  Private
 */
router.get('/:id', (req, res) => getController().getById(req, res));

/**
 * @route   PUT /api/v1/production/folding-checking/:id
 * @desc    Update folding + checking entry
 * @access  Private
 */
router.put('/:id', (req, res) => getController().update(req, res));

/**
 * @route   PUT /api/v1/production/folding-checking/:id/qc
 * @desc    Update QC results (checked, rejected meters)
 * @access  Private
 */
router.put('/:id/qc', (req, res) => getController().updateQC(req, res));

export const foldingCheckingRoutes = router;
