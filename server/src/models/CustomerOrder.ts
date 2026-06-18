import { Schema, model } from 'mongoose';
import { ICustomerOrder, IOrderItem, IPaymentHistory, IDeliveryAddress, ICommunication } from '@/types/models';

const PaymentHistorySchema = new Schema<IPaymentHistory>({
  paymentDate: { type: Date },
  amount: { type: Number, min: 0 },
  paymentMethod: { type: String },
  referenceNumber: { type: String },
  remarks: { type: String }
}, { _id: false });

const DeliveryAddressSchema = new Schema<IDeliveryAddress>({
  contactPerson: { type: String },
  phone: { type: String },
  email: { type: String },
  addressLine1: { type: String },
  addressLine2: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  country: { type: String, default: 'India' },
  landmark: { type: String }
}, { _id: false });

const CommunicationSchema = new Schema<ICommunication>({
  communicationType: { 
    type: String, 
    enum: ['email', 'phone', 'whatsapp', 'meeting', 'visit'] 
  },
  communicationDate: { type: Date },
  communicatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  subject: { type: String },
  message: { type: String },
  attachments: [String],
  followUpRequired: { type: Boolean, default: false },
  followUpDate: { type: Date }
}, { _id: false });

const OrderItemSchema = new Schema<IOrderItem>({
  itemId: { type: Schema.Types.ObjectId, auto: true },
  productId: { type: Schema.Types.ObjectId, ref: 'InventoryItem' },
  itemName: { type: String, required: true }, // Added itemName field
  productType: { 
    type: String, 
    enum: ['saree', 'african_cotton', 'garment_fabric', 'digital_print', 'custom'], 
    required: true 
  },

  // Product Specifications
  specifications: {
    design: { type: String },
    designCode: { type: String },
    color: { type: String },
    colorCode: { type: String },
    gsm: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    length: { type: Number, min: 0 },
    pattern: { type: String },
    finish: { type: String },
    customRequirements: { type: String },
    sampleApproved: { type: Boolean, default: false },
    sampleImages: [String]
  },

  // Quantity & Pricing
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, required: true },
  rate: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  discountAmount: { type: Number, default: 0, min: 0 },
  taxRate: { type: Number, default: 0, min: 0, max: 100 },
  taxAmount: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, min: 0 },

  // Production & Status
  productionOrderId: { type: Schema.Types.ObjectId, ref: 'ProductionOrder' },
  productionStatus: { 
    type: String, 
    enum: ['pending', 'in_production', 'completed', 'quality_check', 'ready', 'dispatched'], 
    default: 'pending' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'in_production', 'ready', 'dispatched', 'delivered', 'cancelled', 'returned'], 
    default: 'pending' 
  },

  // Delivery
  expectedDeliveryDate: { type: Date },
  actualDeliveryDate: { type: Date },
  deliveryPriority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },

  // Quality Requirements
  qualityRequirements: {
    qualityGrade: { type: String },
    specialTests: [String],
    packingRequirements: { type: String },
    labelingRequirements: { type: String }
  },

  // Material Source Management
  materialSource: { 
    type: String, 
    enum: ['own_stock', 'client_provided', 'job_work', 'purchase_required'], 
    default: 'own_stock' 
  },
  workAmount: { type: Number, default: 0, min: 0 }, // Processing/work charges

  notes: { type: String }
});

const ApprovalSchema = new Schema({
  level: { type: Number, default: 1 },
  approverRole: { type: String },
  approverId: { type: Schema.Types.ObjectId, ref: 'User' },
  approverName: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedAt: { type: Date },
  remarks: { type: String }
}, { _id: false });

