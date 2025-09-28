import { chatBubble } from "./ui/chatBubble.js";

/**
 * GridRenderer class - Handles all rendering logic for the game grid
 * Completely separated from game state logic
 */
export class GridRenderer {
  constructor(gameState, container = null) {
    this.gameState = gameState;
    this.container = container;
    this.gridElement = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the renderer and create the visual grid
   */
  initialize() {
    if (this.isInitialized) return;

    this.container = document.createElement('div');
    this.container.className = 'game-grid-container';

    this.gridElement = document.createElement('div');
    this.gridElement.className = 'game-grid';
    this.gridElement.style.display = 'grid';
    this.gridElement.style.gridTemplateColumns = `repeat(${this.gameState.size}, 1fr)`;
    this.gridElement.style.gap = '2px';
    this.gridElement.style.background = 'linear-gradient(135deg, #DEB887, #F4A460, #D2B48C)';
    this.gridElement.style.padding = '10px';
    this.gridElement.style.borderRadius = '8px';
    this.gridElement.style.border = '1px solid rgba(139, 113, 85, 0.3)';

    this.createGridCells();
    this.container.appendChild(this.gridElement);

    // Add resize event listener for responsive design
    this.setupResizeHandler();

    this.isInitialized = true;
    return this.container;
  }

  /**
   * Create all grid cells
   */
  createGridCells() {
    // Calculate adaptive cell size based on viewport
    const cellSize = this.calculateCellSize();
    const fontSize = Math.max(8, Math.floor(cellSize * 0.4));

    for (let y = 0; y < this.gameState.size; y++) {
      for (let x = 0; x < this.gameState.size; x++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.style.width = `${cellSize}px`;
        cell.style.height = `${cellSize}px`;
        cell.style.border = '1px solid rgba(160, 120, 80, 0.4)';
        cell.style.display = 'flex';
        cell.style.alignItems = 'center';
        cell.style.justifyContent = 'center';
        cell.style.fontSize = `${fontSize}px`;
        cell.style.fontWeight = 'bold';
        cell.style.position = 'relative';

        cell.setAttribute('data-x', x);
        cell.setAttribute('data-y', y);
        this.gridElement.appendChild(cell);
      }
    }
  }

  /**
   * Calculate optimal cell size based on viewport dimensions
   */
  calculateCellSize() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Get current body margins to account for sidebar states
    const computedStyle = window.getComputedStyle(document.body);
    const leftMargin = parseInt(computedStyle.marginLeft) || 0;
    const rightMargin = parseInt(computedStyle.marginRight) || 0;

    // Account for header (60px), padding (4rem = 64px), speed control (~120px), and extra margins
    const reservedWidth = 40; // Additional padding/margins around content
    const reservedHeight = 60 + 64 + 120 + 40; // Header + padding + speed control + margin

    // Calculate available space considering dynamic sidebar margins
    const availableWidth = viewportWidth - leftMargin - rightMargin - reservedWidth;
    const availableHeight = viewportHeight - reservedHeight;

    // Calculate max cell size that fits in both dimensions
    const maxCellWidth = Math.floor(availableWidth / this.gameState.size);
    const maxCellHeight = Math.floor(availableHeight / this.gameState.size);

    // Use the smaller dimension to ensure grid fits on screen
    const cellSize = Math.min(maxCellWidth, maxCellHeight);

    // Set minimum and maximum bounds with smaller minimum for mobile
    const minSize = viewportWidth < 680 ? 12 : 15;
    const maxSize = viewportWidth < 680 ? 40 : 60;
    
    return Math.max(minSize, Math.min(cellSize, maxSize));
  }

