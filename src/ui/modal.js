import { requestResumeStats } from "../services/snapdragonClient.js";
import { processResumeFile } from "../utils/fileProcessor.js";

const S = {
  primary: '#3d2f1f', secondary: '#8b6f47', accent: '#5a4a3a', warning: '#d67d3e',
  bgPrimary: 'rgba(253, 250, 245, 0.95)', bgSecondary: 'rgba(250, 247, 240, 0.8)',
  bgTertiary: 'rgba(250, 247, 240, 0.3)', bgSelected: 'rgba(184, 158, 130, 0.2)', bgHover: 'rgba(250, 247, 240, 0.5)',
  borderLight: 'rgba(139, 113, 85, 0.3)', borderMedium: 'rgba(139, 113, 85, 0.6)', borderOverlay: 'rgba(139, 113, 85, 0.7)',
  gradient: 'linear-gradient(140deg, #d4a574, #c1955f)'
};

const RESUMES = ['sample_resumes-part-1.pdf', 'sample_resumes-part-2.pdf', 'sample_resumes-part-3.pdf', 'sample_resumes-part-4.pdf', 'sample_resumes-part-5.pdf', 'sample_resumes-part-6.pdf', 'sample_resumes-part-7.pdf', 'sample_resumes-part-8.pdf', 'sample_resumes-part-9.pdf', 'sample_resumes-part-10.pdf'];

export class Modal {
  constructor(gameGrid = null) {
    this.isOpen = false;
    this.gameGrid = gameGrid;
    this.wasSimulationRunning = false;
    this.file = null;
    this.isProcessing = false;
    this.usingSample = true;
    this.selectedSampleFile = null;
    this.selectedSampleIndex = null;
  }

  createElement(tag, css = '', text = '') {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (css) el.style.cssText = css;
    return el;
  }

