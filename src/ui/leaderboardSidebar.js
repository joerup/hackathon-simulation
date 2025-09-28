/**
 * LeaderboardSidebar component - Displays student leaderboard in right sidebar
 */

const S = {
  primary: '#3d2f1f', 
  primaryDark: '#2d1f0f', 
  secondary: '#5a4a3a', 
  accent: '#8b6f47',
  bg: 'rgba(253, 250, 245, 0.95)', 
  cardBg: 'rgba(250, 247, 240, 0.5)', 
  tableBg: 'rgba(250, 247, 240, 0.3)',
  highlight: 'rgba(212, 165, 116, 0.1)', 
  highlightHover: 'rgba(212, 165, 116, 0.2)',
  border: 'rgba(139, 113, 85, 0.3)', 
  borderLight: 'rgba(139, 113, 85, 0.1)', 
  borderDark: 'rgba(139, 113, 85, 0.2)'
};

export class LeaderboardSidebar {
  constructor(gameGrid = null) {
    this.gameGrid = gameGrid;
    this.sidebar = null;
    this.contentWrapper = null;
    this.toggleButton = null;
    this.leaderboardContainer = null;
    this.isInitialized = false;
    this.isCollapsed = false;
    this.expandedWidth = '400px';
    this.collapsedWidth = '50px';
  }

