import express from 'express';
import { LotController } from '../controllers/LotController';
import { authenticate } from '../../../middleware/auth';

const router = express.Router();
const getController = () => new LotController();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/production/lot/:lotNumber/details
 * @desc    Get lot details (party name, quality, customerId) from any production module
 * @access  Private
 */
router.get('/:lotNumber/details', (req, res) => getController().getLotDetails(req, res));

/**
 * @route   GET /api/v1/production/lot/:lotNumber/input-meter/:targetModule
 * @desc    Get available input meter from previous module in workflow
 * @access  Private
 */
router.get('/:lotNumber/input-meter/:targetModule', (req, res) => getController().getAvailableInputMeter(req, res));

export default router;





