import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface IPasswordResetToken extends Document {
  userId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  token: string;
  email: string;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  isExpired: boolean;
  isValid: boolean;
  markAsUsed(): Promise<void>;
}

export interface IPasswordResetTokenModel extends mongoose.Model<IPasswordResetToken> {
  generateToken(): string;
  createResetToken(userId: mongoose.Types.ObjectId, companyId: mongoose.Types.ObjectId, email: string, ipAddress?: string, userAgent?: string): Promise<IPasswordResetToken>;
  verifyToken(token: string): Promise<IPasswordResetToken | null>;
  cleanupExpired(): Promise<number>;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
  },
  used: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries and automatic cleanup
passwordResetTokenSchema.index({ token: 1 });
passwordResetTokenSchema.index({ userId: 1 });
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for checking if token is expired
passwordResetTokenSchema.virtual('isExpired').get(function(this: IPasswordResetToken) {
  return this.expiresAt < new Date();
});

// Virtual for checking if token is valid
passwordResetTokenSchema.virtual('isValid').get(function(this: IPasswordResetToken) {
  return !this.used && !this.isExpired;
});

// Static method to generate secure token
passwordResetTokenSchema.statics.generateToken = function(): string {
  return crypto.randomBytes(32).toString('hex');
};

// Static method to create reset token
passwordResetTokenSchema.statics.createResetToken = async function(
  this: IPasswordResetTokenModel,
  userId: mongoose.Types.ObjectId,
  companyId: mongoose.Types.ObjectId,
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<IPasswordResetToken> {
  // Remove any existing tokens for this user in this company
  await this.deleteMany({ userId, companyId });

  const token = this.generateToken();

  const resetToken = new this({
    userId,
    companyId,
    email,
    token,
    ipAddress,
    userAgent
  });
  
  await resetToken.save();
  return resetToken;
};

// Method to mark token as used
passwordResetTokenSchema.methods.markAsUsed = async function(this: IPasswordResetToken): Promise<void> {
  this.used = true;
  this.usedAt = new Date();
  await this.save();
};

// Static method to verify and get valid token
passwordResetTokenSchema.statics.verifyToken = async function(
  this: IPasswordResetTokenModel,
  token: string
): Promise<IPasswordResetToken | null> {
  const resetToken = await this.findOne({ token }).populate('userId');
  
  if (!resetToken || !resetToken.isValid) {
    return null;
  }
  
  return resetToken;
};

// Static method to cleanup expired tokens (can be called by cron job)
passwordResetTokenSchema.statics.cleanupExpired = async function(this: IPasswordResetTokenModel): Promise<number> {
  const result = await this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { used: true, usedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Remove used tokens older than 24 hours
    ]
  });
  return result.deletedCount || 0;
};

// Compound indexes for company-wise data isolation
passwordResetTokenSchema.index({ companyId: 1, userId: 1 });
passwordResetTokenSchema.index({ companyId: 1, token: 1 });
passwordResetTokenSchema.index({ companyId: 1, expiresAt: 1 });

export default mongoose.model<IPasswordResetToken, IPasswordResetTokenModel>('PasswordResetToken', passwordResetTokenSchema);
