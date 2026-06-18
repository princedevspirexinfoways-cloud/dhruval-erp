import { Schema, model } from 'mongoose';

// Report Filter Schema
const ReportFilterSchema = new Schema({
  dateRange: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    period: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'] }
  },
  companyFilter: {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
    companyName: { type: String }
  },
  productFilter: {
    productType: [String],
    category: [String],
    design: [String],
    color: [String],
    gsm: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 }
    }
  },
  statusFilter: {
    orderStatus: [String],
    productionStatus: [String],
    paymentStatus: [String],
    dispatchStatus: [String]
  },
  customerFilter: {
    customerIds: [Schema.Types.ObjectId],
    customerTypes: [String],
    regions: [String]
  },
  supplierFilter: {
    supplierIds: [Schema.Types.ObjectId],
    supplierCategories: [String]
  },
  machineFilter: {
    machineIds: [Schema.Types.ObjectId],
    machineTypes: [String],
    shifts: [String]
  },
  customFilters: { type: Schema.Types.Mixed } // For dynamic filters
}, { _id: false });

// Report Data Schema
const ReportDataSchema = new Schema({
  reportType: { type: String, required: true },
  data: { type: Schema.Types.Mixed, required: true }, // Actual report data
  summary: {
    totalRecords: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    totalQuantity: { type: Number, default: 0 },
    averageValue: { type: Number, default: 0 },
    minValue: { type: Number, default: 0 },
    maxValue: { type: Number, default: 0 }
  },
  charts: [{
    chartType: { type: String, enum: ['bar', 'line', 'pie', 'doughnut', 'table'] },
    chartData: { type: Schema.Types.Mixed },
    chartConfig: { type: Schema.Types.Mixed }
  }],
  generatedAt: { type: Date, default: Date.now },
  
  // Enhanced data storage for automated reports
  reportData: {
    // Daily Report Data
    dailyData: {
      date: { type: Date },
      inventorySummary: {
        totalItems: { type: Number, default: 0 },
        totalValue: { type: Number, default: 0 },
        lowStockItems: { type: Number, default: 0 },
        newItems: { type: Number, default: 0 }
      },
      productionSummary: {
        totalOrders: { type: Number, default: 0 },
        completedOrders: { type: Number, default: 0 },
        pendingOrders: { type: Number, default: 0 },
        totalProduction: { type: Number, default: 0 },
        efficiency: { type: Number, default: 0 }
      },
      salesSummary: {
        totalOrders: { type: Number, default: 0 },
        totalRevenue: { type: Number, default: 0 },
        newCustomers: { type: Number, default: 0 },
        pendingPayments: { type: Number, default: 0 }
      },
      financialSummary: {
        totalIncome: { type: Number, default: 0 },
        totalExpenses: { type: Number, default: 0 },
        netProfit: { type: Number, default: 0 },
        bankBalance: { type: Number, default: 0 }
      },
      logisticsSummary: {
        totalDispatch: { type: Number, default: 0 },
        totalDeliveries: { type: Number, default: 0 },
        pendingDeliveries: { type: Number, default: 0 },
        rtoCount: { type: Number, default: 0 }
      }
    },
    
    // Weekly Report Data
    weeklyData: {
      weekStart: { type: Date },
      weekEnd: { type: Date },
      weekNumber: { type: Number },
      trends: {
        inventoryTrend: { type: String, enum: ['increasing', 'decreasing', 'stable'] },
        productionTrend: { type: String, enum: ['increasing', 'decreasing', 'stable'] },
        salesTrend: { type: String, enum: ['increasing', 'decreasing', 'stable'] },
        financialTrend: { type: String, enum: ['increasing', 'decreasing', 'stable'] }
      },
      comparisons: {
        previousWeek: { type: Schema.Types.Mixed },
        percentageChange: { type: Schema.Types.Mixed }
      }
    },
    
    // Monthly Report Data
    monthlyData: {
      month: { type: Number, min: 1, max: 12 },
      year: { type: Number },
      monthName: { type: String },
      monthlyTotals: {
        inventory: { type: Schema.Types.Mixed },
        production: { type: Schema.Types.Mixed },
        sales: { type: Schema.Types.Mixed },
        financial: { type: Schema.Types.Mixed },
        logistics: { type: Schema.Types.Mixed }
      },
      monthlyAverages: {
        dailyProduction: { type: Number, default: 0 },
        dailySales: { type: Number, default: 0 },
        dailyExpenses: { type: Number, default: 0 }
      },
      monthlyGrowth: {
        monthOverMonth: { type: Number, default: 0 },
        yearOverYear: { type: Number, default: 0 }
      }
    }
  }
}, { _id: false });

