import { Router, Request, Response } from 'express'
import { Types } from 'mongoose'
import { authenticate, requireCompany } from '../../middleware/auth'
import User from '../../models/User'
import Company from '../../models/Company'
import TwoFactor from '../../models/TwoFactor'
import bcrypt from 'bcryptjs'
import { generateUniqueUsername } from '../../utils/usernameGenerator'

const router: Router = Router()

// Apply authentication middleware to all user routes
router.use(authenticate)
router.use(requireCompany)

// =============================================
// GET ALL USERS ENDPOINT (with 2FA status)
// =============================================
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const userCompanyId = user.companyId
    const isSuperAdmin = user.isSuperAdmin

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const search = req.query.search as string || ''
    const role = req.query.role as string || ''
    const status = req.query.status as string || ''
    const filterCompanyId = req.query.companyId as string || ''
    const sortBy = req.query.sortBy as string || 'createdAt'
    const sortOrder = req.query.sortOrder as string || 'desc'

    // Build filter
    let filter: any = {}
    
    if (isSuperAdmin) {
      // Super Admin can see all users
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        filter.$or = [
          { username: searchRegex },
          { email: searchRegex },
          { 'personalInfo.firstName': searchRegex },
          { 'personalInfo.lastName': searchRegex }
        ]
      }
      
      // Add company filter if specified
      if (filterCompanyId) {
        filter['companyAccess.companyId'] = new Types.ObjectId(filterCompanyId)
      }
    } else {
      // Company users can only see users in their company
      filter['companyAccess.companyId'] = new Types.ObjectId(userCompanyId)
      
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        filter.$or = [
          { username: searchRegex },
          { email: searchRegex },
          { 'personalInfo.firstName': searchRegex },
          { 'personalInfo.lastName': searchRegex }
        ]
      }
    }

    if (role) {
      filter['companyAccess.role'] = role
    }

    if (status) {
      filter.isActive = status === 'active'
    }

    const skip = (page - 1) * limit

    // Build sort object
    let sortObject: any = {}
    if (sortBy === 'name') {
      sortObject['personalInfo.firstName'] = sortOrder === 'asc' ? 1 : -1
      sortObject['personalInfo.lastName'] = sortOrder === 'asc' ? 1 : -1
    } else if (sortBy === 'email') {
      sortObject.email = sortOrder === 'asc' ? 1 : -1
    } else if (sortBy === 'lastLogin') {
      sortObject['security.lastLogin'] = sortOrder === 'asc' ? 1 : -1
    } else {
      sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1
    }

    const users = await User.find(filter)
      .populate('companyAccess.companyId', 'companyName companyCode')
      .populate('primaryCompanyId', 'companyName companyCode')
      .select('-password -security.twoFactorSecret')
      .sort(sortObject)
      .skip(skip)
      .limit(limit)
      .lean()

    // Get 2FA status for all users
    const usersWith2FA = await Promise.all(
      users.map(async (user) => {
        const twoFactor = await TwoFactor.findOne({ userId: user._id })
        return {
          ...user,
          twoFactorEnabled: twoFactor ? twoFactor.isEnabled : false,
          twoFactorSetupAt: twoFactor?.setupAt,
          twoFactorLastUsed: twoFactor?.lastUsed,
          backupCodesCount: twoFactor ? twoFactor.getUnusedBackupCodesCount() : 0
        }
      })
    )

    const total = await User.countDocuments(filter)

    res.json({
      success: true,
      data: {
        users: usersWith2FA,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error getting users:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    })
  }
})

