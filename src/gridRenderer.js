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
        this.renderAgentCell(cell, cellData, x, y);
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
  renderAgentCell(cell, cellData, x, y) {
    const agent = cellData.agent;
    if (!agent) return;

    if (agent.inConversation) {
      // Visual indicator for agents in conversation
      cell.style.backgroundColor = agent.isStudent ? 'rgba(255, 255, 100, 0.9)' : 'rgba(255, 150, 255, 0.9)';
      cell.style.border = '3px solid rgba(255, 255, 255, 0.8)';
      cell.style.boxShadow = '0 0 10px rgba(255, 255, 100, 0.5)';
      cell.textContent = agent.isStudent ? `💬S${agent.id}` : `💬R${agent.id}`;
    } else {
      cell.style.backgroundColor = agent.isStudent ? 'rgba(100, 255, 100, 0.8)' : 'rgba(100, 150, 255, 0.8)';
      cell.style.border = '1px solid rgba(255, 255, 255, 0.1)';
      cell.textContent = agent.isStudent ? `S${agent.id}` : `R${agent.id}`;
    }
    cell.style.color = '#000';
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
