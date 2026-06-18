import { Schema, model } from 'mongoose';
import { IFinancialTransaction } from '@/types/models';

const TaxBreakupSchema = new Schema({
  taxType: { type: String, enum: ['CGST', 'SGST', 'IGST', 'CESS', 'TDS', 'TCS'], required: true },
  rate: { type: Number, required: true, min: 0, max: 100 },
  amount: { type: Number, required: true, min: 0 },
  taxableAmount: { type: Number, required: true, min: 0 }
}, { _id: false });

const BankDetailsSchema = new Schema({
  bankName: { type: String },
  branchName: { type: String },
  accountNumber: { type: String },
  ifscCode: { type: String },
  transactionId: { type: String },
  utrNumber: { type: String },
  chequeNumber: { type: String },
  chequeDate: { type: Date },
  clearanceDate: { type: Date },
  clearanceStatus: { type: String, enum: ['pending', 'cleared', 'bounced', 'cancelled'] }
}, { _id: false });

const RecurringDetailsSchema = new Schema({
  isRecurring: { type: Boolean, default: false },
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] },
  interval: { type: Number, default: 1, min: 1 },
  startDate: { type: Date },
  endDate: { type: Date },
  nextDueDate: { type: Date },
  totalOccurrences: { type: Number },
  completedOccurrences: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const FinancialTransactionSchema = new Schema<IFinancialTransaction>({
  companyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true, 
    index: true 
  },

  // Transaction Identification
  transactionNumber: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  transactionDate: { 
    type: Date, 
    required: true, 
    default: Date.now, 
    index: true 
  },
  financialYear: { 
    type: String, 
    required: true,
    index: true
  },

  // Transaction Classification
  transactionType: {
    type: String,
    enum: ['income', 'expense', 'transfer', 'adjustment', 'opening_balance', 'closing_balance'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: [
      // Income categories
      'sales_revenue', 'service_income', 'interest_income', 'dividend_income', 'rental_income', 'other_income',
      // Expense categories
      'raw_material', 'salary_wages', 'rent', 'utilities', 'transport', 'marketing', 'professional_fees', 
      'insurance', 'maintenance', 'depreciation', 'interest_expense', 'tax_expense', 'other_expense',
      // Transfer categories
      'bank_transfer', 'cash_deposit', 'cash_withdrawal', 'loan_repayment', 'investment',
      // Adjustment categories
      'bank_charges', 'exchange_rate_diff', 'rounding_off', 'bad_debt', 'provision'
    ],
    required: true,
    index: true
  },
  subCategory: { type: String },

  // Amount Details
  amount: { 
    type: Number, 
    required: true,
    validate: {
      validator: function(v: number) {
        return v !== 0;
      },
      message: 'Amount cannot be zero'
    }
  },
  currency: { type: String, default: 'INR' },
  exchangeRate: { type: Number, default: 1, min: 0 },
  baseAmount: { type: Number }, // Amount in base currency

  // Tax Information
  taxDetails: {
    isTaxable: { type: Boolean, default: false },
    taxIncluded: { type: Boolean, default: false },
    taxableAmount: { type: Number, default: 0, min: 0 },
    totalTaxAmount: { type: Number, default: 0, min: 0 },
    taxBreakup: [TaxBreakupSchema],
    hsnCode: { type: String },
    sacCode: { type: String },
    placeOfSupply: { type: String },
    reverseCharge: { type: Boolean, default: false }
  },

  // Payment Information
  paymentDetails: {
    paymentMethod: { 
      type: String, 
      enum: ['cash', 'bank_transfer', 'cheque', 'upi', 'card', 'dd', 'online', 'adjustment'], 
      required: true 
    },
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'], 
      default: 'completed',
      index: true
    },
    bankDetails: BankDetailsSchema,
    paymentReference: { type: String },
    paymentNotes: { type: String }
  },

  // Party Information (Customer/Supplier/Employee)
  partyDetails: {
    partyType: { type: String, enum: ['customer', 'supplier', 'employee', 'bank', 'government', 'other'] },
    partyId: { type: Schema.Types.ObjectId },
    partyName: { type: String },
    partyCode: { type: String },
    partyGSTIN: { type: String },
    partyPAN: { type: String }
  },

  // Account Information
  accountDetails: {
    fromAccount: {
      accountType: { type: String, enum: ['bank', 'cash', 'petty_cash', 'credit_card'] },
      accountId: { type: Schema.Types.ObjectId },
      accountName: { type: String },
      accountNumber: { type: String }
    },
    toAccount: {
      accountType: { type: String, enum: ['bank', 'cash', 'petty_cash', 'credit_card'] },
      accountId: { type: Schema.Types.ObjectId },
      accountName: { type: String },
      accountNumber: { type: String }
    }
  },

  // Reference Documents
  referenceDocuments: {
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    invoiceNumber: { type: String },
    purchaseOrderId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
    purchaseOrderNumber: { type: String },
    salesOrderId: { type: Schema.Types.ObjectId, ref: 'CustomerOrder' },
    salesOrderNumber: { type: String },
    billId: { type: Schema.Types.ObjectId, ref: 'Bill' },
    billNumber: { type: String },
    otherReferences: [String]
  },

  // Recurring Transaction Details
  recurringDetails: RecurringDetailsSchema,

  // Reconciliation
  reconciliation: {
    isReconciled: { type: Boolean, default: false },
    reconciledDate: { type: Date },
    reconciledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    bankStatementDate: { type: Date },
    bankStatementAmount: { type: Number },
    reconciliationNotes: { type: String },
    discrepancyAmount: { type: Number, default: 0 }
  },

  // Approval Workflow
  approval: {
    isRequired: { type: Boolean, default: false },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    requestedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    approvalLevel: { type: Number, default: 1 },
    approvalNotes: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'approved' 
    }
  },

  // Additional Information
  description: { type: String, required: true },
  internalNotes: { type: String },
  tags: [String],
  attachments: [String], // URLs to receipts, invoices, etc.

  // Tracking & Audit
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  isReversed: { type: Boolean, default: false },
  reversedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reversedAt: { type: Date },
  reversalReason: { type: String },
  originalTransactionId: { type: Schema.Types.ObjectId, ref: 'FinancialTransaction' }
}, {
  timestamps: true,
  collection: 'financial_transactions'
});

