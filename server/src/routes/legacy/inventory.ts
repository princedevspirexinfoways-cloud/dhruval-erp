import { Router, Request, Response } from 'express'
import { authenticate } from '@/middleware/auth'
import InventoryItem from '@/models/InventoryItem'
import StockMovement from '@/models/StockMovement'
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
      category = 'all',
      status = 'all',
      sortBy = 'itemName',
      sortOrder = 'asc'
    } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const searchTerm = search as string

    const companyId = user.isSuperAdmin ? req.query.companyId || user.companyId : user.companyId

    // Build query
    let query: any = {
      companyId: new mongoose.Types.ObjectId(companyId),
      isActive: true
    }

    // Add search filter
    if (searchTerm) {
      query.$or = [
        { itemCode: { $regex: searchTerm, $options: 'i' } },
        { itemName: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    }

    // Add category filter
    if (category !== 'all') {
      query.category = category
    }

    // Add status filter (based on stock levels)
    let stockFilter: any = {}
    if (status === 'low_stock') {
      stockFilter = { $expr: { $lte: ['$currentStock', '$minStock'] } }
    } else if (status === 'overstock') {
      stockFilter = { $expr: { $gte: ['$currentStock', { $multiply: ['$maxStock', 0.9] }] } }
    } else if (status === 'normal') {
      stockFilter = {
        $expr: {
          $and: [
            { $gt: ['$currentStock', '$minStock'] },
            { $lt: ['$currentStock', { $multiply: ['$maxStock', 0.9] }] }
          ]
        }
      }
    }

    if (Object.keys(stockFilter).length > 0) {
      query = { ...query, ...stockFilter }
    }

    // Build sort object
    const sortObj: any = {}
    sortObj[sortBy as string] = sortOrder === 'desc' ? -1 : 1

    // Get inventory items with pagination
    const items = await InventoryItem.find(query)
      .populate('companyId', 'companyName companyCode')
      .sort(sortObj)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean()

    // Get total count for pagination
    const total = await InventoryItem.countDocuments(query)

    // Transform data for frontend
    const transformedItems = items.map(item => {
      const currentStock = item.stock?.currentStock || 0
      const minStock = item.stock?.minStockLevel || 0
      const maxStock = item.stock?.maxStockLevel || 0
      const unitPrice = item.pricing?.costPrice || 0

      let status = 'normal'
      if (currentStock <= minStock) {
        status = 'low_stock'
      } else if (currentStock >= maxStock * 0.9) {
        status = 'overstock'
      }

      return {
        _id: item._id,
        itemCode: item.itemCode,
        itemName: item.itemName,
        category: item.category?.primary || 'raw_material',
        description: item.itemDescription,
        currentStock,
        minStock,
        maxStock,
        unit: item.stock?.unit,
        unitPrice,
        totalValue: item.stock?.totalValue || (currentStock * unitPrice),
        supplier: item.suppliers?.[0]?.supplierName || 'Unknown',
        location: item.locations?.[0]?.warehouseId || 'Not specified',
        lastUpdated: item.updatedAt,
        status,
        companyId: item.companyId,
        createdAt: item.createdAt
      }
    })

    res.json({
      success: true,
      data: transformedItems,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })

  } catch (error) {
    console.error('Get inventory error:', error)
    res.status(500).json({
      error: 'Failed to fetch inventory',
      message: 'An error occurred while fetching inventory items'
    })
  }
})

// =============================================
// GET INVENTORY STATISTICS
// =============================================
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const companyId = user.isSuperAdmin ? req.query.companyId || user.companyId : user.companyId

    // Get inventory statistics using aggregation
    const stats = await InventoryItem.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          isActive: true
        }
      },
      {
        $addFields: {
          stockStatus: {
            $cond: {
              if: { $lte: ['$stock.currentStock', '$stock.minStockLevel'] },
              then: 'low_stock',
              else: {
                $cond: {
                  if: { $gte: ['$stock.currentStock', { $multiply: ['$stock.maxStockLevel', 0.9] }] },
                  then: 'overstock',
                  else: 'normal'
                }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          lowStockItems: { $sum: { $cond: [{ $eq: ['$stockStatus', 'low_stock'] }, 1, 0] } },
          overstockItems: { $sum: { $cond: [{ $eq: ['$stockStatus', 'overstock'] }, 1, 0] } },
          normalStockItems: { $sum: { $cond: [{ $eq: ['$stockStatus', 'normal'] }, 1, 0] } },
          totalValue: { $sum: '$stock.totalValue' }
        }
      }
    ])

    const result = stats[0] || {
      totalItems: 0,
      lowStockItems: 0,
      overstockItems: 0,
      normalStockItems: 0,
      totalValue: 0
    }

    res.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Get inventory stats error:', error)
    res.status(500).json({
      error: 'Failed to fetch inventory statistics',
      message: 'An error occurred while fetching inventory statistics'
    })
  }
})

