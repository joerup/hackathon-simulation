import { gameSpeedConfig, getCurrentSpeedIndex, setCurrentSpeedIndex, getCurrentSpeed } from '../config.js';

/**
 * SpeedControl class - Creates a horizontal slider UI component for adjusting game speed
 */
export class SpeedControl {
  constructor(gameGrid) {
    this.gameGrid = gameGrid;
    this.container = null;
    this.sliderTrack = null;
    this.sliderHandle = null;
    this.speedLabel = null;
    this.currentSpeedIndex = getCurrentSpeedIndex();
    this.isDragging = false;
    this.dragStartX = 0;
    this.trackWidth = 300;
  }

  /**
   * Create the speed control UI
   */
  create() {
    // Main container for the speed control
    this.container = document.createElement('div');
    this.container.className = 'speed-control';
    this.container.style.cssText = `
      margin: 20px auto 0 auto;
      background: rgba(8, 10, 24, 0.9);
      border: 1px solid rgba(96, 112, 238, 0.3);
      border-radius: 12px;
      padding: 16px 20px;
      backdrop-filter: blur(20px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      user-select: none;
      max-width: 400px;
      width: fit-content;
    `;

    // Speed label
    this.speedLabel = document.createElement('span');
    this.speedLabel.style.cssText = `
      color: #ffffff;
      font-weight: 600;
      font-size: 1rem;
      text-align: center;
      letter-spacing: 0.02em;
    `;
    this.updateSpeedLabel();

    // Slider container
    const sliderContainer = document.createElement('div');
    sliderContainer.style.cssText = `
      position: relative;
      width: ${this.trackWidth}px;
      height: 50px;
      display: flex;
      align-items: center;
    `;

    // Slider track
    this.sliderTrack = document.createElement('div');
    this.sliderTrack.style.cssText = `
      position: relative;
      width: 100%;
      height: 8px;
      background: rgba(12, 16, 40, 0.8);
      border: 1px solid rgba(96, 112, 238, 0.3);
      border-radius: 4px;
      cursor: pointer;
    `;

    // Progress fill
    this.progressFill = document.createElement('div');
    this.progressFill.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: linear-gradient(90deg, #7088ff, #9d66ff);
      border-radius: 4px;
      transition: width 0.2s ease;
    `;

    // Slider handle
    this.sliderHandle = document.createElement('div');
    this.sliderHandle.style.cssText = `
      position: absolute;
      top: 50%;
      width: 20px;
      height: 20px;
      background: #ffffff;
      border: 3px solid #7088ff;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      cursor: grab;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: all 0.2s ease;
      z-index: 2;
    `;

    // Speed markers
    const markersContainer = document.createElement('div');
    markersContainer.style.cssText = `
      position: absolute;
      top: 20px;
      width: 100%;
      height: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    `;

    // Add markers for key speeds
    const keySpeedIndices = [0, 3, 6, 9, 14, 17, 20, 23]; // 0.25x, 1x, 2x, 4x, 10x, 20x, 30x, 50x
    keySpeedIndices.forEach(speedIndex => {
      const marker = document.createElement('div');
      marker.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        cursor: pointer;
      `;
      
      const tick = document.createElement('div');
      tick.style.cssText = `
        width: 2px;
        height: 8px;
        background: rgba(255, 255, 255, 0.4);
        border-radius: 1px;
      `;
      
      const label = document.createElement('span');
      label.textContent = gameSpeedConfig.speeds[speedIndex].label;
      label.style.cssText = `
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.6);
        white-space: nowrap;
      `;

      marker.appendChild(tick);
      marker.appendChild(label);
      markersContainer.appendChild(marker);

      // Add click handler to jump to this speed
      marker.addEventListener('click', () => {
        this.setSpeed(speedIndex);
      });
    });

    // Assemble slider
    this.sliderTrack.appendChild(this.progressFill);
    this.sliderTrack.appendChild(this.sliderHandle);
    sliderContainer.appendChild(this.sliderTrack);
    sliderContainer.appendChild(markersContainer);

    // Instructions text
    const instructions = document.createElement('span');
    instructions.textContent = 'Drag or click to adjust speed';
    instructions.style.cssText = `
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.75rem;
      font-style: italic;
    `;

    // Add event listeners
    this.addEventListeners();

    // Initial position
    this.updateSliderPosition();

    // Assemble the component
    this.container.appendChild(this.speedLabel);
    this.container.appendChild(sliderContainer);
    this.container.appendChild(instructions);

