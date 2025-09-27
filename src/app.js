import { initCanvasBackground } from "./canvasBackground.js";
import { initResumePanel } from "./ui/resumePanel.js";
import { initGameGrid } from "./ui/gameGrid.js";

document.addEventListener("DOMContentLoaded", () => {
  initCanvasBackground();

  const gameGrid = initGameGrid(10);
  const gridContainer = gameGrid.getRenderer().getContainer();

  // Initialize resume panel with game grid reference
  initResumePanel(gameGrid);

  const uiOverlay = document.querySelector('.ui-overlay');
  if (uiOverlay) {
    uiOverlay.appendChild(gridContainer);
  } else {
    document.body.appendChild(gridContainer);
  }
});