// =============================================
// GET SINGLE USER ENDPOINT
// =============================================
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user
    const { userId } = req.params
    const isSuperAdmin = currentUser.isSuperAdmin

    // Validate ObjectId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      })
    }

    // Find user
    const user = await User.findById(userId)
      .populate('companyAccess.companyId', 'companyName companyCode')
      .populate('primaryCompanyId', 'companyName companyCode')
      .select('-password -security.twoFactorSecret')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Check permissions
    if (!isSuperAdmin) {
      const userCompanyId = user.companyAccess?.[0]?.companyId?.toString()
      if (userCompanyId !== currentUser.companyId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view users from your own company.'
        })
      }
    }

    // Get 2FA status
    const twoFactor = await TwoFactor.findOne({ userId })
    const userWith2FA = {
      ...user.toObject(),
      twoFactorEnabled: twoFactor ? twoFactor.isEnabled : false,
      twoFactorSetupAt: twoFactor?.setupAt,
      twoFactorLastUsed: twoFactor?.lastUsed,
      backupCodesCount: twoFactor ? twoFactor.getUnusedBackupCodesCount() : 0
    }

    res.json({
      success: true,
      data: userWith2FA
    })

  } catch (error) {
    console.error('Error getting user:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    })
  }
})

// =============================================
// CREATE USER ENDPOINT
// =============================================
router.post('/', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user
    const {
      username,
      email,
      password,
      personalInfo,
      primaryCompanyId,
      companyAccess,
      role,
      department,
      designation,
      isActive,
      isSuperAdmin
    } = req.body

    // Validate required fields (username is now auto-generated)
    if (!password || !personalInfo || !primaryCompanyId || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: password, personalInfo, primaryCompanyId, and role are required'
      })
    }

    // Validate personalInfo structure
    if (!personalInfo.firstName || !personalInfo.lastName) {
      return res.status(400).json({
        success: false,
        message: 'personalInfo must include firstName and lastName'
      })
    }

    // Auto-generate unique username
    const generatedUsername = await generateUniqueUsername(personalInfo.firstName, email)
    console.log('Generated username:', generatedUsername)

    // Check if email already exists (if provided)
    if (email) {
      const existingUserByEmail = await User.findOne({ email })
      if (existingUserByEmail) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        })
      }
    }

    // Verify company exists
    const company = await Company.findById(primaryCompanyId)
    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company selected'
      })
    }

    // Check permissions for super admin creation
    if (isSuperAdmin && !currentUser.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can create super admin users'
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Prepare company access array
    const companyAccessArray = companyAccess || [{
      companyId: primaryCompanyId,
      role,
      department: department || 'Management',
      designation: designation || '',
      permissions: {
        inventory: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
        production: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
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
        admin: { 
          userManagement: false, 
          systemSettings: false, 
          backupRestore: false, 
          auditLogs: false 
        }
      },
      isActive: true,
      joinedAt: new Date()
    }]

    // Create user
    const userData: any = {
      username: generatedUsername,
      personalInfo,
      password: hashedPassword,
      primaryCompanyId,
      companyAccess: companyAccessArray,
      isActive: isActive !== undefined ? isActive : true,
      isSuperAdmin: isSuperAdmin || false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Only add email if provided
    if (email && email.trim()) {
      userData.email = email
    }

    const newUser = new User(userData)

    await newUser.save()

    // Populate company information for response
    await newUser.populate('companyAccess.companyId', 'companyName companyCode')
    await newUser.populate('primaryCompanyId', 'companyName companyCode')

    // Remove sensitive information from response
    const userResponse = newUser.toObject()
    delete userResponse.password
    delete userResponse.security?.twoFactorSecret

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    })

  } catch (error) {
    console.error('Error creating user:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    })
  }
})

