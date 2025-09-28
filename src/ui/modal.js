import { requestResumeStats } from "../services/snapdragonClient.js";
import { processResumeFile } from "../utils/fileProcessor.js";

/**
 * Styling constants and presets
 */
const STYLES = {
  primary: '#3d2f1f',
  secondary: '#8b6f47',
  accent: '#5a4a3a',
  warning: '#d67d3e',
  bgPrimary: 'rgba(253, 250, 245, 0.95)',
  bgSecondary: 'rgba(250, 247, 240, 0.8)',
  bgTertiary: 'rgba(250, 247, 240, 0.3)',
  bgSelected: 'rgba(184, 158, 130, 0.2)',
  bgHover: 'rgba(250, 247, 240, 0.5)',
  borderLight: 'rgba(139, 113, 85, 0.3)',
  borderMedium: 'rgba(139, 113, 85, 0.6)',
  borderOverlay: 'rgba(139, 113, 85, 0.7)',
  gradient: 'linear-gradient(140deg, #d4a574, #c1955f)'
};

const PRESETS = {
  overlay: `position:fixed;top:0;left:0;width:100%;height:100%;background:${STYLES.borderOverlay};display:none;justify-content:center;align-items:center;z-index:1000;backdrop-filter:blur(4px)`,
  modal: `background:${STYLES.bgPrimary};border:2px solid ${STYLES.borderLight};border-radius:16px;padding:2rem;min-width:400px;max-width:500px;width:90%;color:${STYLES.accent};position:relative;backdrop-filter:blur(20px)`,
  closeBtn: `position:absolute;top:1rem;right:1rem;background:none;border:none;color:${STYLES.secondary};font-size:24px;cursor:pointer;padding:0;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:background-color 0.2s ease`,
  content: `display:flex;flex-direction:column;align-items:center;text-align:center;padding-top:1rem`,
  title: `margin:0 0 1.5rem 0;font-size:1.5rem;font-weight:600;color:${STYLES.primary};text-align:center`,
  modeSelector: `display:flex;background:${STYLES.bgSecondary};border-radius:10px;padding:4px;margin-bottom:1.5rem;width:100%;max-width:400px`,
  section: `width:100%;max-width:400px`,
  dropArea: `border:2px dashed ${STYLES.borderLight};border-radius:12px;padding:2rem;text-align:center;background:${STYLES.bgTertiary};transition:all 0.2s ease;cursor:pointer;margin-bottom:1rem;width:100%;max-width:400px`,
  fileInfo: `padding:0.75rem;background:rgba(250, 247, 240, 0.7);border-radius:8px;margin-bottom:1.5rem;display:none;width:100%;max-width:400px`,
  grid: `display:grid;grid-template-columns:repeat(2, 1fr);gap:0.75rem;margin-bottom:1.5rem`,
  button: `width:100%;max-width:400px;background:${STYLES.gradient};color:${STYLES.primary};border:none;border-radius:8px;padding:0.75rem 1.5rem;font-weight:600;font-size:0.95rem;cursor:pointer;transition:all 0.2s ease;margin:0 auto 1rem auto;opacity:0.5;display:block`,
  status: `text-align:center;font-size:0.85rem;min-height:1.2rem;color:${STYLES.secondary}`
};

const SAMPLE_RESUMES = [
  'sample_resumes-part-1.pdf', 'sample_resumes-part-2.pdf', 'sample_resumes-part-3.pdf',
  'sample_resumes-part-4.pdf', 'sample_resumes-part-5.pdf', 'sample_resumes-part-6.pdf',
  'sample_resumes-part-7.pdf', 'sample_resumes-part-8.pdf', 'sample_resumes-part-9.pdf',
  'sample_resumes-part-10.pdf'
];

/**
 * Modal component - Reusable modal dialog with resume upload functionality
 */
export class Modal {
  constructor(gameGrid = null) {
    this.isOpen = false;
    this.overlay = null;
    this.modal = null;
    this.content = null;
    this.gameGrid = gameGrid;
    this.wasSimulationRunning = false;
    this.file = null;
    this.isProcessing = false;
    this.usingSample = true;
    this.selectedSampleFile = null;
    this.selectedSampleIndex = null;
    
    // UI References
    this.uploadSection = null;
    this.sampleSection = null;
    this.analyzeButton = null;
    this.statusMessage = null;
    this.uploadOption = null;
    this.sampleOption = null;
  }

  /**
   * Helper method to create styled elements
   */
  createElement(tag, preset = '', textContent = '') {
    const element = document.createElement(tag);
    if (textContent) element.textContent = textContent;
    if (preset) element.style.cssText = preset;
    return element;
  }

