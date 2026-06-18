import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { UserService } from '@/services/UserService';
import { IUser } from '@/types/models';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

export class UserController extends BaseController<IUser> {
  private userService: UserService;

  constructor() {
    const userService = new UserService();
    super(userService, 'User');
    this.userService = userService;
  }

  /**
   * Create a new user
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      
      const { userId } = this.getUserInfo(req);
      const userData = req.body;

      logger.info('Creating user', { userData: { ...userData, password: '[HIDDEN]' }, userId });

      const user = await this.userService.createUser(userData, userId);
      
      // Remove password from response
      const userResponse = { ...user.toObject(), password: undefined };
      
      this.sendSuccess(res, userResponse, 'User created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = this.getUserInfo(req);

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      logger.info('Getting user profile', { userId });

      const user = await this.userService.findById(userId, ['companyAccess.companyId']);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Remove sensitive information
      const userProfile = { ...user.toObject(), password: undefined };
      
      this.sendSuccess(res, userProfile, 'User profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      
      const { userId } = this.getUserInfo(req);
      const updateData = req.body;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      // Remove sensitive fields that shouldn't be updated via profile
      delete updateData.password;
      delete updateData.companyAccess;
      delete updateData.isSuperAdmin;
      delete updateData.security;

      logger.info('Updating user profile', { userId, updateData });

      const user = await this.userService.update(userId, updateData, userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Remove password from response
      const userResponse = { ...user.toObject(), password: undefined };
      
      this.sendSuccess(res, userResponse, 'User profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      
      const { userId } = this.getUserInfo(req);
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      logger.info('Changing user password', { userId });

      const success = await this.userService.updatePassword(userId, currentPassword, newPassword);
      
      if (!success) {
        throw new AppError('Failed to update password', 500);
      }

      this.sendSuccess(res, null, 'Password updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset user password (admin function)
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);
      const { newPassword } = req.body;

      logger.info('Resetting user password', { targetUserId: id, resetBy: userId });

      const tempPassword = await this.userService.resetPassword(id, newPassword, userId);
      
      this.sendSuccess(res, { temporaryPassword: tempPassword }, 'Password reset successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lock/Unlock user account
   */
  async toggleAccountLock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);
      const { isLocked } = req.body;

      logger.info('Toggling account lock', { targetUserId: id, isLocked, actionBy: userId });

      const user = await this.userService.toggleAccountLock(id, isLocked, userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const userResponse = { ...user.toObject(), password: undefined };
      
      this.sendSuccess(res, userResponse, `User account ${isLocked ? 'locked' : 'unlocked'} successfully`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add company access to user
   */
  async addCompanyAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.handleValidationErrors(req);
      
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);
      const { companyId, role, permissions } = req.body;

      logger.info('Adding company access to user', { targetUserId: id, companyId, role, assignedBy: userId });

      const user = await this.userService.addCompanyAccess(id, companyId, role, permissions, userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const userResponse = { ...user.toObject(), password: undefined };
      
      this.sendSuccess(res, userResponse, 'Company access added successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove company access from user
   */
  async removeCompanyAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, companyId } = req.params;
      const { userId } = this.getUserInfo(req);

      logger.info('Removing company access from user', { targetUserId: id, companyId, removedBy: userId });

      const user = await this.userService.removeCompanyAccess(id, companyId, userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const userResponse = { ...user.toObject(), password: undefined };
      
      this.sendSuccess(res, userResponse, 'Company access removed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get users by company
   */
  async getUsersByCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      logger.info('Getting users by company', { companyId, page, limit });

      const result = await this.userService.getUsersByCompany(companyId, page, limit);
      
      // Remove passwords from response
      result.documents = result.documents.map((user: any) => ({
        ...user.toObject(),
        password: undefined
      }));
      
      this.sendPaginatedResponse(res, result, 'Company users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search users
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q: searchTerm } = req.query;
      const { companyId } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!searchTerm) {
        throw new AppError('Search term is required', 400);
      }

      logger.info('Searching users', { searchTerm, companyId, page, limit });

      const result = await this.userService.searchUsers(
        searchTerm as string, 
        companyId as string, 
        page, 
        limit
      );
      
      // Remove passwords from response
      result.documents = result.documents.map((user: any) => ({
        ...user.toObject(),
        password: undefined
      }));
      
      this.sendPaginatedResponse(res, result, 'User search results retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all users with advanced filtering
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sort = req.query.sort || { 'personalInfo.firstName': 1 };
      const populate = req.query.populate as string[];
      
      // Build filter from query parameters
      const filter = this.buildUserFilter(req.query);

      logger.info('Getting users with filter', { page, limit, filter });

      const result = await this.userService.paginate(filter, page, limit, sort, populate);
      
      // Remove passwords from response
      result.documents = result.documents.map((user: any) => ({
        ...user.toObject(),
        password: undefined
      }));
      
      this.sendPaginatedResponse(res, result, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID (override to remove password)
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const populate = req.query.populate as string[];

      logger.info('Getting user by ID', { id });

      const user = await this.userService.findById(id, populate);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Remove password from response
      const userResponse = { ...user.toObject(), password: undefined };

      this.sendSuccess(res, userResponse, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Build user-specific filter from query parameters
   */
  private buildUserFilter(query: any): any {
    const filter = this.buildFilterFromQuery(query);

    // User-specific filters
    if (query.username) {
      filter.username = new RegExp(query.username, 'i');
    }

    if (query.email) {
      filter.email = new RegExp(query.email, 'i');
    }

    if (query.firstName) {
      filter['personalInfo.firstName'] = new RegExp(query.firstName, 'i');
    }

    if (query.lastName) {
      filter['personalInfo.lastName'] = new RegExp(query.lastName, 'i');
    }

    if (query.department) {
      filter['workInfo.department'] = query.department;
    }

    if (query.designation) {
      filter['workInfo.designation'] = new RegExp(query.designation, 'i');
    }

    if (query.isSuperAdmin !== undefined) {
      filter.isSuperAdmin = query.isSuperAdmin === 'true';
    }

    if (query.isLocked !== undefined) {
      filter['security.isLocked'] = query.isLocked === 'true';
    }

    if (query.companyId) {
      filter['companyAccess.companyId'] = query.companyId;
      filter['companyAccess.isActive'] = true;
    }

    return filter;
  }

  /**
   * Get user statistics
   */
  async getUserStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId } = req.query;
      const filter: any = {};

      if (companyId) {
        filter['companyAccess.companyId'] = companyId;
        filter['companyAccess.isActive'] = true;
      }

      logger.info('Getting user statistics', { filter });

      const [
        totalUsers,
        activeUsers,
        lockedUsers,
        superAdmins,
        recentUsers
      ] = await Promise.all([
        this.userService.count(filter),
        this.userService.count({ ...filter, isActive: true }),
        this.userService.count({ ...filter, 'security.isLocked': true }),
        this.userService.count({ ...filter, isSuperAdmin: true }),
        this.userService.count({
          ...filter,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
      ]);

      const stats = {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        lockedUsers,
        superAdmins,
        recentUsers,
        activePercentage: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : 0
      };

      this.sendSuccess(res, stats, 'User statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
