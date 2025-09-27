import { GameState } from '../gameState.js';
import { GridRenderer } from '../gridRenderer.js';

/**
 * GameGrid class - Coordinates between game state and rendering
 * This class handles the main game loop and user interactions
 */
export class GameGrid {
  constructor(size = 10) {
    this.gameState = new GameState(size);
    this.renderer = new GridRenderer(this.gameState);
    this.animationId = null;
    this.isRunning = false;
    
    // Initialize the game with sample data
    this.initializeGame();
  }

  /**
   * Initialize the game with sample obstacles and agents
   */
  initializeGame() {
    // Generate sample obstacles
    this.gameState.generateSampleObstacles();
  }

  /**
   * Add an agent to the game
   */
  addAgent(x, y, id = null, isStudent = true) {
    return this.gameState.addAgent(x, y, id, isStudent);
  }

  /**
   * Start the simulation
   */
  startSimulation() {
    if (this.isRunning) return;

    this.isRunning = true;

    const animate = () => {
      if (!this.isRunning) return;

      // Process one game frame
      this.gameState.processFrame();
      
      // Update the visual display
      this.renderer.updateDisplay();

      // Continue animation after delay
      setTimeout(() => {
        this.animationId = requestAnimationFrame(animate);
      }, 2000); // 2 second delay between frames
    };

    this.animationId = requestAnimationFrame(animate);
  }

  /**
   * Stop the simulation
   */
  stopSimulation() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Render the game grid
   */
  render() {
    return this.renderer.initialize();
  }

  /**
   * Get the current game state
   */
  getGameState() {
    return this.gameState.getStateSnapshot();
  }

  /**
   * Get the renderer for external access to controls
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * Clean up the game grid
   */
  destroy() {
    this.stopSimulation();
    this.renderer.destroy();
  }
}

export function initGameGrid(size = 10) {
  const gameGrid = new GameGrid(size);

  // Add recruiters (no students initially)
  gameGrid.addAgent(8, 1, 5, false); // Recruiter
  gameGrid.addAgent(1, 6, 6, false); // Recruiter
  gameGrid.addAgent(7, 8, 7, false); // Recruiter

  // Initialize the renderer (this creates the DOM elements)
  gameGrid.render();
  
  // Set up control button event handlers
  const renderer = gameGrid.getRenderer();
  const controls = renderer.getControlButtons();
  
  if (controls.start && controls.stop) {
    controls.start.onclick = () => {
      gameGrid.startSimulation();
      controls.start.disabled = true;
      controls.stop.disabled = false;
    };

    controls.stop.onclick = () => {
      gameGrid.stopSimulation();
      controls.start.disabled = false;
      controls.stop.disabled = true;
    };
  }

  return gameGrid;
}