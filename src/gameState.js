import { ConversationState } from './conversationState.js';
import { generateAgentStats } from './generators/agentStats.js';
import { generateAgentAppearance } from './generators/agentAppearance.js';
import { createObstacle, DEFAULT_OBSTACLE_POSITIONS } from './generators/obstacles.js';
import {
  isValidPosition as isPositionWithinBounds,
  getAdjacentPositions as getAdjacentPositionsForGrid,
  findAgentAt as findAgentInGrid
} from './utils/gridUtils.js';
import {
  moveAgent as moveAgentHelper,
  moveAgentRandomly as moveAgentRandomlyHelper
} from './logic/agentMovement.js';
import {
  checkForConversations as checkForConversationsHelper,
  handleConversations as handleConversationsHelper
} from './logic/conversationManager.js';

/**
 * GameState class - Manages the internal state of the game grid
 * Completely separated from rendering logic
 */
export class GameState {
  constructor(size = 10) {
    this.size = size;
    this.grid = this.initializeGrid();
    this.agents = [];
    this.frameCount = 0;
    this.nextAgentId = 1; // Start agent IDs from 1
    this.conversationState = new ConversationState(this.agents);
    this.chatSidebar = null; // Reference to chat sidebar
  }

  /**
   * Set the chat sidebar reference
   */
  setChatSidebar(chatSidebar) {
    this.chatSidebar = chatSidebar;
    this.conversationState.setChatSidebar(chatSidebar);
  }

  /**
   * Initialize grid with objects containing type and metadata
   * Each cell is an object with properties:
   * - type: 'walkable' | 'obstacle' | 'agent'
   * - agent: reference to agent object if type is 'agent'
   * - obstacle: reference to obstacle object if type is 'obstacle'
   */
  initializeGrid() {
    return Array(this.size).fill().map(() => 
      Array(this.size).fill().map(() => ({
        type: 'walkable',
        agent: null,
        obstacle: null
      }))
    );
  }

  /**
   * Add an obstacle to the grid
   */
  addObstacle(x, y, obstacleData = {}) {
    if (!this.isValidPosition(x, y) || this.grid[y][x].type !== 'walkable') {
      return false;
    }

    const obstacle = createObstacle(x, y, obstacleData);

    this.grid[y][x] = {
      type: 'obstacle',
      agent: null,
      obstacle
    };

    return obstacle;
  }

  /**
   * Add an agent to the grid
   */
  addAgent(x, y, id = null, isStudent = true) {
    if (!this.isValidPosition(x, y) || this.grid[y][x].type !== 'walkable') {
      return null;
    }

    // Use provided ID or assign next sequential ID starting from 1
    const agentId = id !== null ? id : this.nextAgentId++;

    const agent = {
      id: agentId,
      isStudent: isStudent,
      stats: generateAgentStats(isStudent),
      appearance: generateAgentAppearance(isStudent),
      position: [x, y],
      inConversation: false,
      conversationPartner: null,
      conversationId: null,
      lastConvoCooldown: 0, // Cooldown timer for conversation engagement
      get x() { return this.position[0]; },
      get y() { return this.position[1]; },
      set x(value) { this.position[0] = value; },
      set y(value) { this.position[1] = value; }
    };

    this.agents.push(agent);
    this.grid[y][x] = {
      type: 'agent',
      agent,
      obstacle: null
    };

    // Update conversation state with new agents reference
    this.conversationState.updateAgentsReference(this.agents);

    return agent;
  }

  /**
   * Check if position is valid within grid bounds
   */
  isValidPosition(x, y) {
    return isPositionWithinBounds(this.size, x, y);
  }

  /**
   * Get all 4 cardinal adjacent positions around a given position (up, down, left, right)
   */
  getAdjacentPositions(x, y) {
    return getAdjacentPositionsForGrid(this.size, x, y);
  }

