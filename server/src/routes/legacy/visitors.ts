import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import Visitor from '@/models/Visitor';
import { authenticate, requirePermission } from '@/middleware/auth';
import { businessLogger, apiLogger } from '@/utils/logger';
// import { VisitorController } from '@/controllers/VisitorController';
// import { uploadVisitorFiles, uploadSingle, validateUploadedFiles } from '@/middleware/upload';

const router = Router();
// const visitorController = new VisitorController();

// Validation middleware
const validateVisitor = [
  body('personalInfo.firstName').notEmpty().withMessage('First name is required'),
  body('personalInfo.lastName').notEmpty().withMessage('Last name is required'),
  body('contactInfo.primaryPhone').isMobilePhone('any').withMessage('Valid phone number is required'),
  body('visitInfo.visitType').isIn(['business', 'interview', 'meeting', 'delivery', 'maintenance', 'audit', 'training', 'personal', 'official', 'other']).withMessage('Valid visit type is required'),
  body('visitInfo.visitPurpose').notEmpty().withMessage('Visit purpose is required'),
  body('hostInfo.hostId').isMongoId().withMessage('Valid host ID is required'),
  body('hostInfo.hostName').notEmpty().withMessage('Host name is required'),
  body('hostInfo.hostDepartment').notEmpty().withMessage('Host department is required'),
  body('hostInfo.meetingLocation').notEmpty().withMessage('Meeting location is required')
];

const validateVisitorEntry = [
  body('entryGate').notEmpty().withMessage('Entry gate is required'),
  body('securityGuardId').isMongoId().withMessage('Valid security guard ID is required'),
  body('securityGuardName').notEmpty().withMessage('Security guard name is required'),
  body('temperatureCheck').optional().isFloat({ min: 90, max: 110 }).withMessage('Temperature must be between 90-110°F'),
  body('healthDeclaration').isBoolean().withMessage('Health declaration is required')
];

const validateVisitorExit = [
  body('exitGate').notEmpty().withMessage('Exit gate is required'),
  body('securityGuardId').isMongoId().withMessage('Valid security guard ID is required'),
  body('securityGuardName').notEmpty().withMessage('Security guard name is required'),
  body('belongingsReturned').isBoolean().withMessage('Belongings returned status is required')
];

// =============================================
// VISITOR CRUD OPERATIONS
// =============================================

