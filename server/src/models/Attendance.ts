import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  employeeId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  date: Date;
  shiftType: 'day' | 'night' | 'general';
  checkIn: {
    time: Date;
    location: string;
    method: 'biometric' | 'card' | 'manual' | 'mobile';
    verified: boolean;
  };
  checkOut: {
    time: Date;
    location: string;
    method: 'biometric' | 'card' | 'manual' | 'mobile';
    verified: boolean;
  };
  breakTime: {
    startTime: Date;
    endTime: Date;
    duration: number; // in minutes
    type: 'lunch' | 'tea' | 'other';
  }[];
  totalWorkingHours: number; // in hours
  overtimeHours: number; // in hours
  overtimeRate: number;
  overtimeAmount: number;
  status: 'present' | 'absent' | 'half-day' | 'leave' | 'holiday' | 'weekend';
  leaveType?: 'casual' | 'sick' | 'earned' | 'unpaid' | 'other';
  leaveReason?: string;
  leaveApprovedBy?: mongoose.Types.ObjectId;
  leaveApprovalStatus?: 'pending' | 'approved' | 'rejected';
  remarks?: string;
  isLate: boolean;
  lateMinutes: number;
  earlyDeparture: boolean;
  earlyDepartureMinutes: number;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>({
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: 'Manpower',
    required: true
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  shiftType: {
    type: String,
    enum: ['day', 'night', 'general'],
    required: true
  },
  checkIn: {
    time: {
      type: Date
    },
    location: {
      type: String,
      trim: true
    },
    method: {
      type: String,
      enum: ['biometric', 'card', 'manual', 'mobile'],
      default: 'manual'
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  checkOut: {
    time: {
      type: Date
    },
    location: {
      type: String,
      trim: true
    },
    method: {
      type: String,
      enum: ['biometric', 'card', 'manual', 'mobile'],
      default: 'manual'
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  breakTime: [{
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number,
      min: 0
    },
    type: {
      type: String,
      enum: ['lunch', 'tea', 'other'],
      default: 'other'
    }
  }],
  totalWorkingHours: {
    type: Number,
    min: 0,
    max: 24
  },
  overtimeHours: {
    type: Number,
    min: 0,
    max: 24
  },
  overtimeRate: {
    type: Number,
    min: 0
  },
  overtimeAmount: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'leave', 'holiday', 'weekend'],
    required: true
  },
  leaveType: {
    type: String,
    enum: ['casual', 'sick', 'earned', 'unpaid', 'other']
  },
  leaveReason: {
    type: String,
    trim: true
  },
  leaveApprovedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  leaveApprovalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected']
  },
  remarks: {
    type: String,
    trim: true
  },
  isLate: {
    type: Boolean,
    default: false
  },
  lateMinutes: {
    type: Number,
    min: 0,
    default: 0
  },
  earlyDeparture: {
    type: Boolean,
    default: false
  },
  earlyDepartureMinutes: {
    type: Number,
    min: 0,
    default: 0
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
attendanceSchema.index({ companyId: 1, employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ companyId: 1, date: 1 });
attendanceSchema.index({ companyId: 1, employeeId: 1 });
attendanceSchema.index({ companyId: 1, status: 1 });
attendanceSchema.index({ companyId: 1, shiftType: 1 });

export default mongoose.model<IAttendance>('Attendance', attendanceSchema);



