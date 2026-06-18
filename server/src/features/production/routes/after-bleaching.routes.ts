import { Router } from 'express';
import { AfterBleachingController } from '../controllers/AfterBleachingController';
import { authenticate } from '../../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Lazy load controller to prevent hang on server start
let controller: AfterBleachingController | null = null;
const getController = () => {
  if (!controller) {
    controller = new AfterBleachingController();
  }
  return controller;
};

/**
 * @route   GET /api/v1/production/after-bleaching
 * @desc    Get all after bleaching stocks
 * @access  Private
 */
router.get('/', (req, res) => getController().getAll(req, res));

/**
 * @route   GET /api/v1/production/after-bleaching/longation
 * @desc    Get total longation stock
 * @access  Private
 */
router.get('/longation', (req, res) => getController().getLongationStock(req, res));

/**
 * @route   POST /api/v1/production/after-bleaching/:id/send-to-printing
 * @desc    Send meter to printing (handles longation automatically)
 * @access  Private
 */
router.post('/:id/send-to-printing', (req, res) => getController().sendToPrinting(req, res));

/**
 * @route   GET /api/v1/production/after-bleaching/:id
 * @desc    Get after bleaching stock by ID
 * @access  Private
 */
router.get('/:id', (req, res) => getController().getById(req, res));

export default router;
