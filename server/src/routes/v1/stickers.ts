import express from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import StickerController from '../../controllers/StickerController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Sticker Management Routes
router.get('/', requireRole(['admin', 'manager', 'operator']), StickerController.getAllStickers);
router.get('/:id', requireRole(['admin', 'manager', 'operator']), StickerController.getStickerById);
router.post('/', requireRole(['admin', 'manager', 'operator']), StickerController.createSticker);
router.put('/:id', requireRole(['admin', 'manager', 'operator']), StickerController.updateSticker);
router.delete('/:id', requireRole(['admin']), StickerController.deleteSticker);

// Sticker Generation Routes
router.post('/generate', requireRole(['admin', 'manager', 'operator']), StickerController.generateSticker);
router.post('/generate-bulk', requireRole(['admin', 'manager', 'operator']), StickerController.generateBulkStickers);
router.post('/generate-batch', requireRole(['admin', 'manager', 'operator']), StickerController.generateBatchStickers);

// Sticker Printing Routes
router.post('/:id/print', requireRole(['admin', 'manager', 'operator']), StickerController.printSticker);
router.post('/:id/print-multiple', requireRole(['admin', 'manager', 'operator']), StickerController.printMultipleCopies);
router.post('/bulk-print', requireRole(['admin', 'manager', 'operator']), StickerController.bulkPrintStickers);
router.get('/print-history/:id', requireRole(['admin', 'manager', 'operator']), StickerController.getPrintHistory);

// Sticker Application Routes
router.post('/:id/apply', requireRole(['admin', 'manager', 'operator']), StickerController.applySticker);
router.put('/:id/status', requireRole(['admin', 'manager', 'operator']), StickerController.updateStickerStatus);
router.post('/:id/reprint', requireRole(['admin', 'manager', 'operator']), StickerController.reprintSticker);

// Sticker Search and Filter Routes
router.get('/search/design/:designNumber', requireRole(['admin', 'manager', 'operator']), StickerController.searchByDesign);
router.get('/search/sku/:sku', requireRole(['admin', 'manager', 'operator']), StickerController.searchBySKU);
router.get('/search/batch/:batchNumber', requireRole(['admin', 'manager', 'operator']), StickerController.searchByBatch);
router.get('/search/barcode/:barcodeData', requireRole(['admin', 'manager', 'operator']), StickerController.searchByBarcode);
router.get('/search/qr/:qrCodeData', requireRole(['admin', 'manager', 'operator']), StickerController.searchByQRCode);
router.get('/filter/type/:type', requireRole(['admin', 'manager', 'operator']), StickerController.filterByType);
router.get('/filter/status/:status', requireRole(['admin', 'manager', 'operator']), StickerController.filterByStatus);

// Sticker Template Management Routes
router.get('/templates/all', requireRole(['admin', 'manager']), StickerController.getAllTemplates);
router.post('/templates/create', requireRole(['admin', 'manager']), StickerController.createTemplate);
router.put('/templates/:id', requireRole(['admin', 'manager']), StickerController.updateTemplate);
router.delete('/templates/:id', requireRole(['admin']), StickerController.deleteTemplate);

// Sticker Reports Routes
router.get('/reports/summary', requireRole(['admin', 'manager']), StickerController.getStickerSummary);
router.get('/reports/print-status', requireRole(['admin', 'manager']), StickerController.getPrintStatusReport);
router.get('/reports/application-status', requireRole(['admin', 'manager']), StickerController.getApplicationStatusReport);
router.get('/reports/reprint-analysis', requireRole(['admin', 'manager']), StickerController.getReprintAnalysis);

// Sticker Export Routes
router.get('/export/csv', requireRole(['admin', 'manager']), StickerController.exportStickersCSV);
router.get('/export/pdf', requireRole(['admin', 'manager']), StickerController.exportStickersPDF);
router.get('/export/excel', requireRole(['admin', 'manager']), StickerController.exportStickersExcel);

export default router;
