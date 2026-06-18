import { Schema, model } from 'mongoose';

// Document Metadata Schema
const DocumentMetadataSchema = new Schema({
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  fileSize: { type: Number, required: true, min: 0 }, // bytes
  mimeType: { type: String, required: true },
  fileExtension: { type: String, required: true },
  checksum: { type: String }, // MD5/SHA256 for integrity
  dimensions: {
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  duration: { type: Number, min: 0 }, // For video/audio files
  pages: { type: Number, min: 0 }, // For PDFs
  compression: { type: String },
  quality: { type: String, enum: ['low', 'medium', 'high', 'original'] }
}, { _id: false });

// Document Version Schema
const DocumentVersionSchema = new Schema({
  versionNumber: { type: Number, required: true, min: 1 },
  filePath: { type: String, required: true },
  fileSize: { type: Number, required: true, min: 0 },
  checksum: { type: String },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
  changeDescription: { type: String },
  isCurrentVersion: { type: Boolean, default: false }
}, { _id: false });

// Document Approval Schema
const DocumentApprovalSchema = new Schema({
  approvalLevel: { type: Number, required: true, min: 1 },
  approverRole: { type: String, required: true },
  approverId: { type: Schema.Types.ObjectId, ref: 'User' },
  approverName: { type: String },
  approverEmail: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'delegated'], 
    default: 'pending' 
  },
  requestedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  rejectedAt: { type: Date },
  comments: { type: String },
  rejectionReason: { type: String },
  delegatedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  delegatedAt: { type: Date },
  isUrgent: { type: Boolean, default: false },
  reminderSent: { type: Boolean, default: false },
  lastReminderSent: { type: Date }
}, { _id: false });

// Document Access Control Schema
const DocumentAccessSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String },
  userEmail: { type: String },
  accessLevel: { 
    type: String, 
    enum: ['view', 'download', 'edit', 'delete', 'approve'], 
    default: 'view' 
  },
  grantedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  grantedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
  lastAccessed: { type: Date },
  accessCount: { type: Number, default: 0 }
}, { _id: false });

