import { Router, Request, Response } from 'express'
import { authenticate, requireCompany } from '@/middleware/auth'
import User from '@/models/User'
import Company from '@/models/Company'

const router:Router = Router()

// Apply authentication middleware to all dashboard routes
router.use(authenticate)
router.use(requireCompany)

// =============================================
// DASHBOARD STATS ENDPOINT
// =============================================
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const companyId = user.companyId
    const isSuperAdmin = user.isSuperAdmin

    let stats: any = {}

    if (isSuperAdmin) {
      // Super Admin - Real system-wide stats from database
      const totalCompanies = await Company.countDocuments({ isActive: true })
      const totalUsers = await User.countDocuments({ isActive: true })
      const activeCompanies = await Company.countDocuments({
        isActive: true,
        status: 'active'
      })

      stats = {
        totalCompanies,
        totalUsers,
        activeCompanies,
        systemHealth: 0, // Will be calculated from real system monitoring
        totalRevenue: 0, // Will be calculated from all companies when we have order/invoice models
        pendingApprovals: 0, // Will be calculated from pending user approvals
        securityAlerts: 0, // Will be calculated from security logs
        systemUptime: '0%' // Will be calculated from real system monitoring
      }
    } else {
      // Company-specific stats from database
      const companyUsers = await User.countDocuments({
        'companyAccess.companyId': companyId,
        'companyAccess.isActive': true,
        isActive: true
      })

      // Get current user's company access for role-based stats
      const userAccess = user.companyAccess?.find((access: any) =>
        access.companyId.toString() === companyId && access.isActive
      )

      stats = {
        totalEmployees: companyUsers,
        // These will be populated when we have the respective models
        totalOrders: 0, // From CustomerOrder model
        totalRevenue: 0, // From Invoice model
        totalCustomers: 0, // From Customer model
        totalProducts: 0, // From Product model
        totalProduction: 0, // From ProductionOrder model
        totalInventory: 0, // From InventoryItem model
        totalSuppliers: 0, // From Supplier model
        pendingOrders: 0, // From CustomerOrder where status = 'pending'
        completedOrders: 0, // From CustomerOrder where status = 'completed'
        lowStockItems: 0, // From InventoryItem where currentStock < minimumStock
        activeProduction: 0, // From ProductionOrder where status = 'in_progress'
        monthlyRevenue: 0, // From Invoice for current month
        outstandingPayments: 0, // From Invoice where status = 'pending'
        profitMargin: 0 // Calculated from revenue and costs
      }

      // Add role-specific stats based on permissions
      if (userAccess?.permissions?.production?.view) {
        stats.activeProductionLines = 0 // From ProductionLine model
        stats.todayProduction = 0 // From ProductionOrder for today
        stats.qualityChecksPending = 0 // From QualityCheck where status = 'pending'
      }

      if (userAccess?.permissions?.inventory?.view) {
        stats.lowStockAlerts = 0 // From InventoryItem where currentStock < minimumStock
        stats.inventoryValue = 0 // Sum of (currentStock * unitPrice) from InventoryItem
        stats.stockMovements = 0 // From InventoryMovement for today
      }
    }

    res.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({
      error: 'Failed to fetch dashboard stats',
      message: 'An error occurred while fetching dashboard statistics'
    })
  }
})

// =============================================
// RECENT ACTIVITIES ENDPOINT
// =============================================
router.get('/activities', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const companyId = user.companyId
    const isSuperAdmin = user.isSuperAdmin
    const limit = parseInt(req.query.limit as string) || 10

    let activities: any[] = []

    if (isSuperAdmin) {
      // Super Admin - Real system-wide activities from database
      // Get recent user registrations
      const recentUsers = await User.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('username createdAt')

      // Get recent company registrations
      const recentCompanies = await Company.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('companyName createdAt')

      // Convert to activity format
      recentUsers.forEach((newUser) => {
        activities.push({
          id: `user-${newUser._id}`,
          type: 'user',
          title: 'New User Registered',
          description: `User ${newUser.username} joined the system`,
          timestamp: newUser.createdAt.toISOString(),
          user: 'System',
          status: 'success'
        })
      })

      recentCompanies.forEach((company) => {
        activities.push({
          id: `company-${company._id}`,
          type: 'system',
          title: 'New Company Registered',
          description: `${company.companyName} registered in the system`,
          timestamp: company.createdAt.toISOString(),
          user: 'System Admin',
          status: 'info'
        })
      })

    } else {
      // Company-specific activities from database
      // Get recent users in this company
      const recentCompanyUsers = await User.find({
        'companyAccess.companyId': companyId,
        'companyAccess.isActive': true,
        isActive: true
      })
        .sort({ 'companyAccess.joinedAt': -1 })
        .limit(5)
        .select('username companyAccess')

      // Convert to activity format
      recentCompanyUsers.forEach((newUser) => {
        const companyAccess = newUser.companyAccess?.find((access: any) =>
          access.companyId.toString() === companyId
        )

        if (companyAccess) {
          activities.push({
            id: `company-user-${newUser._id}`,
            type: 'user',
            title: 'New Team Member',
            description: `${newUser.username} joined as ${companyAccess.role}`,
            timestamp: companyAccess.joinedAt?.toISOString() || new Date().toISOString(),
            user: 'HR Team',
            status: 'success'
          })
        }
      })

      // Add placeholder for future real activities when we have other models
      // These will be replaced with real data from:
      // - CustomerOrder model for order activities
      // - ProductionOrder model for production activities
      // - InventoryMovement model for inventory activities
      // - Invoice model for financial activities
    }

    // Sort activities by timestamp (newest first) and limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    res.json({
      success: true,
      data: activities.slice(0, limit)
    })

  } catch (error) {
    console.error('Dashboard activities error:', error)
    res.status(500).json({
      error: 'Failed to fetch activities',
      message: 'An error occurred while fetching recent activities'
    })
  }
})