// =============================================
// UPDATE USER ENDPOINT
// =============================================
router.put('/:userId', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user
    const { userId } = req.params

    // Validate ObjectId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      })
    }
    const {
      username,
      email,
      password,
      personalInfo,
      primaryCompanyId,
      companyAccess,
      role,
      department,
      designation,
      isActive,
      isSuperAdmin
    } = req.body

    // Find user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Check permissions
    if (!currentUser.isSuperAdmin) {
      const userCompanyId = user.companyAccess?.[0]?.companyId?.toString()
      if (userCompanyId !== currentUser.companyId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only edit users from your own company'
        })
      }
    }

    // Update basic info
    if (username) user.username = username
    if (email) user.email = email
    if (personalInfo) {
      if (personalInfo.firstName) user.personalInfo.firstName = personalInfo.firstName
      if (personalInfo.lastName) user.personalInfo.lastName = personalInfo.lastName
      if (personalInfo.middleName !== undefined) user.personalInfo.middleName = personalInfo.middleName
      if (personalInfo.phone !== undefined) user.personalInfo.phone = personalInfo.phone
      if (personalInfo.alternatePhone !== undefined) user.personalInfo.alternatePhone = personalInfo.alternatePhone
    }
    if (isActive !== undefined) user.isActive = isActive

    // Update password if provided
    if (password && password.length >= 8) {
      user.password = await bcrypt.hash(password, 12)
      if (!user.security) {
        user.security = {
          failedLoginAttempts: 0,
          accountLocked: false,
          twoFactorEnabled: false,
          mustChangePassword: false
        }
      }
      user.security.passwordLastChanged = new Date()
    }

    // Update company access if provided
    if (primaryCompanyId && role) {
      // Verify company exists
      const company = await Company.findById(primaryCompanyId)
      if (!company) {
        return res.status(400).json({
          success: false,
          message: 'Invalid company selected'
        })
      }

      user.primaryCompanyId = primaryCompanyId
      user.companyAccess = companyAccess || [{
        companyId: primaryCompanyId,
        role,
        department: department || 'Management',
        designation: designation || '',
        permissions: user.companyAccess?.[0]?.permissions || {
          inventory: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
          production: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
          orders: { view: true, create: false, edit: false, delete: false, approve: false, viewReports: false },
          financial: { view: false, create: false, edit: false, delete: false, approve: false, viewReports: false },
          security: { gateManagement: false, visitorManagement: false, vehicleTracking: false, cctvAccess: false, emergencyResponse: false, securityReports: false, incidentManagement: false, accessControl: false, patrolManagement: false },
          hr: { viewEmployees: false, manageEmployees: false, manageAttendance: false, manageSalary: false, manageLeaves: false, viewReports: false, recruitment: false, performance: false, training: false, disciplinary: false },
          admin: { userManagement: false, systemSettings: false, backupRestore: false, auditLogs: false }
        },
        isActive: true,
        joinedAt: user.companyAccess?.[0]?.joinedAt || new Date()
      }]

      // Update super admin status if current user is super admin
      if (currentUser.isSuperAdmin) {
        user.isSuperAdmin = isSuperAdmin || false
      }
    }

    user.updatedAt = new Date()
    await user.save()

    // Populate company information for response
    await user.populate('companyAccess.companyId', 'companyName companyCode')
    await user.populate('primaryCompanyId', 'companyName companyCode')

    // Remove sensitive information from response
    const userResponse = user.toObject()
    delete userResponse.password
    delete userResponse.security?.twoFactorSecret

    res.json({
      success: true,
      message: 'User updated successfully',
      data: userResponse
    })

  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    })
  }
})

// =============================================
// DELETE USER ENDPOINT
// =============================================
router.delete('/:userId', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user
    const { userId } = req.params

    // Validate ObjectId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      })
    }

    // Find user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Check permissions
    if (!currentUser.isSuperAdmin) {
      const userCompanyId = user.companyAccess?.[0]?.companyId?.toString()
      if (userCompanyId !== currentUser.companyId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete users from your own company'
        })
      }
    }

    // Prevent deleting super admin users (unless current user is also super admin)
    if (user.isSuperAdmin && !currentUser.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete super admin user'
      })
    }

    // Delete user's 2FA settings
    await TwoFactor.findOneAndDelete({ userId })

    // Delete user
    await User.findByIdAndDelete(userId)

    res.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    })
  }
})

// =============================================
// TOGGLE USER STATUS ENDPOINT
// =============================================
router.patch('/:userId/toggle-status', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user
    const { userId } = req.params

    // Validate ObjectId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      })
    }

    // Find user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Check permissions
    if (!currentUser.isSuperAdmin) {
      const userCompanyId = user.companyAccess?.[0]?.companyId?.toString()
      if (userCompanyId !== currentUser.companyId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only modify users from your own company'
        })
      }
    }

    // Toggle status
    user.isActive = !user.isActive
    user.updatedAt = new Date()
    await user.save()

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: user.isActive }
    })

  } catch (error) {
    console.error('Error toggling user status:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to toggle user status',
      error: error.message
    })
  }
})

