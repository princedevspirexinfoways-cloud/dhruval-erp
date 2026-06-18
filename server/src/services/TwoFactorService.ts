import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import TwoFactor, { ITwoFactor } from '../models/TwoFactor';
import User from '../models/User';
import mongoose from 'mongoose';

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorStatusResponse {
  isEnabled: boolean;
  backupCodesCount: number;
  lastUsed?: Date;
}

export interface TwoFactorEnableResponse {
  backupCodes: string[];
  message: string;
}

export interface TwoFactorTestResponse {
  verified: boolean;
  message: string;
}

export class TwoFactorService {
  /**
   * Generate 2FA secret and QR code for user
   */
  static async setupTwoFactor(userId: string | mongoose.Types.ObjectId): Promise<TwoFactorSetupResponse> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate secret with shorter length to reduce QR code data
      const secret = speakeasy.generateSecret({
        name: `ERP (${user.email?.split('@')[0] || 'User'})`,
        issuer: 'ERP',
        length: 16 // Shorter length for smaller QR code
      });

      // Check if 2FA record exists (user-level only)
      let twoFactor = await TwoFactor.findOne({ userId });

      if (!twoFactor) {
        twoFactor = new TwoFactor({
          userId,
          secret: secret.base32,
          isEnabled: false
        });
      } else {
        // Update secret for re-setup
        twoFactor.secret = secret.base32;
        twoFactor.isEnabled = false;
        twoFactor.setupAt = new Date();
      }

      await twoFactor.save();

      // Generate minimal TOTP URL for QR code compatibility
      const serviceName = 'ERP';
      const accountName = user.email?.split('@')[0] || user.username || 'User';

      // Create minimal otpauth URL to avoid "Data too long" error
      const otpAuthUrl = `otpauth://totp/${accountName}?secret=${secret.base32}&issuer=${serviceName}`;

      console.log('Generated TOTP URL:', otpAuthUrl);
      console.log('URL length:', otpAuthUrl.length);
      console.log('Secret length:', secret.base32!.length);

      try {
        // Generate QR code with optimized settings to avoid "Data too long" error
        const qrCodeUrl: string = await QRCode.toDataURL(otpAuthUrl, {
          errorCorrectionLevel: 'L', // Low error correction for smaller data
          margin: 2, // Smaller margin
          width: 200, // Smaller size
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        console.log('QR Code generated successfully');
        return {
          secret: secret.base32!,
          qrCodeUrl,
          backupCodes: [] // Will be generated when 2FA is enabled
        };
      } catch (qrError) {
        console.error('QR Code generation failed:', qrError);

        // Fallback: try with simpler URL format
        try {
          const simpleUrl = `otpauth://totp/${encodeURIComponent(accountName)}?secret=${secret.base32}&issuer=${encodeURIComponent(serviceName)}`;
          const fallbackQrCodeUrl: string = await QRCode.toDataURL(simpleUrl, {
            errorCorrectionLevel: 'L',
            margin: 2,
            width: 200
          });

          console.log('Fallback QR Code generated successfully');
          return {
            secret: secret.base32!,
            qrCodeUrl: fallbackQrCodeUrl,
            backupCodes: []
          };
        } catch (fallbackError) {
          console.error('Fallback QR Code generation also failed:', fallbackError);
          return {
            secret: secret.base32!,
            qrCodeUrl: '', // Empty QR code URL - will show manual entry only
            backupCodes: []
          };
        }
      }
    } catch (error: any) {
      throw new Error(`Failed to setup 2FA: ${error.message}`);
    }
  }

  /**
   * Verify token and enable 2FA
   */
  static async enableTwoFactor(userId: string | mongoose.Types.ObjectId, token: string): Promise<TwoFactorEnableResponse> {
    try {
      const twoFactor = await TwoFactor.findOne({ userId });
      if (!twoFactor) {
        throw new Error('2FA not set up. Please set up 2FA first.');
      }

      if (twoFactor.isEnabled) {
        throw new Error('2FA is already enabled');
      }

      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: twoFactor.secret,
        encoding: 'base32',
        token,
        window: 2 // Allow 2 time steps (60 seconds) tolerance
      });

      if (!verified) {
        throw new Error('Invalid verification code');
      }

      // Generate backup codes
      const backupCodes = await twoFactor.generateBackupCodes();