  /**
   * Setup window resize handler for responsive design
   */
  setupResizeHandler() {
    let resizeTimeout;

    const handleResize = () => {
      // Debounce resize events
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.resizeGrid();
      }, 250);
    };

    window.addEventListener('resize', handleResize);

    // Store reference for cleanup
    this.resizeHandler = handleResize;
  }

  /**
   * Resize the grid cells when window size changes
   */
  resizeGrid() {
    if (!this.gridElement) return;

    const cellSize = this.calculateCellSize();
    const fontSize = Math.max(8, Math.floor(cellSize * 0.4));

    const cells = this.gridElement.querySelectorAll('.grid-cell');
    cells.forEach(cell => {
      cell.style.width = `${cellSize}px`;
      cell.style.height = `${cellSize}px`;
      cell.style.fontSize = `${fontSize}px`;
    });

    // Update chat bubble positions when grid resizes
    chatBubble.updateBubblePositions();
  }

  /**
   * Update the visual display based on current game state
   */
  updateDisplay() {
    if (!this.gridElement) return;

    const cells = this.gridElement.querySelectorAll('.grid-cell');

    cells.forEach(cell => {
      const x = parseInt(cell.getAttribute('data-x'));
      const y = parseInt(cell.getAttribute('data-y'));
      const cellData = this.gameState.getCell(x, y);

      // Reset cell styles
      this.resetCellStyles(cell);

      if (cellData) {
        this.renderCell(cell, cellData, x, y);
      }
    });
  }

  /**
   * Reset cell visual styles
   */
  resetCellStyles(cell) {
    cell.style.backgroundColor = '';
    cell.textContent = '';
    cell.style.color = '';
    cell.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    cell.style.boxShadow = '';
  }

  /**
   * Render a specific cell based on its data
   */
  renderCell(cell, cellData, x, y) {
    switch (cellData.type) {
      case 'obstacle':
        this.renderObstacleCell(cell, cellData);
        break;
      case 'agent':
        this.renderAgentCell(cell, cellData);
        break;
      case 'walkable':
      default:
        this.renderWalkableCell(cell);
        break;
    }
  }

  /**
   * Render an obstacle cell with a potted plant
   */
  renderObstacleCell(cell, cellData) {
    cell.style.backgroundColor = 'rgba(222, 184, 135, 0.4)'; // Same as walkable cells
    cell.innerHTML = '';

    // Create a simple potted plant sprite
    const plant = document.createElement('div');
    plant.style.cssText = `
      position: relative;
      width: 80%;
      height: 80%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
    `;

    // Pot
    const pot = document.createElement('div');
    pot.style.cssText = `
      width: 60%;
      height: 40%;
      background: linear-gradient(145deg, #CD853F, #D2691E);
      border-radius: 0 0 50% 50%;
      border: 1px solid #A0522D;
      position: relative;
    `;

    // Plant leaves
    const leaves = document.createElement('div');
    leaves.style.cssText = `
      position: absolute;
      bottom: 35%;
      left: 50%;
      transform: translateX(-50%);
      font-size: ${Math.max(8, cell.offsetWidth * 0.4)}px;
      color: #228B22;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    `;
    leaves.textContent = '🌿';

    plant.appendChild(pot);
    plant.appendChild(leaves);
    cell.appendChild(plant);
  }

  /**
   * Render an agent cell
   */
  renderAgentCell(cell, cellData) {
    const agent = cellData.agent;
    if (!agent) return;

    cell.innerHTML = '';
    cell.textContent = '';

    const isStudent = Boolean(agent.isStudent);
    const inConversation = Boolean(agent.inConversation);

    const baseBackground = isStudent ? 'rgba(245, 222, 179, 0.8)' : 'rgba(222, 184, 135, 0.8)';
    const convoBackground = isStudent ? 'rgba(255, 236, 170, 0.9)' : 'rgba(240, 230, 140, 0.9)';
    const baseBorder = isStudent ? '1px solid rgba(160, 120, 80, 0.6)' : '1px solid rgba(205, 133, 63, 0.7)';

    cell.style.backgroundColor = inConversation ? convoBackground : baseBackground;
    cell.style.border = inConversation ? '2px solid rgba(184, 134, 11, 0.9)' : baseBorder;
    cell.style.boxShadow = inConversation ? '0 0 12px rgba(255, 245, 200, 0.75)' : '0 1px 3px rgba(0, 0, 0, 0.3)';
    cell.style.color = '';
    cell.style.padding = '2px';

    const avatar = this.buildAgentAvatar(agent);
    if (inConversation) {
      avatar.classList.add('is-speaking');
    }

    cell.appendChild(avatar);
  }

  buildAgentAvatar(agent) {
    const appearance = agent.appearance || {};
    const avatar = document.createElement('div');
    avatar.className = 'agent-avatar';
    avatar.dataset.agentId = agent.id;

    if (!agent.isStudent) {
      avatar.classList.add('is-recruiter');
    }

    const bodyScale = typeof appearance.bodyScale === 'number' ? appearance.bodyScale : 1;
    const safeScale = Math.max(0.75, Math.min(bodyScale, 1.35));
    avatar.style.setProperty('--scale', safeScale.toFixed(2));

    avatar.style.setProperty('--skin', appearance.skinTone || '#f5d0b5');
    avatar.style.setProperty('--hair', appearance.hairColor || '#3b2a1d');
    avatar.style.setProperty('--shirt', appearance.shirtColor || (agent.isStudent ? '#8ecae6' : '#6c8ed4'));
    avatar.style.setProperty('--accent', appearance.accentColor || (agent.isStudent ? '#ffe066' : '#4e6bb1'));

    const hairKey = (appearance.hairStyle || 'short').toLowerCase().replace(/\s+/g, '');
    const hair = document.createElement('div');
    hair.className = 'agent-hair';
    hair.classList.add(hairKey ? `hair-${hairKey}` : 'hair-short');
    avatar.appendChild(hair);

    const head = document.createElement('div');
    head.className = 'agent-head';
    const eyeShape = (appearance.eyeShape || 'round').toLowerCase();
    head.classList.add(`eyes-${eyeShape}`);
    avatar.appendChild(head);

    ['left', 'right'].forEach(side => head.appendChild(this.buildEye(side)));

    const mouth = document.createElement('div');
    mouth.className = 'agent-mouth';
    if (appearance.mouth === 'smile') {
      mouth.classList.add('smile');
    } else if (appearance.mouth === 'open') {
      mouth.classList.add('open');
    }
    head.appendChild(mouth);

    const faceAccessory = this.buildFaceAccessory(appearance.faceAccessory);
    if (faceAccessory) {
      head.appendChild(faceAccessory);
    }

    const body = document.createElement('div');
    body.className = 'agent-body';
    avatar.appendChild(body);

    if (appearance.hasAccent) {
      const accent = document.createElement('div');
      accent.className = 'agent-accent';
      body.appendChild(accent);
    }

    const label = document.createElement('div');
    label.className = 'agent-label';
    label.textContent = `${agent.isStudent ? 'S' : 'R'}${agent.id}`;
    avatar.appendChild(label);

    return avatar;
  }

  buildEye(side) {
    const eye = document.createElement('div');
    eye.className = `agent-eye ${side}`;
    const pupil = document.createElement('div');
    pupil.className = 'agent-pupil';
    eye.appendChild(pupil);
    return eye;
  }

  buildFaceAccessory(type) {
    if (!type || type === 'none') {
      return null;
    }

    const accessory = document.createElement('div');
    accessory.className = `agent-face-accessory ${type}`;

    if (type === 'glasses') {
      const leftLens = document.createElement('span');
      leftLens.className = 'lens left';
      const rightLens = document.createElement('span');
      rightLens.className = 'lens right';
      const bridge = document.createElement('span');
      bridge.className = 'bridge';
      accessory.append(leftLens, rightLens, bridge);
    }

    return accessory;
  }

  /**
   * Render a walkable cell
   */
  renderWalkableCell(cell) {
    cell.style.backgroundColor = 'rgba(222, 184, 135, 0.4)';
  }


  /**
   * Get the container element
   */
  getContainer() {
    return this.container;
  }

  /**
   * Clean up the renderer
   */
  destroy() {
    // Remove resize event listener
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    // Clean up chat bubbles
    chatBubble.destroy();

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.isInitialized = false;
    this.container = null;
    this.gridElement = null;
  }
}