  /**
   * Apply toggle button styling
   */
  styleToggleButton(element, isActive = false) {
    element.style.cssText = `flex:1;padding:0.75rem;text-align:center;background:${isActive ? STYLES.gradient : 'transparent'};color:${isActive ? STYLES.primary : STYLES.secondary};border-radius:6px;cursor:pointer;font-weight:600;font-size:0.85rem;transition:all 0.2s ease`;
  }

  /**
   * Apply card styling with state
   */
  styleCard(element, isSelected = false, isHover = false) {
    const bg = isSelected ? STYLES.bgSelected : (isHover ? STYLES.bgHover : STYLES.bgTertiary);
    const border = isSelected ? STYLES.borderMedium : STYLES.borderLight;
    element.style.cssText = `padding:1rem;background:${bg};border:1px solid ${border};border-radius:8px;cursor:pointer;transition:all 0.2s ease;text-align:center;color:${STYLES.primary};font-weight:600;font-size:0.9rem`;
  }

  /**
   * Create the modal DOM structure
   */
  create() {
    this.createOverlay();
    this.createModalContainer();
    this.createContent();
    this.setupEventHandlers();
    document.body.appendChild(this.overlay);
    return this.overlay;
  }

  /**
   * Create overlay container
   */
  createOverlay() {
    this.overlay = this.createElement('div', PRESETS.overlay);
    this.overlay.className = 'modal-overlay';
  }

  /**
   * Create modal container with close button
   */
  createModalContainer() {
    this.modal = this.createElement('div', PRESETS.modal);
    this.modal.className = 'modal';

    const closeButton = this.createCloseButton();
    this.modal.appendChild(closeButton);
    this.overlay.appendChild(this.modal);
  }

  /**
   * Create close button with hover effects
   */
  createCloseButton() {
    const closeButton = this.createElement('button', PRESETS.closeBtn, '×');
    closeButton.addEventListener('mouseenter', () => closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)');
    closeButton.addEventListener('mouseleave', () => closeButton.style.backgroundColor = 'transparent');
    closeButton.addEventListener('click', () => this.close());
    return closeButton;
  }

  /**
   * Create main content structure
   */
  createContent() {
    this.content = this.createElement('div', PRESETS.content);
    this.content.className = 'modal-content';

    const title = this.createElement('h2', PRESETS.title, 'Add Student');
    const modeSelector = this.createModeSelector();
    this.createUploadSection();
    this.createSampleSection();
    this.createAnalyzeButton();
    this.createStatusMessage();

    [title, modeSelector, this.uploadSection, this.sampleSection, this.analyzeButton, this.statusMessage]
      .forEach(el => this.content.appendChild(el));

    this.modal.appendChild(this.content);
  }

  /**
   * Create mode selector (Upload/Sample toggle)
   */
  createModeSelector() {
    const modeSelector = this.createElement('div', PRESETS.modeSelector);
    this.uploadOption = this.createElement('div', '', 'Upload Resume');
    this.sampleOption = this.createElement('div', '', 'Sample Resume');
    
    this.styleToggleButton(this.uploadOption, false);
    this.styleToggleButton(this.sampleOption, true);

    modeSelector.appendChild(this.uploadOption);
    modeSelector.appendChild(this.sampleOption);
    return modeSelector;
  }

  /**
   * Create upload section
   */
  createUploadSection() {
    this.uploadSection = this.createElement('div', PRESETS.section);
    this.uploadSection.style.display = 'none';

    const dropArea = this.createDropArea();
    const fileInfo = this.createFileInfo();
    
    [dropArea, fileInfo].forEach(el => this.uploadSection.appendChild(el));
  }

  /**
   * Create file drop area
   */
  createDropArea() {
    const dropArea = this.createElement('div', PRESETS.dropArea);

    const dropIcon = this.createElement('div', 'font-size:2rem;margin-bottom:0.5rem', '📄');
    const dropText = this.createElement('div', `color:${STYLES.accent};font-weight:500;margin-bottom:0.25rem`, 'Click to select or drag & drop your resume');
    const dropHint = this.createElement('div', `color:${STYLES.secondary};font-size:0.8rem`, 'PDF, DOCX, TXT supported');

    [dropIcon, dropText, dropHint].forEach(el => dropArea.appendChild(el));

    // Create hidden file input
    const fileInput = this.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.txt,.md,.rtf';
    fileInput.style.display = 'none';
    this.uploadSection.appendChild(fileInput);

    this.setupFileDropHandlers(dropArea, fileInput);
    return dropArea;
  }

