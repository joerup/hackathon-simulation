/**
 * StudentSidebar component - Displays list of all students with their stats
 */
export class StudentSidebar {
  constructor(gameGrid = null) {
    this.gameGrid = gameGrid;
    this.sidebar = null;
    this.studentsContainer = null;
    this.isInitialized = false;
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
      width: 300px;
      height: calc(100vh - 60px);
      background: rgba(8, 10, 24, 0.95);
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      z-index: 50;
      overflow-y: auto;
      padding: 1.5rem;
      box-shadow: 2px 0 20px rgba(0, 0, 0, 0.3);
    `;

    // Students container
    this.studentsContainer = document.createElement('div');
    this.studentsContainer.className = 'students-list';
    this.studentsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 1rem;
    `;

    // Assemble sidebar
    this.sidebar.appendChild(this.studentsContainer);

    // Add to page
    document.body.appendChild(this.sidebar);

    // Add left margin to body to account for sidebar
    document.body.style.marginLeft = '300px';

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
      background: rgba(12, 16, 40, 0.6);
      border: 1px solid rgba(96, 112, 238, 0.2);
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
    studentId.textContent = `Student ${agent.id}`;
    studentId.style.cssText = `
      font-weight: 600;
      color: #ffffff;
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
        color: #d3d6ff;
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
          background: rgba(112, 136, 255, 0.2);
          color: #b5bbfa;
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
      card.style.background = 'rgba(12, 16, 40, 0.8)';
      card.style.borderColor = 'rgba(96, 112, 238, 0.4)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.background = 'rgba(12, 16, 40, 0.6)';
      card.style.borderColor = 'rgba(96, 112, 238, 0.2)';
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
      color: #8fa0ff;
      font-size: 0.8rem;
      font-weight: 500;
    `;

    const valueElement = document.createElement('span');
    valueElement.textContent = value;
    valueElement.style.cssText = `
      color: #e4e8ff;
      font-size: 0.8rem;
      font-weight: 600;
    `;

    statItem.appendChild(labelElement);
    statItem.appendChild(valueElement);

    return statItem;
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
        color: #8fa0ff;
        font-style: italic;
        text-align: center;
        padding: 2rem 1rem;
        border: 1px dashed rgba(96, 112, 238, 0.3);
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