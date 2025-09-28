import { snapdragonConfig } from "../config.js";

/**
 * Service for handling LLM-powered conversations between agents
 */
export class ConversationService {
  constructor() {
    this.activeConversations = new Map(); // Map<conversationId, conversationData>
    this.chatSidebar = null; // Reference to chat sidebar for displaying messages
  }

  /**
   * Set the chat sidebar reference
   */
  setChatSidebar(chatSidebar) {
    this.chatSidebar = chatSidebar;
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
      const agent1Label = this.getAgentDisplayName(agent1);
      const agent2Label = this.getAgentDisplayName(agent2);
      console.log(`Starting ${conversationType} conversation between ${agent1Label} and ${agent2Label}`);
      
      // Determine who starts the conversation (random)
      const starter = Math.random() < 0.5 ? agent1 : agent2;
      const responder = starter === agent1 ? agent2 : agent1;
      
      // Generate conversation context
      const context = this.generateConversationContext(agent1, agent2);
      
      // Generate starter message
      const starterMessage = await this.generateMessage(starter, responder, context, true);
      const starterLabel = this.getAgentDisplayName(starter);
      const responderLabel = this.getAgentDisplayName(responder);
      console.log(`${starterLabel}: "${starterMessage}"`);
      
      // Generate response message
      const responseMessage = await this.generateMessage(responder, starter, context, false, starterMessage);
      console.log(`${responderLabel}: "${responseMessage}"`);
      
      // Store conversation data
      const conversationData = {
        id: conversationId,
        participants: [agent1.id, agent2.id],
        starter: starter.id,
        responder: responder.id,
        conversationType: conversationType,
        messages: [
          { speaker: starter, message: starterMessage, timestamp: Date.now() },
          { speaker: responder, message: responseMessage, timestamp: Date.now() }
        ],
        isComplete: true
      };

      this.activeConversations.set(conversationId, conversationData);
      
      // Add complete conversation to chat sidebar
      if (this.chatSidebar) {
        this.chatSidebar.addConversation(conversationId, conversationType, conversationData.messages, [agent1, agent2]);
      }
      
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

  getAgentDisplayName(agent) {
    if (!agent) return 'Unknown Agent';
    const rawName = [agent.displayName, agent.stats?.name]
      .map(value => (typeof value === 'string' ? value.trim() : ''))
      .find(value => value.length);
    if (rawName) {
      return rawName;
    }
    return agent.isStudent ? `Student ${agent.id}` : `Recruiter ${agent.id}`;
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
    const speakerName = this.getAgentDisplayName(speaker);
    const otherName = this.getAgentDisplayName(otherAgent);

    let prompt = `You are at a hackathon networking event. You are ${speakerName} with:
- GPA: ${speaker.stats.gpa}
- Skills: ${speaker.stats.skills.join(', ')}
- Experience: ${speaker.stats.experience} years
- Major: ${speaker.stats.major}

You're talking to ${otherName} (student ID: ${otherAgent.id}) who has:
- GPA: ${otherAgent.stats.gpa}
- Skills: ${otherAgent.stats.skills.join(', ')}
- Experience: ${otherAgent.stats.experience} years
- Major: ${otherAgent.stats.major}

This is casual student-to-student conversation. Be friendly, funny, and relatable. Talk about hackathon experiences, coding struggles, or just general student life. Keep it light and entertaining. Respond with only ONE sentence.`;

    if (isStarter) {
      prompt += `

Start the conversation with a casual, funny greeting in ONE sentence. Maybe mention something about the hackathon or being a student.`;
    } else {
      prompt += `

${otherName} just said: "${previousMessage}"

Respond in a casual, funny way that a student would in ONE sentence.`;
    }

    return prompt;
  }

  buildRecruiterRecruiterPrompt(speaker, otherAgent, isStarter, previousMessage) {
    const speakerName = this.getAgentDisplayName(speaker);
    const otherName = this.getAgentDisplayName(otherAgent);

    let prompt = `You are at a hackathon networking event. You are ${speakerName} from ${speaker.stats.company}.
- Role: ${speaker.stats.position}
- Requirements: ${speaker.stats.requirements.join(', ')}
- Experience required: ${speaker.stats.experienceRequired} years
- Preferences: ${speaker.stats.lookingFor.preferences}

You're talking to ${otherName} (recruiter ID: ${otherAgent.id}) from ${otherAgent.stats.company}.
- Role: ${otherAgent.stats.position}
- Requirements: ${otherAgent.stats.requirements.join(', ')}
- Experience required: ${otherAgent.stats.experienceRequired} years
- Preferences: ${otherAgent.stats.lookingFor.preferences}

This is recruiter-to-recruiter conversation. Be professional but candid about recruiting challenges. Share insights about talent, hiring needs, or industry trends. Respond with only ONE sentence.`;

    if (isStarter) {
      prompt += `

Start the conversation with a professional greeting and recruiting insight in ONE sentence.`;
    } else {
      prompt += `

${otherName} just said: "${previousMessage}"

Respond with a professional tone about recruiting in ONE sentence.`;
    }

    return prompt;
  }

  buildStudentRecruiterPrompt(speaker, otherAgent, isStarter, previousMessage) {
    const speakerName = this.getAgentDisplayName(speaker);
    const otherName = this.getAgentDisplayName(otherAgent);
    const student = speaker.isStudent ? speaker : otherAgent;
    const recruiter = speaker.isStudent ? otherAgent : speaker;

    let prompt = `You are at a hackathon networking event.`;

    if (speaker.isStudent) {
      prompt += ` You are ${speakerName} with:
- GPA: ${student.stats.gpa}
- Skills: ${student.stats.skills.join(', ')}
- Experience: ${student.stats.experience} years
- Major: ${student.stats.major}

You're talking to ${otherName} from ${recruiter.stats.company}, who is looking for ${recruiter.stats.lookingFor.role}. They want: ${recruiter.stats.lookingFor.preferences}`;
      prompt += `

Be professional, enthusiastic, and show interest in their company and opportunities. Respond with only ONE sentence.`;
    } else {
      prompt += ` You are ${speakerName} from ${recruiter.stats.company} looking for ${recruiter.stats.lookingFor.role}.
Your company: ${recruiter.stats.company}
Position: ${recruiter.stats.lookingFor.role}
Requirements: ${recruiter.stats.requirements.join(', ')}
Experience needed: ${recruiter.stats.experienceRequired} years
Preferences: ${recruiter.stats.lookingFor.preferences}

You're talking to ${otherName}, a student with:
- GPA: ${student.stats.gpa}
- Skills: ${student.stats.skills.join(', ')}
- Experience: ${student.stats.experience} years
- Major: ${student.stats.major}`;
      prompt += `

Be professional, friendly, and interested in learning about the student's background. Respond with only ONE sentence.`;
    }

    if (isStarter) {
      prompt += `

Start the conversation with a professional greeting in ONE sentence.`;
    } else {
      prompt += `

${otherName} just said: "${previousMessage}"

Respond professionally and naturally in ONE sentence.`;
    }

    return prompt;
  }

  buildFallbackPrompt(speaker, otherAgent, isStarter, previousMessage) {
    const speakerName = this.getAgentDisplayName(speaker);
    const otherName = this.getAgentDisplayName(otherAgent);

    let prompt = `You are at a hackathon networking event. You are ${speakerName} (${speaker.isStudent ? 'student' : 'recruiter'} ID: ${speaker.id}).`;

    if (isStarter) {
      prompt += `

Start the conversation with a brief greeting in ONE sentence.`;
    } else {
      prompt += `

${otherName} just said: "${previousMessage}"

Respond briefly in ONE sentence.`;
    }

    return prompt;
  }

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
    const speakerName = this.getAgentDisplayName(speaker);
    const primarySkill = Array.isArray(speaker.stats.skills) && speaker.stats.skills.length
      ? speaker.stats.skills[0]
      : 'coding';

    if (isStarter) {
      return `Hey! I'm ${speakerName}, a ${speaker.stats.major} student—how's the hackathon going for you?`;
    } else {
      return `${speakerName} here—pretty good! I'm working on some ${primarySkill} stuff.`;
    }
  }

