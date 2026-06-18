import { Schema, model, Query } from 'mongoose';
import { IPurchaseOrder, IPurchaseOrderItem, IDeliverySchedule } from '@/types/models';

const PurchaseOrderItemSchema = new Schema<IPurchaseOrderItem>({
  itemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  itemCode: { type: String, required: true },
  itemName: { type: String, required: true },
  description: { type: String },
  specifications: { type: String },
  hsnCode: { type: String },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true },
  rate: { type: Number, required: true, min: 0 },
  discount: {
    type: { type: String, enum: ['percentage', 'amount'], default: 'percentage' },
    value: { type: Number, default: 0, min: 0 }
  },
  discountAmount: { type: Number, default: 0, min: 0 },
  taxableAmount: { type: Number, required: true, min: 0 },
  taxBreakup: [{
    taxType: { type: String, enum: ['CGST', 'SGST', 'IGST', 'CESS'], required: true },
    rate: { type: Number, required: true, min: 0, max: 100 },
    amount: { type: Number, required: true, min: 0 }
  }],
  totalTaxAmount: { type: Number, default: 0, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 },
  receivedQuantity: { type: Number, default: 0, min: 0 },
  pendingQuantity: { type: Number, default: 0, min: 0 },
  rejectedQuantity: { type: Number, default: 0, min: 0 },
  deliveryDate: { type: Date },
  notes: { type: String }
}, { _id: false });

const DeliveryScheduleSchema = new Schema<IDeliverySchedule>({
  scheduleNumber: { type: String, required: true },
  deliveryDate: { type: Date, required: true },
  items: [{
    itemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    quantity: { type: Number, required: true, min: 0 },
    deliveredQuantity: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['pending', 'partial', 'delivered', 'delayed'], default: 'pending' }
  }],
  deliveryAddress: {
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },
  contactPerson: { type: String },
  contactPhone: { type: String },
  specialInstructions: { type: String },
  status: { type: String, enum: ['scheduled', 'in_transit', 'delivered', 'delayed', 'cancelled'], default: 'scheduled' },
  actualDeliveryDate: { type: Date },
  deliveryNoteNumber: { type: String },
  transportDetails: {
    transporterName: { type: String },
    vehicleNumber: { type: String },
    driverName: { type: String },
    driverPhone: { type: String },
    lrNumber: { type: String },
    trackingNumber: { type: String }
  },
  notes: { type: String }
}, { _id: false });

