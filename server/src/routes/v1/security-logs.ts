import { Router } from 'express';
import { SecurityLogController } from '../../controllers/SecurityLogController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const securityLogController = new SecurityLogController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v2/security-logs
 * @desc    Create a new security log entry
 * @access  Private
 */
router.post('/', securityLogController.createSecurityLog.bind(securityLogController));

/**
 * @route   GET /api/v2/security-logs
 * @desc    Get security logs by company with pagination and filters
 * @access  Private
 */
router.get('/', securityLogController.getSecurityLogsByCompany.bind(securityLogController));

/**
 * @route   GET /api/v2/security-logs/search
 * @desc    Search security logs
 * @access  Private
 */
router.get('/search', securityLogController.searchSecurityLogs.bind(securityLogController));

/**
 * @route   GET /api/v2/security-logs/stats
 * @desc    Get security log statistics
 * @access  Private
 */
router.get('/stats', securityLogController.getSecurityStats.bind(securityLogController));

/**
 * @route   GET /api/v2/security-logs/:id
 * @desc    Get security log by ID
 * @access  Private
 */
router.get('/:id', securityLogController.getSecurityLogById.bind(securityLogController));

/**
 * @route   PUT /api/v2/security-logs/:id
 * @desc    Update security log
 * @access  Private
 */
router.put('/:id', securityLogController.updateSecurityLog.bind(securityLogController));

export default router;
