import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { authenticate } from '../../../middleware/auth';

const router = Router();
const categoryController = new CategoryController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v1/categories
 * @desc    Create a new category
 * @access  Private
 */
router.post('/', categoryController.createCategory);

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories by company
 * @access  Private
 */
router.get('/', categoryController.getCategoriesByCompany);

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get category by ID
 * @access  Private
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update category
 * @access  Private
 */
router.put('/:id', categoryController.updateCategory);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete category (soft delete)
 * @access  Private
 */
router.delete('/:id', categoryController.deleteCategory);

export default router;
