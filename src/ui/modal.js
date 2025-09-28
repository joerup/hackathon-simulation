import { requestResumeStats } from "../services/snapdragonClient.js";
import { processResumeFile } from "../utils/fileProcessor.js";

/**
 * Modal component - Reusable modal dialog with resume upload functionality
 */
export class Modal {
  constructor(gameGrid = null) {
    this.isOpen = false;
    this.overlay = null;
    this.modal = null;
    this.onClose = null;
    this.gameGrid = gameGrid;
    this.wasSimulationRunning = false;
    this.file = null;
    this.isProcessing = false;
  }

  /**
   * Create the modal DOM elements
   */
  create() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    `;

    // Create modal container
    this.modal = document.createElement('div');
    this.modal.className = 'modal';
    this.modal.style.cssText = `
      background: rgba(8, 10, 24, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 2rem;
      min-width: 400px;
      max-width: 500px;
      width: 90%;
      color: #e4e8ff;
      position: relative;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(20px);
    `;

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: none;
      border: none;
      color: #b5bbfa;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      margin: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s ease;
    `;

    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    });

    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.backgroundColor = 'transparent';
    });

    closeButton.addEventListener('click', () => this.close());

    // Create content container
    this.content = document.createElement('div');
    this.content.className = 'modal-content';
    this.content.style.cssText = `
      margin-right: 2rem;
    `;

    // Create the resume upload content
    this.createResumeUploadContent();

    // Assemble modal
    this.modal.appendChild(closeButton);
    this.modal.appendChild(this.content);
    this.overlay.appendChild(this.modal);

    // Add click outside to close
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // Add escape key to close
    this.escapeHandler = (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    };

    document.addEventListener('keydown', this.escapeHandler);

    // Append to body
    document.body.appendChild(this.overlay);

    return this.overlay;
  }

  /**
   * Create the resume upload content
   */
  createResumeUploadContent() {
    // Title
    const title = document.createElement('h2');
    title.textContent = 'Add Student';
    title.style.cssText = `
      margin: 0 0 1.5rem 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #ffffff;
      text-align: center;
    `;


    // File drop area
    const dropArea = document.createElement('div');
    dropArea.style.cssText = `
      border: 2px dashed rgba(112, 136, 255, 0.3);
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      background: rgba(15, 20, 45, 0.3);
      transition: all 0.2s ease;
      cursor: pointer;
      margin-bottom: 1rem;
    `;

    // File input (hidden)
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.txt,.md,.rtf';
    fileInput.style.display = 'none';

    // Drop area content
    const dropIcon = document.createElement('div');
    dropIcon.innerHTML = '📄';
    dropIcon.style.cssText = `
      font-size: 2rem;
      margin-bottom: 0.5rem;
    `;

    const dropText = document.createElement('div');
    dropText.textContent = 'Click to select or drag & drop your resume';
    dropText.style.cssText = `
      color: #d3d6ff;
      font-weight: 500;
      margin-bottom: 0.25rem;
    `;

    const dropHint = document.createElement('div');
    dropHint.textContent = 'PDF, DOCX, TXT supported';
    dropHint.style.cssText = `
      color: #8fa0ff;
      font-size: 0.8rem;
    `;

    dropArea.appendChild(dropIcon);
    dropArea.appendChild(dropText);
    dropArea.appendChild(dropHint);

    // File info
    const fileInfo = document.createElement('div');
    fileInfo.style.cssText = `
      padding: 0.75rem;
      background: rgba(12, 16, 40, 0.5);
      border-radius: 8px;
      margin-bottom: 1.5rem;
      display: none;
    `;

    const fileName = document.createElement('div');
    fileName.style.cssText = `
      color: #ffffff;
      font-weight: 500;
      margin-bottom: 0.25rem;
    `;

    const fileSize = document.createElement('div');
    fileSize.style.cssText = `
      color: #b5bbfa;
      font-size: 0.8rem;
    `;

    fileInfo.appendChild(fileName);
    fileInfo.appendChild(fileSize);

    const analyzeButton = document.createElement('button');
    analyzeButton.textContent = 'Upload';
    analyzeButton.disabled = true;
    analyzeButton.style.cssText = `
      width: 100%;
      background: linear-gradient(140deg, #7088ff, #9d66ff);
      color: #11152c;
      border: none;
      border-radius: 8px;
      padding: 0.75rem 1.5rem;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s ease;
      margin: 0 auto 1rem auto;
      opacity: 0.5;
      display: block;
    `;

    // Status message
    const statusMessage = document.createElement('div');
    statusMessage.style.cssText = `
      text-align: center;
      font-size: 0.85rem;
      min-height: 1.2rem;
      color: #8fa0ff;
    `;

    // Event handlers
    dropArea.addEventListener('click', () => fileInput.click());

    dropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropArea.style.borderColor = 'rgba(112, 136, 255, 0.6)';
      dropArea.style.background = 'rgba(15, 20, 45, 0.5)';
    });

    dropArea.addEventListener('dragleave', () => {
      dropArea.style.borderColor = 'rgba(112, 136, 255, 0.3)';
      dropArea.style.background = 'rgba(15, 20, 45, 0.3)';
    });

    dropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      dropArea.style.borderColor = 'rgba(112, 136, 255, 0.3)';
      dropArea.style.background = 'rgba(15, 20, 45, 0.3)';

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFileSelect(files[0], fileName, fileSize, fileInfo, analyzeButton, statusMessage);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFileSelect(e.target.files[0], fileName, fileSize, fileInfo, analyzeButton, statusMessage);
      }
    });

    analyzeButton.addEventListener('click', () => {
      this.handleAnalyze(analyzeButton, statusMessage);
    });

    // Assemble content
    this.content.appendChild(title);
    this.content.appendChild(dropArea);
    this.content.appendChild(fileInput);
    this.content.appendChild(fileInfo);
    this.content.appendChild(analyzeButton);
    this.content.appendChild(statusMessage);
  }

  /**
   * Handle file selection
   */
  handleFileSelect(file, fileName, fileSize, fileInfo, analyzeButton, statusMessage) {
    this.file = file;

    fileName.textContent = file.name;
    fileSize.textContent = `${(file.size / 1024).toFixed(1)} KB`;

    fileInfo.style.display = 'block';
    analyzeButton.disabled = false;
    analyzeButton.style.opacity = '1';
    analyzeButton.style.cursor = 'pointer';

    statusMessage.textContent = '';
    statusMessage.style.color = '#8fa0ff';
  }

  /**
   * Handle resume analysis
   */
  async handleAnalyze(analyzeButton, statusMessage) {
    if (!this.file || this.isProcessing) return;

    this.isProcessing = true;
    analyzeButton.disabled = true;
    analyzeButton.style.opacity = '0.5';
    analyzeButton.textContent = 'Submitting...';

    try {
      const payload = await processResumeFile(this.file);

      const stats = await requestResumeStats(payload);

      if (stats.summary.startsWith("❌") || stats.summary.startsWith("⚠️")) {
        statusMessage.textContent = 'Analysis completed with issues';
        statusMessage.style.color = '#ff8e8e';
      } else {
        if (this.gameGrid) {
          const studentCreated = this.createStudentFromResume(stats);
          if (studentCreated) {
            // Close modal immediately after success
            this.close();
            return;
          } else {
            statusMessage.textContent = 'No available positions in arena';
            statusMessage.style.color = '#ff8e8e';
          }
        } else {
          statusMessage.textContent = 'Game not available';
          statusMessage.style.color = '#ff8e8e';
        }
      }
    } catch (error) {
      console.error("Resume analysis failed", error);
      statusMessage.textContent = 'Analysis failed. Check console for details.';
      statusMessage.style.color = '#ff8e8e';
    } finally {
      this.isProcessing = false;
      analyzeButton.disabled = false;
      analyzeButton.style.opacity = '1';
      analyzeButton.textContent = 'Upload';
    }
  }

  /**
   * Create student from resume stats
   */
  createStudentFromResume(stats) {
    try {
      const gameState = this.gameGrid.getGameState();
      const size = gameState.grid.length;
      let emptyPosition = null;

      // Find empty position
      for (let attempts = 0; attempts < 100; attempts++) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);
        const cell = gameState.grid[y][x];

        if (cell.type === 'walkable' && (!cell.agent || cell.agent === null)) {
          emptyPosition = { x, y };
          break;
        }
      }

      if (!emptyPosition) return false;

      // Create student stats
      let skills = ['JavaScript'];
      if (stats.skills && Array.isArray(stats.skills)) {
        skills = stats.skills
          .filter(skill => skill && (skill.label || skill.name))
          .map(skill => skill.label || skill.name)
          .slice(0, 4);
      }

      if (skills.length === 0) skills = ['JavaScript'];

      const studentStats = {
        gpa: stats.gpa || 3.0,
        skills: skills,
        experience: stats.experience || 0,
        major: stats.major || 'Computer Science',
        networking: stats.networking || 0,
        energyScore: stats.energyScore || 50,
        luck: stats.luck || 50,
        internships: stats.internships || 0,
        buzzwords: stats.buzzwords || [],
        summary: stats.summary || '',
        fillerRatio: stats.fillerRatio || 0
      };

      const agent = this.gameGrid.addAgent(emptyPosition.x, emptyPosition.y, null, true);

      if (agent) {
        agent.stats = studentStats;
        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to create student from resume:", error);
      return false;
    }
  }

  /**
   * Set the content of the modal (for custom content)
   */
  setContent(content) {
    if (!this.content) return;

    if (typeof content === 'string') {
      this.content.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      this.content.innerHTML = '';
      this.content.appendChild(content);
    }
  }

  /**
   * Open the modal
   */
  open() {
    if (!this.overlay) {
      this.create();
    }

    // Pause simulation if game grid is available
    if (this.gameGrid) {
      this.wasSimulationRunning = this.gameGrid.isRunning;
      if (this.wasSimulationRunning) {
        this.gameGrid.stopSimulation();
      }
    }

    this.isOpen = true;
    this.overlay.style.display = 'flex';

    // Add animation
    this.overlay.style.opacity = '0';
    this.modal.style.transform = 'scale(0.9)';

    requestAnimationFrame(() => {
      this.overlay.style.transition = 'opacity 0.2s ease';
      this.modal.style.transition = 'transform 0.2s ease';
      this.overlay.style.opacity = '1';
      this.modal.style.transform = 'scale(1)';
    });

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close the modal
   */
  close() {
    if (!this.isOpen) return;

    this.isOpen = false;

    // Add closing animation
    this.overlay.style.opacity = '0';
    this.modal.style.transform = 'scale(0.9)';

    setTimeout(() => {
      this.overlay.style.display = 'none';
      document.body.style.overflow = '';

      // Resume simulation if it was running before
      if (this.gameGrid && this.wasSimulationRunning) {
        this.gameGrid.startSimulation();
      }
    }, 200);

    // Call onClose callback if provided
    if (this.onClose) {
      this.onClose();
    }
  }

  /**
   * Destroy the modal and clean up
   */
  destroy() {
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
    }

    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }

    this.overlay = null;
    this.modal = null;
    this.content = null;
    this.isOpen = false;
    document.body.style.overflow = '';
  }
}

/**
 * Create and show a modal with resume upload functionality
 */
export function showModal(gameGrid = null) {
  const modal = new Modal(gameGrid);
  modal.open();
  return modal;
}