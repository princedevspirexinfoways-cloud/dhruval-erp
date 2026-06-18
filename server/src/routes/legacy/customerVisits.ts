import { Router } from 'express';
import { CustomerVisitController } from '../controllers/CustomerVisitController';
import { authenticate } from '../middleware/auth';

const router = Router();
const customerVisitController = new CustomerVisitController();

// Apply authentication to all routes
router.use(authenticate);

// Routes
router.get('/', customerVisitController.getAllCustomerVisits.bind(customerVisitController));
router.get('/stats', customerVisitController.getExpenseStats.bind(customerVisitController));
router.get('/pending-approvals', customerVisitController.getPendingApprovals.bind(customerVisitController));
router.get('/:id', customerVisitController.getCustomerVisitById.bind(customerVisitController));
router.post('/', customerVisitController.createCustomerVisit.bind(customerVisitController));
router.put('/:id', customerVisitController.updateCustomerVisit.bind(customerVisitController));
router.delete('/:id', customerVisitController.deleteCustomerVisit.bind(customerVisitController));
router.patch('/:id/approve', customerVisitController.approveVisit.bind(customerVisitController));
router.patch('/:id/reject', customerVisitController.rejectVisit.bind(customerVisitController));
router.patch('/:id/reimburse', customerVisitController.markAsReimbursed.bind(customerVisitController));
router.post('/:id/food-expense', customerVisitController.addFoodExpense.bind(customerVisitController));
router.post('/:id/gift', customerVisitController.addGift.bind(customerVisitController));

export default router;