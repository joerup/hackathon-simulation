const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');

document.body.style.margin = '0';
document.body.style.fontFamily = 'Inter, Arial, sans-serif';
document.body.style.backgroundColor = 'black';

canvas.style.backgroundColor = 'black';
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.zIndex = '0';
canvas.style.pointerEvents = 'none';

const styleEl = document.createElement('style');
styleEl.textContent = `
:root {
  color-scheme: dark;
}
body {
  color: #e4e8ff;
  overflow-x: hidden;
}
canvas {
  width: 100vw;
  height: 100vh;
}
.ui-overlay {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  padding: 4rem 1.5rem 6rem;
  pointer-events: none;
}
.control-panel {
  pointer-events: auto;
  max-width: 760px;
  width: 100%;
  background: rgba(8, 10, 24, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 2.2rem 2.6rem;
  backdrop-filter: blur(18px);
  box-shadow: 0 40px 120px rgba(0, 0, 0, 0.45);
}
.control-panel h1 {
  margin: 0 0 0.4rem;
  font-size: 2.2rem;
  font-weight: 700;
  color: #ffffff;
}
.control-panel p {
  margin: 0 0 1.4rem;
  line-height: 1.5;
  color: #b5bbfa;
}
.control-panel p.helper {
  margin-top: -0.7rem;
  margin-bottom: 1.6rem;
  font-size: 0.95rem;
  color: #8791f9;
}
label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #d3d6ff;
  letter-spacing: 0.4px;
}
textarea {
  width: 100%;
  min-height: 220px;
  background: rgba(12, 16, 40, 0.88);
  border: 1px solid rgba(91, 115, 255, 0.35);
  border-radius: 12px;
  padding: 1rem;
  font-size: 0.95rem;
  color: #e5e8ff;
  line-height: 1.55;
  resize: vertical;
  box-shadow: inset 0 0 0 1px rgba(39, 53, 160, 0.2);
}
textarea:focus {
  outline: none;
  border-color: rgba(119, 149, 255, 0.8);
  box-shadow: 0 0 0 2px rgba(106, 133, 255, 0.35);
}
button {
  margin-top: 1.4rem;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  background: linear-gradient(140deg, #7088ff, #9d66ff);
  color: #11152c;
  border: none;
  border-radius: 999px;
  padding: 0.75rem 1.8rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
button:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 40px rgba(100, 115, 255, 0.3);
}
.status-message {
  margin: 0.8rem 0 0;
  font-size: 0.9rem;
  color: #9aa0ff;
}
.status-message.warning {
  color: #ff8e8e;
}
.results {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1.1rem;
}
.stat {
  background: rgba(23, 28, 68, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 14px;
  padding: 1rem;
  position: relative;
}
.stat h3 {
  margin: 0 0 0.35rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #8fa0ff;
  letter-spacing: 0.6px;
  text-transform: uppercase;
}
.stat p {
  margin: 0;
  font-size: 1.95rem;
  font-weight: 700;
  color: #ffffff;
}
.stat span {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #7f88d2;
}
.resume-flags h2,
.skill-breakdown h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #dfe4ff;
  letter-spacing: 0.3px;
}
.resume-flags ul,
.skill-breakdown ul {
  margin: 0.8rem 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.resume-flags li,
.skill-breakdown li {
  background: rgba(12, 16, 40, 0.68);
  border: 1px solid rgba(74, 94, 255, 0.26);
  border-radius: 10px;
  padding: 0.7rem 0.9rem;
  color: #e4e8ff;
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
}
.skill-breakdown li span:last-child {
  font-variant-numeric: tabular-nums;
  color: #9da8ff;
}
.results .note {
  font-size: 0.85rem;
  color: #9399d3;
  margin: 0.4rem 0 0;
}
@media (max-width: 640px) {
  .control-panel {
    padding: 1.8rem 1.4rem 2.2rem;
    border-radius: 16px;
  }
  .control-panel h1 {
    font-size: 1.85rem;
  }
  button {
    width: 100%;
    justify-content: center;
  }
}
`;
document.head.appendChild(styleEl);

const overlay = document.createElement('div');
overlay.className = 'ui-overlay';
document.body.appendChild(overlay);

const panel = document.createElement('section');
panel.className = 'control-panel';
overlay.appendChild(panel);

const heading = document.createElement('h1');
heading.textContent = 'Interactive Job Hunt Arena';
panel.appendChild(heading);

const intro = document.createElement('p');
intro.textContent = 'Step 1: Drop your resume copy and we will extract quick signals for the arena.';
panel.appendChild(intro);

