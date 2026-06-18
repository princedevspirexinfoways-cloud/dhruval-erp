import { BaseService } from './BaseService';
import Company from '../models/Company';
import { ICompany } from '@/types/models';
import { AppError } from '../utils/errors';

import { logger } from '@/utils/logger';
import { Types } from 'mongoose';

export class CompanyService extends BaseService<ICompany> {
  constructor() {
    super(Company);
  }

  /**
   * Create a new company with validation
   */
  async createCompany(companyData: Partial<ICompany>, userId?: string): Promise<ICompany> {
    try {
      // Validate company data
      this.validateCompanyData(companyData);

      // Check if company code already exists
      const existingCompany = await this.findOne({
        companyCode: companyData.companyCode?.toUpperCase()
      });

      if (existingCompany) {
        throw new AppError('Company code already exists', 400);
      }

      // Check if email already exists (if provided)
      if (companyData.contactInfo?.emails && companyData.contactInfo.emails.length > 0) {
        for (const email of companyData.contactInfo.emails) {
          if (email.type && email.type.trim()) {
            const existingEmail = await this.findOne({
              'contactInfo.emails': { $elemMatch: { type: email.type } }
            });

            if (existingEmail) {
              throw new AppError(`Email ${email.type} already exists`, 400);
            }
          }
        }
      }

      // Generate company code if not provided
      if (!companyData.companyCode) {
        companyData.companyCode = await this.generateCompanyCode(companyData.companyName!);
      }

      const company = await this.create({
        ...companyData,
        companyCode: companyData.companyCode.toUpperCase(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }, userId);

      logger.info('Company created successfully', { 
        companyId: company._id, 
        companyCode: company.companyCode,
        userId 
      });

      return company;
    } catch (error) {
      logger.error('Error creating company', { error, companyData, userId });
      throw error;
    }
  }

  /**
   * Find company by code
   */
  async findByCode(companyCode: string): Promise<ICompany | null> {
    try {
      return await this.findOne({ 
        companyCode: companyCode.toUpperCase(),
        isActive: true 
      });
    } catch (error) {
      logger.error('Error finding company by code', { error, companyCode });
      throw error;
    }
  }

  /**
   * Get active companies
   */
  async getActiveCompanies(page: number = 1, limit: number = 10) {
    try {
      return await this.paginate(
        { isActive: true },
        page,
        limit,
        { companyName: 1 }
      );
    } catch (error) {
      logger.error('Error getting active companies', { error, page, limit });
      throw error;
    }
  }

  /**
   * Update company settings
   */
  async updateSettings(companyId: string, settings: any, userId?: string): Promise<ICompany | null> {
    try {
      const company = await this.update(companyId, {
        $set: {
          'settings': settings,
          lastModifiedBy: userId ? new Types.ObjectId(userId) : undefined
        }
      }, userId);

      if (!company) {
        throw new AppError('Company not found', 404);
      }

      logger.info('Company settings updated', { companyId, userId });
      return company;
    } catch (error) {
      logger.error('Error updating company settings', { error, companyId, settings, userId });
      throw error;
    }
  }

  /**
   * Add branch to company
   */
  async addBranch(companyId: string, branchData: any, userId?: string): Promise<ICompany | null> {
    try {
      const company = await this.findById(companyId);
      if (!company) {
        throw new AppError('Company not found', 404);
      }

      // TODO: Implement branch functionality when ICompany interface is updated
      throw new AppError('Branch functionality not implemented', 501);
    } catch (error) {
      logger.error('Error adding branch to company', { error, companyId, branchData, userId });
      throw error;
    }
  }

  /**
   * Get company statistics
   */
  async getCompanyStats(companyId: string) {
    try {
      const company = await this.findById(companyId, [
        'departments',
        'branches'
      ]);

      if (!company) {
        throw new AppError('Company not found', 404);
      }

      // Basic company statistics based on available ICompany properties
      const stats = {
        companyCode: company.companyCode,
        companyName: company.companyName,
        legalName: company.legalName,
        gstin: company.registrationDetails.gstin,
        pan: company.registrationDetails.pan,
        currency: company.businessConfig.currency,
        timezone: company.businessConfig.timezone,
        totalBankAccounts: company.bankAccounts?.length || 0,
        activeBankAccounts: company.bankAccounts?.filter(acc => acc.isActive).length || 0,
        totalLicenses: company.licenses?.length || 0,
        isActive: company.isActive
      };

      return stats;
    } catch (error) {
      logger.error('Error getting company stats', { error, companyId });
      throw error;
    }
  }

  /**
   * Search companies
   */
  async searchCompanies(searchTerm: string, page: number = 1, limit: number = 10) {
    try {
      const searchRegex = new RegExp(searchTerm, 'i');
      
      const filter = {
        $and: [
          { isActive: true },
          {
            $or: [
              { companyName: searchRegex },
              { companyCode: searchRegex },
              { 'contactInfo.email': searchRegex },
              { industry: searchRegex }
            ]
          }
        ]
      };

      return await this.paginate(filter, page, limit, { companyName: 1 });
    } catch (error) {
      logger.error('Error searching companies', { error, searchTerm, page, limit });
      throw error;
    }
  }

  /**
   * Deactivate company (soft delete)
   */
  async deactivateCompany(companyId: string, userId?: string): Promise<boolean> {
    try {
      const result = await this.update(companyId, {
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedBy: userId ? new Types.ObjectId(userId) : undefined
      }, userId);

      if (!result) {
        throw new AppError('Company not found', 404);
      }

      logger.info('Company deactivated', { companyId, userId });
      return true;
    } catch (error) {
      logger.error('Error deactivating company', { error, companyId, userId });
      throw error;
    }
  }

  /**
   * Reactivate company
   */
  async reactivateCompany(companyId: string, userId?: string): Promise<boolean> {
    try {
      const result = await this.update(companyId, {
        isActive: true,
        reactivatedAt: new Date(),
        reactivatedBy: userId ? new Types.ObjectId(userId) : undefined,
        $unset: { deactivatedAt: 1, deactivatedBy: 1 }
      }, userId);

      if (!result) {
        throw new AppError('Company not found', 404);
      }

      logger.info('Company reactivated', { companyId, userId });
      return true;
    } catch (error) {
      logger.error('Error reactivating company', { error, companyId, userId });
      throw error;
    }
  }

  /**
   * Generate unique company code
   */
  private async generateCompanyCode(companyName: string): Promise<string> {
    try {
      // Generate code from company name
      const baseCode = companyName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 6);

      let code = baseCode;
      let counter = 1;

      // Check for uniqueness
      while (await this.exists({ companyCode: code })) {
        code = `${baseCode}${counter.toString().padStart(2, '0')}`;
        counter++;
      }

      return code;
    } catch (error) {
      logger.error('Error generating company code', { error, companyName });
      throw new AppError('Failed to generate company code', 500);
    }
  }

