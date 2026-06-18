import { BaseService } from './BaseService';
import User from '../models/User';
import Company from '../models/Company';
import Role from '../models/Role';
import { IUser, ICompanyAccess } from '@/types/models';
import { AppError } from '../utils/errors';

import { logger } from '@/utils/logger';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import config from '@/config/environment';

export class UserService extends BaseService<IUser> {
  constructor() {
    super(User);
  }

  /**
   * Override update method to prevent password updates through general updates
   * Passwords should only be updated through dedicated password update methods
   */
  async update(id: string, data: any, userId?: string): Promise<IUser | null> {
    // Prevent password updates through general update method
    if (data.password || data['user.password']) {
      throw new AppError(
        'Password updates are not allowed through general updates. Use updatePassword() or resetPassword() methods instead.',
        400
      );
    }

    // Call parent update method
    return super.update(id, data, userId);
  }

  /**
   * Create a new user with validation
   */
  async createUser(userData: Partial<IUser>, createdBy?: string): Promise<IUser> {
    try {
      // Validate user data
      await this.validateUserData(userData);

      // Normalize phone (trim spaces)
      // Normalize phone similar to model pre-save (keep leading + and digits only)
      let phone = userData.personalInfo?.phone
      if (phone) {
        const raw = phone.toString()
        phone = raw
          .replace(/\s+/g, '')
          .replace(/(?!^)[^\d]/g, '')
          .replace(/^\+?(.*)$/,(m, g1)=> (raw.startsWith('+') ? '+' : '') + g1)
      }

      // Check if username already exists
      const existingUsername = await this.findOne({ username: userData.username });
      if (existingUsername) {
        throw new AppError('Username already exists', 400);
      }

      // Check if email already exists (when provided)
      if (userData.email) {
        const existingEmail = await this.findOne({ email: userData.email.toLowerCase() });
        if (existingEmail) {
          throw new AppError('Email already exists', 400);
        }
      }

      // Check if phone already exists (unique)
      if (phone) {
        const existingPhone = await this.findOne({ 'personalInfo.phone': phone });
        if (existingPhone) {
          throw new AppError('Phone already exists', 400);
        }
      }

      // Note: Password hashing is handled by the User model's pre-save hook
      // No need to hash here to avoid double hashing
      // 
      // IMPORTANT: During updates, the BaseService.update() method uses findByIdAndUpdate
      // which does NOT trigger pre-save hooks, so passwords are never double-hashed
      // during updates. Only explicit password update methods (updatePassword, resetPassword)
      // handle password hashing manually.

      // Set default values
      const userToCreate = {
        ...userData,
        personalInfo: {
          ...userData.personalInfo,
          phone: phone || userData.personalInfo?.phone
        },
        isActive: true,
        isSuperAdmin: userData.isSuperAdmin || false,
        security: {
          ...userData.security,
          passwordLastChanged: new Date(),
          loginAttempts: 0,
          isLocked: false
        },
        preferences: {
          language: 'en',
          timezone: 'Asia/Kolkata',
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h',
          ...userData.preferences
        }
      };

      // Ensure non-superadmin users have company access
      if (!userToCreate.isSuperAdmin && (!userToCreate.companyAccess || userToCreate.companyAccess.length === 0)) {
        // If no company access provided, we need a default company
        if (!userToCreate.primaryCompanyId) {
          // Get the first active company as default
          const Company = require('../models/Company').default;
          const defaultCompany = await Company.findOne({ isActive: true }).sort({ createdAt: 1 });

          if (defaultCompany) {
            userToCreate.primaryCompanyId = defaultCompany._id;
            userToCreate.companyAccess = [{
              companyId: defaultCompany._id,
              role: 'operator',
              department: 'Production',
              isActive: true,
              joinedAt: new Date(),
              permissions: {
                inventory: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
                production: { view: true, create: true, edit: false, delete: false, approve: false, viewReports: false },
                orders: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
                financial: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
                security: {
                  gateManagement: false,
                  visitorManagement: false,
                  vehicleTracking: false,
                  cctvAccess: false,
                  emergencyResponse: false,
                  securityReports: false,
                  incidentManagement: false,
                  accessControl: false,
                  patrolManagement: false
                },
                hr: {
                  viewEmployees: false,
                  manageEmployees: false,
                  manageAttendance: false,
                  manageSalary: false,
                  manageLeaves: false,
                  viewReports: false,
                  recruitment: false,
                  performance: false,
                  training: false,
                  disciplinary: false
                },
                admin: { userManagement: false, systemSettings: false, backupRestore: false, auditLogs: false }
              }
            }];
          }
        } else if (userToCreate.primaryCompanyId && (!userToCreate.companyAccess || userToCreate.companyAccess.length === 0)) {
          // If primaryCompanyId is provided but no companyAccess, create default access
          userToCreate.companyAccess = [{
            companyId: userToCreate.primaryCompanyId,
            role: 'operator',
            department: 'Production',
            isActive: true,
            joinedAt: new Date(),
            permissions: {
              inventory: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
              production: { view: true, create: true, edit: false, delete: false, approve: false, viewReports: false },
              orders: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
              financial: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
              security: {
                gateManagement: false,
                visitorManagement: false,
                vehicleTracking: false,
                cctvAccess: false,
                emergencyResponse: false,
                securityReports: false,
                incidentManagement: false,
                accessControl: false,
                patrolManagement: false
              },
              hr: {
                viewEmployees: false,
                manageEmployees: false,
                manageAttendance: false,
                manageSalary: false,
                manageLeaves: false,
                viewReports: false,
                recruitment: false,
                performance: false,
                training: false,
                disciplinary: false
              },
              admin: { userManagement: false, systemSettings: false, backupRestore: false, auditLogs: false }
            }
          }];
        }
      }

      let user: any
      try {
        user = await this.create(userToCreate, createdBy);
      } catch (err: any) {
        // Handle duplicate key error from DB (race conditions)
        if (err && err.code === 11000) {
          if (err.message?.includes('personalInfo.phone')) {
            throw new AppError('Phone already exists', 400);
          }
          if (err.message?.includes('username')) {
            throw new AppError('Username already exists', 400);
          }
          if (err.message?.includes('email')) {
            throw new AppError('Email already exists', 400);
          }
        }
        throw err
      }

      logger.info('User created successfully', { 
        userId: user._id, 
        username: user.username,
        email: user.email,
        createdBy 
      });

      return user;
    } catch (error) {
      logger.error('Error creating user', { error, userData, createdBy });
      throw error;
    }
  }