const helper = document.createElement('p');
helper.className = 'helper';
helper.textContent = 'We scan for keywords, GPA hints, internships, clubs, and buzzwords�no heavy NLP needed.';
panel.appendChild(helper);

const resumeLabel = document.createElement('label');
resumeLabel.setAttribute('for', 'resume-input');
resumeLabel.textContent = 'Resume Text';
panel.appendChild(resumeLabel);

const resumeInput = document.createElement('textarea');
resumeInput.id = 'resume-input';
resumeInput.placeholder = 'Paste resume text, bullet points, or a job experience summary here...';
resumeInput.spellcheck = false;
panel.appendChild(resumeInput);

const analyzeButton = document.createElement('button');
analyzeButton.type = 'button';
analyzeButton.textContent = 'Analyze Resume';
panel.appendChild(analyzeButton);

const statusMessage = document.createElement('p');
statusMessage.className = 'status-message';
panel.appendChild(statusMessage);

const resultsContainer = document.createElement('div');
resultsContainer.className = 'results';
panel.appendChild(resultsContainer);

resumeInput.addEventListener('input', () => {
  statusMessage.textContent = '';
  statusMessage.classList.remove('warning');
});

const skillVocabulary = [
  { label: 'Python', patterns: ['python'] },
  { label: 'JavaScript', patterns: ['javascript', 'js'] },
  { label: 'Java', patterns: ['java'] },
  { label: 'SQL', patterns: ['sql'] },
  { label: 'Machine Learning', patterns: ['machine learning', 'ml'] },
  { label: 'Data Analysis', patterns: ['data analysis', 'analytics'] },
  { label: 'Excel', patterns: ['excel'] },
  { label: 'C++', patterns: ['c++', 'cpp'] },
  { label: 'Project Management', patterns: ['project management', 'managed projects', 'led project'] },
  { label: 'Cloud', patterns: ['aws', 'azure', 'gcp', 'cloud'] },
  { label: 'Communication', patterns: ['communication', 'presented', 'presentation'] }
];

const buzzwords = [
  'python',
  'machine learning',
  'ai',
  'excel',
  'blockchain',
  'cloud',
  'leadership',
  'data science',
  'growth',
  'automation'
];

const fillerPhrases = [
  'passionate',
  'motivated',
  'dynamic',
  'results-driven',
  'detail-oriented',
  'team player',
  'self-starter',
  'hardworking',
  'fast learner',
  'go-getter'
];

const networkingKeywords = [
  'club',
  'society',
  'association',
  'chapter',
  'hackathon',
  'conference',
  'meetup',
  'fraternity',
  'sorority',
  'organization',
  'leadership',
  'networking'
];

const experienceKeywords = [
  'experience',
  'internship',
  'intern',
  'project',
  'research',
  'work',
  'developed',
  'built',
  'led',
  'created'
];

analyzeButton.addEventListener('click', () => {
  const resumeText = resumeInput.value.trim();
  resultsContainer.innerHTML = '';
  statusMessage.textContent = '';
  statusMessage.classList.remove('warning');

  if (!resumeText) {
    statusMessage.textContent = 'Add a few resume bullets to generate your arena stats.';
    statusMessage.classList.add('warning');
    return;
  }

  const stats = analyzeResume(resumeText);
  renderResults(stats);
});

function analyzeResume(rawText) {
  const normalized = rawText.replace(/\s+/g, ' ').trim();
  const lower = normalized.toLowerCase();
  const tokens = lower.match(/\b[a-z0-9\+\-\.]+\b/g) || [];
  const totalWords = tokens.length;

  const skillMatches = skillVocabulary
    .map(skill => {
      const count = skill.patterns.reduce((acc, pattern) => acc + countPhraseOccurrences(lower, pattern), 0);
      return { label: skill.label, count };
    })
    .filter(skill => skill.count > 0)
    .sort((a, b) => b.count - a.count);

  const totalSkillMatches = skillMatches.reduce((acc, skill) => acc + skill.count, 0);

  const gpaMatch = rawText.match(/(?:gpa|grade point average)[^0-9]{0,8}([0-4]\.[0-9]{1,2})/i);
  const gpa = gpaMatch ? Number.parseFloat(gpaMatch[1]).toFixed(2) : null;

  const internshipCount =
    countPhraseOccurrences(lower, 'internship') +
    countPhraseOccurrences(lower, 'intern') +
    countPhraseOccurrences(lower, 'co-op');

  const networkingCount = networkingKeywords.reduce(
    (acc, keyword) => acc + countPhraseOccurrences(lower, keyword),
    0
  );

  const experienceCount = experienceKeywords.reduce(
    (acc, keyword) => acc + countPhraseOccurrences(lower, keyword),
    0
  );

  const fillerCount = fillerPhrases.reduce(
    (acc, phrase) => acc + countPhraseOccurrences(lower, phrase),
    0
  );

  const energyRatio = totalWords ? fillerCount / totalWords : 0;
  const energyScore = Math.max(0, Math.round((1 - Math.min(energyRatio, 1)) * 100));

  const buzzwordsFound = Array.from(
    new Set(buzzwords.filter(word => countPhraseOccurrences(lower, word) > 0))
  );

  const luckScore = generateLuck(lower);

  return {
    totalWords,
    skillMatches,
    totalSkillMatches,
    gpa,
    internshipCount,
    networkingCount,
    experienceCount,
    fillerCount,
    energyRatio,
    energyScore,
    buzzwordsFound,
    luckScore
  };
}

