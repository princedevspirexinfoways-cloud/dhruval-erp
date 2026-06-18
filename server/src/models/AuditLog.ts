import { Schema, model } from 'mongoose';
import { IAuditLog } from '@/types/models';

const SessionDetailsSchema = new Schema({
  sessionId: { type: String },
  ipAddress: { type: String, required: true },
  userAgent: { type: String },
  deviceType: { type: String, enum: ['desktop', 'mobile', 'tablet', 'unknown'] },
  browser: { type: String },
  operatingSystem: { type: String },
  location: {
    country: { type: String },
    region: { type: String },
    city: { type: String },
    latitude: { type: Number },
    longitude: { type: Number }
  }
}, { _id: false });

const RequestDetailsSchema = new Schema({
  method: { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], required: true },
  endpoint: { type: String, required: true },
  requestId: { type: String },
  correlationId: { type: String },
  requestBody: { type: Schema.Types.Mixed },
  queryParams: { type: Schema.Types.Mixed },
  headers: { type: Schema.Types.Mixed },
  responseStatus: { type: Number },
  responseTime: { type: Number }, // in milliseconds
  responseSize: { type: Number } // in bytes
}, { _id: false });

const DataChangesSchema = new Schema({
  field: { type: String, required: true },
  oldValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
  dataType: { type: String, enum: ['string', 'number', 'boolean', 'object', 'array', 'date'] }
}, { _id: false });

const SecurityContextSchema = new Schema({
  authenticationMethod: { type: String, enum: ['password', 'otp', '2fa', 'sso', 'api_key'] },
  authenticationStatus: { type: String, enum: ['success', 'failed', 'locked', 'expired'] },
  permissionLevel: { type: String },
  accessAttempts: { type: Number, default: 1 },
  riskScore: { type: Number, min: 0, max: 100 },
  threatIndicators: [String],
  securityFlags: [String]
}, { _id: false });

const AuditLogSchema = new Schema<IAuditLog>({
  // Company Context
  companyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true, 
    index: true 
  },

  // User Information
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    index: true 
  },
  userName: { type: String },
  userEmail: { type: String },
  userRole: { type: String },
  impersonatedBy: { type: Schema.Types.ObjectId, ref: 'User' }, // For admin impersonation

  // Action Details
  action: { 
    type: String, 
    required: true,
    index: true
  },
  actionCategory: {
    type: String,
    enum: [
      'authentication', 'authorization', 'data_access', 'data_modification', 
      'system_configuration', 'user_management', 'financial_transaction',
      'inventory_management', 'production_management', 'order_management',
      'security_event', 'system_event', 'integration_event', 'backup_restore'
    ],
    required: true,
    index: true
  },
  actionType: {
    type: String,
    enum: ['create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import', 'approve', 'reject'],
    required: true,
    index: true
  },

  // Resource Information
  resource: { 
    type: String, 
    required: true,
    index: true
  },
  resourceId: { type: String, index: true },
  resourceType: {
    type: String,
    enum: [
      'user', 'company', 'customer', 'supplier', 'inventory_item', 'stock_movement',
      'production_order', 'customer_order', 'financial_transaction', 'invoice',
      'purchase_order', 'quotation', 'report', 'system_setting', 'backup'
    ],
    index: true
  },
  parentResource: {
    type: { type: String },
    id: { type: String }
  },

  // Event Details
  eventTimestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  eventId: { 
    type: String, 
    unique: true, 
    required: true 
  },
  eventSource: {
    type: String,
    enum: ['web_app', 'mobile_app', 'api', 'system', 'integration', 'scheduled_job'],
    default: 'web_app',
    index: true
  },
  eventSeverity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info',
    index: true
  },

  // Session & Request Context
  sessionDetails: SessionDetailsSchema,
  requestDetails: RequestDetailsSchema,

  // Data Changes (for update operations)
  dataChanges: [DataChangesSchema],
  oldData: { type: Schema.Types.Mixed },
  newData: { type: Schema.Types.Mixed },

  // Security Context
  securityContext: SecurityContextSchema,

  // Business Context
  businessContext: {
    department: { type: String },
    process: { type: String },
    workflow: { type: String },
    businessRule: { type: String },
    complianceRequirement: { type: String }
  },

  // Result & Impact
  result: {
    status: { 
      type: String, 
      enum: ['success', 'failure', 'partial', 'pending'], 
      default: 'success',
      index: true
    },
    errorCode: { type: String },
    errorMessage: { type: String },
    affectedRecords: { type: Number, default: 1 },
    impactLevel: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical'], 
      default: 'low' 
    }
  },

  // Additional Information
  description: { type: String, required: true },
  additionalInfo: { type: Schema.Types.Mixed },
  tags: [String],
  
  // Compliance & Retention
  retentionPeriod: { type: Number, default: 2555 }, // days (7 years default)
  complianceFlags: [String],
  isPersonalData: { type: Boolean, default: false },
  dataClassification: { 
    type: String, 
    enum: ['public', 'internal', 'confidential', 'restricted'], 
    default: 'internal' 
  },

  // System Information
  systemInfo: {
    serverName: { type: String },
    applicationVersion: { type: String },
    databaseVersion: { type: String },
    environment: { type: String, enum: ['development', 'staging', 'production'] }
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }, // Audit logs should not be updated
  collection: 'audit_logs'
});