  create() {
    // Overlay
    this.overlay = this.createElement('div', `position:fixed;top:0;left:0;width:100%;height:100%;background:${S.borderOverlay};display:none;justify-content:center;align-items:center;z-index:1000;backdrop-filter:blur(4px)`);
    
    // Modal
    this.modal = this.createElement('div', `background:${S.bgPrimary};border:2px solid ${S.borderLight};border-radius:16px;padding:2rem;min-width:400px;max-width:500px;width:90%;color:${S.accent};position:relative;backdrop-filter:blur(20px)`);
    
    // Close button
    const close = this.createElement('button', `position:absolute;top:1rem;right:1rem;background:none;border:none;color:${S.secondary};font-size:24px;cursor:pointer;padding:0;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:background-color 0.2s ease`, '×');
    close.addEventListener('mouseenter', () => close.style.backgroundColor = 'rgba(255, 255, 255, 0.1)');
    close.addEventListener('mouseleave', () => close.style.backgroundColor = 'transparent');
    close.addEventListener('click', () => this.close());

    // Content
    this.content = this.createElement('div', `display:flex;flex-direction:column;align-items:center;text-align:center;padding-top:1rem`);
    
    // Title
    const title = this.createElement('h2', `margin:0 0 1.5rem 0;font-size:1.5rem;font-weight:600;color:${S.primary};text-align:center`, 'Add Student');
    
    // Mode selector
    const modeSelector = this.createElement('div', `display:flex;background:${S.bgSecondary};border-radius:10px;padding:4px;margin-bottom:1.5rem;width:100%;max-width:400px`);
    this.uploadOption = this.createElement('div', `flex:1;padding:0.75rem;text-align:center;background:transparent;color:${S.secondary};border-radius:6px;cursor:pointer;font-weight:600;font-size:0.85rem;transition:all 0.2s ease`, 'Upload Resume');
    this.sampleOption = this.createElement('div', `flex:1;padding:0.75rem;text-align:center;background:${S.gradient};color:${S.primary};border-radius:6px;cursor:pointer;font-weight:600;font-size:0.85rem;transition:all 0.2s ease`, 'Sample Resume');
    modeSelector.append(this.uploadOption, this.sampleOption);

    // Upload section
    this.uploadSection = this.createElement('div', `width:100%;max-width:400px;display:none`);
    const dropArea = this.createElement('div', `border:2px dashed ${S.borderLight};border-radius:12px;padding:2rem;text-align:center;background:${S.bgTertiary};transition:all 0.2s ease;cursor:pointer;margin-bottom:1rem;width:100%;max-width:400px`);
    dropArea.innerHTML = `<div style="font-size:2rem;margin-bottom:0.5rem">📄</div><div style="color:${S.accent};font-weight:500;margin-bottom:0.25rem">Click to select or drag & drop your resume</div><div style="color:${S.secondary};font-size:0.8rem">PDF, DOCX, TXT supported</div>`;
    
    const fileInput = this.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.txt,.md,.rtf';
    fileInput.style.display = 'none';
    
    this.fileInfo = this.createElement('div', `padding:0.75rem;background:rgba(250, 247, 240, 0.7);border-radius:8px;margin-bottom:1.5rem;display:none;width:100%;max-width:400px`);
    this.fileName = this.createElement('div', `color:${S.primary};font-weight:500;margin-bottom:0.25rem`);
    this.fileSize = this.createElement('div', `color:${S.secondary};font-size:0.8rem`);
    this.fileInfo.append(this.fileName, this.fileSize);
    
    this.uploadSection.append(dropArea, fileInput, this.fileInfo);

    // Sample section
    this.sampleSection = this.createElement('div', `width:100%;max-width:400px`);
    const sampleGrid = this.createElement('div', `display:grid;grid-template-columns:repeat(2, 1fr);gap:0.75rem;margin-bottom:1.5rem`);
    RESUMES.forEach((resume, i) => {
      const card = this.createElement('div', `padding:1rem;background:${S.bgTertiary};border:1px solid ${S.borderLight};border-radius:8px;cursor:pointer;transition:all 0.2s ease;text-align:center;color:${S.primary};font-weight:600;font-size:0.9rem`, `Resume ${i + 1}`);
      card.addEventListener('click', () => this.selectSample(card, resume, i, sampleGrid));
      card.addEventListener('mouseenter', () => { if (this.selectedSampleIndex !== i) this.styleCard(card, false, true); });
      card.addEventListener('mouseleave', () => { if (this.selectedSampleIndex !== i) this.styleCard(card, false, false); });
      sampleGrid.appendChild(card);
    });
    this.sampleSection.appendChild(sampleGrid);

    // Button & status
    this.analyzeButton = this.createElement('button', `width:100%;max-width:400px;background:${S.gradient};color:${S.primary};border:none;border-radius:8px;padding:0.75rem 1.5rem;font-weight:600;font-size:0.95rem;cursor:pointer;transition:all 0.2s ease;margin:0 auto 1rem auto;opacity:0.5;display:block`, 'Upload');
    this.analyzeButton.disabled = true;
    this.statusMessage = this.createElement('div', `text-align:center;font-size:0.85rem;min-height:1.2rem;color:${S.secondary}`);

    // Assemble
    this.content.append(title, modeSelector, this.uploadSection, this.sampleSection, this.analyzeButton, this.statusMessage);
    this.modal.append(close, this.content);
    this.overlay.appendChild(this.modal);

    // Events
    this.uploadOption.addEventListener('click', () => this.setMode(false));
    this.sampleOption.addEventListener('click', () => this.setMode(true));
    this.analyzeButton.addEventListener('click', () => this.analyze());
    this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay) this.close(); });
    this.escapeHandler = (e) => { if (e.key === 'Escape' && this.isOpen) this.close(); };
    document.addEventListener('keydown', this.escapeHandler);

    // File handlers
    dropArea.addEventListener('click', () => fileInput.click());
    dropArea.addEventListener('dragover', (e) => { e.preventDefault(); dropArea.style.borderColor = S.borderMedium; dropArea.style.background = S.bgHover; });
    dropArea.addEventListener('dragleave', () => { dropArea.style.borderColor = S.borderLight; dropArea.style.background = S.bgTertiary; });
    dropArea.addEventListener('drop', (e) => { e.preventDefault(); dropArea.style.borderColor = S.borderLight; dropArea.style.background = S.bgTertiary; if (e.dataTransfer.files.length > 0) this.handleFile(e.dataTransfer.files[0]); });
    fileInput.addEventListener('change', (e) => { if (e.target.files.length > 0) this.handleFile(e.target.files[0]); });

    document.body.appendChild(this.overlay);
    return this.overlay;
  }

  styleCard(el, selected = false, hover = false) {
    const bg = selected ? S.bgSelected : (hover ? S.bgHover : S.bgTertiary);
    const border = selected ? S.borderMedium : S.borderLight;
    el.style.cssText = `padding:1rem;background:${bg};border:1px solid ${border};border-radius:8px;cursor:pointer;transition:all 0.2s ease;text-align:center;color:${S.primary};font-weight:600;font-size:0.9rem`;
  }

  selectSample(card, resume, index, grid) {
    grid.querySelectorAll('div').forEach(c => this.styleCard(c, false, false));
    this.styleCard(card, true, false);
    this.selectedSampleIndex = index;
    this.selectedSampleFile = resume;
    this.updateButton();
  }

  setMode(sample) {
    this.uploadOption.style.cssText = `flex:1;padding:0.75rem;text-align:center;background:${!sample ? S.gradient : 'transparent'};color:${!sample ? S.primary : S.secondary};border-radius:6px;cursor:pointer;font-weight:600;font-size:0.85rem;transition:all 0.2s ease`;
    this.sampleOption.style.cssText = `flex:1;padding:0.75rem;text-align:center;background:${sample ? S.gradient : 'transparent'};color:${sample ? S.primary : S.secondary};border-radius:6px;cursor:pointer;font-weight:600;font-size:0.85rem;transition:all 0.2s ease`;
    this.uploadSection.style.display = sample ? 'none' : 'block';
    this.sampleSection.style.display = sample ? 'block' : 'none';
    this.usingSample = sample;
    if (!sample) { this.selectedSampleFile = null; this.selectedSampleIndex = null; }
    this.updateButton();
  }

  updateButton() {
    const hasFile = this.usingSample ? this.selectedSampleFile : this.file;
    this.analyzeButton.disabled = !hasFile;
    this.analyzeButton.style.opacity = hasFile ? '1' : '0.5';
  }

  handleFile(file) {
    this.file = file;
    this.fileName.textContent = file.name;
    this.fileSize.textContent = `${(file.size / 1024).toFixed(1)} KB`;
    this.fileInfo.style.display = 'block';
    this.updateButton();
    this.statusMessage.textContent = '';
  }

  async analyze() {
    if ((!this.file && !this.selectedSampleFile) || this.isProcessing) return;

    this.isProcessing = true;
    this.analyzeButton.disabled = true;
    this.analyzeButton.style.opacity = '0.5';
    this.analyzeButton.textContent = 'Uploading...';

    try {
      let payload;
      if (this.usingSample && this.selectedSampleFile) {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(process.cwd(), 'sample-resumes', this.selectedSampleFile);
        const fileBuffer = fs.readFileSync(filePath);
        const file = new File([fileBuffer], this.selectedSampleFile, { type: 'application/pdf' });
        payload = await processResumeFile(file);
      } else {
        payload = await processResumeFile(this.file);
      }

      const stats = await requestResumeStats(payload);

      if (stats.summary.startsWith("❌") || stats.summary.startsWith("⚠️")) {
        this.setStatus('Analysis completed with issues', S.warning);
        return;
      }

      if (!this.gameGrid) {
        this.setStatus('Game not available', S.warning);
        return;
      }

      if (this.createStudent(stats)) {
        if (this.gameGrid.sidebar) this.gameGrid.sidebar.refresh();
        this.close();
      } else {
        this.setStatus('No available positions in arena', S.warning);
      }
    } catch (error) {
      console.error("Resume analysis failed", error);
      this.setStatus('Analysis failed. Check console for details.', S.warning);
    } finally {
      this.isProcessing = false;
      this.analyzeButton.disabled = false;
      this.analyzeButton.style.opacity = '1';
      this.analyzeButton.textContent = 'Upload';
    }
  }

  setStatus(message, color = S.secondary) {
    this.statusMessage.textContent = message;
    this.statusMessage.style.color = color;
  }

  createStudent(stats) {
    try {
      const gameState = this.gameGrid.getGameState();
      const size = gameState.grid.length;
      let pos = null;

      for (let i = 0; i < 100; i++) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);
        const cell = gameState.grid[y][x];
        if (cell.type === 'walkable' && (!cell.agent || cell.agent === null)) {
          pos = { x, y };
          break;
        }
      }

      if (!pos) return false;

      let skills = ['JavaScript'];
      if (stats.skills && Array.isArray(stats.skills)) {
        skills = stats.skills.filter(s => s && (s.label || s.name)).map(s => s.label || s.name).slice(0, 4);
        if (skills.length === 0) skills = ['JavaScript'];
      }

      const agent = this.gameGrid.addAgent(pos.x, pos.y, null, true);
      if (agent) {
        agent.stats = {
          gpa: stats.gpa || 3.0, skills, experience: stats.experience || 0, major: stats.major || 'Computer Science',
          networking: stats.networking || 0, energyScore: stats.energyScore || 50, luck: stats.luck || 50,
          internships: stats.internships || 0, buzzwords: stats.buzzwords || [], summary: stats.summary || '', fillerRatio: stats.fillerRatio || 0
        };
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to create student from resume:", error);
      return false;
    }
  }

  open() {
    if (!this.overlay) this.create();
    if (this.gameGrid) {
      this.wasSimulationRunning = this.gameGrid.isRunning;
      if (this.wasSimulationRunning) this.gameGrid.stopSimulation();
    }
    this.isOpen = true;
    this.overlay.style.display = 'flex';
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

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.overlay.style.opacity = '0';
    this.modal.style.transform = 'scale(0.9)';
    setTimeout(() => {
      this.overlay.style.display = 'none';
      document.body.style.overflow = '';
      if (this.gameGrid && this.wasSimulationRunning) this.gameGrid.startSimulation();
    }, 200);
  }

  destroy() {
    if (this.escapeHandler) document.removeEventListener('keydown', this.escapeHandler);
    if (this.overlay && this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
    this.overlay = null;
    this.modal = null;
    this.content = null;
    this.isOpen = false;
    document.body.style.overflow = '';
  }
}

export function showModal(gameGrid = null) {
  const modal = new Modal(gameGrid);
  modal.open();
  return modal;
}