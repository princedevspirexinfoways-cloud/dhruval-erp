import express from 'express';
import { authenticate } from '../middleware/auth';
import { CompatibilityRecord, Equipment } from '../models/Compatibility';
import Spare from '../models/Spare';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all compatibility records for a spare
router.get('/records/:spareId', async (req, res) => {
  try {
    const { spareId } = req.params;
    const records = await CompatibilityRecord.find({ spareId })
      .populate('equipmentId', 'name type model brand serialNumber location status')
      .sort({ verifiedDate: -1 });
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching compatibility records', error: error.message });
  }
});

// Create a new compatibility record
router.post('/records', async (req, res) => {
  try {
    const {
      spareId,
      equipmentId,
      equipmentName,
      equipmentType,
      equipmentModel,
      equipmentBrand,
      isUniversal,
      compatibilityNotes,
      verifiedBy,
      verifiedDate,
      status,
      installationDate,
      removalDate,
      performanceRating,
      issues
    } = req.body;

    const record = new CompatibilityRecord({
      spareId,
      equipmentId,
      equipmentName,
      equipmentType,
      equipmentModel,
      equipmentBrand,
      isUniversal,
      compatibilityNotes,
      verifiedBy,
      verifiedDate,
      status,
      installationDate,
      removalDate,
      performanceRating,
      issues,
      companyId: req.user.companyId
    });

    await record.save();
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Error creating compatibility record', error: error.message });
  }
});

// Update a compatibility record
router.put('/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const record = await CompatibilityRecord.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ message: 'Compatibility record not found' });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: 'Error updating compatibility record', error: error.message });
  }
});

// Delete a compatibility record
router.delete('/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const record = await CompatibilityRecord.findByIdAndDelete(id);

    if (!record) {
      return res.status(404).json({ message: 'Compatibility record not found' });
    }

    res.json({ message: 'Compatibility record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting compatibility record', error: error.message });
  }
});

// Get all equipment
router.get('/equipment', async (req, res) => {
  try {
    const equipment = await Equipment.find({ companyId: req.user.companyId })
      .sort({ name: 1 });
    
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching equipment', error: error.message });
  }
});

// Create a new equipment
router.post('/equipment', async (req, res) => {
  try {
    const {
      name,
      type,
      model,
      brand,
      serialNumber,
      location,
      status,
      lastMaintenance,
      nextMaintenance
    } = req.body;

    const equipment = new Equipment({
      name,
      type,
      model,
      brand,
      serialNumber,
      location,
      status,
      lastMaintenance,
      nextMaintenance,
      companyId: req.user.companyId
    });

    await equipment.save();
    res.status(201).json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating equipment', error: error.message });
  }
});

// Update equipment
router.put('/equipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const equipment = await Equipment.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating equipment', error: error.message });
  }
});

// Delete equipment
router.delete('/equipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const equipment = await Equipment.findByIdAndDelete(id);

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting equipment', error: error.message });
  }
});

