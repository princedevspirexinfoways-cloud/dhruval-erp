import { Schema, model } from 'mongoose';

const ManpowerSchema = new Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  personalInfo: {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    middleName: {
      type: String,
      trim: true,
      maxlength: 100
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 255
    },
    phone: {
      type: String,
      required: true,
      match: /^[+]?[1-9][\d\s\-\(\)]{7,15}$/
    },
    alternatePhone: {
      type: String,
      match: /^[+]?[1-9][\d\s\-\(\)]{7,15}$/
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other']
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    profilePhoto: {
      type: String
    }
  },
  employmentInfo: {
    joiningDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    department: {
      type: String,
      required: true,
      enum: ['Management', 'Production', 'Sales', 'Purchase', 'Accounts', 'HR', 'Quality', 'Maintenance', 'Security', 'IT']
    },
    designation: {
      type: String,
      required: true,
      trim: true
    },
    employeeType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Intern', 'Temporary'],
      default: 'Full-time'
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended', 'Terminated', 'On Leave'],
      default: 'Active'
    },
    reportingTo: {
      type: Schema.Types.ObjectId,
      ref: 'Manpower'
    }
  },
  companyInfo: {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    location: {
      type: String,
      trim: true
    },
    workLocation: {
      type: String,
      trim: true
    }
  },
  
  // Legacy field for backward compatibility
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  skills: [{
    skillName: {
      type: String,
      required: true,
      trim: true
    },
    proficiency: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Intermediate'
    },
    yearsOfExperience: {
      type: Number,
      min: 0
    }
  }],
  documents: [{
    documentType: {
      type: String,
      required: true,
      enum: ['ID Proof', 'Address Proof', 'Educational Certificate', 'Experience Certificate', 'Other']
    },
    documentNumber: {
      type: String,
      trim: true
    },
    documentUrl: {
      type: String
    },
    expiryDate: {
      type: Date
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  }],
  emergencyContact: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    relationship: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      match: /^[+]?[1-9][\d\s\-\(\)]{7,15}$/
    },
    address: {
      type: String,
      trim: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'manpower'
});

// Indexes for performance
ManpowerSchema.index({ employeeId: 1 });
ManpowerSchema.index({ 'personalInfo.email': 1 });
ManpowerSchema.index({ 'employmentInfo.department': 1 });
ManpowerSchema.index({ 'employmentInfo.status': 1 });
ManpowerSchema.index({ 'companyInfo.companyId': 1 });
ManpowerSchema.index({ isActive: 1 });
ManpowerSchema.index({ createdAt: -1 });

// Virtual for full name
ManpowerSchema.virtual('fullName').get(function(this: any) {
  const { firstName, middleName, lastName } = this.personalInfo;
  return [firstName, middleName, lastName].filter(Boolean).join(' ');
});

// Pre-save middleware for display name
ManpowerSchema.pre('save', function(this: any, next) {
  if (!this.personalInfo.displayName) {
    this.personalInfo.displayName = this.fullName;
  }
  next();
});

const Manpower = model('Manpower', ManpowerSchema);

export default Manpower;
