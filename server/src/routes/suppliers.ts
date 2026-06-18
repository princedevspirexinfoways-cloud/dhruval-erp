import express from 'express';
import { authenticate } from '../middleware/auth';
import { SpareSupplier } from '../models/Supplier';
import Spare from '../models/Spare';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get supplier by ID (for standalone suppliers)
router.get('/supplier/:supplierId', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Company ID is required' 
      });
    }

    // Import the SupplierService
    const { SupplierService } = require('../services/SupplierService');
    const supplierService = new SupplierService();

    // Try to find by ID first with company filter, then by code
    let supplier = await supplierService.findOne({ 
      _id: supplierId, 
      companyId: companyId 
    }, ['companyId']);
    
    // If not found by ID, try by code
    if (!supplier) {
      supplier = await supplierService.getSupplierByCode(supplierId, companyId.toString());
    }

    if (!supplier) {
      return res.status(404).json({ 
        success: false, 
        message: 'Supplier not found' 
      });
    }

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching supplier', 
      error: error.message 
    });
  }
});

// Get supplier orders
router.get('/supplier/:supplierId/orders', async (req, res) => {
  try {
    const { supplierId } = req.params;
    
    // This would typically fetch orders for the supplier
    // For now, return empty array
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching supplier orders', 
      error: error.message 
    });
  }
});

