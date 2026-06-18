import { Schema, model } from 'mongoose';
import { IReport, IReportParameter, IReportSchedule, IReportExecution } from '@/types/models';

const ReportParameterSchema = new Schema<IReportParameter>({
  parameterName: { type: String, required: true },
  parameterType: { 
    type: String, 
    enum: ['string', 'number', 'date', 'boolean', 'select', 'multiselect', 'daterange'], 
    required: true 
  },
  displayName: { type: String, required: true },
  description: { type: String },
  isRequired: { type: Boolean, default: false },
  defaultValue: { type: Schema.Types.Mixed },
  validationRules: {
    minValue: { type: Number },
    maxValue: { type: Number },
    minLength: { type: Number },
    maxLength: { type: Number },
    pattern: { type: String },
    allowedValues: [String]
  },
  dataSource: {
    sourceType: { type: String, enum: ['static', 'query', 'api'] },
    sourceQuery: { type: String },
    sourceApi: { type: String }
  },
  displayOrder: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true }
}, { _id: false });

const ReportScheduleSchema = new Schema<IReportSchedule>({
  scheduleName: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  frequency: { 
    type: String, 
    enum: ['once', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'], 
    required: true 
  },
  scheduleTime: { type: String }, // HH:MM format
  scheduleDate: { type: Date }, // For 'once' frequency
  dayOfWeek: { type: Number, min: 0, max: 6 }, // For weekly (0=Sunday)
  dayOfMonth: { type: Number, min: 1, max: 31 }, // For monthly
  monthOfYear: { type: Number, min: 1, max: 12 }, // For yearly
  timezone: { type: String, default: 'Asia/Kolkata' },
  parameters: { type: Schema.Types.Mixed }, // Parameter values for scheduled execution
  outputFormat: { type: String, enum: ['pdf', 'excel', 'csv', 'json'], default: 'pdf' },
  recipients: [{
    recipientType: { type: String, enum: ['email', 'user', 'role'], required: true },
    recipientId: { type: String, required: true },
    recipientName: { type: String, required: true }
  }],
  deliveryMethod: { type: String, enum: ['email', 'download', 'ftp', 'api'], default: 'email' },
  emailSubject: { type: String },
  emailBody: { type: String },
  lastExecution: { type: Date },
  nextExecution: { type: Date },
  executionCount: { type: Number, default: 0 },
  failureCount: { type: Number, default: 0 },
  lastError: { type: String }
}, { _id: false });

const ReportExecutionSchema = new Schema<IReportExecution>({
  executionId: { type: String, required: true, unique: true },
  executionDate: { type: Date, required: true, default: Date.now },
  executedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  executorName: { type: String, required: true },
  executionType: { type: String, enum: ['manual', 'scheduled', 'api'], required: true },
  parameters: { type: Schema.Types.Mixed },
  status: { 
    type: String, 
    enum: ['queued', 'running', 'completed', 'failed', 'cancelled'], 
    default: 'queued' 
  },
  startTime: { type: Date },
  endTime: { type: Date },
  executionTime: { type: Number }, // milliseconds
  recordCount: { type: Number, default: 0 },
  outputFormat: { type: String, enum: ['pdf', 'excel', 'csv', 'json'], required: true },
  outputSize: { type: Number }, // bytes
  outputUrl: { type: String },
  downloadCount: { type: Number, default: 0 },
  errorMessage: { type: String },
  errorDetails: { type: String },
  performanceMetrics: {
    queryTime: { type: Number }, // milliseconds
    renderTime: { type: Number }, // milliseconds
    memoryUsage: { type: Number }, // bytes
    cpuUsage: { type: Number } // percentage
  },
  scheduleName: { type: String }, // If executed via schedule
  isArchived: { type: Boolean, default: false },
  expiresAt: { type: Date } // Auto-delete after this date
}, { _id: false });

const ReportSchema = new Schema<IReport>({
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
    uppercase: true,
    trim: true
  },
  reportName: { 
    type: String, 
    required: true,
    trim: true
  },
  reportCode: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true
  },
  displayName: { type: String },
  description: { type: String },
  version: { type: String, default: '1.0' },

  // Report Classification
  category: {
    type: String,
    enum: ['financial', 'operational', 'sales', 'purchase', 'inventory', 'production', 'hr', 'quality', 'security', 'analytics', 'compliance', 'custom'],
    required: true,
    index: true
  },
  subCategory: { type: String },
  reportType: {
    type: String,
    enum: ['tabular', 'summary', 'detailed', 'dashboard', 'chart', 'pivot', 'matrix', 'subreport'],
    required: true
  },
  complexity: {
    type: String,
    enum: ['simple', 'medium', 'complex', 'advanced'],
    default: 'simple'
  },

  // Data Source Configuration
  dataSource: {
    sourceType: { 
      type: String, 
      enum: ['database', 'api', 'file', 'multiple'], 
      required: true 
    },
    primarySource: { type: String, required: true },
    secondarySources: [String],
    connectionString: { type: String },
    query: { type: String, required: true },
    queryType: { type: String, enum: ['sql', 'mongodb', 'api', 'custom'], required: true },
    refreshInterval: { type: Number, default: 0 }, // minutes (0 = no auto-refresh)
    cacheEnabled: { type: Boolean, default: false },
    cacheDuration: { type: Number, default: 60 } // minutes
  },

  // Report Parameters
  parameters: [ReportParameterSchema],
  hasParameters: { type: Boolean, default: false },

  // Layout & Formatting
  layout: {
    orientation: { type: String, enum: ['portrait', 'landscape'], default: 'portrait' },
    pageSize: { type: String, enum: ['A4', 'A3', 'Letter', 'Legal'], default: 'A4' },
    margins: {
      top: { type: Number, default: 20 },
      bottom: { type: Number, default: 20 },
      left: { type: Number, default: 20 },
      right: { type: Number, default: 20 }
    },
    headerHeight: { type: Number, default: 50 },
    footerHeight: { type: Number, default: 30 }
  },

  // Report Structure
  structure: {
    header: {
      showCompanyLogo: { type: Boolean, default: true },
      showCompanyName: { type: Boolean, default: true },
      showReportTitle: { type: Boolean, default: true },
      showGenerationDate: { type: Boolean, default: true },
      showParameters: { type: Boolean, default: true },
      customHeader: { type: String }
    },
    body: {
      showColumnHeaders: { type: Boolean, default: true },
      showRowNumbers: { type: Boolean, default: false },
      alternateRowColors: { type: Boolean, default: true },
      groupBy: [String],
      sortBy: [String],
      aggregations: [{
        column: { type: String, required: true },
        function: { type: String, enum: ['sum', 'avg', 'count', 'min', 'max'], required: true },
        displayName: { type: String }
      }]
    },
    footer: {
      showPageNumbers: { type: Boolean, default: true },
      showGeneratedBy: { type: Boolean, default: true },
      showTotalRecords: { type: Boolean, default: true },
      customFooter: { type: String }
    }
  },

  // Styling & Themes
  styling: {
    theme: { type: String, enum: ['default', 'modern', 'classic', 'minimal'], default: 'default' },
    primaryColor: { type: String, default: '#007bff' },
    secondaryColor: { type: String, default: '#6c757d' },
    fontFamily: { type: String, default: 'Arial' },
    fontSize: { type: Number, default: 10 },
    headerFontSize: { type: Number, default: 12 },
    titleFontSize: { type: Number, default: 16 }
  },

  // Access Control
  accessControl: {
    isPublic: { type: Boolean, default: false },
    allowedRoles: [String],
    allowedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    allowedDepartments: [String],
    restrictByCompany: { type: Boolean, default: true },
    restrictByBranch: { type: Boolean, default: false },
    dataFilters: { type: Schema.Types.Mixed } // Dynamic filters based on user context
  },

  // Output Formats
  supportedFormats: [{ 
    type: String, 
    enum: ['pdf', 'excel', 'csv', 'json', 'xml', 'html'], 
    default: ['pdf'] 
  }],
  defaultFormat: { type: String, enum: ['pdf', 'excel', 'csv', 'json'], default: 'pdf' },

  // Scheduling
  schedules: [ReportScheduleSchema],
  isSchedulable: { type: Boolean, default: true },

  // Execution History
  executions: [ReportExecutionSchema],
  totalExecutions: { type: Number, default: 0 },
  lastExecuted: { type: Date },
  lastExecutedBy: { type: Schema.Types.ObjectId, ref: 'User' },

  // Performance Metrics
  performance: {
    averageExecutionTime: { type: Number, default: 0 }, // milliseconds
    maxExecutionTime: { type: Number, default: 0 },
    minExecutionTime: { type: Number, default: 0 },
    averageRecordCount: { type: Number, default: 0 },
    maxRecordCount: { type: Number, default: 0 },
    successRate: { type: Number, default: 100 }, // percentage
    popularityScore: { type: Number, default: 0 }, // based on usage frequency
    lastOptimized: { type: Date }
  },

  // Metadata
  metadata: {
    author: { type: String },
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewer: { type: String },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User' },
    approver: { type: String },
    approverId: { type: Schema.Types.ObjectId, ref: 'User' },
    keywords: [String],
    businessRules: { type: String },
    dataDefinitions: { type: String },
    changeLog: [{
      version: { type: String, required: true },
      changeDate: { type: Date, required: true },
      changedBy: { type: String, required: true },
      changeDescription: { type: String, required: true }
    }]
  },

  // Status & Lifecycle
  status: {
    type: String,
    enum: ['draft', 'testing', 'approved', 'published', 'deprecated', 'archived'],
    default: 'draft',
    index: true
  },
  isActive: { type: Boolean, default: true },
  isTemplate: { type: Boolean, default: false },
  templateId: { type: Schema.Types.ObjectId, ref: 'Report' },
  publishedAt: { type: Date },
  deprecatedAt: { type: Date },
  archivedAt: { type: Date },

  // Additional Information
  tags: [String],
  customFields: { type: Schema.Types.Mixed },
  attachments: [String], // URLs to related documents
  helpText: { type: String },
  troubleshootingGuide: { type: String },

  // Tracking & Audit
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  ownerName: { type: String }
}, {
  timestamps: true,
  collection: 'reports'
});

