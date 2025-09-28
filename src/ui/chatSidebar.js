/**
 * ChatSidebar component - Displays live chat messages from conversations
 */
export class ChatSidebar {
  constructor(gameGrid = null) {
    this.gameGrid = gameGrid;
    this.sidebar = null;
    this.chatContainer = null;
    this.isInitialized = false;
    this.messageCount = 0;
    this.maxMessages = 100; // Limit messages to prevent memory issues
    this.conversationGroups = new Map(); // Map<conversationId, conversationGroup>
    this.maxConversations = 20; // Limit number of conversation groups
  }

  /**
   * Initialize the sidebar
   */
  initialize() {
    if (this.isInitialized) return;

    this.sidebar = document.createElement('div');
    this.sidebar.className = 'chat-sidebar';
    this.sidebar.style.cssText = `
      position: fixed;
      top: 60px;
      right: 0;
      width: 350px;
      height: calc(100vh - 60px);
      background: rgba(8, 10, 24, 0.95);
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      z-index: 50;
      overflow-y: auto;
      padding: 1.5rem;
      box-shadow: -2px 0 20px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    `;

    const title = document.createElement('h3');
    title.textContent = 'Live Chat';
    title.style.cssText = `
      margin: 0;
      color: #ffffff;
      font-size: 1.2rem;
      font-weight: 600;
    `;

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Real-time conversations';
    subtitle.style.cssText = `
      margin: 0.25rem 0 0 0;
      color: #8fa0ff;
      font-size: 0.85rem;
    `;

    header.appendChild(title);
    header.appendChild(subtitle);

    // Chat container
    this.chatContainer = document.createElement('div');
    this.chatContainer.className = 'chat-messages';
    this.chatContainer.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      overflow-y: auto;
      overflow-x: hidden;
      padding-right: 0.5rem;
      min-height: 0;
    `;

    // Add scrollbar styling
    this.chatContainer.style.scrollbarWidth = 'thin';
    this.chatContainer.style.scrollbarColor = 'rgba(96, 112, 238, 0.3) transparent';

    // Add webkit scrollbar styling for the main chat container
    const mainScrollbarStyle = document.createElement('style');
    if (!document.querySelector('#main-chat-scrollbar-styles')) {
      mainScrollbarStyle.id = 'main-chat-scrollbar-styles';
      mainScrollbarStyle.textContent = `
        .chat-messages::-webkit-scrollbar {
          width: 8px;
        }
        .chat-messages::-webkit-scrollbar-track {
          background: rgba(8, 10, 24, 0.3);
          border-radius: 4px;
        }
        .chat-messages::-webkit-scrollbar-thumb {
          background: rgba(96, 112, 238, 0.4);
          border-radius: 4px;
        }
        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: rgba(96, 112, 238, 0.6);
        }
      `;
      document.head.appendChild(mainScrollbarStyle);
    }

    // Assemble sidebar
    this.sidebar.appendChild(header);
    this.sidebar.appendChild(this.chatContainer);

    // Add to page
    document.body.appendChild(this.sidebar);

    // Add right margin to body to account for sidebar
    document.body.style.marginRight = '350px';

    this.isInitialized = true;

    return this.sidebar;
  }

  /**
   * Add a new chat message to the sidebar
   */
  addMessage(speaker, message, conversationType, timestamp = null, conversationId = null) {
    if (!this.chatContainer) return;

    // Generate conversation ID if not provided
    if (!conversationId) {
      conversationId = this.generateConversationId(speaker, conversationType, timestamp);
    }

    // Get or create conversation group
    let conversationGroup = this.conversationGroups.get(conversationId);
    if (!conversationGroup) {
      conversationGroup = this.createConversationGroup(conversationId, conversationType);
      this.conversationGroups.set(conversationId, conversationGroup);
      this.chatContainer.appendChild(conversationGroup.container);
    }

    // Add message to the group
    const messageElement = this.createMessageElement(speaker, message, conversationType, timestamp);
    conversationGroup.messagesContainer.appendChild(messageElement);
    conversationGroup.messageCount++;

    // Update conversation header with latest message info
    this.updateConversationHeader(conversationGroup, speaker, timestamp);

    // Limit number of conversations
    this.messageCount++;
    if (this.messageCount > this.maxMessages || this.conversationGroups.size > this.maxConversations) {
      this.cleanupOldConversations();
    }

    // Auto-scroll to bottom
    this.scrollToBottom();
  }

  /**
   * Create a message element
   */
  createMessageElement(speaker, message, conversationType, timestamp) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.style.cssText = `
      background: rgba(12, 16, 40, 0.6);
      border: 1px solid rgba(96, 112, 238, 0.2);
      border-radius: 8px;
      padding: 0.6rem;
      transition: all 0.2s ease;
      animation: slideIn 0.3s ease-out;
      margin-bottom: 0.25rem;
    `;

    // Add slide-in animation
    const style = document.createElement('style');
    if (!document.querySelector('#chat-animations')) {
      style.id = 'chat-animations';
      style.textContent = `
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Message header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.4rem;
    `;

    const speakerInfo = document.createElement('div');
    speakerInfo.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `;

