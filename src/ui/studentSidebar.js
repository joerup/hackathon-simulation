/**
 * StudentSidebar component - Displays list of all students with their stats
 */
export class StudentSidebar {
  constructor(gameGrid = null) {
    this.gameGrid = gameGrid;
    this.sidebar = null;
    this.studentsContainer = null;
    this.toggleButton = null;
    this.isInitialized = false;
    this.isCollapsed = false;
    this.expandedWidth = '300px';
    this.collapsedWidth = '50px';
  }

  /**
   * Initialize the sidebar
   */
  initialize() {
    if (this.isInitialized) return;

    this.sidebar = document.createElement('div');
    this.sidebar.className = 'student-sidebar';
    this.sidebar.style.cssText = `
      position: fixed;
      top: 60px;
      left: 0;
      width: ${this.expandedWidth};
      height: calc(100vh - 60px);
      background: rgba(253, 250, 245, 0.95);
      border-right: 2px solid rgba(139, 113, 85, 0.4);
      backdrop-filter: blur(20px);
      z-index: 50;
      overflow: visible;
      transition: width 0.3s ease, padding 0.3s ease;
      display: flex;
      flex-direction: column;
    `;

    // Toggle button - positioned to look inline when expanded, centered when collapsed
    this.toggleButton = document.createElement('button');
    this.toggleButton.className = 'sidebar-toggle';
    this.toggleButton.innerHTML = '<span style="margin-right: 4px;">◀</span>Students'; // Arrow + text
    this.toggleButton.style.cssText = `
      width: 85px;
      height: 28px;
      border: none;
      border-radius: 6px;
      background: rgba(139, 113, 85, 0.2);
      color: #8b7155;
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
      // Preserve existing transform and add scale
      const currentTransform = this.toggleButton.style.transform;
      if (currentTransform.includes('translateX')) {
        this.toggleButton.style.transform = 'translateX(-50%) scale(1.1)';
      } else {
        this.toggleButton.style.transform = 'scale(1.1)';
      }
    });

    this.toggleButton.addEventListener('mouseleave', () => {
      this.toggleButton.style.background = 'rgba(139, 113, 85, 0.2)';
      this.toggleButton.style.color = '#8b7155';
      // Preserve existing transform and remove scale
      const currentTransform = this.toggleButton.style.transform;
      if (currentTransform.includes('translateX')) {
        this.toggleButton.style.transform = 'translateX(-50%)';
      } else {
        this.toggleButton.style.transform = 'none';
      }
    });

    this.toggleButton.addEventListener('click', () => {
      this.toggle();
    });

    // Content wrapper for padding control
    this.contentWrapper = document.createElement('div');
    this.contentWrapper.className = 'sidebar-content';
    this.contentWrapper.style.cssText = `
      padding: 0.5rem 1.5rem 1.5rem;
      flex: 1;
      overflow-y: auto;
      overflow-x: visible;
      transition: opacity 0.2s ease;
    `;

    // Students container
    this.studentsContainer = document.createElement('div');
    this.studentsContainer.className = 'students-list';
    this.studentsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 1rem;
    `;

    // Assemble sidebar - button stays outside content wrapper but positioned inline when expanded
    this.sidebar.appendChild(this.toggleButton);
    this.contentWrapper.appendChild(this.studentsContainer);
    this.sidebar.appendChild(this.contentWrapper);

    // Add to page
    document.body.appendChild(this.sidebar);

    // Add left margin to body to account for sidebar
    this.updateBodyMargin();

    this.isInitialized = true;
    this.updateStudentsList();

    return this.sidebar;
  }