// Export Configuration Schema
const ExportConfigSchema = new Schema({
  format: { type: String, enum: ['excel', 'pdf', 'csv', 'json'], required: true },
  fileName: { type: String, required: true },
  includeCharts: { type: Boolean, default: true },
  includeSummary: { type: Boolean, default: true },
  includeDetails: { type: Boolean, default: true },
  pageSize: { type: String, enum: ['A4', 'A3', 'Letter', 'Legal'], default: 'A4' },
  orientation: { type: String, enum: ['portrait', 'landscape'], default: 'portrait' },
  customStyling: { type: Schema.Types.Mixed },
  exportOptions: { type: Schema.Types.Mixed }
}, { _id: false });

// Advanced Report Schema
const AdvancedReportSchema = new Schema({
  companyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true, 
    index: true 
  },
  
  // Report Identification
  reportId: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  reportName: { type: String, required: true },
  reportDescription: { type: String },
  reportCategory: { 
    type: String, 
    enum: ['inventory', 'production', 'sales', 'purchase', 'financial', 'logistics', 'quality', 'custom'],
    required: true
  },
  reportType: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'adhoc', 'scheduled'],
    required: true
  },
  
  // Report Configuration
  filters: ReportFilterSchema,
  reportData: ReportDataSchema,
  exportConfig: ExportConfigSchema,
  
  // Scheduling (for automated reports)
  schedule: {
    isScheduled: { type: Boolean, default: false },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] },
    dayOfWeek: { type: Number, min: 0, max: 6 }, // 0 = Sunday
    dayOfMonth: { type: Number, min: 1, max: 31 },
    month: { type: Number, min: 1, max: 12 },
    time: { type: String }, // HH:MM format
    timezone: { type: String, default: 'Asia/Kolkata' },
    nextRun: { type: Date },
    lastRun: { type: Date },
    isActive: { type: Boolean, default: true }
  },
  
  // Distribution
  distribution: {
    recipients: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      email: { type: String },
      name: { type: String },
      role: { type: String }
    }],
    deliveryMethod: { type: String, enum: ['email', 'dashboard', 'download', 'api'] },
    emailTemplate: { type: String },
    subject: { type: String },
    message: { type: String }
  },
  
  // Report Status
  status: { 
    type: String, 
    enum: ['draft', 'generating', 'completed', 'failed', 'archived'], 
    default: 'draft',
    index: true
  },
  progress: { type: Number, min: 0, max: 100, default: 0 }, // Generation progress
  
  // Generated Files
  generatedFiles: [{
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, min: 0 },
    format: { type: String, enum: ['excel', 'pdf', 'csv', 'json'] },
    generatedAt: { type: Date, default: Date.now },
    downloadCount: { type: Number, default: 0 },
    lastDownloaded: { type: Date }
  }],
  
  // Performance & Caching
  performance: {
    generationTime: { type: Number, min: 0 }, // milliseconds
    dataSize: { type: Number, min: 0 }, // bytes
    recordCount: { type: Number, min: 0 },
    cacheKey: { type: String },
    cacheExpiry: { type: Date },
    isCached: { type: Boolean, default: false }
  },
  
  // Access Control
  accessControl: {
    isPublic: { type: Boolean, default: false },
    allowedRoles: [String],
    allowedUsers: [Schema.Types.ObjectId],
    requiresApproval: { type: Boolean, default: false },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date }
  },
  
  // Audit & Tracking
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastAccessed: { type: Date },
  accessCount: { type: Number, default: 0 },
  
  // Metadata
  tags: [String],
  version: { type: String, default: '1.0' },
  notes: { type: String },
  isTemplate: { type: Boolean, default: false },
  templateId: { type: Schema.Types.ObjectId, ref: 'AdvancedReport' }
});

// Indexes
AdvancedReportSchema.index({ companyId: 1, reportCategory: 1, reportType: 1 });
AdvancedReportSchema.index({ companyId: 1, status: 1, createdAt: -1 });
AdvancedReportSchema.index({ companyId: 1, 'schedule.nextRun': 1 });
AdvancedReportSchema.index({ companyId: 1, 'schedule.isActive': 1 });
AdvancedReportSchema.index({ companyId: 1, 'accessControl.allowedRoles': 1 });
AdvancedReportSchema.index({ companyId: 1, tags: 1 });

