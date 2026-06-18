import { Router, Request, Response } from 'express';
import Company from '@/models/Company';
import User from '@/models/User';
import { authenticate, requireSuperAdmin } from '@/middleware/auth';
import { logAudit } from '@/utils/logger';

const router:Router = Router();


/**
 * GET /api/admin/companies
 * Get all companies with user counts
 */
router.get('/companies', authenticate, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const companies = await Company.find({}).lean();

    // Get user count for each company
    const companiesWithUserCount = await Promise.all(
      companies.map(async (company) => {
        const userCount = await User.countDocuments({
          'companyAccess.companyId': company._id
        });
        
        return {
          ...company,
          userCount
        };
      })
    );

    res.json({
      success: true,
      data: companiesWithUserCount
    });
  } catch (error: any) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get companies'
    });
  }
});

/**
 * POST /api/admin/companies
 * Create new company
 */
router.post('/companies', authenticate, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    const {
      companyName,
      companyCode,
      legalName,
      registrationNumber,
      taxId,
      email,
      phone,
      website,
      address,
      isActive
    } = req.body;

    // Validate required fields
    if (!companyName || !companyCode) {
      return res.status(400).json({
        success: false,
        message: 'Company name and code are required'
      });
    }

    // Check if company code already exists
    const existingCompany = await Company.findOne({ companyCode });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company with this code already exists'
      });
    }

    // Create company
    const newCompany = new Company({
      companyCode: companyCode.toUpperCase(),
      companyName,
      legalName: legalName || companyName,
      registrationDetails: {
        gstin: taxId || '',
        pan: registrationNumber || '',
        registrationDate: new Date()
      },
      addresses: {
        registeredOffice: {
          street: address?.street || '',
          area: address?.area || '',
          city: address?.city || '',
          state: address?.state || '',
          pincode: address?.postalCode || '',
          country: address?.country || 'India'
        },
        factoryAddress: {
          street: address?.street || '',
          area: address?.area || '',
          city: address?.city || '',
          state: address?.state || '',
          pincode: address?.postalCode || '',
          country: address?.country || 'India'
        },
        warehouseAddresses: []
      },
      contactInfo: {
        phones: phone ? [{ number: phone, type: 'primary', isPrimary: true }] : [],
        emails: email ? [{ email, type: 'primary', isPrimary: true }] : [],
        website,
        socialMedia: {}
      },
      bankAccounts: [],
      businessConfig: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        fiscalYearStart: 4,
        gstEnabled: true,
        multiLocationEnabled: false
      },
      isActive: isActive !== undefined ? isActive : true,
      createdBy: currentUser?._id
    });

    await newCompany.save();

    // Log admin action
    logAudit('Super admin created company', {
      adminId: currentUser?._id,
      targetCompanyId: newCompany._id,
      companyName: newCompany.companyName,
      companyCode: newCompany.companyCode,
      action: 'ADMIN_CREATE_COMPANY'
    });

    res.status(201).json({
      success: true,
      data: newCompany,
      message: 'Company created successfully'
    });
  } catch (error: any) {
    console.error('Create company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create company'
    });
  }
});

/**
 * PUT /api/admin/companies/:companyId
 * Update company
 */
