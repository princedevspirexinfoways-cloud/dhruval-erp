import jwt from 'jsonwebtoken';
import { Response } from 'express';
import config from '../config/environment';


export interface JWTPayload {
  userId: string;
  username: string;
  email?: string;
  isSuperAdmin: boolean;
  companyId?: string;
  role?: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  iat: number;
  exp: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate JWT access token
 */
export const generateAccessToken = (payload: JWTPayload): string => {
  console.log('JWT: Generating access token for user:', payload.userId);
  
  const accessPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (15 * 24 * 60 * 60) // 15 days
  };
  
  const token = jwt.sign(accessPayload, config.JWT_SECRET, {
    issuer: config.JWT_ISSUER,
    audience: config.JWT_AUDIENCE
  });
  
  console.log('JWT: Access token generated successfully, length:', token.length);
  return token;
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
  const refreshPayload = {
    userId: payload.userId,
    tokenVersion: 1,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
  };
  
  console.log('JWT: Generating refresh token for user:', payload.userId);
  
  const token = jwt.sign(refreshPayload, config.JWT_REFRESH_SECRET, {
    issuer: config.JWT_ISSUER,
    audience: config.JWT_AUDIENCE
  });
  
  console.log('JWT: Refresh token generated successfully, length:', token.length);
  return token;
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = (payload: JWTPayload): TokenPair => {
  console.log('JWT: Generating token pair for user:', payload.userId);
  
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  
  console.log('JWT: Token pair generated successfully');
  
  return {
    accessToken,
    refreshToken
  };
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string, secret: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Verify JWT access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    console.log('JWT: Verifying access token, length:', token.length);
    
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE
    }) as JWTPayload;
    
    console.log('JWT: Access token verified successfully for user:', decoded.userId);
    return decoded;
  } catch (error) {
    console.error('JWT: Access token verification failed:', error);
    throw error;
  }
};

/**
 * Verify JWT refresh token
 */
export const verifyRefreshToken = async (token: string): Promise<RefreshTokenPayload | null> => {
  try {
    console.log('JWT: Verifying refresh token, length:', token.length);
    
    const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET, {
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE
    }) as RefreshTokenPayload;
    
    console.log('JWT: Refresh token verified successfully for user:', decoded.userId);
    return decoded;
  } catch (error) {
    console.error('JWT: Refresh token verification failed:', error);
    return null;
  }
};

/**
 * Set JWT tokens as HTTP-only cookies
 */
export const setTokenCookies = (res: Response, tokens: TokenPair): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isLocalhost = process.env.NODE_ENV === 'development';
  
  console.log('Setting JWT cookies:', {
    isProduction,
    isLocalhost,
    accessTokenLength: tokens.accessToken.length,
    refreshTokenLength: tokens.refreshToken.length,
    cookieOptions: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isLocalhost ? 'lax' : 'none', // Use 'none' for production cross-domain
      path: '/'
    }
  });
  
  // Cookie options based on environment
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // Only use secure in production (HTTPS)
    sameSite: (isLocalhost ? 'lax' : 'none') as 'lax' | 'none', // Use 'none' for production cross-domain
    path: '/',
    domain: isProduction ? config.COOKIE_DOMAIN : undefined, // Use configured domain in production
    maxAge: undefined // Let browser handle expiration
  };
  
  // Set access token cookie (15 days)
  res.cookie('accessToken', tokens.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 24 * 60 * 60 * 1000 // 15 days in milliseconds
  });

  // Set refresh token cookie (30 days)
  res.cookie('refreshToken', tokens.refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
  });
  
  // Also set a non-HTTP-only cookie for debugging (remove in production)
  if (isLocalhost) {
    res.cookie('debug_token', 'cookie_set', {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 1000 // 1 minute for debugging
    });
  }
  
  console.log('JWT cookies set successfully with options:', cookieOptions);
};

/**
 * Clear JWT cookies
 */
export const clearTokenCookies = (res: Response): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isLocalhost = process.env.NODE_ENV === 'development';
  
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isLocalhost ? 'lax' : 'none',
    path: '/',
    domain: isProduction ? config.COOKIE_DOMAIN : undefined
  });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isLocalhost ? 'lax' : 'none',
    path: '/',
    domain: isProduction ? config.COOKIE_DOMAIN : undefined
  });
};

/**
 * Extract token from request headers or cookies
 */
export const extractTokenFromRequest = (req: any): string | null => {
  // First try to get from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Then try to get from cookies
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};

/**
 * Get token payload from request
 */
export const getTokenPayload = (req: any): JWTPayload | null => {
  const token = extractTokenFromRequest(req);
  if (!token) {
    return null;
  }

  return verifyAccessToken(token);
};
