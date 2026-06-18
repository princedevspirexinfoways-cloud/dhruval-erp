import { Router } from 'express';
import { AgentController } from '../../controllers/AgentController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const agentController = new AgentController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/v1/agents
 * @desc    Create a new agent
 * @access  Private
 */
router.post('/', agentController.createAgent.bind(agentController));

/**
 * @route   GET /api/v1/agents
 * @desc    Get agents by company with pagination and filters
 * @access  Private
 */
router.get('/', agentController.getAgentsByCompany.bind(agentController));

/**
 * @route   GET /api/v1/agents/search
 * @desc    Search agents
 * @access  Private
 */
router.get('/search', agentController.searchAgents.bind(agentController));

/**
 * @route   GET /api/v1/agents/stats
 * @desc    Get agent statistics
 * @access  Private
 */
router.get('/stats', agentController.getAgentStats.bind(agentController));

/**
 * @route   GET /api/v1/agents/code/:agentCode
 * @desc    Get agent by code
 * @access  Private
 */
router.get('/code/:agentCode', agentController.getAgentByCode.bind(agentController));

/**
 * @route   GET /api/v1/agents/:id
 * @desc    Get agent by ID
 * @access  Private
 */
router.get('/:id', agentController.getAgentById.bind(agentController));

/**
 * @route   PUT /api/v1/agents/:id
 * @desc    Update agent
 * @access  Private
 */
router.put('/:id', agentController.updateAgent.bind(agentController));

/**
 * @route   DELETE /api/v1/agents/:id
 * @desc    Delete agent (soft delete)
 * @access  Private
 */
router.delete('/:id', agentController.deleteAgent.bind(agentController));

export default router;











