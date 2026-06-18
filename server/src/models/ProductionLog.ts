import mongoose, { Schema, Document, Model } from 'mongoose';
import { AuditableDocument } from '../types/models';

export interface IProductionLog extends AuditableDocument {
  // Basic Information
  logType: 'status_change' | 'stage_change' | 'quality_check' | 'machine_start' | 'machine_stop' | 'material_input' | 'material_output' | 'error' | 'maintenance';
  productionStage: 'grey_fabric_inward' | 'pre_processing' | 'dyeing' | 'printing' | 'finishing' | 'cutting_packing' | 'dispatch';
  action: string; // 'batch_status_changed', 'quality_passed', 'machine_started', etc.
  
  // Entity Information
  entityType: string; // 'PreProcessing', 'Dyeing', 'Printing', etc.
  entityId: mongoose.Types.ObjectId;
  entityName?: string; // Batch number, order number, etc.
  
  // User Information
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  userRole?: string;
  
  // Change Details
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
    dataType: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date';
  }[];
  
  // Status Change Specific
  statusChange?: {
    fromStatus: string;
    toStatus: string;
    changeReason: string;
    notes?: string;
    duration?: number; // in minutes
  };
  
  // Production Specific Data
  productionData?: {
    batchNumber?: string;
    productionOrderNumber?: string;
    customerName?: string;
    fabricType?: string;
    fabricColor?: string;
    quantity?: number;
    unit?: string;
    machineName?: string;
    machineId?: mongoose.Types.ObjectId;
    temperature?: number;
    pressure?: number;
    speed?: number;
    efficiency?: number;
    qualityGrade?: string;
    defects?: string[];
  };
  
  // Request Information
  requestInfo: {
    ipAddress: string;
    userAgent: string;
    sessionId?: string;
    requestId?: string;
    method?: string;
    url?: string;
  };
  
  // Additional Data
  metadata?: {
    [key: string]: any;
  };
  
  // Severity and Priority
  severity: 'low' | 'medium' | 'high' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Timestamps
  timestamp: Date;
  expiresAt?: Date; // For automatic cleanup
  
  // Status
  isRead: boolean;
  isArchived: boolean;
  
  // Related Logs
  relatedLogs?: mongoose.Types.ObjectId[];
  parentLogId?: mongoose.Types.ObjectId;
}

// Interface for static methods
export interface IProductionLogModel extends Model<IProductionLog> {
  createStatusChangeLog(data: {
    productionStage: string;
    entityType: string;
    entityId: string;
    entityName?: string;
    userId: string;
    userName: string;
    userEmail: string;
    userRole?: string;
    fromStatus: string;
    toStatus: string;
    changeReason: string;
    notes?: string;
    duration?: number;
    productionData?: any;
    requestInfo: any;
    metadata?: any;
  }): Promise<IProductionLog>;

  createProductionLog(data: {
    logType: string;
    productionStage: string;
    action: string;
    entityType: string;
    entityId: string;
    entityName?: string;
    userId: string;
    userName: string;
    userEmail: string;
    userRole?: string;
    changes?: any[];
    productionData?: any;
    requestInfo: any;
    metadata?: any;
    severity?: string;
    priority?: string;
  }): Promise<IProductionLog>;
}

