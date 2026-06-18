import { Router } from 'express';
import { ScrapController } from '../../controllers/ScrapController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const scrapController = new ScrapController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v1/scrap/inventory/:inventoryItemId/move
 * @desc    Move inventory item to scrap
 * @access  Private
 */
router.post(
  '/inventory/:inventoryItemId/move',
  scrapController.moveToScrap.bind(scrapController)
);

/**
 * @route   GET /api/v1/scrap
 * @desc    Get scrap items by company with pagination and filters
 * @access  Private
 */
router.get('/', scrapController.getScrapByCompany.bind(scrapController));

/**
 * @route   GET /api/v1/scrap/summary
 * @desc    Get scrap summary/statistics
 * @access  Private
 */
router.get('/summary', scrapController.getScrapSummary.bind(scrapController));

/**
 * @route   GET /api/v1/scrap/inventory/:inventoryItemId
 * @desc    Get scrap items for a specific inventory item
 * @access  Private
 */
router.get(
  '/inventory/:inventoryItemId',
  scrapController.getScrapByInventoryItem.bind(scrapController)
);

/**
 * @route   GET /api/v1/scrap/:id
 * @desc    Get scrap item by ID
 * @access  Private
 */
router.get('/:id', scrapController.getScrapById.bind(scrapController));

/**
 * @route   PUT /api/v1/scrap/:id
 * @desc    Update scrap record
 * @access  Private
 */
router.put('/:id', scrapController.updateScrap.bind(scrapController));

/**
 * @route   POST /api/v1/scrap/:id/dispose
 * @desc    Mark scrap as disposed
 * @access  Private
 */
router.post('/:id/dispose', scrapController.markAsDisposed.bind(scrapController));

/**
 * @route   DELETE /api/v1/scrap/:id
 * @desc    Cancel scrap record (restore inventory stock)
 * @access  Private
 */
router.delete('/:id', scrapController.deleteScrap.bind(scrapController));

export default router;














