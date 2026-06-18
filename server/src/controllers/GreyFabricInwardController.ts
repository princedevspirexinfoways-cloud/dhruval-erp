import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import GreyFabricInward from '../models/GreyFabricInward';
import ProductionOrder from '../models/ProductionOrder';
import { Supplier } from '../models/Supplier';
import InventoryItem from '../models/InventoryItem';
import { InventoryService } from '../services/InventoryService';

export class GreyFabricInwardController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  private handleError(res: Response, error: any): void {
    logger.error('GreyFabricInwardController Error:', error);
    
    // Log more detailed error information
    if (error?.message) {
      logger.error('Error message:', error.message);
    }
    if (error?.stack) {
      logger.error('Error stack:', error.stack);
    }
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        details: error.details
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Create or update inventory item from GRN data with proper grey stock handling
   * Handles both own materials and client-provided materials
   */
  private async createOrUpdateInventoryItemFromGRN(grn: any, companyId: string, userId: string): Promise<any> {
    try {
      // Calculate stock from grey stock lots if available, otherwise use quantity
      let totalStock = 0;
      let totalCost = 0;
      let averageCost = 0;
      
      // For client-provided materials, cost might be 0 or different handling
      const isClientMaterial = grn.materialSource === 'client_provided';
      
      if (grn.greyStockLots && grn.greyStockLots.length > 0) {
        // Calculate from lots
        totalStock = grn.greyStockLots.reduce((sum: number, lot: any) => {
          // Convert all to meters for consistency
          if (lot.lotUnit === 'meters') return sum + lot.lotQuantity;
          if (lot.lotUnit === 'yards') return sum + (lot.lotQuantity * 0.9144); // Convert yards to meters
          return sum + lot.lotQuantity; // Assume pieces are counted as-is
        }, 0);
        
        // For client materials, cost might be 0 or handling charges
        if (isClientMaterial) {
          totalCost = grn.greyStockLots.reduce((sum: number, lot: any) => sum + (lot.totalCost || 0), 0);
        } else {
          totalCost = grn.greyStockLots.reduce((sum: number, lot: any) => sum + lot.totalCost, 0);
        }
        averageCost = totalStock > 0 ? totalCost / totalStock : 0;
      } else {
        // Use quantity from GRN
        totalStock = typeof grn.quantity === 'number' ? grn.quantity : grn.quantity.receivedQuantity;
        averageCost = isClientMaterial ? 0 : (grn.financial?.unitPrice || 0);
        totalCost = totalStock * averageCost;
      }

      // Generate unique item code for fabric
      const fabricCode = `GREY-FAB-${grn.fabricDetails.fabricType.toUpperCase()}-${grn.fabricDetails.color.toUpperCase()}-${Date.now()}`;
      
      // Check if inventory item already exists for this fabric type and color
      const existingItem = await InventoryItem.findOne({
        companyId: new mongoose.Types.ObjectId(companyId),
        'fabricDetails.fabricType': grn.fabricDetails.fabricType,
        'fabricDetails.color': grn.fabricDetails.color,
        'fabricDetails.gsm': grn.fabricDetails.gsm
      });

      if (existingItem) {
        // Update existing item with new stock
        const updatedStock = existingItem.stock.currentStock + totalStock;
        const updatedCost = (existingItem.stock.totalValue + totalCost) / updatedStock;
        
        await InventoryItem.findByIdAndUpdate(existingItem._id, {
          $inc: {
            'stock.currentStock': totalStock,
            'stock.totalValue': totalCost
          },
          'stock.averageCost': updatedCost,
          'stock.availableStock': updatedStock,
          'tracking.lastStockUpdate': new Date(),
          'tracking.totalInward': (existingItem.tracking.totalInward || 0) + totalStock
        });

        logger.info('Updated existing inventory item with new grey stock', {
          itemId: existingItem._id,
          itemCode: existingItem.itemCode,
          addedStock: totalStock,
          newTotalStock: updatedStock
        });

        return existingItem;
      }
      
      // Create new inventory item data
      const inventoryItemData = {
        itemCode: fabricCode,
        companyItemCode: `${grn.grnNumber}-GREY-FAB`,
        itemName: `${grn.fabricDetails.fabricType} Grey Fabric - ${grn.fabricDetails.color}`,
        itemDescription: `Grey fabric received via GRN ${grn.grnNumber}. GSM: ${grn.fabricDetails.gsm}, Grade: ${grn.fabricDetails.fabricGrade}`,
        category: {
          primary: 'raw_material' as const,
          secondary: 'fabric',
          tertiary: 'grey_fabric'
        },
        productType: 'custom' as 'saree' | 'african' | 'garment' | 'digital_print' | 'custom' | 'chemical' | 'dye' | 'machinery' | 'yarn' | 'thread',
        companyId: new mongoose.Types.ObjectId(companyId),
        
        // Stock information calculated from lots
        stock: {
          currentStock: totalStock,
          availableStock: totalStock,
          reservedStock: 0,
          inTransitStock: 0,
          damagedStock: 0,
          unit: 'meters', // Standardize to meters
          reorderLevel: totalStock * 0.1, // 10% of current stock
          minStockLevel: totalStock * 0.05, // 5% of current stock
          maxStockLevel: totalStock * 3, // 3x current stock
          valuationMethod: 'FIFO' as const,
          averageCost: averageCost,
          totalValue: totalCost
        },
        
        // Pricing information
        pricing: {
          costPrice: averageCost,
          sellingPrice: averageCost * 1.2, // 20% markup
          currency: 'INR'
        },
        
        // Technical specifications for fabric
        specifications: {
          gsm: grn.fabricDetails.gsm,
          width: grn.fabricDetails.width,
          color: grn.fabricDetails.color,
          colorCode: `#${grn.fabricDetails.color.toLowerCase().replace(/\s/g, '')}`,
          fabricComposition: grn.fabricDetails.fabricType,
          weaveType: 'plain' as 'plain' | 'twill' | 'satin' | 'jacquard' | 'dobby' | 'other', // Default, can be updated later
          finish: grn.fabricDetails.finish || 'grey',
          batchNumber: grn.batchNumber || grn.grnNumber,
          lotNumber: grn.lotNumber || 'BATCH-001'
        },
        
        // Quality information
        quality: {
          qualityGrade: grn.fabricDetails.fabricGrade,
          defectPercentage: 0,
          qualityCheckRequired: true,
          qualityParameters: ['Color Fastness', 'GSM', 'Width', 'Shrinkage'],
          lastQualityCheck: new Date(),
          qualityNotes: `Grey fabric quality checked via GRN ${grn.grnNumber}`,
          certifications: []
        },
        
        // Supplier information
        suppliers: grn.supplierId ? [{
          supplierId: new mongoose.Types.ObjectId(grn.supplierId),
          supplierName: grn.supplierName || 'Unknown Supplier',
          supplierItemCode: `${grn.supplierId}-${fabricCode}`,
          isPrimary: true,
          isActive: true,
          lastPurchaseDate: new Date(),
          lastPurchasePrice: averageCost,
          qualityRating: 4 // Default rating
        }] : [],
        
        // Location information - use storage location from GRN
        locations: [{
          warehouseId: grn.storageLocation.warehouseId,
          warehouseName: grn.storageLocation.warehouseName,
          quantity: totalStock,
          lastUpdated: new Date(),
          isActive: true
        }],
        
        // Manufacturing information
        manufacturing: {
          batchSize: totalStock,
          shelfLife: 365, // 1 year for fabric
          manufacturingCost: averageCost
        },
        
        // Tracking information
        tracking: {
          createdBy: new mongoose.Types.ObjectId(userId),
          lastModifiedBy: new mongoose.Types.ObjectId(userId),
          lastStockUpdate: new Date(),
          lastMovementDate: new Date(),
          totalInward: totalStock,
          totalOutward: 0,
          totalAdjustments: 0
        },
        
        // GRN reference
        grnReference: grn._id,
        grnNumber: grn.grnNumber,
        
        // Status
        status: {
          isActive: true,
          isDiscontinued: false,
          isFastMoving: false,
          isSlowMoving: false,
          isObsolete: false,
          requiresApproval: false
        },
        isActive: true
      };

      // Create inventory item
      const inventoryItem = await this.inventoryService.createInventoryItem(inventoryItemData, userId);
      
      logger.info('Inventory item created from GRN', {
        grnId: grn._id,
        grnNumber: grn.grnNumber,
        inventoryItemId: inventoryItem._id,
        itemCode: inventoryItem.itemCode,
        quantity: grn.quantity
      });

      return inventoryItem;
    } catch (error) {
      logger.error('Error creating inventory item from GRN', {
        error,
        grnId: grn._id,
        grnNumber: grn.grnNumber
      });
      throw error;
    }
  }