const PurchaseOrderSchema = new Schema<IPurchaseOrder>({
  companyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true, 
    index: true 
  },

  // Purchase Order Identification
  poNumber: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true
  },
  poDate: { 
    type: Date, 
    required: true, 
    default: Date.now,
    index: true
  },
  expectedDeliveryDate: { type: Date, required: true },
  financialYear: { 
    type: String, 
    required: true,
    index: true
  },

  // Purchase Order Type & Category
  poType: {
    type: String,
    enum: ['standard', 'blanket', 'contract', 'planned', 'emergency', 'service', 'capital'],
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  category: {
    type: String,
    enum: ['raw_material', 'finished_goods', 'consumables', 'services', 'capital_goods', 'maintenance'],
    required: true
  },

  // Supplier Information (Optional - can have either supplier OR agent)
  supplier: {
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: false, index: true },
    supplierCode: { type: String, required: false },
    supplierName: { type: String, required: false },
    gstin: { type: String },
    pan: { type: String },
    contactPerson: { type: String },
    phone: { type: String },
    email: { type: String },
    address: {
      addressLine1: { type: String, required: false },
      addressLine2: { type: String },
      city: { type: String, required: false },
      state: { type: String, required: false },
      pincode: { type: String, required: false },
      country: { type: String, default: 'India' }
    }
  },

  // Agent Information (PO Level)
  agent: {
    agentId: { type: Schema.Types.ObjectId, ref: 'Agent' },
    agentCode: { type: String },
    agentName: { type: String },
    agentContactNumber: { type: String }
  },

  // Delivery Information
  deliveryInfo: {
    deliveryAddress: {
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' }
    },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    warehouseName: { type: String },
    contactPerson: { type: String, required: true },
    contactPhone: { type: String, required: true },
    deliveryInstructions: { type: String },
    workingHours: { type: String },
    deliveryType: { type: String, enum: ['standard', 'express', 'scheduled'], default: 'standard' }
  },

  // Reference Documents
  references: {
    requisitionId: { type: Schema.Types.ObjectId, ref: 'PurchaseRequisition' },
    requisitionNumber: { type: String },
    quotationId: { type: Schema.Types.ObjectId, ref: 'Quotation' },
    quotationNumber: { type: String },
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract' },
    contractNumber: { type: String },
    budgetCode: { type: String },
    projectCode: { type: String },
    costCenter: { type: String }
  },

  // Purchase Order Items
  items: [PurchaseOrderItemSchema],

  // Amount Calculations
  amounts: {
    subtotal: { type: Number, required: true, min: 0 },
    totalDiscount: { type: Number, default: 0, min: 0 },
    taxableAmount: { type: Number, required: true, min: 0 },
    totalTaxAmount: { type: Number, default: 0, min: 0 },
    freightCharges: { type: Number, default: 0, min: 0 },
    packingCharges: { type: Number, default: 0, min: 0 },
    otherCharges: { type: Number, default: 0, min: 0 },
    roundingAdjustment: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, min: 0 }
  },

  // Tax Information
  taxDetails: {
    placeOfSupply: { type: String, required: true },
    isReverseCharge: { type: Boolean, default: false },
    taxBreakup: [{
      taxType: { type: String, enum: ['CGST', 'SGST', 'IGST', 'CESS'], required: true },
      rate: { type: Number, required: true, min: 0, max: 100 },
      taxableAmount: { type: Number, required: true, min: 0 },
      taxAmount: { type: Number, required: true, min: 0 }
    }],
    totalTaxAmount: { type: Number, default: 0, min: 0 }
  },

  // Payment Terms
  paymentTerms: {
    termType: { type: String, enum: ['advance', 'net', 'cod', 'credit', 'milestone'], required: true },
    days: { type: Number, default: 0, min: 0 },
    advancePercentage: { type: Number, default: 0, min: 0, max: 100 },
    description: { type: String },
    milestones: [{
      milestone: { type: String },
      percentage: { type: Number, min: 0, max: 100 },
      amount: { type: Number, min: 0 },
      dueDate: { type: Date }
    }]
  },

  // Payment Status
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending',
    index: true
  },
  lastPaymentDate: { type: Date },
  lastPaymentAmount: { type: Number, default: 0, min: 0 },

  // Delivery Schedules (for multiple deliveries)
  deliverySchedules: [DeliveryScheduleSchema],

  // Status & Workflow
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'ordered', 'partial', 'received', 'cancelled', 'pending_approval', 'sent', 'acknowledged', 'in_progress', 'partially_received', 'completed', 'closed'],
    default: 'draft',
    index: true
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvalWorkflow: [{
    level: { type: Number, required: true },
    approverRole: { type: String, required: true },
    approverId: { type: Schema.Types.ObjectId, ref: 'User' },
    approverName: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    comments: { type: String }
  }],
  sentAt: { type: Date },
  sentBy: { type: Schema.Types.ObjectId, ref: 'User' },
  acknowledgedAt: { type: Date },
  acknowledgedBy: { type: String }, // Supplier acknowledgment
  
  // Status-specific timestamps
  approvedAt: { type: Date },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  orderedAt: { type: Date },
  orderedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  receivedAt: { type: Date },
  receivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  cancelledAt: { type: Date },
  cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },

  // Receiving Status
  receivingStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed', 'over_received'],
    default: 'pending',
    index: true
  },
  totalReceived: { type: Number, default: 0, min: 0 },
  totalPending: { type: Number, default: 0, min: 0 },
  lastReceivedDate: { type: Date },

  // Quality & Inspection
  qualityRequirements: {
    inspectionRequired: { type: Boolean, default: false },
    qualityParameters: [String],
    acceptanceCriteria: { type: String },
    inspectionLocation: { type: String, enum: ['supplier', 'incoming', 'third_party'] },
    qualityCertificates: [String],
    testReports: [String]
  },

  // Performance Tracking
  performance: {
    onTimeDelivery: { type: Boolean },
    qualityRating: { type: Number, min: 1, max: 5 },
    supplierRating: { type: Number, min: 1, max: 5 },
    deliveryRating: { type: Number, min: 1, max: 5 },
    overallRating: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
    issues: [String],
    improvements: [String]
  },

  // Additional Information
  terms: { type: String },
  notes: { type: String },
  paymentNotes: { type: String },
  internalNotes: { type: String },
  specialInstructions: { type: String },
  tags: [String],
  customFields: { type: Schema.Types.Mixed },
  attachments: [String], // URLs to documents, images, etc.

  // Tracking & Audit
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  buyerId: { type: Schema.Types.ObjectId, ref: 'User' },
  buyerName: { type: String },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
  departmentName: { type: String },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'purchase_orders'
});

// Compound Indexes for optimal performance
PurchaseOrderSchema.index({ companyId: 1, poNumber: 1 }, { unique: true });
PurchaseOrderSchema.index({ companyId: 1, poDate: -1 });
PurchaseOrderSchema.index({ companyId: 1, 'supplier.supplierId': 1, poDate: -1 });
PurchaseOrderSchema.index({ companyId: 1, status: 1, poDate: -1 });
PurchaseOrderSchema.index({ companyId: 1, receivingStatus: 1, expectedDeliveryDate: 1 });
PurchaseOrderSchema.index({ companyId: 1, financialYear: 1 });
PurchaseOrderSchema.index({ expectedDeliveryDate: 1, status: 1 }); // For overdue POs

