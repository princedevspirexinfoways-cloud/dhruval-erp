import express from 'express';
import { authenticate } from '../middleware/auth';
import { Dispatch } from '../models/Dispatch';
import Company from '../models/Company';
import User from '../models/User';

const router = express.Router();

// Get all dispatches (filtered by company for non-superadmin users)
router.get('/', authenticate, async (req, res) => {
  try {
    const { user } = req as any;
    let query: any = {};

    // If not superadmin, filter by company
    if (!user.isSuperAdmin) {
      query.companyId = user.companyId;
    }

    const dispatches = await Dispatch.find(query)
      .populate('assignedTo', 'name email')
      .populate('companyId', 'name')
      .sort({ createdAt: -1 });

    res.json(dispatches);
  } catch (error) {
    console.error('Error fetching dispatches:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get dispatch by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req as any;

    const dispatch = await Dispatch.findById(id)
      .populate('assignedTo', 'name email')
      .populate('companyId', 'name');

    if (!dispatch) {
      return res.status(404).json({ message: 'Dispatch not found' });
    }

    // Check if user has access to this dispatch
    if (!user.isSuperAdmin && dispatch.companyId.toString() !== user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(dispatch);
  } catch (error) {
    console.error('Error fetching dispatch:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new dispatch
router.post('/', authenticate, async (req, res) => {
  try {
    const { user } = req as any;
    const {
      title,
      description,
      status,
      priority,
      assignedTo,
      companyId,
      dueDate,
      location,
      vehicleId,
      vehicleNumber
    } = req.body;

    // Validate required fields
    if (!title || !description || !assignedTo || !dueDate || !location) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Set company ID based on user role
    let finalCompanyId = companyId;
    if (!user.isSuperAdmin) {
      finalCompanyId = user.companyId;
    } else if (!companyId) {
      return res.status(400).json({ message: 'Company ID is required for superadmin' });
    }

    // Verify company exists
    const company = await Company.findById(finalCompanyId);
    if (!company) {
      return res.status(400).json({ message: 'Invalid company ID' });
    }

    // Verify assigned user exists
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(400).json({ message: 'Invalid assigned user ID' });
    }

    const dispatch = new Dispatch({
      title,
      description,
      status: status || 'pending',
      priority: priority || 'medium',
      assignedTo,
      companyId: finalCompanyId,
      dueDate,
      location,
      vehicleId,
      vehicleNumber,
      createdBy: user.id
    });

    await dispatch.save();

    const populatedDispatch = await Dispatch.findById(dispatch._id)
      .populate('assignedTo', 'name email')
      .populate('companyId', 'name');

    res.status(201).json(populatedDispatch);
  } catch (error) {
    console.error('Error creating dispatch:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update dispatch
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req as any;
    const {
      dispatchNumber,
      dispatchDate,
      dispatchType,
      status,
      priority,
      assignedTo,
      companyId,
      sourceWarehouseId,
      customerOrderId,
      vehicleNumber,
      deliveryPersonName,
      deliveryPersonNumber,
      notes
    } = req.body;

    const dispatch = await Dispatch.findById(id);
    if (!dispatch) {
      return res.status(404).json({ message: 'Dispatch not found' });
    }

    // Check if user has access to this dispatch
    if (!user.isSuperAdmin && dispatch.companyId.toString() !== user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate required fields
    if (!sourceWarehouseId || !customerOrderId) {
      return res.status(400).json({ message: 'Missing required fields: source warehouse and customer order' });
    }

    // Set company ID based on user role
    let finalCompanyId = companyId;
    if (!user.isSuperAdmin) {
      finalCompanyId = user.companyId;
    } else if (!companyId) {
      return res.status(400).json({ message: 'Company ID is required for superadmin' });
    }

    // Verify company exists
    const company = await Company.findById(finalCompanyId);
    if (!company) {
      return res.status(400).json({ message: 'Invalid company ID' });
    }

    // Verify assigned user exists
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(400).json({ message: 'Invalid assigned user ID' });
    }

    // Update dispatch
    dispatch.dispatchNumber = dispatchNumber;
    dispatch.dispatchDate = dispatchDate;
    dispatch.dispatchType = dispatchType;
    dispatch.status = status;
    dispatch.priority = priority;
    dispatch.assignedTo = assignedTo;
    dispatch.companyId = finalCompanyId;
    dispatch.sourceWarehouseId = sourceWarehouseId;
    dispatch.customerOrderId = customerOrderId;
    dispatch.vehicleNumber = vehicleNumber;
    dispatch.deliveryPersonName = deliveryPersonName;
    dispatch.deliveryPersonNumber = deliveryPersonNumber;
    dispatch.notes = notes;
    dispatch.updatedAt = new Date();

    await dispatch.save();

    const updatedDispatch = await Dispatch.findById(id)
      .populate('assignedTo', 'name email')
      .populate('companyId', 'name');

    res.json(updatedDispatch);
  } catch (error) {
    console.error('Error updating dispatch:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete dispatch
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req as any;

    const dispatch = await Dispatch.findById(id);
    if (!dispatch) {
      return res.status(404).json({ message: 'Dispatch not found' });
    }

    // Check if user has access to this dispatch
    if (!user.isSuperAdmin && dispatch.companyId.toString() !== user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Dispatch.findByIdAndDelete(id);
    res.json({ message: 'Dispatch deleted successfully' });
  } catch (error) {
    console.error('Error deleting dispatch:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
