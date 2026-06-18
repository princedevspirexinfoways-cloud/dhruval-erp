import { Router, Request, Response } from 'express'
import { authenticate } from '@/middleware/auth'
import Warehouse from '@/models/Warehouse'
import InventoryItem from '@/models/InventoryItem'
import mongoose from 'mongoose'

const router = Router()

// Apply authentication middleware
router.use(authenticate)

// =============================================
// GET ALL WAREHOUSES (Real Database Query)
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

    // Get company ID - for superadmin, show all warehouses if no specific company requested
    let query: any = { isActive: true }

    if (user.isSuperAdmin) {
      // If superadmin provides a specific companyId, filter by it
      if (req.query.companyId) {
        query.companyId = new mongoose.Types.ObjectId(req.query.companyId as string)
      }
      // If no companyId provided, show all warehouses (no companyId filter)
    } else {
      // Regular users can only see their company's warehouses
      if (!user.companyId) {
        return res.status(400).json({
          error: 'Company ID required',
          message: 'X-Company-ID header is required'
        })
      }
      query.companyId = new mongoose.Types.ObjectId(user.companyId)
    }

    // Add search filter
    if (searchTerm) {
      query.$or = [
        { warehouseCode: { $regex: searchTerm, $options: 'i' } },
        { warehouseName: { $regex: searchTerm, $options: 'i' } },
        { 'address.city': { $regex: searchTerm, $options: 'i' } },
        { 'address.state': { $regex: searchTerm, $options: 'i' } }
      ]
    }

    // Add status filter
    if (status !== 'all') {
      query.status = status
    }

    // Add type filter
    if (type !== 'all') {
      query.warehouseType = type
    }

    // Get warehouses with pagination
    const warehouses = await Warehouse.find(query)
      .populate('companyId', 'companyName companyCode')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean()

    // Get total count for pagination
    const total = await Warehouse.countDocuments(query)

    // Get item counts for each warehouse
    const warehouseIds = warehouses.map(w => w._id)
    const itemCounts = await InventoryItem.aggregate([
      {
        $match: {
          'locations.warehouseId': { $in: warehouseIds },
          isActive: true
        }
      },
      { $unwind: '$locations' },
      {
        $match: {
          'locations.warehouseId': { $in: warehouseIds }
        }
      },
      {
        $group: {
          _id: '$locations.warehouseId',
          itemCount: { $sum: 1 }
        }
      }
    ])

    const itemCountMap = itemCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.itemCount
      return acc
    }, {} as { [key: string]: number })

    // Transform data for frontend
    const transformedWarehouses = warehouses.map(warehouse => ({
      _id: warehouse._id,
      warehouseCode: warehouse.warehouseCode,
      warehouseName: warehouse.warehouseName,
      warehouseType: warehouse.warehouseType,
      status: warehouse.isActive ? 'active' : 'inactive',
      address: warehouse.address,
      capacity: warehouse.capacity || {
        totalCapacity: 0,
        availableCapacity: 0,
        utilizationPercentage: 0,
        unit: 'sqft'
      },
      manager: (warehouse as any).manager,
      operatingHours: (warehouse as any).operatingHours,
      facilities: (warehouse as any).facilities || [],
      itemCount: itemCountMap[warehouse._id.toString()] || 0,
      companyId: warehouse.companyId,
      createdAt: warehouse.createdAt,
      updatedAt: warehouse.updatedAt
    }))

    res.json({
      success: true,
      data: transformedWarehouses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })

  } catch (error) {
    console.error('Get warehouses error:', error)
    res.status(500).json({
      error: 'Failed to fetch warehouses',
      message: 'An error occurred while fetching warehouses'
    })
  }
})

// =============================================
// GET WAREHOUSE STATISTICS (Real Database Query)
// =============================================
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user

    // Build match query for aggregation
    let matchQuery: any = { isActive: true }

    if (user.isSuperAdmin) {
      // If superadmin provides a specific companyId, filter by it
      if (req.query.companyId) {
        matchQuery.companyId = new mongoose.Types.ObjectId(req.query.companyId as string)
      }
      // If no companyId provided, show stats for all warehouses
    } else {
      // Regular users can only see their company's warehouse stats
      if (!user.companyId) {
        return res.status(400).json({
          error: 'Company ID required',
          message: 'X-Company-ID header is required'
        })
      }
      matchQuery.companyId = new mongoose.Types.ObjectId(user.companyId)
    }

    // Get warehouse statistics using aggregation
    const stats = await Warehouse.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalWarehouses: { $sum: 1 },
          activeWarehouses: { $sum: { $cond: ['$isActive', 1, 0] } },
          totalCapacity: { $sum: '$capacity.totalCapacity' },
          totalUtilizedCapacity: { $sum: '$capacity.utilizedCapacity' }
        }
      }
    ])

    // Get warehouse type distribution
    const typeStats = await Warehouse.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$warehouseType',
          count: { $sum: 1 }
        }
      }
    ])

    // Get top warehouses by utilization
    const topWarehouses = await Warehouse.find(matchQuery)
    .select('warehouseName capacity')
    .sort({ 'capacity.utilizationPercentage': -1 })
    .limit(5)
    .lean()

    const result = stats[0] || {
      totalWarehouses: 0,
      activeWarehouses: 0,
      totalCapacity: 0,
      totalUtilizedCapacity: 0
    }

    const averageUtilization = result.totalCapacity > 0 
      ? Math.round((result.totalUtilizedCapacity / result.totalCapacity) * 100)
      : 0

    res.json({
      success: true,
      data: {
        ...result,
        inactiveWarehouses: result.totalWarehouses - result.activeWarehouses,
        maintenanceWarehouses: 0, // Will be calculated when maintenance status is implemented
        averageUtilization,
        warehousesByType: typeStats.reduce((acc, item) => {
          acc[item._id] = item.count
          return acc
        }, {} as { [key: string]: number }),
        warehousesByStatus: {
          active: result.activeWarehouses,
          inactive: result.totalWarehouses - result.activeWarehouses
        },
        topWarehouses: topWarehouses.map(w => ({
          _id: w._id,
          warehouseName: w.warehouseName,
          utilizationPercentage: (w.capacity as any)?.utilizationPercentage || 0,
          itemCount: 0 // Will be calculated from inventory
        }))
      }
    })

  } catch (error) {
    console.error('Get warehouse stats error:', error)
    res.status(500).json({
      error: 'Failed to fetch warehouse statistics',
      message: 'An error occurred while fetching warehouse statistics'
    })
  }
})

