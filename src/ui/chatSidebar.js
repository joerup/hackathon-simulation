/**
 * ChatSidebar component - Displays live chat messages from conversations
 */
export class ChatSidebar {
  constructor(gameGrid = null) {
    this.gameGrid = gameGrid;
    this.sidebar = null;
    this.chatContainer = null;
    this.toggleButton = null;
    this.contentWrapper = null;
    this.emptyStateMessage = null;
    this.isInitialized = false;
    this.isCollapsed = false;
    this.expandedWidth = '350px';
    this.collapsedWidth = '50px';
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
      width: ${this.expandedWidth};
      height: calc(100vh - 60px);
      background: rgba(253, 250, 245, 0.95);
      border-left: 2px solid rgba(139, 113, 85, 0.4);
      backdrop-filter: blur(20px);
      z-index: 50;
      overflow: visible;
      transition: width 0.3s ease, padding 0.3s ease;
      display: flex;
      flex-direction: column;
    `;

    // Toggle button - positioned to look inline when expanded, centered when collapsed
    this.toggleButton = document.createElement('button');
    this.toggleButton.className = 'sidebar-toggle';
    this.toggleButton.innerHTML = '<span style="margin-right: 4px;">▶</span>Live Chat'; // Arrow + header text
    this.toggleButton.style.cssText = `
      width: 85px;
      height: 28px;
      border: none;
      border-radius: 6px;
      background: rgba(139, 113, 85, 0.2);
      color: #8b7155;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      margin: 0.5rem 1rem 0.75rem auto;
      padding: 0 6px;
      font-weight: 500;
      white-space: nowrap;
      flex-shrink: 0;  
    `;

    this.toggleButton.addEventListener('mouseenter', () => {
      this.toggleButton.style.background = 'rgba(139, 113, 85, 0.35)';
      this.toggleButton.style.color = '#5a4a3a';
      // Preserve existing transform and add scale
      const currentTransform = this.toggleButton.style.transform;
      if (currentTransform.includes('translateX')) {
        this.toggleButton.style.transform = 'translateX(-50%) scale(1.1)';
      } else {
        this.toggleButton.style.transform = 'scale(1.1)';
      }
    });

    this.toggleButton.addEventListener('mouseleave', () => {
      this.toggleButton.style.background = 'rgba(139, 113, 85, 0.2)';
      this.toggleButton.style.color = '#8b7155';
      // Preserve existing transform and remove scale
      const currentTransform = this.toggleButton.style.transform;
      if (currentTransform.includes('translateX')) {
        this.toggleButton.style.transform = 'translateX(-50%)';
      } else {
        this.toggleButton.style.transform = 'none';
      }
    });

    this.toggleButton.addEventListener('click', () => {
      this.toggle();
    });

    // Content wrapper for padding control
    this.contentWrapper = document.createElement('div');
    this.contentWrapper.className = 'sidebar-content';
    this.contentWrapper.style.cssText = `
      padding: 0.5rem 1.5rem 1.5rem;
      flex: 1;
      overflow-y: auto;
      overflow-x: visible;
      display: flex;
      flex-direction: column;
      transition: opacity 0.2s ease;
    `;


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
    this.chatContainer.style.scrollbarColor = 'rgba(139, 113, 85, 0.5) rgba(253, 250, 245, 0.4)';

    // Add webkit scrollbar styling for the main chat container
    if (!document.querySelector('#main-chat-scrollbar-styles')) {
      const mainScrollbarStyle = document.createElement('style');
      mainScrollbarStyle.id = 'main-chat-scrollbar-styles';
      mainScrollbarStyle.textContent = `
        .chat-messages::-webkit-scrollbar {
          width: 8px;
        }
        .chat-messages::-webkit-scrollbar-track {
          background: rgba(253, 250, 245, 0.7);
          border-radius: 4px;
        }
        .chat-messages::-webkit-scrollbar-thumb {
          background: rgba(139, 113, 85, 0.4);
          border-radius: 4px;
        }
        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 113, 85, 0.6);
        }
      `;
      document.head.appendChild(mainScrollbarStyle);
    }

    // Empty state placeholder
    this.emptyStateMessage = document.createElement('div');
    this.emptyStateMessage.className = 'empty-state-message';
    this.emptyStateMessage.textContent = 'No live messages yet...';
    this.emptyStateMessage.style.cssText = `
      color: #8b6f47;
      font-size: 0.9rem;
      font-style: italic;
      text-align: center;
      padding: 2rem 1rem;
      align-self: center;
      margin: auto 0;
    `;
    
    // Initially show empty state
    this.chatContainer.appendChild(this.emptyStateMessage);

    // Assemble content wrapper - header and chat only
    this.contentWrapper.appendChild(this.chatContainer);

    // Assemble sidebar - button stays outside content wrapper but positioned inline when expanded
    this.sidebar.appendChild(this.toggleButton);
    this.sidebar.appendChild(this.contentWrapper);

    // Add to page
    document.body.appendChild(this.sidebar);

    // Add right margin to body to account for sidebar
    this.updateBodyMargin();

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

    // Hide empty state message when first message is added
    if (this.emptyStateMessage && this.emptyStateMessage.parentNode) {
      this.chatContainer.removeChild(this.emptyStateMessage);
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

    // Update total message count
    this.messageCount++;

    // Limit number of conversations
    if (this.messageCount > this.maxMessages || this.conversationGroups.size > this.maxConversations) {
      this.cleanupOldConversations();
    }

    // Show empty state again if no conversations remain after cleanup
    if (this.conversationGroups.size === 0 && this.emptyStateMessage && !this.emptyStateMessage.parentNode) {
      this.chatContainer.appendChild(this.emptyStateMessage);
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
      background: rgba(253, 250, 245, 0.95);
      border: 1px solid rgba(139, 113, 85, 0.25);
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
      color: #3d2f1f;
      font-size: 0.9rem;
    `;

    const conversationTypeTag = document.createElement('span');
    conversationTypeTag.textContent = this.getConversationTypeLabel(conversationType);
    conversationTypeTag.style.cssText = `
      background: ${this.getConversationTypeColor(conversationType)};
      color: #3d2f1f;
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
      color: #8b6f47;
      font-size: 0.75rem;
    `;

    header.appendChild(speakerInfo);
    header.appendChild(timeElement);

    // Message content
    const content = document.createElement('div');
    content.textContent = message;
    content.style.cssText = `
      color: #5a4a3a;
      font-size: 0.9rem;
      line-height: 1.4;
      word-wrap: break-word;
    `;

    // Assemble message
    messageDiv.appendChild(header);
    messageDiv.appendChild(content);

    // Add hover effect
    messageDiv.addEventListener('mouseenter', () => {
      messageDiv.style.background = 'rgba(253, 250, 245, 1)';
      messageDiv.style.borderColor = 'rgba(139, 113, 85, 0.4)';
      messageDiv.style.boxShadow = '0 4px 12px rgba(139, 113, 85, 0.25)';
    });

    messageDiv.addEventListener('mouseleave', () => {
      messageDiv.style.background = 'rgba(253, 250, 245, 0.95)';
      messageDiv.style.borderColor = 'rgba(139, 113, 85, 0.25)';
      messageDiv.style.boxShadow = 'none';
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
        return 'rgba(212, 165, 116, 0.35)';
      case 'recruiter-recruiter':
        return 'rgba(200, 160, 120, 0.35)';
      case 'student-recruiter':
        return 'rgba(184, 158, 130, 0.35)';
      default:
        return 'rgba(212, 165, 116, 0.25)';
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
      
      // Show empty state message when all messages are cleared
      if (this.emptyStateMessage) {
        this.chatContainer.appendChild(this.emptyStateMessage);
      }
    }
  }

  /**
   * Generate a conversation ID based on speaker and conversation type
   * This is a fallback method when conversationId is not provided
   */
  generateConversationId(speaker, conversationType, timestamp) {
    // Generate a simple ID based on conversation type and timestamp
    // This should ideally be coordinated with the conversation service
    const currentTime = timestamp || Date.now();
    const timeKey = Math.floor(currentTime / 5000) * 5000; // Round to nearest 5 seconds
    const speakerKey = `${speaker.isStudent ? 's' : 'r'}${speaker.id}`;
    return `${conversationType}_${speakerKey}_${timeKey}`;
  }

  /**
   * Add a complete conversation with multiple messages
   */
  addConversation(conversationId, conversationType, messages, participants = null) {
    if (!this.chatContainer) return;

    // Hide empty state message when first conversation is added
    if (this.emptyStateMessage && this.emptyStateMessage.parentNode) {
      this.chatContainer.removeChild(this.emptyStateMessage);
    }

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
      this.messageCount++; // Update total message count
    });

    // Update header
    conversationGroup.messageCountElement.textContent = `${conversationGroup.messageCount} message${conversationGroup.messageCount !== 1 ? 's' : ''}`;

    // Update last activity
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      conversationGroup.lastActivity = lastMessage.timestamp || Date.now();
    }

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
      border: 1px solid rgba(139, 113, 85, 0.3);
      border-radius: 12px;
      overflow: hidden;
      background: rgba(253, 250, 245, 0.85);
      transition: all 0.2s ease;
      flex-shrink: 0;
    `;

    // Create collapsible header
    const header = document.createElement('div');
    header.className = 'conversation-header';
    header.style.cssText = `
      padding: 0.75rem;
      background: rgba(139, 113, 85, 0.12);
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
      color: #3d2f1f;
      font-size: 0.9rem;
    `;

    // Message count
    const messageCount = document.createElement('span');
    messageCount.textContent = '0 messages';
    messageCount.style.cssText = `
      color: #8b6f47;
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
      color: #8b7155;
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
      header.style.background = 'rgba(139, 113, 85, 0.18)';
    });

    header.addEventListener('mouseleave', () => {
      header.style.background = 'rgba(139, 113, 85, 0.12)';
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
    const currentTime = timestamp || Date.now();
    const timeStr = this.formatTime(currentTime);
    const speakerLabel = speaker.isStudent ? `Student ${speaker.id}` : `Recruiter ${speaker.id}`;
    
    // Update message count
    conversationGroup.messageCountElement.textContent = `${conversationGroup.messageCount} message${conversationGroup.messageCount !== 1 ? 's' : ''}`;
    
    // Update last activity
    conversationGroup.lastActivity = currentTime;
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

    // Show empty state if no conversations remain
    if (this.conversationGroups.size === 0 && this.emptyStateMessage && !this.emptyStateMessage.parentNode) {
      this.chatContainer.appendChild(this.emptyStateMessage);
    }
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
   * Toggle sidebar collapsed state
   */
  toggle() {
    if (this.isCollapsed) {
      this.expand();
    } else {
      this.collapse();
    }
  }

  /**
   * Collapse the sidebar
   */
  collapse() {
    if (this.isCollapsed) return;

    this.isCollapsed = true;
    this.sidebar.style.width = this.collapsedWidth;
    this.contentWrapper.style.opacity = '0';
    this.toggleButton.innerHTML = '◀'; // Left arrow for expand - no text when collapsed
    
    // Center the button in the collapsed strip with high z-index to ensure clickability
    this.toggleButton.style.position = 'absolute';
    this.toggleButton.style.top = '15px';
    this.toggleButton.style.left = '50%';
    this.toggleButton.style.right = 'auto';
    this.toggleButton.style.transform = 'translateX(-50%)';
    this.toggleButton.style.width = '32px';
    this.toggleButton.style.minWidth = '32px';
    this.toggleButton.style.height = '32px';
    this.toggleButton.style.borderRadius = '8px';
    this.toggleButton.style.margin = '0';
    this.toggleButton.style.padding = '0';
    this.toggleButton.style.zIndex = '100';
    this.toggleButton.style.pointerEvents = 'auto';
    
    // Update body margin
    this.updateBodyMargin();

    // Notify game grid of sidebar state change
    if (this.gameGrid && this.gameGrid.handleSidebarToggle) {
      this.gameGrid.handleSidebarToggle();
    }
  }

  /**
   * Expand the sidebar
   */
  expand() {
    if (!this.isCollapsed) return;

    this.isCollapsed = false;
    this.sidebar.style.width = this.expandedWidth;
    this.contentWrapper.style.opacity = '1';
    this.toggleButton.innerHTML = '<span style="margin-right: 4px;">▶</span>Live Chat'; // Right arrow for collapse
    
    // Restore inline-like positioning (but still positioned for visibility)
    this.toggleButton.style.position = 'static';
    this.toggleButton.style.top = 'auto';
    this.toggleButton.style.left = 'auto';
    this.toggleButton.style.right = 'auto';
    this.toggleButton.style.transform = 'none';
    this.toggleButton.style.width = '95px';
    this.toggleButton.style.minWidth = '95px';
    this.toggleButton.style.height = '24px';
    this.toggleButton.style.borderRadius = '4px';
    this.toggleButton.style.margin = '0.5rem 0 0.75rem 1rem';
    this.toggleButton.style.padding = '0 6px';
    this.toggleButton.style.justifyContent = 'center';
    this.toggleButton.style.flexShrink = '0';
    this.toggleButton.style.zIndex = 'auto';
    this.toggleButton.style.pointerEvents = 'auto';
    
    // Update body margin
    this.updateBodyMargin();

    // Notify game grid of sidebar state change
    if (this.gameGrid && this.gameGrid.handleSidebarToggle) {
      this.gameGrid.handleSidebarToggle();
    }
  }

  /**
   * Update body margin based on sidebar state
   */
  updateBodyMargin() {
    const marginValue = this.isCollapsed ? '50px' : '350px';
    document.body.style.marginRight = marginValue;
  }

  /**
   * Check if sidebar is collapsed
   */
  isCollapsedState() {
    return this.isCollapsed;
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
    this.toggleButton = null;
    this.contentWrapper = null;
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
