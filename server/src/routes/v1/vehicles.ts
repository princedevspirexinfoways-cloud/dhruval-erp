import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// ✅ FIXED: Use lazy instantiation instead of immediate instantiation
// This prevents the controller from being created when the module is imported

/**
 * @route   POST /api/v1/vehicles
 * @desc    Create a new vehicle
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { VehicleController } = await import('../../controllers/VehicleController');
    const vehicleController = new VehicleController();
    await vehicleController.createVehicle(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/vehicles
 * @desc    Get vehicles by company with pagination and filters
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { VehicleController } = await import('../../controllers/VehicleController');
    const vehicleController = new VehicleController();
    await vehicleController.getVehiclesByCompany(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/vehicles/search
 * @desc    Search vehicles
 * @access  Private
 */
router.get('/search', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { VehicleController } = await import('../../controllers/VehicleController');
    const vehicleController = new VehicleController();
    await vehicleController.searchVehicles(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/vehicles/stats
 * @desc    Get vehicle statistics
 * @access  Private
 */
router.get('/stats', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { VehicleController } = await import('../../controllers/VehicleController');
    const vehicleController = new VehicleController();
    await vehicleController.getVehicleStats(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/vehicles/maintenance-due
 * @desc    Get vehicles due for maintenance
 * @access  Private
 */
router.get('/maintenance-due', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { VehicleController } = await import('../../controllers/VehicleController');
    const vehicleController = new VehicleController();
    await vehicleController.getVehiclesDueForMaintenance(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/vehicles/type/:vehicleType
 * @desc    Get vehicles by type
 * @access  Private
 */
router.get('/type/:vehicleType', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { VehicleController } = await import('../../controllers/VehicleController');
    const vehicleController = new VehicleController();
    await vehicleController.getVehiclesByType(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/vehicles/number/:vehicleNumber
 * @desc    Get vehicle by number
 * @access  Private
 */
router.get('/number/:vehicleNumber', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { VehicleController } = await import('../../controllers/VehicleController');
    const vehicleController = new VehicleController();
    await vehicleController.getVehicleByNumber(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/vehicles/:id
 * @desc    Get vehicle by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { VehicleController } = await import('../../controllers/VehicleController');
    const vehicleController = new VehicleController();
    await vehicleController.getVehicleById(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/vehicles/:id
 * @desc    Update vehicle
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { VehicleController } = await import('../../controllers/VehicleController');
    const vehicleController = new VehicleController();
    await vehicleController.updateVehicle(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/v1/vehicles/:id/checkout
 * @desc    Checkout vehicle (mark as out)
 * @access  Private
 */
router.patch('/:id/checkout', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { VehicleController } = await import('../../controllers/VehicleController');
    const vehicleController = new VehicleController();
    await vehicleController.checkoutVehicle(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/vehicles/:vehicleId/status
 * @desc    Update vehicle status
 * @access  Private
 */
router.put('/:vehicleId/status', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { VehicleController } = await import('../../controllers/VehicleController');
    const vehicleController = new VehicleController();
    await vehicleController.updateVehicleStatus(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/vehicles/:vehicleId/maintenance
 * @desc    Add maintenance record
 * @access  Private
 */
router.post('/:vehicleId/maintenance', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { VehicleController } = await import('../../controllers/VehicleController');
    const vehicleController = new VehicleController();
    await vehicleController.addMaintenanceRecord(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/vehicles/:vehicleId/maintenance-history
 * @desc    Get maintenance history
 * @access  Private
 */
router.get('/:vehicleId/maintenance-history', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { VehicleController } = await import('../../controllers/VehicleController');
    const vehicleController = new VehicleController();
    await vehicleController.getMaintenanceHistory(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/v1/vehicles/:id
 * @desc    Delete vehicle (soft delete)
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { VehicleController } = await import('../../controllers/VehicleController');
    const vehicleController = new VehicleController();
    await vehicleController.deleteVehicle(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;