// Text search index
PurchaseOrderSchema.index({ 
  poNumber: 'text', 
  'supplier.supplierName': 'text',
  'supplier.supplierCode': 'text'
});

// Pre-save middleware
PurchaseOrderSchema.pre<IPurchaseOrder>('save', function(next) {
  // Set financial year based on PO date
  if (!this.financialYear) {
    const poYear = this.poDate.getFullYear();
    const poMonth = this.poDate.getMonth() + 1; // 0-based month
    
    if (poMonth >= 4) {
      this.financialYear = `${poYear}-${poYear + 1}`;
    } else {
      this.financialYear = `${poYear - 1}-${poYear}`;
    }
  }
  
  // Calculate pending quantities for each item
  this.items.forEach(item => {
    item.pendingQuantity = item.quantity - item.receivedQuantity - item.rejectedQuantity;
  });
  
  // Calculate total pending quantity
  this.totalPending = this.items.reduce((sum, item) => sum + item.pendingQuantity, 0);
  this.totalReceived = this.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
  
  // Update receiving status
  if (this.totalReceived === 0) {
    this.receivingStatus = 'pending';
  } else if (this.totalPending > 0) {
    this.receivingStatus = 'partial';
  } else {
    this.receivingStatus = 'completed';
  }
  
  next();
});

// Instance methods
PurchaseOrderSchema.methods.isOverdue = function(this: IPurchaseOrder): boolean {
  return this.status !== 'completed' && 
         this.status !== 'cancelled' && 
         this.expectedDeliveryDate < new Date();
};

PurchaseOrderSchema.methods.getDaysOverdue = function(this: IPurchaseOrder): number {
  if (!this.isOverdue()) return 0;
  const today = new Date();
  const diffTime = today.getTime() - this.expectedDeliveryDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

PurchaseOrderSchema.methods.calculateTotals = function(this: IPurchaseOrder) {
  // Calculate subtotal
  this.amounts.subtotal = this.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  
  // Calculate total discount
  this.amounts.totalDiscount = this.items.reduce((sum, item) => sum + item.discountAmount, 0);
  
  // Calculate taxable amount
  this.amounts.taxableAmount = this.amounts.subtotal - this.amounts.totalDiscount;
  
  // Calculate total tax
  this.amounts.totalTaxAmount = this.items.reduce((sum, item) => sum + item.totalTaxAmount, 0);
  
  // Calculate grand total
  this.amounts.grandTotal = this.amounts.taxableAmount + 
                           this.amounts.totalTaxAmount + 
                           this.amounts.freightCharges + 
                           this.amounts.packingCharges + 
                           this.amounts.otherCharges + 
                           this.amounts.roundingAdjustment;
  
  return this;
};

PurchaseOrderSchema.methods.addReceiving = function(this: IPurchaseOrder, itemId: string, receivedQuantity: number, rejectedQuantity: number = 0) {
  const item = this.items.find(item => item.itemId.toString() === itemId);
  if (item) {
    item.receivedQuantity += receivedQuantity;
    item.rejectedQuantity += rejectedQuantity;
    this.lastReceivedDate = new Date();
  }
  return this.save();
};

// Static methods
PurchaseOrderSchema.statics.findByCompany = function(companyId: string): Query<IPurchaseOrder[], IPurchaseOrder> {
  return this.find({ companyId, isActive: true }).sort({ poDate: -1 });
};

PurchaseOrderSchema.statics.findOverduePOs = function(companyId: string): Query<IPurchaseOrder[], IPurchaseOrder> {
  return this.find({
    companyId,
    status: { $nin: ['completed', 'cancelled', 'closed'] },
    expectedDeliveryDate: { $lt: new Date() },
    isActive: true
  }).sort({ expectedDeliveryDate: 1 });
};

PurchaseOrderSchema.statics.findBySupplier = function(companyId: string, supplierId: string): Query<IPurchaseOrder[], IPurchaseOrder> {
  return this.find({
    companyId,
    'supplier.supplierId': supplierId,
    isActive: true
  }).sort({ poDate: -1 });
};

PurchaseOrderSchema.statics.getPOStats = function(companyId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        companyId: new Schema.Types.ObjectId(companyId),
        poDate: { $gte: startDate, $lte: endDate },
        isActive: true
      }
    },
    {
      $group: {
        _id: {
          status: '$status',
          receivingStatus: '$receivingStatus'
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amounts.grandTotal' },
        avgAmount: { $avg: '$amounts.grandTotal' }
      }
    }
  ]);
};

export default model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
