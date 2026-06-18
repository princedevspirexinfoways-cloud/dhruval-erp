import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/errors';

interface Permission {
  resource: string;
  action: string;
}

interface UserWithPermissions {
  id: string;
  companyId: string | any; // Allow ObjectId type
  role?: string;
  permissions?: Permission[];
  isSuperAdmin?: boolean;
}

/**
 * Middleware to check if user has required permission
 */
export const requirePermission = (resource: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as any;

      if (!user) {
        throw new AppError('Authentication required', 401);
      }

      // Super admin has all permissions
      if (user.isSuperAdmin) {
        return next();
      }

      // Check if user has the required permission
      const hasPermission = user.permissions?.some(
        permission => permission.resource === resource && permission.action === action
      );

      if (!hasPermission) {
        throw new AppError(`Insufficient permissions: ${resource}:${action}`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has any of the required permissions
 */
export const requireAnyPermission = (permissions: Array<{ resource: string; action: string }>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as any;

      if (!user) {
        throw new AppError('Authentication required', 401);
      }

      // Super admin has all permissions
      if (user.isSuperAdmin) {
        return next();
      }

      // Check if user has any of the required permissions
      const hasAnyPermission = permissions.some(({ resource, action }) =>
        user.permissions?.some(
          permission => permission.resource === resource && permission.action === action
        )
      );

      if (!hasAnyPermission) {
        const requiredPermissions = permissions.map(p => `${p.resource}:${p.action}`).join(' or ');
        throw new AppError(`Insufficient permissions: ${requiredPermissions}`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has all required permissions
 */
export const requireAllPermissions = (permissions: Array<{ resource: string; action: string }>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as any;

      if (!user) {
        throw new AppError('Authentication required', 401);
      }

      // Super admin has all permissions
      if (user.isSuperAdmin) {
        return next();
      }

      // Check if user has all required permissions
      const hasAllPermissions = permissions.every(({ resource, action }) =>
        user.permissions?.some(
          permission => permission.resource === resource && permission.action === action
        )
      );

      if (!hasAllPermissions) {
        const requiredPermissions = permissions.map(p => `${p.resource}:${p.action}`).join(' and ');
        throw new AppError(`Insufficient permissions: ${requiredPermissions}`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
