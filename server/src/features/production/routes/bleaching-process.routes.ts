import { Router } from 'express';
import { BleachingProcessController } from '../controllers/BleachingProcessController';
import { authenticate } from '../../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Lazy load controller to prevent hang on server start
let controller: BleachingProcessController | null = null;
const getController = () => {
  if (!controller) {
    controller = new BleachingProcessController();
  }
  return controller;
};

/**
 * @route   POST /api/v1/production/bleaching
 * @desc    Create a new bleaching process entry
 * @access  Private
 */
router.post('/', (req, res) => getController().create(req, res));

/**
 * @route   GET /api/v1/production/bleaching/dashboard
 * @desc    Get bleaching dashboard (all entries)
 * @access  Private
 */
router.get('/dashboard', (req, res) => getController().getDashboard(req, res));

/**
 * @route   POST /api/v1/production/bleaching/:id/complete
 * @desc    Complete bleaching process
 * @access  Private
 */
router.post('/:id/complete', (req, res) => getController().completeProcess(req, res));

/**
 * @route   GET /api/v1/production/bleaching/:id/challan
 * @desc    Generate/download challan (JSON response)
 * @access  Private
 */
router.get('/:id/challan', (req, res) => getController().generateChallan(req, res));

/**
 * @route   GET /api/v1/production/bleaching/:id/challan/pdf
 * @desc    Generate/download challan PDF (6 inch × 4 inch)
 * @access  Private
 */
router.get('/:id/challan/pdf', (req, res) => getController().generateChallanPDF(req, res));

/**
 * @route   GET /api/v1/production/bleaching/:id
 * @desc    Get bleaching process by ID
 * @access  Private
 */
router.get('/:id', (req, res) => getController().getById(req, res));

/**
 * @route   PUT /api/v1/production/bleaching/:id
 * @desc    Update bleaching process
 * @access  Private
 */
router.put('/:id', (req, res) => getController().update(req, res));

export default router;
