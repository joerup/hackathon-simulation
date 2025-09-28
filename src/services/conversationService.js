import { snapdragonConfig } from "../config.js";

/**
 * Service for handling LLM-powered conversations between agents
 */
export class ConversationService {
  constructor() {
    this.activeConversations = new Map(); // Map<conversationId, conversationData>
  }

  /**
   * Start a conversation between two agents using LLM
   * @param {Object} agent1 - First agent
   * @param {Object} agent2 - Second agent
   * @param {string} conversationId - Unique conversation ID
   * @returns {Promise<void>}
   */
  async startConversation(agent1, agent2, conversationId) {
    try {
      const conversationType = this.getConversationType(agent1, agent2);
      console.log(`Starting ${conversationType} conversation between ${agent1.isStudent ? 'Student' : 'Recruiter'} ${agent1.id} and ${agent2.isStudent ? 'Student' : 'Recruiter'} ${agent2.id}`);
      
      // Determine who starts the conversation (random)
      const starter = Math.random() < 0.5 ? agent1 : agent2;
      const responder = starter === agent1 ? agent2 : agent1;
      
      // Generate conversation context
      const context = this.generateConversationContext(agent1, agent2);
      
      // Generate starter message
      const starterMessage = await this.generateMessage(starter, responder, context, true);
      console.log(`${starter.isStudent ? 'Student' : 'Recruiter'} ${starter.id}: "${starterMessage}"`);
      
      // Generate response message
      const responseMessage = await this.generateMessage(responder, starter, context, false, starterMessage);
      console.log(`${responder.isStudent ? 'Student' : 'Recruiter'} ${responder.id}: "${responseMessage}"`);
      
      // Store conversation data
      this.activeConversations.set(conversationId, {
        id: conversationId,
        participants: [agent1.id, agent2.id],
        starter: starter.id,
        responder: responder.id,
        conversationType: conversationType,
        messages: [
          { speaker: starter.id, message: starterMessage, timestamp: Date.now() },
          { speaker: responder.id, message: responseMessage, timestamp: Date.now() }
        ],
        isComplete: true
      });
      
    } catch (error) {
      console.error('Error in conversation service:', error);
      // Fallback to simple conversation
      this.handleFallbackConversation(agent1, agent2, conversationId);
    }
  }

  /**
   * Generate conversation context from agent data
   */
  generateConversationContext(agent1, agent2) {
    return {
      agent1: {
        id: agent1.id,
        isStudent: agent1.isStudent,
        stats: agent1.stats
      },
      agent2: {
        id: agent2.id,
        isStudent: agent2.isStudent,
        stats: agent2.stats
      },
      conversationType: this.getConversationType(agent1, agent2)
    };
  }

  /**
   * Determine the type of conversation based on agent types
   */
  getConversationType(agent1, agent2) {
    if (agent1.isStudent && agent2.isStudent) {
      return 'student-student';
    } else if (!agent1.isStudent && !agent2.isStudent) {
      return 'recruiter-recruiter';
    } else {
      return 'student-recruiter';
    }
  }

