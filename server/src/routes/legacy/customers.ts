import { Router, Request, Response } from 'express'
import { authenticate } from '@/middleware/auth'
import Customer from '@/models/Customer'
import mongoose from 'mongoose'

const router = Router()

// Apply authentication middleware
router.use(authenticate)

// =============================================
// GET ALL CUSTOMERS (Real Database Query)
// =============================================
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = 'all', 
      type = 'all'
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
        { customerCode: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } },
        { companyName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { 'contactPersons.name': { $regex: searchTerm, $options: 'i' } },
        { 'contactPersons.email': { $regex: searchTerm, $options: 'i' } }
      ]
    }

    // Add status filter
    if (status !== 'all') {
      query.status = status
    }

    // Add type filter
    if (type !== 'all') {
      query.customerType = type
    }

    // Get customers with pagination
    const customers = await Customer.find(query)
      .populate('companyId', 'companyName companyCode')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean()

    // Get total count for pagination
    const total = await Customer.countDocuments(query)

    // Transform data for frontend
    const transformedCustomers = customers.map(customer => ({
      _id: customer._id,
      customerCode: customer.customerCode,
      name: customer.customerName,
      companyName: customer.legalName || customer.displayName,
      type: customer.relationship?.customerType || 'prospect',
      status: customer.compliance?.kycStatus || 'pending',
      email: customer.contactInfo?.primaryEmail,
      phone: customer.contactInfo?.primaryPhone,
      address: customer.addresses?.[0] ? {
        street: customer.addresses[0].addressLine1,
        city: customer.addresses[0].city,
        state: customer.addresses[0].state,
        pincode: customer.addresses[0].pincode,
        country: customer.addresses[0].country
      } : null,
      contactPerson: customer.contactPersons?.[0] ? {
        name: customer.contactPersons[0].name,
        designation: customer.contactPersons[0].designation,
        email: customer.contactPersons[0].email,
        phone: customer.contactPersons[0].phone
      } : null,
      totalOrders: customer.purchaseHistory?.totalOrders || 0,
      totalRevenue: customer.purchaseHistory?.totalOrderValue || 0,
      creditLimit: customer.financialInfo?.creditLimit || 0,
      paymentTerms: customer.financialInfo?.paymentTerms || 'Net 30',
      companyId: customer.companyId,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    }))

    res.json({
      success: true,
      data: transformedCustomers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })

  } catch (error) {
    console.error('Get customers error:', error)
    res.status(500).json({
      error: 'Failed to fetch customers',
      message: 'An error occurred while fetching customers'
    })
  }
})

// =============================================
// GET CUSTOMER STATISTICS (Real Database Query)
// =============================================
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const companyId = user.isSuperAdmin ? req.query.companyId || user.companyId : user.companyId

    // Get customer statistics using aggregation
    const stats = await Customer.aggregate([
      { 
        $match: { 
          companyId: new mongoose.Types.ObjectId(companyId),
          isActive: true 
        } 
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          activeCustomers: { 
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } 
          },
          inactiveCustomers: { 
            $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } 
          },
          pendingCustomers: { 
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } 
          },
          corporateCustomers: { 
            $sum: { $cond: [{ $eq: ['$customerType', 'corporate'] }, 1, 0] } 
          },
          individualCustomers: { 
            $sum: { $cond: [{ $eq: ['$customerType', 'individual'] }, 1, 0] } 
          },
          governmentCustomers: { 
            $sum: { $cond: [{ $eq: ['$customerType', 'government'] }, 1, 0] } 
          },
          totalCreditLimit: { $sum: '$creditLimit' }
        }
      }
    ])

    // Get new customers this month
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const newCustomersThisMonth = await Customer.countDocuments({
      companyId: new mongoose.Types.ObjectId(companyId),
      isActive: true,
      createdAt: { $gte: thisMonth }
    })

    const result = stats[0] || {
      totalCustomers: 0,
      activeCustomers: 0,
      inactiveCustomers: 0,
      pendingCustomers: 0,
      corporateCustomers: 0,
      individualCustomers: 0,
      governmentCustomers: 0,
      totalCreditLimit: 0
    }

    res.json({
      success: true,
      data: {
        ...result,
        newCustomersThisMonth,
        totalOrders: 0, // Will be from orders collection
        totalRevenue: 0, // Will be from orders collection
        averageOrderValue: 0 // Will be calculated
      }
    })

  } catch (error) {
    console.error('Get customer stats error:', error)
    res.status(500).json({
      error: 'Failed to fetch customer statistics',
      message: 'An error occurred while fetching customer statistics'
    })
  }
})

// =============================================
// CREATE NEW CUSTOMER (Real Database Insert)
// =============================================
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const customerData = req.body

    // Create new customer
    const newCustomer = new Customer({
      ...customerData,
      companyId: user.companyId,
      createdBy: user.userId,
      isActive: true
    })

    await newCustomer.save()

    res.status(201).json({
      success: true,
      data: newCustomer,
      message: 'Customer created successfully'
    })

  } catch (error) {
    console.error('Create customer error:', error)
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message
      })
    }

    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Duplicate customer',
        message: 'A customer with this code already exists'
      })
    }

    res.status(500).json({
      error: 'Failed to create customer',
      message: 'An error occurred while creating the customer'
    })
  }
})

// =============================================
// UPDATE CUSTOMER (Real Database Update)
// =============================================
router.put('/:customerId', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { customerId } = req.params
    const updateData = req.body

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        error: 'Invalid customer ID',
        message: 'The provided customer ID is not valid'
      })
    }

    // Build query with company access control
    let query: any = { 
      _id: new mongoose.Types.ObjectId(customerId),
      isActive: true 
    }

    if (!user.isSuperAdmin) {
      query.companyId = new mongoose.Types.ObjectId(user.companyId)
    }

    const updatedCustomer = await Customer.findOneAndUpdate(
      query,
      { 
        ...updateData, 
        updatedBy: user.userId,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )

    if (!updatedCustomer) {
      return res.status(404).json({
        error: 'Customer not found',
        message: 'The requested customer was not found or you do not have access to it'
      })
    }

    res.json({
      success: true,
      data: updatedCustomer,
      message: 'Customer updated successfully'
    })

  } catch (error) {
    console.error('Update customer error:', error)
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message
      })
    }

    res.status(500).json({
      error: 'Failed to update customer',
      message: 'An error occurred while updating the customer'
    })
  }
})

// =============================================
// DELETE CUSTOMER (Real Database Delete)
// =============================================
router.delete('/:customerId', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { customerId } = req.params

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        error: 'Invalid customer ID',
        message: 'The provided customer ID is not valid'
      })
    }

    // Build query with company access control
    let query: any = { 
      _id: new mongoose.Types.ObjectId(customerId),
      isActive: true 
    }

    if (!user.isSuperAdmin) {
      query.companyId = new mongoose.Types.ObjectId(user.companyId)
    }

    // Soft delete by setting isActive to false
    const deletedCustomer = await Customer.findOneAndUpdate(
      query,
      { 
        isActive: false,
        updatedBy: user.userId,
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!deletedCustomer) {
      return res.status(404).json({
        error: 'Customer not found',
        message: 'The requested customer was not found or you do not have access to it'
      })
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    })

  } catch (error) {
    console.error('Delete customer error:', error)
    res.status(500).json({
      error: 'Failed to delete customer',
      message: 'An error occurred while deleting the customer'
    })
  }
})

export default router
