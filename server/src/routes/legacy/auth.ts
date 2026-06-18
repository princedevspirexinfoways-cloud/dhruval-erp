import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

import User from '@/models/User';
import Company from '@/models/Company';
import { generateAccessToken, generateRefreshToken, refreshAccessToken } from '@/middleware/auth';
import { authRateLimit } from '@/middleware/security';
import config from '@/config/environment';
import logger, { logSecurity, logAudit } from '@/utils/logger';

// Import 2FA service
import TwoFactorService from '@/services/TwoFactorService';
import twoFactorRoutes from '@/routes/twoFactor';

const router = Router();

// =============================================
// VALIDATION RULES
// =============================================
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, and underscores'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: config.PASSWORD_MIN_LENGTH })
    .withMessage(`Password must be at least ${config.PASSWORD_MIN_LENGTH} characters long`)
    .custom((value) => {
      if (config.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(value)) {
        throw new Error('Password must contain at least one uppercase letter');
      }
      if (config.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(value)) {
        throw new Error('Password must contain at least one lowercase letter');
      }
      if (config.PASSWORD_REQUIRE_NUMBERS && !/\d/.test(value)) {
        throw new Error('Password must contain at least one number');
      }
      if (config.PASSWORD_REQUIRE_SYMBOLS && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        throw new Error('Password must contain at least one special character');
      }
      return true;
    }),
  
  body('firstName')
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('First name is required and must be less than 100 characters'),
  
  body('lastName')
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Last name is required and must be less than 100 characters'),
  
  body('phone')
    .matches(/^[+]?[1-9][\d\s\-\(\)]{7,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('companyCode')
    .isLength({ min: 2, max: 20 })
    .toUpperCase()
    .withMessage('Company code is required and must be 2-20 characters')
];

const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username, email, or phone number is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  body('companyCode')
    .optional()
    .isLength({ min: 2, max: 20 })
    .toUpperCase()
    .withMessage('Company code must be 2-20 characters if provided')
];

// =============================================
// REGISTER ENDPOINT
// =============================================
router.post('/register', authRateLimit, registerValidation, async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const {
      username,
      email,
      password,
      firstName,
      lastName,
      middleName,
      phone,
      alternatePhone,
      companyCode,
      companyName,
      legalName,
      gstin,
      pan
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });

    if (existingUser) {
      logSecurity('Registration attempt with existing credentials', {
        username,
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this username or email already exists'
      });
    }

    // Check if company exists
    let company = await Company.findOne({ companyCode: companyCode.toUpperCase() });
    
    if (!company) {
      // Create new company if it doesn't exist
      company = new Company({
        companyCode: companyCode.toUpperCase(),
        companyName: companyName || `${firstName} ${lastName} Company`,
        legalName: legalName || companyName || `${firstName} ${lastName} Company`,
        registrationDetails: {
          gstin: gstin || '',
          pan: pan || ''
        },
        addresses: {
          registeredOffice: {
            country: 'India'
          },
          factoryAddress: {
            country: 'India'
          }
        },
        contactInfo: {
          phones: [{ type: phone, label: 'Primary' }],
          emails: [{ type: email, label: 'Primary' }]
        },
        bankAccounts: [],
        businessConfig: {
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          fiscalYearStart: '04-01',
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          workingHours: {
            start: '09:00',
            end: '18:00',
            breakStart: '13:00',
            breakEnd: '14:00'
          },
          gstRates: {
            defaultRate: 18,
            rawMaterialRate: 5,
            finishedGoodsRate: 18
          }
        },
        productionCapabilities: {
          productTypes: ['saree', 'african_cotton', 'garment_fabric'],
          printingMethods: ['table_printing', 'machine_printing'],
          monthlyCapacity: {},
          qualityCertifications: []
        },
        licenses: [],
        isActive: true,
        createdBy: new User()._id // Temporary, will be updated after user creation
      });
    }

    // Create new user
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password, // Will be hashed by pre-save middleware
      personalInfo: {
        firstName,
        lastName,
        middleName,
        phone,
        alternatePhone
      },
      addresses: {
        current: { country: 'India' },
        permanent: { country: 'India' }
      },
      primaryCompanyId: company._id,
      companyAccess: [{
        companyId: company._id,
        role: 'super_admin', // First user becomes super admin
        department: 'Management',
        designation: 'Owner',
        permissions: {
          inventory: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true },
          production: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true, startProcess: true, qualityCheck: true },
          orders: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true, dispatch: true },
          financial: { view: true, create: true, edit: true, delete: true, approve: true, viewReports: true, bankTransactions: true },
          security: { gateManagement: true, visitorManagement: true, vehicleTracking: true, cctvAccess: true, emergencyResponse: true },
          hr: { viewEmployees: true, manageAttendance: true, manageSalary: true, viewReports: true },
          admin: { userManagement: true, systemSettings: true, backupRestore: true, auditLogs: true }
        },
        isActive: true,
        joinedAt: new Date()
      }],
      security: {
        failedLoginAttempts: 0,
        accountLocked: false,
        twoFactorEnabled: false,
        mustChangePassword: false
      },
      preferences: {
        language: 'en',
        theme: 'light',
        notifications: {
          email: true,
          sms: true,
          whatsapp: false,
          push: true
        },
        dashboard: {
          defaultCompany: company._id,
          widgets: ['inventory-summary', 'production-status', 'recent-orders', 'financial-overview']
        }
      },
      isActive: true
    });

    // Save user and update company
    await user.save();
    
    if (!company.createdBy) {
      company.createdBy = user._id;
      await company.save();
    }

    // Generate tokens
    const accessToken = generateAccessToken(user, company._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Log successful registration
    logAudit('User registered', {
      userId: user._id,
      username: user.username,
      email: user.email,
      companyId: company._id,
      companyCode: company.companyCode,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.COOKIE_SECURE,
      sameSite: config.COOKIE_SAME_SITE,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: config.NODE_ENV === 'production' ? config.COOKIE_DOMAIN : undefined
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          companyAccess: user.companyAccess.map(access => ({
            companyId: access.companyId,
            companyName: company.companyName,
            companyCode: company.companyCode,
            role: access.role,
            department: access.department,
            designation: access.designation
          }))
        },
        company: {
          id: company._id,
          name: company.companyName,
          code: company.companyCode
        },
        tokens: {
          accessToken,
          expiresIn: config.JWT_EXPIRE
        }
      }
    });

  } catch (error) {
    logger.error('Registration failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      username: req.body.username,
      email: req.body.email,
      ip: req.ip
    });

    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration. Please try again.'
    });
  }
});