// Compound Indexes for optimal performance
ReportSchema.index({ companyId: 1, reportId: 1 }, { unique: true });
ReportSchema.index({ companyId: 1, reportCode: 1 }, { unique: true });
ReportSchema.index({ companyId: 1, category: 1, status: 1 });
ReportSchema.index({ companyId: 1, isActive: 1, status: 1 });
ReportSchema.index({ companyId: 1, lastExecuted: -1 });
ReportSchema.index({ 'executions.executionDate': -1 });

// Text search index
ReportSchema.index({ 
  reportName: 'text', 
  reportCode: 'text',
  description: 'text',
  'metadata.keywords': 'text'
});

// Pre-save middleware
ReportSchema.pre('save', function(next) {
  // Update parameters flag
  this.hasParameters = this.parameters.length > 0;
  
  // Update execution counts
  this.totalExecutions = this.executions.length;
  
  // Calculate performance metrics
  if (this.executions.length > 0) {
    const completedExecutions = this.executions.filter(exec => exec.status === 'completed');
    
    if (completedExecutions.length > 0) {
      const executionTimes = completedExecutions.map(exec => exec.executionTime || 0);
      const recordCounts = completedExecutions.map(exec => exec.recordCount || 0);
      
      this.performance.averageExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
      this.performance.maxExecutionTime = Math.max(...executionTimes);
      this.performance.minExecutionTime = Math.min(...executionTimes);
      this.performance.averageRecordCount = recordCounts.reduce((a, b) => a + b, 0) / recordCounts.length;
      this.performance.maxRecordCount = Math.max(...recordCounts);
      this.performance.successRate = (completedExecutions.length / this.executions.length) * 100;
    }
    
    this.lastExecuted = this.executions[this.executions.length - 1].executionDate;
  }
  
  next();
});

