import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { GoodsReturnService } from '../services/GoodsReturnService';
import { IGoodsReturn } from '@/types/models';
import { AppError } from '../utils/errors';
import { logger } from '@/utils/logger';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

export class GoodsReturnController extends BaseController<IGoodsReturn> {
  private goodsReturnService: GoodsReturnService;

  constructor() {
    const goodsReturnService = new GoodsReturnService();
    super(goodsReturnService, 'GoodsReturn');
    this.goodsReturnService = goodsReturnService;
  }

  /**
   * Create goods return
   * POST /api/v1/goods-returns
   */
  createGoodsReturn = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?._id;
      const companyId = (req as any).company?._id || (req as any).user?.primaryCompanyId;

      if (!userId) {
        this.sendError(res, new AppError('User ID is required', 400), 'User ID is required');
        return;
      }

      if (!companyId) {
        this.sendError(res, new AppError('Company ID is required', 400), 'Company ID is required');
        return;
      }

      const { inventoryItemId, returnData } = req.body;

      if (!inventoryItemId) {
        this.sendError(res, new AppError('Inventory item ID is required', 400), 'Validation error');
        return;
      }

      if (!returnData) {
        this.sendError(res, new AppError('Return data is required', 400), 'Validation error');
        return;
      }

      const goodsReturn = await this.goodsReturnService.createGoodsReturn(
        inventoryItemId,
        returnData,
        userId.toString(),
        companyId.toString()
      );

