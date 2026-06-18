import { Router, Request, Response } from 'express'
import { authenticate } from '@/middleware/auth'
import Role from '@/models/Role'
import User from '@/models/User'
import mongoose from 'mongoose'

const router = Router()

// Apply authentication middleware
router.use(authenticate)

// =============================================
// GET ALL ROLES (Real Database Query)
// =============================================
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = 'all', 
      roleType = 'all',
      level = 'all',
      department = 'all'
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
        { roleCode: { $regex: searchTerm, $options: 'i' } },
        { roleName: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    }

    // Add status filter
    if (status !== 'all') {
      query.status = status
    }

    // Add role type filter
    if (roleType !== 'all') {
      query.roleType = roleType
    }

    // Add level filter
    if (level !== 'all') {
      query.level = level
    }

    // Add department filter
    if (department !== 'all') {
      query.department = department
    }

    // Get roles with pagination
    const roles = await Role.find(query)
      .populate('companyId', 'companyName companyCode')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean()

    // Get total count for pagination
    const total = await Role.countDocuments(query)

    // Get user counts for each role
    const roleIds = roles.map(role => role._id)
    const userCounts = await User.aggregate([
      { 
        $match: { 
          companyId: new mongoose.Types.ObjectId(companyId),
          isActive: true,
          'roleAccess.roleId': { $in: roleIds }
        }
      },
      { $unwind: '$roleAccess' },
      { 
        $match: { 
          'roleAccess.roleId': { $in: roleIds },
          'roleAccess.isActive': true
        }
      },
      {
        $group: {
          _id: '$roleAccess.roleId',
          count: { $sum: 1 }
        }
      }
    ])

    const userCountMap = userCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count
      return acc
    }, {} as { [key: string]: number })

    // Transform data for frontend
    const transformedRoles = roles.map(role => ({
      _id: role._id,
      roleCode: role.roleCode,
      roleName: role.roleName,
      description: role.description,
      roleType: role.roleType || 'custom',
      level: role.roleLevel,
      department: role.department,
      status: role.isActive ? 'active' : 'inactive',
      permissions: role.permissions || {},
      userCount: userCountMap[role._id.toString()] || 0,
      isSystemRole: role.isSystemRole || false,
      companyId: role.companyId,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    }))

    res.json({
      success: true,
      data: transformedRoles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })

  } catch (error) {
    console.error('Get roles error:', error)
    res.status(500).json({
      error: 'Failed to fetch roles',
      message: 'An error occurred while fetching roles'
    })
  }
})

// =============================================
// GET ROLE STATISTICS (Real Database Query)
// =============================================
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const companyId = user.isSuperAdmin ? req.query.companyId || user.companyId : user.companyId

    // Get role statistics using aggregation
    const stats = await Role.aggregate([
      { 
        $match: { 
          companyId: new mongoose.Types.ObjectId(companyId),
          isActive: true 
        } 
      },
      {
        $group: {
          _id: null,
          totalRoles: { $sum: 1 },
          activeRoles: { 
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } 
          },
          inactiveRoles: { 
            $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } 
          },
          systemRoles: { 
            $sum: { $cond: [{ $eq: ['$roleType', 'system'] }, 1, 0] } 
          },
          customRoles: { 
            $sum: { $cond: [{ $eq: ['$roleType', 'custom'] }, 1, 0] } 
          }
        }
      }
    ])

    // Get total users assigned to roles
    const totalUsersAssigned = await User.countDocuments({
      companyId: new mongoose.Types.ObjectId(companyId),
      isActive: true,
      'roleAccess.isActive': true
    })

    // Get roles by department
    const rolesByDepartment = await Role.aggregate([
      { 
        $match: { 
          companyId: new mongoose.Types.ObjectId(companyId),
          isActive: true,
          department: { $exists: true, $ne: null }
        } 
      },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      }
    ])

    // Get roles by level
    const rolesByLevel = await Role.aggregate([
      { 
        $match: { 
          companyId: new mongoose.Types.ObjectId(companyId),
          isActive: true,
          level: { $exists: true, $ne: null }
        } 
      },
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 }
        }
      }
    ])

    const result = stats[0] || {
      totalRoles: 0,
      activeRoles: 0,
      inactiveRoles: 0,
      systemRoles: 0,
      customRoles: 0
    }

    res.json({
      success: true,
      data: {
        ...result,
        totalUsersAssigned,
        rolesByDepartment: rolesByDepartment.reduce((acc, item) => {
          acc[item._id] = item.count
          return acc
        }, {} as { [key: string]: number }),
        rolesByLevel: rolesByLevel.reduce((acc, item) => {
          acc[item._id] = item.count
          return acc
        }, {} as { [key: string]: number })
      }
    })

  } catch (error) {
    console.error('Get role stats error:', error)
    res.status(500).json({
      error: 'Failed to fetch role statistics',
      message: 'An error occurred while fetching role statistics'
    })
  }
})

