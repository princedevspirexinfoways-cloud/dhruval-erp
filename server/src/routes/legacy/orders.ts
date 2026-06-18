import { Router, Request, Response } from 'express'
import { authenticate } from '@/middleware/auth'
import CustomerOrder from '@/models/CustomerOrder'
import Customer from '@/models/Customer'
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
      priority = 'all',
      dateFrom = '',
      dateTo = ''
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
        { orderNumber: { $regex: searchTerm, $options: 'i' } },
        { 'customerInfo.name': { $regex: searchTerm, $options: 'i' } },
        { 'customerInfo.email': { $regex: searchTerm, $options: 'i' } }
      ]
    }

    // Add status filter
    if (status !== 'all') {
      query.status = status
    }

    // Add priority filter
    if (priority !== 'all') {
      query.priority = priority
    }

    // Add date filters
    if (dateFrom || dateTo) {
      query.orderDate = {}
      if (dateFrom) {
        query.orderDate.$gte = new Date(dateFrom as string)
      }
      if (dateTo) {
        query.orderDate.$lte = new Date(dateTo as string)
      }
    }

    // Get orders with pagination
    const orders = await CustomerOrder.find(query)
      .populate('customerId', 'customerCode name companyName')
      .populate('companyId', 'companyName companyCode')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean()

    // Get total count for pagination
    const total = await CustomerOrder.countDocuments(query)

    // Transform data for frontend
    const transformedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      customerName: order.customerName || (order.customerId as any)?.customerName || (order.customerId as any)?.displayName,
      customerEmail: (order.customerId as any)?.contactInfo?.primaryEmail,
      customerPhone: (order.customerId as any)?.contactInfo?.primaryPhone,
      status: order.status,
      priority: order.priority || 'medium',
      orderDate: order.orderDate,
      deliveryDate: order.delivery?.expectedDeliveryDate,
      totalAmount: order.orderSummary?.finalAmount || order.orderSummary?.totalAmount,
      items: order.orderItems?.length || 0,
      companyId: order.companyId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }))

    res.json({
      success: true,
      data: transformedOrders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })

  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({
      error: 'Failed to fetch orders',
      message: 'An error occurred while fetching orders'
    })
  }
})

// =============================================
// GET ORDER STATISTICS
// =============================================
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const companyId = user.isSuperAdmin ? req.query.companyId || user.companyId : user.companyId

    // Get order statistics using aggregation

    const stats = await CustomerOrder.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
          processingOrders: { $sum: { $cond: [{ $eq: ['$status', 'in_production'] }, 1, 0] } },
          shippedOrders: { $sum: { $cond: [{ $eq: ['$status', 'dispatched'] }, 1, 0] } },
          deliveredOrders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          totalRevenue: { $sum: '$orderSummary.finalAmount' },
          highPriorityOrders: {
            $sum: {
              $cond: [
                { $in: ['$priority', ['high', 'urgent', 'rush']] },
                1,
                0
              ]
            }
          }
        }
      }
    ])

    const result = stats[0] || {
      totalOrders: 0,
      pendingOrders: 0,
      processingOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      highPriorityOrders: 0
    }

    const finalStats = {
      ...result,
      averageOrderValue: result.totalOrders > 0 ? Math.round(result.totalRevenue / result.totalOrders) : 0
    }

    res.json({
      success: true,
      data: finalStats
    })

  } catch (error) {
    console.error('Get order stats error:', error)
    res.status(500).json({
      error: 'Failed to fetch order statistics',
      message: 'An error occurred while fetching order statistics'
    })
  }
})

// =============================================
// GET ORDER BY ID
// =============================================
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { orderId } = req.params
    const companyId = user.isSuperAdmin ? req.query.companyId || user.companyId : user.companyId

    // Generate mock orders and find the requested one
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        error: 'Invalid order ID',
        message: 'The provided order ID is not valid'
      })
    }

    // Get order from database
    const order = await CustomerOrder.findOne({
      _id: new mongoose.Types.ObjectId(orderId),
      companyId: new mongoose.Types.ObjectId(companyId),
      isActive: true
    })
    .populate('customerId', 'customerName displayName contactInfo')
    .lean()

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'The requested order was not found'
      })
    }

    // Add detailed information for single order view
    const detailedOrder = {
      ...order,
      items: [
        {
          id: 1,
          productName: 'Premium Cotton Fabric',
          sku: 'PCF-001',
          quantity: 100,
          unitPrice: 250,
          totalPrice: 25000
        },
        {
          id: 2,
          productName: 'Silk Blend Material',
          sku: 'SBM-002',
          quantity: 50,
          unitPrice: 450,
          totalPrice: 22500
        }
      ],
      shippingAddress: {
        street: '123 Industrial Area',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India'
      },
      billingAddress: {
        street: '123 Industrial Area',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India'
      },
      paymentInfo: {
        method: 'Bank Transfer',
        status: 'Paid',
        transactionId: 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase()
      },
      timeline: [
        {
          status: 'Order Placed',
          date: order.orderDate,
          description: 'Order has been placed successfully'
        },
        {
          status: 'Payment Confirmed',
          date: new Date(order.orderDate.getTime() + 2 * 60 * 60 * 1000),
          description: 'Payment has been confirmed'
        },
        {
          status: 'Processing',
          date: new Date(order.orderDate.getTime() + 24 * 60 * 60 * 1000),
          description: 'Order is being processed'
        }
      ]
    }

    res.json({
      success: true,
      data: detailedOrder
    })

  } catch (error) {
    console.error('Get order by ID error:', error)
    res.status(500).json({
      error: 'Failed to fetch order',
      message: 'An error occurred while fetching order details'
    })
  }
})

// =============================================
// CREATE NEW ORDER
// =============================================
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const orderData = req.body

    // Check permissions
    if (!user.isSuperAdmin && !user.companyAccess?.some((access: any) => 
      access.permissions?.orders?.create && access.isActive
    )) {
      return res.status(403).json({
        error: 'Permission denied',
        message: 'You do not have permission to create orders'
      })
    }

    // Generate new order (mock implementation)
    const newOrder = {
      _id: `order_${user.companyId}_${Date.now()}`,
      orderNumber: `ORD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
      ...orderData,
      companyId: user.companyId,
      status: 'pending',
      orderDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    res.status(201).json({
      success: true,
      data: newOrder,
      message: 'Order created successfully'
    })

  } catch (error) {
    console.error('Create order error:', error)
    res.status(500).json({
      error: 'Failed to create order',
      message: 'An error occurred while creating the order'
    })
  }
})

// =============================================
// UPDATE ORDER STATUS
// =============================================
router.patch('/:orderId/status', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { orderId } = req.params
    const { status, notes } = req.body

    // Check permissions
    if (!user.isSuperAdmin && !user.companyAccess?.some((access: any) => 
      access.permissions?.orders?.edit && access.isActive
    )) {
      return res.status(403).json({
        error: 'Permission denied',
        message: 'You do not have permission to update orders'
      })
    }

    // Mock update (in real implementation, this would update the database)
    const updatedOrder = {
      _id: orderId,
      status,
      notes,
      updatedAt: new Date(),
      updatedBy: user.username
    }

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Order status updated successfully'
    })

  } catch (error) {
    console.error('Update order status error:', error)
    res.status(500).json({
      error: 'Failed to update order status',
      message: 'An error occurred while updating the order status'
    })
  }
})

export default router