// Document Management Schema
const DocumentManagementSchema = new Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  
  // Document Identification
  documentId: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  documentName: { type: String, required: true },
  documentDescription: { type: String },
  documentType: {
    type: String,
    enum: [
      'invoice', 'packing_list', 'courier_slip', 'fabric_photo', 'sample_image',
      'purchase_order', 'sales_order', 'contract', 'agreement', 'certificate',
      'quality_report', 'test_report', 'compliance_document', 'manual',
      'drawing', 'blueprint', 'specification', 'other'
    ],
    required: true
  },
  
  // Document Category
  category: {
    primary: { type: String, required: true },
    secondary: { type: String },
    tertiary: { type: String }
  },
  
  // Document Classification
  classification: {
    isConfidential: { type: Boolean, default: false },
    securityLevel: { type: String, enum: ['public', 'internal', 'confidential', 'restricted'], default: 'internal' },
    retentionPeriod: { type: Number, min: 0 }, // Days
    disposalMethod: { type: String, enum: ['archive', 'delete', 'shred', 'return'] },
    isRegulatory: { type: Boolean, default: false },
    regulatoryBody: { type: String },
    complianceRequired: { type: Boolean, default: false }
  },
  
  // Document Content
  content: {
    metadata: DocumentMetadataSchema,
    filePath: { type: String, required: true },
    thumbnailPath: { type: String }, // For images/videos
    previewPath: { type: String }, // For documents
    versions: [DocumentVersionSchema],
    currentVersion: { type: Number, default: 1 },
    isOCRProcessed: { type: Boolean, default: false },
    ocrText: { type: String }, // Extracted text for search
    keywords: [String], // For search optimization
    tags: [String]
  },
  
  // Document Relationships
  relationships: {
    parentDocument: { type: Schema.Types.ObjectId, ref: 'DocumentManagement' },
    childDocuments: [{ type: Schema.Types.ObjectId, ref: 'DocumentManagement' }],
    relatedOrders: [{ type: Schema.Types.ObjectId, ref: 'CustomerOrder' }],
    relatedInvoices: [{ type: Schema.Types.ObjectId, ref: 'Invoice' }],
    relatedDispatch: [{ type: Schema.Types.ObjectId, ref: 'Dispatch' }],
    relatedInventory: [{ type: Schema.Types.ObjectId, ref: 'InventoryItem' }],
    relatedCustomers: [{ type: Schema.Types.ObjectId, ref: 'Customer' }],
    relatedSuppliers: [{ type: Schema.Types.ObjectId, ref: 'Supplier' }]
  },
  
  // Document Status
  status: { 
    type: String, 
    enum: ['draft', 'pending_approval', 'approved', 'rejected', 'archived', 'expired'], 
    default: 'draft',
    index: true
  },
  
  // Approval Workflow
  approvalWorkflow: {
    isApprovalRequired: { type: Boolean, default: false },
    approvalType: { type: String, enum: ['single', 'sequential', 'parallel', 'any'] },
    currentApprovalLevel: { type: Number, default: 1 },
    totalApprovalLevels: { type: Number, default: 1 },
    approvals: [DocumentApprovalSchema],
    autoApprove: { type: Boolean, default: false },
    approvalDeadline: { type: Date },
    isOverdue: { type: Boolean, default: false }
  },
  
  // Document Lifecycle
  lifecycle: {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    lastModifiedAt: { type: Date },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    publishedAt: { type: Date },
    archivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    archivedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date },
    isDeleted: { type: Boolean, default: false }
  },
  
  // Access Control
  accessControl: {
    isPublic: { type: Boolean, default: false },
    accessList: [DocumentAccessSchema],
    allowedRoles: [String],
    allowedDepartments: [String],
    requiresAuthentication: { type: Boolean, default: true },
    watermarkRequired: { type: Boolean, default: false },
    downloadRestricted: { type: Boolean, default: false },
    printRestricted: { type: Boolean, default: false }
  },
  
  // Document Usage & Analytics
  analytics: {
    viewCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    lastViewed: { type: Date },
    lastDownloaded: { type: Date },
    lastShared: { type: Date },
    averageViewTime: { type: Number, default: 0 }, // seconds
    uniqueViewers: { type: Number, default: 0 },
    popularKeywords: [String],
    searchRanking: { type: Number, default: 0 }
  },
  
  // Document Processing
  processing: {
    isProcessed: { type: Boolean, default: false },
    processingStatus: { type: String, enum: ['pending', 'processing', 'completed', 'failed'] },
    processingStartedAt: { type: Date },
    processingCompletedAt: { type: Date },
    processingErrors: [String],
    processingNotes: { type: String },
    autoTagging: { type: Boolean, default: false },
    autoClassification: { type: Boolean, default: false }
  },
  
  // Document Storage
  storage: {
    storageProvider: { type: String, enum: ['local', 's3', 'azure', 'gcp', 'other'] },
    storagePath: { type: String, required: true },
    storageClass: { type: String, enum: ['standard', 'infrequent', 'archive', 'deep_archive'] },
    backupEnabled: { type: Boolean, default: true },
    backupFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    lastBackupAt: { type: Date },
    replicationEnabled: { type: Boolean, default: false },
    compressionEnabled: { type: Boolean, default: false },
    encryptionEnabled: { type: Boolean, default: true },
    encryptionType: { type: String, enum: ['AES-256', 'AES-128', 'other'] }
  },
  
  // Document Notifications
  notifications: {
    notifyOnView: { type: Boolean, default: false },
    notifyOnDownload: { type: Boolean, default: false },
    notifyOnShare: { type: Boolean, default: false },
    notifyOnExpiry: { type: Boolean, default: false },
    notifyOnApproval: { type: Boolean, default: true },
    notifyRecipients: [String], // Email addresses
    notificationFrequency: { type: String, enum: ['immediate', 'daily', 'weekly'] }
  },
  
  // Custom Fields
  customFields: { type: Schema.Types.Mixed },
  
  // Metadata
  language: { type: String, default: 'en' },
  country: { type: String, default: 'IN' },
  currency: { type: String, default: 'INR' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  notes: { type: String },
  externalReferences: [String]
});