// Compound Indexes for optimal performance
FinancialTransactionSchema.index({ companyId: 1, transactionDate: -1 });
FinancialTransactionSchema.index({ companyId: 1, transactionType: 1, transactionDate: -1 });
FinancialTransactionSchema.index({ companyId: 1, category: 1, transactionDate: -1 });
FinancialTransactionSchema.index({ companyId: 1, financialYear: 1 });
FinancialTransactionSchema.index({ companyId: 1, 'paymentDetails.paymentStatus': 1 });
FinancialTransactionSchema.index({ companyId: 1, 'partyDetails.partyType': 1, 'partyDetails.partyId': 1 });
FinancialTransactionSchema.index({ 'referenceDocuments.invoiceId': 1 });
FinancialTransactionSchema.index({ 'referenceDocuments.salesOrderId': 1 });
FinancialTransactionSchema.index({ 'recurringDetails.isRecurring': 1, 'recurringDetails.nextDueDate': 1 });

// Unique constraint for transaction number
FinancialTransactionSchema.index({ transactionNumber: 1 }, { unique: true });

// Text search index
FinancialTransactionSchema.index({ 
  transactionNumber: 'text', 
  description: 'text',
  'partyDetails.partyName': 'text',
  'paymentDetails.paymentReference': 'text'
});

// Pre-save middleware
FinancialTransactionSchema.pre('save', function(next) {
  // Calculate base amount if exchange rate is provided
  if (this.exchangeRate && this.exchangeRate !== 1) {
    this.baseAmount = this.amount * this.exchangeRate;
  } else {
    this.baseAmount = this.amount;
  }
  
  // Calculate total tax amount
  if (this.taxDetails.taxBreakup && this.taxDetails.taxBreakup.length > 0) {
    this.taxDetails.totalTaxAmount = this.taxDetails.taxBreakup.reduce(
      (total, tax) => total + tax.amount, 0
    );
  }
  
  // Set financial year based on transaction date
  if (!this.financialYear) {
    const transactionYear = this.transactionDate.getFullYear();
    const transactionMonth = this.transactionDate.getMonth() + 1; // 0-based month
    
    if (transactionMonth >= 4) {
      this.financialYear = `${transactionYear}-${transactionYear + 1}`;
    } else {
      this.financialYear = `${transactionYear - 1}-${transactionYear}`;
    }
  }
  
  next();
});

// Instance methods
FinancialTransactionSchema.methods.isIncome = function(): boolean {
  return this.transactionType === 'income' || this.amount > 0;
};

FinancialTransactionSchema.methods.isExpense = function(): boolean {
  return this.transactionType === 'expense' || this.amount < 0;
};

FinancialTransactionSchema.methods.isPending = function(): boolean {
  return this.paymentDetails.paymentStatus === 'pending';
};

FinancialTransactionSchema.methods.isReconciled = function(): boolean {
  return this.reconciliation.isReconciled;
};

FinancialTransactionSchema.methods.getTaxAmount = function(): number {
  return this.taxDetails.totalTaxAmount || 0;
};

FinancialTransactionSchema.methods.getNetAmount = function(): number {
  if (this.taxDetails.taxIncluded) {
    return Math.abs(this.amount);
  } else {
    return Math.abs(this.amount) + this.getTaxAmount();
  }
};

// Static methods
FinancialTransactionSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId }).sort({ transactionDate: -1 });
};

FinancialTransactionSchema.statics.findByDateRange = function(companyId: string, startDate: Date, endDate: Date) {
  return this.find({
    companyId,
    transactionDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ transactionDate: -1 });
};

FinancialTransactionSchema.statics.findByType = function(companyId: string, transactionType: string) {
  return this.find({ companyId, transactionType }).sort({ transactionDate: -1 });
};

FinancialTransactionSchema.statics.findPendingReconciliation = function(companyId: string) {
  return this.find({
    companyId,
    'reconciliation.isReconciled': false,
    'paymentDetails.paymentMethod': { $in: ['bank_transfer', 'cheque', 'dd'] }
  }).sort({ transactionDate: 1 });
};

FinancialTransactionSchema.statics.getFinancialSummary = function(companyId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        companyId: new Schema.Types.ObjectId(companyId),
        transactionDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$transactionType',
        totalAmount: { $sum: '$baseAmount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$baseAmount' }
      }
    }
  ]);
};

FinancialTransactionSchema.statics.getCashFlow = function(companyId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        companyId: new Schema.Types.ObjectId(companyId),
        transactionDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$transactionDate' },
          month: { $month: '$transactionDate' },
          type: '$transactionType'
        },
        totalAmount: { $sum: '$baseAmount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);
};

export default model<IFinancialTransaction>('FinancialTransaction', FinancialTransactionSchema);
