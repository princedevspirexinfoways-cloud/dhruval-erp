import { Types } from 'mongoose';
import { BaseService } from './BaseService';
import { Dispatch } from '../models/Dispatch';
import { AppError } from '../utils/errors';
import S3Service from './S3Service';

export class EnhancedDispatchService extends BaseService<any> {
  constructor() {
    super(Dispatch as any);
  }

  async createDispatch(dispatchData: any) {
    try {
      // Auto-generate dispatch number if not provided
      if (!dispatchData.dispatchNumber) {
        dispatchData.dispatchNumber = this.generateDispatchNumber();
      }
      
      // Auto-set dispatch type to pickup if not provided
      if (!dispatchData.dispatchType) {
        dispatchData.dispatchType = 'pickup';
      }
      
      const dispatch = new Dispatch(dispatchData);
      await dispatch.save();
      
      const populatedDispatch = await Dispatch.findById(dispatch._id)
        .populate('companyId', 'companyName')
        .populate('sourceWarehouseId', 'warehouseName warehouseCode')
        .populate('customerOrderId', 'orderNumber customerName customerId')
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email');
      
      // Update customer order status to 'in-production' when dispatch is created
      if (populatedDispatch?.customerOrderId?._id) {
        try {
          const { CustomerOrderService } = await import('./CustomerOrderService');
          const customerOrderService = new CustomerOrderService();
          
          await customerOrderService.updateOrderStatus(
            populatedDispatch.customerOrderId._id.toString(),
            'in-production',
            dispatchData.createdBy || 'system'
          );
        } catch (orderError) {
          console.error('Failed to update customer order status:', orderError);
          // Don't throw error here, as dispatch creation was successful
        }
      }
      
      return populatedDispatch;
    } catch (error) {
      throw new AppError('Failed to create dispatch', 500);
    }
  }

  private generateDispatchNumber(): string {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `DISP-${year}${month}${day}-${timestamp}`;
  }

  async getDispatches(filters: any = {}, search?: string) {
    try {
      const { user } = filters;
      let query: any = { ...filters };
      
      // Remove user from query as it's not a field
      delete query.user;
      
      // If not superadmin, filter by company
      if (user && !user.isSuperAdmin) {
        query.companyId = user.companyId;
      }
      
      // Add search functionality
      if (search) {
        query.$or = [
          { dispatchNumber: { $regex: search, $options: 'i' } },
          { dispatchType: { $regex: search, $options: 'i' } }
        ];
      }

      const dispatches = await Dispatch.find(query)
        .populate('companyId', 'companyName')
        .populate('sourceWarehouseId', 'warehouseName warehouseCode')
        .populate('customerOrderId', 'orderNumber customerName customerId')
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 });

