import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { JobWorkService, CreateJobWorkData, UpdateJobWorkData } from '../services/JobWorkService';
import { IJobWorkDocument } from '../models/JobWork';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

export class JobWorkController extends BaseController<IJobWorkDocument> {
  private jobWorkService: JobWorkService;

  constructor() {
    const jobWorkService = new JobWorkService();
    super(jobWorkService as any, 'JobWork');
    this.jobWorkService = jobWorkService;
  }

  /**
   * Create a new job work
   */
  async createJobWork(req: Request, res: Response): Promise<void> {
    try {
      const jobWorkData: CreateJobWorkData = req.body;
      const createdBy = req.user?._id?.toString();
      const companyId = req.company?._id?.toString() || req.user?.primaryCompanyId?.toString();

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      if (!createdBy) {
        this.sendError(res, new Error('User ID is required'), 'User ID is required', 400);
        return;
      }

      jobWorkData.companyId = companyId;
      jobWorkData.createdBy = createdBy;

      const jobWork = await this.jobWorkService.createJobWork(jobWorkData);
      this.sendSuccess(res, jobWork, 'Job work created successfully', 201);
    } catch (error: any) {
      this.sendError(res, error, 'Failed to create job work');
    }
  }

  /**
   * Get all job works with filters
   */
  async getJobWorks(req: Request, res: Response): Promise<void> {
    try {
      const {
        jobWorkerId,
        status,
        jobWorkType,
        startDate,
        endDate,
        paymentStatus,
        qualityStatus,
        challanNumber,
        categoryId,
        page,
        limit
      } = req.query;

      let companyId = req.query.companyId as string;
      if (!companyId && req.user?.isSuperAdmin) {
        companyId = undefined;
      } else if (!companyId) {
        companyId = req.company?._id?.toString() || req.user?.primaryCompanyId?.toString();
      }

      if (!companyId && !req.user?.isSuperAdmin) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const filters = {
        companyId,
        jobWorkerId: jobWorkerId as string,
        status: status as string,
        jobWorkType: jobWorkType as string,
        startDate: startDate as string,
        endDate: endDate as string,
        paymentStatus: paymentStatus as string,
        qualityStatus: qualityStatus as string,
        challanNumber: challanNumber as string,
        categoryId: categoryId as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10
      };

      const result = await this.jobWorkService.getJobWorks(filters);
      this.sendSuccess(res, result, 'Job works retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error, 'Failed to get job works');
    }
  }

  /**
   * Get job work by ID
   */
  async getJobWorkById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      let companyId = req.query.companyId as string;
      if (!companyId && !req.user?.isSuperAdmin) {
        companyId = req.company?._id?.toString() || req.user?.primaryCompanyId?.toString();
      }

      const jobWork = await this.jobWorkService.getJobWorkById(id, companyId);

      if (!jobWork) {
        this.sendError(res, new Error('Job work not found'), 'Job work not found', 404);
        return;
      }

      this.sendSuccess(res, jobWork, 'Job work retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error, 'Failed to get job work');
    }
  }

