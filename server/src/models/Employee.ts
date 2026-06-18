import { Schema, model, Model, Query } from 'mongoose';
import { IEmployee } from '@/types/models';

const EmployeeSkillSchema = new Schema({
  skillName: { type: String, required: true },
  skillLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'beginner' },
  yearsOfExperience: { type: Number, min: 0 },
  certification: { type: String },
  certificationDate: { type: Date },
  expiryDate: { type: Date },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const EmployeeCertificationSchema = new Schema({
  certificationName: { type: String, required: true },
  issuingAuthority: { type: String, required: true },
  certificationNumber: { type: String, required: true },
  issueDate: { type: Date, required: true },
  expiryDate: { type: Date },
  isActive: { type: Boolean, default: true },
  documentUrl: { type: String }, // S3 URL to certificate
  notes: { type: String }
}, { _id: false });

const EmployeeSalarySchema = new Schema({
  basicSalary: { type: Number, required: true, min: 0 },
  hra: { type: Number, default: 0, min: 0 },
  da: { type: Number, default: 0, min: 0 },
  otherAllowances: { type: Number, default: 0, min: 0 },
  pfDeduction: { type: Number, default: 0, min: 0 },
  esiDeduction: { type: Number, default: 0, min: 0 },
  otherDeductions: { type: Number, default: 0, min: 0 },
  effectiveDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const EmployeeShiftSchema = new Schema({
  shiftId: { type: Schema.Types.ObjectId, ref: 'Shift', required: true },
  shiftName: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isNightShift: { type: Boolean, default: false },
  effectiveDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const EmployeePerformanceSchema = new Schema({
  reviewPeriod: { type: String, required: true }, // monthly, quarterly, yearly
  reviewDate: { type: Date, required: true },
  performanceRating: { type: Number, min: 1, max: 5, required: true },
  strengths: [String],
  areasOfImprovement: [String],
  goals: [String],
  achievements: [String],
  reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reviewerName: { type: String, required: true },
  reviewNotes: { type: String },
  nextReviewDate: { type: Date },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const EmployeeSchema = new Schema<IEmployee>({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Employee Identification
  employeeCode: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  employeeId: { 
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
    fatherName: { type: String, trim: true, maxlength: 255 },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'widowed'] },
    bloodGroup: { type: String, maxlength: 5 },
    profilePhoto: { type: String }, // S3 URL to profile photo
    signature: { type: String } // S3 URL to digital signature
  },

  // Contact Information
  contactInfo: {
    primaryPhone: { type: String, required: true, match: /^[+]?[1-9][\d\s\-\(\)]{7,15}$/ },
    alternatePhone: { type: String, match: /^[+]?[1-9][\d\s\-\(\)]{7,15}$/ },
    email: { type: String, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    emergencyContactName: { type: String, required: true },
    emergencyContactPhone: { type: String, required: true, match: /^[+]?[1-9][\d\s\-\(\)]{7,15}$/ },
    emergencyContactRelationship: { type: String }
  },

  // Address Information
  addresses: {
    permanentAddress: {
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' }
    },
    currentAddress: {
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' }
    }
  },

  // Identity Documents
  identityDocuments: {
    aadharNumber: { type: String, required: true, match: /^[0-9]{12}$/ },
    panNumber: { type: String, required: true, match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/ },
    passportNumber: { type: String },
    passportExpiryDate: { type: Date },
    drivingLicenseNumber: { type: String },
    drivingLicenseExpiryDate: { type: Date }
  },

  // Employment Information
  employmentInfo: {
    designation: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    reportingManagerId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    reportingManagerName: { type: String },
    employmentType: { type: String, enum: ['permanent', 'contract', 'temporary', 'intern'], default: 'permanent' },
    salaryType: { type: String, enum: ['monthly', 'daily', 'hourly', 'piece_rate'], default: 'monthly' },
    joiningDate: { type: Date, required: true },
    confirmationDate: { type: Date },
    resignationDate: { type: Date },
    lastWorkingDate: { type: Date },
    noticePeriod: { type: Number, default: 30 }, // days
    probationPeriod: { type: Number, default: 6 } // months
  },

  // Salary & Benefits
  salaryInfo: [EmployeeSalarySchema],
  
  // Skills & Certifications
  skills: [EmployeeSkillSchema],
  certifications: [EmployeeCertificationSchema],

  // Shift & Schedule
  shifts: [EmployeeShiftSchema],

  // Performance & Reviews
  performanceRecords: [EmployeePerformanceSchema],

  // Bank Information
  bankInfo: {
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
    branchName: { type: String },
    accountType: { type: String, enum: ['savings', 'current'], default: 'savings' }
  },

  // Government Registrations
  governmentRegistrations: {
    pfNumber: { type: String },
    esiNumber: { type: String },
    uanNumber: { type: String },
    esicNumber: { type: String }
  },

  // Additional Information
  notes: { type: String },
  tags: [String],
  customFields: { type: Schema.Types.Mixed },
  attachments: [String], // S3 URLs to additional documents

  // Status & Tracking
  employmentStatus: {
    type: String,
    enum: ['active', 'inactive', 'terminated', 'resigned', 'retired'],
    default: 'active'
  },

  // Tracking & Audit
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'employees'
});

// Compound Indexes for optimal performance
EmployeeSchema.index({ companyId: 1, employeeCode: 1 }, { unique: true });
EmployeeSchema.index({ companyId: 1, 'employmentInfo.department': 1 });
EmployeeSchema.index({ companyId: 1, 'employmentInfo.designation': 1 });
EmployeeSchema.index({ companyId: 1, employmentStatus: 1 });
EmployeeSchema.index({ companyId: 1, 'employmentInfo.joiningDate': 1 });
EmployeeSchema.index({ 'contactInfo.primaryPhone': 1 });
EmployeeSchema.index({ 'contactInfo.email': 1 });
EmployeeSchema.index({ 'identityDocuments.aadharNumber': 1 });
EmployeeSchema.index({ 'identityDocuments.panNumber': 1 });

// Text search index
EmployeeSchema.index({ 
  'personalInfo.fullName': 'text', 
  'personalInfo.firstName': 'text',
  'personalInfo.lastName': 'text',
  'employmentInfo.designation': 'text',
  'employmentInfo.department': 'text'
});

// Pre-save middleware
EmployeeSchema.pre('save', function(next) {
  // Set full name
  if (!this.personalInfo.fullName) {
    this.personalInfo.fullName = [
      this.personalInfo.firstName,
      this.personalInfo.middleName,
      this.personalInfo.lastName
    ].filter(Boolean).join(' ');
  }
  
  // Set employee ID if not provided
  if (!this.employeeId) {
    this.employeeId = `${this.companyId}_${this.employeeCode}`;
  }
  
  next();
});

// Instance methods
EmployeeSchema.methods.isCurrentlyEmployed = function(): boolean {
  return this.employmentStatus === 'active';
};

EmployeeSchema.methods.getCurrentSalary = function() {
  const activeSalary = this.salaryInfo.find(salary => salary.isActive);
  return activeSalary || null;
};

EmployeeSchema.methods.getCurrentShift = function() {
  const activeShift = this.shifts.find(shift => shift.isActive);
  return activeShift || null;
};

EmployeeSchema.methods.getYearsOfService = function(): number {
  const today = new Date();
  const joiningDate = this.employmentInfo.joiningDate;
  const years = today.getFullYear() - joiningDate.getFullYear();
  const monthDiff = today.getMonth() - joiningDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < joiningDate.getDate())) {
    return years - 1;
  }
  
  return years;
};

EmployeeSchema.methods.isOnProbation = function(): boolean {
  if (!this.employmentInfo.confirmationDate) {
    const today = new Date();
    const joiningDate = this.employmentInfo.joiningDate;
    const monthsDiff = (today.getFullYear() - joiningDate.getFullYear()) * 12 + 
                      (today.getMonth() - joiningDate.getMonth());
    
    return monthsDiff < this.employmentInfo.probationPeriod;
  }
  
  return false;
};

// Static methods
EmployeeSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId, isActive: true });
};

EmployeeSchema.statics.findByDepartment = function(companyId: string, department: string) {
  return this.find({ 
    companyId, 
    'employmentInfo.department': department,
    isActive: true 
  });
};

EmployeeSchema.statics.findByDesignation = function(companyId: string, designation: string) {
  return this.find({ 
    companyId, 
    'employmentInfo.designation': designation,
    isActive: true 
  });
};

EmployeeSchema.statics.findActiveEmployees = function(companyId: string) {
  return this.find({ 
    companyId, 
    employmentStatus: 'active',
    isActive: true 
  });
};

EmployeeSchema.statics.findEmployeesByShift = function(companyId: string, shiftId: string) {
  return this.find({
    companyId,
    'shifts.shiftId': shiftId,
    'shifts.isActive': true,
    employmentStatus: 'active',
    isActive: true
  });
};

// Define the model interface with static methods
export interface IEmployeeModel extends Model<IEmployee> {
  findByCompany(companyId: string): Query<IEmployee[], IEmployee>;
  findByDepartment(companyId: string, department: string): Query<IEmployee[], IEmployee>;
  findByDesignation(companyId: string, designation: string): Query<IEmployee[], IEmployee>;
  findActiveEmployees(companyId: string): Query<IEmployee[], IEmployee>;
  findEmployeesByShift(companyId: string, shiftId: string): Query<IEmployee[], IEmployee>;
}

export default model<IEmployee, IEmployeeModel>('Employee', EmployeeSchema);
