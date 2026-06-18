import { Router } from 'express';
// NOTE: Old production stage controllers have been removed
// All production modules are now in features/production/
// Use the new production routes at /api/v1/production/*
import { authenticate } from '../middleware/auth';

const router = Router();

// Old controllers removed - use features/production/ routes instead
// - Dyeing: Use production module routes
// - Printing: Use /api/v1/production/printing
// - Finishing: Use /api/v1/production/finishing
// - CuttingPacking: Use production module routes

// Apply authentication middleware to all routes
router.use(authenticate);

// =============================================
// DYEING ROUTES
// =============================================
// NOTE: Old dyeing routes have been removed
// Use production module routes at /api/v1/production/* instead

// =============================================
// PRINTING ROUTES
// =============================================
// NOTE: Printing routes have been moved to /api/v1/production/printing
// Use the new production module routes instead of these old routes

// All printing routes are now available at:
// POST /api/v1/production/printing - Create printing entry
// GET /api/v1/production/printing - Get all printing entries
// GET /api/v1/production/printing/:id - Get printing entry by ID
// PUT /api/v1/production/printing/:id - Update printing entry
// PUT /api/v1/production/printing/:id/output - Update printing output

// =============================================
// FINISHING ROUTES
// =============================================
// NOTE: Old finishing routes have been removed
// Use /api/v1/production/finishing routes instead

// =============================================
// CUTTING & PACKING ROUTES
// =============================================
// NOTE: Old cutting & packing routes have been removed
// Use production module routes at /api/v1/production/* instead

export default router;