    return this.container;
  }

  /**
   * Add event listeners for slider interaction
   */
  addEventListeners() {
    // Track click events
    this.sliderTrack.addEventListener('click', (event) => {
      if (event.target === this.sliderHandle) return;
      
      const rect = this.sliderTrack.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newIndex = Math.round(percentage * (gameSpeedConfig.speeds.length - 1));
      
      this.setSpeed(newIndex);
    });

    // Handle drag events
    this.sliderHandle.addEventListener('mousedown', this.handleDragStart.bind(this));
    document.addEventListener('mousemove', this.handleDragMove.bind(this));
    document.addEventListener('mouseup', this.handleDragEnd.bind(this));

    // Touch events for mobile
    this.sliderHandle.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchmove', this.handleTouchMove.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));

    // Mouse wheel events for fine control
    this.sliderTrack.addEventListener('wheel', (event) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? 1 : -1;
      this.changeSpeed(delta);
    });

    // Hover effects
    this.sliderHandle.addEventListener('mouseenter', () => {
      if (!this.isDragging) {
        this.sliderHandle.style.transform = 'translate(-50%, -50%) scale(1.1)';
        this.sliderHandle.style.boxShadow = '0 4px 12px rgba(112, 136, 255, 0.4)';
      }
    });

    this.sliderHandle.addEventListener('mouseleave', () => {
      if (!this.isDragging) {
        this.sliderHandle.style.transform = 'translate(-50%, -50%) scale(1)';
        this.sliderHandle.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
      }
    });
  }

  /**
   * Handle drag start
   */
  handleDragStart(event) {
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.sliderHandle.style.cursor = 'grabbing';
    this.sliderHandle.style.transform = 'translate(-50%, -50%) scale(1.1)';
    event.preventDefault();
  }

  /**
   * Handle drag move
   */
  handleDragMove(event) {
    if (!this.isDragging) return;

    const rect = this.sliderTrack.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, currentX / rect.width));
    const newIndex = Math.round(percentage * (gameSpeedConfig.speeds.length - 1));
    
    this.setSpeed(newIndex);
  }

  /**
   * Handle drag end
   */
  handleDragEnd() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.sliderHandle.style.cursor = 'grab';
    this.sliderHandle.style.transform = 'translate(-50%, -50%) scale(1)';
  }

  /**
   * Handle touch events
   */
  handleTouchStart(event) {
    this.isDragging = true;
    this.dragStartX = event.touches[0].clientX;
    event.preventDefault();
  }

  handleTouchMove(event) {
    if (!this.isDragging) return;

    const rect = this.sliderTrack.getBoundingClientRect();
    const currentX = event.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, currentX / rect.width));
    const newIndex = Math.round(percentage * (gameSpeedConfig.speeds.length - 1));
    
    this.setSpeed(newIndex);
    event.preventDefault();
  }

  handleTouchEnd() {
    this.isDragging = false;
  }

  /**
   * Set speed to specific index
   */
  setSpeed(index) {
    const newIndex = Math.max(0, Math.min(gameSpeedConfig.speeds.length - 1, index));
    
    if (newIndex !== this.currentSpeedIndex) {
      this.currentSpeedIndex = newIndex;
      setCurrentSpeedIndex(newIndex);
      
      // Update UI
      this.updateSpeedLabel();
      this.updateSliderPosition();
      
      // Update game speed
      if (this.gameGrid) {
        this.gameGrid.updateGameSpeed();
      }
    }
  }

  /**
   * Change the game speed by delta amount
   */
  changeSpeed(delta) {
    this.setSpeed(this.currentSpeedIndex + delta);
  }

  /**
   * Update the speed label text
   */
  updateSpeedLabel() {
    if (this.speedLabel) {
      const currentSpeed = gameSpeedConfig.speeds[this.currentSpeedIndex];
      this.speedLabel.textContent = `Speed: ${currentSpeed.label}`;
    }
  }

  /**
   * Update the slider handle position and progress fill
   */
  updateSliderPosition() {
    if (!this.sliderHandle || !this.progressFill) return;

    const percentage = this.currentSpeedIndex / (gameSpeedConfig.speeds.length - 1);
    const position = percentage * 100;
    
    this.sliderHandle.style.left = `${position}%`;
    this.progressFill.style.width = `${position}%`;
  }

  /**
   * Get the current speed index
   */
  getCurrentSpeedIndex() {
    return this.currentSpeedIndex;
  }

  /**
   * Clean up the component
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

/**
 * Create and initialize the speed control
 */
export function createSpeedControl(gameGrid, container = null) {
  const speedControl = new SpeedControl(gameGrid);
  const element = speedControl.create();
  
  if (container) {
    // Append directly to the provided container
    container.appendChild(element);
  } else {
    // Find the game grid container and append the speed control to it
    const gameContainer = document.querySelector('.game-grid-container');
    if (gameContainer) {
      gameContainer.appendChild(element);
    } else {
      // Fallback to body if container not found
      document.body.appendChild(element);
    }
  }
  
  return speedControl;
}