// Get all suppliers for a spare
router.get('/:spareId', async (req, res) => {
  try {
    const { spareId } = req.params;
    const spare = await Spare.findById(spareId);
    
    if (!spare) {
      return res.status(404).json({ message: 'Spare not found' });
    }

    res.json(spare.suppliers || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching suppliers', error: error.message });
  }
});

// Add a new supplier to a spare
router.post('/:spareId', async (req, res) => {
  try {
    const { spareId } = req.params;
    const supplierData = req.body;

    const spare = await Spare.findById(spareId);
    if (!spare) {
      return res.status(404).json({ message: 'Spare not found' });
    }

    // Create new supplier object
    const newSupplier = {
      supplierId: supplierData.supplierId,
      supplierName: supplierData.supplierName,
      supplierCode: supplierData.supplierCode,
      partNumber: supplierData.partNumber,
      isPrimary: supplierData.isPrimary || false,
      leadTime: supplierData.leadTime,
      minOrderQuantity: supplierData.minOrderQuantity,
      lastSupplyDate: supplierData.lastSupplyDate,
      lastSupplyRate: supplierData.lastSupplyRate,
      qualityRating: supplierData.qualityRating,
      warrantyPeriod: supplierData.warrantyPeriod,
      contactPerson: supplierData.contactPerson,
      email: supplierData.email,
      phone: supplierData.phone,
      website: supplierData.website,
      address: supplierData.address,
      status: supplierData.status || 'active',
      performanceMetrics: {
        onTimeDeliveryRate: supplierData.onTimeDeliveryRate || 0,
        qualityRejectionRate: supplierData.qualityRejectionRate || 0,
        averageLeadTime: supplierData.averageLeadTime || 0,
        totalOrders: supplierData.totalOrders || 0,
        totalOrderValue: supplierData.totalOrderValue || 0,
        averageOrderValue: supplierData.averageOrderValue || 0
      },
      pricingHistory: supplierData.pricingHistory || [],
      notes: supplierData.notes
    };

    // If this is a primary supplier, remove primary status from others
    if (newSupplier.isPrimary) {
      spare.suppliers.forEach(supplier => {
        supplier.isPrimary = false;
      });
    }

    spare.suppliers.push(newSupplier);
    await spare.save();

    res.status(201).json(newSupplier);
  } catch (error) {
    res.status(500).json({ message: 'Error adding supplier', error: error.message });
  }
});

// Update a supplier for a spare
router.put('/:spareId/:supplierIndex', async (req, res) => {
  try {
    const { spareId, supplierIndex } = req.params;
    const updateData = req.body;

    const spare = await Spare.findById(spareId);
    if (!spare) {
      return res.status(404).json({ message: 'Spare not found' });
    }

    if (!spare.suppliers[supplierIndex]) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    // If this is being set as primary, remove primary status from others
    if (updateData.isPrimary) {
      spare.suppliers.forEach((supplier, index) => {
        if (index !== parseInt(supplierIndex)) {
          supplier.isPrimary = false;
        }
      });
    }

    // Update the supplier
    Object.assign(spare.suppliers[supplierIndex], updateData);
    await spare.save();

    res.json(spare.suppliers[supplierIndex]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating supplier', error: error.message });
  }
});

// Delete a supplier from a spare
router.delete('/:spareId/:supplierIndex', async (req, res) => {
  try {
    const { spareId, supplierIndex } = req.params;

    const spare = await Spare.findById(spareId);
    if (!spare) {
      return res.status(404).json({ message: 'Spare not found' });
    }

    if (!spare.suppliers[supplierIndex]) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    spare.suppliers.splice(parseInt(supplierIndex), 1);
    await spare.save();

    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting supplier', error: error.message });
  }
});

// Add pricing history to a supplier
router.post('/:spareId/:supplierIndex/pricing', async (req, res) => {
  try {
    const { spareId, supplierIndex } = req.params;
    const pricingData = req.body;

    const spare = await Spare.findById(spareId);
    if (!spare) {
      return res.status(404).json({ message: 'Spare not found' });
    }

    if (!spare.suppliers[supplierIndex]) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const newPricing = {
      date: pricingData.date,
      price: pricingData.price,
      currency: pricingData.currency || 'USD',
      quantity: pricingData.quantity,
      orderNumber: pricingData.orderNumber
    };

    spare.suppliers[supplierIndex].pricingHistory.push(newPricing);
    await spare.save();

    res.status(201).json(newPricing);
  } catch (error) {
    res.status(500).json({ message: 'Error adding pricing history', error: error.message });
  }
});

// Get supplier analytics for a spare
router.get('/:spareId/analytics', async (req, res) => {
  try {
    const { spareId } = req.params;
    
    const spare = await Spare.findById(spareId);
    if (!spare) {
      return res.status(404).json({ message: 'Spare not found' });
    }

    const suppliers = spare.suppliers || [];

    // Calculate analytics
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter(s => s.isPrimary).length;
    const primarySupplier = suppliers.find(s => s.isPrimary);
    
    const averageLeadTime = totalSuppliers > 0 ? 
      Math.round(suppliers.reduce((sum, s) => sum + (s.leadTime || 0), 0) / totalSuppliers) : 0;
    
    const averageQualityRating = totalSuppliers > 0 ? 
      Math.round(suppliers.reduce((sum, s) => sum + (s.qualityRating || 0), 0) / totalSuppliers) : 0;

    const totalOrderValue = suppliers.reduce((sum, s) => 
      sum + (s.lastSupplyRate || 0), 0);

    // Performance comparison
    const performanceComparison = suppliers.map(supplier => ({
      name: supplier.supplierName,
      onTimeDelivery: 0, // Not available in embedded schema
      qualityRating: supplier.qualityRating || 0,
      averageLeadTime: supplier.leadTime || 0
    }));

    // Price trends
    const priceTrends = suppliers.map(supplier => {
      return {
        name: supplier.supplierName,
        trend: 'stable',
        currentPrice: supplier.lastSupplyRate || 0
      };
    });

    res.json({
      totalSuppliers,
      activeSuppliers,
      primarySupplier: primarySupplier?.supplierName,
      averageLeadTime,
      averageQualityRating,
      totalOrderValue,
      performanceComparison,
      priceTrends
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching supplier analytics', error: error.message });
  }
});

// Get suppliers by status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    
    const spares = await Spare.find({
      companyId: req.user.companyId,
      'suppliers.status': status
    }).select('spareName spareCode suppliers');

    const suppliers = [];
    spares.forEach(spare => {
      spare.suppliers.forEach(supplier => {
        if (supplier.isPrimary === (status === 'primary')) {
          suppliers.push({
            ...supplier,
            spareName: spare.spareName,
            spareCode: spare.spareCode
          });
        }
      });
    });

    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching suppliers by status', error: error.message });
  }
});

// Get primary suppliers
router.get('/primary/all', async (req, res) => {
  try {
    const spares = await Spare.find({
      companyId: req.user.companyId,
      'suppliers.isPrimary': true
    }).select('spareName spareCode suppliers');

    const primarySuppliers = [];
    spares.forEach(spare => {
      const primarySupplier = spare.suppliers.find(s => s.isPrimary);
      if (primarySupplier) {
                  primarySuppliers.push({
            ...primarySupplier,
            spareName: spare.spareName,
            spareCode: spare.spareCode
          });
      }
    });

    res.json(primarySuppliers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching primary suppliers', error: error.message });
  }
});

// Search suppliers
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    const spares = await Spare.find({
      companyId: req.user.companyId,
      $or: [
        { 'suppliers.supplierName': { $regex: query, $options: 'i' } },
        { 'suppliers.supplierCode': { $regex: query, $options: 'i' } },
        { 'suppliers.partNumber': { $regex: query, $options: 'i' } }
      ]
    }).select('spareName spareCode suppliers');

    const suppliers = [];
    spares.forEach(spare => {
      spare.suppliers.forEach(supplier => {
        if (supplier.supplierName.toLowerCase().includes(query.toLowerCase()) ||
            supplier.supplierCode.toLowerCase().includes(query.toLowerCase()) ||
            supplier.partNumber.toLowerCase().includes(query.toLowerCase())) {
          suppliers.push({
            ...supplier,
            spareName: spare.spareName,
            spareCode: spare.spareCode
          });
        }
      });
    });

    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: 'Error searching suppliers', error: error.message });
  }
});