  /**
   * Generate fallback for recruiter-recruiter conversations
   */
  generateRecruiterRecruiterFallback(speaker, otherAgent, isStarter) {
    const speakerName = this.getAgentDisplayName(speaker);

    if (isStarter) {
      return `Hey, ${speakerName} from ${speaker.stats.company} here—these students are getting more competitive every year!`;
    } else {
      return `${speakerName} agrees—finding great talent for ${speaker.stats.lookingFor.role} is tougher every season.`;
    }
  }

  /**
   * Generate fallback for student-recruiter conversations
   */
  generateStudentRecruiterFallback(speaker, otherAgent, isStarter) {
    const speakerName = this.getAgentDisplayName(speaker);
    const otherName = this.getAgentDisplayName(otherAgent);

    if (isStarter) {
      if (speaker.isStudent) {
        return `Hi! I'm ${speakerName}, a ${speaker.stats.major} student, and I'd love to learn more about opportunities at your company.`;
      } else {
        return `Hello! I'm ${speakerName} from ${speaker.stats.company}, and we're looking for talented developers like you.`;
      }
    } else {
      if (speaker.isStudent) {
        const focus = Array.isArray(speaker.stats.skills) && speaker.stats.skills.length
          ? speaker.stats.skills[0]
          : 'software development';
        return `That sounds great, ${otherName}! I'm especially interested in ${focus}.`;
      } else {
        const interest = Array.isArray(otherAgent.stats.skills) && otherAgent.stats.skills.length
          ? otherAgent.stats.skills[0]
          : 'programming';
        return `Excellent, ${otherName}! I'd love to hear more about your experience with ${interest}.`;
      }
    }
  }

