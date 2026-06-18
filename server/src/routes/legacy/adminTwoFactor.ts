import { Router, Request, Response } from 'express';
import TwoFactorService from '@/services/TwoFactorService';
import TwoFactor from '@/models/TwoFactor';
import User from '@/models/User';
import { authenticate, requireSuperAdmin } from '@/middleware/auth';
import { logAudit } from '@/utils/logger';

const router = Router();

/**
 * GET /api/admin/users/2fa-status
 * Get 2FA status for all users (Super Admin only)
 */
router.get('/users/2fa-status', authenticate, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    // Get all users with their 2FA status
    const users = await User.find({}, {
      password: 0,
      refreshTokens: 0
    }).lean();

    // Get 2FA status for all users
    const usersWith2FA = await Promise.all(
      users.map(async (user) => {
        const twoFactor = await TwoFactor.findOne({ userId: user._id });
        return {
          ...user,
          twoFactorEnabled: twoFactor ? twoFactor.isEnabled : false,
          twoFactorSetupAt: twoFactor?.setupAt,
          twoFactorLastUsed: twoFactor?.lastUsed,
          backupCodesCount: twoFactor ? twoFactor.getUnusedBackupCodesCount() : 0
        };
      })
    );

    // Calculate statistics
    const stats = {
      totalUsers: users.length,
      twoFactorEnabled: usersWith2FA.filter(u => u.twoFactorEnabled).length,
      twoFactorDisabled: usersWith2FA.filter(u => !u.twoFactorEnabled).length,
      adoptionRate: users.length > 0 ? Math.round((usersWith2FA.filter(u => u.twoFactorEnabled).length / users.length) * 100) : 0
    };

    res.json({
      success: true,
      data: {
        users: usersWith2FA,
        stats
      }
    });
  } catch (error: any) {
    console.error('Get users 2FA status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users 2FA status'
    });
  }
});

/**
 * POST /api/admin/users/:userId/enable-2fa
 * Force enable 2FA for a user (Super Admin only)
 */
router.post('/users/:userId/enable-2fa', authenticate, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const adminId = req.user?.id || req.user?._id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if 2FA is already enabled
    const existingTwoFactor = await TwoFactor.findOne({ userId });
    if (existingTwoFactor && existingTwoFactor.isEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled for this user'
      });
    }

    // Create or update 2FA record
    let twoFactor = existingTwoFactor;
    if (!twoFactor) {
      // Generate a temporary secret for admin-enabled 2FA
      const speakeasy = require('speakeasy');
      const secret = speakeasy.generateSecret({
        name: `ERP (${user.email})`,
        issuer: 'ERP System',
        length: 20
      });

      twoFactor = new TwoFactor({
        userId,
        secret: secret.base32,
        isEnabled: false
      });
    }

    // Generate backup codes
    const backupCodes = await twoFactor.generateBackupCodes();
    
    // Enable 2FA
    await twoFactor.enable();

    // Log admin action
    logAudit('Admin enabled 2FA for user', {
      adminId,
      targetUserId: userId,
      targetUsername: user.username,
      action: 'ADMIN_ENABLE_2FA'
    });

    res.json({
      success: true,
      data: {
        backupCodes,
        message: `2FA enabled for user ${user.username}. Backup codes generated.`
      },
      message: '2FA enabled successfully'
    });
  } catch (error: any) {
    console.error('Admin enable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enable 2FA'
    });
  }
});

/**
 * POST /api/admin/users/:userId/disable-2fa
 * Disable 2FA for a user (Super Admin only)
 */
router.post('/users/:userId/disable-2fa', authenticate, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const adminId = req.user?.id || req.user?._id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if 2FA is enabled
    const twoFactor = await TwoFactor.findOne({ userId });
    if (!twoFactor || !twoFactor.isEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled for this user'
      });
    }

    // Disable 2FA
    await twoFactor.disable();

    // Log admin action
    logAudit('Admin disabled 2FA for user', {
      adminId,
      targetUserId: userId,
      targetUsername: user.username,
      action: 'ADMIN_DISABLE_2FA'
    });

    res.json({
      success: true,
      message: `2FA disabled for user ${user.username}`
    });
  } catch (error: any) {
    console.error('Admin disable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA'
    });
  }
});

/**
 * POST /api/admin/users/:userId/force-disable-2fa
 * Force disable 2FA and remove all settings (Super Admin only)
 */
router.post('/users/:userId/force-disable-2fa', authenticate, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const adminId = req.user?.id || req.user?._id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove 2FA record completely
    const result = await TwoFactor.findOneAndDelete({ userId });
    
    if (!result) {
      return res.status(400).json({
        success: false,
        message: '2FA is not set up for this user'
      });
    }

    // Log admin action
    logAudit('Admin force disabled 2FA for user', {
      adminId,
      targetUserId: userId,
      targetUsername: user.username,
      action: 'ADMIN_FORCE_DISABLE_2FA'
    });

    res.json({
      success: true,
      message: `2FA force disabled for user ${user.username}. All 2FA settings and backup codes removed.`
    });
  } catch (error: any) {
    console.error('Admin force disable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to force disable 2FA'
    });
  }
});

/**
 * POST /api/admin/users/:userId/reset-2fa
 * Reset 2FA for a user (generate new secret and backup codes)
 */
router.post('/users/:userId/reset-2fa', authenticate, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const adminId = req.user?.id || req.user?._id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if 2FA exists
    const twoFactor = await TwoFactor.findOne({ userId });
    if (!twoFactor) {
      return res.status(400).json({
        success: false,
        message: '2FA is not set up for this user'
      });
    }

    // Generate new secret
    const speakeasy = require('speakeasy');
    const secret = speakeasy.generateSecret({
      name: `ERP System (${user.email})`,
      issuer: 'ERP Management System',
      length: 32
    });

    // Update secret and generate new backup codes
    twoFactor.secret = secret.base32;
    twoFactor.isEnabled = false; // User will need to re-enable
    twoFactor.setupAt = new Date();
    const backupCodes = await twoFactor.generateBackupCodes();
    await twoFactor.save();

    // Log admin action
    logAudit('Admin reset 2FA for user', {
      adminId,
      targetUserId: userId,
      targetUsername: user.username,
      action: 'ADMIN_RESET_2FA'
    });

    res.json({
      success: true,
      data: {
        backupCodes,
        message: `2FA reset for user ${user.username}. New secret generated and user must re-enable 2FA.`
      },
      message: '2FA reset successfully'
    });
  } catch (error: any) {
    console.error('Admin reset 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset 2FA'
    });
  }
});

/**
 * GET /api/admin/2fa-audit-log
 * Get 2FA audit log (Super Admin only)
 */
router.get('/2fa-audit-log', authenticate, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // This would require an audit log collection
    // For now, return empty array
    res.json({
      success: true,
      data: {
        logs: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      }
    });
  } catch (error: any) {
    console.error('Get 2FA audit log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get audit log'
    });
  }
});

export default router;
