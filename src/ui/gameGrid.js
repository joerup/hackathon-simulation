export class GameGrid {
  constructor(size = 10) {
    this.size = size;
    this.grid = this.initializeGrid();
    this.agents = [];
    this.obstacles = this.generateSampleObstacles();
    this.container = null;
    this.animationId = null;
    this.isRunning = false;
  }

  initializeGrid() {
    return Array(this.size).fill().map(() => Array(this.size).fill('empty'));
  }

  generateSampleObstacles() {
    const obstacles = [
      { x: 2, y: 3 },
      { x: 4, y: 1 },
      { x: 7, y: 6 },
      { x: 1, y: 8 },
      { x: 8, y: 2 },
      { x: 5, y: 7 },
      { x: 3, y: 5 },
      { x: 9, y: 4 },
      { x: 6, y: 9 },
      { x: 0, y: 5 }
    ];

    obstacles.forEach(obstacle => {
      if (this.isValidPosition(obstacle.x, obstacle.y)) {
        this.grid[obstacle.y][obstacle.x] = 'obstacle';
      }
    });

    return obstacles;
  }

  addAgent(x, y, id = null, isStudent = true) {
    if (this.isValidPosition(x, y) && this.grid[y][x] === 'empty') {
      const agent = {
        id: id || this.agents.length,
        isStudent: isStudent,
        stats: this.generateAgentStats(isStudent),
        position: [x, y],
        inConversation: false,
        get x() { return this.position[0]; },
        get y() { return this.position[1]; },
        set x(value) { this.position[0] = value; },
        set y(value) { this.position[1] = value; }
      };
      this.agents.push(agent);
      this.grid[y][x] = 'agent';
      return agent;
    }
    return null;
  }

  generateAgentStats(isStudent) {
    if (isStudent) {
      return {
        gpa: Math.random() * 2 + 2, // 2.0 - 4.0
        skills: ['JavaScript', 'Python', 'React', 'Node.js'].slice(0, Math.floor(Math.random() * 4) + 1),
        experience: Math.floor(Math.random() * 5), // 0-4 years
        major: ['Computer Science', 'Software Engineering', 'Data Science'][Math.floor(Math.random() * 3)]
      };
    } else {
      return {
        company: ['Tech Corp', 'StartupXYZ', 'Big Tech Inc', 'Innovation Labs'][Math.floor(Math.random() * 4)],
        position: ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer'][Math.floor(Math.random() * 4)],
        requirements: ['JavaScript', 'Python', 'React', 'Node.js'].slice(0, Math.floor(Math.random() * 3) + 1),
        experienceRequired: Math.floor(Math.random() * 5) + 1 // 1-5 years
      };
    }
  }

  isValidPosition(x, y) {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  moveAgent(agent) {
    if (agent.inConversation) return false;

    const currentX = agent.x;
    const currentY = agent.y;

    // Get all possible moves (up, down, left, right)
    const possibleMoves = [
      { x: currentX, y: currentY - 1 }, // up
      { x: currentX, y: currentY + 1 }, // down
      { x: currentX - 1, y: currentY }, // left
      { x: currentX + 1, y: currentY }  // right
    ];

    // Filter valid moves (within bounds and not occupied)
    const validMoves = possibleMoves.filter(move =>
      this.isValidPosition(move.x, move.y) &&
      this.grid[move.y][move.x] === 'empty'
    );

    if (validMoves.length === 0) return false;

    // Choose random valid move
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];

    // Update grid
    this.grid[currentY][currentX] = 'empty';
    this.grid[randomMove.y][randomMove.x] = 'agent';

    // Update agent position
    agent.position = [randomMove.x, randomMove.y];

    return true;
  }

  moveAllAgents() {
    // First check for new conversations
    this.checkForConversations();

    // Handle existing conversations (10% chance to end)
    this.handleConversations();

    // Create a copy of agents array to avoid issues with concurrent modifications
    const agentsToMove = [...this.agents];

    agentsToMove.forEach(agent => {
      this.moveAgent(agent);
    });
  }

  checkForConversations() {
    for (let i = 0; i < this.agents.length; i++) {
      const agent1 = this.agents[i];

      // Skip if already in conversation
      if (agent1.inConversation) continue;

      for (let j = i + 1; j < this.agents.length; j++) {
        const agent2 = this.agents[j];

        // Skip if already in conversation
        if (agent2.inConversation) continue;

        // Check if agents are adjacent
        if (this.areAdjacent(agent1, agent2)) {
          // Start conversation
          agent1.inConversation = true;
          agent2.inConversation = true;
          agent1.conversationPartner = agent2.id;
          agent2.conversationPartner = agent1.id;
        }
      }
    }
  }

  areAdjacent(agent1, agent2) {
    const dx = Math.abs(agent1.x - agent2.x);
    const dy = Math.abs(agent1.y - agent2.y);

    // Adjacent means exactly one cell away horizontally or vertically
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }

  handleConversations() {
    const conversationPairs = new Set();

    this.agents.forEach(agent => {
      if (agent.inConversation && !conversationPairs.has(agent.id)) {
        const partner = this.agents.find(a => a.id === agent.conversationPartner);

        if (partner) {
          // 10% chance to end conversation
          if (Math.random() < 0.1) {
            agent.inConversation = false;
            partner.inConversation = false;
            delete agent.conversationPartner;
            delete partner.conversationPartner;
          }

          // Mark both as processed
          conversationPairs.add(agent.id);
          conversationPairs.add(partner.id);
        }
      }
    });
  }

  startSimulation() {
    if (this.isRunning) return;

    this.isRunning = true;

    const animate = () => {
      if (!this.isRunning) return;

      this.moveAllAgents();
      this.updateDisplay();

      // Move every 500ms
      setTimeout(() => {
        this.animationId = requestAnimationFrame(animate);
      }, 2000);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  stopSimulation() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  updateDisplay() {
    if (!this.container) return;

    const gridElement = this.container.querySelector('.game-grid');
    const cells = gridElement.querySelectorAll('.grid-cell');

    cells.forEach(cell => {
      const x = parseInt(cell.getAttribute('data-x'));
      const y = parseInt(cell.getAttribute('data-y'));
      const cellType = this.grid[y][x];

      // Reset cell
      cell.style.backgroundColor = '';
      cell.textContent = '';
      cell.style.color = '';

      if (cellType === 'obstacle') {
        cell.style.backgroundColor = 'rgba(255, 100, 100, 0.8)';
        cell.textContent = '█';
        cell.style.color = '#fff';
      } else if (cellType === 'agent') {
        const agent = this.agents.find(a => a.x === x && a.y === y);

        if (agent.inConversation) {
          // Visual indicator for agents in conversation
          cell.style.backgroundColor = agent.isStudent ? 'rgba(255, 255, 100, 0.9)' : 'rgba(255, 150, 255, 0.9)';
          cell.style.border = '3px solid rgba(255, 255, 255, 0.8)';
          cell.style.boxShadow = '0 0 10px rgba(255, 255, 100, 0.5)';
          cell.textContent = agent.isStudent ? `💬S${agent.id}` : `💬R${agent.id}`;
        } else {
          cell.style.backgroundColor = agent.isStudent ? 'rgba(100, 255, 100, 0.8)' : 'rgba(100, 150, 255, 0.8)';
          cell.style.border = '1px solid rgba(255, 255, 255, 0.1)';
          cell.style.boxShadow = '';
          cell.textContent = agent.isStudent ? `S${agent.id}` : `R${agent.id}`;
        }
        cell.style.color = '#000';
      } else {
        cell.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
      }
    });
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'game-grid-container';

    const title = document.createElement('h2');
    title.textContent = 'Game Arena';
    title.className = 'grid-title';
    this.container.appendChild(title);

    const gridElement = document.createElement('div');
    gridElement.className = 'game-grid';
    gridElement.style.display = 'grid';
    gridElement.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
    gridElement.style.gap = '2px';
    gridElement.style.background = 'rgba(15, 20, 45, 0.8)';
    gridElement.style.padding = '10px';
    gridElement.style.borderRadius = '8px';
    gridElement.style.border = '1px solid rgba(96, 112, 238, 0.3)';

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.style.width = '30px';
        cell.style.height = '30px';
        cell.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        cell.style.display = 'flex';
        cell.style.alignItems = 'center';
        cell.style.justifyContent = 'center';
        cell.style.fontSize = '14px';
        cell.style.fontWeight = 'bold';
        cell.style.position = 'relative';

        const cellType = this.grid[y][x];

        if (cellType === 'obstacle') {
          cell.style.backgroundColor = 'rgba(255, 100, 100, 0.8)';
          cell.textContent = '█';
          cell.style.color = '#fff';
        } else if (cellType === 'agent') {
          cell.style.backgroundColor = 'rgba(100, 255, 100, 0.8)';
          const agent = this.agents.find(a => a.x === x && a.y === y);
          cell.textContent = agent ? `A${agent.id}` : 'A';
          cell.style.color = '#000';
        } else {
          cell.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        }

        cell.setAttribute('data-x', x);
        cell.setAttribute('data-y', y);
        gridElement.appendChild(cell);
      }
    }

    this.container.appendChild(gridElement);

    const controls = this.createControls();
    this.container.appendChild(controls);

    const legend = this.createLegend();
    this.container.appendChild(legend);

    return this.container;
  }

  createControls() {
    const controls = document.createElement('div');
    controls.className = 'grid-controls';
    controls.style.marginTop = '15px';
    controls.style.display = 'flex';
    controls.style.gap = '10px';
    controls.style.justifyContent = 'center';

    const startButton = document.createElement('button');
    startButton.textContent = 'Start Simulation';
    startButton.style.margin = '0';
    startButton.style.padding = '0.5rem 1rem';
    startButton.style.fontSize = '0.9rem';
    startButton.onclick = () => {
      this.startSimulation();
      startButton.disabled = true;
      stopButton.disabled = false;
    };

    const stopButton = document.createElement('button');
    stopButton.textContent = 'Stop Simulation';
    stopButton.style.margin = '0';
    stopButton.style.padding = '0.5rem 1rem';
    stopButton.style.fontSize = '0.9rem';
    stopButton.disabled = true;
    stopButton.onclick = () => {
      this.stopSimulation();
      startButton.disabled = false;
      stopButton.disabled = true;
    };

    controls.appendChild(startButton);
    controls.appendChild(stopButton);

    return controls;
  }

  createLegend() {
    const legend = document.createElement('div');
    legend.className = 'grid-legend';
    legend.style.marginTop = '15px';
    legend.style.display = 'flex';
    legend.style.gap = '20px';
    legend.style.fontSize = '14px';
    legend.style.color = '#b5bbfa';

    const items = [
      { color: 'rgba(255, 100, 100, 0.8)', text: 'Obstacles' },
      { color: 'rgba(100, 255, 100, 0.8)', text: 'Students' },
      { color: 'rgba(100, 150, 255, 0.8)', text: 'Recruiters' },
      { color: 'rgba(255, 255, 100, 0.9)', text: '💬 In Conversation', border: '3px solid rgba(255, 255, 255, 0.8)' },
      { color: 'rgba(255, 255, 255, 0.05)', text: 'Empty' }
    ];

    items.forEach(item => {
      const legendItem = document.createElement('div');
      legendItem.style.display = 'flex';
      legendItem.style.alignItems = 'center';
      legendItem.style.gap = '8px';

      const colorBox = document.createElement('div');
      colorBox.style.width = '16px';
      colorBox.style.height = '16px';
      colorBox.style.backgroundColor = item.color;
      colorBox.style.border = item.border || '1px solid rgba(255, 255, 255, 0.2)';
      colorBox.style.borderRadius = '2px';
      if (item.border) {
        colorBox.style.boxShadow = '0 0 5px rgba(255, 255, 100, 0.3)';
      }

      const text = document.createElement('span');
      text.textContent = item.text;

      legendItem.appendChild(colorBox);
      legendItem.appendChild(text);
      legend.appendChild(legendItem);
    });

    return legend;
  }
}

export function initGameGrid(size = 10) {
  const gameGrid = new GameGrid(size);

  // Add students
  gameGrid.addAgent(0, 0, 1, true);  // Student
  gameGrid.addAgent(9, 9, 2, true);  // Student
  gameGrid.addAgent(5, 2, 3, true);  // Student
  gameGrid.addAgent(3, 7, 4, true);  // Student

  // Add recruiters
  gameGrid.addAgent(8, 1, 5, false); // Recruiter
  gameGrid.addAgent(1, 6, 6, false); // Recruiter
  gameGrid.addAgent(7, 8, 7, false); // Recruiter

  return gameGrid;
}