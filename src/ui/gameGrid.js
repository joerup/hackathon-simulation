import { GameState } from '../gameState.js';
import { GridRenderer } from '../gridRenderer.js';
import { getCurrentSpeed } from '../config.js';
import { SpeedControl } from './speedControl.js';

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
    this.leaderboardSidebar = null; // Reference to leaderboard sidebar
    this.speedControl = null;
    
    // Initialize the renderer
    this.renderer.initialize();
    
    // Initialize the game with sample data
    this.initializeGame();
  }

  /**
   * Set the leaderboard sidebar reference
   */
  setLeaderboardSidebar(leaderboardSidebar) {
    this.leaderboardSidebar = leaderboardSidebar;
    // Setup periodic leaderboard updates
    this.setupLeaderboardUpdates(leaderboardSidebar);
  }

  /**
   * Setup periodic leaderboard updates
   */
  setupLeaderboardUpdates(leaderboardSidebar) {
    // Update leaderboard every 1 second when simulation is running for more responsive distance tracking
    setInterval(() => {
      if (this.isRunning && leaderboardSidebar && !leaderboardSidebar.isCollapsedState()) {
        leaderboardSidebar.refresh();
      }
    }, 1000);
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
  addAgent(x, y, id = null, isStudent = true, options = {}) {
    return this.gameState.addAgent(x, y, id, isStudent, options);
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
    
    // Create speed control but don't append it yet
    this.speedControl = new SpeedControl(this);
    const speedControlElement = this.speedControl.create();
    
    // Append speed control after the grid element
    container.appendChild(speedControlElement);
    
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
   * Handle sidebar state changes (called when sidebars are toggled)
   */
  handleSidebarToggle() {
    // Trigger grid resize to recalculate available space
    if (this.renderer) {
      // Small delay to allow CSS transitions to complete
      setTimeout(() => {
        this.renderer.resizeGrid();
      }, 300);
    }
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