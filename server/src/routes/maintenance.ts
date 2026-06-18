import express from 'express';
import { authenticate } from '../middleware/auth';
import { MaintenanceSchedule, MaintenanceRecord } from '../models/Maintenance';
import Spare from '../models/Spare';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all maintenance schedules for a spare
router.get('/schedules/:spareId', async (req, res) => {
  try {
    const { spareId } = req.params;
    const schedules = await MaintenanceSchedule.find({ spareId })
      .sort({ createdAt: -1 });
    
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching maintenance schedules', error: error.message });
  }
});

// Create a new maintenance schedule
router.post('/schedules', async (req, res) => {
  try {
    const {
      spareId,
      scheduleType,
      frequency,
      frequencyUnit,
      priority,
      assignedTechnician,
      estimatedDuration,
      estimatedCost,
      maintenanceNotes,
      isActive = true
    } = req.body;

    const schedule = new MaintenanceSchedule({
      spareId,
      scheduleType,
      frequency,
      frequencyUnit,
      priority,
      assignedTechnician,
      estimatedDuration,
      estimatedCost,
      maintenanceNotes,
      isActive,
      companyId: req.user.companyId
    });

    await schedule.save();
    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Error creating maintenance schedule', error: error.message });
  }
});

// Update a maintenance schedule
router.put('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const schedule = await MaintenanceSchedule.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!schedule) {
      return res.status(404).json({ message: 'Maintenance schedule not found' });
    }

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Error updating maintenance schedule', error: error.message });
  }
});

// Delete a maintenance schedule
router.delete('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await MaintenanceSchedule.findByIdAndDelete(id);

    if (!schedule) {
      return res.status(404).json({ message: 'Maintenance schedule not found' });
    }

    res.json({ message: 'Maintenance schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting maintenance schedule', error: error.message });
  }
});

// Get all maintenance records for a spare
router.get('/records/:spareId', async (req, res) => {
  try {
    const { spareId } = req.params;
    const records = await MaintenanceRecord.find({ spareId })
      .sort({ date: -1 });
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching maintenance records', error: error.message });
  }
});

// Create a new maintenance record
router.post('/records', async (req, res) => {
  try {
    const {
      spareId,
      date,
      type,
      description,
      technician,
      duration,
      cost,
      partsUsed,
      status,
      notes,
      images,
      nextMaintenanceDate
    } = req.body;

    const record = new MaintenanceRecord({
      spareId,
      date,
      type,
      description,
      technician,
      duration,
      cost,
      partsUsed,
      status,
      notes,
      images,
      nextMaintenanceDate,
      companyId: req.user.companyId
    });

    await record.save();

    // Update the spare's last maintenance date
    await Spare.findByIdAndUpdate(spareId, {
      'maintenance.lastMaintenance': date,
      'maintenance.nextMaintenance': nextMaintenanceDate
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Error creating maintenance record', error: error.message });
  }
});

// Update a maintenance record
router.put('/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const record = await MaintenanceRecord.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: 'Error updating maintenance record', error: error.message });
  }
});

// Delete a maintenance record
router.delete('/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const record = await MaintenanceRecord.findByIdAndDelete(id);

    if (!record) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    res.json({ message: 'Maintenance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting maintenance record', error: error.message });
  }
});

// Get maintenance analytics for a spare
router.get('/analytics/:spareId', async (req, res) => {
  try {
    const { spareId } = req.params;
    
    const records = await MaintenanceRecord.find({ spareId });
    const schedules = await MaintenanceSchedule.find({ spareId });

    // Calculate analytics
    const totalRecords = records.length;
    const completedRecords = records.filter(r => r.status === 'completed').length;
    const efficiency = totalRecords > 0 ? Math.round((completedRecords / totalRecords) * 100) : 0;
    
    const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
    const averageCost = totalRecords > 0 ? totalCost / totalRecords : 0;
    
    const totalHours = records.reduce((sum, r) => sum + (r.duration || 0), 0);

    // Type distribution
    const typeDistribution = {
      preventive: records.filter(r => r.type === 'preventive').length,
      predictive: records.filter(r => r.type === 'predictive').length,
      corrective: records.filter(r => r.type === 'corrective').length,
      emergency: records.filter(r => r.type === 'emergency').length
    };

    // Upcoming maintenance
    const upcomingMaintenance = schedules
      .filter(s => s.isActive && s.nextMaintenance)
      .sort((a, b) => new Date(a.nextMaintenance).getTime() - new Date(b.nextMaintenance).getTime())
      .slice(0, 5);

    res.json({
      totalRecords,
      completedRecords,
      efficiency,
      totalCost,
      averageCost,
      totalHours,
      typeDistribution,
      upcomingMaintenance
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching maintenance analytics', error: error.message });
  }
});

// Get overdue maintenance
router.get('/overdue', async (req, res) => {
  try {
    const schedules = await MaintenanceSchedule.find({
      companyId: req.user.companyId,
      isActive: true,
      nextMaintenance: { $lt: new Date() }
    }).populate('spareId', 'spareName spareCode');

    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching overdue maintenance', error: error.message });
  }
});

// Get maintenance due soon (within specified days)
router.get('/due-soon/:days', async (req, res) => {
  try {
    const { days } = req.params;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(days));

    const schedules = await MaintenanceSchedule.find({
      companyId: req.user.companyId,
      isActive: true,
      nextMaintenance: {
        $gte: new Date(),
        $lte: dueDate
      }
    }).populate('spareId', 'spareName spareCode');

    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching maintenance due soon', error: error.message });
  }
});

// Get maintenance statistics for dashboard
router.get('/stats', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    
    const totalSchedules = await MaintenanceSchedule.countDocuments({ companyId });
    const activeSchedules = await MaintenanceSchedule.countDocuments({ 
      companyId, 
      isActive: true 
    });
    
    const totalRecords = await MaintenanceRecord.countDocuments({ companyId });
    const completedRecords = await MaintenanceRecord.countDocuments({ 
      companyId, 
      status: 'completed' 
    });

    const overdueCount = await MaintenanceSchedule.countDocuments({
      companyId,
      isActive: true,
      nextMaintenance: { $lt: new Date() }
    });

    const dueSoonCount = await MaintenanceSchedule.countDocuments({
      companyId,
      isActive: true,
      nextMaintenance: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
      }
    });

    res.json({
      totalSchedules,
      activeSchedules,
      totalRecords,
      completedRecords,
      overdueCount,
      dueSoonCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching maintenance statistics', error: error.message });
  }
});

export default router;
