import { Router } from 'express';
import { ElectricityMonitoringController } from '../../controllers/ElectricityMonitoringController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const electricityMonitoringController = new ElectricityMonitoringController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v2/electricity-monitoring
 * @desc    Create a new electricity monitoring entry
 * @access  Private
 */
router.post('/', electricityMonitoringController.createMonitoringEntry.bind(electricityMonitoringController));

/**
 * @route   GET /api/v2/electricity-monitoring
 * @desc    Get electricity monitoring data by company with pagination and filters
 * @access  Private
 */
router.get('/', electricityMonitoringController.getMonitoringByCompany.bind(electricityMonitoringController));

/**
 * @route   GET /api/v2/electricity-monitoring/stats
 * @desc    Get consumption statistics
 * @access  Private
 */
router.get('/stats', electricityMonitoringController.getConsumptionStats.bind(electricityMonitoringController));

/**
 * @route   GET /api/v2/electricity-monitoring/solar-vs-pgvcl
 * @desc    Get solar vs PGVCL comparison
 * @access  Private
 */
router.get('/solar-vs-pgvcl', electricityMonitoringController.getSolarVsPGVCLComparison.bind(electricityMonitoringController));

/**
 * @route   GET /api/v2/electricity-monitoring/:id
 * @desc    Get electricity monitoring entry by ID
 * @access  Private
 */
router.get('/:id', electricityMonitoringController.getMonitoringById.bind(electricityMonitoringController));

export default router;
