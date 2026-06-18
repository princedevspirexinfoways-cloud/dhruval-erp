import { Router, Request, Response } from 'express';
import User from '@/models/User';
import Company from '@/models/Company';
import TwoFactor from '@/models/TwoFactor';
import { authenticate, requireSuperAdmin, requireAdmin } from '@/middleware/auth';
import { logAudit } from '@/utils/logger';
import bcrypt from 'bcryptjs';

const router = Router();

/**
 * GET /api/admin/users
 * Get all users with their 2FA status
 */
router.get('/users', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    let query = {};

    // If not super admin, only show users from current admin's company
    if (!currentUser?.isSuperAdmin) {
      query = { 'companyAccess.companyId': currentUser?.companyId };
    }

    const users = await User.find(query, {
      password: 0,
      refreshTokens: 0
    }).populate('companyAccess.companyId', 'companyName companyCode').lean();

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

    res.json({
      success: true,
      data: usersWith2FA
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
});

/**
 * POST /api/admin/users
 * Create new user
 */
router.post('/users', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    const {
      username,
      email,
      firstName,
      lastName,
      phone,
      password,
      companyId,
      role,
      department,
      designation,
      isActive
    } = req.body;

    // Validate required fields
    if (!username || !email || !firstName || !lastName || !password || !companyId || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this username or email already exists'
      });
    }

    // If not super admin, ensure user is being created for current admin's company
    if (!currentUser?.isSuperAdmin && companyId !== currentUser?.companyId) {
      return res.status(403).json({
        success: false,
        message: 'You can only create users for your own company'
      });
    }

    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company selected'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = new User({
      username,
      email,
      personalInfo: {
        firstName,
        lastName,
        phone: phone || ''
      },
      password: hashedPassword,
      primaryCompanyId: companyId,
      companyAccess: [{
        companyId,
        role,
        department: department || 'Management',
        designation: designation || '',
        permissions: {
          inventory: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
          production: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
          orders: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
          financial: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
          security: { gateManagement: false, visitorManagement: false, vehicleTracking: false, cctvAccess: false, emergencyResponse: false, securityReports: false, incidentManagement: false, accessControl: false, patrolManagement: false },
          hr: { viewEmployees: false, manageEmployees: false, manageAttendance: false, manageSalary: false, manageLeaves: false, viewReports: false, recruitment: false, performance: false, training: false, disciplinary: false },
          admin: { userManagement: false, systemSettings: false, backupRestore: false, auditLogs: false }
        },
        isActive: true,
        joinedAt: new Date()
      }],
      isActive: isActive !== undefined ? isActive : true,
      isSuperAdmin: role === 'super_admin' && currentUser?.isSuperAdmin
    });

    await newUser.save();

    // Log admin action
    logAudit('Admin created user', {
      adminId: currentUser?._id,
      targetUserId: newUser._id,
      targetUsername: username,
      companyId,
      action: 'ADMIN_CREATE_USER'
    });

    res.status(201).json({
      success: true,
      data: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        personalInfo: newUser.personalInfo,
        companyAccess: newUser.companyAccess,
        isActive: newUser.isActive
      },
      message: 'User created successfully'
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
});

/**
 * PUT /api/admin/users/:userId
 * Update user
 */
router.put('/users/:userId', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    const { userId } = req.params;
    const {
      username,
      email,
      firstName,
      lastName,
      phone,
      password,
      companyId,
      role,
      department,
      designation,
      isActive
    } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    if (!currentUser?.isSuperAdmin) {
      const userCompanyId = user.companyAccess?.[0]?.companyId?.toString();
      if (userCompanyId !== currentUser?.companyId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only edit users from your own company'
        });
      }
    }

    // Update basic info
    if (username) user.username = username;
    if (email) user.email = email;
    if (firstName) user.personalInfo.firstName = firstName;
    if (lastName) user.personalInfo.lastName = lastName;
    if (phone !== undefined) user.personalInfo.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;

    // Update password if provided
    if (password && password.length >= 8) {
      user.password = await bcrypt.hash(password, 12);
      user.security.passwordLastChanged = new Date();
    }

    // Update company access if provided
    if (companyId && role) {
      // Verify company exists
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(400).json({
          success: false,
          message: 'Invalid company selected'
        });
      }

      user.companyAccess = [{
        companyId,
        role,
        department: department || 'Management',
        designation: designation || '',
        permissions: user.companyAccess?.[0]?.permissions || {
          inventory: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
          production: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
          orders: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
          financial: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
          security: { gateManagement: false, visitorManagement: false, vehicleTracking: false, cctvAccess: false, emergencyResponse: false, securityReports: false, incidentManagement: false, accessControl: false, patrolManagement: false },
          hr: { viewEmployees: false, manageEmployees: false, manageAttendance: false, manageSalary: false, manageLeaves: false, viewReports: false, recruitment: false, performance: false, training: false, disciplinary: false },
          admin: { userManagement: false, systemSettings: false, backupRestore: false, auditLogs: false }
        },
        isActive: true,
        joinedAt: user.companyAccess?.[0]?.joinedAt || new Date()
      }];

      // Update super admin status if current user is super admin
      if (currentUser?.isSuperAdmin) {
        user.isSuperAdmin = role === 'super_admin';
      }
    }

    await user.save();

    // Log admin action
    logAudit('Admin updated user', {
      adminId: currentUser?._id,
      targetUserId: userId,
      targetUsername: user.username,
      action: 'ADMIN_UPDATE_USER'
    });

    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete user
 */
router.delete('/users/:userId', authenticate, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    const { userId } = req.params;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting super admin users (unless current user is also super admin)
    if (user.isSuperAdmin && !currentUser?.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete super admin user'
      });
    }

    // Delete user's 2FA settings
    await TwoFactor.findOneAndDelete({ userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    // Log admin action
    logAudit('Admin deleted user', {
      adminId: currentUser?._id,
      targetUserId: userId,
      targetUsername: user.username,
      action: 'ADMIN_DELETE_USER'
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

/**
 * POST /api/admin/users/:userId/toggle-status
 * Toggle user active status
 */
router.post('/users/:userId/toggle-status', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    const { userId } = req.params;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    if (!currentUser?.isSuperAdmin) {
      const userCompanyId = user.companyAccess?.[0]?.companyId?.toString();
      if (userCompanyId !== currentUser?.companyId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only manage users from your own company'
        });
      }
    }

    // Toggle status
    user.isActive = !user.isActive;
    await user.save();

    // Log admin action
    logAudit('Admin toggled user status', {
      adminId: currentUser?._id,
      targetUserId: userId,
      targetUsername: user.username,
      newStatus: user.isActive,
      action: 'ADMIN_TOGGLE_USER_STATUS'
    });

    res.json({
      success: true,
      data: {
        isActive: user.isActive
      },
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error: any) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle user status'
    });
  }
});

export default router;
