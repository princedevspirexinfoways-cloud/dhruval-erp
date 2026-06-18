import { Router } from 'express';
import { BatchCenterController } from '../controllers/BatchCenterController';
import { authenticate } from '../../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Lazy load controller to prevent hang on server start
let controller: BatchCenterController | null = null;
const getController = () => {
  if (!controller) {
    controller = new BatchCenterController();
  }
  return controller;
};

/**
 * @route   POST /api/v1/production/batch-center
 * @desc    Create a new batch entry
 * @access  Private
 */
router.post('/', (req, res) => getController().create(req, res));

/**
 * @route   GET /api/v1/production/batch-center
 * @desc    Get all batch entries
 * @access  Private
 */
router.get('/', (req, res) => getController().getAll(req, res));

/**
 * @route   GET /api/v1/production/batch-center/lot/:lotNumber/party
 * @desc    Get party name by lot number (for auto-fill)
 * @access  Private
 */
router.get('/lot/:lotNumber/party', (req, res) => getController().getPartyNameByLot(req, res));

/**
 * @route   GET /api/v1/production/batch-center/lot/:lotNumber/details
 * @desc    Get comprehensive lot details (party, customer, quality, etc.)
 * @access  Private
 */
router.get('/lot/:lotNumber/details', (req, res) => getController().getLotDetails(req, res));

/**
 * @route   PUT /api/v1/production/batch-center/:id/received-meter
 * @desc    Update received meter
 * @access  Private
 */
router.put('/:id/received-meter', (req, res) => getController().updateReceivedMeter(req, res));

/**
 * @route   GET /api/v1/production/batch-center/:id
 * @desc    Get batch entry by ID
 * @access  Private
 */
router.get('/:id', (req, res) => getController().getById(req, res));

/**
 * @route   PUT /api/v1/production/batch-center/:id
 * @desc    Update batch entry
 * @access  Private
 */
router.put('/:id', (req, res) => getController().update(req, res));

export default router;