// Instance methods
ReportSchema.methods.canUserAccess = function(userId: string, userRoles: string[], userDepartment?: string): boolean {
  if (this.accessControl.isPublic) return true;
  
  // Check user-specific access
  if (this.accessControl.allowedUsers.includes(userId)) return true;
  
  // Check role-based access
  if (this.accessControl.allowedRoles.some(role => userRoles.includes(role))) return true;
  
  // Check department-based access
  if (userDepartment && this.accessControl.allowedDepartments.includes(userDepartment)) return true;
  
  return false;
};

ReportSchema.methods.addExecution = function(executionData: any) {
  const executionId = `${this.reportCode}_${Date.now()}`;
  
  this.executions.push({
    ...executionData,
    executionId,
    executionDate: new Date()
  });
  
  // Keep only last 100 executions to manage document size
  if (this.executions.length > 100) {
    this.executions = this.executions.slice(-100);
  }
  
  return this.save();
};

ReportSchema.methods.getActiveSchedules = function() {
  return this.schedules.filter(schedule => schedule.isActive);
};

ReportSchema.methods.getExecutionHistory = function(limit: number = 10) {
  return this.executions
    .sort((a, b) => b.executionDate.getTime() - a.executionDate.getTime())
    .slice(0, limit);
};

// Static methods
ReportSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId, isActive: true, status: 'published' });
};

ReportSchema.statics.findByCategory = function(companyId: string, category: string) {
  return this.find({ 
    companyId, 
    category, 
    isActive: true, 
    status: 'published' 
  }).sort({ reportName: 1 });
};

ReportSchema.statics.findPopularReports = function(companyId: string, limit: number = 10) {
  return this.find({ 
    companyId, 
    isActive: true, 
    status: 'published' 
  })
  .sort({ 'performance.popularityScore': -1, totalExecutions: -1 })
  .limit(limit);
};

ReportSchema.statics.getReportStats = function(companyId: string) {
  return this.aggregate([
    { $match: { companyId: new Schema.Types.ObjectId(companyId), isActive: true } },
    {
      $group: {
        _id: {
          category: '$category',
          status: '$status'
        },
        count: { $sum: 1 },
        totalExecutions: { $sum: '$totalExecutions' },
        avgExecutionTime: { $avg: '$performance.averageExecutionTime' },
        avgSuccessRate: { $avg: '$performance.successRate' }
      }
    }
  ]);
};

export default model<IReport>('Report', ReportSchema);
