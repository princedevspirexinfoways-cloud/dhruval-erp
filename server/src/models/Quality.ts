import { Schema, model } from 'mongoose';
import { Types } from 'mongoose';

// Quality Check Schema
const QualityCheckSchema = new Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  spareId: {
    type: Schema.Types.ObjectId,
    ref: 'Spare',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  inspector: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  grade: {
    type: String,
    required: true,
    enum: ['A+', 'A', 'B+', 'B', 'C', 'Reject']
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  parameters: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      required: true,
      enum: ['pass', 'fail', 'warning']
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  images: [{
    type: String // URLs to stored images
  }],
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in-progress', 'completed', 'failed'],
    default: 'pending'
  },
  nextCheckDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Certification Schema
const CertificationSchema = new Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  spareId: {
    type: Schema.Types.ObjectId,
    ref: 'Spare',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  issuingAuthority: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  issueDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date
  },
  certificateNumber: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'expired', 'pending', 'suspended'],
    default: 'active'
  },
  documentUrl: {
    type: String // URL to stored certificate document
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Compliance Standard Schema
const ComplianceStandardSchema = new Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  spareId: {
    type: Schema.Types.ObjectId,
    ref: 'Spare',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  code: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    required: true,
    enum: ['compliant', 'non-compliant', 'pending', 'exempt'],
    default: 'pending'
  },
  lastAuditDate: {
    type: Date
  },
  nextAuditDate: {
    type: Date
  },
  auditNotes: {
    type: String,
    trim: true,
    maxlength: 2000
  }
}, {
  timestamps: true
});

// Indexes for better query performance
QualityCheckSchema.index({ companyId: 1, spareId: 1 });
QualityCheckSchema.index({ companyId: 1, date: -1 });
QualityCheckSchema.index({ companyId: 1, status: 1 });
QualityCheckSchema.index({ companyId: 1, nextCheckDate: 1 });

CertificationSchema.index({ companyId: 1, spareId: 1 });
CertificationSchema.index({ companyId: 1, status: 1 });
CertificationSchema.index({ companyId: 1, expiryDate: 1 });

ComplianceStandardSchema.index({ companyId: 1, spareId: 1 });
ComplianceStandardSchema.index({ companyId: 1, status: 1 });
ComplianceStandardSchema.index({ companyId: 1, nextAuditDate: 1 });

export const QualityCheck = model('QualityCheck', QualityCheckSchema);
export const Certification = model('Certification', CertificationSchema);
export const ComplianceStandard = model('ComplianceStandard', ComplianceStandardSchema);