  /**
   * Find user by username or email
   */
  async findByUsernameOrEmail(identifier: string): Promise<IUser | null> {
    try {
      return await this.findOne({
        $or: [
          { username: identifier },
          { email: identifier }
        ],
        isActive: true
      });
    } catch (error) {
      logger.error('Error finding user by username or email', { error, identifier });
      throw error;
    }
  }

  /**
   * Authenticate user
   */
  async authenticateUser(identifier: string, password: string): Promise<IUser | null> {
    try {
      const user = await this.findOne({
        $or: [
          { username: identifier },
          { email: identifier },
          { 'personalInfo.phone': identifier }
        ],
        isActive: true
      });

      if (!user) {
        return null;
      }

      // Check if account is locked
      if (user.security?.accountLocked) {
        throw new AppError('Account is locked. Please contact administrator.', 423);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        // Increment login attempts
        await this.incrementLoginAttempts(user._id.toString());
        return null;
      }

      // Reset login attempts on successful login
      await this.resetLoginAttempts(user._id.toString());

      // Update last login
      await this.update(user._id.toString(), {
        'security.lastLogin': new Date(),
        'security.lastLoginIP': undefined // This should be set from the request
      });

      return user;
    } catch (error) {
      logger.error('Error authenticating user', { error, identifier });
      throw error;
    }
  }