const CustomerOrderSchema = new Schema<ICustomerOrder>({
  companyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true, 
    index: true 
  },

  // Order Identification
  orderNumber: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  orderDate: { 
    type: Date, 
    required: true, 
    default: Date.now, 
    index: true 
  },

  // Customer Information
  customerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: true, 
    index: true 
  },
  customerName: { type: String },
  customerCode: { type: String },

  // Order Classification
  orderType: { 
    type: String, 
    enum: ['local', 'export', 'custom', 'sample', 'bulk', 'repeat'], 
    required: true,
    index: true
  },
  orderSource: { 
    type: String, 
    enum: ['direct', 'meesho', 'indiamart', 'website', 'phone', 'email', 'whatsapp', 'exhibition'], 
    required: true,
    index: true
  },

  // Order Items
  orderItems: [OrderItemSchema],

  // Financial Summary
  orderSummary: {
    subtotal: { type: Number, min: 0 },
    totalDiscount: { type: Number, default: 0, min: 0 },
    totalTax: { type: Number, min: 0 },
    shippingCharges: { type: Number, default: 0, min: 0 },
    packingCharges: { type: Number, default: 0, min: 0 },
    otherCharges: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, min: 0 },
    roundOffAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, min: 0 }
  },

  // Payment Management
  payment: {
    paymentTerms: { type: String },
    paymentMethod: { 
      type: String, 
      enum: ['cash', 'bank_transfer', 'cheque', 'upi', 'card', 'credit'], 
      default: 'bank_transfer' 
    },
    creditDays: { type: Number, default: 0, min: 0 },
    advancePercentage: { type: Number, default: 0, min: 0, max: 100 },
    advanceAmount: { type: Number, default: 0, min: 0 },
    advanceReceived: { type: Number, default: 0, min: 0 },
    balanceAmount: { type: Number, min: 0 },
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'advance_received', 'partial', 'paid', 'overdue'], 
      default: 'pending',
      index: true
    },
    dueDate: { type: Date },
    paymentHistory: [PaymentHistorySchema],
    
    // Enhanced Payment Tracking
    paymentSummary: {
      totalAmount: { type: Number, min: 0 },
      totalReceived: { type: Number, default: 0, min: 0 },
      totalPending: { type: Number, min: 0 },
      totalOverdue: { type: Number, default: 0, min: 0 },
      lastPaymentDate: { type: Date },
      nextPaymentDue: { type: Date },
      overdueDays: { type: Number, default: 0, min: 0 }
    },
    
    // Payment Alerts
    paymentAlerts: {
      isOverdue: { type: Boolean, default: false },
      overdueAmount: { type: Number, default: 0, min: 0 },
      overdueDays: { type: Number, default: 0, min: 0 },
      lastAlertSent: { type: Date },
      alertFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
      nextAlertDate: { type: Date }
    },
    
    // Collection Management
    collection: {
      assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
      collectionNotes: [String],
      followUpRequired: { type: Boolean, default: false },
      followUpDate: { type: Date },
      collectionStatus: { type: String, enum: ['active', 'on_hold', 'escalated', 'legal_action'], default: 'active' }
    }
  },

  // Delivery Management (spec: estimated delivery duration-based only — 1 week, 2 weeks, 1 month, 2 months)
  delivery: {
    deliveryType: { type: String, enum: ['pickup', 'delivery', 'courier'], default: 'delivery' },
    deliveryAddress: DeliveryAddressSchema,
    expectedDeliveryDuration: { type: String, enum: ['1_week', '2_weeks', '1_month', '2_months'] },
    expectedDeliveryDate: { type: Date },
    actualDeliveryDate: { type: Date },
    deliveryInstructions: { type: String },
    courierPreference: { type: String },
    shippingDetails: {
      courierCompany: { type: String },
      awbNumber: { type: String },
      trackingUrl: { type: String },
      shippingCost: { type: Number, min: 0 },
      estimatedDelivery: { type: Date }
    }
  },

  // Priority & Status
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent', 'rush'], 
    default: 'medium',
    index: true
  },
  status: { 
    type: String, 
    enum: ['draft', 'confirmed', 'in_production', 'ready_to_dispatch', 'dispatched', 'delivered', 'completed', 'cancelled', 'returned'], 
    default: 'draft',
    index: true
  },

  // Workflow & Communication
  approvals: [ApprovalSchema],
  communications: [CommunicationSchema],

  // Instructions & Requirements
  specialInstructions: { type: String },
  packingInstructions: { type: String },
  qualityInstructions: { type: String },
  deliveryInstructions: { type: String },

  // Sales Information
  salesPerson: {
    salesPersonId: { type: Schema.Types.ObjectId, ref: 'User' },
    salesPersonName: { type: String },
    commission: { type: Number, min: 0 },
    commissionPercentage: { type: Number, min: 0, max: 100 }
  },

  // Business Intelligence
  referenceOrders: [{ type: Schema.Types.ObjectId, ref: 'CustomerOrder' }],
  seasonality: { type: String },
  marketSegment: { type: String },

  // Additional Information
  notes: { type: String },
  tags: [String],
  attachments: [String],

  // Tracking
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },

  // Status Timestamps
  confirmedAt: { type: Date },
  productionStartedAt: { type: Date },
  completedAt: { type: Date },
  dispatchedAt: { type: Date },
  deliveredAt: { type: Date },
  cancelledAt: { type: Date },
  cancellationReason: { type: String }
}, {
  timestamps: true,
  collection: 'customer_orders'
});

