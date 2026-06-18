// Production Routes Index
// Central export file for all production routes
// Using lazy loading to prevent server hang on startup

import { Router } from 'express';

// Lazy load routes to prevent hang on server start
let router: Router | null = null;

const getRouter = (): Router => {
  if (!router) {
    router = Router();
    
    // Lazy import routes only when router is first accessed
    const programDetailsRoutes = require('./program-details.routes').default;
    const bleachingProcessRoutes = require('./bleaching-process.routes').default;
    const afterBleachingRoutes = require('./after-bleaching.routes').default;
    const batchCenterRoutes = require('./batch-center.routes').default;
    const { printingRoutes } = require('./printing.routes');
    const { hazerSilicateCuringRoutes } = require('./hazer-silicate-curing.routes');
    const { washingRoutes } = require('./washing.routes');
    const { finishingRoutes } = require('./finishing.routes');
    const { feltRoutes } = require('./felt.routes');
    const { foldingCheckingRoutes } = require('./folding-checking.routes');
    const { packingRoutes } = require('./packing.routes');
    const { longationStockRoutes } = require('./longation-stock.routes');
    const { rejectionStockRoutes } = require('./rejection-stock.routes');
    const lotRoutes = require('./lot.routes').default;

    // Register all production routes
    router.use('/program-details', programDetailsRoutes);
    router.use('/bleaching', bleachingProcessRoutes);
    router.use('/after-bleaching', afterBleachingRoutes);
    router.use('/batch-center', batchCenterRoutes);
    router.use('/printing', printingRoutes);
    router.use('/hazer-silicate-curing', hazerSilicateCuringRoutes);
    router.use('/washing', washingRoutes);
    router.use('/finishing', finishingRoutes);
    router.use('/felt', feltRoutes);
    router.use('/folding-checking', foldingCheckingRoutes);
    router.use('/packing', packingRoutes);
    router.use('/longation-stock', longationStockRoutes);
    router.use('/rejection-stock', rejectionStockRoutes);
    router.use('/lot', lotRoutes);
  }
  return router;
};

// Named exports (for backward compatibility, but also lazy)
export const programDetailsRoutes = () => require('./program-details.routes').default;
export const bleachingProcessRoutes = () => require('./bleaching-process.routes').default;
export const afterBleachingRoutes = () => require('./after-bleaching.routes').default;
export const batchCenterRoutes = () => require('./batch-center.routes').default;
export const printingRoutes = () => require('./printing.routes').printingRoutes;
export const hazerSilicateCuringRoutes = () => require('./hazer-silicate-curing.routes').hazerSilicateCuringRoutes;
export const washingRoutes = () => require('./washing.routes').washingRoutes;
export const finishingRoutes = () => require('./finishing.routes').finishingRoutes;
export const feltRoutes = () => require('./felt.routes').feltRoutes;
export const foldingCheckingRoutes = () => require('./folding-checking.routes').foldingCheckingRoutes;
export const packingRoutes = () => require('./packing.routes').packingRoutes;
export const longationStockRoutes = () => require('./longation-stock.routes').longationStockRoutes;
export const rejectionStockRoutes = () => require('./rejection-stock.routes').rejectionStockRoutes;
export const lotRoutes = () => require('./lot.routes').default;

// Default export - Main router with all production routes (lazy loaded)
// Export function instead of calling it immediately
export default getRouter;