// =============================================
// CREATE NEW WAREHOUSE (Real Database Insert)
// =============================================
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const warehouseData = req.body

    // Determine company ID
    let companyId = user.companyId
    if (user.isSuperAdmin) {
      // For superadmin, use the companyId from request body or query
      companyId = warehouseData.companyId || req.query.companyId || user.companyId
      if (!companyId) {
        return res.status(400).json({
          error: 'Company ID required',
          message: 'Company ID is required for warehouse creation'
        })
      }
    } else if (!companyId) {
      return res.status(400).json({
        error: 'Company ID required',
        message: 'X-Company-ID header is required'
      })
    }

    // Create new warehouse
    const newWarehouse = new Warehouse({
      ...warehouseData,
      companyId,
      createdBy: user.userId,
      isActive: true
    })

    await newWarehouse.save()

    res.status(201).json({
      success: true,
      data: newWarehouse,
      message: 'Warehouse created successfully'
    })

  } catch (error) {
    console.error('Create warehouse error:', error)
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message
      })
    }

    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Duplicate warehouse',
        message: 'A warehouse with this code already exists'
      })
    }

    res.status(500).json({
      error: 'Failed to create warehouse',
      message: 'An error occurred while creating the warehouse'
    })
  }
})

// =============================================
// UPDATE WAREHOUSE (Real Database Update)
// =============================================
router.put('/:warehouseId', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { warehouseId } = req.params
    const updateData = req.body

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(warehouseId)) {
      return res.status(400).json({
        error: 'Invalid warehouse ID',
        message: 'The provided warehouse ID is not valid'
      })
    }

    // Build query with company access control
    let query: any = { 
      _id: new mongoose.Types.ObjectId(warehouseId),
      isActive: true 
    }

    if (!user.isSuperAdmin) {
      query.companyId = new mongoose.Types.ObjectId(user.companyId)
    }

    const updatedWarehouse = await Warehouse.findOneAndUpdate(
      query,
      { 
        ...updateData, 
        updatedBy: user.userId,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )

    if (!updatedWarehouse) {
      return res.status(404).json({
        error: 'Warehouse not found',
        message: 'The requested warehouse was not found or you do not have access to it'
      })
    }

    res.json({
      success: true,
      data: updatedWarehouse,
      message: 'Warehouse updated successfully'
    })

  } catch (error) {
    console.error('Update warehouse error:', error)
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message
      })
    }

    res.status(500).json({
      error: 'Failed to update warehouse',
      message: 'An error occurred while updating the warehouse'
    })
  }
})

// =============================================
// DELETE WAREHOUSE (Real Database Delete)
// =============================================
router.delete('/:warehouseId', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { warehouseId } = req.params

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(warehouseId)) {
      return res.status(400).json({
        error: 'Invalid warehouse ID',
        message: 'The provided warehouse ID is not valid'
      })
    }

    // Check if warehouse has inventory
    const hasInventory = await InventoryItem.countDocuments({
      'locations.warehouseId': new mongoose.Types.ObjectId(warehouseId),
      isActive: true
    })

    if (hasInventory > 0) {
      return res.status(400).json({
        error: 'Warehouse has inventory',
        message: `Cannot delete warehouse as it contains ${hasInventory} inventory items`
      })
    }

    // Build query with company access control
    let query: any = { 
      _id: new mongoose.Types.ObjectId(warehouseId),
      isActive: true 
    }

    if (!user.isSuperAdmin) {
      query.companyId = new mongoose.Types.ObjectId(user.companyId)
    }

    // Soft delete by setting isActive to false
    const deletedWarehouse = await Warehouse.findOneAndUpdate(
      query,
      { 
        isActive: false,
        updatedBy: user.userId,
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!deletedWarehouse) {
      return res.status(404).json({
        error: 'Warehouse not found',
        message: 'The requested warehouse was not found or you do not have access to it'
      })
    }

    res.json({
      success: true,
      message: 'Warehouse deleted successfully'
    })

  } catch (error) {
    console.error('Delete warehouse error:', error)
    res.status(500).json({
      error: 'Failed to delete warehouse',
      message: 'An error occurred while deleting the warehouse'
    })
  }
})

export default router
