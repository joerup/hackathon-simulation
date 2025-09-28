import { GameState } from '../gameState.js';
import { GridRenderer } from '../gridRenderer.js';
import { getCurrentSpeed } from '../config.js';
import { createSpeedControl } from './speedControl.js';

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
    this.speedControl = null;
    
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

      // Continue animation after delay using current speed
      const currentSpeed = getCurrentSpeed();
      setTimeout(() => {
        this.animationId = requestAnimationFrame(animate);
      }, currentSpeed.delay);
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
    const container = this.renderer.initialize();
    
    // Create and add speed control wheel directly to the container
    this.speedControl = createSpeedControl(this, container);
    
    return container;
  }

  /**
   * Update the game speed (called by speed control)
   */
  updateGameSpeed() {
    // The speed will be automatically used in the next setTimeout call
    // No need to restart the simulation, it will pick up the new speed
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
    
    // Clean up speed control
    if (this.speedControl) {
      this.speedControl.destroy();
      this.speedControl = null;
    }
  }
}

export function initGameGrid(size = 10) {
  const gameGrid = new GameGrid(size);

  // Add recruiters (no students initially)
  gameGrid.addAgent(8, 1, null, false); // Recruiter (will get ID 1)
  gameGrid.addAgent(1, 6, null, false); // Recruiter (will get ID 2)
  gameGrid.addAgent(7, 8, null, false); // Recruiter (will get ID 3)

  // Initialize the renderer (this creates the DOM elements)
  gameGrid.render();

  // Auto-start the simulation
  gameGrid.startSimulation();

  return gameGrid;
}