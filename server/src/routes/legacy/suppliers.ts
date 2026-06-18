import { Router, Request, Response } from 'express'
import { authenticate } from '@/middleware/auth'
import Supplier from '@/models/Supplier'
import mongoose from 'mongoose'

const router = Router()

// Apply authentication middleware
router.use(authenticate)
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      category = 'all'
    } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const searchTerm = search as string

    // Get company ID
    const companyId = user.isSuperAdmin ? req.query.companyId || user.companyId : user.companyId

    // Build query
    let query: any = {
      companyId: new mongoose.Types.ObjectId(companyId),
      isActive: true
    }

    // Add search filter
    if (searchTerm) {
      query.$or = [
        { supplierCode: { $regex: searchTerm, $options: 'i' } },
        { companyName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { 'contactPerson.name': { $regex: searchTerm, $options: 'i' } },
        { 'contactPerson.email': { $regex: searchTerm, $options: 'i' } }
      ]
    }

    // Add status filter
    if (status !== 'all') {
      query.status = status
    }

    // Add category filter
    if (category !== 'all') {
      query.category = category
    }

    // Get suppliers with pagination
    const suppliers = await Supplier.find(query)
      .populate('companyId', 'companyName companyCode')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean()

    // Get total count for pagination
    const total = await Supplier.countDocuments(query)

    // Transform data for frontend
    const transformedSuppliers = suppliers.map(supplier => ({
      _id: supplier._id,
      supplierCode: supplier.supplierCode,
      companyName: supplier.supplierName || supplier.displayName,
      category: supplier.productCategories?.[0]?.category || 'services',
      status: supplier.isActive ? 'active' : 'inactive',
      email: supplier.contactInfo?.primaryEmail,
      phone: supplier.contactInfo?.primaryPhone,
      website: supplier.businessInfo?.website,
      address: supplier.addresses?.[0] ? {
        street: supplier.addresses[0].addressLine1,
        city: supplier.addresses[0].city,
        state: supplier.addresses[0].state,
        pincode: supplier.addresses[0].pincode,
        country: supplier.addresses[0].country
      } : null,
      contactPerson: supplier.contactPersons?.[0] ? {
        name: supplier.contactPersons[0].name,
        designation: supplier.contactPersons[0].designation,
        email: supplier.contactPersons[0].email,
        phone: supplier.contactPersons[0].phone
      } : null,
      businessDetails: supplier.registrationDetails ? {
        gstin: supplier.registrationDetails.gstin,
        pan: supplier.registrationDetails.pan,
        industry: supplier.businessInfo?.industry,
        website: supplier.businessInfo?.website
      } : null,
      rating: supplier.quality?.qualityRating || 0,
      totalOrders: 0, // Will be calculated from purchase orders
      totalSpend: 0, // Will be calculated from purchase orders
      lastOrderDate: null, // Will be calculated from purchase orders
      onTimeDelivery: supplier.supplyHistory?.onTimeDeliveryRate || 0,
      qualityScore: supplier.quality?.qualityRating || 0,
      leadTime: supplier.productCategories?.[0]?.leadTime || 0,
      paymentTerms: supplier.financialInfo?.paymentTerms,
      creditLimit: supplier.financialInfo?.creditDays || 0,
      companyId: supplier.companyId,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt
    }))

    res.json({
      success: true,
      data: transformedSuppliers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })

  } catch (error) {
    console.error('Get suppliers error:', error)
    res.status(500).json({
      error: 'Failed to fetch suppliers',
      message: 'An error occurred while fetching suppliers'
    })
  }
})

// =============================================
// GET SUPPLIER STATISTICS
// =============================================
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const companyId = user.isSuperAdmin ? req.query.companyId || user.companyId : user.companyId

    // Get supplier statistics using aggregation

    const stats = await Supplier.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalSuppliers: { $sum: 1 },
          activeSuppliers: { $sum: { $cond: ['$isActive', 1, 0] } },
          averageRating: { $avg: '$quality.qualityRating' },
          averageOnTimeDelivery: { $avg: '$supplyHistory.onTimeDeliveryRate' }
        }
      }
    ])

    const result = stats[0] || {
      totalSuppliers: 0,
      activeSuppliers: 0,
      averageRating: 0,
      averageOnTimeDelivery: 0
    }

    res.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Get supplier stats error:', error)
    res.status(500).json({
      error: 'Failed to fetch supplier statistics',
      message: 'An error occurred while fetching supplier statistics'
    })
  }
})

