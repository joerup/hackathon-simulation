const S = {
  primary: '#3d2f1f', primaryDark: '#2d1f0f', secondary: '#5a4a3a', accent: '#8b6f47',
  bg: 'rgba(253, 250, 245, 0.95)', cardBg: 'rgba(250, 247, 240, 0.5)', tableBg: 'rgba(250, 247, 240, 0.3)',
  highlight: 'rgba(212, 165, 116, 0.1)', highlightHover: 'rgba(212, 165, 116, 0.2)',
  border: 'rgba(139, 113, 85, 0.3)', borderLight: 'rgba(139, 113, 85, 0.1)', borderDark: 'rgba(139, 113, 85, 0.2)',
  overlay: 'rgba(139, 113, 85, 0.7)'
};

export class LeaderboardModal {
  constructor(gameGrid = null) {
    this.isOpen = false;
    this.gameGrid = gameGrid;
    this.wasSimulationRunning = false;
  }

  createElement(tag, css = '', text = '') {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (css) el.style.cssText = css;
    return el;
  }

  create() {
    // Overlay
    this.overlay = this.createElement('div', `position:fixed;top:0;left:0;width:100%;height:100%;background:${S.overlay};display:none;justify-content:center;align-items:center;z-index:1000;backdrop-filter:blur(4px)`);
    
    // Modal
    this.modal = this.createElement('div', `background:${S.bg};border:2px solid ${S.border};border-radius:16px;padding:2rem;min-width:600px;max-width:800px;width:90%;max-height:80vh;overflow-y:auto;color:${S.secondary};position:relative;backdrop-filter:blur(20px)`);
    
    // Close button
    const close = this.createElement('button', `position:absolute;top:1rem;right:1rem;background:none;border:none;color:${S.accent};font-size:24px;cursor:pointer;padding:0;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:background-color 0.2s ease`, '×');
    close.addEventListener('mouseenter', () => close.style.backgroundColor = 'rgba(255, 255, 255, 0.1)');
    close.addEventListener('mouseleave', () => close.style.backgroundColor = 'transparent');
    close.addEventListener('click', () => this.close());

    // Content
    this.content = this.createElement('div', `display:flex;flex-direction:column;padding-top:1rem`);
    
    // Title
    const title = this.createElement('h2', `margin:0 0 1.5rem 0;font-size:1.8rem;font-weight:600;color:${S.primary};text-align:center`, '🏆 Student Leaderboard');
    
    // Get students data
    const students = this.getStudents();
    
    // Stats section
    const statsContainer = this.createElement('div', `background:${S.highlight};border-radius:12px;padding:1rem;margin-bottom:1.5rem;display:flex;gap:1rem;justify-content:space-between`);
    const totals = {
      'Total Students': students.length,
      'Total Conversations': students.reduce((s, st) => s + (st.recruitersSpokenTo || 0), 0),
      'Total Distance': students.reduce((s, st) => s + (st.distanceTraveled || 0), 0),
      'Total Job Offers': students.reduce((s, st) => s + (st.jobOffers || 0), 0)
    };
    
    Object.entries(totals).forEach(([label, value]) => {
      const card = this.createElement('div', `background:${S.cardBg};padding:1rem;border-radius:8px;border:1px solid ${S.borderDark};flex:1;text-align:center;min-width:0`);
      card.innerHTML = `<div style="font-size:1.5rem;font-weight:bold;color:${S.primary};margin-bottom:0.5rem">${value}</div><div style="font-size:0.85rem;color:${S.accent};font-weight:500">${label}</div>`;
      statsContainer.appendChild(card);
    });

    // Table section
    const tableContainer = this.createElement('div', `background:${S.tableBg};border-radius:12px;overflow:hidden;border:1px solid ${S.borderDark}`);
    const table = this.createElement('table', `width:100%;border-collapse:collapse`);
    
    // Header
    const thead = this.createElement('thead', `background:${S.highlightHover}`);
    const headerRow = document.createElement('tr');
    ['Rank', 'Name', 'Job Offers', 'Recruiters Talked To', 'Distance Traveled'].forEach((text, i) => {
      const th = this.createElement('th', `padding:0.75rem;border-bottom:2px solid ${S.border};text-align:${i === 0 ? 'left' : 'center'};font-weight:600;color:${S.primary};font-size:0.9rem${i === 2 ? ';background:' + S.highlight : ''}`, text);
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    
    // Body
    const tbody = document.createElement('tbody');
    if (students.length === 0) {
      const row = document.createElement('tr');
      const cell = this.createElement('td', `padding:2rem;border-bottom:1px solid ${S.borderLight};text-align:center;font-style:italic;color:${S.accent}`, 'No students found. Add some students to see the leaderboard!');
      cell.colSpan = 5;
      row.appendChild(cell);
      tbody.appendChild(row);
    } else {
      students.forEach((student, i) => {
        const row = this.createElement('tr', `transition:background-color 0.2s ease`);
        row.addEventListener('mouseenter', () => row.style.backgroundColor = S.highlight);
        row.addEventListener('mouseleave', () => row.style.backgroundColor = 'transparent');
        
        const rank = i + 1;
        const rankText = rank === 1 ? '🥇 1' : rank === 2 ? '🥈 2' : rank === 3 ? '🥉 3' : rank.toString();
        
        [
          [rankText, `padding:0.75rem;border-bottom:1px solid ${S.borderLight};font-weight:700;color:${S.primaryDark};width:60px`],
          [student.name || `Student ${student.id}`, `padding:0.75rem;border-bottom:1px solid ${S.borderLight};font-weight:700;color:${S.primary}`],
          [student.jobOffers || 0, `padding:0.75rem;border-bottom:1px solid ${S.borderLight};text-align:center;font-weight:700;color:${S.secondary}`],
          [student.recruitersSpokenTo || 0, `padding:0.75rem;border-bottom:1px solid ${S.borderLight};text-align:center;font-weight:500;color:${S.primary}`],
          [student.distanceTraveled || 0, `padding:0.75rem;border-bottom:1px solid ${S.borderLight};text-align:center;font-weight:500;color:${S.primary}`]
        ].forEach(([text, css]) => {
          const td = this.createElement('td', css, text);
          row.appendChild(td);
        });
        
        tbody.appendChild(row);
      });
    }
    
    table.append(thead, tbody);
    tableContainer.appendChild(table);

    // Assemble
    this.content.append(title, statsContainer, tableContainer);
    this.modal.append(close, this.content);
    this.overlay.appendChild(this.modal);

    // Events
    this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay) this.close(); });
    this.escapeHandler = (e) => { if (e.key === 'Escape' && this.isOpen) this.close(); };
    document.addEventListener('keydown', this.escapeHandler);

