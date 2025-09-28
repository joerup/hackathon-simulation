/**
 * ConversationState class - Manages all conversations globally
 * Each conversation is treated as an individual entity with its own properties
 */
export class ConversationState {
  constructor(agents = []) {
    this.conversations = new Map(); // Map<conversationId, Conversation>
    this.nextConversationId = 0;
    this.agentConversations = new Map(); // Map<agentId, conversationId>
    this.agents = agents; // Reference to agents array for state updates
  }

  /**
   * Create a new conversation between two agents
   * @param {Object} agent1 - First agent
   * @param {Object} agent2 - Second agent
   * @returns {string} conversationId
   */
  createConversation(agent1, agent2) {
    const conversationId = `conv_${this.nextConversationId++}`;
    
    const conversation = {
      id: conversationId,
      participants: [agent1.id, agent2.id],
      startTime: Date.now(),
      duration: 0,
      endProbability: this.calculateEndProbability(agent1, agent2),
      isActive: true,
      quality: this.calculateConversationQuality(agent1, agent2)
    };

    this.conversations.set(conversationId, conversation);
    this.agentConversations.set(agent1.id, conversationId);
    this.agentConversations.set(agent2.id, conversationId);

    // Update agent states
    agent1.inConversation = true;
    agent1.conversationPartner = agent2.id;
    agent1.conversationId = conversationId;
    agent2.inConversation = true;
    agent2.conversationPartner = agent1.id;
    agent2.conversationId = conversationId;

    return conversationId;
  }

  /**
   * End a conversation
   * @param {string} conversationId - ID of conversation to end
   */
  endConversation(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation || !conversation.isActive) return;

    conversation.isActive = false;
    conversation.endTime = Date.now();
    conversation.duration = conversation.endTime - conversation.startTime;

    // Update agent states - reset conversation properties
    conversation.participants.forEach(agentId => {
      const agent = this.agents.find(a => a.id === agentId);
      if (agent) {
        agent.inConversation = false;
        agent.conversationPartner = null;
        agent.conversationId = null;
      }
      this.agentConversations.delete(agentId);
    });

