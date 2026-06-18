import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import User from '@/models/User'
import Company from '@/models/Company'
import logger from '@/utils/logger'

const router = Router()

// Setup super admin (development only)
router.post('/superadmin', async (req: Request, res: Response) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Not allowed in production',
        message: 'This endpoint is only available in development mode'
      })
    }

    logger.info('Setting up super admin...')

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ isSuperAdmin: true })

    if (existingSuperAdmin) {
      logger.info('Super admin already exists', {
        username: existingSuperAdmin.username,
        email: existingSuperAdmin.email,
        isSuperAdmin: existingSuperAdmin.isSuperAdmin
      })

      // Update to ensure isSuperAdmin is true and active
      await User.updateOne(
        { _id: existingSuperAdmin._id },
        { 
          $set: { 
            isSuperAdmin: true,
            isActive: true 
          } 
        }
      )

      return res.json({
        success: true,
        message: 'Super admin already exists and has been updated',
        data: {
          username: existingSuperAdmin.username,
          email: existingSuperAdmin.email,
          isSuperAdmin: true
        }
      })
    }

    // Create super admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)

    const superAdmin = new User({
      username: 'superadmin',
      email: 'admin@erpsystem.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      fullName: 'Super Admin',
      isSuperAdmin: true,
      isActive: true,
      companyAccess: [], // Super admin doesn't need specific company access
      preferences: {
        dashboard: {}
      }
    })

    await superAdmin.save()

    logger.info('Super admin created successfully', {
      username: superAdmin.username,
      email: superAdmin.email,
      isSuperAdmin: superAdmin.isSuperAdmin
    })

    res.json({
      success: true,
      message: 'Super admin created successfully',
      data: {
        username: superAdmin.username,
        email: superAdmin.email,
        isSuperAdmin: true
      },
      credentials: {
        username: 'superadmin',
        password: 'admin123',
        email: 'admin@erpsystem.com'
      }
    })

  } catch (error) {
    logger.error('Error setting up super admin:', error)
    res.status(500).json({
      error: 'Failed to setup super admin',
      message: error.message
    })
  }
})

// Check super admin status
router.get('/superadmin/status', async (req: Request, res: Response) => {
  try {
    const superAdmin = await User.findOne({ isSuperAdmin: true }).select('username email isSuperAdmin isActive')
    const allCompanies = await Company.find({ isActive: true }).select('_id companyName companyCode').lean()

    res.json({
      success: true,
      data: {
        superAdminExists: !!superAdmin,
        superAdmin: superAdmin ? {
          username: superAdmin.username,
          email: superAdmin.email,
          isSuperAdmin: superAdmin.isSuperAdmin,
          isActive: superAdmin.isActive
        } : null,
        totalCompanies: allCompanies.length,
        companies: allCompanies
      }
    })

  } catch (error) {
    logger.error('Error checking super admin status:', error)
    res.status(500).json({
      error: 'Failed to check super admin status',
      message: error.message
    })
  }
})

// Fix super admin company access
router.post('/superadmin/fix-access', async (req: Request, res: Response) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Not allowed in production',
        message: 'This endpoint is only available in development mode'
      })
    }

    const superAdmin = await User.findOne({ isSuperAdmin: true })
    
    if (!superAdmin) {
      return res.status(404).json({
        error: 'Super admin not found',
        message: 'Please create super admin first'
      })
    }

    // Update super admin to ensure proper access
    await User.updateOne(
      { _id: superAdmin._id },
      { 
        $set: { 
          isSuperAdmin: true,
          isActive: true,
          companyAccess: [] // Super admin doesn't need specific company access
        } 
      }
    )

    logger.info('Super admin access fixed', {
      userId: superAdmin._id,
      username: superAdmin.username
    })

    res.json({
      success: true,
      message: 'Super admin access has been fixed',
      data: {
        username: superAdmin.username,
        email: superAdmin.email,
        isSuperAdmin: true,
        isActive: true
      }
    })

  } catch (error) {
    logger.error('Error fixing super admin access:', error)
    res.status(500).json({
      error: 'Failed to fix super admin access',
      message: error.message
    })
  }
})

// Reset super admin password
router.post('/superadmin/reset-password', async (req: Request, res: Response) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Not allowed in production',
        message: 'This endpoint is only available in development mode'
      })
    }

    const { password = 'admin123' } = req.body

    const superAdmin = await User.findOne({ isSuperAdmin: true })

    if (!superAdmin) {
      return res.status(404).json({
        error: 'Super admin not found',
        message: 'Please create super admin first'
      })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update super admin password
    await User.updateOne(
      { _id: superAdmin._id },
      {
        $set: {
          password: hashedPassword,
          isSuperAdmin: true,
          isActive: true
        }
      }
    )

    logger.info('Super admin password reset', {
      userId: superAdmin._id,
      username: superAdmin.username
    })

    res.json({
      success: true,
      message: 'Super admin password has been reset',
      data: {
        username: superAdmin.username,
        email: superAdmin.email,
        newPassword: password
      }
    })

  } catch (error) {
    logger.error('Error resetting super admin password:', error)
    res.status(500).json({
      error: 'Failed to reset super admin password',
      message: error.message
    })
  }
})

export default router