// Get supplier statistics for dashboard
router.get('/stats/overview', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    
    const spares = await Spare.find({ companyId });
    
    let totalSuppliers = 0;
    let activeSuppliers = 0;
    let primarySuppliers = 0;
    let totalOrderValue = 0;
    let averageLeadTime = 0;
    let averageQualityRating = 0;

    spares.forEach(spare => {
      const suppliers = spare.suppliers || [];
      totalSuppliers += suppliers.length;
      
      suppliers.forEach(supplier => {
        if (supplier.isPrimary) activeSuppliers++;
        if (supplier.isPrimary) primarySuppliers++;
        totalOrderValue += supplier.lastSupplyRate || 0;
        averageLeadTime += supplier.leadTime || 0;
        averageQualityRating += supplier.qualityRating || 0;
      });
    });

    if (totalSuppliers > 0) {
      averageLeadTime = Math.round(averageLeadTime / totalSuppliers);
      averageQualityRating = Math.round(averageQualityRating / totalSuppliers);
    }

    res.json({
      totalSuppliers,
      activeSuppliers,
      primarySuppliers,
      totalOrderValue,
      averageLeadTime,
      averageQualityRating
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching supplier statistics', error: error.message });
  }
});

// Bulk supplier operations
router.post('/bulk/:spareId', async (req, res) => {
  try {
    const { spareId } = req.params;
    const { suppliers } = req.body;

    if (!Array.isArray(suppliers)) {
      return res.status(400).json({ message: 'Suppliers must be an array' });
    }

    const spare = await Spare.findById(spareId);
    if (!spare) {
      return res.status(404).json({ message: 'Spare not found' });
    }

    // Clear existing suppliers
    spare.suppliers = [];

    // Add new suppliers
    suppliers.forEach(supplierData => {
      const newSupplier = {
        supplierId: supplierData.supplierId,
        supplierName: supplierData.supplierName,
        supplierCode: supplierData.supplierCode,
        partNumber: supplierData.partNumber,
        isPrimary: supplierData.isPrimary || false,
        leadTime: supplierData.leadTime,
        minOrderQuantity: supplierData.minOrderQuantity,
        lastSupplyDate: supplierData.lastSupplyDate,
        lastSupplyRate: supplierData.lastSupplyRate,
        qualityRating: supplierData.qualityRating,
        warrantyPeriod: supplierData.warrantyPeriod,
        contactPerson: supplierData.contactPerson,
        email: supplierData.email,
        phone: supplierData.phone,
        website: supplierData.website,
        address: supplierData.address,
        status: supplierData.status || 'active',
        performanceMetrics: {
          onTimeDeliveryRate: supplierData.onTimeDeliveryRate || 0,
          qualityRejectionRate: supplierData.qualityRejectionRate || 0,
          averageLeadTime: supplierData.averageLeadTime || 0,
          totalOrders: supplierData.totalOrders || 0,
          totalOrderValue: supplierData.totalOrderValue || 0,
          averageOrderValue: supplierData.averageOrderValue || 0
        },
        pricingHistory: supplierData.pricingHistory || [],
        notes: supplierData.notes
      };

      spare.suppliers.push(newSupplier);
    });

    await spare.save();

    res.status(201).json(spare.suppliers);
  } catch (error) {
    res.status(500).json({ message: 'Error performing bulk supplier operations', error: error.message });
  }
});

export default router;
