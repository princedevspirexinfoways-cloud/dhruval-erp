import { Router } from 'express';
import { UserManagementController } from '../controllers/UserManagementController';
import { authenticate } from '../middleware/auth';
import { body, param, query } from 'express-validator';

const router = Router();

// Validation middleware
const createUserValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('firstName')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  
  body('lastName')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  
  body('phone')
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  
  body('companyId')
    .isMongoId()
    .withMessage('Please provide a valid company ID'),
  
  body('role')
    .isIn(['super_admin', 'owner', 'manager', 'accountant', 'production_manager', 'sales_executive', 'security_guard', 'operator', 'helper'])
    .withMessage('Please provide a valid role'),
  
  body('department')
    .optional()
    .isIn(['Management', 'Production', 'Sales', 'Accounts', 'Security', 'Quality', 'Warehouse'])
    .withMessage('Please provide a valid department'),
  
  body('designation')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Designation must be less than 100 characters'),
  
  body('employeeId')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Employee ID must be less than 50 characters')
];

const updateUserValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Please provide a valid user ID'),
  
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be less than 50 characters'),
  
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be less than 50 characters'),
  
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number')
];

const getUserValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Please provide a valid user ID')
];

const getUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters'),
  
  query('role')
    .optional()
    .isIn(['super_admin', 'owner', 'manager', 'accountant', 'production_manager', 'sales_executive', 'security_guard', 'operator', 'helper'])
    .withMessage('Please provide a valid role'),
  
  query('companyId')
    .optional()
    .isMongoId()
    .withMessage('Please provide a valid company ID')
];

/**
 * @route GET /api/v1/admin/users
 * @desc Get all users (SuperAdmin only)
 * @access Private (SuperAdmin)
 */
router.get('/', authenticate, getUsersValidation, UserManagementController.getAllUsers);

/**
 * @route POST /api/v1/admin/users
 * @desc Create new user (SuperAdmin only)
 * @access Private (SuperAdmin)
 */
router.post('/', authenticate, createUserValidation, UserManagementController.createUser);

/**
 * @route GET /api/v1/admin/users/:userId
 * @desc Get user by ID (SuperAdmin only)
 * @access Private (SuperAdmin)
 */
router.get('/:userId', authenticate, getUserValidation, UserManagementController.getUserById);

/**
 * @route PUT /api/v1/admin/users/:userId
 * @desc Update user (SuperAdmin only)
 * @access Private (SuperAdmin)
 */
router.put('/:userId', authenticate, updateUserValidation, UserManagementController.updateUser);

/**
 * @route DELETE /api/v1/admin/users/:userId
 * @desc Delete user (SuperAdmin only)
 * @access Private (SuperAdmin)
 */
router.delete('/:userId', authenticate, getUserValidation, UserManagementController.deleteUser);

export default router;