      // Enable 2FA
      await twoFactor.enable();

      return {
        backupCodes,
        message: '2FA enabled successfully'
      };
    } catch (error: any) {
      throw new Error(`Failed to enable 2FA: ${error.message}`);
    }
  }

  /**
   * Disable 2FA
   */
  static async disableTwoFactor(
    userId: string | mongoose.Types.ObjectId,
    password: string,
    token?: string
  ): Promise<{ message: string }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      const twoFactor = await TwoFactor.findOne({ userId });
      if (!twoFactor || !twoFactor.isEnabled) {
        throw new Error('2FA is not enabled');
      }

      // If token provided, verify it
      if (token) {
        const verified = await this.verifyToken(userId, token);
        if (!verified) {
          throw new Error('Invalid 2FA token');
        }
      }

      // Disable 2FA
      await twoFactor.disable();

      return {
        message: '2FA disabled successfully'
      };
    } catch (error: any) {
      throw new Error(`Failed to disable 2FA: ${error.message}`);
    }
  }

  /**
   * Verify 2FA token
   */
  static async verifyToken(
    userId: string | mongoose.Types.ObjectId,
    token: string,
    isBackupCode: boolean = false
  ): Promise<boolean> {
    try {
      const twoFactor = await TwoFactor.findOne({ userId });
      if (!twoFactor || !twoFactor.isEnabled) {
        return false;
      }

      // Check if account is locked
      if (twoFactor.isLocked) {
        throw new Error('Account temporarily locked due to too many failed attempts');
      }

      let verified = false;

      if (isBackupCode) {
        // Verify backup code
        verified = await twoFactor.verifyBackupCode(token);
      } else {
        // Verify TOTP token
        verified = speakeasy.totp.verify({
          secret: twoFactor.secret,
          encoding: 'base32',
          token,
          window: 2
        });
      }

      if (verified) {
        // Reset failed attempts on successful verification
        await twoFactor.resetFailedAttempts();
        twoFactor.lastUsed = new Date();
        await twoFactor.save();
        return true;
      } else {
        // Handle failed attempt
        await twoFactor.handleFailedAttempt();
        return false;
      }
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get 2FA status for user
   */
  static async getTwoFactorStatus(userId: string | mongoose.Types.ObjectId): Promise<TwoFactorStatusResponse> {
    try {
      const twoFactor = await TwoFactor.findOne({ userId });
      
      if (!twoFactor) {
        return {
          isEnabled: false,
          backupCodesCount: 0,
          lastUsed: undefined
        };
      }

      return {
        isEnabled: twoFactor.isEnabled,
        backupCodesCount: twoFactor.getUnusedBackupCodesCount(),
        lastUsed: twoFactor.lastUsed
      };
    } catch (error: any) {
      throw new Error(`Failed to get 2FA status: ${error.message}`);
    }
  }

  /**
   * Generate new backup codes
   */
  static async generateBackupCodes(
    userId: string | mongoose.Types.ObjectId,
    password: string
  ): Promise<TwoFactorEnableResponse> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      const twoFactor = await TwoFactor.findOne({ userId });
      if (!twoFactor || !twoFactor.isEnabled) {
        throw new Error('2FA is not enabled');
      }

      // Generate new backup codes
      const backupCodes = await twoFactor.generateBackupCodes();
      await twoFactor.save();

      return {
        backupCodes,
        message: 'New backup codes generated successfully'
      };
    } catch (error: any) {
      throw new Error(`Failed to generate backup codes: ${error.message}`);
    }
  }

  /**
   * Test 2FA token during setup
   */
  static async testToken(secret: string, token: string): Promise<TwoFactorTestResponse> {
    try {
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2
      });

      return {
        verified,
        message: verified ? 'Token verified successfully' : 'Invalid token'
      };
    } catch (error: any) {
      throw new Error(`Failed to test token: ${error.message}`);
    }
  }

  /**
   * Check if user has 2FA enabled
   */
  static async isUserTwoFactorEnabled(userId: string | mongoose.Types.ObjectId): Promise<boolean> {
    try {
      const twoFactor = await TwoFactor.findOne({ userId });
      return twoFactor ? twoFactor.isEnabled : false;
    } catch (error: any) {
      return false;
    }
  }
}

export default TwoFactorService;