  /**
   * Validate company data - Only company name and code are required
   */
  private validateCompanyData(companyData: Partial<ICompany>): void {
    // Only company name and code are required
    if (!companyData.companyName) {
      throw new AppError('Company name is required', 400);
    }

    if (!companyData.companyCode) {
      throw new AppError('Company code is required', 400);
    }

    // Validate format if optional fields are provided
    if (companyData.registrationDetails?.gstin) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(companyData.registrationDetails.gstin)) {
        throw new AppError('Invalid GSTIN format', 400);
      }
    }

    if (companyData.registrationDetails?.pan) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(companyData.registrationDetails.pan)) {
        throw new AppError('Invalid PAN format', 400);
      }
    }

    if (companyData.registrationDetails?.cin) {
      const cinRegex = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
      if (!cinRegex.test(companyData.registrationDetails.cin)) {
        throw new AppError('Invalid CIN format', 400);
      }
    }

    // Validate email format if provided
    if (companyData.contactInfo?.emails && companyData.contactInfo.emails.length > 0) {
      for (const email of companyData.contactInfo.emails) {
        if (email.type && email.type.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email.type)) {
            throw new AppError('Invalid email format', 400);
          }
        }
      }
    }

    // Validate website format if provided
    if (companyData.contactInfo?.website) {
      const websiteRegex = /^https?:\/\/.+/;
      if (!websiteRegex.test(companyData.contactInfo.website)) {
        throw new AppError('Invalid website format. Must start with http:// or https://', 400);
      }
    }
  }
}