// Compound Indexes for optimal performance
CustomerOrderSchema.index({ companyId: 1, orderDate: -1 });
CustomerOrderSchema.index({ companyId: 1, customerId: 1, orderDate: -1 });
CustomerOrderSchema.index({ companyId: 1, status: 1, priority: 1 });
CustomerOrderSchema.index({ companyId: 1, orderType: 1, orderSource: 1 });
CustomerOrderSchema.index({ companyId: 1, 'payment.paymentStatus': 1 });
CustomerOrderSchema.index({ 'payment.dueDate': 1, 'payment.paymentStatus': 1 });
CustomerOrderSchema.index({ 'delivery.expectedDeliveryDate': 1, status: 1 });

// Text search index
CustomerOrderSchema.index({ 
  orderNumber: 'text', 
  customerName: 'text',
  'orderItems.specifications.design': 'text',
  'orderItems.specifications.color': 'text'
});

// Pre-save middleware
CustomerOrderSchema.pre('save', function(next) {
  // Calculate order summary
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  this.orderItems.forEach(item => {
    const itemTotal = item.quantity * item.rate;
    const discountAmount = (itemTotal * item.discount) / 100;
    const taxableAmount = itemTotal - discountAmount;
    const taxAmount = (taxableAmount * item.taxRate) / 100;
    
    item.discountAmount = discountAmount;
    item.taxAmount = taxAmount;
    item.totalAmount = taxableAmount + taxAmount;
    
    subtotal += itemTotal;
    totalDiscount += discountAmount;
    totalTax += taxAmount;
  });

  this.orderSummary.subtotal = subtotal;
  this.orderSummary.totalDiscount = totalDiscount;
  this.orderSummary.totalTax = totalTax;
  
  this.orderSummary.totalAmount = 
    subtotal - 
    totalDiscount + 
    totalTax + 
    this.orderSummary.shippingCharges + 
    this.orderSummary.packingCharges + 
    this.orderSummary.otherCharges;
  
  this.orderSummary.finalAmount = this.orderSummary.totalAmount + this.orderSummary.roundOffAmount;
  
  // Calculate balance amount
  this.payment.balanceAmount = this.orderSummary.finalAmount - this.payment.advanceReceived;
  
  // Set due date if credit days are specified
  if (this.payment.creditDays > 0 && !this.payment.dueDate) {
    this.payment.dueDate = new Date(this.orderDate.getTime() + (this.payment.creditDays * 24 * 60 * 60 * 1000));
  }
  
  next();
});

// Instance methods
CustomerOrderSchema.methods.isOverdue = function(): boolean {
  if (!this.payment.dueDate) return false;
  return new Date() > this.payment.dueDate && this.payment.paymentStatus !== 'paid';
};

CustomerOrderSchema.methods.getCompletionPercentage = function(): number {
  const totalItems = this.orderItems.length;
  if (totalItems === 0) return 0;
  
  const completedItems = this.orderItems.filter(item => 
    ['ready', 'dispatched', 'delivered'].includes(item.status)
  ).length;
  
  return (completedItems / totalItems) * 100;
};

CustomerOrderSchema.methods.getTotalQuantity = function(): number {
  return this.orderItems.reduce((total, item) => total + item.quantity, 0);
};

CustomerOrderSchema.methods.addPayment = function(amount: number, method: string, reference?: string) {
  this.payment.paymentHistory.push({
    paymentDate: new Date(),
    amount,
    paymentMethod: method,
    referenceNumber: reference,
    remarks: `Payment of ${amount} received via ${method}`
  });
  
  this.payment.advanceReceived += amount;
  this.payment.balanceAmount = Math.max(0, this.payment.balanceAmount - amount);
  
  // Update payment status
  if (this.payment.balanceAmount === 0) {
    this.payment.paymentStatus = 'paid';
  } else if (this.payment.advanceReceived > 0) {
    this.payment.paymentStatus = 'partial';
  }
};

// Static methods
CustomerOrderSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId }).sort({ orderDate: -1 });
};

CustomerOrderSchema.statics.findByCustomer = function(companyId: string, customerId: string) {
  return this.find({ companyId, customerId }).sort({ orderDate: -1 });
};

CustomerOrderSchema.statics.findOverdue = function(companyId: string) {
  return this.find({
    companyId,
    'payment.dueDate': { $lt: new Date() },
    'payment.paymentStatus': { $nin: ['paid'] }
  }).sort({ 'payment.dueDate': 1 });
};

CustomerOrderSchema.statics.findByStatus = function(companyId: string, status: string) {
  return this.find({ companyId, status }).sort({ orderDate: -1 });
};

CustomerOrderSchema.statics.getOrderStats = function(companyId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        companyId: new Schema.Types.ObjectId(companyId),
        orderDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$orderSummary.finalAmount' },
        avgValue: { $avg: '$orderSummary.finalAmount' }
      }
    }
  ]);
};

export default model<ICustomerOrder>('CustomerOrder', CustomerOrderSchema);
