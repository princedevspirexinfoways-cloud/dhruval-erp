import express from 'express';
import { authenticate } from '../../middleware/auth';
import Company from '../../models/Company';
import User from '../../models/User';
import { EnhancedDispatchService } from '../../services/EnhancedDispatchService';

const router = express.Router();
const enhancedDispatchService = new EnhancedDispatchService();

// Get all dispatches with filtering
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, priority, companyId, assignedTo, search } = req.query;
    const filters: any = {};
    
    if (status && status !== 'all') filters.status = status;
    if (priority && priority !== 'all') filters.priority = priority;
    if (companyId) filters.companyId = companyId;
    if (assignedTo) filters.assignedTo = assignedTo;
    
    // Add user info for filtering
    filters.user = req.user;
    
    const dispatches = await enhancedDispatchService.getDispatches(filters, search as string);
    res.json(dispatches);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dispatches', error: error.message });
  }
});

// Get dispatch by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const dispatch = await enhancedDispatchService.getDispatchById(req.params.id);
    if (!dispatch) {
      return res.status(404).json({ message: 'Dispatch not found' });
    }
    res.json(dispatch);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dispatch', error: error.message });
  }
});

// Create new dispatch
router.post('/', authenticate, async (req, res) => {
  try {
                    const {
                  dispatchNumber,
                  dispatchDate,
                  dispatchType,
                  status,
                  priority,
                  companyId,
                  sourceWarehouseId,
                  customerOrderId,
                  vehicleNumber,
                  deliveryPersonName,
                  deliveryPersonNumber,
                  documents,
                  notes
                } = req.body;
    
                    // Validate required fields
                if (!sourceWarehouseId || !customerOrderId) {
                  return res.status(400).json({ message: 'Missing required fields: source warehouse and customer order' });
                }

    // Auto-fill company ID for non-superadmin users
    let finalCompanyId = companyId;
    if (!req.user.isSuperAdmin) {
      finalCompanyId = req.user.companyId;
    }

    const dispatchData = {
      dispatchNumber, // Will be auto-generated if not provided
      dispatchDate: dispatchDate || new Date(),
      dispatchType: dispatchType || 'pickup', // Default to pickup
      status: status || 'pending',
      priority: priority || 'medium',
      companyId: finalCompanyId,
      sourceWarehouseId,
      customerOrderId,
      vehicleNumber,
      deliveryPersonName,
      deliveryPersonNumber,
      documents,
      notes,
      createdBy: req.user._id
    };

    const dispatch = await enhancedDispatchService.createDispatch(dispatchData);
    res.status(201).json(dispatch);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create dispatch', error: error.message });
  }
});

// Update dispatch
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo, dueDate, location, vehicleId, vehicleNumber } = req.body;
    
    const updateData = {
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate,
      location,
      vehicleId,
      vehicleNumber
    };

    const dispatch = await enhancedDispatchService.updateDispatch(req.params.id, updateData);
    if (!dispatch) {
      return res.status(404).json({ message: 'Dispatch not found' });
    }
    res.json(dispatch);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update dispatch', error: error.message });
  }
});

// Delete dispatch
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const success = await enhancedDispatchService.deleteDispatch(req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'Dispatch not found' });
    }
    res.json({ message: 'Dispatch deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete dispatch', error: error.message });
  }
});

// Get companies for superadmin
router.get('/companies/list', authenticate, async (req, res) => {
  try {
    if (!req.user.isSuperAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const companies = await Company.find({}, 'id name');
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch companies', error: error.message });
  }
});

// Get users for assignment
router.get('/users/list', authenticate, async (req, res) => {
  try {
    let query = {};
    if (!req.user.isSuperAdmin) {
      query = { companyId: req.user.companyId };
    }
    const users = await User.find(query, 'id name email role');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// =============================================
// S3 PRESIGNED URL ROUTES
// =============================================

// Get presigned URL for file upload
router.post('/upload-url', authenticate, async (req, res) => {
  try {
    const { fileName, contentType, fileType } = req.body;
    
    if (!fileName || !contentType) {
      return res.status(400).json({ message: 'fileName and contentType are required' });
    }

    // Generate unique file key
    const timestamp = Date.now();
    const fileKey = `dispatches/${req.user.companyId}/${timestamp}-${fileName}`;
    
    // Get presigned URL from S3 service
    const uploadData = await enhancedDispatchService.getUploadUrl(fileKey, contentType);
    
    // Generate public URL for the uploaded file
    const publicUrl = enhancedDispatchService.generatePublicUrl(uploadData.key);
    
    res.json({
      uploadUrl: uploadData.uploadUrl,
      key: uploadData.key,
      publicUrl: publicUrl,
      expiresAt: uploadData.expiresAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate upload URL', error: error.message });
  }
});

// Get presigned URL for file download
router.get('/download/:key', authenticate, async (req, res) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json({ message: 'File key is required' });
    }

    // Get download URL from S3 service
    const downloadUrl = await enhancedDispatchService.getDownloadUrl(key);
    
    res.json({
      success: true,
      downloadUrl,
      message: 'Download URL generated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate download URL', error: error.message });
  }
});

export default router;