      return dispatches;
    } catch (error) {
      throw new AppError('Failed to get dispatches', 500);
    }
  }

  async getDispatchById(id: string) {
    try {
      const dispatch = await Dispatch.findById(id)
        .populate('companyId', 'companyName')
        .populate('sourceWarehouseId', 'warehouseName warehouseCode')
        .populate('customerOrderId', 'orderNumber customerName customerId')
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email');
      
      return dispatch;
    } catch (error) {
      throw new AppError('Failed to get dispatch', 500);
    }
  }

  async updateDispatch(id: string, updateData: any) {
    try {
      const dispatch = await Dispatch.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      ).populate('companyId', 'companyName')
       .populate('sourceWarehouseId', 'warehouseName warehouseCode')
       .populate('customerOrderId', 'orderNumber customerName customerId')
       .populate('createdBy', 'name email');
      
      // If status is being updated, also update the customer order status
      if (updateData.status && dispatch?.customerOrderId?._id) {
        try {
          const { CustomerOrderService } = await import('./CustomerOrderService');
          const customerOrderService = new CustomerOrderService();
          
          // Map dispatch status to customer order status
          let orderStatus = 'pending';
          switch (updateData.status) {
            case 'in-progress':
              orderStatus = 'in-production';
              break;
            case 'completed':
            case 'delivered':
              orderStatus = 'completed';
              break;
            case 'cancelled':
              orderStatus = 'cancelled';
              break;
            default:
              orderStatus = 'pending';
          }
          
          await customerOrderService.updateOrderStatus(
            dispatch.customerOrderId._id.toString(),
            orderStatus,
            updateData.updatedBy || 'system'
          );
        } catch (orderError) {
          console.error('Failed to update customer order status:', orderError);
          // Don't throw error here, as dispatch update was successful
        }
      }
      
      return dispatch;
    } catch (error) {
      throw new AppError('Failed to update dispatch', 500);
    }
  }

  async deleteDispatch(id: string) {
    try {
      const result = await Dispatch.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new AppError('Failed to delete dispatch', 500);
    }
  }

  async getUploadUrl(fileKey: string, contentType: string) {
    try {
      const { uploadUrl, key, expiresAt } = await S3Service.getPresignedUploadUrl(
        fileKey,
        contentType,
        'dispatches' // folder
      );
      
      // Generate the correct public URL using S3Service
      const publicUrl = S3Service.generatePublicUrl(key);
      
      return {
        uploadUrl,
        key,
        publicUrl,
        expiresAt
      };
    } catch (error) {
      throw new AppError('Failed to generate upload URL', 500);
    }
  }

  async getDownloadUrl(fileKey: string) {
    try {
      const { downloadUrl, expiresAt } = await S3Service.getPresignedDownloadUrl(
        fileKey,
        3600 // 1 hour expiry
      );
      
      return {
        downloadUrl,
        expiresAt
      };
    } catch (error) {
      throw new AppError('Failed to generate download URL', 500);
    }
  }

  generatePublicUrl(key: string): string {
    return S3Service.generatePublicUrl(key);
  }

  async getDispatchesByCompany(companyId: string, options: any = {}) {
    try {
      const { page = 1, limit = 10, status, priority } = options;
      
      const query: any = { companyId };
      
      if (status && status !== 'all') {
        query.status = status;
      }
      
      if (priority && priority !== 'all') {
        query.priority = priority;
      }

      const dispatches = await Dispatch.find(query)
        .populate('assignedTo', 'name email')
        .populate('companyId', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Dispatch.countDocuments(query);

      return {
        dispatches,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new AppError('Failed to get dispatches', 500);
    }
  }

  async updateDispatchStatus(dispatchId: string, status: string, updatedBy: string) {
    try {
      const dispatch = await Dispatch.findById(dispatchId);
      if (!dispatch) {
        throw new AppError('Dispatch not found', 404);
      }

      dispatch.status = status as 'pending' | 'in-progress' | 'completed' | 'cancelled';
      dispatch.updatedAt = new Date();
      await dispatch.save();

      return dispatch;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update dispatch status', 500);
    }
  }

  async getDispatchStats(companyId: string, startDate?: Date, endDate?: Date) {
    try {
      const query: any = { companyId };
      
      if (startDate && endDate) {
        query.createdAt = {
          $gte: startDate,
          $lte: endDate
        };
      }

      const dispatches = await Dispatch.find(query);
      
      const stats = {
        total: dispatches.length,
        pending: dispatches.filter(d => d.status === 'pending').length,
        inProgress: dispatches.filter(d => d.status === 'in-progress').length,
        completed: dispatches.filter(d => d.status === 'completed').length,
        cancelled: dispatches.filter(d => d.status === 'cancelled').length,
        low: dispatches.filter(d => d.priority === 'low').length,
        medium: dispatches.filter(d => d.priority === 'medium').length,
        high: dispatches.filter(d => d.priority === 'high').length,
        urgent: dispatches.filter(d => d.priority === 'urgent').length
      };

      return stats;
    } catch (error) {
      throw new AppError('Failed to get dispatch stats', 500);
    }
  }
}