    document.body.appendChild(this.overlay);
    return this.overlay;
  }

  getStudents() {
    if (!this.gameGrid) return [];
    const gameState = this.gameGrid.getGameState();
    return gameState.agents.filter(agent => agent.isStudent).sort((a, b) => {
      const aJobs = a.jobOffers || 0, bJobs = b.jobOffers || 0;
      if (aJobs !== bJobs) return bJobs - aJobs;
      const aRec = a.recruitersSpokenTo || 0, bRec = b.recruitersSpokenTo || 0;
      if (aRec !== bRec) return bRec - aRec;
      return (b.distanceTraveled || 0) - (a.distanceTraveled || 0);
    });
  }

  refresh() {
    if (!this.content) return;
    this.content.innerHTML = '';
    
    const title = this.createElement('h2', `margin:0 0 1.5rem 0;font-size:1.8rem;font-weight:600;color:${S.primary};text-align:center`, '🏆 Student Leaderboard');
    const students = this.getStudents();
    
    const statsContainer = this.createElement('div', `background:${S.highlight};border-radius:12px;padding:1rem;margin-bottom:1.5rem;display:flex;gap:1rem;justify-content:space-between`);
    const totals = {
      'Total Students': students.length,
      'Total Conversations': students.reduce((s, st) => s + (st.recruitersSpokenTo || 0), 0),
      'Total Distance': students.reduce((s, st) => s + (st.distanceTraveled || 0), 0),
      'Total Job Offers': students.reduce((s, st) => s + (st.jobOffers || 0), 0)
    };
    
    Object.entries(totals).forEach(([label, value]) => {
      const card = this.createElement('div', `background:${S.cardBg};padding:1rem;border-radius:8px;border:1px solid ${S.borderDark};flex:1;text-align:center;min-width:0`);
      card.innerHTML = `<div style="font-size:1.5rem;font-weight:bold;color:${S.primary};margin-bottom:0.5rem">${value}</div><div style="font-size:0.85rem;color:${S.accent};font-weight:500">${label}</div>`;
      statsContainer.appendChild(card);
    });

    const tableContainer = this.createElement('div', `background:${S.tableBg};border-radius:12px;overflow:hidden;border:1px solid ${S.borderDark}`);
    const table = this.createElement('table', `width:100%;border-collapse:collapse`);
    
    const thead = this.createElement('thead', `background:${S.highlightHover}`);
    const headerRow = document.createElement('tr');
    ['Rank', 'Name', 'Job Offers', 'Recruiters Talked To', 'Distance Traveled'].forEach((text, i) => {
      const th = this.createElement('th', `padding:0.75rem;border-bottom:2px solid ${S.border};text-align:${i === 0 ? 'left' : 'center'};font-weight:600;color:${S.primary};font-size:0.9rem${i === 2 ? ';background:' + S.highlight : ''}`, text);
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    
    const tbody = document.createElement('tbody');
    if (students.length === 0) {
      const row = document.createElement('tr');
      const cell = this.createElement('td', `padding:2rem;border-bottom:1px solid ${S.borderLight};text-align:center;font-style:italic;color:${S.accent}`, 'No students found. Add some students to see the leaderboard!');
      cell.colSpan = 5;
      row.appendChild(cell);
      tbody.appendChild(row);
    } else {
      students.forEach((student, i) => {
        const row = this.createElement('tr', `transition:background-color 0.2s ease`);
        row.addEventListener('mouseenter', () => row.style.backgroundColor = S.highlight);
        row.addEventListener('mouseleave', () => row.style.backgroundColor = 'transparent');
        
        const rank = i + 1;
        const rankText = rank === 1 ? '🥇 1' : rank === 2 ? '🥈 2' : rank === 3 ? '🥉 3' : rank.toString();
        
        [
          [rankText, `padding:0.75rem;border-bottom:1px solid ${S.borderLight};font-weight:700;color:${S.primaryDark};width:60px`],
          [student.name || `Student ${student.id}`, `padding:0.75rem;border-bottom:1px solid ${S.borderLight};font-weight:700;color:${S.primary}`],
          [student.jobOffers || 0, `padding:0.75rem;border-bottom:1px solid ${S.borderLight};text-align:center;font-weight:700;color:${S.secondary}`],
          [student.recruitersSpokenTo || 0, `padding:0.75rem;border-bottom:1px solid ${S.borderLight};text-align:center;font-weight:500;color:${S.primary}`],
          [student.distanceTraveled || 0, `padding:0.75rem;border-bottom:1px solid ${S.borderLight};text-align:center;font-weight:500;color:${S.primary}`]
        ].forEach(([text, css]) => {
          const td = this.createElement('td', css, text);
          row.appendChild(td);
        });
        
        tbody.appendChild(row);
      });
    }
    
    table.append(thead, tbody);
    tableContainer.appendChild(table);
    this.content.append(title, statsContainer, tableContainer);
  }

  open() {
    if (!this.overlay) this.create();
    else this.refresh();
    
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

export function showLeaderboard(gameGrid = null) {
  const modal = new LeaderboardModal(gameGrid);
  modal.open();
  return modal;
}