  /**
   * Add company access to user
   */
  async addCompanyAccess(
    userId: string, 
    companyId: string, 
    role: string, 
    permissions?: any,
    assignedBy?: string
  ): Promise<IUser | null> {
    try {
      // Verify company exists
      const company = await Company.findById(companyId);
      if (!company) {
        throw new AppError('Company not found', 404);
      }

      // Verify role exists
      const roleDoc = await Role.findOne({ roleName: role, companyId });
      if (!roleDoc) {
        throw new AppError('Role not found for this company', 404);
      }

      const user = await this.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Check if user already has access to this company
      const existingAccess = user.companyAccess?.find(
        access => access.companyId.toString() === companyId
      );

      if (existingAccess) {
        throw new AppError('User already has access to this company', 400);
      }

      const companyAccess: ICompanyAccess = {
        companyId: new Types.ObjectId(companyId),
        role: role as any, // Type assertion since role comes from database
        permissions: permissions || roleDoc.permissions,
        isActive: true,
        joinedAt: new Date()
      };

      const updatedUser = await this.update(userId, {
        $push: { companyAccess }
      });

      logger.info('Company access added to user', { userId, companyId, role, assignedBy });
      return updatedUser;
    } catch (error) {
      logger.error('Error adding company access', { error, userId, companyId, role });
      throw error;
    }
  }

