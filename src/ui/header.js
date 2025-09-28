import { showModal } from './modal.js';

/**
 * Header component - Contains app title and navigation
 */
export function createHeader(gameGrid = null) {
  const header = document.createElement('header');
  header.className = 'app-header';
  header.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: rgba(8, 10, 24, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2rem;
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
  `;

  // Create title with logo
  const titleContainer = document.createElement('div');
  titleContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: 0.75rem;
  `;

  const logo = document.createElement('div');
  logo.textContent = 'out';
  logo.style.cssText = `
    width: 48px;
    height: 48px;
    background: #0a66c2;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-weight: 900;
    font-size: 1.3rem;
    text-transform: lowercase;
  `;

  const title = document.createElement('h1');
  title.textContent = 'LinkedOut';
  title.style.cssText = `
    margin: 0;
    font-size: 1.8rem;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.02em;
  `;

  titleContainer.appendChild(logo);
  titleContainer.appendChild(title);

  // Create Add Student button
  const addStudentButton = document.createElement('button');
  addStudentButton.textContent = 'Add Student';
  addStudentButton.style.cssText = `
    background: linear-gradient(140deg, #7088ff, #9d66ff);
    color: #11152c;
    border: none;
    border-radius: 8px;
    padding: 0.6rem 1.2rem;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    margin: 0;
  `;

  addStudentButton.addEventListener('mouseenter', () => {
    addStudentButton.style.transform = 'translateY(-1px)';
    addStudentButton.style.boxShadow = '0 8px 25px rgba(112, 136, 255, 0.4)';
  });

  addStudentButton.addEventListener('mouseleave', () => {
    addStudentButton.style.transform = 'translateY(0)';
    addStudentButton.style.boxShadow = 'none';
  });

  addStudentButton.addEventListener('click', () => {
    showModal(gameGrid);
  });

  // Assemble header
  header.appendChild(titleContainer);
  header.appendChild(addStudentButton);

  return header;
}

/**
 * Initialize and add header to the page
 */
export function initHeader(gameGrid = null) {
  const header = createHeader(gameGrid);
  document.body.insertBefore(header, document.body.firstChild);

  // Add top padding to body to account for fixed header
  document.body.style.paddingTop = '60px';

  return header;
}