import { Schema, model } from 'mongoose';
import { IBusinessAnalytics, IKPIMetric, IAnalyticsReport, IDataSource } from '@/types/models';

const KPIMetricSchema = new Schema<IKPIMetric>({
  metricName: { type: String, required: true },
  metricCode: { type: String, required: true, uppercase: true },
  category: { 
    type: String, 
    enum: ['financial', 'operational', 'sales', 'production', 'inventory', 'hr', 'quality', 'security'], 
    required: true 
  },
  dataType: { 
    type: String, 
    enum: ['number', 'percentage', 'currency', 'count', 'ratio', 'time'], 
    required: true 
  },
  unit: { type: String },
  currentValue: { type: Number, required: true },
  previousValue: { type: Number, default: 0 },
  targetValue: { type: Number },
  minValue: { type: Number },
  maxValue: { type: Number },
  trend: { 
    type: String, 
    enum: ['up', 'down', 'stable', 'volatile'], 
    default: 'stable' 
  },
  changePercentage: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['excellent', 'good', 'average', 'poor', 'critical'], 
    default: 'average' 
  },
  calculationFormula: { type: String },
  dataSource: { type: String, required: true },
  lastCalculated: { type: Date, default: Date.now },
  calculationFrequency: { 
    type: String, 
    enum: ['real_time', 'hourly', 'daily', 'weekly', 'monthly'], 
    default: 'daily' 
  },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const DataSourceSchema = new Schema<IDataSource>({
  sourceName: { type: String, required: true },
  sourceType: { 
    type: String, 
    enum: ['database', 'api', 'file', 'manual', 'calculated'], 
    required: true 
  },
  connectionString: { type: String },
  query: { type: String },
  refreshInterval: { type: Number, default: 3600 }, // seconds
  lastRefresh: { type: Date },
  isActive: { type: Boolean, default: true },
  errorMessage: { type: String }
}, { _id: false });

const AnalyticsReportSchema = new Schema<IAnalyticsReport>({
  reportName: { type: String, required: true },
  reportType: { 
    type: String, 
    enum: ['dashboard', 'detailed', 'summary', 'trend', 'comparison'], 
    required: true 
  },
  category: { type: String, required: true },
  description: { type: String },
  metrics: [String], // KPI metric codes
  filters: { type: Schema.Types.Mixed },
  dateRange: {
    startDate: { type: Date },
    endDate: { type: Date },
    period: { type: String, enum: ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year', 'last_year', 'custom'] }
  },
  visualization: {
    chartType: { type: String, enum: ['line', 'bar', 'pie', 'doughnut', 'area', 'scatter', 'gauge', 'table'] },
    layout: { type: String, enum: ['single', 'grid', 'tabs', 'accordion'] },
    colors: [String],
    showLegend: { type: Boolean, default: true },
    showDataLabels: { type: Boolean, default: false }
  },
  schedule: {
    isScheduled: { type: Boolean, default: false },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    time: { type: String },
    recipients: [String], // email addresses
    format: { type: String, enum: ['pdf', 'excel', 'csv'], default: 'pdf' }
  },
  lastGenerated: { type: Date },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const BusinessAnalyticsSchema = new Schema<IBusinessAnalytics>({
  companyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true, 
    index: true 
  },

  // Analytics Configuration
  analyticsId: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  analyticsName: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { type: String },

  // KPI Metrics
  kpiMetrics: [KPIMetricSchema],
  totalMetrics: { type: Number, default: 0 },
  activeMetrics: { type: Number, default: 0 },

  // Data Sources
  dataSources: [DataSourceSchema],

  // Reports Configuration
  reports: [AnalyticsReportSchema],

  // Dashboard Configuration
  dashboards: [{
    dashboardName: { type: String, required: true },
    dashboardType: { type: String, enum: ['executive', 'operational', 'departmental', 'custom'], required: true },
    layout: { type: String, enum: ['grid', 'flex', 'tabs'], default: 'grid' },
    widgets: [{
      widgetId: { type: String, required: true },
      widgetType: { type: String, enum: ['kpi', 'chart', 'table', 'gauge', 'counter'], required: true },
      title: { type: String, required: true },
      metricCode: { type: String },
      position: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        width: { type: Number, default: 1 },
        height: { type: Number, default: 1 }
      },
      configuration: { type: Schema.Types.Mixed },
      isVisible: { type: Boolean, default: true }
    }],
    accessRoles: [String],
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  }],

  // Performance Tracking
  performance: {
    totalQueries: { type: Number, default: 0 },
    avgQueryTime: { type: Number, default: 0 }, // milliseconds
    lastOptimized: { type: Date },
    cacheHitRate: { type: Number, default: 0 }, // percentage
    errorRate: { type: Number, default: 0 }, // percentage
    dataFreshness: { type: Number, default: 0 }, // minutes since last update
    systemLoad: { type: Number, default: 0 } // percentage
  },

  // Alerts & Notifications
  alerts: [{
    alertName: { type: String, required: true },
    metricCode: { type: String, required: true },
    condition: { 
      type: String, 
      enum: ['greater_than', 'less_than', 'equals', 'not_equals', 'between', 'outside_range'], 
      required: true 
    },
    threshold: { type: Number, required: true },
    secondaryThreshold: { type: Number }, // for range conditions
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    recipients: [String], // email addresses
    isActive: { type: Boolean, default: true },
    lastTriggered: { type: Date },
    triggerCount: { type: Number, default: 0 }
  }],

  // Data Retention Policy
  dataRetention: {
    rawDataDays: { type: Number, default: 90 },
    aggregatedDataDays: { type: Number, default: 365 },
    reportDataDays: { type: Number, default: 1095 }, // 3 years
    autoCleanup: { type: Boolean, default: true },
    lastCleanup: { type: Date }
  },

  // Integration Settings
  integrations: [{
    integrationType: { type: String, enum: ['api', 'webhook', 'file_sync', 'database'], required: true },
    integrationName: { type: String, required: true },
    endpoint: { type: String },
    credentials: { type: Schema.Types.Mixed }, // encrypted
    syncFrequency: { type: Number, default: 3600 }, // seconds
    lastSync: { type: Date },
    isActive: { type: Boolean, default: true },
    errorMessage: { type: String }
  }],

  // User Analytics
  userAnalytics: {
    totalUsers: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    avgSessionDuration: { type: Number, default: 0 }, // minutes
    mostViewedReports: [String],
    mostUsedMetrics: [String],
    userEngagement: { type: Number, default: 0 } // percentage
  },

  // System Configuration
  configuration: {
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    numberFormat: { type: String, default: 'en-IN' },
    refreshInterval: { type: Number, default: 300 }, // seconds
    cacheEnabled: { type: Boolean, default: true },
    realTimeEnabled: { type: Boolean, default: false },
    exportFormats: [{ type: String, enum: ['pdf', 'excel', 'csv', 'json'] }]
  },

  // Additional Information
  notes: { type: String },
  tags: [String],
  customFields: { type: Schema.Types.Mixed },

  // Tracking & Audit
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  lastCalculated: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'business_analytics'
});

// Compound Indexes
// Note: Most indexes are now managed centrally in database-indexes.ts
// Only keeping unique indexes that are not in the central configuration
BusinessAnalyticsSchema.index({ companyId: 1, analyticsId: 1 }, { unique: true });
BusinessAnalyticsSchema.index({ companyId: 1, lastCalculated: -1 });

// Text search index
BusinessAnalyticsSchema.index({ 
  analyticsName: 'text', 
  description: 'text'
});

// Pre-save middleware
BusinessAnalyticsSchema.pre('save', function(next) {
  // Update metric counts
  this.totalMetrics = this.kpiMetrics.length;
  this.activeMetrics = this.kpiMetrics.filter(metric => metric.isActive).length;
  
  // Update last calculated time
  this.lastCalculated = new Date();
  
  next();
});

// Instance methods
BusinessAnalyticsSchema.methods.getMetricByCode = function(metricCode: string) {
  return this.kpiMetrics.find((metric: IKPIMetric) => metric.metricCode === metricCode);
};

BusinessAnalyticsSchema.methods.updateMetricValue = function(metricCode: string, newValue: number) {
  const metric = this.getMetricByCode(metricCode);
  if (metric) {
    metric.previousValue = metric.currentValue;
    metric.currentValue = newValue;
    metric.changePercentage = metric.previousValue ? 
      ((newValue - metric.previousValue) / metric.previousValue) * 100 : 0;
    metric.lastCalculated = new Date();
    
    // Determine trend
    if (metric.changePercentage > 5) metric.trend = 'up';
    else if (metric.changePercentage < -5) metric.trend = 'down';
    else metric.trend = 'stable';
    
    // Determine status based on target
    if (metric.targetValue) {
      const achievement = (newValue / metric.targetValue) * 100;
      if (achievement >= 100) metric.status = 'excellent';
      else if (achievement >= 80) metric.status = 'good';
      else if (achievement >= 60) metric.status = 'average';
      else if (achievement >= 40) metric.status = 'poor';
      else metric.status = 'critical';
    }
  }
  return this.save();
};

BusinessAnalyticsSchema.methods.getDashboardByType = function(dashboardType: string) {
  return this.dashboards.find(dashboard => dashboard.dashboardType === dashboardType && dashboard.isActive);
};

// Static methods
BusinessAnalyticsSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId, isActive: true });
};

BusinessAnalyticsSchema.statics.getKPISummary = function(companyId: string) {
  return this.aggregate([
    { $match: { companyId: new Schema.Types.ObjectId(companyId), isActive: true } },
    { $unwind: '$kpiMetrics' },
    { $match: { 'kpiMetrics.isActive': true } },
    {
      $group: {
        _id: '$kpiMetrics.category',
        totalMetrics: { $sum: 1 },
        avgValue: { $avg: '$kpiMetrics.currentValue' },
        excellentCount: { $sum: { $cond: [{ $eq: ['$kpiMetrics.status', 'excellent'] }, 1, 0] } },
        goodCount: { $sum: { $cond: [{ $eq: ['$kpiMetrics.status', 'good'] }, 1, 0] } },
        criticalCount: { $sum: { $cond: [{ $eq: ['$kpiMetrics.status', 'critical'] }, 1, 0] } }
      }
    }
  ]);
};

export default model<IBusinessAnalytics>('BusinessAnalytics', BusinessAnalyticsSchema);
