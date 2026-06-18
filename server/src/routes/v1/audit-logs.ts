import { Router } from 'express';
import { AuditLogController } from '../../controllers/AuditLogController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const auditLogController = new AuditLogController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v2/audit-logs
 * @desc    Create a new audit log entry
 * @access  Private
 */
router.post('/', auditLogController.createAuditLog.bind(auditLogController));

/**
 * @route   POST /api/v2/audit-logs/user-action
 * @desc    Log user action
 * @access  Private
 */
router.post('/user-action', auditLogController.logUserAction.bind(auditLogController));

/**
 * @route   GET /api/v2/audit-logs
 * @desc    Get audit logs by company with pagination and filters
 * @access  Private
 */
router.get('/', auditLogController.getAuditLogsByCompany.bind(auditLogController));

/**
 * @route   GET /api/v2/audit-logs/search
 * @desc    Search audit logs
 * @access  Private
 */
router.get('/search', auditLogController.searchAuditLogs.bind(auditLogController));

/**
 * @route   GET /api/v2/audit-logs/stats
 * @desc    Get audit log statistics
 * @access  Private
 */
router.get('/stats', auditLogController.getAuditStats.bind(auditLogController));

/**
 * @route   GET /api/v2/audit-logs/user/:userId
 * @desc    Get audit logs by user
 * @access  Private
 */
router.get('/user/:userId', auditLogController.getAuditLogsByUser.bind(auditLogController));

/**
 * @route   GET /api/v2/audit-logs/resource/:resourceType/:resourceId
 * @desc    Get audit logs by resource
 * @access  Private
 */
router.get('/resource/:resourceType/:resourceId', auditLogController.getAuditLogsByResource.bind(auditLogController));

/**
 * @route   GET /api/v2/audit-logs/:id
 * @desc    Get audit log by ID
 * @access  Private
 */
router.get('/:id', auditLogController.getAuditLogById.bind(auditLogController));

export default router;
