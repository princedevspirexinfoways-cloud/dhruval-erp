import { Request, Response } from 'express';
import User from '../models/User';
import Company from '../models/Company';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export class UserManagementController {
  /**
   * Get all users (SuperAdmin only)
   */
  static async getAllUsers(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      
      if (!user.isSuperAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. SuperAdmin privileges required.'
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || '';
      const role = req.query.role as string || '';
      const companyId = req.query.companyId as string || '';

      // Build filter
      const filter: any = {};
      
      if (search) {
        filter.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ];
      }

      if (companyId) {
        filter['companyAccess.companyId'] = new mongoose.Types.ObjectId(companyId);
      }

      if (role) {
        filter['companyAccess.role'] = role;
      }

      const skip = (page - 1) * limit;

      const users = await User.find(filter)
        .populate('companyAccess.companyId', 'companyName companyCode')
        .populate('primaryCompanyId', 'companyName companyCode')
        .select('-password -security.twoFactorSecret')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(filter);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error: any) {
      logger.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }
  }

  /**
   * Create new user (SuperAdmin only)
   */
  static async createUser(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      
      if (!user.isSuperAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. SuperAdmin privileges required.'
        });
      }

      const {
        username,
        email,
        password,
        firstName,
        lastName,
        phone,
        companyId,
        role,
        department,
        designation,
        employeeId,
        permissions
      } = req.body;

      // Validate required fields
      if (!username || !email || !password || !companyId || !role) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, password, company, and role are required'
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email or username already exists'
        });
      }

      // Validate company exists
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(400).json({
          success: false,
          message: 'Invalid company ID'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        primaryCompanyId: companyId,
        companyAccess: [{
          companyId,
          role,
          department,
          designation,
          employeeId,
          isActive: true,
          permissions: permissions || {
            inventory: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
            production: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
            orders: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
            financial: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
            security: { gateManagement: false, visitorManagement: false, vehicleTracking: false, cctvAccess: false, emergencyResponse: false, securityReports: false, incidentManagement: false, accessControl: false, patrolManagement: false },
            hr: { viewEmployees: false, manageEmployees: false, manageAttendance: false, manageSalary: false, manageLeaves: false, viewReports: false, recruitment: false, performance: false, training: false, disciplinary: false },
            admin: { userManagement: false, systemSettings: false, backupRestore: false, auditLogs: false }
          },
          joinedAt: new Date()
        }],
        isActive: true,
        createdAt: new Date()
      });

      await newUser.save();

      // Remove password from response
      const userResponse = newUser.toObject();
      delete userResponse.password;

      logger.info('User created by SuperAdmin', {
        createdUserId: newUser._id,
        createdUserEmail: email,
        createdBy: user._id,
        companyId
      });

      res.status(201).json({
        success: true,
        data: userResponse,
        message: 'User created successfully'
      });

    } catch (error: any) {
      logger.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user'
      });
    }
  }

  /**
   * Update user (SuperAdmin only)
   */
  static async updateUser(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      
      if (!user.isSuperAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. SuperAdmin privileges required.'
        });
      }

      const { userId } = req.params;
      const updateData = req.body;

      // Don't allow updating password through this endpoint
      delete updateData.password;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('companyAccess.companyId', 'companyName companyCode')
       .populate('primaryCompanyId', 'companyName companyCode')
       .select('-password');

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      logger.info('User updated by SuperAdmin', {
        updatedUserId: userId,
        updatedBy: user._id
      });

      res.json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      });

    } catch (error: any) {
      logger.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user'
      });
    }
  }

  /**
   * Delete user (SuperAdmin only)
   */
  static async deleteUser(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      
      if (!user.isSuperAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. SuperAdmin privileges required.'
        });
      }

      const { userId } = req.params;

      // Don't allow deleting self
      if (userId === user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      const deletedUser = await User.findByIdAndDelete(userId);

      if (!deletedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      logger.info('User deleted by SuperAdmin', {
        deletedUserId: userId,
        deletedUserEmail: deletedUser.email,
        deletedBy: user._id
      });

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error: any) {
      logger.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      });
    }
  }

  /**
   * Get user by ID (SuperAdmin only)
   */
  static async getUserById(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      
      if (!user.isSuperAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. SuperAdmin privileges required.'
        });
      }

      const { userId } = req.params;

      const foundUser = await User.findById(userId)
        .populate('companyAccess.companyId', 'companyName companyCode')
        .populate('primaryCompanyId', 'companyName companyCode')
        .select('-password');

      if (!foundUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: foundUser
      });

    } catch (error: any) {
      logger.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user'
      });
    }
  }
}
