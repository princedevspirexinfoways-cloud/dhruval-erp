import { Request, Response } from 'express';
import { PurchaseReportsService, ReportFilters } from '../services/PurchaseReportsService';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import PurchaseOrder from '../models/PurchaseOrder';
import { Types } from 'mongoose';
import ExcelJS from 'exceljs';
import { createObjectCsvWriter } from 'csv-writer';
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export class PurchaseReportsController {
  private reportsService: PurchaseReportsService;
  private modelName: string = 'PurchaseReports';

  constructor() {
    this.reportsService = new PurchaseReportsService();
  }

  protected sendSuccess(
    res: Response, 
    data: any, 
    message: string = 'Operation successful', 
    statusCode: number = 200
  ): void {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  protected sendError(
    res: Response, 
    error: any, 
    message: string = 'Operation failed', 
    statusCode: number = 500
  ): void {
    logger.error(`${this.modelName} controller error`, { error, message });
    
    res.status(statusCode).json({
      success: false,
      message,
      error: error?.message || error,
      timestamp: new Date().toISOString()
    });
  }

  private getTargetCompanyId(user: any, companyId?: string | any): string | null {
    // Helper function to convert any ID to string
    const convertToString = (id: any): string | null => {
      if (!id) return null;
      if (typeof id === 'string') return id;
      if (id instanceof Types.ObjectId) return id.toString();
      if (typeof id === 'object') {
        // Check for Mongoose ObjectId methods
        if (typeof id.toHexString === 'function') return id.toHexString();
        if (typeof id.toString === 'function') {
          const str = id.toString();
          if (str !== '[object Object]') return str;
        }
        // Check for common ObjectId properties
        if (id._id) return convertToString(id._id);
        if (id.id) return convertToString(id.id);
        if (id.value) return String(id.value);
      }
      const str = String(id);
      return str !== '[object Object]' ? str : null;
    };

    if (companyId && user.isSuperAdmin) {
      return convertToString(companyId);
    }
    
    // Get companyId from user and ensure it's a string
    const userCompanyId = user.companyAccess?.[0]?.companyId || user.companyId;
    return convertToString(userCompanyId);
  }

  private sendUnauthorized(res: Response): void {
    this.sendError(res, new Error('Unauthorized'), 'User authentication required', 401);
  }

  private sendBadRequest(res: Response, message: string): void {
    this.sendError(res, new Error(message), message, 400);
  }

  /**
   * Get Vendor-wise Purchase Summary
   */
  async getVendorWiseSummary(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as any;
      if (!user) {
        this.sendUnauthorized(res);
        return;
      }

      const { companyId, vendorId, dateFrom, dateTo } = req.query;
      const targetCompanyId = this.getTargetCompanyId(user, companyId as string);

      if (!targetCompanyId) {
        this.sendBadRequest(res, 'Company ID is required');
        return;
      }

      const filters: ReportFilters = {
        companyId: targetCompanyId,
        vendorId: vendorId as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string
      };

      const report = await this.reportsService.getVendorWisePurchaseSummary(filters);
      this.sendSuccess(res, report, 'Vendor-wise purchase summary retrieved successfully');
    } catch (error) {
      this.sendError(res, error as Error, 'Failed to get vendor-wise purchase summary', 500);
    }
  }

  /**
   * Get Item-wise Purchase Report
   */
  async getItemWiseReport(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as any;
      if (!user) {
        this.sendUnauthorized(res);
        return;
      }

      const { companyId, itemId, category, dateFrom, dateTo } = req.query;
      const targetCompanyId = this.getTargetCompanyId(user, companyId as string);

      if (!targetCompanyId) {
        this.sendBadRequest(res, 'Company ID is required');
        return;
      }

      const filters: ReportFilters = {
        companyId: targetCompanyId,
        itemId: itemId as string,
        category: category as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string
      };

      const report = await this.reportsService.getItemWisePurchaseReport(filters);
      this.sendSuccess(res, report, 'Item-wise purchase report retrieved successfully');
    } catch (error) {
      this.sendError(res, error as Error, 'Failed to get item-wise purchase report', 500);
    }
  }

  /**
   * Get Category-wise Purchase Report
   */
  async getCategoryWiseReport(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as any;
      if (!user) {
        this.sendUnauthorized(res);
        return;
      }

      const { companyId, category, dateFrom, dateTo } = req.query;
      const targetCompanyId = this.getTargetCompanyId(user, companyId as string);

      if (!targetCompanyId) {
        this.sendBadRequest(res, 'Company ID is required');
        return;
      }

      const filters: ReportFilters = {
        companyId: targetCompanyId,
        category: category as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string
      };

      const report = await this.reportsService.getCategoryWisePurchaseReport(filters);
      this.sendSuccess(res, report, 'Category-wise purchase report retrieved successfully');
    } catch (error) {
      this.sendError(res, error as Error, 'Failed to get category-wise purchase report', 500);
    }
  }

  /**
   * Get Date Range Report
   */
  async getDateRangeReport(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as any;
      if (!user) {
        this.sendUnauthorized(res);
        return;
      }

      const { companyId, vendorId, dateFrom, dateTo } = req.query;
      const targetCompanyId = this.getTargetCompanyId(user, companyId as string);

      if (!targetCompanyId) {
        this.sendBadRequest(res, 'Company ID is required');
        return;
      }

      if (!dateFrom || !dateTo) {
        this.sendBadRequest(res, 'Date range (dateFrom and dateTo) is required');
        return;
      }

      const filters: ReportFilters = {
        companyId: targetCompanyId,
        vendorId: vendorId as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string
      };

      const report = await this.reportsService.getDateRangeReport(filters);
      this.sendSuccess(res, report, 'Date range report retrieved successfully');
    } catch (error) {
      this.sendError(res, error as Error, 'Failed to get date range report', 500);
    }
  }

  /**
   * Export Report (Excel or PDF)
   */
  async exportReport(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as any;
      if (!user) {
        this.sendUnauthorized(res);
        return;
      }

      const { reportType, format } = req.params;
      const { companyId, vendorId, itemId, category, dateFrom, dateTo } = req.body;

      const targetCompanyId = this.getTargetCompanyId(user, companyId);

      if (!targetCompanyId) {
        this.sendBadRequest(res, 'Company ID is required');
        return;
      }

      if (!['xlsx', 'pdf', 'csv'].includes(format)) {
        this.sendBadRequest(res, `Invalid format. Supported formats: xlsx, pdf, csv. Received: ${format}`);
        return;
      }

      const filters: ReportFilters = {
        companyId: targetCompanyId,
        vendorId,
        itemId,
        category,
        dateFrom,
        dateTo
      };

      let reportData: any;
      let fileName: string;

      switch (reportType) {
        case 'vendor-wise':
          reportData = await this.reportsService.getVendorWisePurchaseSummary(filters);
          fileName = `vendor-wise-purchase-summary-${new Date().toISOString().split('T')[0]}`;
          break;
        case 'item-wise':
          reportData = await this.reportsService.getItemWisePurchaseReport(filters);
          fileName = `item-wise-purchase-report-${new Date().toISOString().split('T')[0]}`;
          break;
        case 'category-wise':
          reportData = await this.reportsService.getCategoryWisePurchaseReport(filters);
          fileName = `category-wise-purchase-report-${new Date().toISOString().split('T')[0]}`;
          break;
        case 'date-range':
          if (!dateFrom || !dateTo) {
            this.sendBadRequest(res, 'Date range (dateFrom and dateTo) is required for date range report');
            return;
          }
          reportData = await this.reportsService.getDateRangeReport(filters);
          fileName = `date-range-purchase-report-${dateFrom}-to-${dateTo}`;
          break;
        default:
          this.sendBadRequest(res, `Invalid report type: ${reportType}`);
          return;
      }

      // Generate and send file based on format
      const fullFileName = `${fileName}.${format}`;
      
      if (format === 'xlsx') {
        await this.generateExcelFile(res, reportData, reportType, fullFileName);
      } else if (format === 'csv') {
        await this.generateCSVFile(res, reportData, reportType, fullFileName);
      } else if (format === 'pdf') {
        await this.generatePDFFile(res, reportData, reportType, fullFileName);
      }
    } catch (error: any) {
      logger.error('PurchaseReports exportReport error', {
        errorMessage: error?.message,
        stack: error?.stack,
      });
      this.sendError(res, error as Error, 'Failed to export report', 500);
    }
  }

  /**
   * Generate Excel file
   */
  private async generateExcelFile(res: Response, reportData: any, reportType: string, fileName: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // Add header
    worksheet.addRow([`Purchase Report - ${reportType.replace('-', ' ').toUpperCase()}`]);
    worksheet.mergeCells('A1:F1');
    worksheet.getRow(1).font = { bold: true, size: 16 };
    worksheet.getRow(1).alignment = { horizontal: 'center' };
    worksheet.addRow([]);

    if (Array.isArray(reportData)) {
      // Vendor-wise, Item-wise, or Category-wise reports
      if (reportType === 'vendor-wise') {
        this.generateVendorWiseExcel(worksheet, reportData);
      } else if (reportType === 'item-wise') {
        this.generateItemWiseExcel(worksheet, reportData);
      } else if (reportType === 'category-wise') {
        this.generateCategoryWiseExcel(worksheet, reportData);
      }
    } else {
      // Date range report
      this.generateDateRangeExcel(worksheet, reportData);
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * Generate CSV file
   */
  private async generateCSVFile(res: Response, reportData: any, reportType: string, fileName: string): Promise<void> {
    let csvContent = '';
    
    if (Array.isArray(reportData)) {
      if (reportType === 'vendor-wise') {
        csvContent = this.generateVendorWiseCSV(reportData);
      } else if (reportType === 'item-wise') {
        csvContent = this.generateItemWiseCSV(reportData);
      } else if (reportType === 'category-wise') {
        csvContent = this.generateCategoryWiseCSV(reportData);
      }
    } else {
      csvContent = this.generateDateRangeCSV(reportData);
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(csvContent);
  }

  /**
   * Generate PDF file
   */
  private async generatePDFFile(res: Response, reportData: any, reportType: string, fileName: string): Promise<void> {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 800;
    const margin = 50;
    const lineHeight = 15;

    const drawLine = (text: string, options: { bold?: boolean } = {}) => {
      if (y < 60) {
        page = pdfDoc.addPage([595, 842]);
        y = 800;
      }
      page.drawText(text, {
        x: margin,
        y,
        size: options.bold ? 12 : 10,
        font: options.bold ? boldFont : font,
      });
      y -= lineHeight;
    };

    // Title
    drawLine(`Purchase Report - ${reportType.replace('-', ' ').toUpperCase()}`, { bold: true });
    y -= lineHeight;

    if (Array.isArray(reportData)) {
      reportData.forEach((row: any, index: number) => {
        drawLine(`Record ${index + 1}`, { bold: true });

        Object.entries(row).forEach(([key, value]) => {
          if (value === undefined || value === null || typeof value === 'object') return;
          drawLine(`${key}: ${value}`);
        });

        y -= lineHeight;
      });
    } else if (reportData && typeof reportData === 'object') {
      Object.entries(reportData).forEach(([key, value]) => {
        if (Array.isArray(value) || typeof value === 'object') return;
        drawLine(`${key}: ${value}`);
      });
    } else {
      drawLine('No data available', { bold: true });
    }

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(Buffer.from(pdfBytes));
  }

  // Excel generation helpers
  private generateVendorWiseExcel(worksheet: ExcelJS.Worksheet, data: any[]): void {
    worksheet.addRow(['Vendor Name', 'Contact Person', 'Contact Number', 'Email', 'GSTIN', 'Total Purchases', 'Total Orders', 'Total Quantity', 'Average Order Value']);
    worksheet.getRow(worksheet.rowCount).font = { bold: true };
    worksheet.getRow(worksheet.rowCount).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    data.forEach(vendor => {
      worksheet.addRow([
        vendor.vendorName || '',
        vendor.contactPerson || '',
        vendor.contactNumber || '',
        vendor.email || '',
        vendor.gstin || '',
        vendor.totalPurchases || 0,
        vendor.totalOrders || 0,
        vendor.totalQuantity || 0,
        vendor.averageOrderValue || 0
      ]);
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 20;
    });
  }

  private generateItemWiseExcel(worksheet: ExcelJS.Worksheet, data: any[]): void {
    worksheet.addRow(['Item Name', 'Item Code', 'Category', 'Total Quantity', 'Total Amount', 'Average Rate', 'Min Rate', 'Max Rate', 'Purchase Count']);
    worksheet.getRow(worksheet.rowCount).font = { bold: true };
    worksheet.getRow(worksheet.rowCount).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    data.forEach(item => {
      worksheet.addRow([
        item.itemName || '',
        item.itemCode || '',
        item.category || '',
        item.totalQuantity || 0,
        item.totalAmount || 0,
        item.averageRate || 0,
        item.minRate || 0,
        item.maxRate || 0,
        item.purchaseCount || 0
      ]);
    });

    worksheet.columns.forEach(column => {
      column.width = 20;
    });
  }

  private generateCategoryWiseExcel(worksheet: ExcelJS.Worksheet, data: any[]): void {
    worksheet.addRow(['Category', 'Total Purchases', 'Total Quantity', 'Total Orders', 'Average Order Value']);
    worksheet.getRow(worksheet.rowCount).font = { bold: true };
    worksheet.getRow(worksheet.rowCount).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    data.forEach(category => {
      worksheet.addRow([
        category.category || '',
        category.totalPurchases || 0,
        category.totalQuantity || 0,
        category.totalOrders || 0,
        category.averageOrderValue || 0
      ]);
    });

    worksheet.columns.forEach(column => {
      column.width = 25;
    });
  }

  private generateDateRangeExcel(worksheet: ExcelJS.Worksheet, data: any): void {
    // Summary
    worksheet.addRow(['Summary']);
    worksheet.addRow(['Total Amount', data.totalAmount || 0]);
    worksheet.addRow(['Total Quantity', data.totalQuantity || 0]);
    worksheet.addRow(['Total Orders', data.totalOrders || 0]);
    worksheet.addRow(['Average Order Value', data.averageOrderValue || 0]);
    worksheet.addRow([]);

    // PO Entries
    if (data.poEntries && data.poEntries.length > 0) {
      worksheet.addRow(['PO Number', 'Date', 'Vendor', 'Total Amount', 'Total Quantity', 'Items', 'Status']);
      worksheet.getRow(worksheet.rowCount).font = { bold: true };
      worksheet.getRow(worksheet.rowCount).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

      data.poEntries.forEach((po: any) => {
        worksheet.addRow([
          po.poNumber || '',
          po.poDate || '',
          po.vendorName || '',
          po.totalAmount || 0,
          po.totalQuantity || 0,
          po.itemCount || 0,
          po.status || ''
        ]);
      });
    }

    worksheet.columns.forEach(column => {
      column.width = 20;
    });
  }

  // CSV generation helpers
  private generateVendorWiseCSV(data: any[]): string {
    const headers = ['Vendor Name', 'Contact Person', 'Contact Number', 'Email', 'GSTIN', 'Total Purchases', 'Total Orders', 'Total Quantity', 'Average Order Value'];
    const rows = data.map(v => [
      v.vendorName || '',
      v.contactPerson || '',
      v.contactNumber || '',
      v.email || '',
      v.gstin || '',
      v.totalPurchases || 0,
      v.totalOrders || 0,
      v.totalQuantity || 0,
      v.averageOrderValue || 0
    ]);
    return this.arrayToCSV([headers, ...rows]);
  }

  private generateItemWiseCSV(data: any[]): string {
    const headers = ['Item Name', 'Item Code', 'Category', 'Total Quantity', 'Total Amount', 'Average Rate', 'Min Rate', 'Max Rate', 'Purchase Count'];
    const rows = data.map(item => [
      item.itemName || '',
      item.itemCode || '',
      item.category || '',
      item.totalQuantity || 0,
      item.totalAmount || 0,
      item.averageRate || 0,
      item.minRate || 0,
      item.maxRate || 0,
      item.purchaseCount || 0
    ]);
    return this.arrayToCSV([headers, ...rows]);
  }

  private generateCategoryWiseCSV(data: any[]): string {
    const headers = ['Category', 'Total Purchases', 'Total Quantity', 'Total Orders', 'Average Order Value'];
    const rows = data.map(cat => [
      cat.category || '',
      cat.totalPurchases || 0,
      cat.totalQuantity || 0,
      cat.totalOrders || 0,
      cat.averageOrderValue || 0
    ]);
    return this.arrayToCSV([headers, ...rows]);
  }

  private generateDateRangeCSV(data: any): string {
    const rows: string[][] = [
      ['Summary'],
      ['Total Amount', String(data.totalAmount || 0)],
      ['Total Quantity', String(data.totalQuantity || 0)],
      ['Total Orders', String(data.totalOrders || 0)],
      ['Average Order Value', String(data.averageOrderValue || 0)],
      []
    ];

    if (data.poEntries && data.poEntries.length > 0) {
      rows.push(['PO Number', 'Date', 'Vendor', 'Total Amount', 'Total Quantity', 'Items', 'Status']);
      data.poEntries.forEach((po: any) => {
        rows.push([
          po.poNumber || '',
          po.poDate || '',
          po.vendorName || '',
          String(po.totalAmount || 0),
          String(po.totalQuantity || 0),
          String(po.itemCount || 0),
          po.status || ''
        ]);
      });
    }

    return this.arrayToCSV(rows);
  }

  private arrayToCSV(rows: any[][]): string {
    return rows.map(row => 
      row.map(cell => {
        const str = String(cell || '');
        // Escape quotes and wrap in quotes if contains comma or quote
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ).join('\n');
  }

  // PDF generation helpers
  private generateVendorWisePDF(page: any, data: any[], y: number, margin: number, lineHeight: number, font: any, boldFont: any): number {
    page.drawText('Vendor-wise Purchase Summary', { x: margin, y, size: 14, font: boldFont });
    y -= lineHeight * 2;

    data.forEach(vendor => {
      page.drawText(`${vendor.vendorName || 'N/A'}: ₹${vendor.totalPurchases || 0}`, { x: margin, y, size: 10, font });
      y -= lineHeight;
    });
    return y;
  }

  private generateItemWisePDF(page: any, data: any[], y: number, margin: number, lineHeight: number, font: any, boldFont: any): number {
    page.drawText('Item-wise Purchase Report', { x: margin, y, size: 14, font: boldFont });
    y -= lineHeight * 2;

    data.forEach(item => {
      page.drawText(`${item.itemName || 'N/A'}: ₹${item.totalAmount || 0}`, { x: margin, y, size: 10, font });
      y -= lineHeight;
    });
    return y;
  }

  private generateCategoryWisePDF(page: any, data: any[], y: number, margin: number, lineHeight: number, font: any, boldFont: any): number {
    page.drawText('Category-wise Purchase Report', { x: margin, y, size: 14, font: boldFont });
    y -= lineHeight * 2;

    data.forEach(cat => {
      page.drawText(`${cat.category || 'N/A'}: ₹${cat.totalPurchases || 0}`, { x: margin, y, size: 10, font });
      y -= lineHeight;
    });
    return y;
  }

  private generateDateRangePDF(page: any, data: any, y: number, margin: number, lineHeight: number, font: any, boldFont: any): number {
    page.drawText('Date Range Purchase Report', { x: margin, y, size: 14, font: boldFont });
    y -= lineHeight * 2;

    page.drawText(`Total Amount: ₹${data.totalAmount || 0}`, { x: margin, y, size: 12, font: boldFont });
    y -= lineHeight;
    page.drawText(`Total Quantity: ${data.totalQuantity || 0}`, { x: margin, y, size: 12, font: boldFont });
    y -= lineHeight;
    page.drawText(`Total Orders: ${data.totalOrders || 0}`, { x: margin, y, size: 12, font: boldFont });
    y -= lineHeight * 2;

    if (data.poEntries && data.poEntries.length > 0) {
      page.drawText('Purchase Orders:', { x: margin, y, size: 12, font: boldFont });
      y -= lineHeight;

      data.poEntries.forEach((po: any) => {
        page.drawText(`${po.poNumber || 'N/A'}: ₹${po.totalAmount || 0}`, { x: margin + 20, y, size: 10, font });
        y -= lineHeight;
      });
    }
    return y;
  }
}

