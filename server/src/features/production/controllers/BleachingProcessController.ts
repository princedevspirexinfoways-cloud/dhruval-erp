import { Request, Response } from 'express';
import { BaseController } from '../../../controllers/BaseController';
import { BleachingProcessService } from '../services/BleachingProcessService';
import { IBleachingProcess } from '../models/BleachingProcess';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

export class BleachingProcessController extends BaseController<any> {
  private bleachingService: BleachingProcessService;

  constructor() {
    const service = new BleachingProcessService();
    super(service, 'BleachingProcess');
    this.bleachingService = service;
  }

  /**
   * Create a new bleaching process entry
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { userId, companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const processData = {
        ...req.body,
        companyId
      };

      const process = await this.bleachingService.createBleachingProcess(processData, userId);
      this.sendSuccess(res, process, 'Bleaching process created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create bleaching process');
    }
  }

  /**
   * Get all bleaching processes (dashboard)
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = this.getUserInfo(req);
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const processes = await this.bleachingService.getDashboard(companyId);
      this.sendSuccess(res, processes, 'Bleaching dashboard retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get bleaching dashboard');
    }
  }

  /**
   * Complete bleaching process
   */
  async completeProcess(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { updatedMeter } = req.body;
      const { userId } = this.getUserInfo(req);

      if (!updatedMeter || updatedMeter <= 0) {
        this.sendError(res, new Error('Invalid meter'), 'Updated meter is required', 400);
        return;
      }

      const result = await this.bleachingService.completeProcess(id, updatedMeter, userId);
      this.sendSuccess(res, result, 'Bleaching process completed successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to complete bleaching process');
    }
  }

  /**
   * Generate challan
   */
  async generateChallan(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const challanUrl = await this.bleachingService.generateChallan(id);
      this.sendSuccess(res, { challanUrl }, 'Challan generated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to generate challan');
    }
  }

  /**
   * Generate Bleaching Process Challan PDF
   * Size: 6 inch (Length) × 4 inch (Width) = 432 × 288 points
   */
  async generateChallanPDF(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { companyId } = this.getUserInfo(req);
      
      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const process = await this.bleachingService.findById(id);
      
      if (!process) {
        this.sendError(res, new Error('Bleaching process not found'), 'Bleaching process not found', 404);
        return;
      }

      // Check if process belongs to the company
      if (process.companyId?.toString() !== companyId) {
        this.sendError(res, new Error('Unauthorized'), 'Unauthorized access', 403);
        return;
      }

      // Create PDF with custom size: 6 inch × 4 inch (432 × 288 points)
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([432, 288]); // 6 inch × 4 inch
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Try to load and embed logo
      let logoImage: any = null;
      try {
        const possiblePaths = [
          path.join(process.cwd(), '..', 'client', 'public', 'logo.png'),
          path.join(process.cwd(), 'client', 'public', 'logo.png'),
          path.join(__dirname, '..', '..', '..', '..', '..', 'client', 'public', 'logo.png'),
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

      let y = height - 20;
      const lineHeight = 12;
      const margin = 20;
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

      // Header Section with Logo
      const headerY = y;
      if (logoImage) {
        const logoSize = 30;
        const logoX = (width - logoSize) / 2;
        page.drawImage(logoImage, {
          x: logoX,
          y: headerY - logoSize,
          width: logoSize,
          height: logoSize,
        });
        y -= logoSize + 5;
      }

      // Title centered
      const title = 'BLEACHING PROCESS CHALLAN';
      const titleSize = 14;
      const titleWidth = boldFont.widthOfTextAtSize(title, titleSize);
      const titleX = (width - titleWidth) / 2;
      page.drawText(title, {
        x: titleX,
        y: y - 5,
        size: titleSize,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      y = headerY - 40;

      // Draw horizontal line after header
      page.drawLine({
        start: { x: margin, y },
        end: { x: rightMargin, y },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      y -= 15;

      // Helper function to draw label-value pairs
      const drawLabelValue = (label: string, value: string, x: number, yPos: number, labelSize = 9, valueSize = 9) => {
        page.drawText(label, {
          x,
          y: yPos,
          size: labelSize,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        const labelWidth = boldFont.widthOfTextAtSize(label, labelSize);
        page.drawText(value, {
          x: x + labelWidth + 3,
          y: yPos,
          size: valueSize,
          font,
          color: rgb(0, 0, 0),
        });
      };

      // Left Column - Process Info
      const leftColX = margin;
      let currentY = y;

      drawLabelValue('Lot Number:', process.lotNumber || '-', leftColX, currentY);
      currentY -= lineHeight + 3;

      const processDate = process.date
        ? new Date(process.date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
        : '-';
      drawLabelValue('Date:', processDate, leftColX, currentY);
      currentY -= lineHeight + 3;

      drawLabelValue('Party Name:', process.partyName || '-', leftColX, currentY);
      currentY -= lineHeight + 3;

      // Right Column - Quantity Info
      const rightColX = width / 2 + 10;
      let rightY = y;

      drawLabelValue('Total Bale:', String(process.totalBale || '-'), rightColX, rightY);
      rightY -= lineHeight + 3;

      drawLabelValue('Total Meter:', String(process.totalMeter || '-'), rightColX, rightY);
      rightY -= lineHeight + 3;

      if (process.transportName) {
        drawLabelValue('Transport:', process.transportName, rightColX, rightY);
        rightY -= lineHeight + 3;
      }

      y = Math.min(currentY, rightY) - 10;

      // Draw horizontal line
      page.drawLine({
        start: { x: margin, y },
        end: { x: rightMargin, y },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });
      y -= 12;

      // Mercerise Details Section (if available)
      if (process.mercerise && (process.mercerise.degree || process.mercerise.width)) {
        page.drawText('MERCERISE DETAILS', {
          x: margin,
          y,
          size: 11,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight + 5;

        if (process.mercerise.degree) {
          drawLabelValue('Degree:', String(process.mercerise.degree), margin, y);
          y -= lineHeight + 3;
        }

        if (process.mercerise.width) {
          drawLabelValue('Width:', String(process.mercerise.width), margin, y);
          y -= lineHeight + 3;
        }

        y -= 8;
      }

      // Status Section
      if (y > 60) {
        page.drawLine({
          start: { x: margin, y },
          end: { x: rightMargin, y },
          thickness: 0.5,
          color: rgb(0.5, 0.5, 0.5),
        });
        y -= 12;

        const statusText = process.status || 'pending';
        drawLabelValue('Status:', statusText.toUpperCase(), margin, y);
        y -= lineHeight + 3;

        if (process.completedMeter) {
          drawLabelValue('Completed Meter:', String(process.completedMeter), margin, y);
          y -= lineHeight + 3;
        }
      }

      // Footer - Challan Number/ID
      if (y > 40) {
        y = 35;
        page.drawLine({
          start: { x: margin, y },
          end: { x: rightMargin, y },
          thickness: 0.5,
          color: rgb(0.5, 0.5, 0.5),
        });
        y -= 8;

        const challanId = process._id?.toString().substring(0, 8) || 'N/A';
        page.drawText(`Challan ID: ${challanId}`, {
          x: margin,
          y,
          size: 8,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
      }

      // Generate PDF bytes
      const pdfBytes = await pdfDoc.save();

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Bleaching-Challan-${process.lotNumber || process._id}.pdf"`);
      
      // Send PDF
      res.send(Buffer.from(pdfBytes));

      // Update challan generated status
      const { userId } = this.getUserInfo(req);
      await this.bleachingService.update(id, {
        challanGenerated: true,
        challanUrl: `/api/v1/production/bleaching/${id}/challan/pdf`
      }, userId);
    } catch (error: any) {
      this.sendError(res, error, 'Failed to generate challan PDF');
    }
  }

  /**
   * Get by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const process = await this.bleachingService.findById(id);

      if (!process) {
        this.sendError(res, new Error('Not found'), 'Bleaching process not found', 404);
        return;
      }

      this.sendSuccess(res, process, 'Bleaching process retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get bleaching process');
    }
  }

  /**
   * Update bleaching process
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = this.getUserInfo(req);
      const updateData = req.body;

      const process = await this.bleachingService.update(id, updateData, userId);
      if (!process) {
        this.sendError(res, new Error('Not found'), 'Bleaching process not found', 404);
        return;
      }

      this.sendSuccess(res, process, 'Bleaching process updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update bleaching process');
    }
  }
}

