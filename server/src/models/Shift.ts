import { Schema, model, Model, Query } from 'mongoose';
import { IShift } from '@/types/models';

const ShiftBreakSchema = new Schema({
  breakName: { type: String, required: true }, // e.g., "Lunch Break", "Tea Break"
  startTime: { type: String, required: true }, // HH:MM format
  endTime: { type: String, required: true }, // HH:MM format
  duration: { type: Number, required: true }, // in minutes
  isPaid: { type: Boolean, default: false }, // whether break is paid or unpaid
  isMandatory: { type: Boolean, default: true } // whether break is mandatory
}, { _id: false });

const ShiftRuleSchema = new Schema({
  ruleName: { type: String, required: true }, // e.g., "Overtime Threshold", "Late Arrival Grace"
  ruleType: { type: String, enum: ['overtime', 'late_arrival', 'early_departure', 'break', 'other'] },
  value: { type: Number, required: true }, // numeric value for the rule
  unit: { type: String, enum: ['minutes', 'hours', 'percentage'], default: 'minutes' },
  description: { type: String },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const ShiftScheduleSchema = new Schema({
  dayOfWeek: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], required: true },
  isWorkingDay: { type: Boolean, default: true },
  startTime: { type: String, required: true }, // HH:MM format
  endTime: { type: String, required: true }, // HH:MM format
  totalHours: { type: Number, required: true }, // calculated total working hours
  breaks: [ShiftBreakSchema],
  isActive: { type: Boolean, default: true }
}, { _id: false });

const ShiftSchema = new Schema<IShift>({
  companyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true, 
    index: true 
  },

  // Shift Identification
  shiftCode: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  shiftName: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 100
  },

  // Shift Type & Category
  shiftType: { 
    type: String, 
    enum: ['day', 'night', 'general', 'rotating', 'flexible', 'split'], 
    required: true 
  },
  shiftCategory: { 
    type: String, 
    enum: ['production', 'office', 'security', 'maintenance', 'other'], 
    required: true 
  },

  // Basic Timing
  startTime: { type: String, required: true }, // HH:MM format
  endTime: { type: String, required: true }, // HH:MM format
  totalHours: { type: Number, required: true, min: 0, max: 24 }, // total working hours per day
  
  // Break Management
  breaks: [ShiftBreakSchema],
  totalBreakTime: { type: Number, default: 0 }, // total break time in minutes
  netWorkingHours: { type: Number, required: true }, // total hours minus breaks

  // Shift Rules & Policies
  rules: [ShiftRuleSchema],
  
  // Overtime & Flexibility
  overtimeThreshold: { type: Number, default: 480 }, // minutes after which overtime starts
  overtimeRate: { type: Number, default: 1.5 }, // multiplier for overtime pay
  flexibleStartTime: { type: Number, default: 0 }, // grace period for late arrival in minutes
  flexibleEndTime: { type: Number, default: 0 }, // grace period for early departure in minutes

  // Schedule & Rotation
  weeklySchedule: [ShiftScheduleSchema], // different schedules for different days
  rotationPattern: { 
    type: String, 
    enum: ['none', 'weekly', 'monthly', 'quarterly', 'custom'] 
  },
  rotationDays: { type: Number, default: 0 }, // days after which shift rotates

  // Applicability
  applicableDepartments: [String], // departments this shift applies to
  applicableDesignations: [String], // designations this shift applies to
  minimumEmployees: { type: Number, default: 1 }, // minimum employees required for this shift
  maximumEmployees: { type: Number, default: 100 }, // maximum employees allowed for this shift

  // Compliance & Legal
  isNightShift: { type: Boolean, default: false },
  nightShiftAllowance: { type: Number, default: 0 }, // additional allowance for night shift
  weeklyOffDays: { type: Number, default: 1 }, // number of weekly off days
  statutoryHolidays: { type: Number, default: 0 }, // number of statutory holidays

  // Cost & Budget
  hourlyCost: { type: Number, default: 0 }, // cost per hour for this shift
  additionalCosts: { type: Number, default: 0 }, // additional costs like transport, meals
  costCenter: { type: String }, // cost center for accounting purposes

  // Status & Configuration
  isDefault: { type: Boolean, default: false }, // whether this is the default shift
  priority: { type: Number, default: 0 }, // priority for shift assignment

  // Additional Information
  description: { type: String },
  notes: { type: String },
  tags: [String],
  customFields: { type: Schema.Types.Mixed },

  // Tracking & Audit
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'shifts'
});

