import { ConversationService } from './services/conversationService.js';

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
    this.conversationService = new ConversationService();
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
      isActive: true,
      isComplete: false,
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

    // Start async conversation using LLM
    this.startAsyncConversation(agent1, agent2, conversationId);

    return conversationId;
  }

  /**
   * Start async conversation using the conversation service
   * @param {Object} agent1 - First agent
   * @param {Object} agent2 - Second agent
   * @param {string} conversationId - Conversation ID
   */
  async startAsyncConversation(agent1, agent2, conversationId) {
    // Always mark conversation as complete - the service handles all errors internally
    await this.conversationService.startConversation(agent1, agent2, conversationId);
    
    // Mark conversation as complete after processing (service never fails)
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.isComplete = true;
    }
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

    // Get the agents involved
    const [agent1Id, agent2Id] = conversation.participants;
    const agent1 = this.agents.find(a => a.id === agent1Id);
    const agent2 = this.agents.find(a => a.id === agent2Id);

    // Calculate interaction scores for student-recruiter interactions
    if (agent1 && agent2) {
      this.processInteractionScoring(agent1, agent2, conversation);
    }

    // Update agent states - reset conversation properties and set cooldown
    conversation.participants.forEach(agentId => {
      const agent = this.agents.find(a => a.id === agentId);
      if (agent) {
        agent.inConversation = false;
        agent.conversationPartner = null;
        agent.conversationId = null;
        agent.lastConvoCooldown = 5; // Set cooldown to 5 timesteps
      }
      this.agentConversations.delete(agentId);
    });

    // Clean up conversation service
    this.conversationService.removeConversation(conversationId);

    // Remove from active conversations
    this.conversations.delete(conversationId);
  }

  /**
   * Process interaction scoring for student-recruiter interactions
   * @param {Object} agent1 - First agent
   * @param {Object} agent2 - Second agent
   * @param {Object} conversation - Conversation data
   */
  processInteractionScoring(agent1, agent2, conversation) {
    // Only process student-recruiter interactions
    let student, recruiter;
    
    if (agent1.isStudent && !agent2.isStudent) {
      student = agent1;
      recruiter = agent2;
    } else if (!agent1.isStudent && agent2.isStudent) {
      student = agent2;
      recruiter = agent1;
    } else {
      // Not a student-recruiter interaction, skip
      return;
    }

    console.log(`Processing interaction: ${student.stats.name} ↔ ${recruiter.stats.company}`);

    // Simple job offer chance based on student stats
    const offerChance = Math.min(0.3, (student.stats?.gpa || 3.0 - 2.0) * 0.1 + (student.stats?.experience || 0) * 0.05);
    const receivedOffer = Math.random() < offerChance;
    
    if (receivedOffer) {
      if (typeof student.stats.jobOffers !== 'number') {
        student.stats.jobOffers = 0;
      }
      student.stats.jobOffers++;
      
      // Also update the top-level jobOffers property for consistency
      if (typeof student.jobOffers !== 'number') {
        student.jobOffers = 0;
      }
      student.jobOffers++;
      
      console.log(`🎉 ${student.stats.name} received a job offer from ${recruiter.stats.company}! Total offers: ${student.stats.jobOffers}`);
    }
    
    // Increment recruiter count
    if (typeof student.recruitersSpokenTo === 'number') {
      student.recruitersSpokenTo++;
    } else {
      student.recruitersSpokenTo = 1;
    }
    
    console.log(`✅ Interaction completed: ${student.stats.name} met with ${recruiter.stats.company} (${receivedOffer ? 'OFFER' : 'no offer'}) - Total recruiters: ${student.recruitersSpokenTo}`);
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
      
      // Check if conversation is complete and should end
      if (conversation.isComplete && !conversation.endingScheduled) {
        // Mark as scheduled to prevent multiple timeouts
        conversation.endingScheduled = true;
        
        // End conversation after a short delay to allow other agents to move
        setTimeout(() => {
          this.endConversation(conversation.id);
        }, 2000); // 2 second delay
      }
    });
  }

  /**
   * Synchronize agent states with conversation state
   * This ensures all agent properties match the global conversation state
   */
  synchronizeAgentStates() {
    // Reset all agents' conversation properties (but preserve cooldown)
    this.agents.forEach(agent => {
      agent.inConversation = false;
      agent.conversationPartner = null;
      agent.conversationId = null;
      // Note: lastConvoCooldown is preserved and managed by GameState
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
        isComplete: conv.isComplete
      })),
      stats: this.getStats()
    };
  }
}