// =============================================
// CREATE NEW ROLE (Real Database Insert)
// =============================================
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const roleData = req.body

    // Create new role
    const newRole = new Role({
      ...roleData,
      companyId: user.companyId,
      createdBy: user.userId,
      isActive: true,
      isSystemRole: false,
      roleType: roleData.roleType || 'custom'
    })

    await newRole.save()

    res.status(201).json({
      success: true,
      data: newRole,
      message: 'Role created successfully'
    })

  } catch (error) {
    console.error('Create role error:', error)
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message
      })
    }

    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Duplicate role',
        message: 'A role with this code already exists'
      })
    }

    res.status(500).json({
      error: 'Failed to create role',
      message: 'An error occurred while creating the role'
    })
  }
})

// =============================================
// UPDATE ROLE (Real Database Update)
// =============================================
router.put('/:roleId', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { roleId } = req.params
    const updateData = req.body

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({
        error: 'Invalid role ID',
        message: 'The provided role ID is not valid'
      })
    }

    // Build query with company access control
    let query: any = { 
      _id: new mongoose.Types.ObjectId(roleId),
      isActive: true 
    }

    if (!user.isSuperAdmin) {
      query.companyId = new mongoose.Types.ObjectId(user.companyId)
    }

    const updatedRole = await Role.findOneAndUpdate(
      query,
      { 
        ...updateData, 
        updatedBy: user.userId,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )

    if (!updatedRole) {
      return res.status(404).json({
        error: 'Role not found',
        message: 'The requested role was not found or you do not have access to it'
      })
    }

    res.json({
      success: true,
      data: updatedRole,
      message: 'Role updated successfully'
    })

  } catch (error) {
    console.error('Update role error:', error)
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message
      })
    }

    res.status(500).json({
      error: 'Failed to update role',
      message: 'An error occurred while updating the role'
    })
  }
})

// =============================================
// DELETE ROLE (Real Database Delete)
// =============================================
router.delete('/:roleId', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { roleId } = req.params

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({
        error: 'Invalid role ID',
        message: 'The provided role ID is not valid'
      })
    }

    // Check if role is assigned to any users
    const usersWithRole = await User.countDocuments({
      'roleAccess.roleId': new mongoose.Types.ObjectId(roleId),
      'roleAccess.isActive': true,
      isActive: true
    })

    if (usersWithRole > 0) {
      return res.status(400).json({
        error: 'Role in use',
        message: `Cannot delete role as it is assigned to ${usersWithRole} user(s)`
      })
    }

    // Build query with company access control
    let query: any = { 
      _id: new mongoose.Types.ObjectId(roleId),
      isActive: true,
      isSystemRole: { $ne: true } // Prevent deletion of system roles
    }

    if (!user.isSuperAdmin) {
      query.companyId = new mongoose.Types.ObjectId(user.companyId)
    }

    // Soft delete by setting isActive to false
    const deletedRole = await Role.findOneAndUpdate(
      query,
      { 
        isActive: false,
        updatedBy: user.userId,
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!deletedRole) {
      return res.status(404).json({
        error: 'Role not found',
        message: 'The requested role was not found, is a system role, or you do not have access to it'
      })
    }

    res.json({
      success: true,
      message: 'Role deleted successfully'
    })

  } catch (error) {
    console.error('Delete role error:', error)
    res.status(500).json({
      error: 'Failed to delete role',
      message: 'An error occurred while deleting the role'
    })
  }
})

export default router
