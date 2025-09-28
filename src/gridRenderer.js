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
    this.gridElement.style.background = 'rgba(15, 20, 45, 0.8)';
    this.gridElement.style.padding = '10px';
    this.gridElement.style.borderRadius = '8px';
    this.gridElement.style.border = '1px solid rgba(96, 112, 238, 0.3)';

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
        cell.style.border = '1px solid rgba(255, 255, 255, 0.1)';
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

    // Account for padding and margins (reserve some space)
    const availableWidth = viewportWidth * 0.9;
    const availableHeight = viewportHeight * 0.9;

    // Calculate max cell size that fits in both dimensions
    const maxCellWidth = Math.floor(availableWidth / this.gameState.size);
    const maxCellHeight = Math.floor(availableHeight / this.gameState.size);

    // Use the smaller dimension to ensure grid fits on screen
    const cellSize = Math.min(maxCellWidth, maxCellHeight);

    // Set minimum and maximum bounds
    return Math.max(15, Math.min(cellSize, 60));
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

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.isInitialized = false;
    this.container = null;
    this.gridElement = null;
  }
}
