import { Router } from 'express';
import { RejectionStockController } from '../controllers/RejectionStockController';
import { authenticate } from '../../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Lazy load controller to prevent hang on server start
let controller: RejectionStockController | null = null;
const getController = () => {
  if (!controller) {
    controller = new RejectionStockController();
  }
  return controller;
};

/**
 * @route   GET /api/v1/production/rejection-stock
 * @desc    Get all rejection stocks
 * @access  Private
 */
router.get('/', (req, res) => getController().getAll(req, res));

/**
 * @route   GET /api/v1/production/rejection-stock/total
 * @desc    Get total rejection stock
 * @access  Private
 */
router.get('/total', (req, res) => getController().getTotal(req, res));

/**
 * @route   GET /api/v1/production/rejection-stock/lot/:lotNumber
 * @desc    Get rejection stock by lot number
 * @access  Private
 */
router.get('/lot/:lotNumber', (req, res) => getController().getByLotNumber(req, res));

/**
 * @route   GET /api/v1/production/rejection-stock/:id
 * @desc    Get rejection stock by ID
 * @access  Private
 */
router.get('/:id', (req, res) => getController().getById(req, res));

/**
 * @route   PUT /api/v1/production/rejection-stock/:id/status
 * @desc    Update rejection stock status (dispose/rework)
 * @access  Private
 */
router.put('/:id/status', (req, res) => getController().updateStatus(req, res));

export const rejectionStockRoutes = router;