  /**
   * Create file info display
   */
  createFileInfo() {
    const fileInfo = this.createElement('div', PRESETS.fileInfo);
    const fileName = this.createElement('div', `color:${STYLES.primary};font-weight:500;margin-bottom:0.25rem`);
    const fileSize = this.createElement('div', `color:${STYLES.secondary};font-size:0.8rem`);

    fileInfo.appendChild(fileName);
    fileInfo.appendChild(fileSize);

    this.fileInfo = fileInfo;
    this.fileName = fileName;
    this.fileSize = fileSize;
    return fileInfo;
  }

  /**
   * Create sample selection section
   */
  createSampleSection() {
    this.sampleSection = this.createElement('div', PRESETS.section);
    const sampleGrid = this.createElement('div', PRESETS.grid);

    SAMPLE_RESUMES.forEach((resume, index) => {
      const sampleCard = this.createElement('div', '', `Resume ${index + 1}`);
      this.styleCard(sampleCard);
      this.setupSampleCardHandlers(sampleCard, resume, index, sampleGrid);
      sampleGrid.appendChild(sampleCard);
    });

    this.sampleSection.appendChild(sampleGrid);
  }

  /**
   * Create analyze button
   */
  createAnalyzeButton() {
    this.analyzeButton = this.createElement('button', PRESETS.button, 'Upload');
    this.analyzeButton.disabled = true;
  }

  /**
   * Create status message
   */
  createStatusMessage() {
    this.statusMessage = this.createElement('div', PRESETS.status);
  }

  /**
   * Setup all event handlers
   */
  setupEventHandlers() {
    // Mode toggle handlers
    this.uploadOption.addEventListener('click', () => this.setActiveMode(false));
    this.sampleOption.addEventListener('click', () => this.setActiveMode(true));

    // Analyze button handler
    this.analyzeButton.addEventListener('click', () => this.handleAnalyze());

    // Modal close handlers
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    this.escapeHandler = (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    };
    document.addEventListener('keydown', this.escapeHandler);
  }