// =============================================
// DASHBOARD OVERVIEW ENDPOINT
// =============================================
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    console.log('Dashboard request - User:', user ? { id: user.userId, username: user.username, isSuperAdmin: user.isSuperAdmin } : 'No user')

    if (!user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to access dashboard'
      })
    }

    const companyId = user.companyId
    const isSuperAdmin = user.isSuperAdmin

    // Get real stats from database
    let stats: any = {}

    if (isSuperAdmin) {
      // Super Admin - System-wide stats
      const totalCompanies = await Company.countDocuments({ isActive: true })
      const totalUsers = await User.countDocuments({ isActive: true })
      const activeUsers = await User.countDocuments({
        isActive: true,
        lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })

      // Get companies with user counts
      const companiesWithUsers = await Company.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: 'users',
            let: { companyId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$isActive', true] },
                      {
                        $anyElementTrue: {
                          $map: {
                            input: '$companyAccess',
                            as: 'access',
                            in: {
                              $and: [
                                { $eq: ['$$access.companyId', '$$companyId'] },
                                { $eq: ['$$access.isActive', true] }
                              ]
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            ],
            as: 'users'
          }
        },
        {
          $addFields: {
            userCount: { $size: '$users' },
            activeUserCount: {
              $size: {
                $filter: {
                  input: '$users',
                  cond: {
                    $gte: ['$$this.lastLoginAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]
                  }
                }
              }
            }
          }
        }
      ])

      const avgUsersPerCompany = totalCompanies > 0 ? Math.round(totalUsers / totalCompanies) : 0
      const systemHealth = 0 // Will be calculated from real system monitoring

      stats = {
        totalCompanies,
        totalUsers,
        activeUsers,
        totalEmployees: totalUsers,
        avgUsersPerCompany,
        systemHealth,
        totalOrders: 0, // Will be calculated from real order data
        totalRevenue: 0, // Will be calculated from real financial data
        monthlyRevenue: 0, // Will be calculated from real financial data
        outstandingPayments: 0, // Will be calculated from real financial data
        profitMargin: 0, // Will be calculated from real financial data
        companiesWithUsers: companiesWithUsers.length
      }
    } else {
      // Company-specific stats
      const companyUsers = await User.countDocuments({
        'companyAccess.companyId': companyId,
        'companyAccess.isActive': true,
        isActive: true
      })

      const activeCompanyUsers = await User.countDocuments({
        'companyAccess.companyId': companyId,
        'companyAccess.isActive': true,
        isActive: true,
        lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })

      // Get company details
      const company = await Company.findById(companyId)
      const companyAge = company ? Math.floor((Date.now() - company.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0

      stats = {
        totalEmployees: companyUsers,
        activeUsers: activeCompanyUsers,
        companyAge,
        totalOrders: 0, // Will be calculated from real order data
        totalRevenue: 0, // Will be calculated from real financial data
        monthlyRevenue: 0, // Will be calculated from real financial data
        outstandingPayments: 0, // Will be calculated from real financial data
        profitMargin: 0, // Will be calculated from real financial data
        totalCustomers: 0, // Will be calculated from real customer data
        totalProducts: 0, // Will be calculated from real product data
        totalProduction: 0, // Will be calculated from real production data
        totalInventory: 0, // Will be calculated from real inventory data
        productionEfficiency: 0, // Will be calculated from real production data
        qualityScore: 0, // Will be calculated from real quality data
        inventoryTurnover: 0 // Will be calculated from real inventory data
      }
    }

    // Get recent activities from database
    const recentActivities = await User.find({
      ...(isSuperAdmin ? {} : { 'companyAccess.companyId': companyId }),
      isActive: true
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username createdAt companyAccess')

    const activities = recentActivities.map((newUser) => ({
      id: `user-${newUser._id}`,
      type: 'user',
      title: 'New User Joined',
      description: `${newUser.username} joined the ${isSuperAdmin ? 'system' : 'company'}`,
      timestamp: newUser.createdAt.toISOString(),
      user: 'System',
      status: 'success'
    }))

    // Get user permissions
    const userAccess = user.companyAccess?.find((access: any) =>
      access.companyId.toString() === companyId && access.isActive
    )

    const permissions = {
      canViewFinancials: isSuperAdmin || userAccess?.permissions?.financial?.view || false,
      canViewProduction: isSuperAdmin || userAccess?.permissions?.production?.view || false,
      canViewInventory: isSuperAdmin || userAccess?.permissions?.inventory?.view || false,
      canViewOrders: isSuperAdmin || userAccess?.permissions?.orders?.view || false,
      canViewUsers: isSuperAdmin || userAccess?.permissions?.users?.view || false,
      canViewReports: isSuperAdmin || userAccess?.permissions?.financial?.viewReports || false
    }

    res.json({
      success: true,
      data: {
        stats,
        recentActivities: activities,
        permissions,
        user: {
          name: user.personalInfo?.firstName || user.username || 'User',
          role: isSuperAdmin ? 'super_admin' : userAccess?.role || 'user',
          isSuperAdmin
        }
      }
    })

  } catch (error) {
    console.error('Dashboard overview error:', error)
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: 'An error occurred while fetching dashboard overview'
    })
  }
})

export default router
