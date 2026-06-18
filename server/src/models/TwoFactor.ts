import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IBackupCode {
  code: string;
  used: boolean;
  usedAt?: Date;
}

export interface ITwoFactor extends Document {
  userId: mongoose.Types.ObjectId;
  secret: string;
  isEnabled: boolean;
  backupCodes: IBackupCode[];
  lastUsed?: Date;
  setupAt?: Date;
  enabledAt?: Date;
  disabledAt?: Date;
  failedAttempts: number;
  lockedUntil?: Date;
  isLocked: boolean;
  generateBackupCodes(): Promise<string[]>;
  verifyBackupCode(inputCode: string): Promise<boolean>;
  getUnusedBackupCodesCount(): number;
  handleFailedAttempt(): Promise<void>;
  resetFailedAttempts(): Promise<void>;
  enable(): Promise<void>;
  disable(): Promise<void>;
}

const backupCodeSchema = new Schema<IBackupCode>({
  code: {
    type: String,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date
  }
});

const twoFactorSchema = new Schema<ITwoFactor>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    unique: true, // Each user can have only one 2FA record
  },
  secret: {
    type: String,
    required: true
  },
  isEnabled: {
    type: Boolean,
    default: false
  },
  backupCodes: [backupCodeSchema],
  lastUsed: {
    type: Date
  },
  setupAt: {
    type: Date
  },
  enabledAt: {
    type: Date
  },
  disabledAt: {
    type: Date
  },
  failedAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries (userId already has index: true above)
twoFactorSchema.index({ 'backupCodes.code': 1 });

// Virtual for checking if account is locked
twoFactorSchema.virtual('isLocked').get(function(this: ITwoFactor) {
  return !!(this.lockedUntil && this.lockedUntil > new Date());
});

// Method to generate backup codes
twoFactorSchema.methods.generateBackupCodes = async function(this: ITwoFactor): Promise<string[]> {
  const codes: string[] = [];
  const backupCodes: IBackupCode[] = [];
  
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const hashedCode = await bcrypt.hash(code, 12);
    codes.push(code);
    backupCodes.push({
      code: hashedCode,
      used: false
    });
  }
  
  this.backupCodes = backupCodes;
  return codes;
};

// Method to verify backup code
twoFactorSchema.methods.verifyBackupCode = async function(this: ITwoFactor, inputCode: string): Promise<boolean> {
  for (let i = 0; i < this.backupCodes.length; i++) {
    const backupCode = this.backupCodes[i];
    if (!backupCode.used && await bcrypt.compare(inputCode, backupCode.code)) {
      backupCode.used = true;
      backupCode.usedAt = new Date();
      await this.save();
      return true;
    }
  }
  return false;
};

// Method to get unused backup codes count
twoFactorSchema.methods.getUnusedBackupCodesCount = function(this: ITwoFactor): number {
  return this.backupCodes.filter(code => !code.used).length;
};

// Method to handle failed attempts
twoFactorSchema.methods.handleFailedAttempt = async function(this: ITwoFactor): Promise<void> {
  this.failedAttempts += 1;
  
  // Lock account after 5 failed attempts for 15 minutes
  if (this.failedAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  }
  
  await this.save();
};

// Method to reset failed attempts
twoFactorSchema.methods.resetFailedAttempts = async function(this: ITwoFactor): Promise<void> {
  this.failedAttempts = 0;
  this.lockedUntil = undefined;
  await this.save();
};

// Method to enable 2FA
twoFactorSchema.methods.enable = async function(this: ITwoFactor): Promise<void> {
  this.isEnabled = true;
  this.enabledAt = new Date();
  this.disabledAt = undefined;
  await this.save();
};

// Method to disable 2FA
twoFactorSchema.methods.disable = async function(this: ITwoFactor): Promise<void> {
  this.isEnabled = false;
  this.disabledAt = new Date();
  this.backupCodes = []; // Clear backup codes when disabled
  await this.save();
};

// Additional indexes for performance
twoFactorSchema.index({ isEnabled: 1 });

export default mongoose.model<ITwoFactor>('TwoFactor', twoFactorSchema);