      this.sendSuccess(res, goodsReturn, 'Goods return created successfully', 201);
    } catch (error: any) {
      logger.error('Error creating goods return', { error, body: req.body });
      this.sendError(res, error, 'Failed to create goods return');
    }
  };

  /**
   * Get goods returns by challan number
   * GET /api/v1/goods-returns/challan/:challanNumber
   */
  getReturnsByChallan = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyId = (req as any).company?._id || (req as any).user?.primaryCompanyId;
      const { challanNumber } = req.params;

      if (!companyId) {
        this.sendError(res, new AppError('Company ID is required', 400), 'Company ID is required');
        return;
      }

      if (!challanNumber) {
        this.sendError(res, new AppError('Challan number is required', 400), 'Validation error');
        return;
      }

      const returns = await this.goodsReturnService.getReturnsByChallan(companyId.toString(), challanNumber);

      this.sendSuccess(res, returns, 'Returns fetched successfully');
    } catch (error: any) {
      logger.error('Error fetching returns by challan', { error, challanNumber: req.params.challanNumber });
      this.sendError(res, error, 'Failed to fetch returns by challan');
    }
  };

  /**
   * Get challan return summary
   * GET /api/v1/goods-returns/challan/:challanNumber/summary
   */
  getChallanReturnSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyId = (req as any).company?._id || (req as any).user?.primaryCompanyId;
      const { challanNumber } = req.params;

      if (!companyId) {
        this.sendError(res, new AppError('Company ID is required', 400), 'Company ID is required');
        return;
      }

      if (!challanNumber) {
        this.sendError(res, new AppError('Challan number is required', 400), 'Validation error');
        return;
      }

      const summary = await this.goodsReturnService.getChallanReturnSummary(companyId.toString(), challanNumber);

      this.sendSuccess(res, summary, 'Challan return summary fetched successfully');
    } catch (error: any) {
      logger.error('Error fetching challan return summary', { error, challanNumber: req.params.challanNumber });
      this.sendError(res, error, 'Failed to fetch challan return summary');
    }
  };

  /**
   * Get all goods returns with filtering and pagination
   * GET /api/v1/goods-returns
   */
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyId = (req as any).company?._id || (req as any).user?.primaryCompanyId;

      if (!companyId) {
        this.sendError(res, new AppError('Company ID is required', 400), 'Company ID is required');
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const sortBy = (req.query.sortBy as string) || 'returnDate';
      const sortOrder = (req.query.sortOrder as string) === 'asc' ? 1 : -1;
      const sort: any = { [sortBy]: sortOrder };

      // Build filter
      const filter: any = {
        companyId: new (await import('mongoose')).Types.ObjectId(companyId.toString()),
      };

      // Status filter
      if (req.query.status && req.query.status !== 'all') {
        filter.status = req.query.status;
      }

      // Return status filter
      if (req.query.returnStatus && req.query.returnStatus !== 'all') {
        filter.returnStatus = req.query.returnStatus;
      }

      // Return reason filter
      if (req.query.returnReason && req.query.returnReason !== 'all') {
        filter.returnReason = req.query.returnReason;
      }

      // Challan number filter
      if (req.query.challanNumber) {
        filter.originalChallanNumber = { $regex: req.query.challanNumber, $options: 'i' };
      }

      // Inventory item filter
      if (req.query.inventoryItemId) {
        filter.inventoryItemId = new (await import('mongoose')).Types.ObjectId(req.query.inventoryItemId as string);
      }

      // Date range filter
      if (req.query.dateFrom || req.query.dateTo) {
        filter.returnDate = {};
        if (req.query.dateFrom) {
          filter.returnDate.$gte = new Date(req.query.dateFrom as string);
        }
        if (req.query.dateTo) {
          const endDate = new Date(req.query.dateTo as string);
          endDate.setHours(23, 59, 59, 999);
          filter.returnDate.$lte = endDate;
        }
      }

      // Search filter
      if (req.query.search) {
        const searchTerm = req.query.search as string;
        filter.$or = [
          { itemName: { $regex: searchTerm, $options: 'i' } },
          { itemCode: { $regex: searchTerm, $options: 'i' } },
          { returnNumber: { $regex: searchTerm, $options: 'i' } },
          { originalChallanNumber: { $regex: searchTerm, $options: 'i' } },
        ];
      }

      logger.info('Getting goods returns with filter', { page, limit, filter });

      const result = await this.goodsReturnService.paginate(filter, page, limit, sort, [
        'inventoryItemId',
        'warehouseId',
        'supplierId',
        'createdBy',
      ]);

      this.sendPaginatedResponse(res, result, 'Goods returns retrieved successfully');
    } catch (error: any) {
      logger.error('Error getting goods returns', { error, query: req.query });
      this.sendError(res, error, 'Failed to get goods returns');
    }
  };

  /**
   * Generate Goods Return Challan PDF
   * GET /api/v1/goods-returns/:id/challan/pdf
   */
  generateChallanPDF = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const companyId = (req as any).company?._id || (req as any).user?.primaryCompanyId;

      if (!companyId) {
        this.sendError(res, new AppError('Company ID is required', 400), 'Company ID is required');
        return;
      }

      const goodsReturn = await this.goodsReturnService.findById(id);

      if (!goodsReturn) {
        this.sendError(res, new AppError('Goods return not found', 404), 'Goods return not found');
        return;
      }

      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Try to load and embed logo
      let logoImage: any = null;
      try {
        const possiblePaths = [
          path.join(process.cwd(), '..', 'client', 'public', 'logo.png'),
          path.join(process.cwd(), 'client', 'public', 'logo.png'),
          path.join(__dirname, '..', '..', '..', 'client', 'public', 'logo.png'),
        ];
        
        let logoPath: string | null = null;
        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            logoPath = possiblePath;
            break;
          }
        }
        
        if (logoPath) {
          const logoBytes = fs.readFileSync(logoPath);
          logoImage = await pdfDoc.embedPng(logoBytes);
        }
      } catch (logoError) {
        console.warn('Logo not found, continuing without logo:', logoError);
      }

      let y = height - 30;
      const lineHeight = 14;
      const margin = 50;
      const rightMargin = width - margin;

      // Draw border
      page.drawRectangle({
        x: margin - 5,
        y: margin - 5,
        width: width - 2 * (margin - 5),
        height: height - 2 * (margin - 5),
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      // Header Section with Logo at Top Center
      const headerY = y;
      if (logoImage) {
        const logoSize = 50;
        const logoX = (width - logoSize) / 2; // Center the logo
        page.drawImage(logoImage, {
          x: logoX,
          y: headerY - logoSize,
          width: logoSize,
          height: logoSize,
        });
        y -= logoSize + 10; // Space after logo
      }

      // Title centered below logo
      const title = 'GOODS ISSUE RETURN CHALLAN';
      const titleSize = 18;
      const titleWidth = boldFont.widthOfTextAtSize(title, titleSize);
      const titleX = (width - titleWidth) / 2;
      page.drawText(title, {
        x: titleX,
        y: y - 5,
        size: titleSize,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      y -= 30;

      // Draw horizontal line after header
      page.drawLine({
        start: { x: margin, y },
        end: { x: rightMargin, y },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      y -= 20;

      // Helper function to draw label-value pairs
      const drawLabelValue = (label: string, value: string, x: number, yPos: number, labelSize = 10, valueSize = 10) => {
        page.drawText(label, {
          x,
          y: yPos,
          size: labelSize,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        const labelWidth = boldFont.widthOfTextAtSize(label, labelSize);
        page.drawText(value, {
          x: x + labelWidth + 5,
          y: yPos,
          size: valueSize,
          font,
          color: rgb(0, 0, 0),
        });
      };

      // Return Details Section
      const leftColX = margin;
      let currentY = y;

      drawLabelValue('Return Number:', goodsReturn.returnNumber || '-', leftColX, currentY);
      currentY -= lineHeight + 5;

      const returnDate = goodsReturn.returnDate
        ? new Date(goodsReturn.returnDate).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
        : '-';
      drawLabelValue('Return Date:', returnDate, leftColX, currentY);
      currentY -= lineHeight + 5;

      // Right Column - Original Challan Info
      const rightColX = width / 2 + 20;
      let rightY = y;

      drawLabelValue('Original Challan:', goodsReturn.originalChallanNumber || '-', rightColX, rightY);
      rightY -= lineHeight + 5;

      if (goodsReturn.originalChallanDate) {
        const challanDate = new Date(goodsReturn.originalChallanDate).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        drawLabelValue('Challan Date:', challanDate, rightColX, rightY);
        rightY -= lineHeight + 5;
      }

      y = Math.min(currentY, rightY) - 15;

      // Draw horizontal line
      page.drawLine({
        start: { x: margin, y },
        end: { x: rightMargin, y },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });
      y -= 20;

      // Item Details Section
      page.drawText('ITEM DETAILS', {
        x: margin,
        y,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight + 10;

      drawLabelValue('Item Name:', goodsReturn.itemName || '-', margin, y);
      y -= lineHeight + 5;

      drawLabelValue('Item Code:', goodsReturn.itemCode || '-', margin, y);
      y -= lineHeight + 5;

      if (goodsReturn.itemDescription) {
        drawLabelValue('Description:', goodsReturn.itemDescription, margin, y);
        y -= lineHeight + 5;
      }

      y -= 10;

      // Draw horizontal line
      page.drawLine({
        start: { x: margin, y },
        end: { x: rightMargin, y },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });
      y -= 20;

      // Quantity Details Section
      page.drawText('QUANTITY DETAILS', {
        x: margin,
        y,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight + 10;

      // Quantity Table Header
      const tableTopY = y;
      const col1X = margin;
      const col2X = margin + 150;
      const col3X = margin + 300;
      const col4X = margin + 450;

      // Draw table header background
      page.drawRectangle({
        x: margin,
        y: y - 5,
        width: rightMargin - margin,
        height: lineHeight + 10,
        color: rgb(0.9, 0.9, 0.9),
      });

      page.drawText('Type', { x: col1X, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
      page.drawText('Quantity', { x: col2X, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
      page.drawText('Unit', { x: col3X, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
      page.drawText('Value', { x: col4X, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });

      y -= lineHeight + 10;

      // Draw header underline
      page.drawLine({
        start: { x: margin, y },
        end: { x: rightMargin, y },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      y -= 10;

      // Damaged Quantity Row
      if (y < 150) {
        page = pdfDoc.addPage();
        y = height - 50;
      }
      page.drawText('Damaged', { x: col1X, y, size: 10, font, color: rgb(0, 0, 0) });
      page.drawText(String(goodsReturn.damagedQuantity || 0), { x: col2X, y, size: 10, font, color: rgb(0, 0, 0) });
      page.drawText(goodsReturn.unit || '-', { x: col3X, y, size: 10, font, color: rgb(0, 0, 0) });
      page.drawText(goodsReturn.damagedValue ? `Rs. ${goodsReturn.damagedValue.toFixed(2)}` : '-', { x: col4X, y, size: 10, font, color: rgb(0, 0, 0) });
      y -= lineHeight + 5;

      // Returned Quantity Row
      if (y < 150) {
        page = pdfDoc.addPage();
        y = height - 50;
      }
      page.drawText('Returned', { x: col1X, y, size: 10, font, color: rgb(0, 0, 0) });
      page.drawText(String(goodsReturn.returnedQuantity || 0), { x: col2X, y, size: 10, font, color: rgb(0, 0, 0) });
      page.drawText(goodsReturn.unit || '-', { x: col3X, y, size: 10, font, color: rgb(0, 0, 0) });
      page.drawText(goodsReturn.returnedValue ? `Rs. ${goodsReturn.returnedValue.toFixed(2)}` : '-', { x: col4X, y, size: 10, font, color: rgb(0, 0, 0) });
      y -= lineHeight + 5;

      // Total Row
      if (y < 150) {
        page = pdfDoc.addPage();
        y = height - 50;
      }
      page.drawText('Total', { x: col1X, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
      page.drawText(String(goodsReturn.totalQuantity || 0), { x: col2X, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
      page.drawText(goodsReturn.unit || '-', { x: col3X, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
      page.drawText(goodsReturn.totalValue ? `Rs. ${goodsReturn.totalValue.toFixed(2)}` : '-', { x: col4X, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
      y -= lineHeight + 10;

      // Draw horizontal line
      page.drawLine({
        start: { x: margin, y },
        end: { x: rightMargin, y },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });
      y -= 20;

      // Additional Information Section
      const detailsLeftX = margin;
      const detailsRightX = width / 2 + 20;
      let detailsY = y;

      if (goodsReturn.returnReason) {
        const reasonText = goodsReturn.returnReason.replace('_', ' ').toUpperCase();
        drawLabelValue('Return Reason:', reasonText, detailsLeftX, detailsY);
        detailsY -= lineHeight + 5;
      }

      if (goodsReturn.returnReasonDetails) {
        drawLabelValue('Reason Details:', goodsReturn.returnReasonDetails, detailsLeftX, detailsY);
        detailsY -= lineHeight + 5;
      }

      if (goodsReturn.supplierName) {
        drawLabelValue('Supplier:', goodsReturn.supplierName, detailsRightX, y);
        y -= lineHeight + 5;
      }

      if (goodsReturn.warehouseName) {
        drawLabelValue('Warehouse:', goodsReturn.warehouseName, detailsRightX, y);
        y -= lineHeight + 5;
      }

      if (goodsReturn.batchNumber) {
        drawLabelValue('Batch Number:', goodsReturn.batchNumber, detailsLeftX, detailsY);
        detailsY -= lineHeight + 5;
      }

      if (goodsReturn.lotNumber) {
        drawLabelValue('Lot Number:', goodsReturn.lotNumber, detailsLeftX, detailsY);
        detailsY -= lineHeight + 5;
      }

      y = Math.min(detailsY, y) - 15;

      // Status Information
      if (goodsReturn.returnStatus) {
        page.drawLine({
          start: { x: margin, y },
          end: { x: rightMargin, y },
          thickness: 0.5,
          color: rgb(0.5, 0.5, 0.5),
        });
        y -= 20;

        drawLabelValue('Return Status:', goodsReturn.returnStatus.toUpperCase(), margin, y);
        y -= lineHeight + 5;

        if (goodsReturn.status) {
          drawLabelValue('Status:', goodsReturn.status.toUpperCase(), margin, y);
          y -= lineHeight + 5;
        }
      }

      // Notes Section
      if (goodsReturn.notes) {
        y -= 10;
        page.drawLine({
          start: { x: margin, y },
          end: { x: rightMargin, y },
          thickness: 0.5,
          color: rgb(0.5, 0.5, 0.5),
        });
        y -= 20;

        page.drawText('NOTES', {
          x: margin,
          y,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight + 10;

        const noteLines = goodsReturn.notes.split('\n');
        noteLines.forEach((line: string) => {
          if (y < 100) {
            page = pdfDoc.addPage();
            y = height - 50;
          }
          page.drawText(line || '-', {
            x: margin,
            y,
            size: 10,
            font,
            color: rgb(0, 0, 0),
          });
          y -= lineHeight;
        });
      }

      // Ensure space for signatures
      if (y > 120) {
        y = 120;
      } else if (y < 80) {
        page = pdfDoc.addPage();
        y = height - 50;
      }

      // Signature Section
      page.drawLine({
        start: { x: margin, y },
        end: { x: rightMargin, y },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      y -= 30;

      const sigLeftX = margin;
      const sigRightX = width / 2 + 20;

      // Company Signature
      page.drawText('For Company', {
        x: sigLeftX,
        y,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      y -= 50;

      // Authorized Signature
      page.drawText('Authorized Signature', {
        x: sigRightX,
        y: y + 50,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      const pdfBytes = await pdfDoc.save();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="Goods-Return-Challan-${goodsReturn.returnNumber || id}.pdf"`,
      );

      res.send(Buffer.from(pdfBytes));
    } catch (error: any) {
      logger.error('Error generating goods return challan PDF', { error, id: req.params.id });
      this.sendError(res, error, 'Failed to generate goods return challan PDF');
    }
  };
}

