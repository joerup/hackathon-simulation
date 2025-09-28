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
      }, 1000); // 2 second delay between frames
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

  // Add recruiters
  const recruiter1 = gameGrid.addAgent(8, 1, null, false); // Recruiter (will get ID 1)
  const recruiter2 = gameGrid.addAgent(1, 6, null, false); // Recruiter (will get ID 2)
  const recruiter3 = gameGrid.addAgent(7, 8, null, false); // Recruiter (will get ID 3)

  // Log recruiter information for debugging
  console.log('Recruiter 1 looking for:', recruiter1.stats.lookingFor);
  console.log('Recruiter 2 looking for:', recruiter2.stats.lookingFor);
  console.log('Recruiter 3 looking for:', recruiter3.stats.lookingFor);

  // Add students
  gameGrid.addAgent(2, 2, null, true); // Student (will get ID 4)
  gameGrid.addAgent(5, 5, null, true); // Student (will get ID 5)
  gameGrid.addAgent(9, 3, null, true); // Student (will get ID 6)

  // Initialize the renderer (this creates the DOM elements)
  gameGrid.render();

  // Auto-start the simulation
  gameGrid.startSimulation();

  return gameGrid;
}