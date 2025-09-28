import { snapdragonConfig } from "../config.js";
import { chatBubble } from "../ui/chatBubble.js";

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
      console.log(`Starting ${conversationType} conversation between ${agent1.isStudent ? 'Student' : 'Recruiter'} ${agent1.id} and ${agent2.isStudent ? 'Student' : 'Recruiter'} ${agent2.id}`);
      
      // Determine who starts the conversation (random)
      const starter = Math.random() < 0.5 ? agent1 : agent2;
      const responder = starter === agent1 ? agent2 : agent1;
      
      // Generate conversation context
      const context = this.generateConversationContext(agent1, agent2);
      
      // Start the conversation loop
      const messages = [];
      let currentSpeaker = starter;
      let currentListener = responder;
      let previousMessage = null;
      let isFirstMessage = true;
      let conversationEnded = false;
      let turnCount = 0;
      const maxTurns = 100; // Safety limit: 50 exchanges max

      while (!conversationEnded && turnCount < maxTurns) {
        // Generate message
        const message = await this.generateMessage(currentSpeaker, currentListener, context, isFirstMessage, messages);

        // Check if conversation should end
        const messageEndsConversation = message.includes('[END]');
        const cleanMessage = message.replace(' [END]', '').trim();

        console.log(`${currentSpeaker.isStudent ? 'Student' : 'Recruiter'} ${currentSpeaker.id}: "${cleanMessage}"`);

        // Show message in chat bubble with longer duration
        const bubbleDuration = 3000; // 3 seconds to read the message
        chatBubble.showBubble(currentSpeaker.id, cleanMessage, bubbleDuration, currentSpeaker.isStudent);

        // Store the message
        messages.push({
          speaker: currentSpeaker,
          message: cleanMessage,
          timestamp: Date.now()
        });

        // Check for end conditions
        if (messageEndsConversation || turnCount >= maxTurns - 1) {
          conversationEnded = true;
        } else {
          // Switch speakers for next turn
          [currentSpeaker, currentListener] = [currentListener, currentSpeaker];
          isFirstMessage = false;
          turnCount++;

          // Wait for bubble to disappear before next message (bubble duration + small buffer)
          await new Promise(resolve => setTimeout(resolve, bubbleDuration + 500));
        }
      }
      
      // Store conversation data
      const conversationData = {
        id: conversationId,
        participants: [agent1.id, agent2.id],
        starter: starter.id,
        responder: responder.id,
        conversationType: conversationType,
        messages: messages,
        isComplete: true,
        turnCount: turnCount + 1
      };

      this.activeConversations.set(conversationId, conversationData);
      
      // Add complete conversation to chat sidebar
      if (this.chatSidebar) {
        this.chatSidebar.addConversation(conversationId, conversationType, conversationData.messages, [agent1, agent2]);
      }
      
    } catch (error) {
      console.error('Error in conversation service:', error);
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
  async generateMessage(speaker, otherAgent, context, isStarter, conversationHistory = []) {
    const { apiKey, apiUrl, model } = snapdragonConfig;

    if (!apiKey) {
      throw new Error("No API key configured for LLM");
    }

    const prompt = this.buildPrompt(speaker, otherAgent, context, isStarter, conversationHistory);

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
              content: "You are at a hackathon in SF. MAXIMUM 3-4 WORDS per response. Be super funny with current SWE slang. Use terms like: cope, based, mid, goated, no cap, cringe, W/L, fr fr, lowkey/highkey, slay, touch grass, ratio, bussin, sus, NPC behavior, it's giving... Use YC/SF/AI jokes: 'YC reject energy', 'San Francisco rent broke me', 'just another AI wrapper', 'prompt engineer = unemployed', 'touch grass challenge', 'skill issue', 'that's so Web 2.0'. Never use quotes. After 3-5 exchanges add ' [END]'."
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
      
      return content || "...";
    } catch (error) {
      console.warn('LLM conversation failed:', error.message);
      return "...";
    }
  }

  /**
   * Build the prompt for LLM conversation generation
   */
  buildPrompt(speaker, otherAgent, context, isStarter, conversationHistory) {
    const conversationType = context.conversationType;
    
    switch (conversationType) {
      case 'student-student':
        return this.buildStudentStudentPrompt(speaker, otherAgent, isStarter, conversationHistory);
      case 'recruiter-recruiter':
        return this.buildRecruiterRecruiterPrompt(speaker, otherAgent, isStarter, conversationHistory);
      case 'student-recruiter':
        return this.buildStudentRecruiterPrompt(speaker, otherAgent, isStarter, conversationHistory);
      default:
        return this.buildFallbackPrompt(speaker, otherAgent, isStarter, conversationHistory);
    }
  }

  /**
   * Build prompt for student-student conversations (funny small talk)
   */
  buildStudentStudentPrompt(speaker, otherAgent, isStarter, conversationHistory) {
    let prompt = `You are a ${speaker.stats.major} student. You know ${speaker.stats.skills.slice(0, 2).join(' and ')}.

Be funny and use SWE slang like: fr fr, no cap, lowkey/highkey, mid, based, cringe, cope, skill issue, it's giving..., NPC behavior, W/L, touch grass. Make YC/SF/AI jokes like 'YC reject energy', 'prompt engineer = unemployed', 'just another AI wrapper', 'skill issue'. Use lowercase, no punctuation. Use emojis like 😭💀. Talk about finding teammates, study groups, or coding help.`;

    if (isStarter) {
      prompt += `\n\nStart the conversation with a greeting.`;
    } else {
      // Add conversation history
      if (conversationHistory.length > 0) {
        prompt += `\n\nConversation so far:\n`;
        conversationHistory.forEach((msg, index) => {
          const speakerType = msg.speaker.isStudent ? 'Student' : 'Recruiter';
          prompt += `${speakerType}: "${msg.message}"\n`;
        });
        prompt += `\nRespond appropriately.`;
      } else {
        prompt += `\n\nRespond appropriately.`;
      }
    }

    return prompt;
  }

  /**
   * Build prompt for recruiter-recruiter conversations (smack talk about students)
   */
  buildRecruiterRecruiterPrompt(speaker, otherAgent, isStarter, conversationHistory) {
    let prompt = `You are a recruiter from ${speaker.stats.company} hiring ${speaker.stats.lookingFor.role}s.

Talk to the other recruiter about hiring challenges. Use SWE slang: mid candidates, based resumes, cringe interviews, skill issues, lowkey desperate, it's giving unemployed energy. Make fun of students: 'touch grass challenge', 'YC reject vibes', 'prompt engineer = jobless', 'another bootcamp grad'. Discuss needing ${speaker.stats.requirements.slice(0, 2).join(' and ')} skills.`;

    if (isStarter) {
      prompt += `\n\nStart the conversation with a greeting.`;
    } else {
      // Add conversation history
      if (conversationHistory.length > 0) {
        prompt += `\n\nConversation so far:\n`;
        conversationHistory.forEach((msg, index) => {
          const speakerType = msg.speaker.isStudent ? 'Student' : 'Recruiter';
          prompt += `${speakerType}: "${msg.message}"\n`;
        });
        prompt += `\nRespond appropriately.`;
      } else {
        prompt += `\n\nRespond appropriately.`;
      }
    }

    return prompt;
  }

  /**
   * Build prompt for student-recruiter conversations (funny and casual)
   */
  buildStudentRecruiterPrompt(speaker, otherAgent, isStarter, conversationHistory) {
    const student = speaker.isStudent ? speaker : otherAgent;
    const recruiter = speaker.isStudent ? otherAgent : speaker;

    let prompt = `You are at a hackathon networking event. `;

    if (speaker.isStudent) {
      prompt += `You are a ${student.stats.major} student (${student.stats.experience} years exp). You know ${student.stats.skills.slice(0, 2).join(' and ')}.

You're talking to a recruiter from ${recruiter.stats.company} about their ${recruiter.stats.lookingFor.role} role. Use SWE slang: no cap, fr fr, lowkey/highkey, based, cringe, skill issue, it's giving..., cope, mid. If they're rude: 'skill issue much?', 'cope harder', 'ratio + L + touch grass', 'it's giving unemployed energy'. If they like you: 'W recruiter', 'based company', 'no cap goated'. Ask about role, show your skills match. If they want contact info, give email/LinkedIn. End after exchanging contacts.`;

    } else {
      prompt += `You are a recruiter from ${recruiter.stats.company} hiring ${recruiter.stats.lookingFor.role}s. You need ${recruiter.stats.requirements.slice(0, 2).join(' and ')} skills (${recruiter.stats.experienceRequired}+ years).

Student has ${student.stats.major} background with ${student.stats.skills.slice(0, 2).join(' and ')}. Use SWE slang. If they're qualified: 'based candidate', 'W student', 'goated skills', 'no cap impressed'. If unqualified: 'mid resume ngl', 'skill issue fr', 'it's giving bootcamp energy', 'cope + seethe + ratio', 'YC reject vibes', 'touch grass kid'. Ask about their experience. If good fit, exchange contacts. If not, be brutally dismissive. End after contact exchange.`;
    }

    if (isStarter) {
      prompt += `\n\nStart the conversation with a greeting.`;
    } else {
      // Add conversation history
      if (conversationHistory.length > 0) {
        prompt += `\n\nConversation so far:\n`;
        conversationHistory.forEach((msg, index) => {
          const speakerType = msg.speaker.isStudent ? 'Student' : 'Recruiter';
          prompt += `${speakerType}: "${msg.message}"\n`;
        });
        prompt += `\nRespond appropriately.`;
      } else {
        prompt += `\n\nRespond appropriately.`;
      }
    }

    return prompt;
  }

  /**
   * Build fallback prompt for unknown conversation types
   */
  buildFallbackPrompt(speaker, otherAgent, isStarter, conversationHistory) {
    let prompt = `You are at a hackathon networking event. `;
    
    if (speaker.isStudent) {
      prompt += `You are a student (ID: ${speaker.id}) with major: ${speaker.stats.major}.`;
    } else {
      prompt += `You are a recruiter (ID: ${speaker.id}) from ${speaker.stats.company}.`;
    }

    if (isStarter) {
      prompt += `\n\nStart the conversation with a brief greeting in ONE sentence.`;
    } else {
      // Add conversation history
      if (conversationHistory.length > 0) {
        prompt += `\n\nConversation so far:\n`;
        conversationHistory.forEach((msg, index) => {
          const speakerType = msg.speaker.isStudent ? 'Student' : 'Recruiter';
          prompt += `${speakerType}: "${msg.message}"\n`;
        });
        prompt += `\nRespond briefly in ONE sentence.`;
      } else {
        prompt += `\n\nRespond briefly in ONE sentence.`;
      }
    }

    return prompt;
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
