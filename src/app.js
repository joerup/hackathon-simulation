// import { initCanvasBackground } from "./canvasBackground.js";
// import { initResumePanel } from "./ui/resumePanel.js";
import { initGameGrid } from "./ui/gameGrid.js";
import { initHeader } from "./ui/header.js";

document.addEventListener("DOMContentLoaded", () => {
  const gameGrid = initGameGrid(10);
  const gridContainer = gameGrid.getRenderer().getContainer();

  initHeader(gameGrid);

  document.body.appendChild(gridContainer);
});
