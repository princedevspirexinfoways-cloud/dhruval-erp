import { Router } from 'express';
import { CustomerVisitController } from '../../controllers/CustomerVisitController';
import { authenticate, requireCompany } from '../../middleware/auth';

const router = Router();
const customerVisitController = new CustomerVisitController();

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(requireCompany);

/**
 * @route   POST /api/v1/customer-visits
 * @desc    Create a new customer visit
 * @access  Private
 */
router.post('/', customerVisitController.createCustomerVisit.bind(customerVisitController));

/**
 * @route   GET /api/v1/customer-visits/test
 * @desc    Test endpoint for customer visits
 * @access  Private
 */
router.get('/test', (req, res) => {
  console.log('Customer visits test endpoint called:', {
    user: req.user ? {
      userId: req.user.userId,
      username: req.user.username,
      companyId: req.user.companyId
    } : null,
    headers: req.headers,
    method: req.method,
    path: req.path
  });
  
  res.json({
    success: true,
    message: 'Customer visits API is working',
    timestamp: new Date().toISOString(),
    user: req.user ? {
      userId: req.user.userId,
      username: req.user.username,
      companyId: req.user.companyId
    } : null
  });
});

/**
 * @route   GET /api/v1/customer-visits
 * @desc    Get all customer visits with pagination and filters
 * @access  Private
 */
router.get('/', (req, res, next) => {
  console.log('Customer visits GET endpoint called:', {
    query: req.query,
    user: req.user ? {
      userId: req.user.userId,
      username: req.user.username,
      companyId: req.user.companyId
    } : null,
    headers: req.headers
  });
  customerVisitController.getAllCustomerVisits(req, res);
});

/**
 * @route   GET /api/v1/customer-visits/stats
 * @desc    Get customer visits statistics
 * @access  Private
 */
router.get('/stats', customerVisitController.getExpenseStats.bind(customerVisitController));

/**
 * @route   GET /api/v1/customer-visits/pending-approvals
 * @desc    Get pending approvals
 * @access  Private
 */
router.get('/pending-approvals', customerVisitController.getPendingApprovals.bind(customerVisitController));

/**
 * @route   GET /api/v1/customer-visits/:id
 * @desc    Get customer visit by ID
 * @access  Private
 */
router.get('/:id', customerVisitController.getCustomerVisitById.bind(customerVisitController));

/**
 * @route   PUT /api/v1/customer-visits/:id
 * @desc    Update customer visit
 * @access  Private
 */
router.put('/:id', customerVisitController.updateCustomerVisit.bind(customerVisitController));

/**
 * @route   DELETE /api/v1/customer-visits/:id
 * @desc    Delete customer visit
 * @access  Private
 */
router.delete('/:id', customerVisitController.deleteCustomerVisit.bind(customerVisitController));

/**
 * @route   PATCH /api/v1/customer-visits/:id/approve
 * @desc    Approve customer visit
 * @access  Private
 */
router.patch('/:id/approve', customerVisitController.approveVisit.bind(customerVisitController));

/**
 * @route   PATCH /api/v1/customer-visits/:id/reject
 * @desc    Reject customer visit
 * @access  Private
 */
router.patch('/:id/reject', customerVisitController.rejectVisit.bind(customerVisitController));

/**
 * @route   PATCH /api/v1/customer-visits/:id/reimburse
 * @desc    Process reimbursement for customer visit
 * @access  Private
 */
router.patch('/:id/reimburse', customerVisitController.markAsReimbursed.bind(customerVisitController));

/**
 * @route   POST /api/v1/customer-visits/:id/food-expense
 * @desc    Add food expense to customer visit
 * @access  Private
 */
router.post('/:id/food-expense', customerVisitController.addFoodExpense.bind(customerVisitController));

/**
 * @route   POST /api/v1/customer-visits/:id/gift
 * @desc    Add gift to customer visit
 * @access  Private
 */
router.post('/:id/gift', customerVisitController.addGift.bind(customerVisitController));

/**
 * @route   POST /api/v1/customer-visits/:id/transportation-expense
 * @desc    Add transportation expense to customer visit
 * @access  Private
 */
router.post('/:id/transportation-expense', customerVisitController.addTransportationExpense.bind(customerVisitController));

/**
 * @route   POST /api/v1/customer-visits/:id/other-expense
 * @desc    Add other expense to customer visit
 * @access  Private
 */
router.post('/:id/other-expense', customerVisitController.addOtherExpense.bind(customerVisitController));

/**
 * @route   POST /api/v1/customer-visits/:id/recalculate-totals
 * @desc    Recalculate totals for customer visit
 * @access  Private
 */
router.post('/:id/recalculate-totals', customerVisitController.recalculateTotals.bind(customerVisitController));

export default router;