  /**
   * Initialize the sidebar
   */
  initialize() {
    if (this.isInitialized) return;

    this.sidebar = document.createElement('div');
    this.sidebar.className = 'leaderboard-sidebar';
    this.sidebar.style.cssText = `
      position: fixed;
      top: 60px;
      right: 0;
      width: ${this.expandedWidth};
      height: calc(100vh - 60px);
      background: ${S.bg};
      border-left: 2px solid ${S.borderDark};
      backdrop-filter: blur(20px);
      z-index: 50;
      overflow: visible;
      transition: width 0.3s ease, padding 0.3s ease;
      display: flex;
      flex-direction: column;
    `;

    // Toggle button
    this.toggleButton = document.createElement('button');
    this.toggleButton.className = 'sidebar-toggle';
    this.toggleButton.innerHTML = '<span style="margin-right: 4px;">▶</span>Leaderboard';
    this.toggleButton.style.cssText = `
      width: 110px;
      height: 28px;
      border: none;
      border-radius: 6px;
      background: rgba(139, 113, 85, 0.2);
      color: ${S.accent};
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      margin: 0.5rem 1rem 0.75rem auto;
      padding: 0 6px;
      font-weight: 500;
      white-space: nowrap;
      flex-shrink: 0;  
    `;

    this.toggleButton.addEventListener('mouseenter', () => {
      this.toggleButton.style.background = 'rgba(139, 113, 85, 0.35)';
      this.toggleButton.style.color = '#5a4a3a';
      this.toggleButton.style.transform = this.isCollapsed ? 'translateX(-50%) scale(1.1)' : 'scale(1.1)';
    });

    this.toggleButton.addEventListener('mouseleave', () => {
      this.toggleButton.style.background = 'rgba(139, 113, 85, 0.2)';
      this.toggleButton.style.color = S.accent;
      this.toggleButton.style.transform = this.isCollapsed ? 'translateX(-50%)' : 'none';
    });

    this.toggleButton.addEventListener('click', () => {
      this.toggle();
    });

    // Content wrapper
    this.contentWrapper = document.createElement('div');
    this.contentWrapper.className = 'sidebar-content';
    this.contentWrapper.style.cssText = `
      padding: 0.5rem 1rem 1rem;
      flex: 1;
      overflow-y: auto;
      overflow-x: visible;
      display: flex;
      flex-direction: column;
      transition: opacity 0.2s ease;
    `;

    // Leaderboard container
    this.leaderboardContainer = document.createElement('div');
    this.leaderboardContainer.className = 'leaderboard-content';
    this.leaderboardContainer.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      overflow-y: auto;
      overflow-x: hidden;
      min-height: 0;
    `;

    // Add scrollbar styling
    this.leaderboardContainer.style.scrollbarWidth = 'thin';
    this.leaderboardContainer.style.scrollbarColor = `${S.borderDark} rgba(253, 250, 245, 0.4)`;

    // Add webkit scrollbar styling
    if (!document.querySelector('#leaderboard-scrollbar-styles')) {
      const scrollbarStyle = document.createElement('style');
      scrollbarStyle.id = 'leaderboard-scrollbar-styles';
      scrollbarStyle.textContent = `
        .leaderboard-content::-webkit-scrollbar {
          width: 8px;
        }
        .leaderboard-content::-webkit-scrollbar-track {
          background: rgba(253, 250, 245, 0.7);
          border-radius: 4px;
        }
        .leaderboard-content::-webkit-scrollbar-thumb {
          background: ${S.borderDark};
          border-radius: 4px;
        }
        .leaderboard-content::-webkit-scrollbar-thumb:hover {
          background: ${S.border};
        }
      `;
      document.head.appendChild(scrollbarStyle);
    }

    // Assemble content wrapper
    this.contentWrapper.appendChild(this.leaderboardContainer);

    // Assemble sidebar
    this.sidebar.appendChild(this.toggleButton);
    this.sidebar.appendChild(this.contentWrapper);

    // Add to page
    document.body.appendChild(this.sidebar);

    // Add right margin to body to account for sidebar
    this.updateBodyMargin();

    // Refresh content
    this.refreshContent();

    this.isInitialized = true;
    return this.sidebar;
  }

  /**
   * Create an element with styling
   */
  createElement(tag, css = '', text = '') {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (css) el.style.cssText = css;
    return el;
  }

  /**
   * Get student data sorted by priority
   */
  getStudents() {
    if (!this.gameGrid) return [];
    const gameState = this.gameGrid.getGameState();
    
    return gameState.agents.filter(agent => agent.isStudent).map(agent => {
      // Calculate interaction metrics
      const totalScore = agent.stats?.totalInteractionScore || 0;
      const interactionCount = agent.stats?.interactionHistory?.length || 0;
      const avgScore = interactionCount > 0 ? totalScore / interactionCount : 0;
      
      return {
        ...agent,
        calculatedTotalScore: totalScore,
        calculatedAvgScore: avgScore,
        calculatedInteractionCount: interactionCount
      };
    }).sort((a, b) => {
      // Primary: Job Offers
      const aJobs = a.stats?.jobOffers || a.jobOffers || 0;
      const bJobs = b.stats?.jobOffers || b.jobOffers || 0;
      if (aJobs !== bJobs) return bJobs - aJobs;
      
      // Secondary: Total Interaction Score
      if (a.calculatedTotalScore !== b.calculatedTotalScore) {
        return b.calculatedTotalScore - a.calculatedTotalScore;
      }
      
      // Tertiary: Average Interaction Score
      if (a.calculatedAvgScore !== b.calculatedAvgScore) {
        return b.calculatedAvgScore - a.calculatedAvgScore;
      }
      
      // Quaternary: Recruiters Talked To
      const aRec = a.recruitersSpokenTo || 0;
      const bRec = b.recruitersSpokenTo || 0;
      if (aRec !== bRec) return bRec - aRec;
      
      // Tie-breaker: Distance Traveled
      return (b.distanceTraveled || 0) - (a.distanceTraveled || 0);
    });
  }

  /**
   * Get student display name with fallbacks
   */
  getStudentDisplayName(student) {
    if (!student) return 'Unknown Student';
    const rawName = [student.displayName, student.stats?.name]
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
   * Refresh the leaderboard content
   */
  refreshContent() {
    if (!this.leaderboardContainer) return;

    this.leaderboardContainer.innerHTML = '';

    // Title
    const title = this.createElement('h2', `
      margin: 0 0 1rem 0;
      font-size: 1.3rem;
      font-weight: 600;
      color: ${S.primary};
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    `, '🏆 Leaderboard');

    // Get students data
    const students = this.getStudents();

    // Stats section
    const statsContainer = this.createElement('div', `
      background: ${S.highlight};
      border-radius: 8px;
      padding: 0.75rem;
      margin-bottom: 1rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      font-size: 0.8rem;
    `);

    const totals = {
      'Students': students.length,
      'Job Offers': students.reduce((s, st) => s + (st.stats?.jobOffers || st.jobOffers || 0), 0),
      'Recruiters Met': students.reduce((s, st) => s + (st.calculatedInteractionCount || 0), 0),
      'Total Scores': students.reduce((s, st) => s + (st.calculatedTotalScore || 0), 0).toFixed(0)
    };

    Object.entries(totals).forEach(([label, value]) => {
      const card = this.createElement('div', `
        background: ${S.cardBg};
        padding: 0.5rem;
        border-radius: 6px;
        border: 1px solid ${S.borderLight};
        text-align: center;
      `);
      card.innerHTML = `
        <div style="font-size: 1.1rem; font-weight: bold; color: ${S.primary}; margin-bottom: 0.25rem">${value}</div>
        <div style="font-size: 0.7rem; color: ${S.accent}; font-weight: 500">${label}</div>
      `;
      statsContainer.appendChild(card);
    });

    // Students list
    const studentsContainer = this.createElement('div', `
      background: ${S.tableBg};
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid ${S.borderLight};
      flex: 1;
      display: flex;
      flex-direction: column;
    `);

    if (students.length === 0) {
      const emptyState = this.createElement('div', `
        padding: 2rem 1rem;
        text-align: center;
        font-style: italic;
        color: ${S.accent};
        font-size: 0.9rem;
      `, 'No students found. Add some students to see the leaderboard!');
      studentsContainer.appendChild(emptyState);
    } else {
      // Header
      const header = this.createElement('div', `
        background: ${S.highlightHover};
        padding: 0.5rem;
        border-bottom: 1px solid ${S.borderLight};
        display: grid;
        grid-template-columns: 35px 1fr auto auto auto auto;
        gap: 0.4rem;
        font-weight: 600;
        font-size: 0.75rem;
        color: ${S.primary};
        align-items: center;
      `);

      const headerItems = ['#', 'Name', 'Offers', 'Recruiters', 'Scores', 'Distance'];
      headerItems.forEach((text, i) => {
        const item = this.createElement('div', i > 1 ? 'text-align: center;' : '', text);
        header.appendChild(item);
      });

      studentsContainer.appendChild(header);

      // Students list
      const studentsList = this.createElement('div', `
        flex: 1;
        overflow-y: auto;
        max-height: 500px;
      `);

      students.forEach((student, i) => {
        const row = this.createElement('div', `
          padding: 0.4rem 0.5rem;
          display: grid;
          grid-template-columns: 35px 1fr auto auto auto auto;
          gap: 0.4rem;
          border-bottom: 1px solid ${S.borderLight};
          transition: background-color 0.2s ease;
          align-items: center;
          font-size: 0.75rem;
        `);

        row.addEventListener('mouseenter', () => {
          row.style.backgroundColor = S.highlight;
        });

        row.addEventListener('mouseleave', () => {
          row.style.backgroundColor = 'transparent';
        });

        // Get data
        const jobOffers = student.stats?.jobOffers || student.jobOffers || 0;
        const recruitersMet = student.calculatedInteractionCount || 0;
        const totalScores = student.calculatedTotalScore ? student.calculatedTotalScore.toFixed(0) : '0';
        const distance = Math.round(student.distanceTraveled || 0);

        // Rank
        const rankEl = this.createElement('div', `
          font-weight: 700;
          color: ${S.primaryDark};
        `, this.getRankText(i));

        // Name
        const nameEl = this.createElement('div', `
          font-weight: 600;
          color: ${S.primary};
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        `, this.getStudentDisplayName(student));

        // Job Offers
        const offersEl = this.createElement('div', `
          text-align: center;
          font-weight: 700;
          color: ${S.secondary};
          background: ${i === 0 && jobOffers > 0 ? S.highlight : 'transparent'};
          padding: 0.2rem 0.3rem;
          border-radius: 4px;
          min-width: 30px;
        `, jobOffers.toString());

        // Recruiters Met
        const recruitersEl = this.createElement('div', `
          text-align: center;
          color: ${S.accent};
          font-weight: 500;
          min-width: 30px;
        `, recruitersMet.toString());

        // Total Scores
        const scoresEl = this.createElement('div', `
          text-align: center;
          color: ${S.primary};
          font-weight: 500;
          min-width: 35px;
        `, totalScores);

        // Distance Traveled
        const distEl = this.createElement('div', `
          text-align: center;
          color: ${S.primary};
          font-weight: 500;
          min-width: 30px;
        `, distance.toString());

        row.appendChild(rankEl);
        row.appendChild(nameEl);
        row.appendChild(offersEl);
        row.appendChild(recruitersEl);
        row.appendChild(scoresEl);
        row.appendChild(distEl);

        studentsList.appendChild(row);
      });

      studentsContainer.appendChild(studentsList);
    }

    // Assemble content
    this.leaderboardContainer.appendChild(title);
    this.leaderboardContainer.appendChild(statsContainer);
    this.leaderboardContainer.appendChild(studentsContainer);

    // Add refresh button at bottom
    const refreshButton = this.createElement('button', `
      margin-top: 0.5rem;
      padding: 0.4rem 0.8rem;
      background: rgba(139, 113, 85, 0.2);
      border: 1px solid ${S.borderLight};
      border-radius: 6px;
      color: ${S.accent};
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 500;
      transition: all 0.2s ease;
    `, '🔄 Refresh');

    refreshButton.addEventListener('mouseenter', () => {
      refreshButton.style.background = 'rgba(139, 113, 85, 0.35)';
    });

    refreshButton.addEventListener('mouseleave', () => {
      refreshButton.style.background = 'rgba(139, 113, 85, 0.2)';
    });

    refreshButton.addEventListener('click', () => {
      this.refreshContent();
    });

    this.leaderboardContainer.appendChild(refreshButton);
  }

  /**
   * Toggle sidebar collapsed state
   */
  toggle() {
    if (this.isCollapsed) {
      this.expand();
    } else {
      this.collapse();
    }
  }

  /**
   * Collapse the sidebar
   */
  collapse() {
    if (this.isCollapsed) return;

    this.isCollapsed = true;
    this.sidebar.style.width = this.collapsedWidth;
    this.contentWrapper.style.opacity = '0';
    this.toggleButton.innerHTML = '◀';
    
    // Center the button in the collapsed strip
    this.toggleButton.style.position = 'absolute';
    this.toggleButton.style.top = '15px';
    this.toggleButton.style.left = '50%';
    this.toggleButton.style.transform = 'translateX(-50%)';
    this.toggleButton.style.width = '32px';
    this.toggleButton.style.height = '32px';
    this.toggleButton.style.borderRadius = '8px';
    this.toggleButton.style.margin = '0';
    this.toggleButton.style.zIndex = '100';
    
    this.updateBodyMargin();
  }

  /**
   * Expand the sidebar
   */
  expand() {
    if (!this.isCollapsed) return;

    this.isCollapsed = false;
    this.sidebar.style.width = this.expandedWidth;
    this.contentWrapper.style.opacity = '1';
    this.toggleButton.innerHTML = '<span style="margin-right: 4px;">▶</span>Leaderboard';
    
    // Restore normal positioning
    this.toggleButton.style.position = 'static';
    this.toggleButton.style.transform = 'none';
    this.toggleButton.style.width = '110px';
    this.toggleButton.style.height = '28px';
    this.toggleButton.style.borderRadius = '6px';
    this.toggleButton.style.margin = '0.5rem 1rem 0.75rem auto';
    this.toggleButton.style.zIndex = 'auto';
    
    this.updateBodyMargin();
  }

  /**
   * Update body margin based on sidebar state
   */
  updateBodyMargin() {
    const marginValue = this.isCollapsed ? '50px' : '400px';
    document.body.style.marginRight = marginValue;
  }

  /**
   * Refresh leaderboard data
   */
  refresh() {
    this.refreshContent();
  }

  /**
   * Check if sidebar is collapsed
   */
  isCollapsedState() {
    return this.isCollapsed;
  }

  /**
   * Destroy the sidebar
   */
  destroy() {
    if (this.sidebar && this.sidebar.parentNode) {
      this.sidebar.parentNode.removeChild(this.sidebar);
    }

    // Remove right margin from body
    document.body.style.marginRight = '';

    // Clean up style elements
    const scrollbarStyles = document.querySelector('#leaderboard-scrollbar-styles');
    if (scrollbarStyles) {
      scrollbarStyles.remove();
    }

    this.sidebar = null;
    this.contentWrapper = null;
    this.toggleButton = null;
    this.leaderboardContainer = null;
    this.isInitialized = false;
  }
}

/**
 * Initialize and create the leaderboard sidebar
 */
export function initLeaderboardSidebar(gameGrid = null) {
  const sidebar = new LeaderboardSidebar(gameGrid);
  sidebar.initialize();
  return sidebar;
}