  /**
   * Create a student card element
   */
  createStudentCard(agent) {
    const card = document.createElement('div');
    card.className = 'student-card';
    card.style.cssText = `
      background: rgba(250, 247, 240, 0.6);
      border: 1px solid rgba(139, 113, 85, 0.2);
      border-radius: 12px;
      padding: 1rem;
      transition: all 0.2s ease;
    `;

    // Student header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    `;

    const studentId = document.createElement('span');
    const displayName = this.getAgentDisplayName(agent);
    studentId.textContent = displayName;
    studentId.style.cssText = `
      font-weight: 600;
      color: #3d2f1f;
      font-size: 0.95rem;
    `;

    const statusIndicator = document.createElement('span');
    statusIndicator.textContent = agent.inConversation ? '💬' : '🎯';
    statusIndicator.style.cssText = `
      font-size: 1.1rem;
    `;

    header.appendChild(studentId);
    header.appendChild(statusIndicator);

    // Stats container
    const statsContainer = document.createElement('div');
    statsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    `;

    // Create stat items
    const stats = agent.stats || {};

    const statItems = [
      { label: 'Major', value: stats.major || 'Computer Science' },
      { label: 'GPA', value: stats.gpa || '3.0' },
      { label: 'Experience', value: `${stats.experience || 0} years` },
      { label: 'Internships', value: stats.internships || 0 },
      { label: 'Energy', value: stats.energyScore || 50 },
      { label: 'Networking', value: stats.networking || 0 },
      { label: 'Luck', value: stats.luck || 50 }
    ];

    statItems.forEach(stat => {
      const statElement = this.createStatItem(stat.label, stat.value);
      statsContainer.appendChild(statElement);
    });

    // Skills section
    if (stats.skills && stats.skills.length > 0) {
      const skillsHeader = document.createElement('div');
      skillsHeader.textContent = 'Skills';
      skillsHeader.style.cssText = `
        font-weight: 500;
        color: #5a4a3a;
        font-size: 0.8rem;
        margin-top: 0.5rem;
        margin-bottom: 0.25rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      `;

      const skillsList = document.createElement('div');
      skillsList.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
      `;

      stats.skills.forEach(skill => {
        const skillTag = document.createElement('span');
        skillTag.textContent = skill;
        skillTag.style.cssText = `
          background: rgba(184, 158, 130, 0.2);
          color: #8b6f47;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 500;
        `;
        skillsList.appendChild(skillTag);
      });

      statsContainer.appendChild(skillsHeader);
      statsContainer.appendChild(skillsList);
    }

    // Assemble card
    card.appendChild(header);
    card.appendChild(statsContainer);

    // Add hover effect
    card.addEventListener('mouseenter', () => {
      card.style.background = 'rgba(250, 247, 240, 0.8)';
      card.style.borderColor = 'rgba(139, 113, 85, 0.4)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.background = 'rgba(250, 247, 240, 0.6)';
      card.style.borderColor = 'rgba(139, 113, 85, 0.2)';
    });

