export interface IShift {
  _id: string;
  companyId: string;
  shiftCode: string;
  shiftName: string;
  shiftType: 'day' | 'night' | 'general' | 'rotating' | 'flexible' | 'split';
  shiftCategory: 'production' | 'office' | 'security' | 'maintenance' | 'other';
  startTime: string;
  endTime: string;
  totalHours: number;
  breaks: IShiftBreak[];
  totalBreakTime: number;
  netWorkingHours: number;
  rules: IShiftRule[];
  overtimeThreshold: number;
  overtimeRate: number;
  flexibleStartTime: number;
  flexibleEndTime: number;
  weeklySchedule: IShiftSchedule[];
  rotationPattern: 'none' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
  rotationDays: number;
  applicableDepartments: string[];
  applicableDesignations: string[];
  minimumEmployees: number;
  maximumEmployees: number;
  isNightShift: boolean;
  nightShiftAllowance: number;
  weeklyOffDays: number;
  statutoryHolidays: number;
  hourlyCost: number;
  additionalCosts: number;
  costCenter?: string;
  isDefault: boolean;
  priority: number;
  description?: string;
  notes?: string;
  tags: string[];
  customFields?: any;
  createdBy: string;
  lastModifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IShiftBreak {
  breakName: string;
  startTime: string;
  endTime: string;
  duration: number;
  isPaid: boolean;
  isMandatory: boolean;
}

export interface IShiftRule {
  ruleName: string;
  ruleType: 'overtime' | 'late_arrival' | 'early_departure' | 'break' | 'other';
  value: number;
  unit: 'minutes' | 'hours' | 'percentage';
  description?: string;
  isActive: boolean;
}

export interface IShiftSchedule {
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isWorkingDay: boolean;
  startTime: string;
  endTime: string;
  totalHours: number;
  breaks: IShiftBreak[];
  isActive: boolean;
}

export interface IShiftFormData {
  shiftCode: string;
  shiftName: string;
  shiftType: 'day' | 'night' | 'general' | 'rotating' | 'flexible' | 'split';
  shiftCategory: 'production' | 'office' | 'security' | 'maintenance' | 'other';
  startTime: string;
  endTime: string;
  totalHours: number;
  breaks: IShiftBreak[];
  rules: IShiftRule[];
  overtimeThreshold: number;
  overtimeRate: number;
  flexibleStartTime: number;
  flexibleEndTime: number;
  weeklySchedule: IShiftSchedule[];
  rotationPattern: 'none' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
  rotationDays: number;
  applicableDepartments: string[];
  applicableDesignations: string[];
  minimumEmployees: number;
  maximumEmployees: number;
  isNightShift: boolean;
  nightShiftAllowance: number;
  weeklyOffDays: number;
  statutoryHolidays: number;
  hourlyCost: number;
  additionalCosts: number;
  costCenter?: string;
  isDefault: boolean;
  priority: number;
  description?: string;
  notes?: string;
  tags: string[];
}