// =============================================
// GET SUPPLIER BY ID
// =============================================
router.get('/:supplierId', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { supplierId } = req.params
    const companyId = user.isSuperAdmin ? req.query.companyId || user.companyId : user.companyId

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({
        error: 'Invalid supplier ID',
        message: 'The provided supplier ID is not valid'
      })
    }

    // Get supplier from database
    const supplier = await Supplier.findOne({
      _id: new mongoose.Types.ObjectId(supplierId),
      companyId: new mongoose.Types.ObjectId(companyId),
      isActive: true
    }).lean()

    if (!supplier) {
      return res.status(404).json({
        error: 'Supplier not found',
        message: 'The requested supplier was not found'
      })
    }

    res.json({
      success: true,
      data: supplier
    })

  } catch (error) {
    console.error('Get supplier by ID error:', error)
    res.status(500).json({
      error: 'Failed to fetch supplier',
      message: 'An error occurred while fetching supplier details'
    })
  }
})

// =============================================
// CREATE NEW SUPPLIER
// =============================================
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const supplierData = req.body

    // Check permissions
    if (!user.isSuperAdmin && !user.companyAccess?.some((access: any) => 
      access.permissions?.suppliers?.create && access.isActive
    )) {
      return res.status(403).json({
        error: 'Permission denied',
        message: 'You do not have permission to create suppliers'
      })
    }

    // Generate new supplier (mock implementation)
    const newSupplier = {
      _id: `supplier_${user.companyId}_${Date.now()}`,
      supplierCode: `SUP-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
      ...supplierData,
      companyId: user.companyId,
      status: 'pending',
      rating: 0,
      totalOrders: 0,
      totalSpend: 0,
      onTimeDelivery: 0,
      qualityScore: 0,
      leadTime: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    res.status(201).json({
      success: true,
      data: newSupplier,
      message: 'Supplier created successfully'
    })

  } catch (error) {
    console.error('Create supplier error:', error)
    res.status(500).json({
      error: 'Failed to create supplier',
      message: 'An error occurred while creating the supplier'
    })
  }
})

// =============================================
// UPDATE SUPPLIER
// =============================================
router.put('/:supplierId', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { supplierId } = req.params
    const updateData = req.body

    // Check permissions
    if (!user.isSuperAdmin && !user.companyAccess?.some((access: any) => 
      access.permissions?.suppliers?.edit && access.isActive
    )) {
      return res.status(403).json({
        error: 'Permission denied',
        message: 'You do not have permission to update suppliers'
      })
    }

    // Mock update (in real implementation, this would update the database)
    const updatedSupplier = {
      _id: supplierId,
      ...updateData,
      updatedAt: new Date(),
      updatedBy: user.username
    }

    res.json({
      success: true,
      data: updatedSupplier,
      message: 'Supplier updated successfully'
    })

  } catch (error) {
    console.error('Update supplier error:', error)
    res.status(500).json({
      error: 'Failed to update supplier',
      message: 'An error occurred while updating the supplier'
    })
  }
})

// =============================================
// DELETE SUPPLIER
// =============================================
router.delete('/:supplierId', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { supplierId } = req.params

    // Check permissions
    if (!user.isSuperAdmin && !user.companyAccess?.some((access: any) => 
      access.permissions?.suppliers?.delete && access.isActive
    )) {
      return res.status(403).json({
        error: 'Permission denied',
        message: 'You do not have permission to delete suppliers'
      })
    }

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    })

  } catch (error) {
    console.error('Delete supplier error:', error)
    res.status(500).json({
      error: 'Failed to delete supplier',
      message: 'An error occurred while deleting the supplier'
    })
  }
})

export default router