// Get compatibility analytics for a spare
router.get('/analytics/:spareId', async (req, res) => {
  try {
    const { spareId } = req.params;
    
    const records = await CompatibilityRecord.find({ spareId });
    const equipment = await Equipment.find({ companyId: req.user.companyId });

    // Calculate analytics
    const totalRecords = records.length;
    const verifiedRecords = records.filter(r => r.status === 'verified').length;
    const universalParts = records.filter(r => r.isUniversal).length;
    
    const averagePerformanceRating = totalRecords > 0 ? 
      Math.round(records.reduce((sum, r) => sum + (r.performanceRating || 0), 0) / totalRecords) : 0;

    // Equipment type distribution
    const equipmentTypes = new Set(records.map(r => r.equipmentType));
    const typeDistribution = Array.from(equipmentTypes).map(type => ({
      type,
      count: records.filter(r => r.equipmentType === type).length
    }));

    // Brand distribution
    const brands = new Set(records.map(r => r.equipmentBrand));
    const brandDistribution = Array.from(brands).map(brand => ({
      brand,
      count: records.filter(r => r.equipmentBrand === brand).length
    }));

    // Compatibility percentage
    const compatibilityPercentage = equipment.length > 0 ? 
      Math.round((verifiedRecords / equipment.length) * 100) : 0;

    // Performance by brand
    const performanceByBrand = brandDistribution.map(brand => {
      const brandRecords = records.filter(r => r.equipmentBrand === brand.brand);
      const avgRating = brandRecords.length > 0 ? 
        Math.round(brandRecords.reduce((sum, r) => sum + (r.performanceRating || 0), 0) / brandRecords.length) : 0;
      
      return {
        brand: brand.brand,
        count: brand.count,
        averageRating: avgRating
      };
    });

    res.json({
      totalRecords,
      verifiedRecords,
      universalParts,
      averagePerformanceRating,
      typeDistribution,
      brandDistribution,
      compatibilityPercentage,
      performanceByBrand
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching compatibility analytics', error: error.message });
  }
});

// Get universal parts
router.get('/universal-parts', async (req, res) => {
  try {
    const records = await CompatibilityRecord.find({
      companyId: req.user.companyId,
      isUniversal: true
    }).populate('spareId', 'spareName spareCode category manufacturer');

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching universal parts', error: error.message });
  }
});

// Get equipment by type
router.get('/equipment/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const equipment = await Equipment.find({
      companyId: req.user.companyId,
      type: type
    }).sort({ name: 1 });

    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching equipment by type', error: error.message });
  }
});

// Get equipment by brand
router.get('/equipment/brand/:brand', async (req, res) => {
  try {
    const { brand } = req.params;
    const equipment = await Equipment.find({
      companyId: req.user.companyId,
      brand: brand
    }).sort({ name: 1 });

    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching equipment by brand', error: error.message });
  }
});

// Search equipment
router.get('/equipment/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const equipment = await Equipment.find({
      companyId: req.user.companyId,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { type: { $regex: q, $options: 'i' } },
        { model: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { serialNumber: { $regex: q, $options: 'i' } }
      ]
    }).sort({ name: 1 });

    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Error searching equipment', error: error.message });
  }
});

// Get compatibility statistics for dashboard
router.get('/stats', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    
    const totalRecords = await CompatibilityRecord.countDocuments({ companyId });
    const verifiedRecords = await CompatibilityRecord.countDocuments({ 
      companyId, 
      status: 'verified' 
    });
    
    const totalEquipment = await Equipment.countDocuments({ companyId });
    const universalParts = await CompatibilityRecord.countDocuments({ 
      companyId, 
      isUniversal: true 
    });

    const equipmentTypes = await Equipment.distinct('type', { companyId });
    const brands = await Equipment.distinct('brand', { companyId });

    const compatibilityPercentage = totalEquipment > 0 ? 
      Math.round((verifiedRecords / totalEquipment) * 100) : 0;

    res.json({
      totalRecords,
      verifiedRecords,
      totalEquipment,
      universalParts,
      equipmentTypes: equipmentTypes.length,
      brands: brands.length,
      compatibilityPercentage
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching compatibility statistics', error: error.message });
  }
});

// Bulk compatibility check
router.post('/bulk-check', async (req, res) => {
  try {
    const { spareId, equipmentIds } = req.body;
    
    if (!spareId || !equipmentIds || !Array.isArray(equipmentIds)) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    const equipment = await Equipment.find({
      _id: { $in: equipmentIds },
      companyId: req.user.companyId
    });

    const records = equipment.map(eq => ({
      spareId,
      equipmentId: eq._id,
      equipmentName: eq.name,
      equipmentType: eq.type,
      equipmentModel: eq.model,
      equipmentBrand: eq.brand,
      isUniversal: false,
      status: 'pending',
      companyId: req.user.companyId
    }));

    const createdRecords = await CompatibilityRecord.insertMany(records);

    res.status(201).json(createdRecords);
  } catch (error) {
    res.status(500).json({ message: 'Error performing bulk compatibility check', error: error.message });
  }
});

export default router;
