/**
 * ChatBubble class - Creates temporary chat bubbles above agents during conversations
 */
export class ChatBubble {
  constructor() {
    this.activeBubbles = new Map(); // Map<agentId, bubbleElement>
    this.bubbleContainer = null;
    this.initializeBubbleContainer();
  }

  /**
   * Initialize the bubble container that overlays the grid
   */
  initializeBubbleContainer() {
    // Find or create the bubble container
    this.bubbleContainer = document.querySelector('.chat-bubble-container');

    if (!this.bubbleContainer) {
      this.bubbleContainer = document.createElement('div');
      this.bubbleContainer.className = 'chat-bubble-container';
      this.bubbleContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000;
      `;

      // Insert into the game grid container
      const gameGridContainer = document.querySelector('.game-grid-container');
      if (gameGridContainer) {
        gameGridContainer.style.position = 'relative';
        gameGridContainer.appendChild(this.bubbleContainer);
      }
    }
  }

  /**
   * Show a chat bubble above an agent
   * @param {string} agentId - The agent's ID
   * @param {string} message - The message to display
   * @param {number} duration - How long to show the bubble (ms)
   * @param {boolean} isStudent - Whether the agent is a student
   */
  showBubble(agentId, message, duration = 3000, isStudent = true) {
    // Remove existing bubble for this agent if any
    this.hideBubble(agentId);

    // Ensure bubble container exists
    this.initializeBubbleContainer();

    // Find the agent's cell in the grid
    const agentCell = document.querySelector(`[data-agent-id="${agentId}"]`);
    if (!agentCell) {
      console.warn(`Could not find agent cell for ID: ${agentId}`);
      return;
    }

    const gridCell = agentCell.closest('.grid-cell');
    if (!gridCell) {
      console.warn(`Could not find grid cell for agent: ${agentId}`);
      return;
    }

    // Create the bubble element
    const bubble = this.createBubbleElement(message, isStudent);

    // Position the bubble above the agent
    this.positionBubble(bubble, gridCell);

    // Add to container and track
    this.bubbleContainer.appendChild(bubble);
    this.activeBubbles.set(agentId, bubble);

    // Animate in
    this.animateBubbleIn(bubble);

    // Auto-hide after duration
    setTimeout(() => {
      this.hideBubble(agentId);
    }, duration);
  }

  /**
   * Create the bubble DOM element
   */
  createBubbleElement(message, isStudent) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${isStudent ? 'student' : 'recruiter'}`;

    // Style the bubble
    bubble.style.cssText = `
      position: absolute;
      max-width: 200px;
      padding: 8px 12px;
      border-radius: 18px;
      font-size: 12px;
      line-height: 1.3;
      font-weight: 500;
      text-align: center;
      word-wrap: break-word;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transform: scale(0);
      transition: all 0.2s ease-out;
      z-index: 1001;
      pointer-events: none;
    `;

    // White and slightly transparent styling for all bubbles
    bubble.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    bubble.style.color = '#333333';
    bubble.style.border = '2px solid rgba(255, 255, 255, 0.8)';

    // Add the message text
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    bubble.appendChild(messageSpan);

    // Add speech bubble tail
    const tail = document.createElement('div');
    tail.className = 'bubble-tail';
    tail.style.cssText = `
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid rgba(255, 255, 255, 0.8);
    `;
    bubble.appendChild(tail);

    return bubble;
  }

  /**
   * Position the bubble above the grid cell
   */
  positionBubble(bubble, gridCell) {
    const containerRect = this.bubbleContainer.getBoundingClientRect();
    const cellRect = gridCell.getBoundingClientRect();

    // Calculate position relative to the bubble container
    const x = cellRect.left - containerRect.left + (cellRect.width / 2);
    const y = cellRect.top - containerRect.top; // Position so bubble bottom aligns with cell top

    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
    bubble.style.transform = 'translateX(-50%) translateY(-100%) scale(0)';
  }

  /**
   * Animate bubble appearing
   */
  animateBubbleIn(bubble) {
    // Small delay to ensure positioning is complete
    requestAnimationFrame(() => {
      bubble.style.transform = 'translateX(-50%) translateY(-100%) scale(1)';
    });
  }

  /**
   * Hide and remove a bubble for a specific agent
   */
  hideBubble(agentId) {
    const bubble = this.activeBubbles.get(agentId);
    if (bubble) {
      // Animate out
      bubble.style.transform = 'translateX(-50%) translateY(-100%) scale(0)';
      bubble.style.opacity = '0';

      // Remove after animation
      setTimeout(() => {
        if (bubble.parentNode) {
          bubble.parentNode.removeChild(bubble);
        }
        this.activeBubbles.delete(agentId);
      }, 200);
    }
  }

  /**
   * Hide all active bubbles
   */
  hideAllBubbles() {
    this.activeBubbles.forEach((bubble, agentId) => {
      this.hideBubble(agentId);
    });
  }

  /**
   * Update bubble positions (call this when grid resizes)
   */
  updateBubblePositions() {
    this.activeBubbles.forEach((bubble, agentId) => {
      const agentCell = document.querySelector(`[data-agent-id="${agentId}"]`);
      if (agentCell) {
        const gridCell = agentCell.closest('.grid-cell');
        if (gridCell) {
          this.positionBubble(bubble, gridCell);
        }
      }
    });
  }

  /**
   * Clean up the chat bubble system
   */
  destroy() {
    this.hideAllBubbles();
    if (this.bubbleContainer && this.bubbleContainer.parentNode) {
      this.bubbleContainer.parentNode.removeChild(this.bubbleContainer);
    }
    this.bubbleContainer = null;
    this.activeBubbles.clear();
  }
}

// Create and export a singleton instance
export const chatBubble = new ChatBubble();