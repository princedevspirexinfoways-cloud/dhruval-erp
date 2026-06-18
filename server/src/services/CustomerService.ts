import { Types } from 'mongoose';
import { BaseService } from './BaseService';
import Customer from '../models/Customer';
import { ICustomer } from '../types/models';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import QueryOptimizer from '../utils/query-optimizer';

export class CustomerService extends BaseService<ICustomer> {
  constructor() {
    super(Customer);
  }

  /**
   * Create a new customer
   */
  async createCustomer(customerData: Partial<ICustomer>, createdBy?: string): Promise<ICustomer> {
    try {
      // Validate customer data
      this.validateCustomerData(customerData);

      // Check if customer code already exists
      if (customerData.customerCode) {
        const existingCustomer = await this.findOne({ 
          customerCode: customerData.customerCode.toUpperCase(),
          companyId: customerData.companyId 
        });

        if (existingCustomer) {
          throw new AppError('Customer code already exists', 400);
        }
      }

      // GST validation: prevent duplicate GSTIN in same company (spec: same rule as Vendor). Allow URD/Unregistered.
      const gstin = (customerData.registrationDetails?.gstin || (customerData as any).gstin)?.toString()?.trim()?.toUpperCase();
      if (gstin && gstin !== 'URD' && gstin !== 'UNREGISTERED') {
        const existingGstin = await this.findOne({
          companyId: customerData.companyId,
          $or: [
            { 'registrationDetails.gstin': gstin },
            { 'registrationDetails.gstin': new RegExp(`^${gstin}$`, 'i') }
          ]
        });
        if (existingGstin) {
          throw new AppError('A customer with this GSTIN already exists', 400);
        }
      }

      // Check if primary email already exists (when provided)
      if (customerData.contactInfo?.primaryEmail) {
        const existingEmail = await this.findOne({
          'contactInfo.primaryEmail': customerData.contactInfo.primaryEmail,
          companyId: customerData.companyId
        });

        if (existingEmail) {
          throw new AppError('Customer with this email already exists', 400);
        }
      }

      // Generate customer code if not provided
      if (!customerData.customerCode) {
        customerData.customerCode = await this.generateCustomerCode(customerData.companyId!.toString());
      }

      const customer = await this.create({
        ...customerData,
        customerCode: customerData.customerCode.toUpperCase(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }, createdBy);

      logger.info('Customer created successfully', { 
        customerId: customer._id, 
        customerCode: customer.customerCode,
        companyId: customerData.companyId,
        createdBy 
      });

      return customer;
    } catch (error) {
      logger.error('Error creating customer', { error, customerData, createdBy });
      throw error;
    }
  }

  /**
   * Find or create customer for Sales (spec: create-first-time when user types new customer)
   * Minimal fields: customerName, contactPerson, mobile, whatsapp, email, gstin, address, state, paymentTerms, notes.
   */
  async findOrCreateForSales(
    payload: {
      customerName: string;
      contactPerson?: string;
      mobile?: string;
      whatsapp?: string;
      email?: string;
      gstin?: string;
      address?: string;
      state?: string;
      paymentTerms?: string;
      notes?: string;
    },
    companyId: string,
    createdBy?: string
  ): Promise<{ customer: ICustomer; created: boolean }> {
    const name = payload.customerName?.trim();
    if (!name) {
      throw new AppError('Customer / Party name is required', 400);
    }

    const companyObjId = new Types.ObjectId(companyId);
    const existing = await this.findOne({
      companyId: companyObjId,
      customerName: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      isActive: true
    });

    if (existing) {
      return { customer: existing, created: false };
    }

    const gstin = payload.gstin?.trim()?.toUpperCase();
    if (gstin && gstin !== 'URD' && gstin !== 'UNREGISTERED') {
      const dup = await this.findOne({
        companyId: companyObjId,
        'registrationDetails.gstin': gstin
      });
      if (dup) {
        throw new AppError('A customer with this GSTIN already exists', 400);
      }
    }

    const customerCode = await this.generateCustomerCode(companyId);
    const doc: Partial<ICustomer> = {
      companyId: companyObjId,
      customerCode,
      customerName: name,
      businessInfo: { businessType: 'proprietorship' },
      registrationDetails: {
        gstin: gstin || undefined,
        pan: undefined
      },
      contactInfo: {
        primaryPhone: payload.mobile || payload.whatsapp || 'NA',
        primaryEmail: payload.email || 'na@na.com',
        whatsapp: payload.whatsapp
      },
      contactPersons: payload.contactPerson
        ? [{
            name: payload.contactPerson,
            phone: payload.mobile || '',
            isPrimary: true,
            canPlaceOrders: true,
            canMakePayments: true,
            isActive: true
          }]
        : [],
      addresses: payload.address
        ? [{
            type: 'billing' as const,
            isPrimary: true,
            addressLine1: payload.address,
            city: '',
            state: payload.state || '',
            pincode: '',
            country: 'India',
            isActive: true
          }]
        : [],
      financialInfo: {
        paymentTerms: payload.paymentTerms,
        creditLimit: 0,
        creditDays: 0,
        securityDeposit: 0,
        outstandingAmount: 0,
        advanceAmount: 0,
        totalPurchases: 0,
        currency: 'INR',
        discountPercentage: 0,
        taxExempt: false
      },
      notes: payload.notes,
      relationship: { customerType: 'new', priority: 'medium', loyaltyPoints: 0 },
      isActive: true
    };

    const created = await this.create(doc as any, createdBy);
    return { customer: created, created: true };
  }

  /**
   * Get customer by code
   */
  async getCustomerByCode(customerCode: string, companyId: string): Promise<ICustomer | null> {
    try {
      return await this.findOne({ 
        customerCode: customerCode.toUpperCase(),
        companyId: new Types.ObjectId(companyId)
      });
    } catch (error) {
      logger.error('Error getting customer by code', { error, customerCode, companyId });
      throw error;
    }
  }

  /**
   * Get customers by company with optimization and pagination
   */
  async getCustomersByCompany(companyId: string, options: any = {}): Promise<{ data: ICustomer[], pagination: any }> {
    try {
      const startTime = Date.now();

      // Build optimized filter
      const filter = QueryOptimizer.createCompanyFilter(companyId, {
        isActive: true,
        ...QueryOptimizer.sanitizeFilter(options.filter || {})
      });

      // Add search filter if provided
      if (options.search) {
        const searchRegex = new RegExp(options.search, 'i');
        filter.$or = [
          { customerName: searchRegex },
          { 'contactInfo.primaryEmail': searchRegex },
          { 'contactInfo.primaryPhone': searchRegex },
          // Legacy field support
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex }
        ];
      }

      // Add status filter if provided
      if (options.status) {
        filter.isActive = options.status === 'active';
      }

      // Add customer type filter if provided
      if (options.customerType) {
        filter['businessInfo.businessType'] = options.customerType;
      }

      // Get total count for pagination
      const total = await this.count(filter);

      // Pagination parameters
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 10;
      const skip = (page - 1) * limit;

      // Sort options
      let sort: any = { customerName: 1 };
      if (options.sortBy) {
        sort = { [options.sortBy]: options.sortOrder === 'desc' ? -1 : 1 };
      }

      // Get customers with pagination
      const customers = await this.findManyLean(filter, {
        skip,
        limit,
        sort,
        lean: true
      });

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      QueryOptimizer.logQueryPerformance('getCustomersByCompany', startTime, customers.length, { companyId });

      return {
        data: customers,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      };
    } catch (error) {
      logger.error('Error getting customers by company', { error, companyId });
      throw error;
    }
  }

