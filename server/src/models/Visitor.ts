import { Schema, model, Model, Query } from 'mongoose';
import { IVisitor, IVisitorApproval, IVisitorEntry, IVisitorExit, IVisitorDocument } from '@/types/models';

const VisitorDocumentSchema = new Schema<IVisitorDocument>({
  documentType: { 
    type: String, 
    enum: ['aadhar', 'pan', 'driving_license', 'passport', 'voter_id', 'company_id', 'other'], 
    required: true 
  },
  documentNumber: { type: String, required: true },
  documentUrl: { type: String }, // URL to uploaded document image
  isVerified: { type: Boolean, default: false },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  expiryDate: { type: Date },
  notes: { type: String }
}, { _id: false });

const VisitorApprovalSchema = new Schema<IVisitorApproval>({
  approvalLevel: { type: Number, required: true, min: 1 },
  approverType: { 
    type: String, 
    enum: ['employee', 'security', 'manager', 'admin'], 
    required: true 
  },
  approverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  approverName: { type: String, required: true },
  approverDepartment: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'expired'], 
    default: 'pending' 
  },
  approvedAt: { type: Date },
  rejectedAt: { type: Date },
  rejectionReason: { type: String },
  approvalNotes: { type: String },
  validFrom: { type: Date },
  validUntil: { type: Date },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const VisitorEntrySchema = new Schema<IVisitorEntry>({
  entryDateTime: { type: Date, required: true, default: Date.now },
  entryGate: { type: String, required: true },
  securityGuardId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  securityGuardName: { type: String, required: true },
  entryMethod: { 
    type: String, 
    enum: ['manual', 'qr_code', 'rfid', 'biometric', 'face_recognition'], 
    default: 'manual' 
  },
  entryPhoto: { type: String }, // URL to entry photo
  temperatureCheck: { type: Number, min: 90, max: 110 },
  healthDeclaration: { type: Boolean, default: false },
  belongingsChecked: { type: Boolean, default: false },
  belongingsList: [String],
  escortRequired: { type: Boolean, default: false },
  escortId: { type: Schema.Types.ObjectId, ref: 'User' },
  escortName: { type: String },
  entryNotes: { type: String },
  deviceId: { type: String }, // Entry device/terminal ID
  ipAddress: { type: String },
  gpsLocation: {
    latitude: { type: Number },
    longitude: { type: Number }
  }
}, { _id: false });

const VisitorExitSchema = new Schema<IVisitorExit>({
  exitDateTime: { type: Date, required: true, default: Date.now },
  exitGate: { type: String, required: true },
  securityGuardId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  securityGuardName: { type: String, required: true },
  exitMethod: { 
    type: String, 
    enum: ['manual', 'qr_code', 'rfid', 'biometric', 'face_recognition'], 
    default: 'manual' 
  },
  exitPhoto: { type: String }, // URL to exit photo
  belongingsReturned: { type: Boolean, default: true },
  belongingsNotes: { type: String },
  feedbackRating: { type: Number, min: 1, max: 5 },
  feedbackComments: { type: String },
  exitNotes: { type: String },
  deviceId: { type: String }, // Exit device/terminal ID
  ipAddress: { type: String },
  gpsLocation: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  totalDuration: { type: Number }, // Duration in minutes
  overstayReason: { type: String }
}, { _id: false });

