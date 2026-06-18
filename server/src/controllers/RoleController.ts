import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { RoleService } from '../services/RoleService';
import { IRole } from '../types/models';

export class RoleController extends BaseController<IRole> {
  private roleService: RoleService;

  constructor() {
    const roleService = new RoleService();
    super(roleService, 'Role');
    this.roleService = roleService;
  }

  /**
   * Create a new role
   */
  async createRole(req: Request, res: Response): Promise<void> {
    try {
      const roleData = req.body;
      const createdBy = (req.user?.userId || req.user?._id)?.toString();

      const role = await this.roleService.createRole(roleData, createdBy);

      this.sendSuccess(res, role, 'Role created successfully', 201);
    } catch (error) {
      this.sendError(res, error, 'Failed to create role');
    }
  }

  /**
   * Get role by name
   */
  async getRoleByName(req: Request, res: Response): Promise<void> {
    try {
      const { roleName } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const role = await this.roleService.getRoleByName(roleName, companyId.toString());

      if (!role) {
        this.sendError(res, new Error('Role not found'), 'Role not found', 404);
        return;
      }

      this.sendSuccess(res, role, 'Role retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get role');
    }
  }

  /**
   * Get roles by company
   */
  async getRolesByCompany(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { page = 1, limit = 10, search, roleType } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const options: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      if (search) {
        options.search = search;
      }

      if (roleType) {
        options.roleType = roleType;
      }

      const roles = await this.roleService.getRolesByCompany(companyId.toString(), options);

      this.sendSuccess(res, roles, 'Roles retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get roles');
    }
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(req: Request, res: Response): Promise<void> {
    try {
      const { roleId } = req.params;
      const { permissions } = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const role = await this.roleService.updateRolePermissions(roleId, permissions, updatedBy);

      this.sendSuccess(res, role, 'Role permissions updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update role permissions');
    }
  }

  /**
   * Check if role has permission
   */
  async checkPermission(req: Request, res: Response): Promise<void> {
    try {
      const { roleId } = req.params;
      const { permission } = req.query;

      if (!permission) {
        this.sendError(res, new Error('Permission is required'), 'Permission is required', 400);
        return;
      }

      const hasPermission = await this.roleService.hasPermission(roleId, permission as string);

      this.sendSuccess(res, { hasPermission }, 'Permission check completed');
    } catch (error) {
      this.sendError(res, error, 'Failed to check permission');
    }
  }

  /**
   * Clone role
   */
  async cloneRole(req: Request, res: Response): Promise<void> {
    try {
      const { roleId } = req.params;
      const { newRoleName } = req.body;
      const clonedBy = (req.user?.userId || req.user?._id)?.toString();

      const clonedRole = await this.roleService.cloneRole(roleId, newRoleName, clonedBy);

      this.sendSuccess(res, clonedRole, 'Role cloned successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to clone role');
    }
  }

  /**
   * Get role statistics
   */
  async getRoleStats(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      const stats = await this.roleService.getRoleStats(companyId.toString());

      this.sendSuccess(res, stats, 'Role statistics retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get role statistics');
    }
  }

  /**
   * Update role
   */
  async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const role = await this.roleService.update(id, updateData, updatedBy);

      if (!role) {
        this.sendError(res, new Error('Role not found'), 'Role not found', 404);
        return;
      }

      this.sendSuccess(res, role, 'Role updated successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to update role');
    }
  }

  /**
   * Get role by ID
   */
  async getRoleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const role = await this.roleService.findById(id);

      if (!role) {
        this.sendError(res, new Error('Role not found'), 'Role not found', 404);
        return;
      }

      this.sendSuccess(res, role, 'Role retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get role');
    }
  }

  /**
   * Delete role (soft delete)
   */
  async deleteRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedBy = (req.user?.userId || req.user?._id)?.toString();

      const role = await this.roleService.update(id, {
        isActive: false,
        deletedAt: new Date()
      }, deletedBy);

      if (!role) {
        this.sendError(res, new Error('Role not found'), 'Role not found', 404);
        return;
      }

      this.sendSuccess(res, null, 'Role deleted successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to delete role');
    }
  }

  /**
   * Search roles
   */
  async searchRoles(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { q: searchTerm, limit = 10 } = req.query;

      if (!companyId) {
        this.sendError(res, new Error('Company ID is required'), 'Company ID is required', 400);
        return;
      }

      if (!searchTerm) {
        this.sendError(res, new Error('Search term is required'), 'Search term is required', 400);
        return;
      }

      const roles = await this.roleService.findMany({
        companyId,
        $or: [
          { roleName: { $regex: searchTerm, $options: 'i' } },
          { displayName: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ],
        isActive: true
      }, { limit: parseInt(limit as string) });

      this.sendSuccess(res, roles, 'Search results retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to search roles');
    }
  }
}
