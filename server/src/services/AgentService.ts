import { Types, Document, Schema } from 'mongoose';
import { BaseService } from './BaseService';
import { Agent } from '../models/Agent';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

interface IAgent extends Document {
  companyId: Schema.Types.ObjectId;
  agentCode: string;
  agentName: string;
  firmName?: string;
  contactPersonName: string;
  contactInfo: {
    primaryPhone: string;
    alternatePhone?: string;
    primaryEmail: string;
    alternateEmail?: string;
    whatsapp?: string;
    fax?: string;
    tollFree?: string;
  };
  addresses: Array<{
    type: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    isDefault: boolean;
  }>;
  contactPersons: Array<{
    name: string;
    designation?: string;
    phone?: string;
    email?: string;
    isPrimary: boolean;
  }>;
  registrationDetails: {
    gstin?: string;
    pan?: string;
  };
  notes?: string;
  tags?: string[];
  isActive: boolean;
}

export class AgentService extends BaseService<IAgent> {
  constructor() {
    super(Agent as any);
  }

  /**
   * Generate unique agent code
   */
  private async generateAgentCode(companyId: string): Promise<string> {
    let agentCode: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      // Generate code: AGT + timestamp last 6 digits
      const timestamp = Date.now().toString();
      agentCode = `AGT${timestamp.slice(-6)}`;

      const existing = await this.findOne({
        agentCode,
        companyId
      });

      if (!existing) {
        isUnique = true;
      } else {
        attempts++;
        // Add random suffix if duplicate
        agentCode = `AGT${timestamp.slice(-6)}${Math.floor(Math.random() * 100)}`;
      }
    }

    if (!isUnique) {
      throw new AppError('Failed to generate unique agent code', 500);
    }

    return agentCode!;
  }

  /**
   * Create a new agent
   */
  async createAgent(agentData: Partial<IAgent>, createdBy?: string): Promise<IAgent> {
    try {
      // Validate agent data
      this.validateAgentData(agentData);

      // Auto-generate agent code if not provided
      let agentCode = agentData.agentCode?.trim();
      if (!agentCode) {
        agentCode = await this.generateAgentCode(agentData.companyId!.toString());
      } else {
        // Check for duplicate agent code if provided
        const existingAgent = await this.findOne({ 
          agentCode: agentCode,
          companyId: agentData.companyId
        });

        if (existingAgent) {
          throw new AppError('Agent with this code already exists', 400);
        }
      }

      // Create agent
      const agent = await this.create({
        ...agentData,
        agentCode,
        isActive: true
      }, createdBy);

      logger.info(`Agent created: ${agent.agentCode} by ${createdBy}`);
      return agent;
    } catch (error: any) {
      logger.error('Error creating agent:', error);
      throw error;
    }
  }

  /**
   * Validate agent data
   */
  private validateAgentData(agentData: Partial<IAgent>): void {
    if (!agentData.companyId) {
      throw new AppError('Company ID is required', 400);
    }

    // Agent code is optional - will be auto-generated if not provided
    // But if provided, validate it's not empty
    if (agentData.agentCode && !agentData.agentCode.trim()) {
      throw new AppError('Agent code cannot be empty', 400);
    }

    if (!agentData.agentName || !agentData.agentName.trim()) {
      throw new AppError('Firm name is required', 400);
    }

    if (!agentData.contactPersonName || !agentData.contactPersonName.trim()) {
      throw new AppError('Contact person name is required', 400);
    }

    if (!agentData.contactInfo?.primaryPhone || !agentData.contactInfo.primaryPhone.trim()) {
      throw new AppError('Contact number is required', 400);
    }

    if (!agentData.contactInfo?.primaryEmail || !agentData.contactInfo.primaryEmail.trim()) {
      throw new AppError('Email address is required', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(agentData.contactInfo.primaryEmail)) {
      throw new AppError('Invalid email format', 400);
    }

    // Validate phone format (10 digits starting with 6-9)
    const phoneRegex = /^[6-9]\d{9}$/;
    const phoneDigits = agentData.contactInfo.primaryPhone.replace(/\D/g, '');
    if (!phoneRegex.test(phoneDigits)) {
      throw new AppError('Invalid phone number format. Must be 10 digits starting with 6-9', 400);
    }

    // Validate address fields if address is provided
    if (agentData.addresses && agentData.addresses.length > 0) {
      const address = agentData.addresses[0];
      if (!address.addressLine1 || !address.addressLine1.trim()) {
        throw new AppError('Address is required', 400);
      }
      if (!address.city || !address.city.trim()) {
        throw new AppError('City is required', 400);
      }
      if (!address.state || !address.state.trim()) {
        throw new AppError('State is required', 400);
      }
      if (!address.pincode || !address.pincode.trim()) {
        throw new AppError('Pincode is required', 400);
      }
    }

    // Validate GST number format if provided
    if (agentData.registrationDetails?.gstin) {
      const gstin = agentData.registrationDetails.gstin.trim();
      if (gstin) {
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstinRegex.test(gstin)) {
          throw new AppError('Invalid GST number format', 400);
        }
      }
    }
  }

  /**
   * Get agent by code
   */
  async getAgentByCode(agentCode: string, companyId?: string): Promise<IAgent | null> {
    try {
      const query: any = { agentCode };
      if (companyId) {
        query.companyId = companyId;
      }
      return await this.findOne(query);
    } catch (error: any) {
      logger.error('Error getting agent by code:', error);
      throw error;
    }
  }

  /**
   * Get agents by company with pagination and filters
   */
  async getAgentsByCompany(
    companyId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
    } = {}
  ): Promise<{ data: IAgent[]; pagination: any }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const skip = (page - 1) * limit;

      const query: any = { companyId };

      // Filter by active status
      if (options.status === 'active') {
        query.isActive = true;
      } else if (options.status === 'inactive') {
        query.isActive = false;
      }

      // Search filter
      if (options.search) {
        const searchRegex = new RegExp(options.search, 'i');
        query.$or = [
          { agentName: searchRegex },
          { agentCode: searchRegex },
          { firmName: searchRegex },
          { contactPersonName: searchRegex },
          { 'contactInfo.primaryEmail': searchRegex },
          { 'contactInfo.primaryPhone': searchRegex }
        ];
      }

      const [data, total] = await Promise.all([
        this.findMany(query, { skip, limit, sort: { createdAt: -1 } }),
        this.count(query)
      ]);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      logger.error('Error getting agents by company:', error);
      throw error;
    }
  }

  /**
   * Search agents
   */
  async searchAgents(searchQuery: string, companyId: string): Promise<IAgent[]> {
    try {
      const searchRegex = new RegExp(searchQuery, 'i');
      const query = {
        companyId,
        isActive: true,
        $or: [
          { agentName: searchRegex },
          { agentCode: searchRegex },
          { firmName: searchRegex },
          { contactPersonName: searchRegex },
          { 'contactInfo.primaryEmail': searchRegex },
          { 'contactInfo.primaryPhone': searchRegex }
        ]
      };

      return await this.findMany(query, { limit: 20 });
    } catch (error: any) {
      logger.error('Error searching agents:', error);
      throw error;
    }
  }

  /**
   * Get agent statistics
   */
  async getAgentStats(companyId: string): Promise<any> {
    try {
      const [total, active, inactive] = await Promise.all([
        this.count({ companyId }),
        this.count({ companyId, isActive: true }),
        this.count({ companyId, isActive: false })
      ]);

      return {
        total,
        active,
        inactive
      };
    } catch (error: any) {
      logger.error('Error getting agent stats:', error);
      throw error;
    }
  }
}

