import { Document, Types } from 'mongoose';

// Report Filter Interface
export interface IReportFilter {
  dateRange: {
    startDate: Date;
    endDate: Date;
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  };
  companyFilter: {
    companyId: Types.ObjectId;
    companyName: string;
  };
  productFilter: {
    productType: string[];
    category: string[];
    design: string[];
    color: string[];
    gsm: {
      min: number;
      max: number;
    };
  };
  statusFilter: {
    orderStatus: string[];
    productionStatus: string[];
    paymentStatus: string[];
    dispatchStatus: string[];
  };
  customerFilter: {
    customerIds: Types.ObjectId[];
    customerTypes: string[];
    regions: string[];
  };
  supplierFilter: {
    supplierIds: Types.ObjectId[];
    supplierCategories: string[];
  };
  machineFilter: {
    machineIds: Types.ObjectId[];
    machineTypes: string[];
    shifts: string[];
  };
  customFilters: any;
}

// Report Data Interface
export interface IReportData {
  reportType: string;
  data: any;
  summary: {
    totalRecords: number;
    totalValue: number;
    dateRange: {
      start: Date;
      end: Date;
    };
    generatedAt: Date;
  };
  charts: Array<{
    type: string;
    title: string;
    data: any;
    config: any;
  }>;
  tables: Array<{
    title: string;
    headers: string[];
    rows: any[][];
    summary: any;
  }>;
}

// Export Config Interface
export interface IExportConfig {
  formats: string[];
  defaultFormat: string;
  includeCharts: boolean;
  includeSummary: boolean;
  fileName: string;
  compression: boolean;
  password: string;
  watermark: string;
}

// Schedule Interface
export interface ISchedule {
  isScheduled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dayOfWeek: number;
  dayOfMonth: number;
  month: number;
  time: string;
  timezone: string;
  nextRun: Date;
  lastRun: Date;
  isActive: boolean;
}

// Distribution Interface
export interface IDistribution {
  recipients: Array<{
    userId: Types.ObjectId;
    email: string;
    name: string;
    role: string;
  }>;
  deliveryMethod: 'email' | 'dashboard' | 'download' | 'api';
  emailTemplate: string;
  subject: string;
  message: string;
}

// Generated File Interface
export interface IGeneratedFile {
  fileName: string;
  filePath: string;
  fileSize: number;
  format: 'excel' | 'pdf' | 'csv' | 'json';
  generatedAt: Date;
  downloadCount: number;
  lastDownloaded: Date;
}

// Performance Interface
export interface IPerformance {
  generationTime: number;
  dataSize: number;
  recordCount: number;
  cacheKey: string;
  cacheExpiry: Date;
  isCached: boolean;
}

// Access Control Interface
export interface IAccessControl {
  isPublic: boolean;
  allowedRoles: string[];
  allowedUsers: Types.ObjectId[];
  requiresApproval: boolean;
  approvedBy: Types.ObjectId;
  approvedAt: Date;
}

// Main Advanced Report Interface
export interface IAdvancedReport extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  reportId: string;
  reportName: string;
  reportDescription: string;
  reportCategory: 'inventory' | 'production' | 'sales' | 'purchase' | 'financial' | 'logistics' | 'quality' | 'custom';
  reportType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'adhoc' | 'scheduled';
  filters: IReportFilter;
  reportData: IReportData;
  exportConfig: IExportConfig;
  schedule: ISchedule;
  schedules: ISchedule[]; // For backward compatibility
  distribution: IDistribution;
  status: 'draft' | 'generating' | 'completed' | 'failed' | 'archived';
  progress: number;
  generatedFiles: IGeneratedFile[];
  performance: IPerformance;
  accessControl: IAccessControl;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  lastAccessed: Date;
  accessCount: number;
  tags: string[];
  version: string;
  notes: string;
  isTemplate: boolean;
  templateId: Types.ObjectId;
  isActive: boolean;
  lastExecuted: Date;
  executions: any[];
  totalExecutions: number;
  customFields: any;
}