  /**
   * Get all customers across companies (Super Admin only) with pagination
   */
  async getAllCustomers(options: any = {}): Promise<{ data: ICustomer[], pagination: any }> {
    try {
      const startTime = Date.now();

      // Build filter for all customers
      let filter: any = { isActive: true };

      // Add search filter if provided
      if (options.search) {
        const searchRegex = new RegExp(options.search, 'i');
        filter.$or = [
          { customerName: searchRegex },
          { 'contactInfo.primaryEmail': searchRegex },
          { 'contactInfo.primaryPhone': searchRegex },
          // Legacy field support
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex }
        ];
      }

      // Add status filter if provided
      if (options.status) {
        filter.isActive = options.status === 'active';
      }

      // Add customer type filter if provided
      if (options.customerType) {
        filter['businessInfo.businessType'] = options.customerType;
      }

      // Add company filter if provided
      if (options.companyId) {
        filter.companyId = options.companyId;
      }

      // Get total count for pagination
      const total = await this.count(filter);

      // Pagination parameters
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 10;
      const skip = (page - 1) * limit;

      // Sort options
      let sort: any = { customerName: 1 };
      if (options.sortBy) {
        sort = { [options.sortBy]: options.sortOrder === 'desc' ? -1 : 1 };
      }

      // Get customers with pagination
      const customers = await this.findManyLean(filter, {
        skip,
        limit,
        sort,
        lean: true
      });

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      QueryOptimizer.logQueryPerformance('getAllCustomers', startTime, customers.length, { options });

      return {
        data: customers,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      };
    } catch (error) {
      logger.error('Error getting all customers', { error, options });
      throw error;
    }
  }

  /**
   * Update customer credit limit
   */
  async updateCreditLimit(customerId: string, creditLimit: number, updatedBy?: string): Promise<ICustomer | null> {
    try {
      const customer = await this.findById(customerId);
      if (!customer) {
        throw new AppError('Customer not found', 404);
      }

      const updatedCustomer = await this.update(customerId, {
        'creditInfo.creditLimit': creditLimit,
        'creditInfo.lastCreditReview': new Date()
      }, updatedBy);

      logger.info('Customer credit limit updated', { 
        customerId, 
        creditLimit,
        updatedBy 
      });

      return updatedCustomer;
    } catch (error) {
      logger.error('Error updating customer credit limit', { error, customerId, creditLimit, updatedBy });
      throw error;
    }
  }

  /**
   * Get customer statistics with optimization
   */
  async getCustomerStats(companyId: string): Promise<any> {
    try {
      const startTime = Date.now();

      // Use single optimized aggregation pipeline for better performance
      const pipeline = QueryOptimizer.optimizeAggregationPipeline([
        {
          $match: QueryOptimizer.createCompanyFilter(companyId)
        },
        {
          $facet: {
            totalStats: [
              {
                $group: {
                  _id: null,
                  totalCustomers: { $sum: 1 },
                  activeCustomers: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                  },
                  inactiveCustomers: {
                    $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
                  }
                }
              }
            ],
            financialStats: [
              { $match: { isActive: true } },
              {
                $group: {
                  _id: null,
                  totalCreditLimit: { $sum: '$financialInfo.creditLimit' },
                  totalOutstanding: { $sum: '$financialInfo.outstandingAmount' },
                  avgCreditLimit: { $avg: '$financialInfo.creditLimit' },
                  avgOutstanding: { $avg: '$financialInfo.outstandingAmount' }
                }
              }
            ]
          }
        }
      ]);

      const [result] = await this.aggregate(pipeline);
      const totalStats = result.totalStats[0] || {};
      const financialStats = result.financialStats[0] || {};

      QueryOptimizer.logQueryPerformance('getCustomerStats', startTime, 1, { companyId });

      return {
        totalCustomers: totalStats.totalCustomers || 0,
        activeCustomers: totalStats.activeCustomers || 0,
        inactiveCustomers: totalStats.inactiveCustomers || 0,
        totalCreditLimit: financialStats.totalCreditLimit || 0,
        totalOutstanding: financialStats.totalOutstanding || 0,
        averageCreditLimit: financialStats.avgCreditLimit || 0,
        averageOutstanding: financialStats.avgOutstanding || 0
      };
    } catch (error) {
      logger.error('Error getting customer statistics', { error, companyId });
      throw error;
    }
  }

  /**
   * Generate customer code
   */
  private async generateCustomerCode(companyId: string): Promise<string> {
    const count = await this.count({ companyId: new Types.ObjectId(companyId) });
    return `CUST${(count + 1).toString().padStart(6, '0')}`;
  }

  /**
   * Validate customer data
   */
  private validateCustomerData(customerData: Partial<ICustomer>): void {
    if (!customerData.companyId) {
      throw new AppError('Company ID is required', 400);
    }

    if (!customerData.customerName) {
      throw new AppError('Customer name is required', 400);
    }

    if (!customerData.contactInfo?.primaryEmail) {
      throw new AppError('Primary email is required', 400);
    }

    if (!customerData.contactInfo?.primaryPhone) {
      throw new AppError('Primary phone number is required', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerData.contactInfo.primaryEmail)) {
      throw new AppError('Invalid email format', 400);
    }

    if (customerData.financialInfo?.creditLimit && customerData.financialInfo.creditLimit < 0) {
      throw new AppError('Credit limit cannot be negative', 400);
    }
  }
}
