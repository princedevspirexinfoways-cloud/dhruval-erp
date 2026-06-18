import { Types } from 'mongoose';
import { BaseService } from './BaseService';
import { Role } from '../models';
import { IRole } from '../types/models';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class RoleService extends BaseService<IRole> {
  constructor() {
    super(Role);
  }

  /**
   * Create a new role
   */
  async createRole(roleData: Partial<IRole>, createdBy?: string): Promise<IRole> {
    try {
      // Validate role data
      this.validateRoleData(roleData);

      // Check if role name already exists
      const existingRole = await this.findOne({ 
        roleName: roleData.roleName,
        companyId: roleData.companyId 
      });

      if (existingRole) {
        throw new AppError('Role name already exists', 400);
      }

      const role = await this.create({
        ...roleData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }, createdBy);

      logger.info('Role created successfully', { 
        roleId: role._id, 
        roleName: role.roleName,
        companyId: roleData.companyId,
        createdBy 
      });

      return role;
    } catch (error) {
      logger.error('Error creating role', { error, roleData, createdBy });
      throw error;
    }
  }

  /**
   * Get role by name
   */
  async getRoleByName(roleName: string, companyId: string): Promise<IRole | null> {
    try {
      return await this.findOne({ 
        roleName,
        companyId: new Types.ObjectId(companyId)
      });
    } catch (error) {
      logger.error('Error getting role by name', { error, roleName, companyId });
      throw error;
    }
  }

  /**
   * Get roles by company
   */
  async getRolesByCompany(companyId: string, options: any = {}): Promise<IRole[]> {
    try {
      const query = { 
        companyId: new Types.ObjectId(companyId),
        isActive: true
      };

      return await this.findMany(query, options);
    } catch (error) {
      logger.error('Error getting roles by company', { error, companyId });
      throw error;
    }
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(
    roleId: string, 
    permissions: string[],
    updatedBy?: string
  ): Promise<IRole | null> {
    try {
      const role = await this.findById(roleId);
      if (!role) {
        throw new AppError('Role not found', 404);
      }

      const updatedRole = await this.update(roleId, {
        permissions,
        lastPermissionUpdate: new Date()
      }, updatedBy);

      logger.info('Role permissions updated', { 
        roleId, 
        permissions: permissions.length,
        updatedBy 
      });

      return updatedRole;
    } catch (error) {
      logger.error('Error updating role permissions', { error, roleId, permissions, updatedBy });
      throw error;
    }
  }

  /**
   * Check if role has permission
   */
  async hasPermission(roleId: string, permission: string): Promise<boolean> {
    try {
      const role = await this.findById(roleId);
      if (!role || !role.isActive) {
        return false;
      }

      // Check if permission exists in any of the permission categories
      const permissionCategories = Object.values(role.permissions);
      return permissionCategories.some(category =>
        typeof category === 'object' && category !== null &&
        Object.values(category).some(perm =>
          typeof perm === 'object' && perm !== null &&
          Object.values(perm).includes(true)
        )
      );
    } catch (error) {
      logger.error('Error checking role permission', { error, roleId, permission });
      return false;
    }
  }

  /**
   * Get users with role
   */
  async getUsersWithRole(roleId: string): Promise<any[]> {
    try {
      // This would typically involve aggregating with User collection
      // For now, returning empty array as placeholder
      return [];
    } catch (error) {
      logger.error('Error getting users with role', { error, roleId });
      throw error;
    }
  }

  /**
   * Clone role
   */
  async cloneRole(
    roleId: string, 
    newRoleName: string,
    clonedBy?: string
  ): Promise<IRole> {
    try {
      const originalRole = await this.findById(roleId);
      if (!originalRole) {
        throw new AppError('Original role not found', 404);
      }

      // Check if new role name already exists
      const existingRole = await this.findOne({ 
        roleName: newRoleName,
        companyId: originalRole.companyId 
      });

      if (existingRole) {
        throw new AppError('Role name already exists', 400);
      }

      const clonedRole = await this.create({
        companyId: originalRole.companyId,
        roleName: newRoleName,
        description: `Cloned from ${originalRole.roleName}`,
        permissions: { ...originalRole.permissions },
        roleType: originalRole.roleType,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }, clonedBy);

      logger.info('Role cloned successfully', { 
        originalRoleId: roleId,
        clonedRoleId: clonedRole._id,
        newRoleName,
        clonedBy 
      });

      return clonedRole;
    } catch (error) {
      logger.error('Error cloning role', { error, roleId, newRoleName, clonedBy });
      throw error;
    }
  }

  /**
   * Get role statistics
   */
  async getRoleStats(companyId: string): Promise<any> {
    try {
      const [
        totalRoles,
        activeRoles,
        rolesByType,
        rolesWithUsers
      ] = await Promise.all([
        this.count({ companyId: new Types.ObjectId(companyId) }),
        this.count({ companyId: new Types.ObjectId(companyId), isActive: true }),
        this.model.aggregate([
          { $match: { companyId: new Types.ObjectId(companyId), isActive: true } },
          { $group: { _id: '$roleType', count: { $sum: 1 } } }
        ]),
        // This would typically involve aggregating with User collection
        Promise.resolve([])
      ]);

      return {
        totalRoles,
        activeRoles,
        rolesByType,
        rolesWithUsers: rolesWithUsers.length
      };
    } catch (error) {
      logger.error('Error getting role statistics', { error, companyId });
      throw error;
    }
  }

  /**
   * Validate role data
   */
  private validateRoleData(roleData: Partial<IRole>): void {
    if (!roleData.companyId) {
      throw new AppError('Company ID is required', 400);
    }

    if (!roleData.roleName) {
      throw new AppError('Role name is required', 400);
    }

    if (!roleData.permissions || Object.keys(roleData.permissions).length === 0) {
      throw new AppError('At least one permission is required', 400);
    }

    if (!roleData.roleType) {
      throw new AppError('Role type is required', 400);
    }

    const validRoleTypes = ['system', 'custom', 'department'];
    if (!validRoleTypes.includes(roleData.roleType)) {
      throw new AppError('Invalid role type', 400);
    }
  }
}