// Get all visitors for company
router.get('/',
  authenticate,
  requirePermission('security', 'visitorManagement'),
  async (req: Request, res: Response) => {
    try {
      const { companyId } = req.user!;
      const { 
        page = 1, 
        limit = 20, 
        status, 
        visitType, 
        hostId, 
        startDate, 
        endDate,
        search 
      } = req.query;

      const query: any = { companyId, isActive: true };

      // Apply filters
      if (status) query.currentStatus = status;
      if (visitType) query['visitInfo.visitType'] = visitType;
      if (hostId) query['hostInfo.hostId'] = hostId;
      
      if (startDate || endDate) {
        query['visitInfo.scheduledDateTime'] = {};
        if (startDate) query['visitInfo.scheduledDateTime'].$gte = new Date(startDate as string);
        if (endDate) query['visitInfo.scheduledDateTime'].$lte = new Date(endDate as string);
      }

      // Text search
      if (search) {
        query.$text = { $search: search as string };
      }

      const visitors = await Visitor.find(query)
        .populate('hostInfo.hostId', 'personalInfo.firstName personalInfo.lastName')
        .populate('createdBy', 'personalInfo.firstName personalInfo.lastName')
        .sort({ 'visitInfo.scheduledDateTime': -1 })
        .limit(Number(limit) * Number(page))
        .skip((Number(page) - 1) * Number(limit));

      const total = await Visitor.countDocuments(query);

      apiLogger.response(req, res, {
        visitorsCount: visitors.length,
        totalVisitors: total
      });

      res.json({
        success: true,
        data: visitors,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching visitors:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch visitors',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Get visitor by ID
router.get('/:id', 
  authenticate, 
  requirePermission('security', 'visitorManagement'),
  param('id').isMongoId().withMessage('Valid visitor ID is required'),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { companyId } = req.user!;
      const visitor = await Visitor.findOne({ 
        _id: req.params.id, 
        companyId, 
        isActive: true 
      })
        .populate('hostInfo.hostId', 'personalInfo.firstName personalInfo.lastName email phone')
        .populate('createdBy', 'personalInfo.firstName personalInfo.lastName')
        .populate('entries.securityGuardId', 'personalInfo.firstName personalInfo.lastName')
        .populate('exits.securityGuardId', 'personalInfo.firstName personalInfo.lastName');

      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: 'Visitor not found'
        });
      }

      res.json({
        success: true,
        data: visitor
      });
    } catch (error) {
      console.error('Error fetching visitor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch visitor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Create new visitor
router.post('/', 
  authenticate, 
  requirePermission('security', 'visitorManagement'),
  validateVisitor,
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { companyId, userId } = req.user!;

      // Generate visitor ID and number
      const visitorCount = await Visitor.countDocuments({ companyId });
      const visitorNumber = `VIS${new Date().getFullYear()}${String(visitorCount + 1).padStart(4, '0')}`;
      const visitorId = `${companyId}_${visitorNumber}`;

      const visitor = new Visitor({
        ...req.body,
        companyId,
        visitorId,
        visitorNumber,
        createdBy: userId
      });

      await visitor.save();

      businessLogger.userAction(
        userId.toString(),
        'create_visitor',
        'visitor',
        { visitorId: visitor._id, visitorNumber }
      );

      res.status(201).json({
        success: true,
        message: 'Visitor created successfully',
        data: visitor
      });
    } catch (error) {
      console.error('Error creating visitor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create visitor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Update visitor
router.put('/:id', 
  authenticate, 
  requirePermission('security', 'visitorManagement'),
  param('id').isMongoId().withMessage('Valid visitor ID is required'),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { companyId, userId } = req.user!;
      const visitor = await Visitor.findOneAndUpdate(
        { _id: req.params.id, companyId, isActive: true },
        { ...req.body, lastModifiedBy: userId },
        { new: true, runValidators: true }
      );

      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: 'Visitor not found'
        });
      }

      businessLogger.userAction(
        userId.toString(),
        'update_visitor',
        'visitor',
        { visitorId: visitor._id, visitorNumber: visitor.visitorNumber }
      );

      res.json({
        success: true,
        message: 'Visitor updated successfully',
        data: visitor
      });
    } catch (error) {
      console.error('Error updating visitor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update visitor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// =============================================
// VISITOR ENTRY/EXIT OPERATIONS
// =============================================

// Check-in visitor
router.post('/:id/checkin', 
  authenticate, 
  requirePermission('security', 'gateManagement'),
  param('id').isMongoId().withMessage('Valid visitor ID is required'),
  validateVisitorEntry,
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { companyId, userId } = req.user!;
      const visitor = await Visitor.findOne({ 
        _id: req.params.id, 
        companyId, 
        isActive: true 
      });

      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: 'Visitor not found'
        });
      }

      // Check if visitor is approved
      if (visitor.overallApprovalStatus !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Visitor is not approved for entry'
        });
      }

      // Check if visitor is already inside
      if (visitor.isCurrentlyInside()) {
        return res.status(400).json({
          success: false,
          message: 'Visitor is already checked in'
        });
      }

      // Add entry record
      visitor.entries.push({
        ...req.body,
        entryDateTime: new Date()
      });

      visitor.currentStatus = 'checked_in';
      visitor.lastModifiedBy = userId;

      await visitor.save();

      businessLogger.userAction(
        userId.toString(),
        'visitor_checkin',
        'visitor',
        { 
          visitorId: visitor._id, 
          visitorName: visitor.personalInfo.fullName,
          entryGate: req.body.entryGate 
        }
      );

      res.json({
        success: true,
        message: 'Visitor checked in successfully',
        data: visitor
      });
    } catch (error) {
      console.error('Error checking in visitor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check in visitor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Check-out visitor
router.post('/:id/checkout', 
  authenticate, 
  requirePermission('security', 'gateManagement'),
  param('id').isMongoId().withMessage('Valid visitor ID is required'),
  validateVisitorExit,
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { companyId, userId } = req.user!;
      const visitor = await Visitor.findOne({ 
        _id: req.params.id, 
        companyId, 
        isActive: true 
      });

      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: 'Visitor not found'
        });
      }

      // Check if visitor is inside
      if (!visitor.isCurrentlyInside()) {
        return res.status(400).json({
          success: false,
          message: 'Visitor is not currently inside'
        });
      }

      const lastEntry = visitor.getLastEntry();
      const exitDateTime = new Date();
      const totalDuration = lastEntry ? 
        Math.floor((exitDateTime.getTime() - lastEntry.entryDateTime.getTime()) / (1000 * 60)) : 0;

      // Add exit record
      visitor.exits.push({
        ...req.body,
        exitDateTime,
        totalDuration
      });

      visitor.currentStatus = 'checked_out';
      visitor.lastModifiedBy = userId;

      await visitor.save();

      businessLogger.userAction(
        userId.toString(),
        'visitor_checkout',
        'visitor',
        { 
          visitorId: visitor._id, 
          visitorName: visitor.personalInfo.fullName,
          exitGate: req.body.exitGate,
          duration: totalDuration 
        }
      );

      res.json({
        success: true,
        message: 'Visitor checked out successfully',
        data: visitor
      });
    } catch (error) {
      console.error('Error checking out visitor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check out visitor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// =============================================
// VISITOR REPORTS & ANALYTICS
// =============================================

// Get visitors currently inside
router.get('/reports/currently-inside', 
  authenticate, 
  requirePermission('security', 'securityReports'),
  async (req: Request, res: Response) => {
    try {
      const { companyId } = req.user!;
      const visitors = await Visitor.findCurrentlyInside(companyId.toString())
        .populate('hostInfo.hostId', 'personalInfo.firstName personalInfo.lastName')
        .select('personalInfo visitInfo hostInfo entries currentStatus');

      res.json({
        success: true,
        data: visitors,
        count: visitors.length
      });
    } catch (error) {
      console.error('Error fetching visitors inside:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch visitors currently inside',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Get today's scheduled visitors
router.get('/reports/scheduled-today', 
  authenticate, 
  requirePermission('security', 'visitorManagement'),
  async (req: Request, res: Response) => {
    try {
      const { companyId } = req.user!;
      const visitors = await Visitor.findScheduledToday(companyId.toString())
        .populate('hostInfo.hostId', 'personalInfo.firstName personalInfo.lastName')
        .select('personalInfo visitInfo hostInfo currentStatus overallApprovalStatus');

      res.json({
        success: true,
        data: visitors,
        count: visitors.length
      });
    } catch (error) {
      console.error('Error fetching scheduled visitors:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch scheduled visitors',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Get overstaying visitors
router.get('/reports/overstaying', 
  authenticate, 
  requirePermission('security', 'securityReports'),
  async (req: Request, res: Response) => {
    try {
      const { companyId } = req.user!;
      const visitors = await Visitor.findOverstaying(companyId.toString());

      res.json({
        success: true,
        data: visitors,
        count: visitors.length
      });
    } catch (error) {
      console.error('Error fetching overstaying visitors:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch overstaying visitors',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// =============================================
// FILE UPLOAD ROUTES (TEMPORARILY COMMENTED OUT)
// =============================================

/*
// Create visitor with file uploads
router.post(
  '/with-files',
  authenticate,
  requirePermission('visitors', 'create'),
  uploadVisitorFiles,
  validateUploadedFiles,
  visitorController.create.bind(visitorController)
);

// Upload entry photo
router.post(
  '/:id/entry-photo',
  authenticate,
  requirePermission('visitors', 'update'),
  uploadSingle('entryPhoto', 'visitors/entry'),
  validateUploadedFiles,
  visitorController.uploadEntryPhoto.bind(visitorController)
);

// Upload exit photo
router.post(
  '/:id/exit-photo',
  authenticate,
  requirePermission('visitors', 'update'),
  uploadSingle('exitPhoto', 'visitors/exit'),
  validateUploadedFiles,
  visitorController.uploadExitPhoto.bind(visitorController)
);

// Get presigned URL for file upload
router.post(
  '/upload-url',
  authenticate,
  requirePermission('visitors', 'create'),
  visitorController.getUploadUrl.bind(visitorController)
);

// Get presigned URL for file download
router.get(
  '/download/:key',
  authenticate,
  requirePermission('visitors', 'view'),
  visitorController.getDownloadUrl.bind(visitorController)
);
*/

export default router;