  /**
   * Setup file drop and selection handlers
   */
  setupFileDropHandlers(dropArea, fileInput) {
    dropArea.addEventListener('click', () => fileInput.click());

    dropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropArea.style.borderColor = STYLES.borderMedium;
      dropArea.style.background = STYLES.bgHover;
    });

    dropArea.addEventListener('dragleave', () => {
      dropArea.style.borderColor = STYLES.borderLight;
      dropArea.style.background = STYLES.bgTertiary;
    });

    dropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      dropArea.style.borderColor = STYLES.borderLight;
      dropArea.style.background = STYLES.bgTertiary;
      
      const files = e.dataTransfer.files;
      if (files.length > 0) this.handleFileSelect(files[0]);
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) this.handleFileSelect(e.target.files[0]);
    });
  }

  /**
   * Setup sample card event handlers
   */
  setupSampleCardHandlers(sampleCard, resume, index, sampleGrid) {
    sampleCard.addEventListener('click', () => this.selectSampleCard(sampleCard, resume, index, sampleGrid));
    sampleCard.addEventListener('mouseenter', () => {
      if (this.selectedSampleIndex !== index) this.styleCard(sampleCard, false, true);
    });
    sampleCard.addEventListener('mouseleave', () => {
      if (this.selectedSampleIndex !== index) this.styleCard(sampleCard, false, false);
    });
  }

  /**
   * Handle sample card selection
   */
  selectSampleCard(selectedCard, resume, index, sampleGrid) {
    sampleGrid.querySelectorAll('div').forEach(card => this.styleCard(card, false, false));
    this.styleCard(selectedCard, true, false);

    this.selectedSampleIndex = index;
    this.selectedSampleFile = resume;
    this.updateAnalyzeButton();
  }

  /**
   * Set active mode (upload vs sample)
   */
  setActiveMode(usingSample) {
    this.styleToggleButton(this.uploadOption, !usingSample);
    this.styleToggleButton(this.sampleOption, usingSample);

    this.uploadSection.style.display = usingSample ? 'none' : 'block';
    this.sampleSection.style.display = usingSample ? 'block' : 'none';

    this.usingSample = usingSample;
    if (!usingSample) {
      this.selectedSampleFile = null;
      this.selectedSampleIndex = null;
    }

    this.updateAnalyzeButton();
  }

  /**
   * Update analyze button state
   */
  updateAnalyzeButton() {
    const hasFile = this.usingSample ? this.selectedSampleFile : this.file;
    this.analyzeButton.disabled = !hasFile;
    this.analyzeButton.style.opacity = hasFile ? '1' : '0.5';
  }

  /**
   * Handle file selection
   */
  handleFileSelect(file) {
    this.file = file;
    this.fileName.textContent = file.name;
    this.fileSize.textContent = `${(file.size / 1024).toFixed(1)} KB`;
    this.fileInfo.style.display = 'block';
    this.updateAnalyzeButton();
    this.statusMessage.textContent = '';
  }

  /**
   * Handle resume analysis
   */
  async handleAnalyze() {
    if ((!this.file && !this.selectedSampleFile) || this.isProcessing) return;

    this.setProcessingState(true);

    try {
      const payload = await this.processSelectedFile();
      const stats = await requestResumeStats(payload);
      await this.handleAnalysisResult(stats);
    } catch (error) {
      console.error("Resume analysis failed", error);
      this.setStatusMessage('Analysis failed. Check console for details.', STYLES.colors.warning);
    } finally {
      this.setProcessingState(false);
    }
  }

  /**
   * Process the selected file (uploaded or sample)
   */
  async processSelectedFile() {
    if (this.usingSample && this.selectedSampleFile) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'sample-resumes', this.selectedSampleFile);
      const fileBuffer = fs.readFileSync(filePath);
      const file = new File([fileBuffer], this.selectedSampleFile, { type: 'application/pdf' });
      return await processResumeFile(file);
    } else {
      return await processResumeFile(this.file);
    }
  }

  /**
   * Handle analysis result
   */
  async handleAnalysisResult(stats) {
    if (stats.summary.startsWith("❌") || stats.summary.startsWith("⚠️")) {
      this.setStatusMessage('Analysis completed with issues', STYLES.colors.warning);
      return;
    }

    if (!this.gameGrid) {
      this.setStatusMessage('Game not available', STYLES.colors.warning);
      return;
    }

    const studentCreated = this.createStudentFromResume(stats);
    if (studentCreated) {
      if (this.gameGrid.sidebar) {
        this.gameGrid.sidebar.refresh();
      }
      this.close();
    } else {
      this.setStatusMessage('No available positions in arena', STYLES.colors.warning);
    }
  }

  /**
   * Set processing state
   */
  setProcessingState(isProcessing) {
    this.isProcessing = isProcessing;
    this.analyzeButton.disabled = isProcessing;
    this.analyzeButton.style.opacity = isProcessing ? '0.5' : '1';
    this.analyzeButton.textContent = isProcessing ? 'Uploading...' : 'Upload';
  }

  /**
   * Set status message
   */
  setStatusMessage(message, color = STYLES.colors.secondary) {
    this.statusMessage.textContent = message;
    this.statusMessage.style.color = color;
  }

  /**
   * Create student from resume stats
   */
  createStudentFromResume(stats) {
    try {
      const gameState = this.gameGrid.getGameState();
      const emptyPosition = this.findEmptyPosition(gameState);
      
      if (!emptyPosition) return false;

      const studentStats = this.buildStudentStats(stats);
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
   * Find empty position on grid
   */
  findEmptyPosition(gameState) {
    const size = gameState.grid.length;
    
    for (let attempts = 0; attempts < 100; attempts++) {
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
      const cell = gameState.grid[y][x];

      if (cell.type === 'walkable' && (!cell.agent || cell.agent === null)) {
        return { x, y };
      }
    }
    return null;
  }

  /**
   * Build student stats from resume analysis
   */
  buildStudentStats(stats) {
    let skills = ['JavaScript'];
    if (stats.skills && Array.isArray(stats.skills)) {
      skills = stats.skills
        .filter(skill => skill && (skill.label || skill.name))
        .map(skill => skill.label || skill.name)
        .slice(0, 4);
    }
    if (skills.length === 0) skills = ['JavaScript'];

    return {
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
  }

  /**
   * Open the modal
   */
  open() {
    if (!this.overlay) {
      this.create();
    }

    // Pause simulation if game is running
    if (this.gameGrid) {
      this.wasSimulationRunning = this.gameGrid.isRunning;
      if (this.wasSimulationRunning) {
        this.gameGrid.stopSimulation();
      }
    }

    this.isOpen = true;
    this.overlay.style.display = 'flex';

    // Add opening animation
    this.overlay.style.opacity = '0';
    this.modal.style.transform = 'scale(0.9)';

    requestAnimationFrame(() => {
      this.overlay.style.transition = 'opacity 0.2s ease';
      this.modal.style.transition = 'transform 0.2s ease';
      this.overlay.style.opacity = '1';
      this.modal.style.transform = 'scale(1)';
    });

    document.body.style.overflow = 'hidden';
  }

  /**
   * Close the modal
   */
  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.overlay.style.opacity = '0';
    this.modal.style.transform = 'scale(0.9)';

    setTimeout(() => {
      this.overlay.style.display = 'none';
      document.body.style.overflow = '';

      if (this.gameGrid && this.wasSimulationRunning) {
        this.gameGrid.startSimulation();
      }
    }, 200);
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