    const speakerIcon = document.createElement('span');
    speakerIcon.textContent = speaker.isStudent ? '🎓' : '💼';
    speakerIcon.style.cssText = `
      font-size: 1rem;
    `;

    const speakerName = document.createElement('span');
    speakerName.textContent = `${speaker.isStudent ? 'Student' : 'Recruiter'} ${speaker.id}`;
    speakerName.style.cssText = `
      font-weight: 600;
      color: #ffffff;
      font-size: 0.9rem;
    `;

    const conversationTypeTag = document.createElement('span');
    conversationTypeTag.textContent = this.getConversationTypeLabel(conversationType);
    conversationTypeTag.style.cssText = `
      background: ${this.getConversationTypeColor(conversationType)};
      color: #ffffff;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    `;

    speakerInfo.appendChild(speakerIcon);
    speakerInfo.appendChild(speakerName);
    speakerInfo.appendChild(conversationTypeTag);

    const timeElement = document.createElement('span');
    timeElement.textContent = timestamp ? this.formatTime(timestamp) : this.formatTime(Date.now());
    timeElement.style.cssText = `
      color: #8fa0ff;
      font-size: 0.75rem;
    `;

    header.appendChild(speakerInfo);
    header.appendChild(timeElement);

    // Message content
    const content = document.createElement('div');
    content.textContent = message;
    content.style.cssText = `
      color: #e4e8ff;
      font-size: 0.9rem;
      line-height: 1.4;
      word-wrap: break-word;
    `;

    // Assemble message
    messageDiv.appendChild(header);
    messageDiv.appendChild(content);

    // Add hover effect
    messageDiv.addEventListener('mouseenter', () => {
      messageDiv.style.background = 'rgba(12, 16, 40, 0.8)';
      messageDiv.style.borderColor = 'rgba(96, 112, 238, 0.4)';
    });

    messageDiv.addEventListener('mouseleave', () => {
      messageDiv.style.background = 'rgba(12, 16, 40, 0.6)';
      messageDiv.style.borderColor = 'rgba(96, 112, 238, 0.2)';
    });

