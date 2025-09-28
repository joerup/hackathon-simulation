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
    this.usingSample = false;
    this.selectedSampleFile = null;
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
      background: rgba(139, 113, 85, 0.7);
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
      background: rgba(253, 250, 245, 0.95);
      border: 1px solid rgba(139, 113, 85, 0.2);
      border-radius: 16px;
      padding: 2rem;
      min-width: 400px;
      max-width: 500px;
      width: 90%;
      color: #5a4a3a;
      position: relative;
      border: 2px solid rgba(139, 113, 85, 0.3);
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
      color: #8b6f47;
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
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding-top: 1rem;
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
      color: #3d2f1f;
      text-align: center;
    `;

    // Mode selector
    const modeSelector = document.createElement('div');
    modeSelector.style.cssText = `
      display: flex;
      background: rgba(250, 247, 240, 0.8);
      border-radius: 10px;
      padding: 4px;
      margin-bottom: 1.5rem;
      width: 100%;
      max-width: 400px;
    `;

    const uploadOption = document.createElement('div');
    uploadOption.textContent = 'Upload Resume';
    uploadOption.style.cssText = `
      flex: 1;
      padding: 0.75rem;
      text-align: center;
      background: linear-gradient(140deg, #d4a574, #c1955f);
      color: #3d2f1f;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.85rem;
      transition: all 0.2s ease;
    `;

    const sampleOption = document.createElement('div');
    sampleOption.textContent = 'Sample Resume';
    sampleOption.style.cssText = `
      flex: 1;
      padding: 0.75rem;
      text-align: center;
      background: transparent;
      color: #8b6f47;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.85rem;
      transition: all 0.2s ease;
    `;

    modeSelector.appendChild(uploadOption);
    modeSelector.appendChild(sampleOption);

    // Upload section container
    const uploadSection = document.createElement('div');
    uploadSection.style.cssText = `
      width: 100%;
      max-width: 400px;
    `;

    // Sample selection section
    const sampleSection = document.createElement('div');
    sampleSection.style.cssText = `
      width: 100%;
      max-width: 400px;
      display: none;
    `;

    // File drop area
    const dropArea = document.createElement('div');
    dropArea.style.cssText = `
      border: 2px dashed rgba(139, 113, 85, 0.3);
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      background: rgba(250, 247, 240, 0.3);
      transition: all 0.2s ease;
      cursor: pointer;
      margin-bottom: 1rem;
      width: 100%;
      max-width: 400px;
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
      color: #5a4a3a;
      font-weight: 500;
      margin-bottom: 0.25rem;
    `;

    const dropHint = document.createElement('div');
    dropHint.textContent = 'PDF, DOCX, TXT supported';
    dropHint.style.cssText = `
      color: #8b6f47;
      font-size: 0.8rem;
    `;

    dropArea.appendChild(dropIcon);
    dropArea.appendChild(dropText);
    dropArea.appendChild(dropHint);

    // File info
    const fileInfo = document.createElement('div');
    fileInfo.style.cssText = `
      padding: 0.75rem;
      background: rgba(250, 247, 240, 0.7);
      border-radius: 8px;
      margin-bottom: 1.5rem;
      display: none;
      width: 100%;
      max-width: 400px;
    `;

    const fileName = document.createElement('div');
    fileName.style.cssText = `
      color: #3d2f1f;
      font-weight: 500;
      margin-bottom: 0.25rem;
    `;

    const fileSize = document.createElement('div');
    fileSize.style.cssText = `
      color: #8b6f47;
      font-size: 0.8rem;
    `;

    fileInfo.appendChild(fileName);
    fileInfo.appendChild(fileSize);

    const analyzeButton = document.createElement('button');
    analyzeButton.textContent = 'Upload';
    analyzeButton.disabled = true;
    analyzeButton.style.cssText = `
      width: 100%;
      max-width: 400px;
      background: linear-gradient(140deg, #d4a574, #c1955f);
      color: #3d2f1f;
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
      color: #8b6f47;
    `;

    // Event handlers
    dropArea.addEventListener('click', () => fileInput.click());

    dropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropArea.style.borderColor = 'rgba(139, 113, 85, 0.6)';
      dropArea.style.background = 'rgba(250, 247, 240, 0.5)';
    });

    dropArea.addEventListener('dragleave', () => {
      dropArea.style.borderColor = 'rgba(139, 113, 85, 0.3)';
      dropArea.style.background = 'rgba(250, 247, 240, 0.3)';
    });

    dropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      dropArea.style.borderColor = 'rgba(139, 113, 85, 0.3)';
      dropArea.style.background = 'rgba(250, 247, 240, 0.3)';

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

    // Move upload components to upload section
    uploadSection.appendChild(dropArea);
    uploadSection.appendChild(fileInput);
    uploadSection.appendChild(fileInfo);

    // Create sample resume selection
    const sampleGrid = document.createElement('div');
    sampleGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    `;

    // Create sample resume options
    const sampleResumes = [
      'sample_resumes-part-1.pdf',
      'sample_resumes-part-2.pdf',
      'sample_resumes-part-3.pdf',
      'sample_resumes-part-4.pdf',
      'sample_resumes-part-5.pdf',
      'sample_resumes-part-6.pdf',
      'sample_resumes-part-7.pdf',
      'sample_resumes-part-8.pdf',
      'sample_resumes-part-9.pdf',
      'sample_resumes-part-10.pdf'
    ];

    let selectedSampleIndex = null;

    sampleResumes.forEach((resume, index) => {
      const sampleCard = document.createElement('div');
      sampleCard.style.cssText = `
        padding: 1rem;
        background: rgba(250, 247, 240, 0.3);
        border: 1px solid rgba(139, 113, 85, 0.3);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
      `;

      const sampleTitle = document.createElement('div');
      sampleTitle.textContent = `Resume ${index + 1}`;
      sampleTitle.style.cssText = `
        color: #5a4a3a;
        font-weight: 500;
        font-size: 0.9rem;
      `;

      sampleCard.appendChild(sampleTitle);

      sampleCard.addEventListener('click', () => {
        // Remove selection from other cards
        sampleGrid.querySelectorAll('div').forEach(card => {
          card.style.background = 'rgba(250, 247, 240, 0.3)';
          card.style.borderColor = 'rgba(139, 113, 85, 0.3)';
        });

        // Select this card
        sampleCard.style.background = 'rgba(184, 158, 130, 0.2)';
        sampleCard.style.borderColor = 'rgba(139, 113, 85, 0.6)';

        selectedSampleIndex = index;
        this.selectedSampleFile = resume;

        // Enable upload button
        analyzeButton.disabled = false;
        analyzeButton.style.opacity = '1';
        analyzeButton.style.cursor = 'pointer';
      });

      sampleCard.addEventListener('mouseenter', () => {
        if (selectedSampleIndex !== index) {
          sampleCard.style.background = 'rgba(250, 247, 240, 0.5)';
        }
      });

      sampleCard.addEventListener('mouseleave', () => {
        if (selectedSampleIndex !== index) {
          sampleCard.style.background = 'rgba(250, 247, 240, 0.3)';
        }
      });

      sampleGrid.appendChild(sampleCard);
    });

    sampleSection.appendChild(sampleGrid);

    // Toggle functionality
    uploadOption.addEventListener('click', () => {
      uploadOption.style.background = 'linear-gradient(140deg, #d4a574, #c1955f)';
      uploadOption.style.color = '#3d2f1f';
      sampleOption.style.background = 'transparent';
      sampleOption.style.color = '#8b6f47';

      uploadSection.style.display = 'block';
      sampleSection.style.display = 'none';

      this.usingSample = false;
      this.selectedSampleFile = null;

      analyzeButton.disabled = !this.file;
      analyzeButton.style.opacity = this.file ? '1' : '0.5';
    });

    sampleOption.addEventListener('click', () => {
      sampleOption.style.background = 'linear-gradient(140deg, #d4a574, #c1955f)';
      sampleOption.style.color = '#3d2f1f';
      uploadOption.style.background = 'transparent';
      uploadOption.style.color = '#8b6f47';

      uploadSection.style.display = 'none';
      sampleSection.style.display = 'block';

      this.usingSample = true;

      analyzeButton.disabled = !this.selectedSampleFile;
      analyzeButton.style.opacity = this.selectedSampleFile ? '1' : '0.5';
    });

    // Assemble content
    this.content.appendChild(title);
    this.content.appendChild(modeSelector);
    this.content.appendChild(uploadSection);
    this.content.appendChild(sampleSection);
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
    if ((!this.file && !this.selectedSampleFile) || this.isProcessing) return;

    this.isProcessing = true;
    analyzeButton.disabled = true;
    analyzeButton.style.opacity = '0.5';
    analyzeButton.textContent = 'Uploading...';

    try {
      let payload;

      if (this.usingSample && this.selectedSampleFile) {
        // Handle sample resume - read from file system
        const fs = require('fs');
        const path = require('path');

        const filePath = path.join(process.cwd(), 'sample-resumes', this.selectedSampleFile);
        const fileBuffer = fs.readFileSync(filePath);
        const file = new File([fileBuffer], this.selectedSampleFile, { type: 'application/pdf' });
        payload = await processResumeFile(file);
      } else {
        // Handle uploaded file
        payload = await processResumeFile(this.file);
      }

      const stats = await requestResumeStats(payload);

      if (stats.summary.startsWith("❌") || stats.summary.startsWith("⚠️")) {
        statusMessage.textContent = 'Analysis completed with issues';
        statusMessage.style.color = '#d67d3e';
      } else {
        if (this.gameGrid) {
          const studentCreated = this.createStudentFromResume(stats);
          if (studentCreated) {
            // Refresh sidebar if available
            if (this.gameGrid.sidebar) {
              this.gameGrid.sidebar.refresh();
            }
            // Close modal immediately after success
            this.close();
            return;
          } else {
            statusMessage.textContent = 'No available positions in arena';
            statusMessage.style.color = '#d67d3e';
          }
        } else {
          statusMessage.textContent = 'Game not available';
          statusMessage.style.color = '#d67d3e';
        }
      }
    } catch (error) {
      console.error("Resume analysis failed", error);
      statusMessage.textContent = 'Analysis failed. Check console for details.';
      statusMessage.style.color = '#d67d3e';
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