// Indexes
DocumentManagementSchema.index({ companyId: 1, documentType: 1, status: 1 });
DocumentManagementSchema.index({ companyId: 1, 'category.primary': 1, 'category.secondary': 1 });
DocumentManagementSchema.index({ companyId: 1, 'relationships.relatedOrders': 1 });
DocumentManagementSchema.index({ companyId: 1, 'relationships.relatedInvoices': 1 });
DocumentManagementSchema.index({ companyId: 1, 'approvalWorkflow.isApprovalRequired': 1, 'approvalWorkflow.currentApprovalLevel': 1 });
DocumentManagementSchema.index({ companyId: 1, 'lifecycle.createdAt': -1 });
DocumentManagementSchema.index({ companyId: 1, 'content.keywords': 1 });
DocumentManagementSchema.index({ companyId: 1, 'content.tags': 1 });
DocumentManagementSchema.index({ companyId: 1, 'accessControl.allowedRoles': 1 });
DocumentManagementSchema.index({ companyId: 1, 'classification.isConfidential': 1, 'classification.securityLevel': 1 });

// Text search index
DocumentManagementSchema.index({ 
  documentName: 'text', 
  documentDescription: 'text', 
  'content.ocrText': 'text', 
  'content.keywords': 'text',
  'content.tags': 'text'
});

// Static methods
DocumentManagementSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId, 'lifecycle.isDeleted': false }).sort({ 'lifecycle.createdAt': -1 });
};

DocumentManagementSchema.statics.findByType = function(companyId: string, documentType: string) {
  return this.find({ companyId, documentType, 'lifecycle.isDeleted': false }).sort({ 'lifecycle.createdAt': -1 });
};

DocumentManagementSchema.statics.findPendingApproval = function(companyId: string) {
  return this.find({ 
    companyId, 
    'approvalWorkflow.isApprovalRequired': true,
    status: 'pending_approval',
    'lifecycle.isDeleted': false
  }).sort({ 'approvalWorkflow.approvalDeadline': 1 });
};

DocumentManagementSchema.statics.findOverdueApprovals = function(companyId: string) {
  return this.find({ 
    companyId, 
    'approvalWorkflow.isApprovalRequired': true,
    'approvalWorkflow.isOverdue': true,
    'lifecycle.isDeleted': false
  }).sort({ 'approvalWorkflow.approvalDeadline': 1 });
};

DocumentManagementSchema.statics.findByCategory = function(companyId: string, category: string) {
  return this.find({ 
    companyId, 
    'category.primary': category,
    'lifecycle.isDeleted': false
  }).sort({ 'lifecycle.createdAt': -1 });
};

DocumentManagementSchema.statics.searchDocuments = function(companyId: string, searchTerm: string) {
  return this.find({
    companyId,
    'lifecycle.isDeleted': false,
    $text: { $search: searchTerm }
  }, {
    score: { $meta: 'textScore' }
  }).sort({ score: { $meta: 'textScore' } });
};

// Instance methods
DocumentManagementSchema.methods.addVersion = function(filePath: string, uploadedBy: string, changeDescription?: string) {
  const newVersion = {
    versionNumber: this.content.currentVersion + 1,
    filePath,
    fileSize: 0, // Will be updated
    checksum: '',
    uploadedBy,
    uploadedAt: new Date(),
    changeDescription: changeDescription || `Version ${this.content.currentVersion + 1}`,
    isCurrentVersion: false
  };
  
  // Mark previous version as not current
  this.content.versions.forEach((version: any) => {
    version.isCurrentVersion = false;
  });
  
  newVersion.isCurrentVersion = true;
  this.content.currentVersion = newVersion.versionNumber;
  this.content.versions.push(newVersion);
  this.lifecycle.lastModifiedBy = uploadedBy;
  this.lifecycle.lastModifiedAt = new Date();
  
  return this.save();
};