// Static methods
AdvancedReportSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId }).sort({ createdAt: -1 });
};

AdvancedReportSchema.statics.findByCategory = function(companyId: string, category: string) {
  return this.find({ companyId, reportCategory: category }).sort({ createdAt: -1 });
};

AdvancedReportSchema.statics.findScheduledReports = function(companyId: string) {
  return this.find({ 
    companyId, 
    'schedule.isScheduled': true, 
    'schedule.isActive': true 
  }).sort({ 'schedule.nextRun': 1 });
};

AdvancedReportSchema.statics.findTemplates = function(companyId: string) {
  return this.find({ companyId, isTemplate: true }).sort({ createdAt: -1 });
};

AdvancedReportSchema.statics.findPublicReports = function(companyId: string) {
  return this.find({ companyId, 'accessControl.isPublic': true }).sort({ createdAt: -1 });
};

// Instance methods
AdvancedReportSchema.methods.generateReport = async function() {
  this.status = 'generating';
  this.progress = 0;
  this.updatedAt = new Date();
  await this.save();
  
  try {
    // Simulate report generation process
    for (let i = 0; i <= 100; i += 10) {
      this.progress = i;
      await this.save();
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
    }
    
    this.status = 'completed';
    this.progress = 100;
    this.performance.generationTime = Date.now() - this.createdAt.getTime();
    this.performance.lastRun = new Date();
    
    if (this.schedule.isScheduled) {
      this.schedule.lastRun = new Date();
      // Calculate next run based on frequency
      this.calculateNextRun();
    }
    
    await this.save();
    return true;
  } catch (error) {
    this.status = 'failed';
    this.notes = `Generation failed: ${error.message}`;
    await this.save();
    throw error;
  }
};

AdvancedReportSchema.methods.calculateNextRun = function() {
  if (!this.schedule.isScheduled) return;
  
  const now = new Date();
  let nextRun = new Date(now);
  
  switch (this.schedule.frequency) {
    case 'daily':
      nextRun.setDate(nextRun.getDate() + 1);
      break;
    case 'weekly':
      nextRun.setDate(nextRun.getDate() + 7);
      break;
    case 'monthly':
      nextRun.setDate(1); // First day of next month
      nextRun.setMonth(nextRun.getMonth() + 1);
      break;
    case 'quarterly':
      nextRun.setDate(1); // First day of next quarter
      nextRun.setMonth(nextRun.getMonth() + 3);
      break;
    case 'yearly':
      nextRun.setDate(1); // First day of next year
      nextRun.setMonth(0); // January
      nextRun.setFullYear(nextRun.getFullYear() + 1);
      break;
  }
  
  if (this.schedule.time) {
    const [hours, minutes] = this.schedule.time.split(':');
    nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }
  
  this.schedule.nextRun = nextRun;
};

AdvancedReportSchema.methods.exportReport = function(format: string, options: any = {}) {
  const exportConfig = {
    ...this.exportConfig.toObject(),
    format,
    ...options
  };
  
  // Generate export file
  const fileName = `${this.reportName}_${new Date().toISOString().split('T')[0]}.${format}`;
  const filePath = `/exports/${this.companyId}/${fileName}`;
  
  const generatedFile = {
    fileName,
    filePath,
    format,
    generatedAt: new Date(),
    downloadCount: 0
  };
  
  this.generatedFiles.push(generatedFile);
  this.lastAccessed = new Date();
  this.accessCount += 1;
  
  return generatedFile;
};

AdvancedReportSchema.methods.cloneAsTemplate = function() {
  const template = new this.constructor({
    ...this.toObject(),
    _id: undefined,
    reportId: `${this.reportId}_TEMPLATE_${Date.now()}`,
    reportName: `${this.reportName} (Template)`,
    isTemplate: true,
    templateId: this._id,
    createdAt: new Date(),
    updatedAt: new Date(),
    generatedFiles: [],
    performance: {
      generationTime: 0,
      dataSize: 0,
      recordCount: 0,
      isCached: false
    }
  });
  
  return template;
};

// Pre-save middleware
AdvancedReportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  if (this.schedule.isScheduled && !this.schedule.nextRun) {
    (this as any).calculateNextRun();
  }
  
  next();
});

export const AdvancedReport = model('AdvancedReport', AdvancedReportSchema);
export default AdvancedReport;