  // Get all grey fabric inward entries with filters
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        quality,
        fabricType,
        supplierId,
        dateFrom,
        dateTo,
        search
      } = req.query;

      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      // Build filter object
      const filter: any = { companyId };

      if (status) filter.status = status;
      if (quality) filter['inspection.qualityGrade'] = quality;
      if (fabricType) filter['fabricDetails.fabricType'] = fabricType;
      if (supplierId) filter.supplierId = supplierId;

      // Date range filter
      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom as string);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo as string);
      }

      // Search filter
      if (search) {
        filter.$or = [
          { grnNumber: new RegExp(search as string, 'i') },
          { purchaseOrderNumber: new RegExp(search as string, 'i') },
          { customerName: new RegExp(search as string, 'i') },
          { supplierName: new RegExp(search as string, 'i') },
          { 'fabricDetails.fabricType': new RegExp(search as string, 'i') },
          { 'fabricDetails.color': new RegExp(search as string, 'i') }
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [grns, total] = await Promise.all([
        GreyFabricInward.find(filter)
          .populate('supplierId', 'supplierName contactPersons')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        GreyFabricInward.countDocuments(filter)
      ]);

      // Transform data to include populated fields
      const transformedGrns = grns.map(grn => ({
        ...grn,
        supplierName: (grn.supplierId as any)?.supplierName || grn.supplierName
      }));

      res.json({
        success: true,
        data: transformedGrns,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Get single grey fabric inward entry
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      const grn = await GreyFabricInward.findOne({ _id: id, companyId })
        .populate('supplierId', 'supplierName contactPersons')
        .lean();

      if (!grn) {
        throw new AppError('GRN entry not found', 404);
      }

      // Transform data
      const transformedGrn = {
        ...grn,
        supplierName: (grn.supplierId as any)?.supplierName || grn.supplierName
      };

      res.json({
        success: true,
        data: transformedGrn
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Create new grey fabric inward entry (supports both PO-based and direct stock entry)
  async create(req: Request, res: Response): Promise<void> {
    try {
      // For testing - use default values if user is not authenticated
      const companyId = req.user?.companyId || new mongoose.Types.ObjectId();
      const userId = req.user?.id || new mongoose.Types.ObjectId();

      // Log for debugging
      logger.info('Creating GRN with:', { companyId, userId, body: req.body });

      const {
        entryType = 'direct_stock_entry',
        productionOrderId,
        purchaseOrderId, // Optional - can be direct stock entry
        supplierId,
        supplierName,
        fabricType,
        fabricColor,
        fabricWeight,
        fabricWidth,
        quantity,
        unit,
        quality,
        expectedAt,
        remarks,
        images,
        costBreakdown,
        // New fields for grey stock
        greyStockLots = [],
        warehouseId,
        warehouseName = 'Main Warehouse',
        // Material source fields
        materialSource = 'own_material',
        clientMaterialInfo
      } = req.body;

      // Validate required fields based on entry type
      if (entryType === 'purchase_order') {
        if (!purchaseOrderId || !fabricType || !fabricColor || !quantity || !unit || !quality) {
          throw new AppError('Missing required fields for PO-based entry: purchaseOrderId, fabricType, fabricColor, quantity, unit, quality', 400);
        }
      } else {
        if (!fabricType || !fabricColor || !quantity || !unit || !quality) {
          throw new AppError('Missing required fields: fabricType, fabricColor, quantity, unit, quality', 400);
        }
      }

      // Validate client material info when material source is client_provided
      if (materialSource === 'client_provided') {
        if (!clientMaterialInfo?.clientId || !clientMaterialInfo?.clientName) {
          throw new AppError('Missing required fields for client-provided material: clientId, clientName', 400);
        }
      }

      // Get Purchase Order details if it's a PO-based entry
      let purchaseOrder = null;
      if (entryType === 'purchase_order' && purchaseOrderId) {
        const PurchaseOrder = mongoose.model('PurchaseOrder');
        purchaseOrder = await PurchaseOrder.findById(purchaseOrderId);
        
        if (!purchaseOrder) {
          throw new AppError('Purchase Order not found', 404);
        }
      }

      // Generate GRN number
      const grnCount = await GreyFabricInward.countDocuments({ companyId });
      const grnNumber = `GRN-${String(grnCount + 1).padStart(4, '0')}`;

      // Calculate total cost
      const totalCost = (costBreakdown?.fabricCost || 0) + 
                       (costBreakdown?.transportationCost || 0) + 
                       (costBreakdown?.inspectionCost || 0);

      const grnData = {
        grnNumber,
        entryType,
        purchaseOrderId: purchaseOrderId ? new mongoose.Types.ObjectId(purchaseOrderId) : undefined,
        purchaseOrderNumber: purchaseOrder?.poNumber,
        
        // Material Source
        materialSource,
        
        // Client Material Information
        clientMaterialInfo: materialSource === 'client_provided' && clientMaterialInfo ? {
          clientId: new mongoose.Types.ObjectId(clientMaterialInfo.clientId),
          clientName: clientMaterialInfo.clientName,
          clientOrderId: clientMaterialInfo.clientOrderId ? new mongoose.Types.ObjectId(clientMaterialInfo.clientOrderId) : undefined,
          clientOrderNumber: clientMaterialInfo.clientOrderNumber,
          clientMaterialCode: clientMaterialInfo.clientMaterialCode,
          clientBatchNumber: clientMaterialInfo.clientBatchNumber,
          clientLotNumber: clientMaterialInfo.clientLotNumber,
          clientProvidedDate: clientMaterialInfo.clientProvidedDate ? new Date(clientMaterialInfo.clientProvidedDate) : undefined,
          clientInstructions: clientMaterialInfo.clientInstructions,
          clientQualitySpecs: clientMaterialInfo.clientQualitySpecs,
          returnRequired: clientMaterialInfo.returnRequired || false,
          returnDeadline: clientMaterialInfo.returnDeadline ? new Date(clientMaterialInfo.returnDeadline) : undefined,
          clientContactPerson: clientMaterialInfo.clientContactPerson,
          clientContactPhone: clientMaterialInfo.clientContactPhone,
          clientContactEmail: clientMaterialInfo.clientContactEmail,
          
          // Initialize production outputs and material consumption tracking
          productionOutputs: [],
          materialConsumption: {
            totalConsumed: 0,
            wasteQuantity: 0,
            returnableQuantity: 0,
            consumedDate: undefined,
            consumptionNotes: ''
          },
          clientMaterialBalance: {
            totalReceived: Number(quantity),
            totalConsumed: 0,
            totalWaste: 0,
            totalReturned: 0,
            totalKeptAsStock: 0,
            currentBalance: Number(quantity),
            lastUpdated: new Date(),
            balanceHistory: [{
              date: new Date(),
              transactionType: 'received',
              quantity: Number(quantity),
              reference: `GRN-${grnCount + 1}`,
              notes: 'Initial material receipt'
            }]
          }
        } : undefined,
        
        // Supplier info populated from Purchase Order or provided directly
        supplierId: entryType === 'purchase_order' ? purchaseOrder?.supplier?.supplierId : (supplierId ? new mongoose.Types.ObjectId(supplierId) : undefined),
        supplierName: entryType === 'purchase_order' ? purchaseOrder?.supplier?.supplierName : supplierName,
        
        // Fabric Details
        fabricDetails: {
          fabricType: fabricType as 'cotton' | 'polyester' | 'viscose' | 'blend' | 'other',
          fabricGrade: quality as 'A' | 'B' | 'C' | 'D',
          gsm: Number(fabricWeight),
          width: Number(fabricWidth),
          color: fabricColor,
          design: '',
          pattern: '',
          finish: ''
        },
        
        // Quantity Information
        quantity: {
          receivedQuantity: Number(quantity),
          unit: unit as 'meters' | 'yards' | 'pieces',
          acceptedQuantity: Number(quantity),
          rejectedQuantity: 0,
          shortQuantity: 0,
          excessQuantity: 0
        },
        
        // Quality Parameters
        qualityParameters: {
          weight: Number(fabricWeight),
          width: Number(fabricWidth),
          gsm: Number(fabricWeight),
          colorFastness: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
          shrinkage: 0,
          pilling: 'none' as 'none' | 'slight' | 'moderate' | 'severe',
          defects: {
            holes: 0,
            stains: 0,
            colorVariation: 0,
            other: ''
          }
        },
        
        // Physical Condition
        physicalCondition: {
          isDamaged: false,
          damageDescription: '',
          isWet: false,
          isContaminated: false,
          contaminationType: '',
          storageCondition: 'good' as 'good' | 'fair' | 'poor'
        },
        
        // Documentation
        documents: {
          supplierInvoice: [],
          qualityCertificate: [],
          testReports: [],
          photos: images || [],
          other: []
        },
        
        // Status and Approval
        status: entryType === 'direct_stock_entry' ? 'stock_created' as 'pending' | 'approved' | 'rejected' | 'partially_approved' | 'stock_created' : 'pending' as 'pending' | 'approved' | 'rejected' | 'partially_approved' | 'stock_created',
        inspectionStatus: entryType === 'direct_stock_entry' ? 'not_required' as 'pending' | 'in_progress' | 'completed' | 'not_required' : 'pending' as 'pending' | 'in_progress' | 'completed' | 'not_required',
        qualityStatus: 'passed' as 'passed' | 'failed' | 'conditional',
        stockStatus: 'not_created' as 'not_created' | 'active' | 'low_stock' | 'out_of_stock' | 'consumed',
        
        // Location and Storage
        storageLocation: {
          warehouseId: warehouseId ? new mongoose.Types.ObjectId(warehouseId) : new mongoose.Types.ObjectId(),
          warehouseName: warehouseName,
          rackNumber: '',
          shelfNumber: '',
          binNumber: ''
        },
        
        // Grey Stock Lots (if provided)
        greyStockLots: greyStockLots.length > 0 ? greyStockLots.map((lot: any) => ({
          lotNumber: lot.lotNumber,
          lotQuantity: lot.lotQuantity,
          lotUnit: lot.lotUnit || unit,
          lotStatus: 'active' as 'active' | 'consumed' | 'damaged' | 'reserved',
          receivedDate: new Date(),
          expiryDate: lot.expiryDate ? new Date(lot.expiryDate) : undefined,
          qualityGrade: lot.qualityGrade || quality,
          storageLocation: {
            warehouseId: warehouseId ? new mongoose.Types.ObjectId(warehouseId) : new mongoose.Types.ObjectId(),
            warehouseName: warehouseName,
            rackNumber: lot.rackNumber || '',
            shelfNumber: lot.shelfNumber || '',
            binNumber: lot.binNumber || ''
          },
          costPerUnit: lot.costPerUnit || (costBreakdown?.fabricCost || 0),
          totalCost: lot.totalCost || (lot.lotQuantity * (lot.costPerUnit || (costBreakdown?.fabricCost || 0))),
          remarks: lot.remarks || ''
        })) : [],
        
        // Financial Information
        financial: {
          unitPrice: costBreakdown?.fabricCost || 0,
          totalValue: totalCost,
          currency: 'INR',
          gstRate: 18,
          gstAmount: totalCost * 0.18,
          totalAmount: totalCost * 1.18
        },
        
        // Inspection Details
        inspection: {
          inspectedBy: new mongoose.Types.ObjectId(userId),
          inspectedByName: req.user?.name || 'Inspector',
          inspectionDate: new Date(),
          inspectionNotes: remarks || '',
          qualityGrade: quality as 'A' | 'B' | 'C' | 'D',
          recommendedAction: 'accept' as 'accept' | 'reject' | 'conditional_accept' | 'return_to_supplier'
        },
        
        // Cost Breakdown
        costBreakdown: {
          fabricCost: costBreakdown?.fabricCost || 0,
          transportationCost: costBreakdown?.transportationCost || 0,
          inspectionCost: costBreakdown?.inspectionCost || 0,
          totalCost: totalCost
        },
        
        // Additional fields
        expectedDeliveryDate: expectedAt ? new Date(expectedAt) : undefined,
        actualDeliveryDate: undefined,
        remarks: remarks || '',
        
        companyId,
        createdBy: userId,
        updatedBy: userId
      };

      const grn = await GreyFabricInward.create(grnData);

      // Automatically create/update inventory item when GRN is created
      try {
        const inventoryItem = await this.createOrUpdateInventoryItemFromGRN(grn, companyId.toString(), userId.toString());
        
        // Update GRN with inventory item reference
        await GreyFabricInward.findByIdAndUpdate(grn._id, {
          inventoryItemId: inventoryItem._id,
          inventoryItemCode: inventoryItem.itemCode
        });

        logger.info('GRN created with inventory item updated', {
          grnId: grn._id,
          grnNumber: grn.grnNumber,
          entryType: grn.entryType,
          inventoryItemId: inventoryItem._id,
          itemCode: inventoryItem.itemCode
        });
      } catch (inventoryError) {
        // Log error but don't fail GRN creation
        logger.error('Failed to create/update inventory item for GRN', {
          grnId: grn._id,
          grnNumber: grn.grnNumber,
          error: inventoryError
        });
      }

      res.status(201).json({
        success: true,
        message: 'GRN entry created successfully with supplier info from Purchase Order',
        data: grn
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Update grey fabric inward entry
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        throw new AppError('Company ID and User ID are required', 400);
      }

      // Calculate total cost if costBreakdown is being updated
      let updateData = { ...req.body, updatedBy: userId };
      
      if (req.body.costBreakdown) {
        const totalCost = (req.body.costBreakdown.fabricCost || 0) + 
                         (req.body.costBreakdown.transportationCost || 0) + 
                         (req.body.costBreakdown.inspectionCost || 0);
        
        updateData.costBreakdown = {
          ...req.body.costBreakdown,
          totalCost: totalCost
        };
      }

      const grn = await GreyFabricInward.findOneAndUpdate(
        { _id: id, companyId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!grn) {
        throw new AppError('GRN entry not found', 404);
      }

      // If status is being updated to 'received', update inventory stock
      if (req.body.status === 'received' && grn.inventoryItemId) {
        try {
          await this.updateInventoryStock(grn, 'received');
          logger.info('Inventory stock updated for received GRN', {
            grnId: grn._id,
            grnNumber: grn.grnNumber,
            inventoryItemId: grn.inventoryItemId
          });
        } catch (inventoryError) {
          logger.error('Failed to update inventory stock for GRN', {
            grnId: grn._id,
            grnNumber: grn.grnNumber,
            error: inventoryError
          });
        }
      }

      res.json({
        success: true,
        message: 'GRN entry updated successfully',
        data: grn
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Update inventory stock based on GRN status
   */
  private async updateInventoryStock(grn: any, status: string): Promise<void> {
    if (!grn.inventoryItemId) return;

    try {
      const inventoryItem = await InventoryItem.findById(grn.inventoryItemId);
      if (!inventoryItem) return;

      if (status === 'received') {
        // Update stock levels when fabric is received
        await this.inventoryService.updateStock(
          grn.inventoryItemId.toString(),
          inventoryItem.locations[0]?.warehouseId?.toString() || new mongoose.Types.ObjectId().toString(),
          grn.quantity.acceptedQuantity || grn.quantity.receivedQuantity,
          'in',
          `GRN-${grn.grnNumber}`,
          `Fabric received via GRN ${grn.grnNumber}`,
          grn.updatedBy
        );
      } else if (status === 'rejected') {
        // Reduce stock if fabric is rejected
        await this.inventoryService.updateStock(
          grn.inventoryItemId.toString(),
          inventoryItem.locations[0]?.warehouseId?.toString() || new mongoose.Types.ObjectId().toString(),
          -(grn.quantity.rejectedQuantity || 0),
          'out',
          `GRN-${grn.grnNumber}`,
          `Fabric rejected via GRN ${grn.grnNumber}`,
          grn.updatedBy
        );
      }
    } catch (error) {
      logger.error('Error updating inventory stock', {
        grnId: grn._id,
        grnNumber: grn.grnNumber,
        status,
        inventoryItemId: grn.inventoryItemId,
        error: error?.message || error,
        stack: error?.stack
      });
      throw error;
    }
  }

  /**
   * Handle client material return
   */
  async returnClientMaterial(req: Request, res: Response): Promise<void> {
    try {
      const { grnId } = req.params;
      const { returnQuantity, returnReason, returnDate, notes } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const grn = await GreyFabricInward.findById(grnId);
      if (!grn) {
        res.status(404).json({ success: false, message: 'GRN not found' });
        return;
      }

      if (grn.materialSource !== 'client_provided') {
        res.status(400).json({ success: false, message: 'This GRN is not for client-provided material' });
        return;
      }

      // Update GRN with return information
      grn.status = 'approved'; // Keep as approved since 'returned' is not in enum
      // Note: returnedQuantity doesn't exist in quantity schema, using rejectedQuantity instead
      grn.quantity.rejectedQuantity = returnQuantity;
      grn.remarks = notes;
      
      // Update stock balance
      grn.stockBalance.availableMeters -= returnQuantity;
      grn.stockBalance.totalMeters -= returnQuantity;

      await grn.save();

      // Update inventory if needed
      if (grn.inventoryItemId) {
        await this.inventoryService.updateStock(
          grn.inventoryItemId.toString(),
          grn.storageLocation.warehouseId.toString(),
          -returnQuantity,
          'out',
          `CLIENT-RETURN-${grn.grnNumber}`,
          `Client material return - ${returnReason}`,
          userId
        );
      }

      logger.info('Client material returned successfully', {
        grnId,
        grnNumber: grn.grnNumber,
        returnQuantity,
        returnReason,
        userId
      });

      res.json({
        success: true,
        message: 'Client material returned successfully',
        data: grn
      });

    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Add production output for client material
   */
  async addProductionOutput(req: Request, res: Response): Promise<void> {
    try {
      const { grnId } = req.params;
      const { 
        productionOrderId, 
        productionOrderNumber, 
        outputQuantity, 
        outputUnit, 
        outputType, 
        qualityGrade, 
        notes 
      } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const grn = await GreyFabricInward.findById(grnId);
      if (!grn) {
        res.status(404).json({ success: false, message: 'GRN not found' });
        return;
      }

      if (grn.materialSource !== 'client_provided') {
        res.status(400).json({ success: false, message: 'Production output can only be added to client-provided materials' });
        return;
      }

      const outputData = {
        productionOrderId: new mongoose.Types.ObjectId(productionOrderId),
        productionOrderNumber,
        outputQuantity,
        outputUnit,
        outputType,
        outputDate: new Date(),
        qualityGrade,
        outputStatus: 'pending',
        notes
      };

      await grn.addProductionOutput(outputData);

      logger.info('Production output added successfully', {
        grnId,
        grnNumber: grn.grnNumber,
        productionOrderId,
        outputQuantity,
        outputType,
        userId
      });

      res.json({
        success: true,
        message: 'Production output added successfully',
        data: grn
      });

    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Update production output status (return to client or keep as stock)
   */
  async updateProductionOutputStatus(req: Request, res: Response): Promise<void> {
    try {
      const { grnId, productionOrderId } = req.params;
      const { 
        status, 
        clientReturnQuantity, 
        keptAsStockQuantity, 
        notes 
      } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const grn = await GreyFabricInward.findById(grnId);
      if (!grn) {
        res.status(404).json({ success: false, message: 'GRN not found' });
        return;
      }

      await grn.updateProductionOutputStatus(
        productionOrderId, 
        status, 
        clientReturnQuantity, 
        keptAsStockQuantity
      );

      // If keeping as stock, update inventory
      if (status === 'kept_as_stock' && keptAsStockQuantity > 0) {
        // Create inventory item for the output
        await this.createInventoryItemFromProductionOutput(
          grn, 
          productionOrderId, 
          keptAsStockQuantity, 
          userId
        );
      }

      logger.info('Production output status updated successfully', {
        grnId,
        grnNumber: grn.grnNumber,
        productionOrderId,
        status,
        clientReturnQuantity,
        keptAsStockQuantity,
        userId
      });

      res.json({
        success: true,
        message: 'Production output status updated successfully',
        data: grn
      });

    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Update material consumption for client material
   */
  async updateMaterialConsumption(req: Request, res: Response): Promise<void> {
    try {
      const { grnId } = req.params;
      const { consumedQuantity, wasteQuantity, notes } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const grn = await GreyFabricInward.findById(grnId);
      if (!grn) {
        res.status(404).json({ success: false, message: 'GRN not found' });
        return;
      }

      await grn.updateMaterialConsumption(consumedQuantity, wasteQuantity, notes);

      logger.info('Material consumption updated successfully', {
        grnId,
        grnNumber: grn.grnNumber,
        consumedQuantity,
        wasteQuantity,
        userId
      });

      res.json({
        success: true,
        message: 'Material consumption updated successfully',
        data: grn
      });

    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Create inventory item from production output
   */
  private async createInventoryItemFromProductionOutput(
    grn: any, 
    productionOrderId: string, 
    quantity: number, 
    userId: string
  ): Promise<any> {
    try {
      // Find the production order to get product details
      const ProductionOrder = mongoose.model('ProductionOrder');
      const productionOrder = await ProductionOrder.findById(productionOrderId);
      
      if (!productionOrder) {
        throw new Error('Production order not found');
      }

      // Create inventory item for the output
      const outputItem = {
        itemName: `${productionOrder.product.productType} - ${productionOrder.product.design || 'Custom'}`,
        description: `Production output from client material - GRN ${grn.grnNumber}`,
        category: 'finished_goods',
        subcategory: productionOrder.product.productType,
        unit: 'pieces',
        currentStock: quantity,
        availableStock: quantity,
        averageCost: 0, // Client material, no cost
        totalValue: 0,
        minStockLevel: 0,
        maxStockLevel: 1000,
        reorderLevel: 10,
        locations: [{
          warehouseId: grn.storageLocation.warehouseId,
          warehouseName: grn.storageLocation.warehouseName,
          rackNumber: grn.storageLocation.rackNumber,
          shelfNumber: grn.storageLocation.shelfNumber,
          binNumber: grn.storageLocation.binNumber,
          currentStock: quantity,
          availableStock: quantity
        }],
        fabricDetails: {
          fabricType: grn.fabricDetails.fabricType,
          fabricGrade: grn.fabricDetails.fabricGrade,
          gsm: grn.fabricDetails.gsm,
          width: grn.fabricDetails.width,
          color: grn.fabricDetails.color,
          design: productionOrder.product.design,
          pattern: productionOrder.product.pattern,
          finish: productionOrder.product.finish
        },
        productDetails: {
          productType: productionOrder.product.productType,
          design: productionOrder.product.design,
          color: productionOrder.product.color,
          gsm: productionOrder.product.gsm,
          width: productionOrder.product.width,
          length: productionOrder.product.length,
          pattern: productionOrder.product.pattern,
          finish: productionOrder.product.finish
        },
        tracking: {
          totalInward: quantity,
          totalOutward: 0,
          lastStockUpdate: new Date(),
          lastMovementDate: new Date()
        },
        companyId: grn.companyId,
        createdBy: userId,
        updatedBy: userId,
        tags: ['client-material-output', 'production-output', grn.grnNumber]
      };

      const InventoryItem = mongoose.model('InventoryItem');
      const inventoryItem = new InventoryItem(outputItem);
      await inventoryItem.save();

      logger.info('Inventory item created from production output', {
        grnId: grn._id,
        grnNumber: grn.grnNumber,
        productionOrderId,
        inventoryItemId: inventoryItem._id,
        quantity,
        userId
      });

      return inventoryItem;

    } catch (error) {
      logger.error('Error creating inventory item from production output', {
        grnId: grn._id,
        grnNumber: grn.grnNumber,
        productionOrderId,
        quantity,
        userId,
        error: error?.message || error,
        stack: error?.stack
      });
      throw error;
    }
  }

  /**
   * Get client-wise material summary
   */
  async getClientMaterialSummary(req: Request, res: Response): Promise<void> {
    try {
      const { clientId } = req.query;

      const summary = await GreyFabricInward.getClientMaterialSummary(clientId as string);

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Get client material balance details
   */
  async getClientMaterialBalance(req: Request, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;

      if (!clientId) {
        res.status(400).json({ success: false, message: 'Client ID is required' });
        return;
      }

      const balance = await GreyFabricInward.getClientMaterialBalance(clientId);

      res.json({
        success: true,
        data: balance
      });

    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Get client material history
   */
  async getClientMaterialHistory(req: Request, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;
      const { grnId } = req.query;

      if (!clientId) {
        res.status(400).json({ success: false, message: 'Client ID is required' });
        return;
      }

      const history = await GreyFabricInward.getClientMaterialHistory(clientId, grnId as string);

      res.json({
        success: true,
        data: history
      });

    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Get all clients with material summary
   */
  async getAllClientsMaterialSummary(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Get all unique clients with material data
      const clients = await GreyFabricInward.aggregate([
        { $match: { materialSource: 'client_provided' } },
        { $group: {
          _id: '$clientMaterialInfo.clientId',
          clientName: { $first: '$clientMaterialInfo.clientName' },
          totalGRNs: { $sum: 1 },
          totalReceived: { $sum: '$clientMaterialInfo.clientMaterialBalance.totalReceived' },
          totalConsumed: { $sum: '$clientMaterialInfo.clientMaterialBalance.totalConsumed' },
          totalWaste: { $sum: '$clientMaterialInfo.clientMaterialBalance.totalWaste' },
          totalReturned: { $sum: '$clientMaterialInfo.clientMaterialBalance.totalReturned' },
          totalKeptAsStock: { $sum: '$clientMaterialInfo.clientMaterialBalance.totalKeptAsStock' },
          currentBalance: { $sum: '$clientMaterialInfo.clientMaterialBalance.currentBalance' },
          lastActivity: { $max: '$updatedAt' },
          grns: { $push: {
            grnNumber: '$grnNumber',
            fabricType: '$fabricDetails.fabricType',
            fabricColor: '$fabricDetails.color',
            receivedQuantity: '$quantity.receivedQuantity',
            unit: '$quantity.unit',
            status: '$status',
            createdAt: '$createdAt'
          }}
        }},
        { $sort: { lastActivity: -1 } },
        { $skip: skip },
        { $limit: Number(limit) }
      ]);

      // Get total count
      const totalClients = await GreyFabricInward.distinct('clientMaterialInfo.clientId', { 
        materialSource: 'client_provided' 
      });

      res.json({
        success: true,
        data: {
          clients,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: totalClients.length,
            pages: Math.ceil(totalClients.length / Number(limit))
          }
        }
      });

    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Get client materials for return
   */
  async getClientMaterialsForReturn(req: Request, res: Response): Promise<void> {
    try {
      const { clientId } = req.query;

      const query: any = { 
        materialSource: 'client_provided',
        'clientMaterialInfo.returnRequired': true,
        status: { $in: ['approved', 'stock_created'] }
      };

      if (clientId) {
        query['clientMaterialInfo.clientId'] = clientId;
      }

      const clientMaterials = await GreyFabricInward.find(query)
        .populate('clientMaterialInfo.clientId', 'name email phone')
        .populate('clientMaterialInfo.clientOrderId', 'orderNumber')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: clientMaterials
      });

    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Update Purchase Order received quantities when GRN is approved
   */
  private async updatePurchaseOrderReceivedQuantity(grn: any): Promise<void> {
    if (!grn.purchaseOrderId) return;

    try {
      const PurchaseOrder = mongoose.model('PurchaseOrder');
      const acceptedQuantity = grn.quantity.acceptedQuantity || grn.quantity.receivedQuantity;
      
      // Update the specific item in the purchase order
      await PurchaseOrder.findOneAndUpdate(
        { 
          _id: grn.purchaseOrderId,
          'items.itemId': grn.itemId // Assuming GRN has itemId reference
        },
        {
          $inc: {
            'items.$.receivedQuantity': acceptedQuantity,
            'items.$.rejectedQuantity': grn.quantity.rejectedQuantity || 0
          },
          lastReceivedDate: new Date()
        }
      );

      logger.info('Purchase Order received quantities updated', {
        purchaseOrderId: grn.purchaseOrderId,
        grnId: grn._id,
        acceptedQuantity,
        rejectedQuantity: grn.quantity.rejectedQuantity || 0
      });
    } catch (error) {
      logger.error('Error updating Purchase Order received quantities', {
        grnId: grn._id,
        grnNumber: grn.grnNumber,
        purchaseOrderId: grn.purchaseOrderId,
        error
      });
      throw error;
    }
  }

  // Delete grey fabric inward entry
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      const grn = await GreyFabricInward.findOneAndDelete({ _id: id, companyId });

      if (!grn) {
        throw new AppError('GRN entry not found', 404);
      }

      res.json({
        success: true,
        message: 'GRN entry deleted successfully'
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Mark as received
  async markAsReceived(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { receivedAt, qualityChecks, acceptedQuantity, rejectedQuantity } = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.userId || req.user?._id || req.user?.id;

      if (!companyId || !userId) {
        logger.error('Missing authentication data in markAsReceived', {
          hasUser: !!req.user,
          userId: req.user?.userId || req.user?._id || req.user?.id,
          companyId: req.user?.companyId,
          userKeys: req.user ? Object.keys(req.user) : []
        });
        throw new AppError('Company ID and User ID are required', 400);
      }

      // Get GRN details for validation
      const grn = await GreyFabricInward.findById(id);
      if (!grn) {
        throw new AppError('GRN entry not found', 404);
      }

      // Validate quantities if provided
      if (acceptedQuantity !== undefined || rejectedQuantity !== undefined) {
        const totalQuantity = (acceptedQuantity || 0) + (rejectedQuantity || 0);
        if (totalQuantity > grn.quantity.receivedQuantity) {
          throw new AppError('Accepted + Rejected quantity cannot exceed received quantity', 400);
        }
      }

      const updateData: any = {
        status: 'approved',
        actualDeliveryDate: receivedAt ? new Date(receivedAt) : new Date(),
        inspectionStatus: 'completed',
        updatedBy: userId
      };

      // Update quantities if provided
      if (acceptedQuantity !== undefined) {
        updateData['quantity.acceptedQuantity'] = acceptedQuantity;
      }
      if (rejectedQuantity !== undefined) {
        updateData['quantity.rejectedQuantity'] = rejectedQuantity;
      }

      const updatedGRN = await GreyFabricInward.findOneAndUpdate(
        { _id: id, companyId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedGRN) {
        throw new AppError('GRN entry not found', 404);
      }

      // Update inventory stock when GRN is marked as received
      if (updatedGRN.inventoryItemId) {
        try {
          await this.updateInventoryStock(updatedGRN, 'received');
          logger.info('Inventory stock updated for received GRN', {
            grnId: updatedGRN._id,
            grnNumber: updatedGRN.grnNumber,
            acceptedQuantity: acceptedQuantity,
            rejectedQuantity: rejectedQuantity,
            inventoryItemId: updatedGRN.inventoryItemId
          });
        } catch (stockError) {
          logger.error('Failed to update inventory stock for GRN', {
            grnId: updatedGRN._id,
            grnNumber: updatedGRN.grnNumber,
            error: stockError
          });
          // Don't fail the request, just log the error
        }
      }

      // Update Purchase Order received quantities if linked
      if (updatedGRN.purchaseOrderId) {
        try {
          await this.updatePurchaseOrderReceivedQuantity(updatedGRN);
          logger.info('Purchase Order updated with GRN received quantity', {
            grnId: updatedGRN._id,
            grnNumber: updatedGRN.grnNumber,
            purchaseOrderId: updatedGRN.purchaseOrderId
          });
        } catch (poError) {
          logger.error('Failed to update Purchase Order for GRN', {
            grnId: updatedGRN._id,
            grnNumber: updatedGRN.grnNumber,
            purchaseOrderId: updatedGRN.purchaseOrderId,
            error: poError
          });
          // Don't fail the request, just log the error
        }
      }

      res.json({
        success: true,
        message: 'GRN marked as received and stock updated with confirmed quantities',
        data: updatedGRN
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Add quality check
  async addQualityCheck(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const qualityCheck = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        throw new AppError('Company ID and User ID are required', 400);
      }

      // Update inspection details
      const updateData = {
        'inspection.inspectedBy': userId,
        'inspection.inspectedByName': req.user?.name || 'Inspector',
        'inspection.inspectionDate': new Date(),
        'inspection.inspectionNotes': qualityCheck.notes || '',
        'inspection.qualityGrade': qualityCheck.qualityGrade || 'B',
        'inspection.recommendedAction': qualityCheck.recommendedAction || 'accept',
        updatedBy: userId
      };

      const grn = await GreyFabricInward.findOneAndUpdate(
        { _id: id, companyId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!grn) {
        throw new AppError('GRN entry not found', 404);
      }

      res.json({
        success: true,
        message: 'Quality check added successfully',
        data: grn
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Add new lot to existing grey stock entry
  async addLot(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { lotData } = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        throw new AppError('Company ID and User ID are required', 400);
      }

      const grn = await GreyFabricInward.findOne({ _id: id, companyId });
      if (!grn) {
        throw new AppError('GRN entry not found', 404);
      }

      // Validate lot data
      if (!lotData.lotNumber || !lotData.lotQuantity || !lotData.lotUnit) {
        throw new AppError('Missing required lot fields: lotNumber, lotQuantity, lotUnit', 400);
      }

      // Check if lot number already exists
      const existingLot = grn.greyStockLots.find((lot: any) => lot.lotNumber === lotData.lotNumber);
      if (existingLot) {
        throw new AppError('Lot number already exists', 400);
      }

      // Add the new lot
      const newLot = {
        lotNumber: lotData.lotNumber,
        lotQuantity: lotData.lotQuantity,
        lotUnit: lotData.lotUnit as 'meters' | 'yards' | 'pieces',
        lotStatus: 'active' as 'active' | 'consumed' | 'damaged' | 'reserved',
        receivedDate: new Date(),
        expiryDate: lotData.expiryDate ? new Date(lotData.expiryDate) : undefined,
        qualityGrade: lotData.qualityGrade || 'A' as 'A+' | 'A' | 'B+' | 'B' | 'C',
        storageLocation: {
          warehouseId: lotData.warehouseId ? new mongoose.Types.ObjectId(lotData.warehouseId) : grn.storageLocation.warehouseId,
          warehouseName: lotData.warehouseName || grn.storageLocation.warehouseName,
          rackNumber: lotData.rackNumber || '',
          shelfNumber: lotData.shelfNumber || '',
          binNumber: lotData.binNumber || ''
        },
        costPerUnit: lotData.costPerUnit || grn.financial.unitPrice,
        totalCost: lotData.lotQuantity * (lotData.costPerUnit || grn.financial.unitPrice),
        remarks: lotData.remarks || ''
      };

      grn.greyStockLots.push(newLot);
      await grn.save(); // This will trigger the pre-save middleware to calculate stock balances

      // Update inventory item with new stock from lot
      if (grn.inventoryItemId) {
        try {
          const lotStock = newLot.lotUnit === 'meters' ? newLot.lotQuantity : 
                          newLot.lotUnit === 'yards' ? (newLot.lotQuantity * 0.9144) : 
                          newLot.lotQuantity;
          
          await InventoryItem.findByIdAndUpdate(grn.inventoryItemId, {
            $inc: {
              'stock.currentStock': lotStock,
              'stock.totalValue': newLot.totalCost
            },
            'stock.availableStock': { $inc: lotStock },
            'tracking.lastStockUpdate': new Date(),
            'tracking.totalInward': { $inc: lotStock }
          });

          logger.info('Updated inventory item with new lot stock', {
            grnId: grn._id,
            lotNumber: newLot.lotNumber,
            lotStock: lotStock,
            inventoryItemId: grn.inventoryItemId
          });
        } catch (inventoryError) {
          logger.error('Failed to update inventory item with new lot', {
            grnId: grn._id,
            lotNumber: newLot.lotNumber,
            error: inventoryError
          });
        }
      }

      res.json({
        success: true,
        message: 'Lot added successfully and inventory updated',
        data: grn
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Update lot status
  async updateLotStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id, lotNumber } = req.params;
      const { status, remarks } = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        throw new AppError('Company ID and User ID are required', 400);
      }

      if (!['active', 'consumed', 'damaged', 'reserved'].includes(status)) {
        throw new AppError('Invalid lot status', 400);
      }

      const grn = await GreyFabricInward.findOne({ _id: id, companyId });
      if (!grn) {
        throw new AppError('GRN entry not found', 404);
      }

      const lot = grn.greyStockLots.find((l: any) => l.lotNumber === lotNumber);
      if (!lot) {
        throw new AppError('Lot not found', 404);
      }

      const oldStatus = lot.lotStatus;
      lot.lotStatus = status;
      if (remarks) lot.remarks = remarks;
      
      await grn.save(); // This will trigger the pre-save middleware to recalculate stock balances

      // Update inventory item based on status change
      if (grn.inventoryItemId) {
        try {
          const lotStock = lot.lotUnit === 'meters' ? lot.lotQuantity : 
                          lot.lotUnit === 'yards' ? (lot.lotQuantity * 0.9144) : 
                          lot.lotQuantity;
          
          let inventoryUpdate: any = {
            'tracking.lastStockUpdate': new Date()
          };

          // Handle status changes
          if (oldStatus === 'active' && status !== 'active') {
            // Moving from active to consumed/damaged/reserved
            inventoryUpdate.$inc = {
              'stock.availableStock': -lotStock
            };
            if (status === 'damaged') {
              inventoryUpdate.$inc['stock.damagedStock'] = lotStock;
            } else if (status === 'reserved') {
              inventoryUpdate.$inc['stock.reservedStock'] = lotStock;
            }
          } else if (oldStatus !== 'active' && status === 'active') {
            // Moving back to active
            inventoryUpdate.$inc = {
              'stock.availableStock': lotStock
            };
            if (oldStatus === 'damaged') {
              inventoryUpdate.$inc['stock.damagedStock'] = -lotStock;
            } else if (oldStatus === 'reserved') {
              inventoryUpdate.$inc['stock.reservedStock'] = -lotStock;
            }
          }

          if (inventoryUpdate.$inc) {
            await InventoryItem.findByIdAndUpdate(grn.inventoryItemId, inventoryUpdate);
          }

          logger.info('Updated inventory item with lot status change', {
            grnId: grn._id,
            lotNumber: lot.lotNumber,
            oldStatus,
            newStatus: status,
            inventoryItemId: grn.inventoryItemId
          });
        } catch (inventoryError) {
          logger.error('Failed to update inventory item with lot status change', {
            grnId: grn._id,
            lotNumber: lot.lotNumber,
            error: inventoryError
          });
        }
      }

      res.json({
        success: true,
        message: 'Lot status updated successfully and inventory synchronized',
        data: grn
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Get grey stock summary
  async getStockSummary(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      const { fabricType, color, gsm } = req.query;

      // Build filter
      const filter: any = { companyId, stockStatus: { $in: ['active', 'low_stock'] } };
      if (fabricType) filter['fabricDetails.fabricType'] = fabricType;
      if (color) filter['fabricDetails.color'] = new RegExp(color as string, 'i');
      if (gsm) filter['fabricDetails.gsm'] = Number(gsm);

      const stockEntries = await GreyFabricInward.find(filter)
        .select('grnNumber fabricDetails stockBalance greyStockLots supplierName')
        .lean();

      // Aggregate stock data
      const stockSummary = stockEntries.map(entry => ({
        grnNumber: entry.grnNumber,
        fabricDetails: entry.fabricDetails,
        stockBalance: entry.stockBalance,
        supplierName: entry.supplierName,
        lotCount: entry.greyStockLots.length,
        activeLots: entry.greyStockLots.filter((lot: any) => lot.lotStatus === 'active').length
      }));

      // Calculate totals
      const totalMeters = stockSummary.reduce((sum, entry) => sum + entry.stockBalance.totalMeters, 0);
      const totalYards = stockSummary.reduce((sum, entry) => sum + entry.stockBalance.totalYards, 0);
      const totalPieces = stockSummary.reduce((sum, entry) => sum + entry.stockBalance.totalPieces, 0);
      const availableMeters = stockSummary.reduce((sum, entry) => sum + entry.stockBalance.availableMeters, 0);
      const availableYards = stockSummary.reduce((sum, entry) => sum + entry.stockBalance.availableYards, 0);
      const availablePieces = stockSummary.reduce((sum, entry) => sum + entry.stockBalance.availablePieces, 0);

      res.json({
        success: true,
        data: {
          stockEntries: stockSummary,
          totals: {
            totalMeters,
            totalYards,
            totalPieces,
            availableMeters,
            availableYards,
            availablePieces
          }
        }
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Get lot-wise details for a specific entry
  async getLotDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      const grn = await GreyFabricInward.findOne({ _id: id, companyId })
        .select('grnNumber fabricDetails greyStockLots stockBalance')
        .lean();

      if (!grn) {
        throw new AppError('GRN entry not found', 404);
      }

      // Group lots by status
      const lotsByStatus = {
        active: grn.greyStockLots.filter((lot: any) => lot.lotStatus === 'active'),
        consumed: grn.greyStockLots.filter((lot: any) => lot.lotStatus === 'consumed'),
        damaged: grn.greyStockLots.filter((lot: any) => lot.lotStatus === 'damaged'),
        reserved: grn.greyStockLots.filter((lot: any) => lot.lotStatus === 'reserved')
      };

      res.json({
        success: true,
        data: {
          grnNumber: grn.grnNumber,
          fabricDetails: grn.fabricDetails,
          stockBalance: grn.stockBalance,
          lotsByStatus,
          totalLots: grn.greyStockLots.length
        }
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // Get analytics
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { period = '30d', startDate, endDate } = req.query;
      const companyId = req.user?.companyId;

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      // Calculate date range
      let dateFilter: any = { companyId };
      const now = new Date();
      
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      } else {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const start = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
        dateFilter.createdAt = { $gte: start };
      }

      // Get basic stats
      const [totalGrns, receivedGrns, pendingGrns, rejectedGrns] = await Promise.all([
        GreyFabricInward.countDocuments(dateFilter),
        GreyFabricInward.countDocuments({ ...dateFilter, status: 'approved' }),
        GreyFabricInward.countDocuments({ ...dateFilter, status: 'pending' }),
        GreyFabricInward.countDocuments({ ...dateFilter, status: 'rejected' })
      ]);

      // Get total fabric quantity
      const fabricData = await GreyFabricInward.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, totalQuantity: { $sum: '$quantity.receivedQuantity' } } }
      ]);
      const totalFabricQuantity = fabricData[0]?.totalQuantity || 0;

      // Get quality distribution
      const qualityDistribution = await GreyFabricInward.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$inspection.qualityGrade', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Get total value
      const valueData = await GreyFabricInward.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, totalValue: { $sum: '$financial.totalValue' } } }
      ]);
      const totalValue = valueData[0]?.totalValue || 0;

      // Get top suppliers
      const topSuppliers = await GreyFabricInward.aggregate([
        { $match: dateFilter },
        { $group: { 
          _id: '$supplierName', 
          count: { $sum: 1 },
          totalValue: { $sum: '$financial.totalValue' }
        }},
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      // Get monthly trends
      const monthlyTrends = await GreyFabricInward.aggregate([
        { $match: dateFilter },
        { $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          value: { $sum: '$financial.totalValue' }
        }},
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      // Calculate average quality
      const qualityScores = { 'A': 4, 'B': 3, 'C': 2, 'D': 1 };
      let totalScore = 0;
      let totalCount = 0;
      
      qualityDistribution.forEach(item => {
        const score = qualityScores[item._id as keyof typeof qualityScores] || 0;
        totalScore += score * item.count;
        totalCount += item.count;
      });
      
      const averageQuality = totalCount > 0 ? 
        Object.keys(qualityScores)[Math.round(totalScore / totalCount)] : 'N/A';

      // Format quality distribution with percentages
      const formattedQualityDistribution = qualityDistribution.map(item => ({
        quality: item._id,
        count: item.count,
        percentage: totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0
      }));

      // Format monthly trends
      const formattedMonthlyTrends = monthlyTrends.map(item => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        count: item.count,
        value: item.value
      }));

      res.json({
        success: true,
        data: {
          totalGrns,
          receivedGrns,
          pendingGrns,
          rejectedGrns,
          totalFabricQuantity,
          averageQuality,
          totalValue,
          topSuppliers,
          qualityDistribution: formattedQualityDistribution,
          monthlyTrends: formattedMonthlyTrends
        }
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }
}