function renderResults(stats) {
  const fillerPercent = (Math.min(1, stats.energyRatio) * 100).toFixed(1);
  const skillListMarkup = stats.skillMatches.length
    ? stats.skillMatches.slice(0, 8).map(skill => `<li><span>${skill.label}</span><span>${skill.count}</span></li>`).join('')
    : '<li>No skill keywords detected yet. Add specific technologies or tools.</li>';

  const buzzwordText = stats.buzzwordsFound.length
    ? stats.buzzwordsFound.map(toTitleCase).join(', ')
    : 'None yet';

  resultsContainer.innerHTML = `
    <div class="stat-grid">
      <div class="stat">
        <h3>Experience</h3>
        <p>${stats.experienceCount}</p>
        <span>experience keyword hits</span>
      </div>
      <div class="stat">
        <h3>Networking</h3>
        <p>${stats.networkingCount}</p>
        <span>clubs & events mentions</span>
      </div>
      <div class="stat">
        <h3>Skills</h3>
        <p>${stats.totalSkillMatches}</p>
        <span>keyword matches</span>
      </div>
      <div class="stat">
        <h3>Energy</h3>
        <p>${stats.energyScore}</p>
        <span>${fillerPercent}% filler vibe</span>
      </div>
      <div class="stat">
        <h3>Luck</h3>
        <p>${stats.luckScore}</p>
        <span>seeded from resume</span>
      </div>
    </div>
    <div class="resume-flags">
      <h2>Resume Signals</h2>
      <ul>
        <li><span>GPA</span><span>${stats.gpa ? stats.gpa : 'Not detected'}</span></li>
        <li><span>Internships</span><span>${stats.internshipCount ? stats.internshipCount : 'None mentioned'}</span></li>
        <li><span>Networking</span><span>${stats.networkingCount ? stats.networkingCount : 'Add clubs or events'}</span></li>
        <li><span>Buzzwords</span><span>${buzzwordText}</span></li>
      </ul>
    </div>
    <div class="skill-breakdown">
      <h2>Skill Highlights</h2>
      <ul>
        ${skillListMarkup}
      </ul>
    </div>
    <p class="note">These quick reads set up your agent stats. We will wire them into the arena logic next.</p>
  `;
}

function countPhraseOccurrences(text, phrase) {
  if (!phrase) {
    return 0;
  }

  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const needsBoundary = /^[a-z0-9]+$/i.test(phrase);
  const pattern = needsBoundary ? `\b${escaped}\b` : escaped;
  const regex = new RegExp(pattern, 'g');
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function generateLuck(text) {
  if (!text.length) {
    return Math.floor(Math.random() * 101);
  }

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash % 101);
}

function toTitleCase(value) {
  return value.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1));
}

class Polygon {
  constructor() {
    this.reset();
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.06;
    this.sides = Math.floor(Math.random() * 6) + 3;
    this.color = `hsla(${Math.random() * 360}, 70%, 65%, 0.35)`;
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 1.8;
    this.vy = (Math.random() - 0.5) * 1.8;
    this.size = Math.random() * 40 + 25;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;

    if (this.x < -this.size) this.x = canvas.width + this.size;
    if (this.x > canvas.width + this.size) this.x = -this.size;
    if (this.y < -this.size) this.y = canvas.height + this.size;
    if (this.y > canvas.height + this.size) this.y = -this.size;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.beginPath();

    for (let i = 0; i < this.sides; i++) {
      const angle = (i / this.sides) * Math.PI * 2;
      const px = Math.cos(angle) * this.size;
      const py = Math.sin(angle) * this.size;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }

    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

const polygons = Array.from({ length: 28 }, () => new Polygon());

function animate() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  polygons.forEach(polygon => {
    polygon.update();
    polygon.draw();
  });

  ctx.font = '600 110px Inter, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Job Hunt Arena', canvas.width / 2, canvas.height / 2);

  requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});