  /**
   * Generate a message using LLM
   */
  async generateMessage(speaker, otherAgent, context, isStarter, previousMessage = null) {
    const { apiKey, apiUrl, model } = snapdragonConfig;

    if (!apiKey) {
      return this.generateFallbackMessage(speaker, otherAgent, isStarter);
    }

    const prompt = this.buildPrompt(speaker, otherAgent, context, isStarter, previousMessage);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "System",
              content: "You are simulating a conversation between a student and recruiter at a hackathon. Generate realistic, single-sentence responses only. Be conversational and appropriate for a networking event. Keep responses short and natural."
            },
            {
              role: "User",
              content: prompt
            }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`LLM API request failed (${response.status})`);
      }

      const data = await response.json();
      const message = data?.choices?.[0]?.message;
      const content = typeof message?.content === "string" ? message.content.trim() : "";
      
      return content || this.generateFallbackMessage(speaker, otherAgent, isStarter);
    } catch (error) {
      console.warn('LLM conversation failed, using fallback:', error.message);
      return this.generateFallbackMessage(speaker, otherAgent, isStarter);
    }
  }

  /**
   * Build the prompt for LLM conversation generation
   */
  buildPrompt(speaker, otherAgent, context, isStarter, previousMessage) {
    const conversationType = context.conversationType;
    
    switch (conversationType) {
      case 'student-student':
        return this.buildStudentStudentPrompt(speaker, otherAgent, isStarter, previousMessage);
      case 'recruiter-recruiter':
        return this.buildRecruiterRecruiterPrompt(speaker, otherAgent, isStarter, previousMessage);
      case 'student-recruiter':
        return this.buildStudentRecruiterPrompt(speaker, otherAgent, isStarter, previousMessage);
      default:
        return this.buildFallbackPrompt(speaker, otherAgent, isStarter, previousMessage);
    }
  }

  /**
   * Build prompt for student-student conversations (funny small talk)
   */
  buildStudentStudentPrompt(speaker, otherAgent, isStarter, previousMessage) {
    let prompt = `You are at a hackathon networking event. You are a student (ID: ${speaker.id}) with:
- GPA: ${speaker.stats.gpa}
- Skills: ${speaker.stats.skills.join(', ')}
- Experience: ${speaker.stats.experience} years
- Major: ${speaker.stats.major}

You're talking to another student (ID: ${otherAgent.id}) who has:
- GPA: ${otherAgent.stats.gpa}
- Skills: ${otherAgent.stats.skills.join(', ')}
- Experience: ${otherAgent.stats.experience} years
- Major: ${otherAgent.stats.major}

This is casual student-to-student conversation. Be friendly, funny, and relatable. Talk about hackathon experiences, coding struggles, or just general student life. Keep it light and entertaining. Respond with only ONE sentence.`;

    if (isStarter) {
      prompt += `\n\nStart the conversation with a casual, funny greeting in ONE sentence. Maybe mention something about the hackathon or being a student.`;
    } else {
      prompt += `\n\nThe other student just said: "${previousMessage}"\n\nRespond in a casual, funny way that a student would in ONE sentence.`;
    }

    return prompt;
  }

  /**
   * Build prompt for recruiter-recruiter conversations (smack talk about students)
   */
  buildRecruiterRecruiterPrompt(speaker, otherAgent, isStarter, previousMessage) {
    let prompt = `You are at a hackathon networking event. You are a recruiter (ID: ${speaker.id}) from ${speaker.stats.company} looking for ${speaker.stats.lookingFor.role}.

Your company: ${speaker.stats.company}
Position: ${speaker.stats.lookingFor.role}
Requirements: ${speaker.stats.requirements.join(', ')}
Experience needed: ${speaker.stats.experienceRequired} years
Preferences: ${speaker.stats.lookingFor.preferences}

You're talking to another recruiter (ID: ${otherAgent.id}) from ${otherAgent.stats.company} who is looking for ${otherAgent.stats.lookingFor.role}.

This is recruiter-to-recruiter conversation. Be a bit cynical and gossipy about the students, share recruiting war stories, or talk about the challenges of finding good talent. Keep it professional but with some attitude. Respond with only ONE sentence.`;

    if (isStarter) {
      prompt += `\n\nStart the conversation with a greeting and maybe a comment about the students or recruiting challenges in ONE sentence.`;
    } else {
      prompt += `\n\nThe other recruiter just said: "${previousMessage}"\n\nRespond with recruiter gossip or commentary in ONE sentence.`;
    }

    return prompt;
  }

  /**
   * Build prompt for student-recruiter conversations (professional)
   */
  buildStudentRecruiterPrompt(speaker, otherAgent, isStarter, previousMessage) {
    const student = speaker.isStudent ? speaker : otherAgent;
    const recruiter = speaker.isStudent ? otherAgent : speaker;
    
    let prompt = `You are at a hackathon networking event. `;
    
    if (speaker.isStudent) {
      prompt += `You are a student (ID: ${speaker.id}) with:
- GPA: ${student.stats.gpa}
- Skills: ${student.stats.skills.join(', ')}
- Experience: ${student.stats.experience} years
- Major: ${student.stats.major}

You're talking to a recruiter from ${recruiter.stats.company} who is looking for ${recruiter.stats.lookingFor.role}. They want: ${recruiter.stats.lookingFor.preferences}

Be professional, enthusiastic, and show interest in their company and opportunities. Respond with only ONE sentence.`;
    } else {
      prompt += `You are a recruiter (ID: ${speaker.id}) from ${recruiter.stats.company} looking for ${recruiter.stats.lookingFor.role}. 
Your company: ${recruiter.stats.company}
Position: ${recruiter.stats.lookingFor.role}
Requirements: ${recruiter.stats.requirements.join(', ')}
Experience needed: ${recruiter.stats.experienceRequired} years
Preferences: ${recruiter.stats.lookingFor.preferences}

You're talking to a student with:
- GPA: ${student.stats.gpa}
- Skills: ${student.stats.skills.join(', ')}
- Experience: ${student.stats.experience} years
- Major: ${student.stats.major}

Be professional, friendly, and interested in learning about the student's background. Respond with only ONE sentence.`;
    }

    if (isStarter) {
      prompt += `\n\nStart the conversation with a professional greeting and introduction in ONE sentence.`;
    } else {
      prompt += `\n\nThe other person just said: "${previousMessage}"\n\nRespond professionally and naturally in ONE sentence.`;
    }

    return prompt;
  }

  /**
   * Build fallback prompt for unknown conversation types
   */
  buildFallbackPrompt(speaker, otherAgent, isStarter, previousMessage) {
    let prompt = `You are at a hackathon networking event. `;
    
    if (speaker.isStudent) {
      prompt += `You are a student (ID: ${speaker.id}) with major: ${speaker.stats.major}.`;
    } else {
      prompt += `You are a recruiter (ID: ${speaker.id}) from ${speaker.stats.company}.`;
    }

    if (isStarter) {
      prompt += `\n\nStart the conversation with a brief greeting in ONE sentence.`;
    } else {
      prompt += `\n\nThe other person just said: "${previousMessage}"\n\nRespond briefly in ONE sentence.`;
    }

    return prompt;
  }

  /**
   * Generate fallback message when LLM is not available
   */
  generateFallbackMessage(speaker, otherAgent, isStarter) {
    const conversationType = this.getConversationType(speaker, otherAgent);
    
    switch (conversationType) {
      case 'student-student':
        return this.generateStudentStudentFallback(speaker, otherAgent, isStarter);
      case 'recruiter-recruiter':
        return this.generateRecruiterRecruiterFallback(speaker, otherAgent, isStarter);
      case 'student-recruiter':
        return this.generateStudentRecruiterFallback(speaker, otherAgent, isStarter);
      default:
        return this.generateGenericFallback(speaker, otherAgent, isStarter);
    }
  }

  /**
   * Generate fallback for student-student conversations
   */
  generateStudentStudentFallback(speaker, otherAgent, isStarter) {
    if (isStarter) {
      return `Hey! I'm a ${speaker.stats.major} student - how's the hackathon going for you?`;
    } else {
      return `Pretty good! I'm working on some ${speaker.stats.skills[0] || 'coding'} stuff.`;
    }
  }

  /**
   * Generate fallback for recruiter-recruiter conversations
   */
  generateRecruiterRecruiterFallback(speaker, otherAgent, isStarter) {
    if (isStarter) {
      return `Hey, I'm from ${speaker.stats.company} - these students are getting more competitive every year!`;
    } else {
      return `Tell me about it! We're looking for ${speaker.stats.lookingFor.role} but finding good talent is tough.`;
    }
  }

  /**
   * Generate fallback for student-recruiter conversations
   */
  generateStudentRecruiterFallback(speaker, otherAgent, isStarter) {
    if (isStarter) {
      if (speaker.isStudent) {
        return `Hi! I'm a ${speaker.stats.major} student and I'd love to learn more about opportunities at your company.`;
      } else {
        return `Hello! I'm from ${speaker.stats.company} and we're looking for talented developers like yourself.`;
      }
    } else {
      if (speaker.isStudent) {
        return `That sounds great! I'm particularly interested in ${speaker.stats.skills[0] || 'software development'}.`;
      } else {
        return `Excellent! We'd love to hear more about your experience with ${otherAgent.stats.skills[0] || 'programming'}.`;
      }
    }
  }

  /**
   * Generate generic fallback message
   */
  generateGenericFallback(speaker, otherAgent, isStarter) {
    if (isStarter) {
      return `Hello! Nice to meet you.`;
    } else {
      return `Thanks! Nice talking with you.`;
    }
  }

  /**
   * Handle fallback conversation when LLM fails
   */
  handleFallbackConversation(agent1, agent2, conversationId) {
    const starter = Math.random() < 0.5 ? agent1 : agent2;
    const responder = starter === agent1 ? agent2 : agent1;
    
    const conversationType = this.getConversationType(agent1, agent2);
    console.log(`Starting ${conversationType} conversation between ${agent1.isStudent ? 'Student' : 'Recruiter'} ${agent1.id} and ${agent2.isStudent ? 'Student' : 'Recruiter'} ${agent2.id}`);
    
    const starterMessage = this.generateFallbackMessage(starter, responder, true);
    const responseMessage = this.generateFallbackMessage(responder, starter, false);
    
    console.log(`${starter.isStudent ? 'Student' : 'Recruiter'} ${starter.id}: "${starterMessage}"`);
    console.log(`${responder.isStudent ? 'Student' : 'Recruiter'} ${responder.id}: "${responseMessage}"`);
    
    this.activeConversations.set(conversationId, {
      id: conversationId,
      participants: [agent1.id, agent2.id],
      starter: starter.id,
      responder: responder.id,
      conversationType: conversationType,
      messages: [
        { speaker: starter.id, message: starterMessage, timestamp: Date.now() },
        { speaker: responder.id, message: responseMessage, timestamp: Date.now() }
      ],
      isComplete: true
    });
  }

  /**
   * Get conversation data
   */
  getConversation(conversationId) {
    return this.activeConversations.get(conversationId);
  }

  /**
   * Remove conversation from active conversations
   */
  removeConversation(conversationId) {
    this.activeConversations.delete(conversationId);
  }

  /**
   * Check if conversation is complete
   */
  isConversationComplete(conversationId) {
    const conversation = this.activeConversations.get(conversationId);
    return conversation ? conversation.isComplete : false;
  }
}