// =============================================
// 2FA MANAGEMENT ENDPOINTS
// =============================================

// Get 2FA status for all users
router.get('/2fa/status', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user
    const isSuperAdmin = currentUser.isSuperAdmin

    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. SuperAdmin privileges required.'
      })
    }

    // Get all users with their 2FA status
    const users = await User.find({}, {
      password: 0,
      refreshTokens: 0
    }).lean()

    // Get 2FA status for all users
    const usersWith2FA = await Promise.all(
      users.map(async (user) => {
        const twoFactor = await TwoFactor.findOne({ userId: user._id })
        return {
          ...user,
          twoFactorEnabled: twoFactor ? twoFactor.isEnabled : false,
          twoFactorSetupAt: twoFactor?.setupAt,
          twoFactorLastUsed: twoFactor?.lastUsed,
          backupCodesCount: twoFactor ? twoFactor.getUnusedBackupCodesCount() : 0
        }
      })
    )

    // Calculate statistics
    const stats = {
      totalUsers: users.length,
      twoFactorEnabled: usersWith2FA.filter(u => u.twoFactorEnabled).length,
      twoFactorDisabled: usersWith2FA.filter(u => !u.twoFactorEnabled).length,
      adoptionRate: users.length > 0 ? Math.round((usersWith2FA.filter(u => u.twoFactorEnabled).length / users.length) * 100) : 0
    }

    res.json({
      success: true,
      data: {
        users: usersWith2FA,
        stats
      }
    })

  } catch (error) {
    console.error('Error getting 2FA status:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get 2FA status',
      error: error.message
    })
  }
})

// Force enable 2FA for a user
router.post('/:userId/2fa/enable', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user
    const { userId } = req.params

    // Validate ObjectId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      })
    }

    if (!currentUser.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. SuperAdmin privileges required.'
      })
    }

    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Check if 2FA is already enabled
    const existingTwoFactor = await TwoFactor.findOne({ userId })
    if (existingTwoFactor && existingTwoFactor.isEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled for this user'
      })
    }

    // Create or update 2FA record
    let twoFactor = existingTwoFactor
    if (!twoFactor) {
      const speakeasy = require('speakeasy')
      const secret = speakeasy.generateSecret({
        name: `ERP (${user.email})`,
        issuer: 'ERP System',
        length: 20
      })

      twoFactor = new TwoFactor({
        userId,
        secret: secret.base32,
        isEnabled: true,
        setupAt: new Date()
      })
    } else {
      twoFactor.isEnabled = true
      twoFactor.setupAt = new Date()
    }

    await twoFactor.save()

    res.json({
      success: true,
      message: '2FA enabled successfully for user',
      data: {
        userId,
        username: user.username,
        twoFactorEnabled: true
      }
    })

  } catch (error) {
    console.error('Error enabling 2FA:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to enable 2FA',
      error: error.message
    })
  }
})

// Force disable 2FA for a user
router.post('/:userId/2fa/disable', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user
    const { userId } = req.params

    // Validate ObjectId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      })
    }

    if (!currentUser.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. SuperAdmin privileges required.'
      })
    }

    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Disable 2FA
    await TwoFactor.findOneAndUpdate(
      { userId },
      { 
        isEnabled: false, 
        disabledAt: new Date()
      }
    )

    res.json({
      success: true,
      message: '2FA disabled successfully for user',
      data: {
        userId,
        username: user.username,
        twoFactorEnabled: false
      }
    })

  } catch (error) {
    console.error('Error disabling 2FA:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA',
      error: error.message
    })
  }
})