const ProductionLogSchema = new Schema<IProductionLog>({
  // Basic Information
  logType: { 
    type: String, 
    enum: ['status_change', 'stage_change', 'quality_check', 'machine_start', 'machine_stop', 'material_input', 'material_output', 'error', 'maintenance'], 
    required: true,
    index: true
  },
  productionStage: { 
    type: String, 
    enum: ['grey_fabric_inward', 'pre_processing', 'dyeing', 'printing', 'finishing', 'cutting_packing', 'dispatch'],
    required: true,
    index: true
  },
  action: { 
    type: String, 
    required: true,
    index: true
  },
  
  // Entity Information
  entityType: { 
    type: String, 
    required: true,
    index: true
  },
  entityId: { 
    type: Schema.Types.ObjectId, 
    required: true,
    index: true
  },
  entityName: { 
    type: String,
    index: true
  },
  
  // User Information
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  userName: { 
    type: String, 
    required: true,
    index: true
  },
  userEmail: { 
    type: String, 
    required: true,
    index: true
  },
  userRole: { 
    type: String,
    index: true
  },
  
  // Change Details
  changes: [{
    field: { type: String, required: true },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    dataType: { 
      type: String, 
      enum: ['string', 'number', 'boolean', 'object', 'array', 'date'],
      required: true
    }
  }],
  
  // Status Change Specific
  statusChange: {
    fromStatus: { type: String },
    toStatus: { type: String },
    changeReason: { type: String },
    notes: { type: String },
    duration: { type: Number } // in minutes
  },
  
  // Production Specific Data
  productionData: {
    batchNumber: { type: String },
    productionOrderNumber: { type: String },
    customerName: { type: String },
    fabricType: { type: String },
    fabricColor: { type: String },
    quantity: { type: Number },
    unit: { type: String },
    machineName: { type: String },
    machineId: { type: Schema.Types.ObjectId, ref: 'Machine' },
    temperature: { type: Number },
    pressure: { type: Number },
    speed: { type: Number },
    efficiency: { type: Number },
    qualityGrade: { type: String },
    defects: [String]
  },
  
  // Request Information
  requestInfo: {
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
    sessionId: { type: String },
    requestId: { type: String },
    method: { type: String },
    url: { type: String }
  },
  
  // Additional Data
  metadata: { type: Schema.Types.Mixed },
  
  // Severity and Priority
  severity: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  
  // Timestamps
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  expiresAt: { 
    type: Date,
    index: { expireAfterSeconds: 0 }
  },
  
  // Status
  isRead: { 
    type: Boolean, 
    default: false,
    index: true
  },
  isArchived: { 
    type: Boolean, 
    default: false,
    index: true
  },
  
  // Related Logs
  relatedLogs: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'ProductionLog' 
  }],
  parentLogId: { 
    type: Schema.Types.ObjectId, 
    ref: 'ProductionLog' 
  }
}, {
  timestamps: true,
  collection: 'production_logs'
});

// Indexes for better performance
ProductionLogSchema.index({ logType: 1, productionStage: 1, timestamp: -1 });
ProductionLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
ProductionLogSchema.index({ userId: 1, timestamp: -1 });
ProductionLogSchema.index({ 'statusChange.fromStatus': 1, 'statusChange.toStatus': 1 });
ProductionLogSchema.index({ 'productionData.batchNumber': 1, timestamp: -1 });
ProductionLogSchema.index({ 'productionData.productionOrderNumber': 1, timestamp: -1 });
ProductionLogSchema.index({ severity: 1, priority: 1, timestamp: -1 });
ProductionLogSchema.index({ isRead: 1, isArchived: 1, timestamp: -1 });

// TTL index for automatic cleanup (optional - logs older than 1 year)
ProductionLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

// Static methods for common operations
ProductionLogSchema.statics.createStatusChangeLog = function(data: {
  productionStage: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole?: string;
  fromStatus: string;
  toStatus: string;
  changeReason: string;
  notes?: string;
  duration?: number;
  productionData?: any;
  requestInfo: any;
  metadata?: any;
}) {
  return this.create({
    logType: 'status_change',
    productionStage: data.productionStage,
    action: 'status_changed',
    entityType: data.entityType,
    entityId: data.entityId,
    entityName: data.entityName,
    userId: data.userId,
    userName: data.userName,
    userEmail: data.userEmail,
    userRole: data.userRole,
    statusChange: {
      fromStatus: data.fromStatus,
      toStatus: data.toStatus,
      changeReason: data.changeReason,
      notes: data.notes,
      duration: data.duration
    },
    productionData: data.productionData,
    requestInfo: data.requestInfo,
    metadata: data.metadata,
    severity: 'medium',
    priority: 'medium',
    timestamp: new Date()
  });
};

ProductionLogSchema.statics.createProductionLog = function(data: {
  logType: string;
  productionStage: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole?: string;
  changes?: any[];
  productionData?: any;
  requestInfo: any;
  metadata?: any;
  severity?: string;
  priority?: string;
}) {
  return this.create({
    logType: data.logType,
    productionStage: data.productionStage,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    entityName: data.entityName,
    userId: data.userId,
    userName: data.userName,
    userEmail: data.userEmail,
    userRole: data.userRole,
    changes: data.changes,
    productionData: data.productionData,
    requestInfo: data.requestInfo,
    metadata: data.metadata,
    severity: data.severity || 'medium',
    priority: data.priority || 'medium',
    timestamp: new Date()
  });
};

// Instance methods
ProductionLogSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

ProductionLogSchema.methods.archive = function() {
  this.isArchived = true;
  return this.save();
};

export default mongoose.model<IProductionLog, IProductionLogModel>('ProductionLog', ProductionLogSchema);
