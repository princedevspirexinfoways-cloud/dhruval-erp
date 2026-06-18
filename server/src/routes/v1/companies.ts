import { Router, Request, Response } from 'express';
import { authenticate, requireCompany } from '../../middleware/auth';
import Company from '../../models/Company';
import User from '../../models/User';
import CustomerOrder from '../../models/CustomerOrder';
import ProductionOrder from '../../models/ProductionOrder';
import InventoryItem from '../../models/InventoryItem';
import Customer from '../../models/Customer';
import Invoice from '../../models/Invoice';
import { logger } from '../../utils/logger';
import { Types } from 'mongoose';

const router = Router();

// =============================================
// COMPANIES API V1 ROUTES
// =============================================

// GET /api/v1/companies/test - Test endpoint (COMPLETELY PUBLIC - NO AUTH)
router.get('/test', async (req: Request, res: Response) => {
  try {
    logger.info('GET /api/v1/companies/test - Test endpoint');

    res.status(200).json({
      success: true,
      message: 'Companies API v1 is working!',
      data: {
        endpoint: '/api/v1/companies',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        note: 'Most endpoints require authentication'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error in test endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Test endpoint failed',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/v1/companies - List companies (requires authentication)
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    logger.info('GET /api/v1/companies - Fetching companies list');

    // Return companies with proper structure including status
    const companies = await Company.find({ isActive: true })
      .select('companyName companyCode contactInfo addresses registrationDetails status isActive createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Companies retrieved successfully',
      data: companies,
      count: companies.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error fetching companies:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch companies',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/v1/companies/stats - Get company statistics (SUPERADMIN CAN ACCESS WITHOUT COMPANY ID)
// MOVED BEFORE /:id route to prevent route conflict
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    logger.info('GET /api/v1/companies/stats - Fetching company statistics');

    const stats = await Company.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalCompanies: { $sum: 1 },
          activeCompanies: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          inactiveCompanies: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } }
        }
      }
    ]);

    const result = stats[0] || {
      totalCompanies: 0,
      activeCompanies: 0,
      inactiveCompanies: 0
    };

    res.status(200).json({
      success: true,
      message: 'Company statistics retrieved successfully',
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error fetching company statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch company statistics',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/v1/companies/batch-stats - Get stats for multiple companies at once
router.get('/batch-stats', authenticate, async (req: Request, res: Response) => {
  try {
    const { companyIds } = req.query;
    
    // Handle both array and single string formats
    let companyIdsArray: string[] = [];
    if (Array.isArray(companyIds)) {
      companyIdsArray = companyIds as string[];
    } else if (typeof companyIds === 'string') {
      // Split comma-separated string into array
      companyIdsArray = companyIds.split(',').map(id => id.trim()).filter(id => id.length > 0);
    } else if (req.query.companyIds && Array.isArray(req.query.companyIds)) {
      companyIdsArray = req.query.companyIds as string[];
    }
    
    if (companyIdsArray.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'companyIds array is required',
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`GET /api/v1/companies/batch-stats - Fetching stats for ${companyIdsArray.length} companies`);

    // Get stats for all companies in parallel
    const statsPromises = companyIdsArray.map(async (companyId: string) => {
      try {
        const [
          totalUsers,
          activeUsers,
          totalOrders,
          completedOrders,
          totalRevenue,
          totalInventory,
          totalProduction,
          totalCustomers,
          totalInvoices
        ] = await Promise.all([
          // Users stats
          User.countDocuments({
            'companyAccess.companyId': new Types.ObjectId(companyId),
            isActive: true
          }),
          User.countDocuments({
            'companyAccess.companyId': new Types.ObjectId(companyId),
            isActive: true,
            lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }),
          
          // Orders stats
          CustomerOrder.countDocuments({
            companyId: new Types.ObjectId(companyId)
          }),
          CustomerOrder.countDocuments({
            companyId: new Types.ObjectId(companyId),
            status: { $in: ['delivered', 'completed'] }
          }),
          
          // Revenue stats
          CustomerOrder.aggregate([
            { $match: { 
              companyId: new Types.ObjectId(companyId),
              status: { $in: ['delivered', 'completed'] }
            }},
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
          ]),
          
          // Inventory stats
          InventoryItem.countDocuments({
            companyId: new Types.ObjectId(companyId)
          }),
          
          // Production stats
          ProductionOrder.countDocuments({
            companyId: new Types.ObjectId(companyId),
            status: 'completed'
          }),
          
          // Customer stats
          Customer.countDocuments({
            companyId: new Types.ObjectId(companyId)
          }),
          
          // Invoice stats
          Invoice.countDocuments({
            companyId: new Types.ObjectId(companyId)
          })
        ]);

        const revenue = totalRevenue[0]?.total || 0;

        return {
          companyId,
          stats: {
            totalUsers,
            activeUsers,
            inactiveUsers: totalUsers - activeUsers,
            totalOrders,
            completedOrders,
            pendingOrders: totalOrders - completedOrders,
            totalRevenue: revenue,
            totalInventory,
            totalProduction,
            totalCustomers,
            totalInvoices,
            orderCompletionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
            userActivityRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
          }
        };
      } catch (error) {
        logger.error(`Error fetching stats for company ${companyId}:`, error);
        return {
          companyId,
          stats: {
            totalUsers: 0,
            activeUsers: 0,
            inactiveUsers: 0,
            totalOrders: 0,
            completedOrders: 0,
            pendingOrders: 0,
            totalRevenue: 0,
            totalInventory: 0,
            totalProduction: 0,
            totalCustomers: 0,
            totalInvoices: 0,
            orderCompletionRate: 0,
            userActivityRate: 0
          }
        };
      }
    });

    const results = await Promise.all(statsPromises);

    res.status(200).json({
      success: true,
      message: 'Batch company stats retrieved successfully',
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error fetching batch company stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch batch company stats',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/v1/companies/:id/stats - Get detailed stats for a specific company
router.get('/:id/stats', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    logger.info(`GET /api/v1/companies/${id}/stats - Fetching company stats`);

    // Models are already imported at the top

    // Get company-specific stats
    const [
      totalUsers,
      activeUsers,
      totalOrders,
      completedOrders,
      totalRevenue,
      totalInventory,
      totalProduction,
      totalCustomers,
      totalInvoices
    ] = await Promise.all([
      // Users stats
      User.countDocuments({
        'companyAccess.companyId': new Types.ObjectId(id),
        isActive: true
      }),
      User.countDocuments({
        'companyAccess.companyId': new Types.ObjectId(id),
        isActive: true,
        lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      
      // Orders stats
      CustomerOrder.countDocuments({
        companyId: new Types.ObjectId(id)
      }),
      CustomerOrder.countDocuments({
        companyId: new Types.ObjectId(id),
        status: { $in: ['delivered', 'completed'] }
      }),
      
      // Revenue stats
      CustomerOrder.aggregate([
        { $match: { 
          companyId: new Types.ObjectId(id),
          status: { $in: ['delivered', 'completed'] }
        }},
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // Inventory stats
      InventoryItem.countDocuments({
        companyId: new Types.ObjectId(id)
      }),
      
      // Production stats
      ProductionOrder.countDocuments({
        companyId: new Types.ObjectId(id),
        status: 'completed'
      }),
      
      // Customer stats
      Customer.countDocuments({
        companyId: new Types.ObjectId(id)
      }),
      
      // Invoice stats
      Invoice.countDocuments({
        companyId: new Types.ObjectId(id)
      })
    ]);

    const revenue = totalRevenue[0]?.total || 0;

    const stats = {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      totalOrders,
      completedOrders,
      pendingOrders: totalOrders - completedOrders,
      totalRevenue: revenue,
      totalInventory,
      totalProduction,
      totalCustomers,
      totalInvoices,
      orderCompletionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
      userActivityRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
    };

    res.status(200).json({
      success: true,
      message: 'Company stats retrieved successfully',
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error fetching company stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch company stats',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/v1/companies/:id - Get company by ID with detailed information (SUPERADMIN CAN ACCESS WITHOUT COMPANY ID)
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    logger.info(`GET /api/v1/companies/${id} - Fetching company details`);

    const company = await Company.findById(id)
      .populate('createdBy', 'username personalInfo.firstName personalInfo.lastName email')
      .select('-__v');

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Company not found',
        timestamp: new Date().toISOString()
      });
    }

    // For now, just return company details without users and stats
    res.status(200).json({
      success: true,
      message: 'Company retrieved successfully',
      data: company,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error fetching company:', {
      error: error.message,
      stack: error.stack,
      companyId: id
    });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch company',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/v1/companies - Create new company (requires authentication)
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    logger.info('POST /api/v1/companies - Creating new company', { userId: user.id });

    const {
      companyName,
      companyCode,
      legalName,
      status,
      registrationDetails,
      addresses,
      contactInfo,
      businessConfig
    } = req.body;

    // Validation - Both company name and code are required
    if (!companyName || !companyName.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Company name is required',
        timestamp: new Date().toISOString()
      });
    }

    if (!companyCode || !companyCode.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Company code is required',
        timestamp: new Date().toISOString()
      });
    }

    // Validate company code format (alphanumeric, 3-20 characters)
    const companyCodeRegex = /^[A-Z0-9]{3,20}$/;
    if (!companyCodeRegex.test(companyCode.trim().toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Company code must be 3-20 characters long and contain only letters and numbers',
        timestamp: new Date().toISOString()
      });
    }

    const finalCompanyCode = companyCode.trim().toUpperCase();

    // Check if company already exists
    const existingCompany = await Company.findOne({
      $or: [
        { companyName },
        { companyCode: finalCompanyCode.toUpperCase() }
      ]
    });

    if (existingCompany) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'Company with this name or code already exists',
        timestamp: new Date().toISOString()
      });
    }

    // Check email uniqueness if provided
    if (contactInfo?.emails && contactInfo.emails.length > 0) {
      for (const emailObj of contactInfo.emails) {
        if (emailObj.type && emailObj.type.trim()) {
          const existingEmail = await Company.findOne({
            'contactInfo.emails': { $elemMatch: { type: emailObj.type } }
          });

          if (existingEmail) {
            return res.status(409).json({
              success: false,
              error: 'Conflict',
              message: `Company with email ${emailObj.type} already exists`,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }

    // Build company data structure
    const companyData: any = {
      companyName: companyName.trim(),
      companyCode: finalCompanyCode,
      status: status || 'active',
      createdBy: new Types.ObjectId(user.id),
      isActive: true
    };

    // Add optional fields only if provided and not empty
    if (legalName && legalName.trim()) {
      companyData.legalName = legalName.trim();
    }

    if (registrationDetails) {
      companyData.registrationDetails = {};
      if (registrationDetails.gstin && registrationDetails.gstin.trim()) {
        companyData.registrationDetails.gstin = registrationDetails.gstin.trim().toUpperCase();
      }
      if (registrationDetails.pan && registrationDetails.pan.trim()) {
        companyData.registrationDetails.pan = registrationDetails.pan.trim().toUpperCase();
      }
      if (registrationDetails.cin && registrationDetails.cin.trim()) {
        companyData.registrationDetails.cin = registrationDetails.cin.trim().toUpperCase();
      }
      if (registrationDetails.udyogAadhar && registrationDetails.udyogAadhar.trim()) {
        companyData.registrationDetails.udyogAadhar = registrationDetails.udyogAadhar.trim();
      }
      if (registrationDetails.iecCode && registrationDetails.iecCode.trim()) {
        companyData.registrationDetails.iecCode = registrationDetails.iecCode.trim().toUpperCase();
      }
      if (registrationDetails.registrationDate && registrationDetails.registrationDate.trim()) {
        companyData.registrationDetails.registrationDate = new Date(registrationDetails.registrationDate);
      }
      
      // If no registration details were added, don't include the object
      if (Object.keys(companyData.registrationDetails).length === 0) {
        delete companyData.registrationDetails;
      }
    }

    if (addresses) {
      companyData.addresses = {};
      if (addresses.registeredOffice) {
        companyData.addresses.registeredOffice = {
          street: addresses.registeredOffice.street || '',
          area: addresses.registeredOffice.area || '',
          city: addresses.registeredOffice.city || '',
          state: addresses.registeredOffice.state || '',
          pincode: addresses.registeredOffice.pincode || '',
          country: addresses.registeredOffice.country || 'India'
        };
      }
      if (addresses.factoryAddress) {
        companyData.addresses.factoryAddress = {
          street: addresses.factoryAddress.street || '',
          area: addresses.factoryAddress.area || '',
          city: addresses.factoryAddress.city || '',
          state: addresses.factoryAddress.state || '',
          pincode: addresses.factoryAddress.pincode || '',
          country: addresses.factoryAddress.country || 'India'
        };
      }
      if (addresses.warehouseAddresses && addresses.warehouseAddresses.length > 0) {
        companyData.addresses.warehouseAddresses = addresses.warehouseAddresses;
      }
    }

    if (contactInfo) {
      companyData.contactInfo = {
        phones: contactInfo.phones || [],
        emails: contactInfo.emails || [],
        website: contactInfo.website || '',
        socialMedia: contactInfo.socialMedia || {}
      };
    }

    if (businessConfig) {
      companyData.businessConfig = {
        currency: businessConfig.currency || 'INR',
        timezone: businessConfig.timezone || 'Asia/Kolkata',
        fiscalYearStart: businessConfig.fiscalYearStart || 'April',
        workingDays: businessConfig.workingDays || [],
        workingHours: businessConfig.workingHours || {},
        gstRates: businessConfig.gstRates || {}
      };
    }

    const company = new Company(companyData);
    await company.save();

    // Get populated company data
    const populatedCompany = await Company.findById(company._id)
      .populate('createdBy', 'username personalInfo.firstName personalInfo.lastName')
      .select('-__v');

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: populatedCompany,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error creating company:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create company',
      timestamp: new Date().toISOString()
    });
  }
});

// PUT /api/v1/companies/:id - Update company (requires authentication)
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    logger.info(`PUT /api/v1/companies/${id} - Updating company`, { userId: user.id });

    const { companyName, email, phone, website, status, isActive } = req.body;

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Company not found',
        timestamp: new Date().toISOString()
      });
    }

    // Update company
    const updateData: any = {
      lastModifiedBy: user.id,
      updatedAt: new Date()
    };

    if (companyName) updateData.companyName = companyName;
    if (email) updateData['contactInfo.emails.0.email'] = email;
    if (phone) updateData['contactInfo.phones.0.number'] = phone;
    if (website) updateData['contactInfo.website'] = website;
    if (status !== undefined) {
      updateData.status = status;
      // Keep the boolean `isActive` flag in sync with the status string so
      // list queries (which filter on isActive) reflect status changes.
      if (isActive === undefined) {
        updateData.isActive = status === 'active';
      }
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('companyName companyCode contactInfo status isActive createdAt updatedAt');

    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: updatedCompany,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error updating company:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update company',
      timestamp: new Date().toISOString()
    });
  }
});

// DELETE /api/v1/companies/:id - Delete company (requires authentication)
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    logger.info(`DELETE /api/v1/companies/${id} - Deleting company`, { userId: user.id });

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Company not found',
        timestamp: new Date().toISOString()
      });
    }

    // Soft delete - mark as inactive
    await Company.findByIdAndUpdate(id, {
      isActive: false,
      deletedBy: user.id,
      deletedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Company deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error deleting company:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to delete company',
      timestamp: new Date().toISOString()
    });
  }
});



export default router;
