import { Schema, model } from 'mongoose';

// Real-time Production Status
const ProductionStatusSchema = new Schema({
  machineId: { type: Schema.Types.ObjectId, ref: 'Machine' },
  machineName: { type: String, required: true },
  machineType: { type: String, enum: ['printing', 'washing', 'fixing', 'stitching', 'finishing'] },
  currentStatus: { 
    type: String, 
    enum: ['idle', 'running', 'maintenance', 'breakdown', 'setup', 'cleaning'], 
    default: 'idle' 
  },
  currentOrderId: { type: Schema.Types.ObjectId, ref: 'ProductionOrder' },
  currentOrderNumber: { type: String },
  currentProduct: { type: String },
  currentDesign: { type: String },
  currentColor: { type: String },
  currentGSM: { type: Number },
  startTime: { type: Date },
  estimatedEndTime: { type: Date },
  actualEndTime: { type: Date },
  currentQuantity: { type: Number, default: 0 },
  targetQuantity: { type: Number, default: 0 },
  completedQuantity: { type: Number, default: 0 },
  efficiency: { type: Number, min: 0, max: 100 }, // Percentage
  operatorId: { type: Schema.Types.ObjectId, ref: 'User' },
  operatorName: { type: String },
  shift: { type: String, enum: ['morning', 'afternoon', 'night'] },
  lastUpdated: { type: Date, default: Date.now }
}, { _id: false });

// Daily Production Summary
const DailyProductionSummarySchema = new Schema({
  date: { type: Date, required: true },
  firmId: { type: Schema.Types.ObjectId, ref: 'Company' },
  firmName: { type: String, required: true },
  machineId: { type: Schema.Types.ObjectId, ref: 'Machine' },
  machineName: { type: String, required: true },
  machineType: { type: String, enum: ['printing', 'washing', 'fixing', 'stitching', 'finishing'] },
  shift: { type: String, enum: ['morning', 'afternoon', 'night'] },
  
  // Production Metrics
  totalOrders: { type: Number, default: 0 },
  completedOrders: { type: Number, default: 0 },
  pendingOrders: { type: Number, default: 0 },
  totalQuantity: { type: Number, default: 0 },
  completedQuantity: { type: Number, default: 0 },
  pendingQuantity: { type: Number, default: 0 },
  
  // Quality Metrics
  totalProduced: { type: Number, default: 0 },
  approvedQuantity: { type: Number, default: 0 },
  rejectedQuantity: { type: Number, default: 0 },
  reworkQuantity: { type: Number, default: 0 },
  qualityGrade: { type: String, enum: ['A+', 'A', 'B+', 'B', 'C'] },
  
  // Time Metrics
  totalRunTime: { type: Number, default: 0 }, // Minutes
  totalIdleTime: { type: Number, default: 0 }, // Minutes
  totalBreakdownTime: { type: Number, default: 0 }, // Minutes
  totalSetupTime: { type: Number, default: 0 }, // Minutes
  efficiency: { type: Number, min: 0, max: 100 }, // Percentage
  
  // Cost Metrics
  materialCost: { type: Number, default: 0 },
  laborCost: { type: Number, default: 0 },
  machineCost: { type: Number, default: 0 },
  overheadCost: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  costPerUnit: { type: Number, default: 0 },
  
  // Issues & Notes
  issues: [String],
  notes: { type: String },
  supervisorId: { type: Schema.Types.ObjectId, ref: 'User' },
  supervisorName: { type: String },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date }
}, { _id: false });

// Real-time Printing Status
const PrintingStatusSchema = new Schema({
  machineId: { type: Schema.Types.ObjectId, ref: 'Machine' },
  machineName: { type: String, required: true },
  machineType: { type: String, enum: ['table_printing', 'machine_printing', 'digital_printing'] },
  currentStatus: { 
    type: String, 
    enum: ['idle', 'printing', 'setup', 'maintenance', 'breakdown'], 
    default: 'idle' 
  },
  currentOrderId: { type: Schema.Types.ObjectId, ref: 'ProductionOrder' },
  currentOrderNumber: { type: String },
  currentDesign: { type: String },
  currentColor: { type: String },
  currentFabric: { type: String },
  currentGSM: { type: Number },
  startTime: { type: Date },
  estimatedEndTime: { type: Date },
  currentQuantity: { type: Number, default: 0 },
  targetQuantity: { type: Number, default: 0 },
  completedQuantity: { type: Number, default: 0 },
  printingSpeed: { type: Number, min: 0 }, // meters per minute
  qualityCheckRequired: { type: Boolean, default: true },
  operatorId: { type: Schema.Types.ObjectId, ref: 'User' },
  operatorName: { type: String },
  lastUpdated: { type: Date, default: Date.now }
}, { _id: false });

