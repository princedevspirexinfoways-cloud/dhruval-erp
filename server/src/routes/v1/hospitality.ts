import { Router } from 'express';
import { HospitalityController } from '../../controllers/HospitalityController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const hospitalityController = new HospitalityController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v2/hospitality
 * @desc    Create a new hospitality entry
 * @access  Private
 */
router.post('/', hospitalityController.createHospitalityEntry.bind(hospitalityController));

/**
 * @route   GET /api/v2/hospitality
 * @desc    Get hospitality entries by company with pagination and filters
 * @access  Private
 */
router.get('/', hospitalityController.getHospitalityByCompany.bind(hospitalityController));

/**
 * @route   GET /api/v2/hospitality/stats
 * @desc    Get hospitality statistics
 * @access  Private
 */
router.get('/stats', hospitalityController.getHospitalityStats.bind(hospitalityController));

/**
 * @route   GET /api/v2/hospitality/monthly-report
 * @desc    Get monthly hospitality report
 * @access  Private
 */
router.get('/monthly-report', hospitalityController.getMonthlyReport.bind(hospitalityController));

/**
 * @route   GET /api/v2/hospitality/:id
 * @desc    Get hospitality entry by ID
 * @access  Private
 */
router.get('/:id', hospitalityController.getHospitalityById.bind(hospitalityController));

/**
 * @route   PUT /api/v2/hospitality/:id
 * @desc    Update hospitality entry
 * @access  Private
 */
router.put('/:id', hospitalityController.updateHospitality.bind(hospitalityController));

export default router;