    return card;
  }

  /**
   * Create a stat item element
   */
  createStatItem(label, value) {
    const statItem = document.createElement('div');
    statItem.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const labelElement = document.createElement('span');
    labelElement.textContent = label;
    labelElement.style.cssText = `
      color: #8b6f47;
      font-size: 0.8rem;
      font-weight: 500;
    `;

    const valueElement = document.createElement('span');
    valueElement.textContent = value;
    valueElement.style.cssText = `
      color: #5a4a3a;
      font-size: 0.8rem;
      font-weight: 600;
    `;

    statItem.appendChild(labelElement);
    statItem.appendChild(valueElement);

    return statItem;
  }


  /**
   * Get a friendly display name for an agent
   */
  getAgentDisplayName(agent) {
    if (!agent) return 'Unknown Agent';
    const rawName = [agent.displayName, agent.stats?.name]
      .map(value => (typeof value === 'string' ? value.trim() : ''))
      .find(value => value.length);
    if (rawName) {
      return rawName;
    }
    return agent.isStudent ? `Student ${agent.id}` : `Recruiter ${agent.id}`;
  }

  /**
   * Update the students list
   */
  updateStudentsList() {
    if (!this.studentsContainer || !this.gameGrid) return;

    // Clear existing content
    this.studentsContainer.innerHTML = '';

    // Get all students from the game state agents array
    const gameState = this.gameGrid.gameState;
    const students = gameState.agents.filter(agent => agent.isStudent);

    if (students.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.textContent = 'No students in the arena yet';
      emptyMessage.style.cssText = `
        color: #8b6f47;
        font-style: italic;
        text-align: center;
        padding: 2rem 1rem;
        border: 1px dashed rgba(139, 113, 85, 0.3);
        border-radius: 8px;
      `;
      this.studentsContainer.appendChild(emptyMessage);
      return;
    }

    // Sort students by ID for consistent ordering
    students.sort((a, b) => a.id - b.id);

    // Create cards for each student
    students.forEach(student => {
      const card = this.createStudentCard(student);
      this.studentsContainer.appendChild(card);
    });
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
    this.toggleButton.innerHTML = '▶'; // Right arrow for expand - no text when collapsed
    
    // Center the button in the collapsed strip with high z-index to ensure clickability
    this.toggleButton.style.position = 'absolute';
    this.toggleButton.style.top = '15px';
    this.toggleButton.style.left = '50%';
    this.toggleButton.style.right = 'auto';
    this.toggleButton.style.transform = 'translateX(-50%)';
    this.toggleButton.style.width = '32px';
    this.toggleButton.style.minWidth = '32px';
    this.toggleButton.style.height = '32px';
    this.toggleButton.style.borderRadius = '8px';
    this.toggleButton.style.margin = '0';
    this.toggleButton.style.padding = '0';
    this.toggleButton.style.zIndex = '100';
    this.toggleButton.style.pointerEvents = 'auto';
    
    // Update body margin
    this.updateBodyMargin();

    // Notify game grid of sidebar state change
    if (this.gameGrid && this.gameGrid.handleSidebarToggle) {
      this.gameGrid.handleSidebarToggle();
    }
  }

  /**
   * Expand the sidebar
   */
  expand() {
    if (!this.isCollapsed) return;

    this.isCollapsed = false;
    this.sidebar.style.width = this.expandedWidth;
    this.contentWrapper.style.opacity = '1';
    this.toggleButton.innerHTML = '<span style="margin-right: 4px;">◀</span>Students'; // Left arrow for collapse
    
    // Restore inline-like positioning (but still positioned for visibility)
    this.toggleButton.style.position = 'static';
    this.toggleButton.style.top = 'auto';
    this.toggleButton.style.left = 'auto';
    this.toggleButton.style.right = 'auto';
    this.toggleButton.style.transform = 'none';
    this.toggleButton.style.width = '85px';
    this.toggleButton.style.minWidth = '85px';
    this.toggleButton.style.height = '28px';
    this.toggleButton.style.borderRadius = '6px';
    this.toggleButton.style.margin = '0.5rem 1rem 0.75rem auto';
    this.toggleButton.style.padding = '0 6px';
    this.toggleButton.style.justifyContent = 'center';
    this.toggleButton.style.flexShrink = '0';
    this.toggleButton.style.zIndex = 'auto';
    this.toggleButton.style.pointerEvents = 'auto';
    
    // Update body margin
    this.updateBodyMargin();

    // Notify game grid of sidebar state change
    if (this.gameGrid && this.gameGrid.handleSidebarToggle) {
      this.gameGrid.handleSidebarToggle();
    }
  }

  /**
   * Update body margin based on sidebar state
   */
  updateBodyMargin() {
    const marginValue = this.isCollapsed ? '50px' : '300px';
    document.body.style.marginLeft = marginValue;
  }

  /**
   * Check if sidebar is collapsed
   */
  isCollapsedState() {
    return this.isCollapsed;
  }

  /**
   * Refresh the sidebar (called when students change)
   */
  refresh() {
    this.updateStudentsList();
  }

  /**
   * Destroy the sidebar
   */
  destroy() {
    if (this.sidebar && this.sidebar.parentNode) {
      this.sidebar.parentNode.removeChild(this.sidebar);
    }

    // Remove left margin from body
    document.body.style.marginLeft = '';

    this.sidebar = null;
    this.studentsContainer = null;
    this.toggleButton = null;
    this.contentWrapper = null;
    this.isInitialized = false;
  }
}

/**
 * Initialize and create the student sidebar
 */
export function initStudentSidebar(gameGrid = null) {
  const sidebar = new StudentSidebar(gameGrid);
  sidebar.initialize();
  return sidebar;
}