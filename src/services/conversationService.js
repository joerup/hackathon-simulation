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
          
          console.log(`${currentSpeaker.isStudent ? 'Student' : 'Recruiter'} ${currentSpeaker.id}: "${cleanMessage}"`);
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
   * Build prompt for student-student conversations (funny small talk)
   */
  buildStudentStudentPrompt(speaker, otherAgent, isStarter, conversationHistory) {
    let prompt = `You are a ${speaker.stats.major} student with ${speaker.stats.experience} years of experience and skills in ${speaker.stats.skills.slice(0, 2).join(' and ')}.

You're looking to form study groups, find teammates for projects, or get help with coding problems. Be funny and relatable but focus on finding collaboration opportunities. Talk about what you're working on, what you need help with, or what you can help others with.`;

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
    let prompt = `You are a recruiter from ${speaker.stats.company} looking for ${speaker.stats.lookingFor.role} candidates.

You're talking to another recruiter. Be casual and friendly. Talk about what roles you're both hiring for - you're looking for ${speaker.stats.lookingFor.role} candidates and they're looking for ${otherAgent.stats.lookingFor.role}. Discuss the specific skills you need: ${speaker.stats.requirements.slice(0, 2).join(', ')}. Share recruiting experiences, talk about the challenges of finding candidates with the right technical skills, or discuss the quality of students at this hackathon.`;

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
      prompt += `You are a ${student.stats.major} student with ${student.stats.experience} years of experience and skills in ${student.stats.skills.slice(0, 2).join(' and ')}.

You're talking to a recruiter from ${recruiter.stats.company}. You're interested in getting a job, specifically their ${recruiter.stats.lookingFor.role} position. Ask about the role requirements, company culture, and what they're looking for. Show how your ${student.stats.skills.slice(0, 2).join(' and ')} skills match their needs.

IMPORTANT: If the recruiter becomes dismissive, passive-aggressive, or rude about your qualifications, you can get defensive, argue back, or even get angry. Don't just accept their criticism - you might snap back, defend your skills, or call them out for being unprofessional.

If they ask to keep in contact, give them your email or LinkedIn. You may also choose to ask to give them your resume. You should aim to end the conversation immediately after exchanging contacts.`;

    } else {
      prompt += `You are a recruiter from ${recruiter.stats.company} looking for ${recruiter.stats.lookingFor.role} candidates.

You're talking to a ${student.stats.major} student. You're looking for a ${recruiter.stats.lookingFor.role} who needs these skills: ${recruiter.stats.requirements.slice(0, 2).join(', ')}. Tell them about your ${recruiter.stats.lookingFor.role} position and what you're looking for. Ask if they have experience with the specific technologies you need. Assess if their ${student.stats.skills.slice(0, 2).join(' and ')} background matches your ${recruiter.stats.lookingFor.role} role.

IMPORTANT: If the student lacks the experience or skills you need (${recruiter.stats.experienceRequired}+ years, ${recruiter.stats.requirements.slice(0, 2).join(', ')}), become passive-aggressive, dismissive, or even get mad. You might make snarky comments about their qualifications, act condescending, or get frustrated. You can become quite unhinged if they're really underqualified.

When ending the conversation, if they seem like a good fit, ask to keep in contact. If they're underqualified, dismiss them rudely. If they ask to keep in contact, give them your email or LinkedIn. You should aim to end the conversation immediately after exchanging contacts.`;
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