import { Router } from 'express';
import { LongationStockController } from '../controllers/LongationStockController';
import { authenticate } from '../../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Lazy load controller to prevent hang on server start
let controller: LongationStockController | null = null;
const getController = () => {
  if (!controller) {
    controller = new LongationStockController();
  }
  return controller;
};

/**
 * @route   GET /api/v1/production/longation-stock
 * @desc    Get all longation stocks
 * @access  Private
 */
router.get('/', (req, res) => getController().getAll(req, res));

/**
 * @route   GET /api/v1/production/longation-stock/total
 * @desc    Get total longation stock
 * @access  Private
 */
router.get('/total', (req, res) => getController().getTotal(req, res));

/**
 * @route   GET /api/v1/production/longation-stock/lot/:lotNumber
 * @desc    Get longation stock by lot number
 * @access  Private
 */
router.get('/lot/:lotNumber', (req, res) => getController().getByLotNumber(req, res));

/**
 * @route   GET /api/v1/production/longation-stock/:id
 * @desc    Get longation stock by ID
 * @access  Private
 */
router.get('/:id', (req, res) => getController().getById(req, res));

export const longationStockRoutes = router;
