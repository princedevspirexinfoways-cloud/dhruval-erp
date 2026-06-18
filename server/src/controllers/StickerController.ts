import { Request, Response } from 'express';
import Sticker from '../models/Sticker';
import { IUser } from '../types/models';

class StickerController {
  // Get all stickers - Admin, Manager, Operator
  static async getAllStickers(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { companyId, type, status } = req.query;
      
      let query: any = {};
      
      // If user is not admin, restrict to their company
      if (user.role !== 'admin') {
        query.companyId = user.companyId;
      } else if (companyId) {
        query.companyId = companyId;
      }
      
      if (type) {
        query.type = type;
      }
      
      if (status) {
        query.status = status;
      }
      
      const stickers = await Sticker.find(query)
        .populate('companyId', 'name')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        data: stickers,
        total: stickers.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching stickers',
        error: error.message
      });
    }
  }

  // Get sticker by ID - Admin, Manager, Operator
  static async getStickerById(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { id } = req.params;
      
      const sticker = await Sticker.findById(id)
        .populate('companyId', 'name')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');
      
      if (!sticker) {
        return res.status(404).json({
          success: false,
          message: 'Sticker not found'
        });
      }
      
      // Check if user has access to this sticker
      if (user.role !== 'admin' && sticker.companyId.toString() !== user.companyId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      res.json({
        success: true,
        data: sticker
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching sticker',
        error: error.message
      });
    }
  }

  // Create new sticker - Admin, Manager, Operator
  static async createSticker(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const stickerData = req.body;
      
      // Set company ID based on user role
      if (user.role !== 'admin') {
        stickerData.companyId = user.companyId;
      }
      
      // Generate unique sticker ID
      stickerData.stickerId = `STK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate barcode and QR code data
      stickerData.barcodeData = `BC-${stickerData.sku}-${stickerData.batchNumber}`;
      stickerData.qrCodeData = `QR-${stickerData.designNumber}-${stickerData.color}-${stickerData.quantity}`;
      
      // Generate barcode and QR code images (placeholder URLs for now)
      stickerData.barcodeImage = `/api/stickers/barcode/${stickerData.barcodeData}`;
      stickerData.qrCodeImage = `/api/stickers/qr/${stickerData.qrCodeData}`;
      
      stickerData.createdBy = user._id;
      stickerData.updatedBy = user._id;
      
      const sticker = new Sticker(stickerData);
      await sticker.save();
      
      res.status(201).json({
        success: true,
        message: 'Sticker created successfully',
        data: sticker
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating sticker',
        error: error.message
      });
    }
  }

  // Update sticker - Admin, Manager, Operator
  static async updateSticker(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { id } = req.params;
      const updateData = req.body;
      
      const sticker = await Sticker.findById(id);
      if (!sticker) {
        return res.status(404).json({
          success: false,
          message: 'Sticker not found'
        });
      }
      
      // Check if user has access to this sticker
      if (user.role !== 'admin' && sticker.companyId.toString() !== user.companyId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      updateData.updatedBy = user._id;
      updateData.updatedAt = new Date();
      
      const updatedSticker = await Sticker.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      res.json({
        success: true,
        message: 'Sticker updated successfully',
        data: updatedSticker
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating sticker',
        error: error.message
      });
    }
  }

  // Delete sticker - Admin only
  static async deleteSticker(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const sticker = await Sticker.findById(id);
      if (!sticker) {
        return res.status(404).json({
          success: false,
          message: 'Sticker not found'
        });
      }
      
      await Sticker.findByIdAndDelete(id);
      
      res.json({
        success: true,
        message: 'Sticker deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting sticker',
        error: error.message
      });
    }
  }

  // Generate sticker - Admin, Manager, Operator
  static async generateSticker(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { designNumber, sku, batchNumber, color, quantity, type } = req.body;
      
      // Validate required fields
      if (!designNumber || !sku || !batchNumber || !color || !quantity || !type) {
        return res.status(400).json({
          success: false,
          message: 'All required fields must be provided'
        });
      }
      
      // Check if sticker already exists
      const existingSticker = await Sticker.findOne({
        designNumber,
        sku,
        batchNumber,
        color
      });
      
      if (existingSticker) {
        return res.status(400).json({
          success: false,
          message: 'Sticker already exists for this combination'
        });
      }
      
      // Create new sticker
      const stickerData = {
        designNumber,
        sku,
        batchNumber,
        color,
        quantity,
        type,
        companyId: user.companyId,
        createdBy: user._id,
        updatedBy: user._id
      };
      
      const sticker = new Sticker(stickerData);
      await sticker.save();
      
      res.status(201).json({
        success: true,
        message: 'Sticker generated successfully',
        data: sticker
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error generating sticker',
        error: error.message
      });
    }
  }

  // Generate bulk stickers - Admin, Manager, Operator
  static async generateBulkStickers(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { stickers } = req.body;
      
      if (!Array.isArray(stickers)) {
        return res.status(400).json({
          success: false,
          message: 'Stickers must be an array'
        });
      }
      
      const results = [];
      
      for (const stickerData of stickers) {
        try {
          const sticker = new Sticker({
            ...stickerData,
            companyId: user.companyId,
            createdBy: user._id,
            updatedBy: user._id
          });
          
          await sticker.save();
          results.push({ success: true, data: sticker });
        } catch (error) {
          results.push({ success: false, error: error.message });
        }
      }
      
      res.json({
        success: true,
        message: 'Bulk sticker generation completed',
        results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error during bulk sticker generation',
        error: error.message
      });
    }
  }

  // Generate batch stickers - Admin, Manager, Operator
  static async generateBatchStickers(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { batchNumber, items } = req.body;
      
      if (!batchNumber || !Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: 'Batch number and items array are required'
        });
      }
      
      const results = [];
      
      for (const item of items) {
        try {
          const sticker = new Sticker({
            ...item,
            batchNumber,
            companyId: user.companyId,
            createdBy: user._id,
            updatedBy: user._id
          });
          
          await sticker.save();
          results.push({ success: true, data: sticker });
        } catch (error) {
          results.push({ success: false, error: error.message });
        }
      }
      
      res.json({
        success: true,
        message: 'Batch sticker generation completed',
        results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error during batch sticker generation',
        error: error.message
      });
    }
  }

  // Print sticker - Admin, Manager, Operator
  static async printSticker(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { id } = req.params;
      const { copies, printerName } = req.body;
      
      const sticker = await Sticker.findById(id);
      if (!sticker) {
        return res.status(404).json({
          success: false,
          message: 'Sticker not found'
        });
      }
      
      // Check if user has access to this sticker
      if (user.role !== 'admin' && sticker.companyId.toString() !== user.companyId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      // Record print history
      const printRecord = {
        printedAt: new Date(),
        printedBy: user._id,
        printerName: printerName || 'Default Printer',
        copies: copies || 1,
        status: 'success' as const
      };
      
      sticker.printHistory.push(printRecord);
      sticker.status = 'printed';
      sticker.updatedBy = user._id;
      sticker.updatedAt = new Date();
      
      await sticker.save();
      
      res.json({
        success: true,
        message: 'Sticker printed successfully',
        data: sticker
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error printing sticker',
        error: error.message
      });
    }
  }

  // Print multiple copies - Admin, Manager, Operator
  static async printMultipleCopies(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { id } = req.params;
      const { copies, printerName } = req.body;
      
      const sticker = await Sticker.findById(id);
      if (!sticker) {
        return res.status(404).json({
          success: false,
          message: 'Sticker not found'
        });
      }
      
      // Check if user has access to this sticker
      if (user.role !== 'admin' && sticker.companyId.toString() !== user.companyId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      // Record print history
      const printRecord = {
        printedAt: new Date(),
        printedBy: user._id,
        printerName: printerName || 'Default Printer',
        copies: copies || 1,
        status: 'success' as const
      };
      
      sticker.printHistory.push(printRecord);
      sticker.status = 'printed';
      sticker.updatedBy = user._id;
      sticker.updatedAt = new Date();
      
      await sticker.save();
      
      res.json({
        success: true,
        message: `${copies} copies printed successfully`,
        data: sticker
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error printing multiple copies',
        error: error.message
      });
    }
  }

  // Bulk print stickers - Admin, Manager, Operator
  static async bulkPrintStickers(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { stickerIds, copies, printerName } = req.body;
      
      if (!Array.isArray(stickerIds)) {
        return res.status(400).json({
          success: false,
          message: 'Sticker IDs must be an array'
        });
      }
      
      const results = [];
      
      for (const stickerId of stickerIds) {
        try {
          const sticker = await Sticker.findById(stickerId);
          if (sticker) {
            // Check if user has access to this sticker
            if (user.role !== 'admin' && sticker.companyId.toString() !== user.companyId.toString()) {
              results.push({ success: false, error: 'Access denied' });
              continue;
            }
            
            // Record print history
            const printRecord = {
              printedAt: new Date(),
              printedBy: user._id,
              printerName: printerName || 'Default Printer',
              copies: copies || 1,
              status: 'success' as const
            };
            
            sticker.printHistory.push(printRecord);
            sticker.status = 'printed';
            sticker.updatedBy = user._id;
            sticker.updatedAt = new Date();
            
            await sticker.save();
            results.push({ success: true, data: sticker });
          } else {
            results.push({ success: false, error: 'Sticker not found' });
          }
        } catch (error) {
          results.push({ success: false, error: error.message });
        }
      }
      
      res.json({
        success: true,
        message: 'Bulk printing completed',
        results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error during bulk printing',
        error: error.message
      });
    }
  }

  // Get print history - Admin, Manager, Operator
  static async getPrintHistory(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { id } = req.params;
      
      const sticker = await Sticker.findById(id);
      if (!sticker) {
        return res.status(404).json({
          success: false,
          message: 'Sticker not found'
        });
      }
      
      // Check if user has access to this sticker
      if (user.role !== 'admin' && sticker.companyId.toString() !== user.companyId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      res.json({
        success: true,
        data: sticker.printHistory
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching print history',
        error: error.message
      });
    }
  }

  // Apply sticker - Admin, Manager, Operator
  static async applySticker(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { id } = req.params;
      const { itemType, itemId, location } = req.body;
      
      const sticker = await Sticker.findById(id);
      if (!sticker) {
        return res.status(404).json({
          success: false,
          message: 'Sticker not found'
        });
      }
      
      // Check if user has access to this sticker
      if (user.role !== 'admin' && sticker.companyId.toString() !== user.companyId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      if (sticker.status !== 'printed') {
        return res.status(400).json({
          success: false,
          message: 'Sticker must be printed before applying'
        });
      }
      
      sticker.appliedTo = {
        itemType,
        itemId,
        appliedAt: new Date(),
        appliedBy: user._id,
        location
      };
      
      sticker.status = 'applied';
      sticker.updatedBy = user._id;
      sticker.updatedAt = new Date();
      
      await sticker.save();
      
      res.json({
        success: true,
        message: 'Sticker applied successfully',
        data: sticker
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error applying sticker',
        error: error.message
      });
    }
  }

  // Update sticker status - Admin, Manager, Operator
  static async updateStickerStatus(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { id } = req.params;
      const { status, remarks } = req.body;
      
      const sticker = await Sticker.findById(id);
      if (!sticker) {
        return res.status(404).json({
          success: false,
          message: 'Sticker not found'
        });
      }
      
      // Check if user has access to this sticker
      if (user.role !== 'admin' && sticker.companyId.toString() !== user.companyId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      sticker.status = status;
      
      sticker.updatedBy = user._id;
      sticker.updatedAt = new Date();
      
      await sticker.save();
      
      res.json({
        success: true,
        message: 'Sticker status updated successfully',
        data: sticker
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating sticker status',
        error: error.message
      });
    }
  }

  // Reprint sticker - Admin, Manager, Operator
  static async reprintSticker(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { id } = req.params;
      const { reason, copies, printerName } = req.body;
      
      const sticker = await Sticker.findById(id);
      if (!sticker) {
        return res.status(404).json({
          success: false,
          message: 'Sticker not found'
        });
      }
      
      // Check if user has access to this sticker
      if (user.role !== 'admin' && sticker.companyId.toString() !== user.companyId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      if (sticker.reprintCount >= sticker.maxReprints) {
        return res.status(400).json({
          success: false,
          message: 'Maximum reprint limit reached'
        });
      }
      
      // Record reprint
      sticker.reprintCount += 1;
      sticker.reprintReason = reason;
      sticker.status = 'reprinted';
      
      // Record print history
      const printRecord = {
        printedAt: new Date(),
        printedBy: user._id,
        printerName: printerName || 'Default Printer',
        copies: copies || 1,
        status: 'success' as const
      };
      
      sticker.printHistory.push(printRecord);
      sticker.updatedBy = user._id;
      sticker.updatedAt = new Date();
      
      await sticker.save();
      
      res.json({
        success: true,
        message: 'Sticker reprinted successfully',
        data: sticker
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error reprinting sticker',
        error: error.message
      });
    }
  }

  // Search by design number - Admin, Manager, Operator
  static async searchByDesign(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { designNumber } = req.params;
      
      let query: any = { designNumber: { $regex: designNumber, $options: 'i' } };
      
      // If user is not admin, restrict to their company
      if (user.role !== 'admin') {
        query.companyId = user.companyId;
      }
      
      const stickers = await Sticker.find(query)
        .populate('companyId', 'name')
        .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        data: stickers,
        total: stickers.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error searching by design',
        error: error.message
      });
    }
  }

  // Search by SKU - Admin, Manager, Operator
  static async searchBySKU(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { sku } = req.params;
      
      let query: any = { sku: { $regex: sku, $options: 'i' } };
      
      // If user is not admin, restrict to their company
      if (user.role !== 'admin') {
        query.companyId = user.companyId;
      }
      
      const stickers = await Sticker.find(query)
        .populate('companyId', 'name')
        .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        data: stickers,
        total: stickers.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error searching by SKU',
        error: error.message
      });
    }
  }

  // Search by batch number - Admin, Manager, Operator
  static async searchByBatch(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { batchNumber } = req.params;
      
      let query: any = { batchNumber: { $regex: batchNumber, $options: 'i' } };
      
      // If user is not admin, restrict to their company
      if (user.role !== 'admin') {
        query.companyId = user.companyId;
      }
      
      const stickers = await Sticker.find(query)
        .populate('companyId', 'name')
        .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        data: stickers,
        total: stickers.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error searching by batch',
        error: error.message
      });
    }
  }

  // Search by barcode - Admin, Manager, Operator
  static async searchByBarcode(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { barcodeData } = req.params;
      
      let query: any = { barcodeData: { $regex: barcodeData, $options: 'i' } };
      
      // If user is not admin, restrict to their company
      if (user.role !== 'admin') {
        query.companyId = user.companyId;
      }
      
      const stickers = await Sticker.find(query)
        .populate('companyId', 'name')
        .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        data: stickers,
        total: stickers.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error searching by barcode',
        error: error.message
      });
    }
  }

  // Search by QR code - Admin, Manager, Operator
  static async searchByQRCode(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { qrCodeData } = req.params;
      
      let query: any = { qrCodeData: { $regex: qrCodeData, $options: 'i' } };
      
      // If user is not admin, restrict to their company
      if (user.role !== 'admin') {
        query.companyId = user.companyId;
      }
      
      const stickers = await Sticker.find(query)
        .populate('companyId', 'name')
        .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        data: stickers,
        total: stickers.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error searching by QR code',
        error: error.message
      });
    }
  }

  // Filter by type - Admin, Manager, Operator
  static async filterByType(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { type } = req.params;
      
      let query: any = { type };
      
      // If user is not admin, restrict to their company
      if (user.role !== 'admin') {
        query.companyId = user.companyId;
      }
      
      const stickers = await Sticker.find(query)
        .populate('companyId', 'name')
        .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        data: stickers,
        total: stickers.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error filtering by type',
        error: error.message
      });
    }
  }

  // Filter by status - Admin, Manager, Operator
  static async filterByStatus(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { status } = req.params;
      
      let query: any = { status };
      
      // If user is not admin, restrict to their company
      if (user.role !== 'admin') {
        query.companyId = user.companyId;
      }
      
      const stickers = await Sticker.find(query)
        .populate('companyId', 'name')
        .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        data: stickers,
        total: stickers.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error filtering by status',
        error: error.message
      });
    }
  }

  // Get all templates - Admin, Manager
  static async getAllTemplates(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      
      // For now, return default templates
      const templates = [
        {
          id: 'saree-template',
          name: 'Saree Template',
          width: 100,
          height: 50,
          orientation: 'landscape',
          backgroundColor: '#FFFFFF',
          textColor: '#000000',
          fontSize: 12
        },
        {
          id: 'fabric-template',
          name: 'Fabric Template',
          width: 80,
          height: 60,
          orientation: 'portrait',
          backgroundColor: '#FFFFFF',
          textColor: '#000000',
          fontSize: 10
        }
      ];
      
      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching templates',
        error: error.message
      });
    }
  }

  // Create template - Admin, Manager
  static async createTemplate(req: Request, res: Response) {
    try {
      const templateData = req.body;
      
      // This would typically save to a separate template collection
      res.json({
        success: true,
        message: 'Template created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating template',
        error: error.message
      });
    }
  }

  // Update template - Admin, Manager
  static async updateTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // This would typically update a template in a separate collection
      res.json({
        success: true,
        message: 'Template updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating template',
        error: error.message
      });
    }
  }

  // Delete template - Admin only
  static async deleteTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // This would typically delete a template from a separate collection
      res.json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting template',
        error: error.message
      });
    }
  }

  // Get sticker summary - Admin, Manager
  static async getStickerSummary(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { startDate, endDate } = req.query;
      
      let query: any = {};
      
      // If user is not admin, restrict to their company
      if (user.role !== 'admin') {
        query.companyId = user.companyId;
      }
      
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }
      
      const stickers = await Sticker.find(query);
      
      const summary = {
        total: stickers.length,
        pending: stickers.filter(s => s.status === 'pending').length,
        printed: stickers.filter(s => s.status === 'printed').length,
        applied: stickers.filter(s => s.status === 'applied').length,
        damaged: stickers.filter(s => s.status === 'damaged').length,
        reprinted: stickers.filter(s => s.status === 'reprinted').length
      };
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching sticker summary',
        error: error.message
      });
    }
  }

  // Get print status report - Admin, Manager
  static async getPrintStatusReport(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { startDate, endDate } = req.query;
      
      let query: any = {};
      
      // If user is not admin, restrict to their company
      if (user.role !== 'admin') {
        query.companyId = user.companyId;
      }
      
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }
      
      const stickers = await Sticker.find(query);
      
      const report = {
        totalStickers: stickers.length,
        printStatus: {
          pending: stickers.filter(s => s.status === 'pending').length,
          printed: stickers.filter(s => s.status === 'printed').length,
          applied: stickers.filter(s => s.status === 'applied').length,
          damaged: stickers.filter(s => s.status === 'damaged').length,
          reprinted: stickers.filter(s => s.status === 'reprinted').length
        },
        printHistory: stickers.reduce((total, sticker) => total + sticker.printHistory.length, 0)
      };
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching print status report',
        error: error.message
      });
    }
  }

  // Get application status report - Admin, Manager
  static async getApplicationStatusReport(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { startDate, endDate } = req.query;
      
      let query: any = {};
      
      // If user is not admin, restrict to their company
      if (user.role !== 'admin') {
        query.companyId = user.companyId;
      }
      
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }
      
      const stickers = await Sticker.find(query);
      
      const report = {
        totalStickers: stickers.length,
        applicationStatus: {
          notApplied: stickers.filter(s => !s.appliedTo).length,
          applied: stickers.filter(s => s.appliedTo).length
        },
        appliedTo: {
          inventory: stickers.filter(s => s.appliedTo?.itemType === 'inventory').length,
          dispatch: stickers.filter(s => s.appliedTo?.itemType === 'dispatch').length,
          production: stickers.filter(s => s.appliedTo?.itemType === 'production').length
        }
      };
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching application status report',
        error: error.message
      });
    }
  }

  // Get reprint analysis - Admin, Manager
  static async getReprintAnalysis(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { startDate, endDate } = req.query;
      
      let query: any = {};
      
      // If user is not admin, restrict to their company
      if (user.role !== 'admin') {
        query.companyId = user.companyId;
      }
      
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }
      
      const stickers = await Sticker.find(query);
      
      const analysis = {
        totalStickers: stickers.length,
        reprintedStickers: stickers.filter(s => s.reprintCount > 0).length,
        totalReprints: stickers.reduce((total, sticker) => total + sticker.reprintCount, 0),
        reprintReasons: stickers
          .filter(s => s.reprintReason)
          .reduce((acc, sticker) => {
            acc[sticker.reprintReason] = (acc[sticker.reprintReason] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
      };
      
      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching reprint analysis',
        error: error.message
      });
    }
  }

  // Export stickers to CSV - Admin, Manager
  static async exportStickersCSV(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { startDate, endDate } = req.query;
      
      let query: any = {};
      
      // If user is not admin, restrict to their company
      if (user.role !== 'admin') {
        query.companyId = user.companyId;
      }
      
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }
      
      const stickers = await Sticker.find(query)
        .populate('companyId', 'name')
        .populate('createdBy', 'name');
      
      // Generate CSV content
      const csvContent = [
        'Sticker ID,Design Number,SKU,Batch Number,Color,Quantity,Type,Status,Company,Created By,Created At',
        ...stickers.map(sticker => 
          `${sticker.stickerId},${sticker.designNumber},${sticker.sku},${sticker.batchNumber},${sticker.color},${sticker.quantity},${sticker.type},${sticker.status},${(sticker.companyId as any)?.name || ''},${(sticker.createdBy as any)?.name || ''},${sticker.createdAt}`
        ).join('\n')
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=stickers.csv');
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error exporting to CSV',
        error: error.message
      });
    }
  }

  // Export stickers to PDF - Admin, Manager
  static async exportStickersPDF(req: Request, res: Response) {
    try {
      // This would generate a PDF report
      res.json({
        success: true,
        message: 'PDF export functionality to be implemented'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error exporting to PDF',
        error: error.message
      });
    }
  }

  // Export stickers to Excel - Admin, Manager
  static async exportStickersExcel(req: Request, res: Response) {
    try {
      // This would generate an Excel file
      res.json({
        success: true,
        message: 'Excel export functionality to be implemented'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error exporting to Excel',
        error: error.message
      });
    }
  }
}

export default StickerController;
