import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// ✅ FIXED: Use lazy instantiation instead of immediate instantiation
// This prevents the controller from being created when the module is imported

/**
 * @route   POST /api/v1/gatepasses
 * @desc    Create a new gate pass
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { GatePassController } = await import('../../controllers/GatePassController');
    const gatePassController = new GatePassController();
    await gatePassController.createGatePass(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/gatepasses
 * @desc    Get gate passes by company with pagination and filters
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { GatePassController } = await import('../../controllers/GatePassController');
    const gatePassController = new GatePassController();
    await gatePassController.getGatePassesByCompany(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/gatepasses/stats
 * @desc    Get gate pass statistics
 * @access  Private
 */
router.get('/stats', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { GatePassController } = await import('../../controllers/GatePassController');
    const gatePassController = new GatePassController();
    await gatePassController.getGatePassStats(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/gatepasses/active
 * @desc    Get active gate passes
 * @access  Private
 */
router.get('/active', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { GatePassController } = await import('../../controllers/GatePassController');
    const gatePassController = new GatePassController();
    await gatePassController.getActiveGatePasses(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/gatepasses/number/:gatePassNumber
 * @desc    Get gate pass by number
 * @access  Private
 */
router.get('/number/:gatePassNumber', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { GatePassController } = await import('../../controllers/GatePassController');
    const gatePassController = new GatePassController();
    await gatePassController.getGatePassByNumber(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/gatepasses/vehicle/:vehicleNumber/history
 * @desc    Get vehicle gate pass history
 * @access  Private
 */
router.get('/vehicle/:vehicleNumber/history', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { GatePassController } = await import('../../controllers/GatePassController');
    const gatePassController = new GatePassController();
    await gatePassController.getVehicleGatePassHistory(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/gatepasses/:id
 * @desc    Get gate pass by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { GatePassController } = await import('../../controllers/GatePassController');
    const gatePassController = new GatePassController();
    await gatePassController.getGatePassById(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/gatepasses/:id
 * @desc    Update gate pass
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { GatePassController } = await import('../../controllers/GatePassController');
    const gatePassController = new GatePassController();
    await gatePassController.updateGatePass(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/v1/gatepasses/:id/complete
 * @desc    Complete gate pass (checkout)
 * @access  Private
 */
router.patch('/:id/complete', async (req, res) => {
  try {
    const { GatePassController } = await import('../../controllers/GatePassController');
    const gatePassController = new GatePassController();
    await gatePassController.completeGatePass(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/v1/gatepasses/:id/cancel
 * @desc    Cancel gate pass
 * @access  Private
 */
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { GatePassController } = await import('../../controllers/GatePassController');
    const gatePassController = new GatePassController();
    await gatePassController.cancelGatePass(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/v1/gatepasses/:id/print
 * @desc    Print gate pass
 * @access  Private
 */
router.patch('/:id/print', async (req, res) => {
  try {
    const { GatePassController } = await import('../../controllers/GatePassController');
    const gatePassController = new GatePassController();
    await gatePassController.printGatePass(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/v1/gatepasses/:id/mark-out
 * @desc    Mark gate pass OUT at gate (security workflow)
 * @access  Private
 */
router.patch('/:id/mark-out', async (req, res) => {
  try {
    const { GatePassController } = await import('../../controllers/GatePassController');
    const gatePassController = new GatePassController();
    await gatePassController.markOutAtGate(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/v1/gatepasses/:id
 * @desc    Delete gate pass (soft delete)
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    // Lazy import and instantiation
    const { GatePassController } = await import('../../controllers/GatePassController');
    const gatePassController = new GatePassController();
    await gatePassController.deleteGatePass(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;
