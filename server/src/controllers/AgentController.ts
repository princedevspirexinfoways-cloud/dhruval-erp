import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AgentService } from '../services/AgentService';

export class AgentController extends BaseController<any> {
  private agentService: AgentService;

  constructor() {
    const agentService = new AgentService();
    super(agentService, 'Agent');
    this.agentService = agentService;
  }

  /**
   * Create a new agent
   */
  async createAgent(req: Request, res: Response): Promise<void> {
    try {
      const agentData = req.body;
      const createdBy = (req.user?.userId || req.user?._id)?.toString();
      const companyId = req.user?.companyId;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      const agent = await this.agentService.createAgent({
        ...agentData,
        companyId
      }, createdBy);

      res.status(201).json({
        success: true,
        message: 'Agent created successfully',
        data: agent
      });
    } catch (error) {
      this.sendError(res, error, 'Operation failed');
    }
  }

  /**
   * Get agent by code
   */
  async getAgentByCode(req: Request, res: Response): Promise<void> {
    try {
      const { agentCode } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      const agent = await this.agentService.getAgentByCode(agentCode, companyId.toString());

      if (!agent) {
        res.status(404).json({
          success: false,
          message: 'Agent not found'
        });
        return;
      }

      res.json({
        success: true,
        data: agent
      });
    } catch (error) {
      this.sendError(res, error, 'Failed to get agent');
    }
  }

  /**
   * Get agents by company
   */
  async getAgentsByCompany(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { page = 1, limit = 10, search, status } = req.query;

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

      if (status) {
        options.status = status;
      }

      const result = await this.agentService.getAgentsByCompany(companyId.toString(), options);

      this.sendSuccess(res, result, 'Agents retrieved successfully');
    } catch (error) {
      this.sendError(res, error, 'Failed to get agents');
    }
  }

  /**
   * Search agents
   */
  async searchAgents(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;
      const companyId = req.user?.companyId;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      if (!q) {
        res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
        return;
      }

      const agents = await this.agentService.searchAgents(q as string, companyId.toString());

      res.json({
        success: true,
        data: agents
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Update agent
   */
  async updateAgent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req.user?.userId || req.user?._id)?.toString();

      const agent = await this.agentService.update(id, updateData, updatedBy);

      if (!agent) {
        res.status(404).json({
          success: false,
          message: 'Agent not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Agent updated successfully',
        data: agent
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Get agent statistics
   */
  async getAgentStats(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      const stats = await this.agentService.getAgentStats(companyId.toString());

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Delete agent (soft delete)
   */
  async deleteAgent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedBy = (req.user?.userId || req.user?._id)?.toString();

      const agent = await this.agentService.update(id, { 
        isActive: false,
        deletedAt: new Date()
      }, deletedBy);

      if (!agent) {
        res.status(404).json({
          success: false,
          message: 'Agent not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Agent deleted successfully'
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }

  /**
   * Get agent by ID
   */
  async getAgentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const agent = await this.agentService.findById(id);

      if (!agent) {
        res.status(404).json({
          success: false,
          message: 'Agent not found'
        });
        return;
      }

      res.json({
        success: true,
        data: agent
      });
    } catch (error) {
      this.sendError(res, error, "Operation failed");
    }
  }
}











