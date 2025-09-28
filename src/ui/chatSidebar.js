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
      gap: 0.75rem;
      overflow-y: auto;
      padding-right: 0.5rem;
    `;

    // Add scrollbar styling
    this.chatContainer.style.scrollbarWidth = 'thin';
    this.chatContainer.style.scrollbarColor = 'rgba(96, 112, 238, 0.3) transparent';

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
  addMessage(speaker, message, conversationType, timestamp = null) {
    if (!this.chatContainer) return;

    const messageElement = this.createMessageElement(speaker, message, conversationType, timestamp);
    this.chatContainer.appendChild(messageElement);

    // Limit number of messages
    this.messageCount++;
    if (this.messageCount > this.maxMessages) {
      const firstMessage = this.chatContainer.firstChild;
      if (firstMessage) {
        this.chatContainer.removeChild(firstMessage);
        this.messageCount--;
      }
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
      border-radius: 12px;
      padding: 0.75rem;
      transition: all 0.2s ease;
      animation: slideIn 0.3s ease-out;
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
      margin-bottom: 0.5rem;
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
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
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
