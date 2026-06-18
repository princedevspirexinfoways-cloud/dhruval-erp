import { Schema, model } from 'mongoose';
import { IInvoice, IInvoiceItem, ITaxBreakup, IPaymentTerm } from '@/types/models';

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  itemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  itemCode: { type: String, required: true },
  itemName: { type: String, required: true },
  description: { type: String },
  hsnCode: { type: String },
  sacCode: { type: String },
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
    taxType: { type: String, enum: ['CGST', 'SGST', 'IGST', 'CESS', 'TDS', 'TCS'], required: true },
    rate: { type: Number, required: true, min: 0, max: 100 },
    amount: { type: Number, required: true, min: 0 }
  }],
  totalTaxAmount: { type: Number, default: 0, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 },
  notes: { type: String }
}, { _id: false });

const PaymentTermSchema = new Schema<IPaymentTerm>({
  termType: { type: String, enum: ['immediate', 'net', 'eom', 'custom'], required: true },
  days: { type: Number, default: 0, min: 0 },
  description: { type: String },
  dueDate: { type: Date },
  earlyPaymentDiscount: {
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    days: { type: Number, default: 0, min: 0 }
  }
}, { _id: false });

const InvoiceSchema = new Schema<IInvoice>({
  companyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true, 
    index: true 
  },

  // Invoice Identification
  invoiceNumber: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true
  },
  invoiceDate: { 
    type: Date, 
    required: true, 
    default: Date.now,
    index: true
  },
  dueDate: { type: Date, required: true },
  financialYear: { 
    type: String, 
    required: true,
    index: true
  },

  // Invoice Type & Category
  invoiceType: {
    type: String,
    enum: ['sales', 'service', 'proforma', 'credit_note', 'debit_note', 'advance', 'final'],
    required: true,
    index: true
  },
  invoiceCategory: {
    type: String,
    enum: ['b2b', 'b2c', 'export', 'import', 'sez', 'deemed_export'],
    required: true
  },
  isReverseCharge: { type: Boolean, default: false },
  placeOfSupply: { type: String, required: true },

  // Customer Information
  customer: {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    customerCode: { type: String, required: true },
    customerName: { type: String, required: true },
    gstin: { type: String },
    pan: { type: String },
    billingAddress: {
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' }
    },
    shippingAddress: {
      addressLine1: { type: String },
      addressLine2: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      country: { type: String, default: 'India' }
    },
    contactPerson: { type: String },
    phone: { type: String },
    email: { type: String }
  },

  // Reference Documents
  references: {
    salesOrderId: { type: Schema.Types.ObjectId, ref: 'CustomerOrder' },
    salesOrderNumber: { type: String },
    quotationId: { type: Schema.Types.ObjectId, ref: 'Quotation' },
    quotationNumber: { type: String },
    deliveryNoteNumber: { type: String },
    purchaseOrderNumber: { type: String },
    purchaseOrderDate: { type: Date },
    dispatchDocumentNumber: { type: String },
    dispatchedThrough: { type: String },
    destination: { type: String },
    vehicleNumber: { type: String },
    lrNumber: { type: String },
    lrDate: { type: Date }
  },

  // Invoice Items
  items: [InvoiceItemSchema],

  // Amount Calculations (spec: transport/packing/other charges, round-off)
  amounts: {
    subtotal: { type: Number, required: true, min: 0 },
    totalDiscount: { type: Number, default: 0, min: 0 },
    taxableAmount: { type: Number, required: true, min: 0 },
    totalTaxAmount: { type: Number, default: 0, min: 0 },
    transportCharges: { type: Number, default: 0, min: 0 },
    packingCharges: { type: Number, default: 0, min: 0 },
    otherCharges: { type: Number, default: 0, min: 0 },
    roundingAdjustment: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    advanceReceived: { type: Number, default: 0, min: 0 },
    balanceAmount: { type: Number, required: true, min: 0 }
  },

  // Tax Information
  taxDetails: {
    taxBreakup: [{
      taxType: { type: String, enum: ['CGST', 'SGST', 'IGST', 'CESS', 'TDS', 'TCS'], required: true },
      rate: { type: Number, required: true, min: 0, max: 100 },
      taxableAmount: { type: Number, required: true, min: 0 },
      taxAmount: { type: Number, required: true, min: 0 }
    }],
    totalTaxAmount: { type: Number, default: 0, min: 0 },
    tdsAmount: { type: Number, default: 0, min: 0 },
    tcsAmount: { type: Number, default: 0, min: 0 }
  },

  // Payment Information
  paymentTerms: PaymentTermSchema,
  paymentMethod: {
    type: String,
    enum: ['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'credit', 'mixed'],
    default: 'credit'
  },
  bankDetails: {
    bankName: { type: String },
    branchName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    accountHolderName: { type: String }
  },

  // Status & Workflow
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled', 'refunded'],
    default: 'draft',
    index: true
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  sentAt: { type: Date },
  sentBy: { type: Schema.Types.ObjectId, ref: 'User' },

  // Payment Tracking
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partially_paid', 'paid', 'overdue', 'refunded'],
    default: 'unpaid',
    index: true
  },
  paidAmount: { type: Number, default: 0, min: 0 },
  outstandingAmount: { type: Number, default: 0, min: 0 },
  lastPaymentDate: { type: Date },
  paymentHistory: [{
    paymentId: { type: Schema.Types.ObjectId, ref: 'FinancialTransaction' },
    paymentDate: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, required: true },
    reference: { type: String },
    notes: { type: String }
  }],

  // E-Invoice Details (for GST compliance)
  eInvoice: {
    isEInvoiceApplicable: { type: Boolean, default: false },
    irn: { type: String }, // Invoice Reference Number
    ackNumber: { type: String },
    ackDate: { type: Date },
    qrCode: { type: String },
    signedInvoice: { type: String },
    signedQrCode: { type: String },
    status: { type: String, enum: ['pending', 'generated', 'cancelled'], default: 'pending' },
    errorMessage: { type: String }
  },

  // E-Way Bill Details
  eWayBill: {
    isEWayBillRequired: { type: Boolean, default: false },
    eWayBillNumber: { type: String },
    generatedDate: { type: Date },
    validUntil: { type: Date },
    vehicleNumber: { type: String },
    transporterId: { type: String },
    transporterName: { type: String },
    distance: { type: Number, min: 0 },
    status: { type: String, enum: ['pending', 'generated', 'cancelled'], default: 'pending' }
  },

  // Additional Information
  terms: { type: String },
  notes: { type: String },
  internalNotes: { type: String },
  tags: [String],
  customFields: { type: Schema.Types.Mixed },
  attachments: [String], // URLs to documents, images, etc.

  // Tracking & Audit
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  salesPersonId: { type: Schema.Types.ObjectId, ref: 'User' },
  salesPersonName: { type: String },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'invoices'
});

