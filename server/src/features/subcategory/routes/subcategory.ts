import { Router } from 'express';
import { SubcategoryController } from '../controllers/SubcategoryController';
import { authenticate } from '../../../middleware/auth';

const router = Router();
const subcategoryController = new SubcategoryController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v1/subcategories
 * @desc    Create a new subcategory
 * @access  Private
 */
router.post('/', subcategoryController.createSubcategory.bind(subcategoryController));

/**
 * @route   GET /api/v1/subcategories
 * @desc    Get all subcategories with optional filters
 * @access  Private
 */
router.get('/', subcategoryController.getSubcategories.bind(subcategoryController));

/**
 * @route   GET /api/v1/subcategories/category/:categoryId
 * @desc    Get subcategories by category ID
 * @access  Private
 */
router.get('/category/:categoryId', subcategoryController.getSubcategoriesByCategory.bind(subcategoryController));

/**
 * @route   GET /api/v1/subcategories/:id
 * @desc    Get subcategory by ID
 * @access  Private
 */
router.get('/:id', subcategoryController.getSubcategoryById.bind(subcategoryController));

/**
 * @route   PUT /api/v1/subcategories/:id
 * @desc    Update subcategory
 * @access  Private
 */
router.put('/:id', subcategoryController.updateSubcategory.bind(subcategoryController));

/**
 * @route   DELETE /api/v1/subcategories/:id
 * @desc    Delete subcategory
 * @access  Private
 */
router.delete('/:id', subcategoryController.deleteSubcategory.bind(subcategoryController));

export default router;
















