// Style constants
const STYLES = {
  colors: {
    primary: '#3d2f1f',
    primaryDark: '#2d1f0f',
    secondary: '#5a4a3a',
    accent: '#8b6f47',
    background: 'rgba(253, 250, 245, 0.95)',
    cardBackground: 'rgba(250, 247, 240, 0.5)',
    tableBackground: 'rgba(250, 247, 240, 0.3)',
    highlight: 'rgba(212, 165, 116, 0.1)',
    highlightHover: 'rgba(212, 165, 116, 0.2)',
    border: 'rgba(139, 113, 85, 0.3)',
    borderLight: 'rgba(139, 113, 85, 0.1)',
    borderDark: 'rgba(139, 113, 85, 0.2)',
    overlay: 'rgba(139, 113, 85, 0.7)'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    xxl: '2rem'
  },
  fontSize: {
    xs: '0.8rem',
    sm: '0.85rem',
    md: '0.9rem',
    lg: '1.5rem',
    xl: '1.8rem'
  }
};

/**
 * Leaderboard Modal Component - Shows student rankings and stats
 */
export class LeaderboardModal {
  constructor(gameGrid = null) {
    this.isOpen = false;
    this.overlay = null;
    this.modal = null;
    this.onClose = null;
    this.gameGrid = gameGrid;
    this.wasSimulationRunning = false;
  }

  /**
   * Helper method to create elements with common styling patterns
   */
  createElement(tag, className, styles = {}) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    
    const styleString = Object.entries(styles)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ');
    
