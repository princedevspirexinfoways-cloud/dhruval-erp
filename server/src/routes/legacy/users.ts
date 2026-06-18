import { Router, Request, Response } from 'express'
import { authenticate, requireCompany } from '@/middleware/auth'
import User from '@/models/User'
import Company from '@/models/Company'
import bcrypt from 'bcryptjs'

const router = Router()

// Apply authentication middleware
router.use(authenticate)

// =============================================
// GET ALL USERS (with filtering and pagination)
// =============================================
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { page = 1, limit = 10, search = '', role = '', status = 'all' } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    // Build query based on user permissions
    let query: any = {}

    if (user.isSuperAdmin) {
      // Super admin can see all users
      query = { isActive: true }
    } else {
      // Regular users can only see users from their company
      query = {
        'companyAccess.companyId': user.companyId,
        'companyAccess.isActive': true,
        isActive: true
      }
    }

    // Add search filter
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
        { 'personalInfo.email': { $regex: search, $options: 'i' } }
      ]
    }

    // Add status filter
    if (status !== 'all') {
      if (status === 'active') {
        query.lastLoginAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      } else if (status === 'inactive') {
        query.$or = [
          { lastLoginAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          { lastLoginAt: { $exists: false } }
        ]
      }
    }

    // Get users with company information
    const users = await User.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'companies',
          localField: 'companyAccess.companyId',
          foreignField: '_id',
          as: 'companies'
        }
      },
      {
        $addFields: {
          primaryCompany: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$companies',
                  cond: { $eq: ['$$this._id', { $arrayElemAt: ['$companyAccess.companyId', 0] }] }
                }
              },
              0
            ]
          },
          isOnline: {
            $gte: ['$lastLoginAt', new Date(Date.now() - 5 * 60 * 1000)] // Online if logged in within 5 minutes
          }
        }
      },
      {
        $project: {
          username: 1,
          personalInfo: 1,
          isActive: 1,
          isSuperAdmin: 1,
          lastLoginAt: 1,
          createdAt: 1,
          isOnline: 1,
          primaryCompany: {
            _id: 1,
            companyName: 1,
            companyCode: 1
          },
          companyAccess: {
            $map: {
              input: '$companyAccess',
              as: 'access',
              in: {
                companyId: '$$access.companyId',
                role: '$$access.role',
                isActive: '$$access.isActive'
              }
            }
          }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum }
    ])

    // Get total count for pagination
    const total = await User.countDocuments(query)

    res.json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })

  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({
      error: 'Failed to fetch users',
      message: 'An error occurred while fetching users'
    })
  }
})

// =============================================
// GET USER STATISTICS
// =============================================
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user

    let stats: any = {}

    if (user.isSuperAdmin) {
      // System-wide user stats
      const totalUsers = await User.countDocuments({ isActive: true })
      const activeUsers = await User.countDocuments({
        isActive: true,
        lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      const onlineUsers = await User.countDocuments({
        isActive: true,
        lastLoginAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
      })
      const superAdmins = await User.countDocuments({ isSuperAdmin: true, isActive: true })

      stats = {
        totalUsers,
        activeUsers,
        onlineUsers,
        superAdmins,
        inactiveUsers: totalUsers - activeUsers,
        newUsersThisMonth: await User.countDocuments({
          isActive: true,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
      }
    } else {
      // Company-specific user stats
      const totalUsers = await User.countDocuments({
        'companyAccess.companyId': user.companyId,
        'companyAccess.isActive': true,
        isActive: true
      })
      const activeUsers = await User.countDocuments({
        'companyAccess.companyId': user.companyId,
        'companyAccess.isActive': true,
        isActive: true,
        lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      const onlineUsers = await User.countDocuments({
        'companyAccess.companyId': user.companyId,
        'companyAccess.isActive': true,
        isActive: true,
        lastLoginAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
      })

      stats = {
        totalUsers,
        activeUsers,
        onlineUsers,
        inactiveUsers: totalUsers - activeUsers,
        newUsersThisMonth: await User.countDocuments({
          'companyAccess.companyId': user.companyId,
          'companyAccess.isActive': true,
          isActive: true,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
      }
    }

    res.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Get user stats error:', error)
    res.status(500).json({
      error: 'Failed to fetch user statistics',
      message: 'An error occurred while fetching user statistics'
    })
  }
})

// =============================================
// GET USER BY ID
// =============================================
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { userId } = req.params

    // Check if user has permission to view this user
    let query: any = { _id: userId, isActive: true }

    if (!user.isSuperAdmin) {
      query['companyAccess.companyId'] = user.companyId
      query['companyAccess.isActive'] = true
    }

    const targetUser = await User.findOne(query)
      .populate('companyAccess.companyId', 'companyName companyCode')
      .select('-password -refreshTokens')

    if (!targetUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The requested user was not found or you do not have permission to view them'
      })
    }

    res.json({
      success: true,
      data: targetUser
    })

  } catch (error) {
    console.error('Get user by ID error:', error)
    res.status(500).json({
      error: 'Failed to fetch user',
      message: 'An error occurred while fetching user details'
    })
  }
})

// =============================================
// CREATE NEW USER
// =============================================
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { username, email, password, personalInfo, companyAccess } = req.body

    // Check if user has permission to create users
    if (!user.isSuperAdmin && !user.companyAccess?.some((access: any) => 
      access.permissions?.users?.create && access.isActive
    )) {
      return res.status(403).json({
        error: 'Permission denied',
        message: 'You do not have permission to create users'
      })
    }

    // Check if username already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email: email?.toLowerCase() }] })
    if (existingUser) {
      return res.status(400).json({
        error: 'Username already exists',
        message: 'A user with this username already exists'
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Determine company access
    let userCompanyAccess = companyAccess;
    let userPrimaryCompanyId = null;

    if (!user.isSuperAdmin) {
      // For non-superadmin users, use the creator's company
      userPrimaryCompanyId = user.primaryCompanyId || user.companyAccess?.[0]?.companyId;
      userCompanyAccess = [{
        companyId: userPrimaryCompanyId,
        role: 'operator',
        department: 'Production',
        isActive: true,
        joinedAt: new Date(),
        permissions: {
          inventory: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
          production: { view: true, create: true, edit: false, delete: false, approve: false, viewReports: false },
          orders: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
          financial: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
          security: {
            gateManagement: false,
            visitorManagement: false,
            vehicleTracking: false,
            cctvAccess: false,
            emergencyResponse: false,
            securityReports: false,
            incidentManagement: false,
            accessControl: false,
            patrolManagement: false
          },
          hr: {
            viewEmployees: false,
            manageEmployees: false,
            manageAttendance: false,
            manageSalary: false,
            manageLeaves: false,
            viewReports: false,
            recruitment: false,
            performance: false,
            training: false,
            disciplinary: false
          },
          admin: { userManagement: false, systemSettings: false, backupRestore: false, auditLogs: false }
        }
      }];
    }

    // Create new user
    const newUser = new User({
      username,
      email: email?.toLowerCase(),
      password: hashedPassword,
      personalInfo,
      primaryCompanyId: userPrimaryCompanyId,
      companyAccess: userCompanyAccess,
      isActive: true,
      createdAt: new Date()
    })

    await newUser.save()

    // Return user without password
    const userResponse = await User.findById(newUser._id)
      .populate('companyAccess.companyId', 'companyName companyCode')
      .select('-password -refreshTokens')

    res.status(201).json({
      success: true,
      data: userResponse,
      message: 'User created successfully'
    })

  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({
      error: 'Failed to create user',
      message: 'An error occurred while creating the user'
    })
  }
})

export default router