  /**
   * Check if two agents are within cardinal adjacent tiles (up, down, left, right)
   */
  areAdjacent(agent1, agent2) {
    const dx = Math.abs(agent1.x - agent2.x);
    const dy = Math.abs(agent1.y - agent2.y);
    
    // Cardinal adjacency: exactly one cell away horizontally OR vertically (not both)
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }

  /**
   * Move an agent to a new position
   */
  moveAgent(agent, newX, newY) {
    return moveAgentHelper(this, agent, newX, newY);
  }

  /**
   * Move agent to a random adjacent walkable position
   */
  moveAgentRandomly(agent) {
    return moveAgentRandomlyHelper(this, agent);
  }

  /**
   * Find an agent at a specific position
   */
  findAgentAt(x, y) {
    return findAgentInGrid(this.grid, this.size, x, y);
  }

  /**
   * Check for new conversations between agents using linear time complexity
   */
  checkForConversations() {
    checkForConversationsHelper(this);
  }

  /**
   * Handle existing conversations using the global conversation state
   */
  handleConversations() {
    handleConversationsHelper(this);
  }

  /**
   * Process one game frame - move all agents and handle conversations
   */
  processFrame() {
    this.frameCount++;

    // Decrement cooldown timers for all agents
    this.agents.forEach(agent => {
      if (agent.lastConvoCooldown > 0) {
        agent.lastConvoCooldown--;
      }
    });

    // First check for new conversations
    this.checkForConversations();

    // Handle existing conversations
    this.handleConversations();

    // Move all agents
    this.agents.forEach(agent => {
      this.moveAgentRandomly(agent);
    });
  }

  /**
   * Get a snapshot of the current game state
   */
  getStateSnapshot() {
    return {
      size: this.size,
      grid: this.grid.map(row => row.map(cell => ({
        type: cell.type,
        agentId: cell.agent?.id || null,
        obstacleId: cell.obstacle?.id || null,
        inConversation: cell.agent?.inConversation || false
      }))),
      agents: this.agents.map(agent => ({
        id: agent.id,
        isStudent: agent.isStudent,
        position: [...agent.position],
        inConversation: agent.inConversation,
        conversationPartner: agent.conversationPartner,
        conversationId: agent.conversationId,
        lastConvoCooldown: agent.lastConvoCooldown,
        stats: { ...agent.stats },
        appearance: { ...agent.appearance }
      })),
      frameCount: this.frameCount,
      conversations: this.conversationState.getSnapshot()
    };
  }

  /**
   * Get the conversation state for external access
   */
  getConversationState() {
    return this.conversationState;
  }

  /**
   * Get the next available agent ID
   */
  getNextAgentId() {
    return this.nextAgentId;
  }

  /**
   * Get information about all agents (for debugging)
   */
  getAgentsInfo() {
    return this.agents.map(agent => ({
      id: agent.id,
      isStudent: agent.isStudent,
      position: [...agent.position],
      inConversation: agent.inConversation,
      lastConvoCooldown: agent.lastConvoCooldown
    }));
  }

  /**
   * Get cell information at a specific position
   */
  getCell(x, y) {
    if (!this.isValidPosition(x, y)) return null;
    return this.grid[y][x];
  }

  /**
   * Get all agents at a specific position
   */
  getAgentsAt(x, y) {
    if (!this.isValidPosition(x, y)) return [];
    const cell = this.grid[y][x];
    return cell.agent ? [cell.agent] : [];
  }

  /**
   * Generate sample obstacles for testing
   */
  generateSampleObstacles() {
    const obstacles = [];

    DEFAULT_OBSTACLE_POSITIONS.forEach(pos => {
      if (this.isValidPosition(pos.x, pos.y) && this.grid[pos.y][pos.x].type === 'walkable') {
        const obstacle = this.addObstacle(pos.x, pos.y, { type: 'wall' });
        if (obstacle) obstacles.push(obstacle);
      }
    });

    return obstacles;
  }
}