    // Remove from active conversations
    this.conversations.delete(conversationId);
  }

  /**
   * Get conversation for a specific agent
   * @param {string} agentId - Agent ID
   * @returns {Object|null} Conversation object or null
   */
  getAgentConversation(agentId) {
    const conversationId = this.agentConversations.get(agentId);
    return conversationId ? this.conversations.get(conversationId) : null;
  }

  /**
   * Check if an agent is in conversation
   * @param {string} agentId - Agent ID
   * @returns {boolean}
   */
  isAgentInConversation(agentId) {
    return this.agentConversations.has(agentId);
  }

  /**
   * Get all active conversations
   * @returns {Array} Array of active conversation objects
   */
  getActiveConversations() {
    return Array.from(this.conversations.values()).filter(conv => conv.isActive);
  }

  /**
   * Process all active conversations (check for ending, update duration, etc.)
   */
  processConversations() {
    const activeConversations = this.getActiveConversations();
    
    activeConversations.forEach(conversation => {
      // Update duration
      conversation.duration = Date.now() - conversation.startTime;
      
      // Check if conversation should end based on probability
      if (Math.random() < conversation.endProbability) {
        this.endConversation(conversation.id);
      }
    });
  }

  /**
   * Synchronize agent states with conversation state
   * This ensures all agent properties match the global conversation state
   */
  synchronizeAgentStates() {
    // Reset all agents' conversation properties
    this.agents.forEach(agent => {
      agent.inConversation = false;
      agent.conversationPartner = null;
      agent.conversationId = null;
    });

    // Set conversation properties for agents in active conversations
    this.getActiveConversations().forEach(conversation => {
      const [agent1Id, agent2Id] = conversation.participants;
      const agent1 = this.agents.find(a => a.id === agent1Id);
      const agent2 = this.agents.find(a => a.id === agent2Id);

      if (agent1 && agent2) {
        agent1.inConversation = true;
        agent1.conversationPartner = agent2Id;
        agent1.conversationId = conversation.id;
        agent2.inConversation = true;
        agent2.conversationPartner = agent1Id;
        agent2.conversationId = conversation.id;
      }
    });
  }

  /**
   * Calculate the probability that a conversation will end
   * This can be based on agent compatibility, conversation quality, etc.
   * @param {Object} agent1 - First agent
   * @param {Object} agent2 - Second agent
   * @returns {number} Probability between 0 and 1
   */
  calculateEndProbability(agent1, agent2) {
    // Base probability of 10% per frame (same as original)
    let baseProbability = 0.1;
    
    // Adjust based on agent compatibility
    if (agent1.isStudent !== agent2.isStudent) {
      // Student-recruiter conversations might last longer
      baseProbability *= 0.8;
    }
    
    // Adjust based on conversation quality
    const quality = this.calculateConversationQuality(agent1, agent2);
    baseProbability *= (2 - quality); // Higher quality = lower end probability
    
    return Math.min(baseProbability, 0.5); // Cap at 50%
  }

  /**
   * Calculate conversation quality based on agent compatibility
   * @param {Object} agent1 - First agent
   * @param {Object} agent2 - Second agent
   * @returns {number} Quality score between 0 and 1
   */
  calculateConversationQuality(agent1, agent2) {
    if (agent1.isStudent === agent2.isStudent) {
      // Same type conversations have lower quality
      return 0.3;
    }
    
    // Student-recruiter conversations
    if (agent1.isStudent && !agent2.isStudent) {
      return this.calculateStudentRecruiterCompatibility(agent1, agent2);
    } else if (!agent1.isStudent && agent2.isStudent) {
      return this.calculateStudentRecruiterCompatibility(agent2, agent1);
    }
    
    return 0.5; // Default quality
  }

  /**
   * Calculate compatibility between a student and recruiter
   * @param {Object} student - Student agent
   * @param {Object} recruiter - Recruiter agent
   * @returns {number} Compatibility score between 0 and 1
   */
  calculateStudentRecruiterCompatibility(student, recruiter) {
    let compatibility = 0.5; // Base compatibility
    
    // Check skill overlap
    if (student.stats && recruiter.stats) {
      const studentSkills = student.stats.skills || [];
      const recruiterRequirements = recruiter.stats.requirements || [];
      
      const skillOverlap = studentSkills.filter(skill => 
        recruiterRequirements.includes(skill)
      ).length;
      
      const maxSkills = Math.max(studentSkills.length, recruiterRequirements.length);
      if (maxSkills > 0) {
        compatibility += (skillOverlap / maxSkills) * 0.3;
      }
      
      // Check experience compatibility
      const studentExp = student.stats.experience || 0;
      const requiredExp = recruiter.stats.experienceRequired || 0;
      
      if (studentExp >= requiredExp) {
        compatibility += 0.2;
      } else {
        compatibility += (studentExp / requiredExp) * 0.2;
      }
    }
    
    return Math.min(compatibility, 1.0);
  }

  /**
   * Get conversation statistics
   * @returns {Object} Statistics about conversations
   */
  getStats() {
    const activeConversations = this.getActiveConversations();
    const totalConversations = this.conversations.size + activeConversations.length;
    
    return {
      activeCount: activeConversations.length,
      totalCount: totalConversations,
      averageDuration: this.calculateAverageDuration(),
      averageQuality: this.calculateAverageQuality(activeConversations)
    };
  }

  /**
   * Calculate average conversation duration
   * @returns {number} Average duration in milliseconds
   */
  calculateAverageDuration() {
    const allConversations = Array.from(this.conversations.values());
    if (allConversations.length === 0) return 0;
    
    const totalDuration = allConversations.reduce((sum, conv) => 
      sum + (conv.duration || 0), 0
    );
    
    return totalDuration / allConversations.length;
  }

  /**
   * Calculate average conversation quality
   * @param {Array} conversations - Array of conversation objects
   * @returns {number} Average quality score
   */
  calculateAverageQuality(conversations) {
    if (conversations.length === 0) return 0;
    
    const totalQuality = conversations.reduce((sum, conv) => 
      sum + (conv.quality || 0), 0
    );
    
    return totalQuality / conversations.length;
  }

  /**
   * Clean up ended conversations (remove from memory)
   * @param {number} maxAge - Maximum age in milliseconds for conversations to keep
   */
  cleanup(maxAge = 60000) { // Default 1 minute
    const now = Date.now();
    const conversationsToRemove = [];
    
    this.conversations.forEach((conversation, id) => {
      if (!conversation.isActive && 
          (now - conversation.endTime) > maxAge) {
        conversationsToRemove.push(id);
      }
    });
    
    conversationsToRemove.forEach(id => {
      this.conversations.delete(id);
    });
  }

  /**
   * Update the agents reference (called when agents array changes)
   * @param {Array} agents - New agents array reference
   */
  updateAgentsReference(agents) {
    this.agents = agents;
  }

  /**
   * Get a snapshot of the current conversation state
   * @returns {Object} Snapshot of conversation state
   */
  getSnapshot() {
    return {
      activeConversations: this.getActiveConversations().map(conv => ({
        id: conv.id,
        participants: [...conv.participants],
        duration: conv.duration,
        quality: conv.quality,
        endProbability: conv.endProbability
      })),
      stats: this.getStats()
    };
  }
}