const VisitorSchema = new Schema<IVisitor>({
  companyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true, 
    index: true 
  },

  // Visitor Identification
  visitorId: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  visitorNumber: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true
  },

  // Personal Information
  personalInfo: {
    firstName: { type: String, required: true, trim: true, maxlength: 100 },
    lastName: { type: String, required: true, trim: true, maxlength: 100 },
    middleName: { type: String, trim: true, maxlength: 100 },
    fullName: { type: String, trim: true, maxlength: 255 },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    dateOfBirth: { type: Date },
    nationality: { type: String, default: 'Indian' },
    profilePhoto: { type: String }, // URL to visitor photo
    signature: { type: String } // URL to digital signature
  },

  // Contact Information
  contactInfo: {
    primaryPhone: { type: String, required: true, match: /^[+]?[1-9][\d\s\-\(\)]{7,15}$/ },
    alternatePhone: { type: String, match: /^[+]?[1-9][\d\s\-\(\)]{7,15}$/ },
    email: { type: String, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    whatsapp: { type: String }
  },

  // Address Information
  address: {
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
    landmark: { type: String }
  },

  // Company/Organization Details
  organizationInfo: {
    companyName: { type: String, trim: true },
    designation: { type: String, trim: true },
    department: { type: String, trim: true },
    companyAddress: { type: String },
    companyPhone: { type: String },
    companyEmail: { type: String },
    businessCard: { type: String }, // URL to business card image
    isEmployee: { type: Boolean, default: false },
    employeeId: { type: String }
  },

  // Visit Details
  visitInfo: {
    visitType: { 
      type: String, 
      enum: ['business', 'interview', 'meeting', 'delivery', 'maintenance', 'audit', 'training', 'personal', 'official', 'other'], 
      required: true,
      index: true
    },
    visitPurpose: { type: String, required: true, maxlength: 500 },
    visitCategory: { 
      type: String, 
      enum: ['vip', 'regular', 'contractor', 'vendor', 'government', 'media', 'student', 'other'], 
      default: 'regular',
      index: true
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'urgent'], 
      default: 'medium',
      index: true
    },
    expectedDuration: { type: Number, min: 15, max: 1440 }, // Duration in minutes
    scheduledDateTime: { type: Date, index: true },
    scheduledEndDateTime: { type: Date },
    isRecurringVisit: { type: Boolean, default: false },
    recurringPattern: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    visitNotes: { type: String }
  },

  // Host Information
  hostInfo: {
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    hostName: { type: String, required: true },
    hostDepartment: { type: String, required: true },
    hostDesignation: { type: String },
    hostPhone: { type: String },
    hostEmail: { type: String },
    alternateHostId: { type: Schema.Types.ObjectId, ref: 'User' },
    alternateHostName: { type: String },
    meetingLocation: { type: String, required: true },
    meetingRoom: { type: String },
    specialInstructions: { type: String }
  },

  // Documents & Verification
  documents: [VisitorDocumentSchema],
  
  // Approval Workflow
  approvals: [VisitorApprovalSchema],
  overallApprovalStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'expired', 'cancelled'], 
    default: 'pending',
    index: true
  },

  // Entry & Exit Tracking
  entries: [VisitorEntrySchema],
  exits: [VisitorExitSchema],
  currentStatus: { 
    type: String, 
    enum: ['scheduled', 'approved', 'checked_in', 'inside', 'checked_out', 'completed', 'no_show', 'cancelled'], 
    default: 'scheduled',
    index: true
  },

  // Security & Safety
  securityInfo: {
    riskLevel: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical'], 
      default: 'low',
      index: true
    },
    blacklisted: { type: Boolean, default: false, index: true },
    blacklistReason: { type: String },
    blacklistedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    blacklistedAt: { type: Date },
    securityNotes: { type: String },
    specialRequirements: [String],
    accessAreas: [String], // Areas visitor is allowed to access
    restrictedAreas: [String], // Areas visitor is not allowed to access
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relationship: { type: String }
    }
  },

  // Vehicle Information (if visitor comes with vehicle)
  vehicleInfo: {
    hasVehicle: { type: Boolean, default: false },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    vehicleNumber: { type: String },
    vehicleType: { type: String, enum: ['car', 'bike', 'truck', 'bus', 'auto', 'cycle', 'other'] },
    driverName: { type: String },
    driverPhone: { type: String },
    parkingLocation: { type: String },
    parkingSlot: { type: String }
  },

  // Health & Safety (Post-COVID measures)
  healthInfo: {
    vaccinationStatus: { 
      type: String, 
      enum: ['not_vaccinated', 'partially_vaccinated', 'fully_vaccinated', 'booster_taken'] 
    },
    vaccinationCertificate: { type: String }, // URL to certificate
    lastCovidTest: { type: Date },
    covidTestResult: { type: String, enum: ['positive', 'negative', 'pending'] },
    healthDeclaration: { type: Boolean, default: false },
    temperatureRecords: [{
      temperature: { type: Number },
      recordedAt: { type: Date, default: Date.now },
      recordedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    }],
    maskRequired: { type: Boolean, default: true },
    sanitizationDone: { type: Boolean, default: false }
  },

  // Feedback & Rating
  feedback: {
    overallRating: { type: Number, min: 1, max: 5 },
    securityRating: { type: Number, min: 1, max: 5 },
    hospitalityRating: { type: Number, min: 1, max: 5 },
    facilityRating: { type: Number, min: 1, max: 5 },
    comments: { type: String },
    suggestions: { type: String },
    wouldRecommend: { type: Boolean },
    feedbackDate: { type: Date }
  },

  // Additional Information
  notes: { type: String },
  tags: [String],
  customFields: { type: Schema.Types.Mixed },
  attachments: [String], // URLs to additional documents/images

  // Tracking & Audit
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'visitors'
});

