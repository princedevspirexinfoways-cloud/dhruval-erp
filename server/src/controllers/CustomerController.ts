import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CustomerService } from '../services/CustomerService';
import { ICustomer } from '../types/models';

export class CustomerController extends BaseController<ICustomer> {
  private customerService: CustomerService;

  constructor() {
    const customerService = new CustomerService();
    super(customerService, 'Customer');
    this.customerService = customerService;
  }

  /**
   * Create a new customer
   */
  async createCustomer(req: Request, res: Response): Promise<void> {
    try {
      const customerData = req.body;
      const createdBy = (req.user?.userId || req.user?._id)?.toString();

      const customer = await this.customerService.createCustomer(customerData, createdBy);

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: customer
      });
    } catch (error) {
      this.sendError(res, error, 'Operation failed');
    }
  }

  /**
   * Find or create customer for Sales (spec: auto-save on first entry when user types new customer)
   */
  async findOrCreate(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId?.toString();
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }
      const createdBy = (req.user?.userId || req.user?._id)?.toString();
      const payload = req.body;
      const { customer, created } = await this.customerService.findOrCreateForSales(payload, companyId, createdBy);
      res.status(200).json({
        success: true,
        message: created ? 'Customer created' : 'Customer found',
        data: customer,
        created
      });
    } catch (error) {
      this.sendError(res, error, 'Find or create customer failed');
    }
  }

  /**
   * Get customer by code
   */
  async getCustomerByCode(req: Request, res: Response): Promise<void> {
    try {
      const { customerCode } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      const customer = await this.customerService.getCustomerByCode(customerCode, companyId.toString());

      if (!customer) {
        this.sendError(res, new Error('Customer not found'), 'Customer not found', 404);
        return;
      }

      this.sendSuccess(res, customer, 'Customer retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get customer');
    }
  }

  /**
   * Get customers by company
   */
  async getCustomersByCompany(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { page = 1, limit = 10, search, status, customerType, sortBy, sortOrder, companyId: filterCompanyId } = req.query;

      // If super admin is filtering by specific company, use that company ID
      if (filterCompanyId && req.user?.isSuperAdmin) {
              const result = await this.customerService.getCustomersByCompany(filterCompanyId.toString(), {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        status: status as string,
        customerType: customerType as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as string
      });
      this.sendPaginatedResponse(res, { documents: result.data, pagination: result.pagination }, 'Customers retrieved successfully');
        return;
      }

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const options: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      if (search) {
        options.search = search;
      }

      if (status) {
        options.status = status;
      }

      if (customerType) {
        options.customerType = customerType;
      }

      if (sortBy) {
        options.sortBy = sortBy;
      }

      if (sortOrder) {
        options.sortOrder = sortOrder;
      }

      const result = await this.customerService.getCustomersByCompany(companyId.toString(), options);

      this.sendPaginatedResponse(res, { documents: result.data, pagination: result.pagination }, 'Customers retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get customers');
    }
  }

  /**
   * Get all customers across companies (Super Admin only)
   */
  async getAllCustomers(req: Request, res: Response): Promise<void> {
    try {
      // Check if user is super admin
      if (!req.user?.isSuperAdmin) {
        this.sendError(res, new Error('Access denied'), 'Super Admin privileges required', 403);
        return;
      }

      const { page = 1, limit = 10, search, status, customerType, companyId, sortBy, sortOrder } = req.query;

      const options: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      if (search) {
        options.search = search;
      }

      if (status) {
        options.status = status;
      }

      if (customerType) {
        options.customerType = customerType;
      }

      if (companyId) {
        options.companyId = companyId;
      }

      if (sortBy) {
        options.sortBy = sortBy;
      }

      if (sortOrder) {
        options.sortOrder = sortOrder;
      }

      const result = await this.customerService.getAllCustomers(options);

      this.sendPaginatedResponse(res, { documents: result.data, pagination: result.pagination }, 'All customers retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get all customers');
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const customer = await this.customerService.update(id, updateData, updatedBy);

      if (!customer) {
        res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Customer updated successfully',
        data: customer
      });
    } catch (error) {
      this.sendError(res, error, 'Failed to update customer');
    }
  }

  /**
   * Update customer credit limit
   */
  async updateCreditLimit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { creditLimit } = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const customer = await this.customerService.updateCreditLimit(id, creditLimit, updatedBy);

      if (!customer) {
        this.sendError(res, new Error('Customer not found'), 'Customer not found', 404);
        return;
      }

      this.sendSuccess(res, customer, 'Credit limit updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update credit limit');
    }
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const stats = await this.customerService.getCustomerStats(companyId.toString());

      this.sendSuccess(res, stats, 'Customer statistics retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get customer statistics');
    }
  }

  /**
   * Delete customer (soft delete)
   */
  async deleteCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedBy = (req.user?.userId || req.user?._id)?.toString();

      const customer = await this.customerService.update(id, { 
        isActive: false,
        deletedAt: new Date()
      }, deletedBy);

      if (!customer) {
        res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Customer deleted successfully'
      });
    } catch (error) {
      this.sendError(res, error, 'Failed to delete customer');
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const customer = await this.customerService.findById(id);

      if (!customer) {
        this.sendError(res, new Error('Customer not found'), 'Customer not found', 404);
        return;
      }

      this.sendSuccess(res, customer, 'Customer retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get customer');
    }
  }

  /**
   * Search customers
   */
  async searchCustomers(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { q: searchTerm, limit = 10 } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      if (!searchTerm) {
        this.sendError(res, new Error('Search term is required'), 'Search term is required', 400);
        return;
      }

      const customers = await this.customerService.findMany({
        companyId,
        $or: [
          { customerName: { $regex: searchTerm, $options: 'i' } },
          { 'contactInfo.primaryEmail': { $regex: searchTerm, $options: 'i' } },
          { 'contactInfo.primaryPhone': { $regex: searchTerm, $options: 'i' } }
        ],
        isActive: true
      }, { limit: parseInt(limit as string) });

      this.sendSuccess(res, customers, 'Search results retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to search customers');
    }
  }
}