// Compound Indexes for optimal performance
InvoiceSchema.index({ companyId: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ companyId: 1, invoiceDate: -1 });
InvoiceSchema.index({ companyId: 1, 'customer.customerId': 1, invoiceDate: -1 });
InvoiceSchema.index({ companyId: 1, status: 1, invoiceDate: -1 });
InvoiceSchema.index({ companyId: 1, paymentStatus: 1, dueDate: 1 });
InvoiceSchema.index({ companyId: 1, financialYear: 1 });
InvoiceSchema.index({ dueDate: 1, paymentStatus: 1 }); // For overdue invoices

// Text search index
InvoiceSchema.index({ 
  invoiceNumber: 'text', 
  'customer.customerName': 'text',
  'customer.customerCode': 'text'
});

// Pre-save middleware
InvoiceSchema.pre('save', function(next) {
  // Set financial year based on invoice date
  if (!this.financialYear) {
    const invoiceYear = this.invoiceDate.getFullYear();
    const invoiceMonth = this.invoiceDate.getMonth() + 1; // 0-based month
    
    if (invoiceMonth >= 4) {
      this.financialYear = `${invoiceYear}-${invoiceYear + 1}`;
    } else {
      this.financialYear = `${invoiceYear - 1}-${invoiceYear}`;
    }
  }
  
  // Calculate outstanding amount
  this.outstandingAmount = this.amounts.grandTotal - this.paidAmount;
  
  // Update payment status based on amounts
  if (this.paidAmount === 0) {
    this.paymentStatus = 'unpaid';
  } else if (this.paidAmount >= this.amounts.grandTotal) {
    this.paymentStatus = 'paid';
  } else {
    this.paymentStatus = 'partially_paid';
  }
  
  // Check for overdue status
  if (this.paymentStatus !== 'paid' && this.dueDate < new Date()) {
    this.paymentStatus = 'overdue';
  }
  
  // Set shipping address same as billing if not provided
  if (!this.customer.shippingAddress.addressLine1) {
    this.customer.shippingAddress = this.customer.billingAddress;
  }
  
  next();
});