DocumentManagementSchema.methods.requestApproval = function(approverId: string, approverRole: string, level: number = 1) {
  const approval = {
    approvalLevel: level,
    approverRole,
    approverId,
    status: 'pending',
    requestedAt: new Date()
  };
  
  this.approvalWorkflow.approvals.push(approval);
  this.status = 'pending_approval';
  this.approvalWorkflow.currentApprovalLevel = level;
  
  return this.save();
};

DocumentManagementSchema.methods.approve = function(approverId: string, comments?: string) {
  const approval = this.approvalWorkflow.approvals.find(
    (a: any) => a.approverId.toString() === approverId && a.status === 'pending'
  );
  
  if (approval) {
    approval.status = 'approved';
    approval.approvedAt = new Date();
    approval.comments = comments;
    
    // Check if all approvals are complete
    const pendingApprovals = this.approvalWorkflow.approvals.filter(
      (a: any) => a.status === 'pending'
    );
    
    if (pendingApprovals.length === 0) {
      this.status = 'approved';
      this.approvalWorkflow.currentApprovalLevel = this.approvalWorkflow.totalApprovalLevels;
    } else {
      this.approvalWorkflow.currentApprovalLevel += 1;
    }
  }
  
  return this.save();
};

DocumentManagementSchema.methods.reject = function(approverId: string, reason: string) {
  const approval = this.approvalWorkflow.approvals.find(
    (a: any) => a.approverId.toString() === approverId && a.status === 'pending'
  );
  
  if (approval) {
    approval.status = 'rejected';
    approval.rejectedAt = new Date();
    approval.rejectionReason = reason;
    this.status = 'rejected';
  }
  
  return this.save();
};

DocumentManagementSchema.methods.grantAccess = function(userId: string, accessLevel: string, grantedBy: string, expiresAt?: Date) {
  const existingAccess = this.accessControl.accessList.find(
    (a: any) => a.userId.toString() === userId
  );
  
  if (existingAccess) {
    existingAccess.accessLevel = accessLevel;
    existingAccess.expiresAt = expiresAt;
    existingAccess.isActive = true;
  } else {
    this.accessControl.accessList.push({
      userId,
      accessLevel,
      grantedBy,
      expiresAt,
      isActive: true
    });
  }
  
  return this.save();
};

DocumentManagementSchema.methods.revokeAccess = function(userId: string) {
  const access = this.accessControl.accessList.find(
    (a: any) => a.userId.toString() === userId
  );
  
  if (access) {
    access.isActive = false;
  }
  
  return this.save();
};

DocumentManagementSchema.methods.recordView = function(userId: string) {
  this.analytics.viewCount += 1;
  this.analytics.lastViewed = new Date();
  
  const access = this.accessControl.accessList.find(
    (a: any) => a.userId.toString() === userId
  );
  
  if (access) {
    access.lastAccessed = new Date();
    access.accessCount += 1;
  }
  
  return this.save();
};

DocumentManagementSchema.methods.recordDownload = function(userId: string) {
  this.analytics.downloadCount += 1;
  this.analytics.lastDownloaded = new Date();
  
  const access = this.accessControl.accessList.find(
    (a: any) => a.userId.toString() === userId
  );
  
  if (access) {
    access.lastAccessed = new Date();
    access.accessCount += 1;
  }
  
  return this.save();
};

// Pre-save middleware
DocumentManagementSchema.pre('save', function(next) {
  if (this.isModified('approvalWorkflow.approvals')) {
    // Update approval status
    const pendingApprovals = this.approvalWorkflow.approvals.filter(
      (a: any) => a.status === 'pending'
    );
    
    if (pendingApprovals.length === 0 && this.approvalWorkflow.approvals.length > 0) {
      this.status = 'approved';
    }
  }
  
  if (this.approvalWorkflow.approvalDeadline && new Date() > this.approvalWorkflow.approvalDeadline) {
    this.approvalWorkflow.isOverdue = true;
  }
  
  next();
});

export const DocumentManagement = model('DocumentManagement', DocumentManagementSchema);
export default DocumentManagement;
