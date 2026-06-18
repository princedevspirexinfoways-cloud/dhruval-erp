export interface IEmployee {
  _id: string;
  companyId: string;
  employeeCode: string;
  employeeId: string;
  personalInfo: IEmployeePersonalInfo;
  contactInfo: IEmployeeContactInfo;
  addresses: IEmployeeAddresses;
  identityDocuments: IEmployeeIdentityDocuments;
  employmentInfo: IEmployeeEmploymentInfo;
  salaryInfo: IEmployeeSalary[];
  skills: IEmployeeSkill[];
  certifications: IEmployeeCertification[];
  shifts: IEmployeeShift[];
  performanceRecords: IEmployeePerformance[];
  bankInfo: IEmployeeBankInfo;
  governmentRegistrations: IEmployeeGovernmentRegistrations;
  notes?: string;
  tags: string[];
  customFields?: any;
  attachments: string[];
  employmentStatus: 'active' | 'inactive' | 'terminated' | 'resigned' | 'retired';
  createdBy: string;
  lastModifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IEmployeePersonalInfo {
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName?: string;
  fatherName?: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  bloodGroup?: string;
  profilePhoto?: string;
  signature?: string;
}

export interface IEmployeeContactInfo {
  primaryPhone: string;
  alternatePhone?: string;
  email?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship?: string;
}

export interface IEmployeeAddresses {
  permanentAddress: IEmployeeAddress;
  currentAddress: IEmployeeAddress;
}

export interface IEmployeeAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface IEmployeeIdentityDocuments {
  aadharNumber: string;
  panNumber: string;
  passportNumber?: string;
  passportExpiryDate?: string;
  drivingLicenseNumber?: string;
  drivingLicenseExpiryDate?: string;
}

export interface IEmployeeEmploymentInfo {
  designation: string;
  department: string;
  reportingManagerId?: string;
  reportingManagerName?: string;
  employmentType: 'permanent' | 'contract' | 'temporary' | 'intern';
  salaryType: 'monthly' | 'daily' | 'hourly' | 'piece_rate';
  joiningDate: string;
  confirmationDate?: string;
  resignationDate?: string;
  lastWorkingDate?: string;
  noticePeriod: number;
  probationPeriod: number;
}

export interface IEmployeeSalary {
  basicSalary: number;
  hra: number;
  da: number;
  otherAllowances: number;
  pfDeduction: number;
  esiDeduction: number;
  otherDeductions: number;
  effectiveDate: string;
  isActive: boolean;
}

export interface IEmployeeSkill {
  skillName: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
  certification?: string;
  certificationDate?: string;
  expiryDate?: string;
  isActive: boolean;
}

export interface IEmployeeCertification {
  certificationName: string;
  issuingAuthority: string;
  certificationNumber: string;
  issueDate: string;
  expiryDate?: string;
  isActive: boolean;
  documentUrl?: string;
  notes?: string;
}

export interface IEmployeeShift {
  shiftId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  isNightShift: boolean;
  effectiveDate: string;
  isActive: boolean;
}

export interface IEmployeePerformance {
  reviewPeriod: string;
  reviewDate: string;
  performanceRating: number;
  strengths: string[];
  areasOfImprovement: string[];
  goals: string[];
  achievements: string[];
  reviewerId: string;
  reviewerName: string;
  reviewNotes?: string;
  nextReviewDate?: string;
  isActive: boolean;
}

export interface IEmployeeBankInfo {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName?: string;
  accountType: 'savings' | 'current';
}

export interface IEmployeeGovernmentRegistrations {
  pfNumber?: string;
  esiNumber?: string;
  uanNumber?: string;
  esicNumber?: string;
}

export interface IEmployeeFormData {
  personalInfo: Omit<IEmployeePersonalInfo, 'fullName'>;
  contactInfo: IEmployeeContactInfo;
  addresses: IEmployeeAddresses;
  identityDocuments: IEmployeeIdentityDocuments;
  employmentInfo: IEmployeeEmploymentInfo;
  salaryInfo: Omit<IEmployeeSalary, 'isActive'>[];
  skills: IEmployeeSkill[];
  certifications: IEmployeeCertification[];
  shifts: Omit<IEmployeeShift, 'isActive'>[];
  bankInfo: IEmployeeBankInfo;
  governmentRegistrations: IEmployeeGovernmentRegistrations;
  notes?: string;
  tags: string[];
}