// Instance methods
InvoiceSchema.methods.isOverdue = function(): boolean {
  return this.paymentStatus === 'overdue' || 
         (this.paymentStatus !== 'paid' && this.dueDate < new Date());
};

InvoiceSchema.methods.getDaysOverdue = function(): number {
  if (!this.isOverdue()) return 0;
  const today = new Date();
  const diffTime = today.getTime() - this.dueDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

InvoiceSchema.methods.addPayment = function(paymentData: any) {
  this.paymentHistory.push({
    paymentDate: paymentData.paymentDate || new Date(),
    amount: paymentData.amount,
    paymentMethod: paymentData.paymentMethod,
    reference: paymentData.reference,
    notes: paymentData.notes
  });
  
  this.paidAmount += paymentData.amount;
  this.lastPaymentDate = paymentData.paymentDate || new Date();
  
  return this.save();
};

InvoiceSchema.methods.calculateTotals = function() {
  // Calculate subtotal
  this.amounts.subtotal = this.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  
  // Calculate total discount
  this.amounts.totalDiscount = this.items.reduce((sum, item) => sum + item.discountAmount, 0);
  
  // Calculate taxable amount
  this.amounts.taxableAmount = this.amounts.subtotal - this.amounts.totalDiscount;
  
  // Calculate total tax
  this.amounts.totalTaxAmount = this.items.reduce((sum, item) => sum + item.totalTaxAmount, 0);
  
  // Calculate grand total
  this.amounts.grandTotal = this.amounts.taxableAmount + this.amounts.totalTaxAmount + this.amounts.roundingAdjustment;
  
  // Calculate balance amount
  this.amounts.balanceAmount = this.amounts.grandTotal - this.amounts.advanceReceived;
  
  return this;
};

// Static methods
InvoiceSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId, isActive: true }).sort({ invoiceDate: -1 });
};

InvoiceSchema.statics.findOverdueInvoices = function(companyId: string) {
  return this.find({
    companyId,
    paymentStatus: { $in: ['unpaid', 'partially_paid'] },
    dueDate: { $lt: new Date() },
    isActive: true
  }).sort({ dueDate: 1 });
};

InvoiceSchema.statics.findByCustomer = function(companyId: string, customerId: string) {
  return this.find({
    companyId,
    'customer.customerId': customerId,
    isActive: true
  }).sort({ invoiceDate: -1 });
};

InvoiceSchema.statics.getInvoiceStats = function(companyId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        companyId: new Schema.Types.ObjectId(companyId),
        invoiceDate: { $gte: startDate, $lte: endDate },
        isActive: true
      }
    },
    {
      $group: {
        _id: {
          status: '$status',
          paymentStatus: '$paymentStatus'
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amounts.grandTotal' },
        paidAmount: { $sum: '$paidAmount' },
        outstandingAmount: { $sum: '$outstandingAmount' }
      }
    }
  ]);
};

export default model<IInvoice>('Invoice', InvoiceSchema);