    if (styleString) element.style.cssText = styleString;
    return element;
  }

  /**
   * Helper method to create table cells
   */
  createTableCell(content, options = {}) {
    const { 
      isHeader = false, 
      isPrimary = false, 
      centered = false,
      bold = false,
      width = null 
    } = options;

    const cell = document.createElement(isHeader ? 'th' : 'td');
    cell.textContent = content;

    const cellStyles = {
      padding: `${STYLES.spacing.md}`,
      borderBottom: isHeader 
        ? `2px solid ${STYLES.colors.border}` 
        : `1px solid ${STYLES.colors.borderLight}`,
      textAlign: centered ? 'center' : 'left',
      fontWeight: isPrimary ? '700' : (bold || isHeader) ? '600' : '500',
      color: isPrimary ? STYLES.colors.primaryDark : STYLES.colors.primary,
      fontSize: isHeader ? STYLES.fontSize.md : undefined,
      ...(width && { width }),
      ...(isPrimary && !isHeader && { color: STYLES.colors.secondary }),
      ...(isPrimary && isHeader && { background: STYLES.colors.highlight })
    };

    cell.style.cssText = Object.entries(cellStyles)
      .map(([key, value]) => value ? `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}` : '')
      .filter(Boolean)
      .join('; ');

    return cell;
  }

  /**
   * Create close button
   */
  createCloseButton() {
    const closeButton = this.createElement('button', null, {
      position: 'absolute',
      top: STYLES.spacing.lg,
      right: STYLES.spacing.lg,
      background: 'none',
      border: 'none',
      color: STYLES.colors.accent,
      fontSize: '24px',
      cursor: 'pointer',
      padding: '0',
      margin: '0',
      width: '30px',
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      transition: 'background-color 0.2s ease'
    });

    closeButton.innerHTML = '×';
    
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    });

    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.backgroundColor = 'transparent';
    });

    closeButton.addEventListener('click', () => this.close());
    return closeButton;
  }

  /**
   * Create the modal DOM elements
   */
  create() {
    // Create overlay
    this.overlay = this.createElement('div', 'leaderboard-overlay', {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: STYLES.colors.overlay,
      display: 'none',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '1000',
      backdropFilter: 'blur(4px)'
    });

    // Create modal container
    this.modal = this.createElement('div', 'leaderboard-modal', {
      background: STYLES.colors.background,
      border: `2px solid ${STYLES.colors.border}`,
      borderRadius: '16px',
      padding: STYLES.spacing.xxl,
      minWidth: '600px',
      maxWidth: '800px',
      width: '90%',
      maxHeight: '80vh',
      overflowY: 'auto',
      color: STYLES.colors.secondary,
      position: 'relative',
      backdropFilter: 'blur(20px)'
    });

    // Create content container
    this.content = this.createElement('div', 'leaderboard-content', {
      display: 'flex',
      flexDirection: 'column',
      paddingTop: STYLES.spacing.lg
    });

    // Create close button
    const closeButton = this.createCloseButton();

    // Create the leaderboard content
    this.createLeaderboardContent();

    // Assemble modal
    this.modal.appendChild(closeButton);
    this.modal.appendChild(this.content);
    this.overlay.appendChild(this.modal);

    this.setupEventHandlers();
    document.body.appendChild(this.overlay);

    return this.overlay;
  }

  /**
   * Setup event handlers for modal
   */
  setupEventHandlers() {
    // Click outside to close
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // Escape key to close
    this.escapeHandler = (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    };

    document.addEventListener('keydown', this.escapeHandler);
  }

  /**
   * Create the leaderboard content
   */
  createLeaderboardContent() {
    const title = this.createTitle();
    const students = this.getStudentData();
    const statsContainer = this.createStatsSection(students);
    const tableContainer = this.createTableSection(students);

    this.content.appendChild(title);
    this.content.appendChild(statsContainer);
    this.content.appendChild(tableContainer);
  }

  /**
   * Create title element
   */
  createTitle() {
    const title = this.createElement('h2', null, {
      margin: `0 0 ${STYLES.spacing.xl} 0`,
      fontSize: STYLES.fontSize.xl,
      fontWeight: '600',
      color: STYLES.colors.primary,
      textAlign: 'center'
    });
    title.textContent = '🏆 Student Leaderboard';
    return title;
  }

  /**
   * Create stats summary section
   */
  createStatsSection(students) {
    const statsContainer = this.createElement('div', null, {
      background: STYLES.colors.highlight,
      borderRadius: '12px',
      padding: STYLES.spacing.lg,
      marginBottom: STYLES.spacing.xl,
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: STYLES.spacing.lg,
      textAlign: 'center'
    });

    const totals = this.calculateTotals(students);
    
    Object.entries(totals).forEach(([label, value]) => {
      statsContainer.appendChild(this.createStatCard(label, value));
    });

    return statsContainer;
  }

  /**
   * Calculate totals for stats section
   */
  calculateTotals(students) {
    return {
      'Total Students': students.length,
      'Total Conversations': students.reduce((sum, student) => sum + (student.recruitersSpokenTo || 0), 0),
      'Total Distance': students.reduce((sum, student) => sum + (student.distanceTraveled || 0), 0),
      'Total Job Offers': students.reduce((sum, student) => sum + (student.jobOffers || 0), 0)
    };
  }

  /**
   * Create stat card
   */
  createStatCard(label, value) {
    const card = this.createElement('div', null, {
      background: STYLES.colors.cardBackground,
      padding: STYLES.spacing.md,
      borderRadius: '8px',
      border: `1px solid ${STYLES.colors.borderDark}`
    });

    const valueEl = this.createElement('div', null, {
      fontSize: STYLES.fontSize.lg,
      fontWeight: 'bold',
      color: STYLES.colors.primary,
      marginBottom: STYLES.spacing.xs
    });
    valueEl.textContent = value;

    const labelEl = this.createElement('div', null, {
      fontSize: STYLES.fontSize.sm,
      color: STYLES.colors.accent,
      fontWeight: '500'
    });
    labelEl.textContent = label;

    card.appendChild(valueEl);
    card.appendChild(labelEl);
    return card;
  }

  /**
   * Create table section
   */
  createTableSection(students) {
    const tableContainer = this.createElement('div', null, {
      background: STYLES.colors.tableBackground,
      borderRadius: '12px',
      overflow: 'hidden',
      border: `1px solid ${STYLES.colors.borderDark}`
    });

    const table = this.createElement('table', null, {
      width: '100%',
      borderCollapse: 'collapse'
    });

    table.appendChild(this.createTableHeader());
    table.appendChild(this.createTableBody(students));

    tableContainer.appendChild(table);
    return tableContainer;
  }

  /**
   * Create table header
   */
  createTableHeader() {
    const thead = this.createElement('thead', null, {
      background: STYLES.colors.highlightHover
    });

    const headerRow = document.createElement('tr');
    const headers = ['Rank', 'Name', 'Job Offers', 'Recruiters Talked To', 'Distance Traveled'];

    headers.forEach(headerText => {
      const isPrimary = headerText === 'Job Offers';
      const cell = this.createTableCell(headerText, {
        isHeader: true,
        isPrimary
      });
      headerRow.appendChild(cell);
    });

    thead.appendChild(headerRow);
    return thead;
  }

  /**
   * Create table body
   */
  createTableBody(students) {
    const tbody = document.createElement('tbody');

    if (students.length === 0) {
      tbody.appendChild(this.createEmptyRow());
    } else {
      students.forEach((student, index) => {
        tbody.appendChild(this.createStudentRow(student, index));
      });
    }

    return tbody;
  }

  /**
   * Create empty state row
   */
  createEmptyRow() {
    const row = document.createElement('tr');
    const cell = this.createTableCell('No students found. Add some students to see the leaderboard!', {
      centered: true
    });
    cell.colSpan = 5;
    cell.style.padding = STYLES.spacing.xxl;
    cell.style.fontStyle = 'italic';
    cell.style.color = STYLES.colors.accent;
    
    row.appendChild(cell);
    return row;
  }

  /**
   * Create student row
   */
  createStudentRow(student, index) {
    const row = this.createElement('tr', null, {
      transition: 'background-color 0.2s ease'
    });

    // Hover effects
    row.addEventListener('mouseenter', () => {
      row.style.backgroundColor = STYLES.colors.highlight;
    });

    row.addEventListener('mouseleave', () => {
      row.style.backgroundColor = 'transparent';
    });

    // Create cells
    const rankText = this.getRankText(index);
    const cells = [
      this.createTableCell(rankText, { bold: true, width: '60px' }),
      this.createTableCell(this.getStudentDisplayName(student), { bold: true }),
      this.createTableCell(student.jobOffers || 0, { centered: true, bold: true }),
      this.createTableCell(student.recruitersSpokenTo || 0, { centered: true }),
      this.createTableCell(student.distanceTraveled || 0, { centered: true })
    ];

    cells.forEach(cell => row.appendChild(cell));
    return row;
  }


  /**
   * Resolve a student name with sensible fallbacks.
   */
  getStudentDisplayName(student) {
    if (!student) return 'Unknown Student';
    const rawName = [student.displayName, student.name, student.stats?.name]
      .map(value => (typeof value === 'string' ? value.trim() : ''))
      .find(value => value.length);
    if (rawName) {
      return rawName;
    }
    return `Student ${student.id}`;
  }

  /**
   * Get rank text with medals for top 3
   */
  getRankText(index) {
    const rank = index + 1;
    if (rank === 1) return '🥇 1';
    if (rank === 2) return '🥈 2';
    if (rank === 3) return '🥉 3';
    return rank.toString();
  }

  /**
   * Get student data sorted by priority:
   * 1. Job Offers (primary - most important)
   * 2. Recruiters Talked To (secondary)  
   * 3. Distance Traveled (tertiary - tie-breaker)
   */
  getStudentData() {
    if (!this.gameGrid) return [];

    const gameState = this.gameGrid.getGameState();
    const students = gameState.agents.filter(agent => agent.isStudent);

    // Sort by job offers (descending), then by recruiters talked to (descending), then by distance traveled (descending)
    return students.sort((a, b) => {
      const aJobOffers = a.jobOffers || 0;
      const bJobOffers = b.jobOffers || 0;
      
      if (aJobOffers !== bJobOffers) {
        return bJobOffers - aJobOffers;
      }
      
      const aRecruiters = a.recruitersSpokenTo || 0;
      const bRecruiters = b.recruitersSpokenTo || 0;
      
      if (aRecruiters !== bRecruiters) {
        return bRecruiters - aRecruiters;
      }
      
      const aDistance = a.distanceTraveled || 0;
      const bDistance = b.distanceTraveled || 0;
      return bDistance - aDistance;
    });
  }

  /**
   * Refresh the leaderboard content with latest data
   */
  refresh() {
    if (!this.content) return;
    
    // Clear existing content
    this.content.innerHTML = '';
    
    // Recreate content
    this.createLeaderboardContent();
  }

  /**
   * Open the modal
   */
  open() {
    if (!this.overlay) {
      this.create();
    } else {
      // Refresh data when opening
      this.refresh();
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
 * Create and show a leaderboard modal
 */
export function showLeaderboard(gameGrid = null) {
  const modal = new LeaderboardModal(gameGrid);
  modal.open();
  return modal;
}
