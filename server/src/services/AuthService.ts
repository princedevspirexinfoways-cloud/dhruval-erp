import User from '../models/User';
import Company from '../models/Company';
import { logger } from '@/utils/logger';
import { generateTokenPair, setTokenCookies, clearTokenCookies, type JWTPayload } from '@/utils/jwt';

export interface LoginCredentials {
  username: string;
  password: string;
  companyCode?: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  companyCode: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

class AuthService {
  /**
   * User login with validation and security checks
   */
  async login(credentials: LoginCredentials, req: any, res: any): Promise<AuthResponse> {
    try {
      const { username, password, companyCode } = credentials;

      console.log('AuthService: Login attempt for username:', username);

      // Find user by username, email, or phone
      const user = await User.findOne({
        $or: [
          { username: username.toLowerCase() },
          { email: username.toLowerCase() },
          { 'personalInfo.phone': username }
        ],
        isActive: true
      });

      if (!user) {
        console.log('AuthService: User not found for username:', username);
        logger.warn('Login attempt with invalid username', {
          username,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        return {
          success: false,
          error: 'Invalid credentials',
          message: 'Username or password is incorrect'
        };
      }

      console.log('AuthService: User found:', user.username, 'ID:', user._id);

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        console.log('AuthService: Invalid password for user:', user.username);
        logger.warn('Login attempt with invalid password', {
          userId: user._id,
          username: user.username,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        return {
          success: false,
          error: 'Invalid credentials',
          message: 'Username or password is incorrect'
        };
      }

      console.log('AuthService: Password verified successfully for user:', user.username);

      // Log successful login
      logger.info('Successful login', {
        userId: user._id,
        username: user.username,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Generate JWT tokens
      const tokenPayload: JWTPayload = {
        userId: user._id.toString(),
        username: user.username,
        email: user.email || undefined,
        isSuperAdmin: user.isSuperAdmin || false,
        companyId: user.primaryCompanyId?.toString(),
        role: user.companyAccess?.[0]?.role || 'user'
      };

      console.log('AuthService: Generating tokens for user:', user._id);

      const tokens = generateTokenPair(tokenPayload);

      console.log('AuthService: Generated tokens:', {
        accessTokenLength: tokens.accessToken.length,
        refreshTokenLength: tokens.refreshToken.length,
        userId: user._id
      });

      // Set tokens as HTTP-only cookies
      console.log('AuthService: Setting cookies...');
      setTokenCookies(res, tokens);

      console.log('AuthService: Cookies set, preparing response');

      // Remove sensitive data from response
      const userResponse = user.toObject();
      delete userResponse.password;

      console.log('AuthService: Login successful, returning response');

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          tokens: {
            accessToken: tokens.accessToken,
            expiresIn: '15d'
          }
        }
      };

    } catch (error) {
      console.error('AuthService: Error in login service:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Login failed'
      };
    }
  }

  /**
   * User logout - clear cookies
   */
  async logout(req: any, res: any): Promise<AuthResponse> {
    try {
      // Clear JWT cookies
      clearTokenCookies(res);

      logger.info('User logged out', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return {
        success: true,
        message: 'Logout successful'
      };
    } catch (error) {
      logger.error('Error in logout service:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Logout failed'
      };
    }
  }

  /**
   * User registration with company creation
   */
  async register(registerData: RegisterData, req: any): Promise<AuthResponse> {
    try {
      const {
        username,
        email,
        password,
        firstName,
        lastName,
        phone,
        companyCode
      } = registerData;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { username: username.toLowerCase() },
          { email: email.toLowerCase() }
        ]
      });

      if (existingUser) {
        logger.warn('Registration attempt with existing credentials', {
          username,
          email,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        return {
          success: false,
          error: 'User already exists',
          message: 'A user with this username or email already exists'
        };
      }

      // Check if company exists
      let company = await Company.findOne({ companyCode: companyCode.toUpperCase() });
      
      if (!company) {
        // Create new company if it doesn't exist
        company = new Company({
          companyCode: companyCode.toUpperCase(),
          companyName: `${firstName} ${lastName} Company`,
          legalName: `${firstName} ${lastName} Company`,
          isActive: true
        });

        await company.save();
      }

      // Create new user
      const user = new User({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password,
        personalInfo: {
          firstName,
          lastName,
          phone,
          displayName: `${firstName} ${lastName}`
        },
        companyAccess: [{
          companyId: company._id,
          role: 'admin',
          isActive: true,
          joinedAt: new Date()
        }],
        primaryCompanyId: company._id,
        isActive: true
      });

      await user.save();

      // Log successful registration
      logger.info('User registration successful', {
        userId: user._id,
        username: user.username,
        companyId: company._id,
        companyCode: company.companyCode,
        ip: req.ip
      });

      // Remove sensitive data from response
      const userResponse = user.toObject();
      delete userResponse.password;

      return {
        success: true,
        message: 'Registration successful',
        data: {
          user: userResponse,
          company: {
            _id: company._id,
            companyCode: company.companyCode,
            companyName: company.companyName
          }
        }
      };

    } catch (error) {
      logger.error('Error in registration service:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Registration failed'
      };
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      console.log('AuthService: Processing refresh token request');
      
      // Verify the refresh token
      const decoded = await this.verifyRefreshToken(refreshToken);
      
      if (!decoded) {
        console.log('AuthService: Invalid refresh token');
        return {
          success: false,
          error: 'Invalid refresh token',
          message: 'Refresh token is invalid or expired'
        };
      }

      console.log('AuthService: Refresh token verified for user:', decoded.userId);

      // Get user from database
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user || !user.isActive) {
        console.log('AuthService: User not found or inactive:', decoded.userId);
        return {
          success: false,
          error: 'User not found',
          message: 'User account is inactive or not found'
        };
      }

      console.log('AuthService: User found:', user.username);

      // Generate new access token
      const tokenPayload: JWTPayload = {
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin || false,
        companyId: user.primaryCompanyId?.toString(),
        role: user.companyAccess?.[0]?.role || 'user'
      };

      const newAccessToken = generateTokenPair(tokenPayload).accessToken;

      // Log successful token refresh
      console.log('AuthService: Token refresh successful for user:', user.username);

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          expiresIn: '15d',
          userId: user._id.toString()
        }
      };

    } catch (error) {
      console.error('AuthService: Error refreshing token:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Token refresh failed'
      };
    }
  }

  /**
   * Verify refresh token
   */
  private async verifyRefreshToken(token: string): Promise<any> {
    try {
      // Use the proper JWT verification function from the jwt utility
      const { verifyRefreshToken } = require('@/utils/jwt');
      const decoded = verifyRefreshToken(token);
      return decoded;
    } catch (error) {
      console.error('AuthService: Error verifying refresh token:', error);
      return null;
    }
  }


}

export default new AuthService(); 