router.put('/companies/:companyId', authenticate, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    const { companyId } = req.params;
    const {
      companyName,
      companyCode,
      legalName,
      registrationNumber,
      taxId,
      email,
      phone,
      website,
      address,
      isActive
    } = req.body;

    // Find company
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if company code is being changed and if it already exists
    if (companyCode && companyCode !== company.companyCode) {
      const existingCompany = await Company.findOne({ 
        companyCode: companyCode.toUpperCase(),
        _id: { $ne: companyId }
      });
      
      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: 'Company with this code already exists'
        });
      }
    }

    // Update company fields
    if (companyName) company.companyName = companyName;
    if (companyCode) company.companyCode = companyCode.toUpperCase();
    if (legalName !== undefined) company.legalName = legalName;
    if (registrationNumber !== undefined) {
      company.registrationDetails.pan = registrationNumber;
    }
    if (taxId !== undefined) {
      company.registrationDetails.gstin = taxId;
    }
    if (email !== undefined) {
      if (company.contactInfo.emails.length > 0) {
        company.contactInfo.emails[0].email = email;
      } else {
        company.contactInfo.emails.push({ email, type: 'primary', isPrimary: true });
      }
    }
    if (phone !== undefined) {
      if (company.contactInfo.phones.length > 0) {
        company.contactInfo.phones[0].number = phone;
      } else {
        company.contactInfo.phones.push({ number: phone, type: 'primary', isPrimary: true });
      }
    }
    if (website !== undefined) {
      company.contactInfo.website = website;
    }
    if (isActive !== undefined) company.isActive = isActive;

    // Update address if provided
    if (address) {
      company.addresses.registeredOffice = {
        street: address.street || company.addresses?.registeredOffice?.street || '',
        area: address.area || company.addresses?.registeredOffice?.area || '',
        city: address.city || company.addresses?.registeredOffice?.city || '',
        state: address.state || company.addresses?.registeredOffice?.state || '',
        pincode: address.postalCode || company.addresses?.registeredOffice?.pincode || '',
        country: address.country || company.addresses?.registeredOffice?.country || 'India'
      };
    }

    company.updatedAt = new Date();
    await company.save();

    // Log admin action
    logAudit('Super admin updated company', {
      adminId: currentUser?._id,
      targetCompanyId: companyId,
      companyName: company.companyName,
      companyCode: company.companyCode,
      action: 'ADMIN_UPDATE_COMPANY'
    });

    res.json({
      success: true,
      data: company,
      message: 'Company updated successfully'
    });
  } catch (error: any) {
    console.error('Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company'
    });
  }
});

/**
 * DELETE /api/admin/companies/:companyId
 * Delete company
 */
router.delete('/companies/:companyId', authenticate, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    const { companyId } = req.params;

    // Find company
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if company has users
    const userCount = await User.countDocuments({
      'companyAccess.companyId': companyId
    });

    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete company with ${userCount} users. Please transfer or delete users first.`
      });
    }

    // Delete company
    await Company.findByIdAndDelete(companyId);

    // Log admin action
    logAudit('Super admin deleted company', {
      adminId: currentUser?._id,
      targetCompanyId: companyId,
      companyName: company.companyName,
      companyCode: company.companyCode,
      action: 'ADMIN_DELETE_COMPANY'
    });

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete company'
    });
  }
});

/**
 * GET /api/admin/companies/:companyId/users
 * Get all users for a specific company
 */
router.get('/companies/:companyId/users', authenticate, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Get users for this company
    const users = await User.find({
      'companyAccess.companyId': companyId
    }, {
      password: 0,
      refreshTokens: 0
    }).lean();

    res.json({
      success: true,
      data: {
        company: {
          _id: company._id,
          companyName: company.companyName,
          companyCode: company.companyCode
        },
        users,
        userCount: users.length
      }
    });
  } catch (error: any) {
    console.error('Get company users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get company users'
    });
  }
});

/**
 * POST /api/admin/companies/:companyId/toggle-status
 * Toggle company active status
 */
router.post('/companies/:companyId/toggle-status', authenticate, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const currentUser = req.user;
    const { companyId } = req.params;

    // Find company
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Toggle status
    company.isActive = !company.isActive;
    company.updatedAt = new Date();
    await company.save();

    // Log admin action
    logAudit('Super admin toggled company status', {
      adminId: currentUser?._id,
      targetCompanyId: companyId,
      companyName: company.companyName,
      newStatus: company.isActive,
      action: 'ADMIN_TOGGLE_COMPANY_STATUS'
    });

    res.json({
      success: true,
      data: {
        isActive: company.isActive
      },
      message: `Company ${company.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error: any) {
    console.error('Toggle company status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle company status'
    });
  }
});

export default router;
