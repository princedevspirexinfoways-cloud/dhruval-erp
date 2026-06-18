import { Router } from 'express';
import { ProgramDetailsController } from '../controllers/ProgramDetailsController';
import { authenticate } from '../../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Lazy load controller to prevent hang on server start
let controller: ProgramDetailsController | null = null;
const getController = () => {
  if (!controller) {
    controller = new ProgramDetailsController();
  }
  return controller;
};

/**
 * @route   POST /api/v1/production/program-details
 * @desc    Create a new program details entry
 * @access  Private
 */
router.post('/', (req, res) => getController().createProgramDetails(req, res));

/**
 * @route   GET /api/v1/production/program-details
 * @desc    Get all program details for company
 * @access  Private
 */
router.get('/', (req, res) => getController().getAll(req, res));

/**
 * @route   GET /api/v1/production/program-details/order/:orderNumber
 * @desc    Get program details by order number
 * @access  Private
 */
router.get('/order/:orderNumber', (req, res) => getController().getByOrderNumber(req, res));

/**
 * @route   GET /api/v1/production/program-details/:id
 * @desc    Get program details by ID
 * @access  Private
 */
router.get('/:id', (req, res) => getController().getById(req, res));

/**
 * @route   PUT /api/v1/production/program-details/:id
 * @desc    Update program details
 * @access  Private
 */
router.put('/:id', (req, res) => getController().update(req, res));

/**
 * @route   DELETE /api/v1/production/program-details/:id
 * @desc    Delete program details
 * @access  Private
 */
router.delete('/:id', (req, res) => getController().delete(req, res));

export default router;