  /**
   * Remove company access from user
   */
  async removeCompanyAccess(userId: string, companyId: string, removedBy?: string): Promise<IUser | null> {
    try {
      const updatedUser = await this.update(userId, {
        $pull: { companyAccess: { companyId: new Types.ObjectId(companyId) } }
      }, removedBy);

      if (!updatedUser) {
        throw new AppError('User not found', 404);
      }

      logger.info('Company access removed from user', { userId, companyId, removedBy });
      return updatedUser;
    } catch (error) {
      logger.error('Error removing company access', { error, userId, companyId });
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new AppError('Current password is incorrect', 400);
      }

      // Hash new password
      const salt = await bcrypt.genSalt(config.BCRYPT_SALT_ROUNDS);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      await this.update(userId, {
        password: hashedNewPassword,
        'security.passwordLastChanged': new Date(),
        'security.mustChangePassword': false
      });

      logger.info('User password updated', { userId });
      return true;
    } catch (error) {
      logger.error('Error updating user password', { error, userId });
      throw error;
    }
  }

  /**
   * Reset user password (admin function)
   */
  async resetPassword(userId: string, newPassword: string, resetBy?: string): Promise<string> {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Generate temporary password if not provided
      const tempPassword = newPassword || this.generateTemporaryPassword();

      // Hash password
      const salt = await bcrypt.genSalt(config.BCRYPT_SALT_ROUNDS);
      const hashedPassword = await bcrypt.hash(tempPassword, salt);

      // Update password and force change
      await this.update(userId, {
        password: hashedPassword,
        'security.passwordLastChanged': new Date(),
        'security.mustChangePassword': true,
        'security.passwordResetAt': new Date(),
        'security.passwordResetBy': resetBy ? new Types.ObjectId(resetBy) : undefined
      });

      logger.info('User password reset', { userId, resetBy });
      return tempPassword;
    } catch (error) {
      logger.error('Error resetting user password', { error, userId });
      throw error;
    }
  }

  /**
   * Lock/Unlock user account
   */
  async toggleAccountLock(userId: string, isLocked: boolean, actionBy?: string): Promise<IUser | null> {
    try {
      const updatedUser = await this.update(userId, {
        'security.isLocked': isLocked,
        'security.lockedAt': isLocked ? new Date() : undefined,
        'security.lockedBy': isLocked && actionBy ? new Types.ObjectId(actionBy) : undefined,
        'security.unlockedAt': !isLocked ? new Date() : undefined,
        'security.unlockedBy': !isLocked && actionBy ? new Types.ObjectId(actionBy) : undefined
      });

      if (!updatedUser) {
        throw new AppError('User not found', 404);
      }

      logger.info(`User account ${isLocked ? 'locked' : 'unlocked'}`, { userId, actionBy });
      return updatedUser;
    } catch (error) {
      logger.error('Error toggling account lock', { error, userId, isLocked });
      throw error;
    }
  }

  /**
   * Get users by company
   */
  async getUsersByCompany(companyId: string, page: number = 1, limit: number = 10) {
    try {
      const filter = {
        'companyAccess.companyId': new Types.ObjectId(companyId),
        'companyAccess.isActive': true,
        isActive: true
      };

      return await this.paginate(filter, page, limit, { 'personalInfo.firstName': 1 });
    } catch (error) {
      logger.error('Error getting users by company', { error, companyId });
      throw error;
    }
  }

  /**
   * Search users
   */
  async searchUsers(searchTerm: string, companyId?: string, page: number = 1, limit: number = 10) {
    try {
      const searchRegex = new RegExp(searchTerm, 'i');
      
      let filter: any = {
        isActive: true,
        $or: [
          { username: searchRegex },
          { email: searchRegex },
          { 'personalInfo.firstName': searchRegex },
          { 'personalInfo.lastName': searchRegex },
          { 'personalInfo.displayName': searchRegex }
        ]
      };

      if (companyId) {
        filter['companyAccess.companyId'] = new Types.ObjectId(companyId);
        filter['companyAccess.isActive'] = true;
      }

      return await this.paginate(filter, page, limit, { 'personalInfo.firstName': 1 });
    } catch (error) {
      logger.error('Error searching users', { error, searchTerm, companyId });
      throw error;
    }
  }

  /**
   * Increment login attempts
   */
  private async incrementLoginAttempts(userId: string): Promise<void> {
    try {
      const user = await this.findById(userId);
      if (!user) return;

      const attempts = (user.security?.failedLoginAttempts || 0) + 1;
      const maxAttempts = config.MAX_LOGIN_ATTEMPTS || 5;

      const updateData: any = {
        'security.loginAttempts': attempts,
        'security.lastFailedLogin': new Date()
      };

      // Lock account if max attempts reached
      if (attempts >= maxAttempts) {
        updateData['security.isLocked'] = true;
        updateData['security.lockedAt'] = new Date();
      }

      await this.update(userId, updateData);
    } catch (error) {
      logger.error('Error incrementing login attempts', { error, userId });
    }
  }

  /**
   * Reset login attempts
   */
  private async resetLoginAttempts(userId: string): Promise<void> {
    try {
      await this.update(userId, {
        'security.loginAttempts': 0,
        $unset: { 'security.lastFailedLogin': 1 }
      });
    } catch (error) {
      logger.error('Error resetting login attempts', { error, userId });
    }
  }

  /**
   * Generate temporary password
   */
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Validate user data
   */
  private async validateUserData(userData: Partial<IUser>): Promise<void> {
    if (!userData.username) {
      throw new AppError('Username is required', 400);
    }

    // Email is optional, but if provided, validate format
    if (userData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new AppError('Invalid email format', 400);
      }
    }

    if (!userData.password) {
      throw new AppError('Password is required', 400);
    }

    if (!userData.personalInfo?.firstName) {
      throw new AppError('First name is required', 400);
    }

    if (!userData.personalInfo?.lastName) {
      throw new AppError('Last name is required', 400);
    }


    // Validate password strength
    if (userData.password.length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400);
    }

    // Username validation
    if (userData.username.length < 3) {
      throw new AppError('Username must be at least 3 characters long', 400);
    }

    if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
      throw new AppError('Username can only contain letters, numbers, and underscores', 400);
    }
  }
}
