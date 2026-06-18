import { Router, Request, Response } from 'express'
import { authenticate, requireCompany } from '@/middleware/auth'
import User from '@/models/User'
import Company from '@/models/Company'
import mongoose from 'mongoose'

const router = Router()

// Apply authentication middleware to all report routes
router.use(authenticate)
router.use(requireCompany)

// =============================================
// USER ANALYTICS REPORT
// =============================================
router.get('/user-analytics', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const companyId = user.companyId
    const isSuperAdmin = user.isSuperAdmin

    let userAnalytics: any = {}

    if (isSuperAdmin) {
      // Super Admin - System-wide user analytics
      const totalUsers = await User.countDocuments({ isActive: true })
      const activeUsers = await User.countDocuments({ 
        isActive: true, 
        lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      })
      
      // User registration trends (last 12 months)
      const userTrends = await User.aggregate([
        {
          $match: {
            isActive: true,
            createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ])

      // Users by company
      const usersByCompany = await User.aggregate([
        {
          $match: { isActive: true }
        },
        {
          $unwind: '$companyAccess'
        },
        {
          $match: { 'companyAccess.isActive': true }
        },
        {
          $lookup: {
            from: 'companies',
            localField: 'companyAccess.companyId',
            foreignField: '_id',
            as: 'company'
          }
        },
        {
          $unwind: '$company'
        },
        {
          $group: {
            _id: '$company.companyName',
            userCount: { $sum: 1 },
            roles: { $push: '$companyAccess.role' }
          }
        },
        {
          $sort: { userCount: -1 }
        }
      ])

      userAnalytics = {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        userTrends: userTrends.map(trend => ({
          month: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
          users: trend.count
        })),
        usersByCompany
      }

    } else {
      // Company-specific user analytics
      const companyUsers = await User.find({
        'companyAccess.companyId': companyId,
        'companyAccess.isActive': true,
        isActive: true
      }).populate('companyAccess.companyId', 'companyName')

      const totalCompanyUsers = companyUsers.length
      const activeCompanyUsers = companyUsers.filter(u => 
        u.security?.lastLogin && u.security.lastLogin >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length

      // Role distribution
      const roleDistribution = companyUsers.reduce((acc: any, user) => {
        const userAccess = user.companyAccess?.find((access: any) => 
          access.companyId.toString() === companyId && access.isActive
        )
        if (userAccess) {
          acc[userAccess.role] = (acc[userAccess.role] || 0) + 1
        }
        return acc
      }, {})

      // User activity trends
      const userActivityTrends = await User.aggregate([
        {
          $match: {
            'companyAccess.companyId': new mongoose.Types.ObjectId(companyId),
            'companyAccess.isActive': true,
            isActive: true,
            lastLoginAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$lastLoginAt' },
              month: { $month: '$lastLoginAt' },
              day: { $dayOfMonth: '$lastLoginAt' }
            },
            activeUsers: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
      ])

      userAnalytics = {
        totalUsers: totalCompanyUsers,
        activeUsers: activeCompanyUsers,
        inactiveUsers: totalCompanyUsers - activeCompanyUsers,
        roleDistribution,
        activityTrends: userActivityTrends.map(trend => ({
          date: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}-${String(trend._id.day).padStart(2, '0')}`,
          activeUsers: trend.activeUsers
        }))
      }
    }

    res.json({
      success: true,
      data: userAnalytics
    })

  } catch (error) {
    console.error('User analytics error:', error)
    res.status(500).json({
      error: 'Failed to fetch user analytics',
      message: 'An error occurred while generating user analytics report'
    })
  }
})

// =============================================
// COMPANY PERFORMANCE REPORT
// =============================================
router.get('/company-performance', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const companyId = user.companyId
    const isSuperAdmin = user.isSuperAdmin

    if (!isSuperAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only super admins can access company performance reports'
      })
    }

    // Get all companies with their user counts
    const companyPerformance = await Company.aggregate([
      {
        $match: { isActive: true }
      },
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
          activeUsers: {
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
      },
      {
        $project: {
          companyName: 1,
          companyCode: 1,
          industry: 1,
          status: 1,
          createdAt: 1,
          userCount: 1,
          activeUsers: 1,
          inactiveUsers: { $subtract: ['$userCount', '$activeUsers'] }
        }
      },
      {
        $sort: { userCount: -1 }
      }
    ])

    // Company growth trends
    const companyGrowthTrends = await Company.aggregate([
      {
        $match: {
          isActive: true,
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          newCompanies: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ])

    res.json({
      success: true,
      data: {
        companyPerformance,
        growthTrends: companyGrowthTrends.map(trend => ({
          month: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
          newCompanies: trend.newCompanies
        })),
        totalCompanies: companyPerformance.length,
        totalUsers: companyPerformance.reduce((sum, company) => sum + company.userCount, 0),
        averageUsersPerCompany: Math.round(
          companyPerformance.reduce((sum, company) => sum + company.userCount, 0) / companyPerformance.length
        )
      }
    })

  } catch (error) {
    console.error('Company performance error:', error)
    res.status(500).json({
      error: 'Failed to fetch company performance',
      message: 'An error occurred while generating company performance report'
    })
  }
})

// =============================================
// SYSTEM HEALTH REPORT
// =============================================
router.get('/system-health', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const isSuperAdmin = user.isSuperAdmin

    if (!isSuperAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only super admins can access system health reports'
      })
    }

    // Database health metrics
    const dbStats = await mongoose.connection.db.stats()
    
    // User activity metrics
    const userMetrics = await User.aggregate([
      {
        $facet: {
          totalUsers: [{ $match: { isActive: true } }, { $count: 'count' }],
          activeUsers: [
            { 
              $match: { 
                isActive: true,
                lastLoginAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
              } 
            },
            { $count: 'count' }
          ],
          newUsersToday: [
            {
              $match: {
                isActive: true,
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
              }
            },
            { $count: 'count' }
          ]
        }
      }
    ])

    const systemHealth = {
      database: {
        status: 'healthy',
        collections: dbStats.collections,
        dataSize: Math.round(dbStats.dataSize / 1024 / 1024), // MB
        storageSize: Math.round(dbStats.storageSize / 1024 / 1024), // MB
        indexes: dbStats.indexes
      },
      users: {
        total: userMetrics[0].totalUsers[0]?.count || 0,
        activeToday: userMetrics[0].activeUsers[0]?.count || 0,
        newToday: userMetrics[0].newUsersToday[0]?.count || 0
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
      }
    }

    res.json({
      success: true,
      data: systemHealth
    })

  } catch (error) {
    console.error('System health error:', error)
    res.status(500).json({
      error: 'Failed to fetch system health',
      message: 'An error occurred while generating system health report'
    })
  }
})

// =============================================
// FINANCIAL REPORTS
// =============================================
router.get('/financial', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const companyId = user.companyId
    const isSuperAdmin = user.isSuperAdmin
    const { startDate, endDate, period = '30d' } = req.query

    // Calculate date range
    let dateFilter: any = {}
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      }
    } else {
      const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30
      dateFilter = {
        createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
      }
    }

    let financialReport: any = {}

    if (isSuperAdmin) {
      // System-wide financial overview
      const totalCompanies = await Company.countDocuments({ isActive: true })

      financialReport = {
        overview: {
          totalCompanies,
          totalRevenue: 0, // Will be calculated from Invoice model
          totalExpenses: 0, // Will be calculated from Expense model
          netProfit: 0,
          averageRevenuePerCompany: 0
        },
        trends: {
          monthlyRevenue: [], // Revenue trends by month
          expenseBreakdown: [], // Expenses by category
          profitMargins: [] // Profit margin trends
        },
        topPerformingCompanies: [] // Companies by revenue
      }
    } else {
      // Company-specific financial report
      financialReport = {
        overview: {
          totalRevenue: 0, // From Invoice model where companyId matches
          totalExpenses: 0, // From Expense model where companyId matches
          netProfit: 0,
          profitMargin: 0,
          outstandingInvoices: 0, // Unpaid invoices
          overduePayments: 0 // Overdue payments
        },
        cashFlow: {
          inflow: [], // Revenue by month
          outflow: [], // Expenses by month
          netFlow: [] // Net cash flow
        },
        invoiceAnalysis: {
          totalInvoices: 0,
          paidInvoices: 0,
          pendingInvoices: 0,
          overdueInvoices: 0,
          averageInvoiceValue: 0
        },
        expenseBreakdown: [] // Expenses by category
      }
    }

    res.json({
      success: true,
      data: financialReport,
      period,
      dateRange: { startDate, endDate }
    })

  } catch (error) {
    console.error('Financial report error:', error)
    res.status(500).json({
      error: 'Failed to generate financial report',
      message: 'An error occurred while generating financial report'
    })
  }
})

// =============================================
// PRODUCTION REPORTS
// =============================================
router.get('/production', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const companyId = user.companyId
    const { startDate, endDate, period = '30d' } = req.query

    // Calculate date range
    let dateFilter: any = {}
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      }
    } else {
      const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30
      dateFilter = {
        createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
      }
    }

    const productionReport = {
      overview: {
        totalOrders: 0, // From ProductionOrder model
        completedOrders: 0, // Completed production orders
        inProgressOrders: 0, // In-progress orders
        pendingOrders: 0, // Pending orders
        totalQuantityProduced: 0,
        averageCompletionTime: 0, // In hours
        onTimeDeliveryRate: 0 // Percentage
      },
      efficiency: {
        productionEfficiency: 0, // Actual vs planned production
        machineUtilization: 0, // Machine usage percentage
        laborEfficiency: 0, // Labor productivity
        qualityRate: 0, // Quality pass rate
        wastePercentage: 0 // Material waste
      },
      trends: {
        dailyProduction: [], // Production by day
        weeklyTrends: [], // Weekly production trends
        monthlyTargets: [], // Monthly targets vs actual
        productionByLine: [] // Production by production line
      },
      qualityMetrics: {
        totalQualityChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        qualityScore: 0,
        defectRate: 0,
        reworkRate: 0
      },
      resourceUtilization: {
        machineHours: 0,
        laborHours: 0,
        materialConsumption: 0,
        energyConsumption: 0
      }
    }

    res.json({
      success: true,
      data: productionReport,
      period,
      dateRange: { startDate, endDate }
    })

  } catch (error) {
    console.error('Production report error:', error)
    res.status(500).json({
      error: 'Failed to generate production report',
      message: 'An error occurred while generating production report'
    })
  }
})

export default router
