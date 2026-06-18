import express from 'express';
import { DispatchController } from '../../controllers/DispatchController';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permissions';
import { uploadFields } from '../../middleware/upload';
import { validateUploadedFiles } from '../../middleware/validation';

const router = express.Router();
const dispatchController = new DispatchController();

// =============================================
// DISPATCH CRUD ROUTES
// =============================================

// Get all dispatches
router.get('/',
  authenticate,
  requirePermission('dispatch', 'view'),
  dispatchController.getAll.bind(dispatchController)
);

// Get dispatch by ID
router.get('/:id',
  authenticate,
  requirePermission('dispatch', 'view'),
  dispatchController.getById.bind(dispatchController)
);

// Create dispatch with files
router.post('/',
  authenticate,
  requirePermission('dispatch', 'create'),
  uploadFields([
    { name: 'dispatchPhotos', maxCount: 3 },
    { name: 'cargoPhotos', maxCount: 5 },
    { name: 'vehiclePhotos', maxCount: 3 },
    { name: 'documents', maxCount: 5 }
  ], 'dispatches'),
  validateUploadedFiles,
  dispatchController.create.bind(dispatchController)
);

// Update dispatch
router.put('/:id',
  authenticate,
  requirePermission('dispatch', 'update'),
  dispatchController.update.bind(dispatchController)
);

// Delete dispatch
router.delete('/:id',
  authenticate,
  requirePermission('dispatch', 'delete'),
  dispatchController.delete.bind(dispatchController)
);

// Update dispatch status
router.patch('/:id/status',
  authenticate,
  requirePermission('dispatch', 'update'),
  dispatchController.updateDispatchStatus.bind(dispatchController)
);

// =============================================
// FILE UPLOAD ROUTES
// =============================================

// Upload dispatch photos
router.post('/:id/dispatch-photos',
  authenticate,
  requirePermission('dispatch', 'update'),
  uploadFields([
    { name: 'dispatchPhotos', maxCount: 3 }
  ], 'dispatches/photos'),
  validateUploadedFiles,
  dispatchController.uploadDispatchPhotos.bind(dispatchController)
);

// Upload cargo photos
router.post('/:id/cargo-photos',
  authenticate,
  requirePermission('dispatch', 'update'),
  uploadFields([
    { name: 'cargoPhotos', maxCount: 5 }
  ], 'dispatches/cargo'),
  validateUploadedFiles,
  dispatchController.uploadCargoPhotos.bind(dispatchController)
);

// Upload vehicle photos
router.post('/:id/vehicle-photos',
  authenticate,
  requirePermission('dispatch', 'update'),
  uploadFields([
    { name: 'vehiclePhotos', maxCount: 3 }
  ], 'dispatches/vehicles'),
  validateUploadedFiles,
  dispatchController.uploadVehiclePhotos.bind(dispatchController)
);

// =============================================
// S3 PRESIGNED URL ROUTES
// =============================================

// Get presigned URL for file upload
router.post('/upload-url',
  authenticate,
  requirePermission('dispatch', 'create'),
  dispatchController.getUploadUrl.bind(dispatchController)
);

// Get presigned URL for file download
router.get('/download/:key',
  authenticate,
  requirePermission('dispatch', 'view'),
  dispatchController.getDownloadUrl.bind(dispatchController)
);

// =============================================
// STATISTICS ROUTES
// =============================================

// Get dispatch statistics
router.get('/statistics/overview',
  authenticate,
  requirePermission('dispatch', 'view'),
  dispatchController.getStatistics.bind(dispatchController)
);

export default router;