// =============================================
// GET LOW STOCK ALERTS
// =============================================
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const companyId = user.isSuperAdmin ? req.query.companyId || user.companyId : user.companyId

    // Get low stock items from database
    const lowStockItems = await InventoryItem.find({
      companyId: new mongoose.Types.ObjectId(companyId),
      isActive: true,
      $expr: { $lte: ['$stock.currentStock', '$stock.minStockLevel'] }
    })
    .populate('companyId', 'companyName companyCode')
    .sort({ 'stock.currentStock': 1 })
    .lean()

    const alerts = lowStockItems.map(item => ({
      _id: item._id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      currentStock: item.stock?.currentStock || 0,
      minStock: item.stock?.minStockLevel || 0,
      shortage: (item.stock?.minStockLevel || 0) - (item.stock?.currentStock || 0),
      category: item.category?.primary || 'unknown',
      supplier: item.suppliers?.[0]?.supplierName || 'Unknown',
      urgency: (item.stock?.currentStock || 0) <= (item.stock?.minStockLevel || 0) * 0.5 ? 'critical' : 'warning',
      lastUpdated: item.updatedAt
    }))

    res.json({
      success: true,
      data: alerts,
      total: alerts.length
    })

  } catch (error) {
    console.error('Get inventory alerts error:', error)
    res.status(500).json({
      error: 'Failed to fetch inventory alerts',
      message: 'An error occurred while fetching inventory alerts'
    })
  }
})

// =============================================
// GET INVENTORY ITEM BY ID
// =============================================
router.get('/:itemId', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { itemId } = req.params
    const companyId = user.isSuperAdmin ? req.query.companyId || user.companyId : user.companyId

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        error: 'Invalid item ID',
        message: 'The provided item ID is not valid'
      })
    }

    // Get item from database
    const item = await InventoryItem.findOne({
      _id: new mongoose.Types.ObjectId(itemId),
      companyId: new mongoose.Types.ObjectId(companyId),
      isActive: true
    }).lean()

    if (!item) {
      return res.status(404).json({
        error: 'Item not found',
        message: 'The requested inventory item was not found'
      })
    }

    // Transform data for frontend
    const detailedItem = {
      _id: item._id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      category: item.category?.primary || 'unknown',
      description: item.itemDescription,
      currentStock: item.stock?.currentStock || 0,
      minStock: item.stock?.minStockLevel || 0,
      maxStock: item.stock?.maxStockLevel || 0,
      unit: item.stock?.unit,
      unitPrice: item.pricing?.costPrice || 0,
      totalValue: item.stock?.totalValue || 0,
      suppliers: item.suppliers?.map(supplier => ({
        name: supplier.supplierName,
        leadTime: supplier.leadTime,
        minOrderQty: supplier.minOrderQuantity
      })) || [],
      locations: item.locations?.map(location => ({
        warehouse: location.warehouseId,
        rack: location.rack,
        quantity: location.quantity
      })) || [],
      movements: [], // Will be populated from StockMovement collection
      companyId: item.companyId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }

    res.json({
      success: true,
      data: detailedItem
    })

  } catch (error) {
    console.error('Get inventory item error:', error)
    res.status(500).json({
      error: 'Failed to fetch inventory item',
      message: 'An error occurred while fetching inventory item details'
    })
  }
})

// =============================================
// UPDATE INVENTORY ITEM
// =============================================
router.put('/:itemId', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { itemId } = req.params
    const updateData = req.body

    // Check permissions
    if (!user.isSuperAdmin && !user.companyAccess?.some((access: any) => 
      access.permissions?.inventory?.edit && access.isActive
    )) {
      return res.status(403).json({
        error: 'Permission denied',
        message: 'You do not have permission to update inventory items'
      })
    }

    // Mock update (in real implementation, this would update the database)
    const updatedItem = {
      _id: itemId,
      ...updateData,
      lastUpdated: new Date(),
      updatedBy: user.username
    }

    res.json({
      success: true,
      data: updatedItem,
      message: 'Inventory item updated successfully'
    })

  } catch (error) {
    console.error('Update inventory item error:', error)
    res.status(500).json({
      error: 'Failed to update inventory item',
      message: 'An error occurred while updating the inventory item'
    })
  }
})

// =============================================
// STOCK MOVEMENT (IN/OUT/ADJUSTMENT)
// =============================================
router.post('/:itemId/movement', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { itemId } = req.params
    const { type, quantity, reference, notes } = req.body

    // Check permissions
    if (!user.isSuperAdmin && !user.companyAccess?.some((access: any) => 
      access.permissions?.inventory?.edit && access.isActive
    )) {
      return res.status(403).json({
        error: 'Permission denied',
        message: 'You do not have permission to record stock movements'
      })
    }

    // Mock movement record
    const movement = {
      _id: `mov_${Date.now()}`,
      itemId,
      type,
      quantity,
      reference,
      notes,
      date: new Date(),
      recordedBy: user.username
    }

    res.status(201).json({
      success: true,
      data: movement,
      message: 'Stock movement recorded successfully'
    })

  } catch (error) {
    console.error('Record stock movement error:', error)
    res.status(500).json({
      error: 'Failed to record stock movement',
      message: 'An error occurred while recording the stock movement'
    })
  }
})

export default router
