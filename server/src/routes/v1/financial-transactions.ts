import { Router } from 'express';
import { FinancialTransactionController } from '../../controllers/FinancialTransactionController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const financialTransactionController = new FinancialTransactionController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v2/financial-transactions
 * @desc    Create a new financial transaction
 * @access  Private
 */
router.post('/', financialTransactionController.createTransaction.bind(financialTransactionController));

/**
 * @route   GET /api/v2/financial-transactions
 * @desc    Get financial transactions by company with pagination and filters
 * @access  Private
 */
router.get('/', financialTransactionController.getTransactionsByCompany.bind(financialTransactionController));

/**
 * @route   GET /api/v2/financial-transactions/search
 * @desc    Search financial transactions
 * @access  Private
 */
router.get('/search', financialTransactionController.searchTransactions.bind(financialTransactionController));

/**
 * @route   GET /api/v2/financial-transactions/stats
 * @desc    Get financial transaction statistics
 * @access  Private
 */
router.get('/stats', financialTransactionController.getTransactionStats.bind(financialTransactionController));

/**
 * @route   GET /api/v2/financial-transactions/type/:transactionType
 * @desc    Get transactions by type
 * @access  Private
 */
router.get('/type/:transactionType', financialTransactionController.getTransactionsByType.bind(financialTransactionController));

/**
 * @route   GET /api/v2/financial-transactions/:id
 * @desc    Get financial transaction by ID
 * @access  Private
 */
router.get('/:id', financialTransactionController.getTransactionById.bind(financialTransactionController));

/**
 * @route   PUT /api/v2/financial-transactions/:id
 * @desc    Update financial transaction
 * @access  Private
 */
router.put('/:id', financialTransactionController.updateTransaction.bind(financialTransactionController));

/**
 * @route   PUT /api/v2/financial-transactions/:transactionId/status
 * @desc    Update transaction status
 * @access  Private
 */
router.put('/:transactionId/status', financialTransactionController.updateTransactionStatus.bind(financialTransactionController));

/**
 * @route   DELETE /api/v2/financial-transactions/:id
 * @desc    Cancel financial transaction
 * @access  Private
 */
router.delete('/:id', financialTransactionController.deleteTransaction.bind(financialTransactionController));

export default router;