    return messageDiv;
  }

  /**
   * Get conversation type label
   */
  getConversationTypeLabel(conversationType) {
    switch (conversationType) {
      case 'student-student':
        return 'Student Chat';
      case 'recruiter-recruiter':
        return 'Recruiter Chat';
      case 'student-recruiter':
        return 'Interview';
      default:
        return 'Chat';
    }
  }

  /**
   * Get conversation type color
   */
  getConversationTypeColor(conversationType) {
    switch (conversationType) {
      case 'student-student':
        return 'rgba(112, 136, 255, 0.3)';
      case 'recruiter-recruiter':
        return 'rgba(255, 112, 112, 0.3)';
      case 'student-recruiter':
        return 'rgba(112, 255, 112, 0.3)';
      default:
        return 'rgba(96, 112, 238, 0.3)';
    }
  }

  /**
   * Format timestamp for display
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Scroll to bottom of chat
   */
  scrollToBottom() {
    if (this.chatContainer) {
      this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
  }

  /**
   * Clear all messages
   */
  clearMessages() {
    if (this.chatContainer) {
      this.chatContainer.innerHTML = '';
      this.messageCount = 0;
      this.conversationGroups.clear();
    }
  }

  /**
   * Generate a conversation ID based on speaker and conversation type
   * This is a fallback method when conversationId is not provided
   */
  generateConversationId(speaker, conversationType, timestamp) {
    // Generate a simple ID based on conversation type and timestamp
    // This should ideally be coordinated with the conversation service
    const timeKey = Math.floor(timestamp / 5000) * 5000; // Round to nearest 5 seconds
    const speakerKey = `${speaker.isStudent ? 's' : 'r'}${speaker.id}`;
    return `${conversationType}_${speakerKey}_${timeKey}`;
  }

  /**
   * Add a complete conversation with multiple messages
   */
  addConversation(conversationId, conversationType, messages, participants = null) {
    if (!this.chatContainer) return;

    // Create conversation group with participant info if available
    let conversationGroup;
    if (participants && participants.length >= 2) {
      conversationGroup = this.createConversationGroupWithParticipants(conversationId, conversationType, participants);
    } else {
      conversationGroup = this.createConversationGroup(conversationId, conversationType);
    }
    
    this.conversationGroups.set(conversationId, conversationGroup);
    this.chatContainer.appendChild(conversationGroup.container);

    // Add all messages to the group
    messages.forEach((messageData, index) => {
      const messageElement = this.createMessageElement(
        messageData.speaker, 
        messageData.message, 
        conversationType, 
        messageData.timestamp
      );
      conversationGroup.messagesContainer.appendChild(messageElement);
      conversationGroup.messageCount++;
    });

    // Update header
    conversationGroup.messageCountElement.textContent = `${conversationGroup.messageCount} message${conversationGroup.messageCount !== 1 ? 's' : ''}`;

    // Limit conversations
    if (this.conversationGroups.size > this.maxConversations) {
      this.cleanupOldConversations();
    }

    // Auto-scroll to bottom
    this.scrollToBottom();
  }

  /**
   * Create a conversation group container
   */
  createConversationGroup(conversationId, conversationType) {
    const container = document.createElement('div');
    container.className = 'conversation-group';
    container.style.cssText = `
      border: 1px solid rgba(96, 112, 238, 0.2);
      border-radius: 12px;
      overflow: hidden;
      background: rgba(8, 10, 24, 0.3);
      transition: all 0.2s ease;
      flex-shrink: 0;
    `;

    // Create collapsible header
    const header = document.createElement('div');
    header.className = 'conversation-header';
    header.style.cssText = `
      padding: 0.75rem;
      background: rgba(96, 112, 238, 0.1);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      user-select: none;
      transition: background 0.2s ease;
    `;

    // Header content
    const headerContent = document.createElement('div');
    headerContent.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `;

    // Conversation type icon
    const typeIcon = document.createElement('span');
    typeIcon.textContent = this.getConversationTypeIcon(conversationType);
    typeIcon.style.cssText = `
      font-size: 1.1rem;
    `;

    // Conversation title
    const title = document.createElement('span');
    title.textContent = this.getConversationTypeLabel(conversationType);
    title.style.cssText = `
      font-weight: 600;
      color: #ffffff;
      font-size: 0.9rem;
    `;

    // Message count
    const messageCount = document.createElement('span');
    messageCount.textContent = '0 messages';
    messageCount.style.cssText = `
      color: #8fa0ff;
      font-size: 0.8rem;
      margin-left: 0.5rem;
    `;

    headerContent.appendChild(typeIcon);
    headerContent.appendChild(title);
    headerContent.appendChild(messageCount);

    // Collapse/expand button
    const toggleButton = document.createElement('span');
    toggleButton.textContent = '▼';
    toggleButton.style.cssText = `
      color: #8fa0ff;
      font-size: 0.8rem;
      transition: transform 0.2s ease;
    `;

    header.appendChild(headerContent);
    header.appendChild(toggleButton);

    // Messages container
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'conversation-messages';
    messagesContainer.style.cssText = `
      padding: 0.5rem;
      display: none;
      flex-direction: column;
      gap: 0.5rem;
    `;

    // Assemble container
    container.appendChild(header);
    container.appendChild(messagesContainer);

    // Add hover effects
    header.addEventListener('mouseenter', () => {
      header.style.background = 'rgba(96, 112, 238, 0.2)';
    });

    header.addEventListener('mouseleave', () => {
      header.style.background = 'rgba(96, 112, 238, 0.1)';
    });

    // Add click handler for collapse/expand (start collapsed)
    let isExpanded = false;
    toggleButton.textContent = '▶';
    
    header.addEventListener('click', () => {
      isExpanded = !isExpanded;
      if (isExpanded) {
        messagesContainer.style.display = 'flex';
        toggleButton.textContent = '▼';
        toggleButton.style.transform = 'rotate(0deg)';
      } else {
        messagesContainer.style.display = 'none';
        toggleButton.textContent = '▶';
        toggleButton.style.transform = 'rotate(0deg)';
      }
    });

    return {
      container,
      header,
      messagesContainer,
      messageCount: 0,
      messageCountElement: messageCount,
      conversationId,
      conversationType,
      lastActivity: Date.now(),
      isExpanded: false
    };
  }

  /**
   * Update conversation header with latest message info
   */
  updateConversationHeader(conversationGroup, speaker, timestamp) {
    const timeStr = this.formatTime(timestamp);
    const speakerLabel = speaker.isStudent ? `Student ${speaker.id}` : `Recruiter ${speaker.id}`;
    
    // Update message count
    conversationGroup.messageCountElement.textContent = `${conversationGroup.messageCount} message${conversationGroup.messageCount !== 1 ? 's' : ''}`;
    
    // Update last activity
    conversationGroup.lastActivity = timestamp;
  }

  /**
   * Create a conversation group with participant information
   */
  createConversationGroupWithParticipants(conversationId, conversationType, participants) {
    const conversationGroup = this.createConversationGroup(conversationId, conversationType);
    
    // Update header with participant info
    const title = conversationGroup.header.querySelector('span[style*="font-weight: 600"]');
    if (title && participants && participants.length >= 2) {
      const [agent1, agent2] = participants;
      const agent1Label = agent1.isStudent ? `Student ${agent1.id}` : `Recruiter ${agent1.id}`;
      const agent2Label = agent2.isStudent ? `Student ${agent2.id}` : `Recruiter ${agent2.id}`;
      title.textContent = `${agent1Label} ↔ ${agent2Label}`;
    }
    
    return conversationGroup;
  }

  /**
   * Get conversation type icon
   */
  getConversationTypeIcon(conversationType) {
    switch (conversationType) {
      case 'student-student':
        return '🎓';
      case 'recruiter-recruiter':
        return '💼';
      case 'student-recruiter':
        return '🤝';
      default:
        return '💬';
    }
  }

  /**
   * Clean up old conversations to prevent memory issues
   */
  cleanupOldConversations() {
    if (this.conversationGroups.size <= this.maxConversations) return;

    // Remove oldest conversations
    const conversations = Array.from(this.conversationGroups.entries());
    conversations.sort((a, b) => a[1].lastActivity - b[1].lastActivity);

    const toRemove = conversations.slice(0, conversations.length - this.maxConversations);
    toRemove.forEach(([conversationId, conversationGroup]) => {
      if (conversationGroup.container.parentNode) {
        conversationGroup.container.parentNode.removeChild(conversationGroup.container);
      }
      this.conversationGroups.delete(conversationId);
      this.messageCount -= conversationGroup.messageCount;
    });
  }

  /**
   * Add a system message (e.g., conversation started/ended)
   */
  addSystemMessage(message) {
    if (!this.chatContainer) return;

    const systemDiv = document.createElement('div');
    systemDiv.style.cssText = `
      text-align: center;
      padding: 0.5rem;
      color: #8fa0ff;
      font-size: 0.8rem;
      font-style: italic;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin: 0.5rem 0;
    `;

    systemDiv.textContent = message;
    this.chatContainer.appendChild(systemDiv);

    // Auto-scroll to bottom
    this.scrollToBottom();
  }

  /**
   * Destroy the sidebar
   */
  destroy() {
    if (this.sidebar && this.sidebar.parentNode) {
      this.sidebar.parentNode.removeChild(this.sidebar);
    }

    // Remove right margin from body
    document.body.style.marginRight = '';

    this.sidebar = null;
    this.chatContainer = null;
    this.isInitialized = false;
  }
}

/**
 * Initialize and create the chat sidebar
 */
export function initChatSidebar(gameGrid = null) {
  const sidebar = new ChatSidebar(gameGrid);
  sidebar.initialize();
  return sidebar;
}