  /**
   * Update job work
   */
  async updateJobWork(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateJobWorkData = req.body;
      const updatedBy = req.user?._id?.toString();

      if (!updatedBy) {
        this.sendError(res, new Error('User ID is required'), 'User ID is required', 400);
        return;
      }

      let companyId = req.query.companyId as string;
      if (!companyId && !req.user?.isSuperAdmin) {
        companyId = req.company?._id?.toString() || req.user?.primaryCompanyId?.toString();
      }

      updateData.updatedBy = updatedBy;

      const jobWork = await this.jobWorkService.updateJobWork(id, updateData, companyId);

      if (!jobWork) {
        this.sendError(res, new Error('Job work not found'), 'Job work not found', 404);
        return;
      }

      this.sendSuccess(res, jobWork, 'Job work updated successfully');
    } catch (error: any) {
      this.sendError(res, error, 'Failed to update job work');
    }
  }

  /**
   * Delete job work
   */
  async deleteJobWork(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      let companyId = req.query.companyId as string;
      if (!companyId && !req.user?.isSuperAdmin) {
        companyId = req.company?._id?.toString() || req.user?.primaryCompanyId?.toString();
      }

      const deleted = await this.jobWorkService.deleteJobWork(id, companyId);

      if (!deleted) {
        this.sendError(res, new Error('Job work not found'), 'Job work not found', 404);
        return;
      }

      this.sendSuccess(res, null, 'Job work deleted successfully');
    } catch (error: any) {
      this.sendError(res, error, 'Failed to delete job work');
    }
  }

  /**
   * Get job work statistics
   */
  async getJobWorkStats(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      let companyId = req.query.companyId as string;
      if (!companyId && !req.user?.isSuperAdmin) {
        companyId = req.company?._id?.toString() || req.user?.primaryCompanyId?.toString();
      }

      if (!companyId && !req.user?.isSuperAdmin) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const stats = await this.jobWorkService.getJobWorkStats(
        companyId,
        startDate as string,
        endDate as string
      );

      this.sendSuccess(res, stats, 'Job work statistics retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error, 'Failed to get job work statistics');
    }
  }

  /**
   * Get job works by worker
   */
  async getJobWorksByWorker(req: Request, res: Response): Promise<void> {
    try {
      const { workerId } = req.params;
      let companyId = req.query.companyId as string;
      if (!companyId && !req.user?.isSuperAdmin) {
        companyId = req.company?._id?.toString() || req.user?.primaryCompanyId?.toString();
      }

      const jobWorks = await this.jobWorkService.getJobWorkByWorker(workerId, companyId);
      this.sendSuccess(res, jobWorks, 'Job works retrieved successfully');
    } catch (error: any) {
      this.sendError(res, error, 'Failed to get job works by worker');
    }
  }

  /**
   * Generate Job Work Challan PDF
   * Professional format with logo matching the provided design
   */
  async generateChallanPDF(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      let companyId = req.query.companyId as string;
      if (!companyId && !req.user?.isSuperAdmin) {
        companyId = req.company?._id?.toString() || req.user?.primaryCompanyId?.toString();
      }

      const jobWork = await this.jobWorkService.getJobWorkById(id, companyId);

      if (!jobWork) {
        this.sendError(res, new Error('Job work not found'), 'Job work not found', 404);
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
        // Try multiple possible paths for the logo
        const possiblePaths = [
          path.join(process.cwd(), '..', 'client', 'public', 'logo.png'), // From server directory
          path.join(process.cwd(), 'client', 'public', 'logo.png'), // If running from root
          path.join(__dirname, '..', '..', '..', 'client', 'public', 'logo.png'), // From compiled dist
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
      const title = 'JOB WORK CHALLAN';
      const titleSize = 20;
      const titleWidth = boldFont.widthOfTextAtSize(title, titleSize);
      const titleX = (width - titleWidth) / 2;
      page.drawText(title, {
        x: titleX,
        y: y - 5,
        size: titleSize,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      y = headerY - 50;

      // Draw horizontal line after header
      page.drawLine({
        start: { x: margin, y },
        end: { x: rightMargin, y },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      y -= 20;

      // Challan Details Section
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

      // Left Column - Challan Info
      const leftColX = margin;
      let currentY = y;

      drawLabelValue('Challan Number:', jobWork.challanNumber || '-', leftColX, currentY);
      currentY -= lineHeight + 5;

      const challanDate = jobWork.challanDate
        ? new Date(jobWork.challanDate).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
        : '-';
      drawLabelValue('Challan Date:', challanDate, leftColX, currentY);
      currentY -= lineHeight + 5;

      // Right Column - Job Work Info
      const rightColX = width / 2 + 20;
      let rightY = y;

      drawLabelValue('Job Worker:', jobWork.jobWorkerName || '-', rightColX, rightY);
      rightY -= lineHeight + 5;

      drawLabelValue('Job Work Type:', jobWork.jobWorkType || '-', rightColX, rightY);
      rightY -= lineHeight + 5;

      y = Math.min(currentY, rightY) - 15;

      // Draw horizontal line
      page.drawLine({
        start: { x: margin, y },
        end: { x: rightMargin, y },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });
      y -= 20;

      // Material Details Section
      page.drawText('MATERIAL DETAILS', {
        x: margin,
        y,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight + 10;

      // Material Table Header
      const tableTopY = y;
      const col1X = margin;
      const col2X = margin + 80;
      const col3X = margin + 280;
      const col4X = margin + 350;
      const col5X = margin + 420;

      // Draw table header background
      page.drawRectangle({
        x: margin,
        y: y - 5,
        width: rightMargin - margin,
        height: lineHeight + 10,
        color: rgb(0.9, 0.9, 0.9),
      });

      page.drawText('S.No', { x: col1X, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
      page.drawText('Item Name', { x: col2X, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
      page.drawText('Quantity', { x: col3X, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
      page.drawText('Unit', { x: col4X, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
      page.drawText('Rate', { x: col5X, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });

      y -= lineHeight + 10;

      // Draw header underline
      page.drawLine({
        start: { x: margin, y },
        end: { x: rightMargin, y },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      y -= 10;

      // Material rows
      if (jobWork.materialProvided && jobWork.materialProvided.length > 0) {
        jobWork.materialProvided.forEach((m: any, index: number) => {
          if (y < 150) {
            page = pdfDoc.addPage();
            y = height - 50;
            // Redraw header on new page
            page.drawRectangle({
              x: margin,
              y: y - 5,
              width: rightMargin - margin,
              height: lineHeight + 10,
              color: rgb(0.9, 0.9, 0.9),
            });
            page.drawText('S.No', { x: col1X, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
            page.drawText('Item Name', { x: col2X, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
            page.drawText('Quantity', { x: col3X, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
            page.drawText('Unit', { x: col4X, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
            page.drawText('Rate', { x: col5X, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
            y -= lineHeight + 10;
            page.drawLine({
              start: { x: margin, y },
              end: { x: rightMargin, y },
              thickness: 1,
              color: rgb(0, 0, 0),
            });
            y -= 10;
          }

          page.drawText(`${index + 1}.`, { x: col1X, y, size: 10, font, color: rgb(0, 0, 0) });
          page.drawText(m.itemName || '-', { x: col2X, y, size: 10, font, color: rgb(0, 0, 0) });
          page.drawText(String(m.quantity ?? '-'), { x: col3X, y, size: 10, font, color: rgb(0, 0, 0) });
          page.drawText(m.unit || '-', { x: col4X, y, size: 10, font, color: rgb(0, 0, 0) });
          page.drawText(m.rate ? `Rs. ${m.rate}` : '-', { x: col5X, y, size: 10, font, color: rgb(0, 0, 0) });
          y -= lineHeight + 5;
        });
      } else {
        page.drawText('No materials provided', { x: margin, y, size: 10, font, color: rgb(0.5, 0.5, 0.5) });
        y -= lineHeight;
      }

      y -= 15;

      // Draw horizontal line
      page.drawLine({
        start: { x: margin, y },
        end: { x: rightMargin, y },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });
      y -= 20;

      // Job Work Details Section
      page.drawText('JOB WORK INFORMATION', {
        x: margin,
        y,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight + 10;

      const detailsLeftX = margin;
      const detailsRightX = width / 2 + 20;
      let detailsY = y;

      drawLabelValue('Quantity:', `${jobWork.quantity} ${jobWork.unit || ''}`, detailsLeftX, detailsY);
      detailsY -= lineHeight + 5;

      drawLabelValue('Rate:', `Rs. ${jobWork.jobWorkerRate || 0}`, detailsLeftX, detailsY);
      detailsY -= lineHeight + 5;

      const expectedDelivery = jobWork.expectedDelivery
        ? new Date(jobWork.expectedDelivery).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
        : '-';
      drawLabelValue('Expected Delivery:', expectedDelivery, detailsLeftX, detailsY);
      detailsY -= lineHeight + 5;

      if (jobWork.actualDelivery) {
        const actualDelivery = new Date(jobWork.actualDelivery).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        drawLabelValue('Actual Delivery:', actualDelivery, detailsLeftX, detailsY);
        detailsY -= lineHeight + 5;
      }

      let detailsRightY = y;
      drawLabelValue('Status:', jobWork.status || '-', detailsRightX, detailsRightY);
      detailsRightY -= lineHeight + 5;

      drawLabelValue('Payment Status:', jobWork.paymentStatus || 'pending', detailsRightX, detailsRightY);
      detailsRightY -= lineHeight + 5;

      if (jobWork.jobWorkCost) {
        drawLabelValue('Total Cost:', `Rs. ${jobWork.jobWorkCost}`, detailsRightX, detailsRightY);
        detailsRightY -= lineHeight + 5;
      }

      y = Math.min(detailsY, detailsRightY) - 15;

      // Transport Details (if available)
      if (jobWork.transportName || jobWork.transportNumber) {
        page.drawLine({
          start: { x: margin, y },
          end: { x: rightMargin, y },
          thickness: 0.5,
          color: rgb(0.5, 0.5, 0.5),
        });
        y -= 20;

        page.drawText('TRANSPORT DETAILS', {
          x: margin,
          y,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight + 10;

        if (jobWork.transportName) {
          drawLabelValue('Transport Name:', jobWork.transportName, margin, y);
          y -= lineHeight + 5;
        }
        if (jobWork.transportNumber) {
          drawLabelValue('Transport Number:', jobWork.transportNumber, margin, y);
          y -= lineHeight + 5;
        }
      }

      y -= 15;

      // Remarks Section
      if (jobWork.remarks) {
        page.drawLine({
          start: { x: margin, y },
          end: { x: rightMargin, y },
          thickness: 0.5,
          color: rgb(0.5, 0.5, 0.5),
        });
        y -= 20;

        page.drawText('REMARKS', {
          x: margin,
          y,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight + 10;

        const remarkLines = jobWork.remarks.split('\n');
        remarkLines.forEach((line: string) => {
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

      // Job Worker Signature
      page.drawText('Job Worker Signature', {
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
        `attachment; filename="JobWork-Challan-${jobWork.challanNumber || jobWork._id.toString()}.pdf"`,
      );

      res.send(Buffer.from(pdfBytes));
    } catch (error: any) {
      this.sendError(res, error, 'Failed to generate job work challan PDF');
    }
  }
}

