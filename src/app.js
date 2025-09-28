// import { initCanvasBackground } from "./canvasBackground.js";
// import { initResumePanel } from "./ui/resumePanel.js";
import { initGameGrid } from "./ui/gameGrid.js";
import { initHeader } from "./ui/header.js";
import { initStudentSidebar } from "./ui/studentSidebar.js";

document.addEventListener("DOMContentLoaded", () => {
  const gameGrid = initGameGrid(10);
  const gridContainer = gameGrid.getRenderer().getContainer();
  const sidebar = initStudentSidebar(gameGrid);

  // Store sidebar reference in gameGrid for updates
  gameGrid.sidebar = sidebar;

  initHeader(gameGrid);

  document.body.appendChild(gridContainer);
});
