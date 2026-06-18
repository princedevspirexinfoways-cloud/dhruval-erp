import { Router } from 'express';
import { JobWorkTypeController } from '../controllers/JobWorkTypeController';
import { authenticate } from '../../../middleware/auth';

const router = Router();
const jobWorkTypeController = new JobWorkTypeController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v1/job-work-types
 * @desc    Create a new job work type
 * @access  Private
 */
router.post('/', jobWorkTypeController.createJobWorkType.bind(jobWorkTypeController));

/**
 * @route   GET /api/v1/job-work-types
 * @desc    Get all job work types with optional filters
 * @access  Private
 */
router.get('/', jobWorkTypeController.getJobWorkTypes.bind(jobWorkTypeController));

/**
 * @route   GET /api/v1/job-work-types/:id
 * @desc    Get job work type by ID
 * @access  Private
 */
router.get('/:id', jobWorkTypeController.getJobWorkTypeById.bind(jobWorkTypeController));

/**
 * @route   PUT /api/v1/job-work-types/:id
 * @desc    Update job work type
 * @access  Private
 */
router.put('/:id', jobWorkTypeController.updateJobWorkType.bind(jobWorkTypeController));

/**
 * @route   DELETE /api/v1/job-work-types/:id
 * @desc    Delete job work type (soft delete)
 * @access  Private
 */
router.delete('/:id', jobWorkTypeController.deleteJobWorkType.bind(jobWorkTypeController));

export default router;