// Compound Indexes for optimal performance
VisitorSchema.index({ companyId: 1, visitorNumber: 1 }, { unique: true });
VisitorSchema.index({ companyId: 1, 'visitInfo.scheduledDateTime': 1 });
VisitorSchema.index({ companyId: 1, 'hostInfo.hostId': 1 });
VisitorSchema.index({ companyId: 1, currentStatus: 1 });
VisitorSchema.index({ companyId: 1, overallApprovalStatus: 1 });
VisitorSchema.index({ companyId: 1, 'visitInfo.visitType': 1 });
VisitorSchema.index({ companyId: 1, 'securityInfo.riskLevel': 1 });
VisitorSchema.index({ companyId: 1, 'securityInfo.blacklisted': 1 });
VisitorSchema.index({ 'contactInfo.primaryPhone': 1 });
VisitorSchema.index({ 'contactInfo.email': 1 });

// Text search index
VisitorSchema.index({ 
  'personalInfo.fullName': 'text', 
  'personalInfo.firstName': 'text',
  'personalInfo.lastName': 'text',
  'organizationInfo.companyName': 'text',
  'visitInfo.visitPurpose': 'text',
  'hostInfo.hostName': 'text'
});

// Pre-save middleware
VisitorSchema.pre('save', function(next) {
  // Set full name
  if (!this.personalInfo.fullName) {
    this.personalInfo.fullName = [
      this.personalInfo.firstName,
      this.personalInfo.middleName,
      this.personalInfo.lastName
    ].filter(Boolean).join(' ');
  }
  
  // Set scheduled end date time if not provided
  if (this.visitInfo.scheduledDateTime && this.visitInfo.expectedDuration && !this.visitInfo.scheduledEndDateTime) {
    this.visitInfo.scheduledEndDateTime = new Date(
      this.visitInfo.scheduledDateTime.getTime() + (this.visitInfo.expectedDuration * 60 * 1000)
    );
  }
  
  next();
});

// Instance methods
VisitorSchema.methods.isCurrentlyInside = function(): boolean {
  return this.currentStatus === 'inside' || this.currentStatus === 'checked_in';
};

VisitorSchema.methods.isApproved = function(): boolean {
  return this.overallApprovalStatus === 'approved';
};

VisitorSchema.methods.isBlacklisted = function(): boolean {
  return this.securityInfo.blacklisted;
};

VisitorSchema.methods.getLastEntry = function() {
  return this.entries.length > 0 ? this.entries[this.entries.length - 1] : null;
};

VisitorSchema.methods.getLastExit = function() {
  return this.exits.length > 0 ? this.exits[this.exits.length - 1] : null;
};

VisitorSchema.methods.getCurrentDuration = function(): number {
  const lastEntry = this.getLastEntry();
  if (!lastEntry || this.currentStatus !== 'inside') return 0;
  
  return Math.floor((Date.now() - lastEntry.entryDateTime.getTime()) / (1000 * 60)); // Duration in minutes
};

VisitorSchema.methods.isOverstaying = function(): boolean {
  if (!this.visitInfo.expectedDuration) return false;
  return this.getCurrentDuration() > this.visitInfo.expectedDuration;
};

// Static methods
VisitorSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId, isActive: true });
};

VisitorSchema.statics.findCurrentlyInside = function(companyId: string) {
  return this.find({ 
    companyId, 
    currentStatus: { $in: ['checked_in', 'inside'] },
    isActive: true 
  });
};

VisitorSchema.statics.findByHost = function(companyId: string, hostId: string) {
  return this.find({ 
    companyId, 
    'hostInfo.hostId': hostId,
    isActive: true 
  }).sort({ 'visitInfo.scheduledDateTime': -1 });
};

VisitorSchema.statics.findScheduledToday = function(companyId: string) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  return this.find({
    companyId,
    'visitInfo.scheduledDateTime': {
      $gte: startOfDay,
      $lt: endOfDay
    },
    isActive: true
  }).sort({ 'visitInfo.scheduledDateTime': 1 });
};

VisitorSchema.statics.findOverstaying = function(companyId: string) {
  return this.find({
    companyId,
    currentStatus: 'inside',
    isActive: true
  }).then((visitors: any[]) => {
    return visitors.filter(visitor => visitor.isOverstaying());
  });
};

// Define the model interface with static methods
export interface IVisitorModel extends Model<IVisitor> {
  findByCompany(companyId: string): Query<IVisitor[], IVisitor>;
  findCurrentlyInside(companyId: string): Query<IVisitor[], IVisitor>;
  findByHost(companyId: string, hostId: string): Query<IVisitor[], IVisitor>;
  findScheduledToday(companyId: string): Query<IVisitor[], IVisitor>;
  findOverstaying(companyId: string): Query<IVisitor[], IVisitor>;
}

export default model<IVisitor, IVisitorModel>('Visitor', VisitorSchema);