// Reset 2FA for a user
router.post('/:userId/2fa/reset', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user
    const { userId } = req.params

    // Validate ObjectId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      })
    }

    if (!currentUser.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. SuperAdmin privileges required.'
      })
    }

    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Delete existing 2FA record
    await TwoFactor.findOneAndDelete({ userId })

    res.json({
      success: true,
      message: '2FA reset successfully for user',
      data: {
        userId,
        username: user.username,
        twoFactorEnabled: false
      }
    })

  } catch (error) {
    console.error('Error resetting 2FA:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to reset 2FA',
      error: error.message
    })
  }
})

// =============================================
// USERS STATS ENDPOINT
// =============================================
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const companyId = user.companyId
    const isSuperAdmin = user.isSuperAdmin

    let stats: any = {}

    if (isSuperAdmin) {
      // Super Admin - System-wide user stats
      const totalUsers = await User.countDocuments({ isActive: true })
      const activeUsers = await User.countDocuments({ 
        isActive: true,
        'companyAccess.isActive': true
      })
      const inactiveUsers = await User.countDocuments({ isActive: false })
      const superAdmins = await User.countDocuments({ 
        isActive: true,
        isSuperAdmin: true
      })

      stats = {
        totalUsers,
        activeUsers,
        inactiveUsers,
        superAdmins,
        userGrowth: 0,
        activeUserRate: activeUsers / totalUsers * 100,
        userDistribution: {
          superAdmins,
          regularUsers: totalUsers - superAdmins
        }
      }
    } else {
      // Company-specific user stats
      const companyUsers = await User.countDocuments({
        'companyAccess.companyId': companyId,
        'companyAccess.isActive': true,
        isActive: true
      })

      const activeCompanyUsers = await User.countDocuments({
        'companyAccess.companyId': companyId,
        'companyAccess.isActive': true,
        isActive: true,
        lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      })

      stats = {
        totalEmployees: companyUsers,
        activeEmployees: activeCompanyUsers,
        inactiveEmployees: companyUsers - activeCompanyUsers,
        employeeGrowth: 0,
        activeEmployeeRate: activeCompanyUsers / companyUsers * 100,
        roleDistribution: {
          superAdmin: 0,
          admin: 0,
          manager: 0,
          employee: 0
        }
      }
    }

    res.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Users stats error:', error)
    res.status(500).json({
      error: 'Failed to fetch users stats',
      message: 'An error occurred while fetching user statistics'
    })
  }
})

// =============================================
// GET COMPANIES FOR FILTERING (Super Admin Only)
// =============================================
router.get('/companies', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    
    if (!user.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. SuperAdmin privileges required.'
      });
    }

    const companies = await Company.find({ isActive: true })
      .select('companyCode companyName _id isActive')
      .sort({ companyName: 1 });

    res.json({
      success: true,
      data: companies
    });

  } catch (error) {
    console.error('Error getting companies for filtering:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies'
    });
  }
});

// =============================================
// GET USERS BY COMPANY (Company Admin Only)
// =============================================
router.get('/company/:companyId', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user
    const { companyId } = req.params
    const isSuperAdmin = currentUser.isSuperAdmin

    // Check permissions
    if (!isSuperAdmin && currentUser.companyId?.toString() !== companyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view users from your own company.'
      })
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const search = req.query.search as string || ''
    const role = req.query.role as string || ''
    const status = req.query.status as string || ''

    // Build filter
    let filter: any = {
      'companyAccess.companyId': companyId
    }
    
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: search, $options: 'i' } }
      ]
    }

    if (role) {
      filter['companyAccess.role'] = role
    }

    if (status) {
      filter.status = status
    }

    const skip = (page - 1) * limit

    const users = await User.find(filter)
      .populate('companyAccess.companyId', 'companyName companyCode')
      .populate('primaryCompanyId', 'companyName companyCode')
      .select('-password -security.twoFactorSecret')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get 2FA status for all users
    const usersWith2FA = await Promise.all(
      users.map(async (user) => {
        const twoFactor = await TwoFactor.findOne({ userId: user._id })
        return {
          ...user,
          twoFactorEnabled: twoFactor ? twoFactor.isEnabled : false,
          twoFactorSetupAt: twoFactor?.setupAt,
          twoFactorLastUsed: twoFactor?.lastUsed,
          backupCodesCount: twoFactor ? twoFactor.getUnusedBackupCodesCount() : 0
        }
      })
    )

    const total = await User.countDocuments(filter)

    res.json({
      success: true,
      data: {
        users: usersWith2FA,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error getting users by company:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users by company'
    })
  }
})