  /**
   * Generate generic fallback message
   */
  generateGenericFallback(speaker, otherAgent, isStarter) {
    const speakerName = this.getAgentDisplayName(speaker);

    if (isStarter) {
      return `Hello! ${speakerName} here—nice to meet you.`;
    } else {
      return `Thanks, ${this.getAgentDisplayName(otherAgent)}! ${speakerName} enjoyed chatting with you.`;
    }
  }

  /**
   * Handle fallback conversation when LLM fails
   */
  handleFallbackConversation(agent1, agent2, conversationId) {
    const starter = Math.random() < 0.5 ? agent1 : agent2;
    const responder = starter === agent1 ? agent2 : agent1;
    
    const conversationType = this.getConversationType(agent1, agent2);
    const agent1Label = this.getAgentDisplayName(agent1);
    const agent2Label = this.getAgentDisplayName(agent2);
    console.log(`Starting ${conversationType} conversation between ${agent1Label} and ${agent2Label}`);
    
    const starterMessage = this.generateFallbackMessage(starter, responder, true);
    const responseMessage = this.generateFallbackMessage(responder, starter, false);
    
    const starterLabel = this.getAgentDisplayName(starter);
    const responderLabel = this.getAgentDisplayName(responder);
    console.log(`${starterLabel}: "${starterMessage}"`);
    console.log(`${responderLabel}: "${responseMessage}"`);
    
    // Store conversation data
    const conversationData = {
      id: conversationId,
      participants: [agent1.id, agent2.id],
      starter: starter.id,
      responder: responder.id,
      conversationType: conversationType,
      messages: [
        { speaker: starter, message: starterMessage, timestamp: Date.now() },
        { speaker: responder, message: responseMessage, timestamp: Date.now() }
      ],
      isComplete: true
    };

    this.activeConversations.set(conversationId, conversationData);
    
    // Add complete conversation to chat sidebar
    if (this.chatSidebar) {
      this.chatSidebar.addConversation(conversationId, conversationType, conversationData.messages, [agent1, agent2]);
    }
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
