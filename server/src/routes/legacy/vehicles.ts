import { Router } from 'express';
import { VehicleController } from '../controllers/VehicleController';
import { authenticate } from '../middleware/auth';

const router = Router();
const vehicleController = new VehicleController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v1/vehicles
 * @desc    Create a new vehicle
 * @access  Private
 */
router.post('/', vehicleController.createVehicle.bind(vehicleController));

/**
 * @route   GET /api/v1/vehicles
 * @desc    Get vehicles by company with pagination and filters
 * @access  Private
 */
router.get('/', vehicleController.getVehiclesByCompany.bind(vehicleController));

/**
 * @route   GET /api/v1/vehicles/search
 * @desc    Search vehicles
 * @access  Private
 */
router.get('/search', vehicleController.searchVehicles.bind(vehicleController));

/**
 * @route   GET /api/v1/vehicles/stats
 * @desc    Get vehicle statistics
 * @access  Private
 */
router.get('/stats', vehicleController.getVehicleStats.bind(vehicleController));

/**
 * @route   GET /api/v1/vehicles/maintenance-due
 * @desc    Get vehicles due for maintenance
 * @access  Private
 */
router.get('/maintenance-due', vehicleController.getVehiclesDueForMaintenance.bind(vehicleController));

/**
 * @route   GET /api/v1/vehicles/type/:vehicleType
 * @desc    Get vehicles by type
 * @access  Private
 */
router.get('/type/:vehicleType', vehicleController.getVehiclesByType.bind(vehicleController));

/**
 * @route   GET /api/v1/vehicles/number/:vehicleNumber
 * @desc    Get vehicle by number
 * @access  Private
 */
router.get('/number/:vehicleNumber', vehicleController.getVehicleByNumber.bind(vehicleController));

/**
 * @route   GET /api/v1/vehicles/:id
 * @desc    Get vehicle by ID
 * @access  Private
 */
router.get('/:id', vehicleController.getVehicleById.bind(vehicleController));

/**
 * @route   PUT /api/v1/vehicles/:id
 * @desc    Update vehicle
 * @access  Private
 */
router.put('/:id', vehicleController.updateVehicle.bind(vehicleController));

/**
 * @route   PATCH /api/v1/vehicles/:id/checkout
 * @desc    Checkout vehicle (mark as out)
 * @access  Private
 */
router.patch('/:id/checkout', vehicleController.checkoutVehicle.bind(vehicleController));

/**
 * @route   PUT /api/v1/vehicles/:vehicleId/status
 * @desc    Update vehicle status
 * @access  Private
 */
router.put('/:vehicleId/status', vehicleController.updateVehicleStatus.bind(vehicleController));

/**
 * @route   POST /api/v1/vehicles/:vehicleId/maintenance
 * @desc    Add maintenance record
 * @access  Private
 */
router.post('/:vehicleId/maintenance', vehicleController.addMaintenanceRecord.bind(vehicleController));

/**
 * @route   GET /api/v1/vehicles/:vehicleId/maintenance-history
 * @desc    Get maintenance history
 * @access  Private
 */
router.get('/:vehicleId/maintenance-history', vehicleController.getMaintenanceHistory.bind(vehicleController));

/**
 * @route   DELETE /api/v1/vehicles/:id
 * @desc    Delete vehicle (soft delete)
 * @access  Private
 */
router.delete('/:id', vehicleController.deleteVehicle.bind(vehicleController));

export default router;
