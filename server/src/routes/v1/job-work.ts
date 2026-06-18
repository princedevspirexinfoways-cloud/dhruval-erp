import { Router } from 'express';
import { JobWorkController } from '../../controllers/JobWorkController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const jobWorkController = new JobWorkController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v1/job-work
 * @desc    Create a new job work
 * @access  Private
 */
router.post('/', jobWorkController.createJobWork.bind(jobWorkController));

/**
 * @route   GET /api/v1/job-work
 * @desc    Get all job works with filters
 * @access  Private
 */
router.get('/', jobWorkController.getJobWorks.bind(jobWorkController));

/**
 * @route   GET /api/v1/job-work/stats
 * @desc    Get job work statistics
 * @access  Private
 */
router.get('/stats', jobWorkController.getJobWorkStats.bind(jobWorkController));

/**
 * @route   GET /api/v1/job-work/worker/:workerId
 * @desc    Get job works by worker
 * @access  Private
 */
router.get('/worker/:workerId', jobWorkController.getJobWorksByWorker.bind(jobWorkController));

/**
 * @route   GET /api/v1/job-work/:id/challan/pdf
 * @desc    Generate Job Work Challan PDF
 * @access  Private
 */
router.get('/:id/challan/pdf', jobWorkController.generateChallanPDF.bind(jobWorkController));

/**
 * @route   GET /api/v1/job-work/:id
 * @desc    Get job work by ID
 * @access  Private
 */
router.get('/:id', jobWorkController.getJobWorkById.bind(jobWorkController));

/**
 * @route   PUT /api/v1/job-work/:id
 * @desc    Update job work
 * @access  Private
 */
router.put('/:id', jobWorkController.updateJobWork.bind(jobWorkController));

/**
 * @route   PATCH /api/v1/job-work/:id
 * @desc    Partially update job work
 * @access  Private
 */
router.patch('/:id', jobWorkController.updateJobWork.bind(jobWorkController));

/**
 * @route   DELETE /api/v1/job-work/:id
 * @desc    Delete job work
 * @access  Private
 */
router.delete('/:id', jobWorkController.deleteJobWork.bind(jobWorkController));

export default router;

