import { Router } from 'express';
import { BoilerMonitoringController } from '../../controllers/BoilerMonitoringController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const boilerMonitoringController = new BoilerMonitoringController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v2/boiler-monitoring
 * @desc    Create a new boiler monitoring entry
 * @access  Private
 */
router.post('/', boilerMonitoringController.createMonitoringEntry.bind(boilerMonitoringController));

/**
 * @route   GET /api/v2/boiler-monitoring
 * @desc    Get boiler monitoring data by company with pagination and filters
 * @access  Private
 */
router.get('/', boilerMonitoringController.getMonitoringByCompany.bind(boilerMonitoringController));

/**
 * @route   GET /api/v2/boiler-monitoring/alerts
 * @desc    Get temperature alerts
 * @access  Private
 */
router.get('/alerts', boilerMonitoringController.getTemperatureAlerts.bind(boilerMonitoringController));

/**
 * @route   GET /api/v2/boiler-monitoring/stats
 * @desc    Get boiler statistics
 * @access  Private
 */
router.get('/stats', boilerMonitoringController.getBoilerStats.bind(boilerMonitoringController));

/**
 * @route   GET /api/v2/boiler-monitoring/:id
 * @desc    Get boiler monitoring entry by ID
 * @access  Private
 */
router.get('/:id', boilerMonitoringController.getMonitoringById.bind(boilerMonitoringController));

export default router;
