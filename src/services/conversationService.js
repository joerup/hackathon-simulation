import { snapdragonConfig } from "../config.js";
import { chatBubble } from "../ui/chatBubble.js";

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
      
      // Start the conversation loop
      const messages = [];
      let currentSpeaker = starter;
      let currentListener = responder;
      let previousMessage = null;
      let isFirstMessage = true;
      let conversationEnded = false;
      let turnCount = 0;
      const maxTurns = 10; // Strict limit: 10 exchanges max

      while (!conversationEnded && turnCount < maxTurns) {
        let message;
        let messageEndsConversation = false;
        let cleanMessage;

        // Check if we're at the final turn
        if (turnCount === maxTurns - 1) {
          // Generate final message and force ending
          message = await this.generateMessage(currentSpeaker, currentListener, context, isFirstMessage, messages);
          cleanMessage = message.replace(/\s*\[end\]/gi, '').trim();
          
          // Generate a brief farewell and force [end]
          const farewells = ["nice meeting you", "see ya", "gotta go", "catch you later", "take care"];
          const farewell = farewells[Math.floor(Math.random() * farewells.length)];
          
          // Use the generated message if it's short, otherwise use farewell
          if (cleanMessage.length <= 15) {
            cleanMessage = `${cleanMessage} [end]`;
          } else {
            cleanMessage = `${farewell} [end]`;
          }
          
          messageEndsConversation = true;
          console.log(`[FORCED END] ${currentSpeaker.isStudent ? 'Student' : 'Recruiter'} ${currentSpeaker.id}: "${cleanMessage.replace(' [end]', '')}"`);
        } else {
          // Normal message generation
          message = await this.generateMessage(currentSpeaker, currentListener, context, isFirstMessage, messages);
          
          // Check if conversation should end (case-insensitive)
          messageEndsConversation = message.toLowerCase().includes('[end]');
          cleanMessage = message.replace(/\s*\[end\]/gi, '').trim();
          
          // For student-student conversations, check if message is just a single emoji
          if (currentSpeaker.isStudent && currentListener.isStudent && this.isSingleEmoji(cleanMessage)) {
            messageEndsConversation = true;
            console.log(`[EMOJI END] ${currentSpeaker.isStudent ? 'Student' : 'Recruiter'} ${currentSpeaker.id}: "${cleanMessage}"`);
          } else {
            console.log(`${currentSpeaker.isStudent ? 'Student' : 'Recruiter'} ${currentSpeaker.id}: "${cleanMessage}"`);
          }
        }

        // Show message in chat bubble with longer duration
        const bubbleDuration = 3000; // 3 seconds to read the message
        const displayMessage = cleanMessage.replace(' [end]', '');
        chatBubble.showBubble(currentSpeaker.id, displayMessage, bubbleDuration, currentSpeaker.isStudent);

        // Store the message
        messages.push({
          speaker: currentSpeaker,
          message: displayMessage,
          timestamp: Date.now()
        });

        // Check for end conditions
        if (messageEndsConversation) {
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
        messageCount: messages.length,
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

    // If no API key, use fallback conversation
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
              content: "You are simulating a conversation at a networking event. MAXIMUM 5 WORDS per response. Never use quotes around text. Use super short, casual spoken language. Keep words short and simple. Don't mention your ID number or compare yourself to others. Do not repeat what has already been said. After 2-4 exchanges, when conversation feels complete, add ' [END]' to your response. Do not end immediately after being asked a question. IMPORTANT: Type in all lowercase and avoid punctuation. You may also choose to respond using an emoji and no other text."
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
   * Check if a message is just a single emoji
   * @param {string} message - Message to check
   * @returns {boolean} True if message is just one emoji
   */
  isSingleEmoji(message) {
    // Remove whitespace and check if it's a single emoji
    const trimmed = message.trim();
    if (trimmed.length === 0) return false;
    
    // Comprehensive emoji detection regex
    const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]$/u;
    
    // Also check for specific emojis we're encouraging
    const commonEmojis = ['😭', '🥀', '💀', '🔥', '👀', '🤯', '💯', '🙌', '😂', '🤔', '😎'];
    const isCommonEmoji = commonEmojis.includes(trimmed);
    
    return (emojiRegex.test(trimmed) || isCommonEmoji) && trimmed.length <= 4; // Account for multi-byte emojis
  }

  /**
   * Format agent data for prompt context
   * @param {Object} agent - Agent object with stats
   * @returns {string} Formatted agent data string
   */
  formatAgentContext(agent) {
    if (agent.isStudent) {
      return `STUDENT PROFILE:
- Name: ${agent.stats.name}
- Major: ${agent.stats.major}
- GPA: ${agent.stats.gpa}
- Experience: ${agent.stats.experience} years
- Skills: ${agent.stats.skills.join(', ')}
- Detailed Skills: ${agent.stats.skillsDetailed.map(s => `${s.label} (${s.score}/100)`).join(', ')}
- Networking Level: ${agent.stats.networking}/5
- Energy Score: ${agent.stats.energyScore}/100
- Luck: ${agent.stats.luck}/100
- Internships: ${agent.stats.internships}
- Buzzwords: ${agent.stats.buzzwords.join(', ')}
- Summary: ${agent.stats.summary}
- Job Offers: ${agent.stats.jobOffers}`;
    } else {
      return `RECRUITER PROFILE:
- Name: ${agent.stats.name}
- Company: ${agent.stats.company}
- Position: ${agent.stats.position}
- Looking For: ${agent.stats.lookingFor.role} at ${agent.stats.lookingFor.company}
- Required Skills: ${agent.stats.requirements.join(', ')}
- Experience Required: ${agent.stats.experienceRequired}+ years
- Preferences: ${agent.stats.lookingFor.preferences}`;
    }
  }

  /**
   * Build prompt for student-student conversations (brainrot and meme culture)
   */
  buildStudentStudentPrompt(speaker, otherAgent, isStarter, conversationHistory) {
    // Roll dice to determine brainrot intensity (1-6)
    const brainrotLevel = Math.floor(Math.random() * 6) + 1;
    const shouldUseBrainrot = brainrotLevel >= 3; // 50% chance for brainrot mode
    
    let prompt = `YOU ARE: ${speaker.stats.name}, a ${speaker.stats.major} student

YOUR BACKGROUND:
- ${speaker.stats.experience} years experience in ${speaker.stats.skills.slice(0, 2).join(' & ')}
- GPA: ${speaker.stats.gpa}, ${speaker.stats.internships} internships
- Energy: ${speaker.stats.energyScore}/100, Networking: ${speaker.stats.networking}/5
- Personality: ${speaker.stats.summary}
- Buzzwords you use: ${speaker.stats.buzzwords.join(', ')}

TALKING TO: ${otherAgent.stats.name} (${otherAgent.stats.major}, ${otherAgent.stats.experience}yr exp, skills: ${otherAgent.stats.skills.slice(0, 2).join(' & ')})

STYLE: You're a CS student who bonds over ${shouldUseBrainrot ? 'pure internet brainrot slang (no cap, sus, cringe, yeet, etc) 😭🥀💀' : 'coding memes and shared struggles 😭💀'}

RULES: Max 4-5 words + emoji OR just single emoji (ends convo)`;

    if (isStarter) {
      prompt += `\n\nStart conversation:`;
    } else {
      // Add conversation history
      if (conversationHistory.length > 0) {
        prompt += `\n\nConversation:\n`;
        conversationHistory.forEach((msg, index) => {
          const speakerType = msg.speaker.isStudent ? 'Student' : 'Recruiter';
          prompt += `${speakerType}: "${msg.message}"\n`;
        });
        prompt += `\nYour response:`;
      } else {
        prompt += `\n\nYour response:`;
      }
    }

    return prompt;
  }

  /**
   * Build prompt for recruiter-recruiter conversations (smack talk about students)
   */
  buildRecruiterRecruiterPrompt(speaker, otherAgent, isStarter, conversationHistory) {
    let prompt = `YOU ARE: ${speaker.stats.name}, recruiter at ${speaker.stats.company}

YOUR BACKGROUND:
- Position: ${speaker.stats.position}
- Hiring for: ${speaker.stats.lookingFor.role} 
- Need: ${speaker.stats.requirements.join(', ')} (${speaker.stats.experienceRequired}+ years)
- Style: ${speaker.stats.lookingFor.preferences}

TALKING TO: ${otherAgent.stats.name} from ${otherAgent.stats.company} (hiring ${otherAgent.stats.lookingFor.role})

STYLE: Casual recruiter talk - compare roles, requirements, share experiences about finding good candidates`;

    if (isStarter) {
      prompt += `\n\nStart conversation:`;
    } else {
      // Add conversation history
      if (conversationHistory.length > 0) {
        prompt += `\n\nConversation:\n`;
        conversationHistory.forEach((msg, index) => {
          const speakerType = msg.speaker.isStudent ? 'Student' : 'Recruiter';
          prompt += `${speakerType}: "${msg.message}"\n`;
        });
        prompt += `\nYour response:`;
      } else {
        prompt += `\n\nYour response:`;
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

    let prompt = `YOU ARE: ${speaker.stats.name}

YOUR BACKGROUND:`;

    if (speaker.isStudent) {
      prompt += `
- ${student.stats.major} student, ${student.stats.experience}yr exp
- Skills: ${student.stats.skills.slice(0, 3).join(', ')}
- GPA: ${student.stats.gpa}, ${student.stats.internships} internships
- Energy: ${student.stats.energyScore}/100

TALKING TO: ${recruiter.stats.name} from ${recruiter.stats.company}
- Hiring: ${recruiter.stats.lookingFor.role}
- Needs: ${recruiter.stats.requirements.slice(0, 2).join(', ')} (${recruiter.stats.experienceRequired}+ years)

GOAL: Get the job. Show your skills match their needs. If they're rude about your qualifications, get defensive.`;

    } else {
      prompt += `
- Recruiter at ${recruiter.stats.company}
- Hiring: ${recruiter.stats.lookingFor.role}
- Need: ${recruiter.stats.requirements.slice(0, 2).join(', ')} (${recruiter.stats.experienceRequired}+ years)

TALKING TO: ${student.stats.name}
- ${student.stats.major} student, ${student.stats.experience}yr exp
- Skills: ${student.stats.skills.slice(0, 3).join(', ')}
- GPA: ${student.stats.gpa}

GOAL: Assess if they're qualified. If they lack experience/skills, become dismissive or frustrated.`;
    }

    if (isStarter) {
      prompt += `\n\nStart conversation:`;
    } else {
      // Add conversation history
      if (conversationHistory.length > 0) {
        prompt += `\n\nConversation:\n`;
        conversationHistory.forEach((msg, index) => {
          const speakerType = msg.speaker.isStudent ? 'Student' : 'Recruiter';
          prompt += `${speakerType}: "${msg.message}"\n`;
        });
        prompt += `\nYour response:`;
      } else {
        prompt += `\n\nYour response:`;
      }
    }

    return prompt;
  }

  /**
   * Build fallback prompt for unknown conversation types
   */
  buildFallbackPrompt(speaker, otherAgent, isStarter, conversationHistory) {
    let prompt = `YOU ARE: ${speaker.stats.name}

YOUR BACKGROUND:`;
    
    if (speaker.isStudent) {
      prompt += `
- ${speaker.stats.major} student, ${speaker.stats.experience}yr exp
- Skills: ${speaker.stats.skills.slice(0, 2).join(', ')}
- GPA: ${speaker.stats.gpa}

TALKING TO: ${otherAgent.stats.name} (${otherAgent.isStudent ? otherAgent.stats.major + ' student' : otherAgent.stats.company + ' recruiter'})`;
    } else {
      prompt += `
- Recruiter at ${speaker.stats.company}
- Hiring: ${speaker.stats.lookingFor.role}

TALKING TO: ${otherAgent.stats.name} (${otherAgent.isStudent ? otherAgent.stats.major + ' student' : otherAgent.stats.company + ' recruiter'})`;
    }

    prompt += `\n\nSTYLE: Casual networking conversation`;

    if (isStarter) {
      prompt += `\n\nStart conversation:`;
    } else {
      // Add conversation history
      if (conversationHistory.length > 0) {
        prompt += `\n\nConversation:\n`;
        conversationHistory.forEach((msg, index) => {
          const speakerType = msg.speaker.isStudent ? 'Student' : 'Recruiter';
          prompt += `${speakerType}: "${msg.message}"\n`;
        });
        prompt += `\nYour response:`;
      } else {
        prompt += `\n\nYour response:`;
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

  /**
   * Get conversation data by ID
   * @param {string} conversationId - Conversation ID
   * @returns {Object|null} Conversation data or null
   */
  getConversationData(conversationId) {
    return this.activeConversations.get(conversationId) || null;
  }
}