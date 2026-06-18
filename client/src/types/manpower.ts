export interface IManpower {
  _id: string;
  employeeId: string;
  name: string;
  companyId: string;
  designation: string;
  department: 'production' | 'packing' | 'quality' | 'maintenance' | 'admin' | 'sales' | 'purchase';
  employeeType: 'permanent' | 'contractor' | 'temporary';
  joiningDate: string;
  salary: {
    basic: number;
    hra: number;
    da: number;
    otherAllowances: number;
    total: number;
  };
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  contactInfo: {
    phone: string;
    email?: string;
    address: string;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  shiftDetails: {
    shiftType: 'day' | 'night' | 'general';
    startTime: string;
    endTime: string;
    overtimeEligible: boolean;
    overtimeRate: number;
  };
  attendance: {
    presentDays: number;
    absentDays: number;
    halfDays: number;
    leavesTaken: number;
    leavesBalance: number;
  };
  performance: {
    rating: number;
    lastReviewDate: string;
    nextReviewDate: string;
    remarks: string;
  };
  documents: {
    aadharCard: string;
    panCard: string;
    bankPassbook: string;
    joiningLetter: string;
    offerLetter: string;
  };
  status: 'active' | 'inactive' | 'terminated' | 'resigned';
  terminationDate?: string;
  terminationReason?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAttendance {
  _id: string;
  employeeId: string;
  companyId: string;
  date: string;
  shiftType: 'day' | 'night' | 'general';
  checkIn: {
    time: string;
    location: string;
    method: 'biometric' | 'card' | 'manual' | 'mobile';
    verified: boolean;
  };
  checkOut: {
    time: string;
    location: string;
    method: 'biometric' | 'card' | 'manual' | 'mobile';
    verified: boolean;
  };
  breakTime: {
    startTime: string;
    endTime: string;
    duration: number;
    type: 'lunch' | 'tea' | 'other';
  }[];
  totalWorkingHours: number;
  overtimeHours: number;
  overtimeRate: number;
  overtimeAmount: number;
  status: 'present' | 'absent' | 'half-day' | 'leave' | 'holiday' | 'weekend';
  leaveType?: 'casual' | 'sick' | 'earned' | 'unpaid' | 'other';
  leaveReason?: string;
  leaveApprovedBy?: string;
  leaveApprovalStatus?: 'pending' | 'approved' | 'rejected';
  remarks?: string;
  isLate: boolean;
  lateMinutes: number;
  earlyDeparture: boolean;
  earlyDepartureMinutes: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IManpowerFormData {
  employeeId: string;
  name: string;
  designation: string;
  department: 'production' | 'packing' | 'quality' | 'maintenance' | 'admin' | 'sales' | 'purchase';
  employeeType: 'permanent' | 'contractor' | 'temporary';
  joiningDate: string;
  salary: {
    basic: number;
    hra: number;
    da: number;
    otherAllowances: number;
    total: number;
  };
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  contactInfo: {
    phone: string;
    email?: string;
    address: string;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  shiftDetails: {
    shiftType: 'day' | 'night' | 'general';
    startTime: string;
    endTime: string;
    overtimeEligible: boolean;
    overtimeRate: number;
  };
}

export interface IAttendanceFormData {
  employeeId: string;
  date: string;
  shiftType: 'day' | 'night' | 'general';
  checkIn: {
    time: string;
    location: string;
    method: 'biometric' | 'card' | 'manual' | 'mobile';
  };
  checkOut?: {
    time: string;
    location: string;
    method: 'biometric' | 'card' | 'manual' | 'mobile';
  };
  status: 'present' | 'absent' | 'half-day' | 'leave' | 'holiday' | 'weekend';
  leaveType?: 'casual' | 'sick' | 'earned' | 'unpaid' | 'other';
  leaveReason?: string;
  remarks?: string;
}

export interface IManpowerFilters {
  search?: string;
  department?: string;
  status?: string;
  employeeType?: string;
  companyId?: string;
  page?: number;
  limit?: number;
}

export interface IAttendanceFilters {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  status?: string;
  companyId?: string;
  page?: number;
  limit?: number;
}

export interface IManpowerStats {
  totalEmployees: number;
  activeEmployees: number;
  productionStaff: number;
  newThisMonth: number;
  byDepartment: Record<string, number>;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}

export interface IAttendanceStats {
  totalRecords: number;
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  totalWorkingHours: number;
  totalOvertimeHours: number;
  averageWorkingHours: number;
  averageOvertimeHours: number;
}




