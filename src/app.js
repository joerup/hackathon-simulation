// import { initCanvasBackground } from "./canvasBackground.js";
// import { initResumePanel } from "./ui/resumePanel.js";
import { initGameGrid } from "./ui/gameGrid.js";
import { initHeader } from "./ui/header.js";
import { initStudentSidebar } from "./ui/studentSidebar.js";
import { initLeaderboardSidebar } from "./ui/leaderboardSidebar.js";

document.addEventListener("DOMContentLoaded", () => {
  const gameGrid = initGameGrid(10);
  const gridContainer = gameGrid.getRenderer().getContainer();
  const studentSidebar = initStudentSidebar(gameGrid);
  const leaderboardSidebar = initLeaderboardSidebar(gameGrid);

  // Store sidebar references in gameGrid for updates
  gameGrid.sidebar = studentSidebar;
  gameGrid.setLeaderboardSidebar(leaderboardSidebar);

  initHeader(gameGrid);

  document.body.appendChild(gridContainer);
});