// Indexes for optimal performance
AuditLogSchema.index({ companyId: 1, eventTimestamp: -1 });
AuditLogSchema.index({ companyId: 1, userId: 1, eventTimestamp: -1 });
AuditLogSchema.index({ companyId: 1, actionCategory: 1, eventTimestamp: -1 });
AuditLogSchema.index({ companyId: 1, resource: 1, resourceId: 1, eventTimestamp: -1 });
AuditLogSchema.index({ companyId: 1, 'result.status': 1, eventTimestamp: -1 });
AuditLogSchema.index({ eventSeverity: 1, eventTimestamp: -1 });
AuditLogSchema.index({ 'securityContext.riskScore': 1, eventTimestamp: -1 });

// TTL index for automatic cleanup based on retention period
AuditLogSchema.index({ 
  eventTimestamp: 1 
}, { 
  expireAfterSeconds: 0, // Will be calculated based on retentionPeriod
  partialFilterExpression: { retentionPeriod: { $exists: true } }
});

// Text search index
AuditLogSchema.index({ 
  description: 'text', 
  action: 'text',
  resource: 'text',
  userName: 'text',
  'result.errorMessage': 'text'
});

// Pre-save middleware
AuditLogSchema.pre('save', function(next) {
  // Generate unique event ID if not provided
  if (!this.eventId) {
    this.eventId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Set system information
  if (!this.systemInfo.environment) {
    this.systemInfo.environment = process.env.NODE_ENV as any || 'development';
  }
  
  if (!this.systemInfo.applicationVersion) {
    this.systemInfo.applicationVersion = process.env.APP_VERSION || '1.0.0';
  }
  
  // Determine data classification based on resource type
  if (!this.dataClassification) {
    const sensitiveResources = ['user', 'financial_transaction', 'customer', 'supplier'];
    if (sensitiveResources.includes(this.resourceType || '')) {
      this.dataClassification = 'confidential';
    }
  }
  
  // Set personal data flag
  if (!this.isPersonalData) {
    const personalDataResources = ['user', 'customer'];
    this.isPersonalData = personalDataResources.includes(this.resourceType || '');
  }
  
  next();
});

// Instance methods
AuditLogSchema.methods.isSecurityEvent = function(): boolean {
  return this.actionCategory === 'security_event' || 
         this.eventSeverity === 'critical' ||
         (this.securityContext?.riskScore || 0) > 70;
};

AuditLogSchema.methods.isFailureEvent = function(): boolean {
  return this.result.status === 'failure';
};

AuditLogSchema.methods.hasDataChanges = function(): boolean {
  return this.dataChanges && this.dataChanges.length > 0;
};

AuditLogSchema.methods.getRetentionDate = function(): Date {
  const retentionMs = this.retentionPeriod * 24 * 60 * 60 * 1000; // Convert days to milliseconds
  return new Date(this.eventTimestamp.getTime() + retentionMs);
};

// Static methods
AuditLogSchema.statics.findByCompany = function(companyId: string, limit: number = 100) {
  return this.find({ companyId })
    .sort({ eventTimestamp: -1 })
    .limit(limit);
};

AuditLogSchema.statics.findByUser = function(companyId: string, userId: string, limit: number = 100) {
  return this.find({ companyId, userId })
    .sort({ eventTimestamp: -1 })
    .limit(limit);
};

AuditLogSchema.statics.findByResource = function(companyId: string, resource: string, resourceId?: string) {
  const query: any = { companyId, resource };
  if (resourceId) {
    query.resourceId = resourceId;
  }
  return this.find(query).sort({ eventTimestamp: -1 });
};

AuditLogSchema.statics.findSecurityEvents = function(companyId: string, startDate?: Date, endDate?: Date) {
  const query: any = { 
    companyId,
    $or: [
      { actionCategory: 'security_event' },
      { eventSeverity: 'critical' },
      { 'securityContext.riskScore': { $gt: 70 } }
    ]
  };
  
  if (startDate || endDate) {
    query.eventTimestamp = {};
    if (startDate) query.eventTimestamp.$gte = startDate;
    if (endDate) query.eventTimestamp.$lte = endDate;
  }
  
  return this.find(query).sort({ eventTimestamp: -1 });
};

AuditLogSchema.statics.findFailedActions = function(companyId: string, startDate?: Date, endDate?: Date) {
  const query: any = { 
    companyId,
    'result.status': 'failure'
  };
  
  if (startDate || endDate) {
    query.eventTimestamp = {};
    if (startDate) query.eventTimestamp.$gte = startDate;
    if (endDate) query.eventTimestamp.$lte = endDate;
  }
  
  return this.find(query).sort({ eventTimestamp: -1 });
};

AuditLogSchema.statics.getActivitySummary = function(companyId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        companyId: new Schema.Types.ObjectId(companyId),
        eventTimestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          actionCategory: '$actionCategory',
          actionType: '$actionType',
          status: '$result.status'
        },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        avgResponseTime: { $avg: '$requestDetails.responseTime' }
      }
    },
    {
      $addFields: {
        uniqueUserCount: { $size: '$uniqueUsers' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Prevent updates to audit logs
AuditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function() {
  throw new Error('Audit logs cannot be modified');
});

export default model<IAuditLog>('AuditLog', AuditLogSchema);
