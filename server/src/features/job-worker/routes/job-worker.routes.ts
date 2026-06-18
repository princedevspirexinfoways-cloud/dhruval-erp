import { Router } from 'express';
import { JobWorkerController } from '../controllers/JobWorkerController';
import { authenticate } from '../../../middleware/auth';

const router = Router();
const jobWorkerController = new JobWorkerController();

// Apply authentication middleware to all routes
router.use(authenticate);

// =============================================
// WORKER ROUTES
// =============================================

/**
 * @route   POST /api/v1/job-workers
 * @desc    Create a new job worker
 * @access  Private
 */
router.post('/', jobWorkerController.createWorker);

/**
 * @route   GET /api/v1/job-workers
 * @desc    Get all workers by company
 * @access  Private
 */
router.get('/', jobWorkerController.getWorkersByCompany);

// =============================================
// ASSIGNMENT ROUTES (must come before /:id routes)
// =============================================

/**
 * @route   POST /api/v1/job-workers/assignments
 * @desc    Create a new assignment
 * @access  Private
 */
router.post('/assignments', jobWorkerController.createAssignment);

/**
 * @route   GET /api/v1/job-workers/assignments
 * @desc    Get all assignments by company
 * @access  Private
 */
router.get('/assignments', jobWorkerController.getAssignmentsByCompany);

/**
 * @route   GET /api/v1/job-workers/assignments/:id
 * @desc    Get assignment by ID
 * @access  Private
 */
router.get('/assignments/:id', jobWorkerController.getAssignmentById);

/**
 * @route   PUT /api/v1/job-workers/assignments/:id
 * @desc    Update assignment
 * @access  Private
 */
router.put('/assignments/:id', jobWorkerController.updateAssignment);

/**
 * @route   PATCH /api/v1/job-workers/assignments/:id/status
 * @desc    Update assignment status
 * @access  Private
 */
router.patch('/assignments/:id/status', jobWorkerController.updateAssignmentStatus);

/**
 * @route   GET /api/v1/job-workers/:workerId/assignments
 * @desc    Get assignments by worker
 * @access  Private
 */
router.get('/:workerId/assignments', jobWorkerController.getAssignmentsByWorker);

/**
 * @route   GET /api/v1/job-workers/:workerId/materials/report
 * @desc    Get material tracking report for a worker
 * @access  Private
 */
router.get('/:workerId/materials/report', jobWorkerController.getMaterialTrackingReport);

/**
 * @route   GET /api/v1/job-workers/:id
 * @desc    Get worker by ID
 * @access  Private
 */
router.get('/:id', jobWorkerController.getWorkerById);

/**
 * @route   PUT /api/v1/job-workers/:id
 * @desc    Update worker
 * @access  Private
 */
router.put('/:id', jobWorkerController.updateWorker);

/**
 * @route   DELETE /api/v1/job-workers/:id
 * @desc    Delete worker (soft delete)
 * @access  Private
 */
router.delete('/:id', jobWorkerController.deleteWorker);

// =============================================
// MATERIAL TRACKING ROUTES
// =============================================

/**
 * @route   POST /api/v1/job-workers/assignments/:id/materials
 * @desc    Add material to assignment
 * @access  Private
 */
router.post('/assignments/:id/materials', jobWorkerController.addMaterial);

/**
 * @route   PUT /api/v1/job-workers/assignments/:id/materials/:materialIndex
 * @desc    Update material tracking
 * @access  Private
 */
router.put('/assignments/:id/materials/:materialIndex', jobWorkerController.updateMaterialTracking);

export default router;