// Compound Indexes for optimal performance
ShiftSchema.index({ companyId: 1, shiftCode: 1 }, { unique: true });
ShiftSchema.index({ companyId: 1, shiftType: 1 });
ShiftSchema.index({ companyId: 1, shiftCategory: 1 });
ShiftSchema.index({ companyId: 1, isNightShift: 1 });
ShiftSchema.index({ companyId: 1, 'applicableDepartments': 1 });

// Text search index
ShiftSchema.index({ 
  shiftName: 'text', 
  shiftCode: 'text',
  description: 'text'
});

// Pre-save middleware
ShiftSchema.pre('save', function(next) {
  // Calculate total break time
  if (this.breaks && this.breaks.length > 0) {
    this.totalBreakTime = this.breaks.reduce((total, breakItem) => total + breakItem.duration, 0);
  }
  
  // Calculate net working hours
  this.netWorkingHours = this.totalHours - (this.totalBreakTime / 60);
  
  // Validate timing
  if (this.startTime && this.endTime) {
    const startMinutes = this.timeToMinutes(this.startTime);
    const endMinutes = this.timeToMinutes(this.endTime);
    
    if (endMinutes <= startMinutes) {
      // Night shift - end time is next day
      this.totalHours = (24 * 60 - startMinutes + endMinutes) / 60;
    } else {
      this.totalHours = (endMinutes - startMinutes) / 60;
    }
  }
  
  next();
});

// Instance methods
ShiftSchema.methods.isCurrentlyActive = function(): boolean {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  if (this.isNightShift) {
    // For night shift, check if current time is between start and end (crossing midnight)
    return currentTime >= this.startTime || currentTime <= this.endTime;
  } else {
    // For day shift, check if current time is between start and end
    return currentTime >= this.startTime && currentTime <= this.endTime;
  }
};

ShiftSchema.methods.getWorkingDays = function(): string[] {
  return this.weeklySchedule
    .filter(schedule => schedule.isWorkingDay)
    .map(schedule => schedule.dayOfWeek);
};

ShiftSchema.methods.getNonWorkingDays = function(): string[] {
  return this.weeklySchedule
    .filter(schedule => !schedule.isWorkingDay)
    .map(schedule => schedule.dayOfWeek);
};

ShiftSchema.methods.calculateOvertime = function(actualHours: number): number {
  if (actualHours <= this.overtimeThreshold / 60) {
    return 0;
  }
  return actualHours - (this.overtimeThreshold / 60);
};

ShiftSchema.methods.getShiftCost = function(hours: number): number {
  const baseCost = hours * this.hourlyCost;
  const overtimeHours = this.calculateOvertime(hours);
  const overtimeCost = overtimeHours * this.hourlyCost * (this.overtimeRate - 1);
  
  return baseCost + overtimeCost + this.additionalCosts;
};

// Helper method to convert time string to minutes
ShiftSchema.methods.timeToMinutes = function(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Static methods
ShiftSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId, isActive: true });
};

ShiftSchema.statics.findByType = function(companyId: string, shiftType: string) {
  return this.find({ 
    companyId, 
    shiftType,
    isActive: true 
  });
};

ShiftSchema.statics.findByCategory = function(companyId: string, shiftCategory: string) {
  return this.find({ 
    companyId, 
    shiftCategory,
    isActive: true 
  });
};

ShiftSchema.statics.findNightShifts = function(companyId: string) {
  return this.find({ 
    companyId, 
    isNightShift: true,
    isActive: true 
  });
};

ShiftSchema.statics.findByDepartment = function(companyId: string, department: string) {
  return this.find({
    companyId,
    applicableDepartments: department,
    isActive: true
  });
};

// Define the model interface with static methods
export interface IShiftModel extends Model<IShift> {
  findByCompany(companyId: string): Query<IShift[], IShift>;
  findByType(companyId: string, shiftType: string): Query<IShift[], IShift>;
  findByCategory(companyId: string, shiftCategory: string): Query<IShift[], IShift>;
  findNightShifts(companyId: string): Query<IShift[], IShift>;
  findByDepartment(companyId: string, department: string): Query<IShift[], IShift>;
}

export default model<IShift, IShiftModel>('Shift', ShiftSchema);