// =============================================
// LOGIN ENDPOINT
// =============================================
router.post('/login', authRateLimit, loginValidation, async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { username, password, companyCode } = req.body;

    // Find user by username, email, or phone
    const user = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() },
        { 'personalInfo.phone': username }
      ],
      isActive: true
    }).populate('companyAccess.companyId', 'companyName companyCode isActive');

    if (!user) {
      logSecurity('Login attempt with invalid username', {
        username,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }

    // Check if account is locked
    if (user.security.accountLocked) {
      const lockoutTime = user.security.lockoutTime;
      if (lockoutTime && lockoutTime > new Date()) {
        logSecurity('Login attempt on locked account', {
          userId: user._id,
          username: user.username,
          ip: req.ip,
          lockoutTime
        });

        return res.status(423).json({
          error: 'Account locked',
          message: 'Account is temporarily locked due to multiple failed login attempts',
          unlockTime: lockoutTime
        });
      }
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment failed login attempts
      await user.incrementLoginAttempts();

      logSecurity('Login attempt with invalid password', {
        userId: user._id,
        username: user.username,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        failedAttempts: user.security.failedLoginAttempts + 1
      });

      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }

    // Reset failed login attempts on successful login
    await user.resetLoginAttempts();

    // Check if 2FA is enabled for this user
    const isTwoFactorEnabled = await TwoFactorService.isUserTwoFactorEnabled(user._id);

    if (isTwoFactorEnabled) {
      // Generate temporary token for 2FA verification
      const tempToken = jwt.sign(
        {
          userId: user._id,
          type: 'temp_2fa',
          timestamp: Date.now()
        },
        config.JWT_SECRET,
        { expiresIn: '10m' } // 10 minutes to complete 2FA
      );

      logSecurity('2FA required for login', {
        userId: user._id,
        username: user.username,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(200).json({
        success: true,
        requiresTwoFactor: true,
        tempToken,
        message: 'Two-factor authentication required'
      });
    }

    // Handle super admin vs regular user company access
    let selectedCompanyAccess;
    let allCompanies = [];

    if (user.isSuperAdmin) {
      // Super admin can access all companies
      allCompanies = await Company.find({ isActive: true }).select('_id companyName companyCode isActive').lean();

      if (companyCode) {
        const targetCompany = allCompanies.find(company => company.companyCode === companyCode.toUpperCase());
        if (targetCompany) {
          selectedCompanyAccess = {
            companyId: targetCompany,
            role: 'super_admin',
            permissions: ['*'], // All permissions
            isActive: true
          };
        }
      } else {
        // Use first company as default for super admin
        if (allCompanies.length > 0) {
          selectedCompanyAccess = {
            companyId: allCompanies[0],
            role: 'super_admin',
            permissions: ['*'],
            isActive: true
          };
        }
      }
    } else {
      // Regular user - check company access
      if (companyCode) {
        selectedCompanyAccess = user.companyAccess.find(
          access => (access.companyId as any).companyCode === companyCode.toUpperCase() &&
                   access.isActive &&
                   (access.companyId as any).isActive
        );

        if (!selectedCompanyAccess) {
          return res.status(403).json({
            error: 'Company access denied',
            message: 'You do not have access to this company'
          });
        }
      } else {
        // Use default company or first active company
        selectedCompanyAccess = user.companyAccess.find(
          access => access.companyId._id.toString() === user.preferences.dashboard.defaultCompany?.toString()
        ) || user.companyAccess.find(access => access.isActive && (access.companyId as any).isActive);
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken(
      user, 
      selectedCompanyAccess?.companyId._id.toString()
    );
    const refreshToken = generateRefreshToken(user._id.toString());

    // Log successful login
    logAudit('User logged in', {
      userId: user._id,
      username: user.username,
      companyId: selectedCompanyAccess?.companyId._id,
      companyCode: selectedCompanyAccess?.companyId.companyCode,
      role: selectedCompanyAccess?.role,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.COOKIE_SECURE,
      sameSite: config.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: config.NODE_ENV === 'production' ? config.COOKIE_DOMAIN : undefined,
      path: '/'
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          isSuperAdmin: user.isSuperAdmin,
          companyAccess: user.isSuperAdmin
            ? allCompanies.map(company => ({
                companyId: company._id,
                companyName: company.companyName,
                companyCode: company.companyCode,
                role: 'super_admin',
                department: 'Administration',
                designation: 'Super Administrator'
              }))
            : user.companyAccess
                .filter(access => access.isActive && (access.companyId as any).isActive)
                .map(access => ({
                  companyId: (access.companyId as any)._id,
                  companyName: (access.companyId as any).companyName,
                  companyCode: (access.companyId as any).companyCode,
                  role: access.role,
                  department: access.department,
                  designation: access.designation
                }))
        },
        companies: user.isSuperAdmin ? allCompanies : user.companyAccess
          .filter(access => access.isActive && (access.companyId as any).isActive)
          .map(access => ({
            _id: (access.companyId as any)._id,
            companyName: (access.companyId as any).companyName,
            companyCode: (access.companyId as any).companyCode
          })),
        currentCompany: selectedCompanyAccess ? {
          id: (selectedCompanyAccess.companyId as any)._id,
          name: (selectedCompanyAccess.companyId as any).companyName,
          code: (selectedCompanyAccess.companyId as any).companyCode,
          role: selectedCompanyAccess.role,
          permissions: selectedCompanyAccess.permissions
        } : null,
        tokens: {
          accessToken,
          expiresIn: config.JWT_EXPIRE
        }
      }
    });

  } catch (error) {
    logger.error('Login failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      username: req.body.username,
      ip: req.ip
    });

    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login. Please try again.'
    });
  }
});

// =============================================
// REFRESH TOKEN ENDPOINT
// =============================================
router.post('/refresh', refreshAccessToken);

// =============================================
// LOGOUT ENDPOINT
// =============================================
router.post('/logout', (req: Request, res: Response) => {
  // Clear refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.COOKIE_SECURE,
    sameSite: config.COOKIE_SAME_SITE,
    domain: config.NODE_ENV === 'production' ? config.COOKIE_DOMAIN : undefined
  });

  logAudit('User logged out', {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// =============================================
// 2FA ROUTES
// =============================================
// Mount 2FA routes under /auth/2fa
router.use('/2fa', twoFactorRoutes);

export default router;