// =============================================
// GET USER STATISTICS ENDPOINT
// =============================================
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user
    const isSuperAdmin = currentUser.isSuperAdmin
    const filterCompanyId = req.query.companyId as string || ''

    // Build base filter
    let filter: any = {}
    
    if (isSuperAdmin) {
      // Super Admin can see stats for all companies or specific company
      if (filterCompanyId) {
        filter['companyAccess.companyId'] = filterCompanyId
      }
    } else {
      // Company users can only see stats for their company
      filter['companyAccess.companyId'] = currentUser.companyId
    }

    // Get total users count
    const totalUsers = await User.countDocuments(filter)

    // Get active/inactive users count
    const activeUsers = await User.countDocuments({ ...filter, isActive: true })
    const inactiveUsers = await User.countDocuments({ ...filter, isActive: false })

    // Get super admin count
    const superAdmins = await User.countDocuments({ ...filter, isSuperAdmin: true })

    // Get role-based counts
    const roleStats = await User.aggregate([
      { $match: filter },
      { $unwind: '$companyAccess' },
      {
        $group: {
          _id: '$companyAccess.role',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ])

    // Get 2FA enabled users count
    const twoFactorUsers = await User.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'twofactors',
          localField: '_id',
          foreignField: 'userId',
          as: 'twoFactor'
        }
      },
      {
        $match: {
          'twoFactor.isEnabled': true
        }
      },
      { $count: 'total' }
    ])

    const twoFactorEnabledCount = twoFactorUsers.length > 0 ? twoFactorUsers[0].total : 0

    // Get recent activity stats (last 24 hours, 7 days, 30 days)
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const recentLogins24h = await User.countDocuments({
      ...filter,
      'security.lastLogin': { $gte: dayAgo }
    })

    const recentLogins7d = await User.countDocuments({
      ...filter,
      'security.lastLogin': { $gte: weekAgo }
    })

    const recentLogins30d = await User.countDocuments({
      ...filter,
      'security.lastLogin': { $gte: monthAgo }
    })

    // Get company-specific stats if filtering by company
    let companyStats = null
    if (filterCompanyId) {
      const company = await Company.findById(filterCompanyId).select('companyName companyCode')
      if (company) {
        companyStats = {
          companyId: company._id,
          companyName: company.companyName,
          companyCode: company.companyCode
        }
      }
    }

    // Get new users in last 30 days
    const newUsers30d = await User.countDocuments({
      ...filter,
      createdAt: { $gte: monthAgo }
    })

    // Get users by department
    const departmentStats = await User.aggregate([
      { $match: filter },
      { $unwind: '$companyAccess' },
      {
        $group: {
          _id: '$companyAccess.department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ])

    // Get users by designation
    const designationStats = await User.aggregate([
      { $match: filter },
      { $unwind: '$companyAccess' },
      {
        $group: {
          _id: '$companyAccess.designation',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ])

    // Calculate percentages
    const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
    const twoFactorPercentage = totalUsers > 0 ? Math.round((twoFactorEnabledCount / totalUsers) * 100) : 0
    const recentActivityPercentage = totalUsers > 0 ? Math.round((recentLogins7d / totalUsers) * 100) : 0

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          superAdmins,
          twoFactorEnabled: twoFactorEnabledCount,
          newUsers30d
        },
        activity: {
          recentLogins24h,
          recentLogins7d,
          recentLogins30d,
          recentActivityPercentage
        },
        percentages: {
          activePercentage,
          twoFactorPercentage,
          recentActivityPercentage
        },
        roleDistribution: roleStats,
        departmentDistribution: departmentStats,
        designationDistribution: designationStats,
        companyStats,
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error getting user statistics:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics'
    })
  }
})

export default router