// Production Dashboard Schema
const ProductionDashboardSchema = new Schema({
  companyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true, 
    index: true 
  },
  
  // Real-time Status
  realTimeStatus: [ProductionStatusSchema],
  
  // Daily Summary
  dailySummary: [DailyProductionSummarySchema],
  
  // Printing Status
  printingStatus: [PrintingStatusSchema],
  
  // Dashboard Configuration
  dashboardConfig: {
    refreshInterval: { type: Number, default: 30000 }, // milliseconds
    showEfficiency: { type: Boolean, default: true },
    showQuality: { type: Boolean, default: true },
    showCosts: { type: Boolean, default: true },
    showAlerts: { type: Boolean, default: true },
    alertThresholds: {
      lowEfficiency: { type: Number, default: 70 }, // Percentage
      highRejection: { type: Number, default: 5 }, // Percentage
      overdueOrders: { type: Number, default: 3 } // Days
    }
  },
  
  // Alerts & Notifications
  alerts: [{
    type: { type: String, enum: ['low_efficiency', 'high_rejection', 'overdue_order', 'machine_breakdown', 'quality_issue'] },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    message: { type: String, required: true },
    machineId: { type: Schema.Types.ObjectId, ref: 'Machine' },
    machineName: { type: String },
    orderId: { type: Schema.Types.ObjectId, ref: 'ProductionOrder' },
    orderNumber: { type: String },
    createdAt: { type: Date, default: Date.now },
    isAcknowledged: { type: Boolean, default: false },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    acknowledgedAt: { type: Date },
    isResolved: { type: Boolean, default: false },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    resolutionNotes: { type: String }
  }],
  
  // Performance Metrics
  performanceMetrics: {
    overallEfficiency: { type: Number, min: 0, max: 100, default: 0 },
    totalProduction: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    pendingOrders: { type: Number, default: 0 },
    averageQuality: { type: Number, min: 0, max: 100, default: 0 },
    totalCost: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  
  // Tracking
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
ProductionDashboardSchema.index({ companyId: 1, 'dailySummary.date': -1 });
ProductionDashboardSchema.index({ companyId: 1, 'realTimeStatus.machineId': 1 });
ProductionDashboardSchema.index({ companyId: 1, 'printingStatus.machineId': 1 });
ProductionDashboardSchema.index({ companyId: 1, 'alerts.isResolved': 1, 'alerts.severity': 1 });

// Static methods
ProductionDashboardSchema.statics.findByCompany = function(companyId: string) {
  return this.findOne({ companyId }).sort({ updatedAt: -1 });
};

ProductionDashboardSchema.statics.getMachineStatus = function(companyId: string, machineId: string) {
  return this.findOne(
    { 
      companyId, 
      'realTimeStatus.machineId': machineId 
    },
    { 
      'realTimeStatus.$': 1,
      'printingStatus.$': 1
    }
  );
};

ProductionDashboardSchema.statics.getDailySummary = function(companyId: string, date: Date) {
  return this.findOne(
    { 
      companyId, 
      'dailySummary.date': {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      }
    },
    { dailySummary: 1 }
  );
};

ProductionDashboardSchema.statics.getActiveAlerts = function(companyId: string) {
  return this.findOne(
    { 
      companyId, 
      'alerts.isResolved': false 
    },
    { alerts: 1 }
  ).sort({ 'alerts.createdAt': -1 });
};

// Instance methods
ProductionDashboardSchema.methods.updateMachineStatus = function(machineId: string, status: any) {
  const machineIndex = this.realTimeStatus.findIndex(
    (machine: any) => machine.machineId.toString() === machineId
  );
  
  if (machineIndex !== -1) {
    this.realTimeStatus[machineIndex] = { ...this.realTimeStatus[machineIndex], ...status, lastUpdated: new Date() };
  } else {
    this.realTimeStatus.push({ ...status, machineId, lastUpdated: new Date() });
  }
  
  this.updatedAt = new Date();
  return this.save();
};

ProductionDashboardSchema.methods.addAlert = function(alert: any) {
  this.alerts.push({ ...alert, createdAt: new Date() });
  this.updatedAt = new Date();
  return this.save();
};

ProductionDashboardSchema.methods.acknowledgeAlert = function(alertIndex: number, userId: string) {
  if (this.alerts[alertIndex]) {
    this.alerts[alertIndex].isAcknowledged = true;
    this.alerts[alertIndex].acknowledgedBy = userId;
    this.alerts[alertIndex].acknowledgedAt = new Date();
    this.updatedAt = new Date();
  }
  return this.save();
};

ProductionDashboardSchema.methods.resolveAlert = function(alertIndex: number, userId: string, notes: string) {
  if (this.alerts[alertIndex]) {
    this.alerts[alertIndex].isResolved = true;
    this.alerts[alertIndex].resolvedBy = userId;
    this.alerts[alertIndex].resolvedAt = new Date();
    this.alerts[alertIndex].resolutionNotes = notes;
    this.updatedAt = new Date();
  }
  return this.save();
};

// Pre-save middleware
ProductionDashboardSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const ProductionDashboard = model('ProductionDashboard', ProductionDashboardSchema);
export default ProductionDashboard;
