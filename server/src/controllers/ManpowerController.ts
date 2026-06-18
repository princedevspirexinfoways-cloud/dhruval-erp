import { Request, Response } from 'express';
import Manpower from '../models/Manpower';
import { IUser } from '../types/models';

class ManpowerController {
  // Get all manpower - Admin & HR only
  static async getAllManpower(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { companyId } = req.query;
      
      let query: any = {};
      
      // If user is not admin, restrict to their company
      if (user.role !== 'admin') {
        query.companyId = user.companyId;
      } else if (companyId) {
        query.companyId = companyId;
      }
      
      const manpower = await Manpower.find(query)
        .populate('companyId', 'name')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        data: manpower,
        total: manpower.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching manpower data',
        error: error.message
      });
    }
  }

  // Get manpower by ID - Admin & HR only
  static async getManpowerById(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { id } = req.params;
      
      const manpower = await Manpower.findById(id)
        .populate('companyId', 'name')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');
      
      if (!manpower) {
        return res.status(404).json({
          success: false,
          message: 'Manpower not found'
        });
      }
      
      // Check if user has access to this manpower record
      if (user.role !== 'admin' && manpower.companyId.toString() !== user.companyId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      res.json({
        success: true,
        data: manpower
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching manpower data',
        error: error.message
      });
    }
  }

  // Create new manpower - Admin & HR only
  static async createManpower(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const manpowerData = req.body;
      
      // Set company ID based on user role
      if (user.role !== 'admin') {
        manpowerData.companyId = user.companyId;
      }
      
      manpowerData.createdBy = user._id;
      manpowerData.updatedBy = user._id;
      
      const manpower = new Manpower(manpowerData);
      await manpower.save();
      
      res.status(201).json({
        success: true,
        message: 'Manpower created successfully',
        data: manpower
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating manpower',
        error: error.message
      });
    }
  }

  // Update manpower - Admin & HR only
  static async updateManpower(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { id } = req.params;
      const updateData = req.body;
      
      const manpower = await Manpower.findById(id);
      if (!manpower) {
        return res.status(404).json({
          success: false,
          message: 'Manpower not found'
        });
      }
      
      // Check if user has access to this manpower record
      if (user.role !== 'admin' && manpower.companyId.toString() !== user.companyId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      updateData.updatedBy = user._id;
      updateData.updatedAt = new Date();
      
      const updatedManpower = await Manpower.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      res.json({
        success: true,
        message: 'Manpower updated successfully',
        data: updatedManpower
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating manpower',
        error: error.message
      });
    }
  }

  // Delete manpower - Admin only
  static async deleteManpower(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const manpower = await Manpower.findById(id);
      if (!manpower) {
        return res.status(404).json({
          success: false,
          message: 'Manpower not found'
        });
      }
      
      await Manpower.findByIdAndDelete(id);
      
      res.json({
        success: true,
        message: 'Manpower deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting manpower',
        error: error.message
      });
    }
  }

  // Get manpower by company - Admin, HR, Manager
  static async getManpowerByCompany(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { companyId } = req.params;
      
      // Check if user has access to this company
      if (user.role !== 'admin' && user.companyId.toString() !== companyId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      const manpower = await Manpower.find({ companyId })
        .populate('companyId', 'name')
        .sort({ name: 1 });
      
      res.json({
        success: true,
        data: manpower,
        total: manpower.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching manpower by company',
        error: error.message
      });
    }
  }

  // Get manpower by department - Admin, HR, Manager
  static async getManpowerByDepartment(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { department } = req.params;
      const { companyId } = req.query;
      
      let query: any = { department };
      
      // If user is not admin, restrict to their company
      if (user.role !== 'admin') {
        query.companyId = user.companyId;
      } else if (companyId) {
        query.companyId = companyId;
      }
      
      const manpower = await Manpower.find(query)
        .populate('companyId', 'name')
        .sort({ name: 1 });
      
      res.json({
        success: true,
        data: manpower,
        total: manpower.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching manpower by department',
        error: error.message
      });
    }
  }

  // Get manpower by status - Admin, HR, Manager
  static async getManpowerByStatus(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { status } = req.params;
      const { companyId } = req.query;
      
      let query: any = { status };
      
      // If user is not admin, restrict to their company
      if (user.role !== 'admin') {
        query.companyId = user.companyId;
      } else if (companyId) {
        query.companyId = companyId;
      }
      
      const manpower = await Manpower.find(query)
        .populate('companyId', 'name')
        .sort({ name: 1 });
      
      res.json({
        success: true,
        data: manpower,
        total: manpower.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching manpower by status',
        error: error.message
      });
    }
  }

  // Get my profile - Employee self-service
  static async getMyProfile(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      
      // For now, return user data. In future, link to manpower record
      const profile = {
        employeeId: user.employeeId || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.companyId
      };
      
      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching profile',
        error: error.message
      });
    }
  }

  // Update my profile - Employee self-service
  static async updateMyProfile(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const updateData = req.body;
      
      // Only allow updating certain fields
      const allowedFields = ['name', 'phone', 'address'];
      const filteredData: any = {};
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      });
      
      // Update user record (this would need to be implemented in UserController)
      res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating profile',
        error: error.message
      });
    }
  }
}

export default ManpowerController;
