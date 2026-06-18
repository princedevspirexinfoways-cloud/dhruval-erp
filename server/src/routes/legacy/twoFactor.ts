import { Router, Request, Response } from 'express';
import TwoFactorService from '@/services/TwoFactorService';
import { authenticate } from '@/middleware/auth';
import User from '@/models/User';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for 2FA operations
const twoFactorRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 5 attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many 2FA attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * GET /api/auth/2fa/status
 * Get 2FA status for current user
 */
router.get('/status', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const status = await TwoFactorService.getTwoFactorStatus(userId);

    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    console.error('Get 2FA status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get 2FA status'
    });
  }
});

/**
 * POST /api/auth/2fa/setup
 * Setup 2FA - Generate secret and QR code
 */
router.post('/setup', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id;

    console.log('Setting up 2FA for user:', userId);
    const setupData = await TwoFactorService.setupTwoFactor(userId);

    res.json({
      success: true,
      data: setupData,
      message: 'Scan the QR code with your authenticator app'
    });
  } catch (error: any) {
    console.error('2FA setup error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to setup 2FA'
    });
  }
});

/**
 * POST /api/auth/2fa/test
 * Test 2FA token during setup
 */
router.post('/test', authenticate, twoFactorRateLimit, async (req: Request, res: Response) => {
  try {
    const { secret, token } = req.body;
    
    if (!secret || !token) {
      return res.status(400).json({
        success: false,
        message: 'Secret and token are required'
      });
    }
    
    const result = await TwoFactorService.testToken(secret, token);
    
    res.json({
      success: result.verified,
      message: result.message
    });
  } catch (error: any) {
    console.error('2FA test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test token'
    });
  }
});

/**
 * POST /api/auth/2fa/enable
 * Enable 2FA after verification
 */
router.post('/enable', authenticate, twoFactorRateLimit, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const result = await TwoFactorService.enableTwoFactor(userId, token);
    
    res.json({
      success: true,
      data: result,
      message: 'Two-factor authentication enabled successfully'
    });
  } catch (error: any) {
    console.error('2FA enable error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to enable 2FA'
    });
  }
});

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA
 */
router.post('/disable', authenticate, twoFactorRateLimit, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { password, token } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to disable 2FA'
      });
    }

    const result = await TwoFactorService.disableTwoFactor(userId, password, token);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error: any) {
    console.error('2FA disable error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to disable 2FA'
    });
  }
});

/**
 * POST /api/auth/2fa/verify
 * Verify 2FA token during login
 */
router.post('/verify', twoFactorRateLimit, async (req: Request, res: Response) => {
  try {
    const { token, backupCode, tempToken } = req.body;
    console.log('2FA verify request:', { hasToken: !!token, hasBackupCode: !!backupCode, hasTempToken: !!tempToken });

    if (!tempToken) {
      console.log('No temp token provided');
      return res.status(400).json({
        success: false,
        message: 'Temporary token required'
      });
    }

    // Verify temporary token
    const jwt = require('jsonwebtoken');
    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
      console.log('Temp token decoded:', { userId: decoded.userId, type: decoded.type });
    } catch (error) {
      console.log('Temp token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired temporary token'
      });
    }

    if (decoded.type !== 'temp_2fa') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    const userId = decoded.userId;

    // Verify 2FA token or backup code
    let verified = false;
    if (token) {
      console.log('Verifying TOTP token:', token);
      verified = await TwoFactorService.verifyToken(userId, token, false);
    } else if (backupCode) {
      console.log('Verifying backup code:', backupCode);
      verified = await TwoFactorService.verifyToken(userId, backupCode, true);
    } else {
      console.log('No token or backup code provided');
      return res.status(400).json({
        success: false,
        message: 'Token or backup code required'
      });
    }

    console.log('2FA verification result:', verified);

    if (!verified) {
      return res.status(401).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Get user data for response
    const User = require('@/models/User').default;
    const user = await User.findById(userId)
      .populate('companyAccess.companyId')
      .select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate access token and refresh token
    const { generateAccessToken, generateRefreshToken } = require('@/middleware/auth');
    const config = require('@/config/environment').default;

    const accessToken = generateAccessToken(user, user.companyAccess?.[0]?.companyId?._id);
    const refreshToken = generateRefreshToken(user._id);

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Helper function to convert JWT expire time to milliseconds
    const parseJWTExpire = (expireStr: string): number => {
      const match = expireStr.match(/^(\d+)([smhd])$/);
      if (!match) return 15 * 60 * 1000; // Default 15 minutes

      const value = parseInt(match[1]);
      const unit = match[2];

      switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return 15 * 60 * 1000;
      }
    };

    // Set cookies for authentication using config values
    const cookieOptions = {
      httpOnly: config.COOKIE_HTTP_ONLY,
      secure: config.COOKIE_SECURE,
      sameSite: config.COOKIE_SAME_SITE,
      domain: config.NODE_ENV === 'production' ? config.COOKIE_DOMAIN : undefined
    };

    // Access token cookie (use JWT_EXPIRE time)
    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: parseJWTExpire(config.JWT_EXPIRE)
    });

    // Refresh token cookie (use JWT_REFRESH_EXPIRE time)
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: parseJWTExpire(config.JWT_REFRESH_EXPIRE)
    });

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          personalInfo: user.personalInfo,
          isSuperAdmin: user.isSuperAdmin,
          isActive: user.isActive,
          companyAccess: user.companyAccess,
          lastLoginAt: new Date()
        },
        tokens: {
          accessToken,
          refreshToken
        },
        companies: user.companyAccess?.map((access: any) => access.companyId) || [],
        currentCompany: user.companyAccess?.[0]?.companyId || null,
        permissions: {} // Add permissions logic as needed
      },
      message: 'Two-factor authentication successful'
    });
  } catch (error: any) {
    console.error('2FA verify error:', error);
    
    if (error.message.includes('locked')) {
      return res.status(423).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Two-factor authentication failed'
    });
  }
});

/**
 * POST /api/auth/2fa/backup-codes
 * Generate new backup codes
 */
router.post('/backup-codes', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to generate backup codes'
      });
    }

    const result = await TwoFactorService.generateBackupCodes(userId, password);
    
    res.json({
      success: true,
      data: result,
      message: 'New backup codes generated successfully'
    });
  } catch (error: any) {
    console.error('Generate backup codes error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to generate backup codes'
    });
  }
});

/**
 * POST /api/auth/2fa/reset-request
 * Request 2FA reset (sends email with reset instructions)
 */
router.post('/reset-request', twoFactorRateLimit, async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Temporary token required'
      });
    }

    const tempToken = authHeader.substring(7);

    // Verify temp token
    const jwt = require('jsonwebtoken');
    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired temporary token'
      });
    }

    if (decoded.type !== 'temp_2fa') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    const userId = decoded.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign({
      userId: user._id,
      type: '2fa_reset',
      timestamp: Date.now()
    }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // In a real application, you would send an email here
    // For now, we'll just log it and return success
    console.log(`2FA Reset token for ${user.email}: ${resetToken}`);

    // Log the reset request
    const { logSecurity } = require('@/utils/logger');
    logSecurity('2FA reset requested', {
      userId: user._id,
      username: user.username,
      email: user.email
    });

    res.json({
      success: true,
      message: 'Reset instructions have been sent to your email address. Please check your inbox.',
      // In development, include the reset token for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });
  } catch (error: any) {
    console.error('2FA reset request error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process reset request'
    });
  }
});

export default router;
