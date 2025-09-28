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

    const title = document.createElement('h2');
    title.textContent = 'Game Arena';
    title.className = 'grid-title';
    this.container.appendChild(title);

    this.gridElement = document.createElement('div');
    this.gridElement.className = 'game-grid';
    this.gridElement.style.display = 'grid';
    this.gridElement.style.gridTemplateColumns = `repeat(${this.gameState.size}, 1fr)`;
    this.gridElement.style.gap = '2px';
    this.gridElement.style.background = 'rgba(15, 20, 45, 0.8)';
    this.gridElement.style.padding = '10px';
    this.gridElement.style.borderRadius = '8px';
    this.gridElement.style.border = '1px solid rgba(96, 112, 238, 0.3)';

    this.createGridCells();
    this.container.appendChild(this.gridElement);

    const controls = this.createControls();
    this.container.appendChild(controls);

    const legend = this.createLegend();
    this.container.appendChild(legend);

    this.isInitialized = true;
    return this.container;
  }

  /**
   * Create all grid cells
   */
  createGridCells() {
    for (let y = 0; y < this.gameState.size; y++) {
      for (let x = 0; x < this.gameState.size; x++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.style.width = '30px';
        cell.style.height = '30px';
        cell.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        cell.style.display = 'flex';
        cell.style.alignItems = 'center';
        cell.style.justifyContent = 'center';
        cell.style.fontSize = '14px';
        cell.style.fontWeight = 'bold';
        cell.style.position = 'relative';

        cell.setAttribute('data-x', x);
        cell.setAttribute('data-y', y);
        this.gridElement.appendChild(cell);
      }
    }
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
   * Render an obstacle cell
   */
  renderObstacleCell(cell, cellData) {
    cell.style.backgroundColor = 'rgba(255, 100, 100, 0.8)';
    cell.textContent = '█';
    cell.style.color = '#fff';
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

    const baseBackground = isStudent ? 'rgba(255, 255, 255, 0.08)' : 'rgba(169, 196, 255, 0.12)';
    const convoBackground = isStudent ? 'rgba(255, 236, 170, 0.55)' : 'rgba(220, 205, 255, 0.5)';
    const baseBorder = isStudent ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid rgba(170, 195, 255, 0.25)';

    cell.style.backgroundColor = inConversation ? convoBackground : baseBackground;
    cell.style.border = inConversation ? '2px solid rgba(255, 255, 255, 0.85)' : baseBorder;
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
    cell.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
  }

  /**
   * Create control buttons
   */
  createControls() {
    const controls = document.createElement('div');
    controls.className = 'grid-controls';
    controls.style.marginTop = '15px';
    controls.style.display = 'flex';
    controls.style.gap = '10px';
    controls.style.justifyContent = 'center';

    const startButton = document.createElement('button');
    startButton.textContent = 'Start Simulation';
    startButton.style.margin = '0';
    startButton.style.padding = '0.5rem 1rem';
    startButton.style.fontSize = '0.9rem';
    startButton.id = 'start-simulation';

    const stopButton = document.createElement('button');
    stopButton.textContent = 'Stop Simulation';
    stopButton.style.margin = '0';
    stopButton.style.padding = '0.5rem 1rem';
    stopButton.style.fontSize = '0.9rem';
    stopButton.disabled = true;
    stopButton.id = 'stop-simulation';

    controls.appendChild(startButton);
    controls.appendChild(stopButton);

    return controls;
  }

  /**
   * Create legend for the grid
   */
  createLegend() {
    const legend = document.createElement('div');
    legend.className = 'grid-legend';
    legend.style.marginTop = '15px';
    legend.style.display = 'flex';
    legend.style.gap = '20px';
    legend.style.fontSize = '14px';
    legend.style.color = '#b5bbfa';

    const items = [
      { color: 'rgba(255, 100, 100, 0.8)', text: 'Obstacles' },
      { color: 'rgba(100, 255, 100, 0.8)', text: 'Students' },
      { color: 'rgba(100, 150, 255, 0.8)', text: 'Recruiters' },
      { color: 'rgba(255, 255, 100, 0.9)', text: '💬 In Conversation', border: '3px solid rgba(255, 255, 255, 0.8)' },
      { color: 'rgba(255, 255, 255, 0.05)', text: 'Empty' }
    ];

    items.forEach(item => {
      const legendItem = document.createElement('div');
      legendItem.style.display = 'flex';
      legendItem.style.alignItems = 'center';
      legendItem.style.gap = '8px';

      const colorBox = document.createElement('div');
      colorBox.style.width = '16px';
      colorBox.style.height = '16px';
      colorBox.style.backgroundColor = item.color;
      colorBox.style.border = item.border || '1px solid rgba(255, 255, 255, 0.2)';
      colorBox.style.borderRadius = '2px';
      if (item.border) {
        colorBox.style.boxShadow = '0 0 5px rgba(255, 255, 100, 0.3)';
      }

      const text = document.createElement('span');
      text.textContent = item.text;

      legendItem.appendChild(colorBox);
      legendItem.appendChild(text);
      legend.appendChild(legendItem);
    });

    return legend;
  }

  /**
   * Get the container element
   */
  getContainer() {
    return this.container;
  }

  /**
   * Get control buttons for external event handling
   */
  getControlButtons() {
    if (!this.container) return { start: null, stop: null };
    
    return {
      start: this.container.querySelector('#start-simulation'),
      stop: this.container.querySelector('#stop-simulation')
    };
  }

  /**
   * Clean up the renderer
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.isInitialized = false;
    this.container = null;
    this.gridElement = null;
  }
}

