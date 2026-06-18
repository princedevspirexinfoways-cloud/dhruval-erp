import { Router } from 'express';
import { GoodsReturnController } from '../../controllers/GoodsReturnController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const goodsReturnController = new GoodsReturnController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v1/goods-returns
 * @desc    Create goods return
 * @access  Private
 */
router.post('/', goodsReturnController.createGoodsReturn.bind(goodsReturnController));

/**
 * @route   GET /api/v1/goods-returns
 * @desc    Get all goods returns with pagination and filters
 * @access  Private
 */
router.get('/', goodsReturnController.getAll.bind(goodsReturnController));

/**
 * @route   GET /api/v1/goods-returns/challan/:challanNumber
 * @desc    Get goods returns by challan number
 * @access  Private
 */
router.get(
  '/challan/:challanNumber',
  goodsReturnController.getReturnsByChallan.bind(goodsReturnController)
);

/**
 * @route   GET /api/v1/goods-returns/challan/:challanNumber/summary
 * @desc    Get challan return summary
 * @access  Private
 */
router.get(
  '/challan/:challanNumber/summary',
  goodsReturnController.getChallanReturnSummary.bind(goodsReturnController)
);

/**
 * @route   GET /api/v1/goods-returns/:id/challan/pdf
 * @desc    Generate goods return challan PDF
 * @access  Private
 */
router.get('/:id/challan/pdf', goodsReturnController.generateChallanPDF.bind(goodsReturnController));

/**
 * @route   GET /api/v1/goods-returns/:id
 * @desc    Get goods return by ID
 * @access  Private
 */
router.get('/:id', goodsReturnController.getById.bind(goodsReturnController));

/**
 * @route   PUT /api/v1/goods-returns/:id
 * @desc    Update goods return
 * @access  Private
 */
router.put('/:id', goodsReturnController.update.bind(goodsReturnController));

/**
 * @route   DELETE /api/v1/goods-returns/:id
 * @desc    Delete goods return
 * @access  Private
 */
router.delete('/:id', goodsReturnController.delete.bind(goodsReturnController));

export default router;



