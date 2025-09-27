import { requestResumeStats } from "../services/snapdragonClient.js";
import { renderResults } from "./renderResults.js";
import { createElement, createButton, createStatusMessage } from "../utils/domUtils.js";
import { processResumeFile } from "../utils/fileProcessor.js";

export function initResumePanel(gameGrid = null) {
  // Create main UI structure
  const overlay = createElement("div", { className: "ui-overlay" });
  const panel = createElement("section", { className: "control-panel" });
  document.body.appendChild(overlay);
  overlay.appendChild(panel);

  // Create content elements
  const content = [
    createElement("h1", { textContent: "Add Student" }),
    createElement("p", { textContent: "Step 1: Upload your resume and we will pull quick signals for the arena." }),
    createElement("p", { 
      className: "helper",
      textContent: "We will hand the file to a Snapdragon-powered LLM to detect keywords, GPA hints, internships, clubs, buzzwords, and more."
    })
  ];

  // Create file input section
  const uploadLabel = createElement("label", { 
    textContent: "Resume File",
    attributes: { for: "resume-upload" }
  });

  const fileInputWrapper = createElement("div", { className: "file-input-wrapper" });
  const resumeUpload = createElement("input", {
    className: "file-input",
    attributes: {
      id: "resume-upload",
      type: "file",
      accept: ".pdf,.doc,.docx,.txt,.md,.rtf"
    }
  });

  const fileHint = createElement("p", {
    className: "file-hint",
    textContent: "Tip: start with PDF, DOCX, or TXT. We will convert to text or base64 before sending."
  });

  const fileMeta = createElement("p", {
    className: "file-meta",
    textContent: "No file selected yet."
  });

  // Create action elements
  const analyzeButton = createButton("Analyze Resume", { loadingText: "Analyzing..." });
  const statusMessage = createStatusMessage();
  const resultsContainer = createElement("div", { className: "results" });

  // Assemble the panel
  content.forEach(element => panel.appendChild(element));
  panel.appendChild(uploadLabel);
  fileInputWrapper.appendChild(resumeUpload);
  panel.appendChild(fileInputWrapper);
  panel.appendChild(fileHint);
  panel.appendChild(fileMeta);
  panel.appendChild(analyzeButton);
  panel.appendChild(statusMessage);
  panel.appendChild(resultsContainer);

  // Set up event handlers
  resumeUpload.addEventListener("change", () => {
    updateFileInfo();
    statusMessage.showStatus("");
    resultsContainer.innerHTML = "";
  });

  analyzeButton.addEventListener("click", handleResumeAnalysis);

  // Helper functions
  function updateFileInfo() {
    if (resumeUpload.files && resumeUpload.files[0]) {
      const file = resumeUpload.files[0];
      const displaySize = file.size > 0 ? `${(file.size / 1024).toFixed(1)} KB` : "unknown size";
      fileMeta.textContent = `${file.name} - ${displaySize}`;
    } else {
      fileMeta.textContent = "No file selected yet.";
    }
  }

  async function handleResumeAnalysis() {
    const file = resumeUpload.files && resumeUpload.files[0];

    if (!file) {
      statusMessage.showStatus("Upload a resume file before analyzing.", true);
      return;
    }

    try {
      analyzeButton.setLoadingState(true);
      statusMessage.showStatus("Extracting text from resume...");

      const payload = await processResumeFile(file);
      console.log(`📄 Extracted text from ${file.name}:`, payload.text?.slice(0, 500) + (payload.text?.length > 500 ? '...' : ''));
      
      statusMessage.showStatus("Generating professional summary with AI...");
      const stats = await requestResumeStats(payload);

      renderResults(resultsContainer, stats);
      
      // Check if the summary indicates an error
      if (stats.summary.startsWith("❌") || stats.summary.startsWith("⚠️")) {
        statusMessage.showStatus("Analysis completed with issues. See summary for details.", true);
      } else {
        statusMessage.showStatus("Analysis complete. Creating student agent...");
        
        // Create student from resume data and add to game grid
        if (gameGrid) {
          const studentCreated = createStudentFromResume(stats, gameGrid);
          if (studentCreated) {
            statusMessage.showStatus("Student added to arena! They will appear on the next time step.");
          } else {
            statusMessage.showStatus("Analysis complete. Could not add student to arena (no available positions).", true);
          }
        } else {
          statusMessage.showStatus("Analysis complete. Game grid not available.");
        }
      }
    } catch (error) {
      console.error("Resume analysis failed", error);
      statusMessage.showStatus("API call failed. Check the console and API key.", true);
    } finally {
      analyzeButton.setLoadingState(false);
    }
  }

  /**
   * Create a student agent from resume analysis data and add to game grid
   */
  function createStudentFromResume(stats, gameGrid) {
    try {
      // Find an empty position for the student
      const gameState = gameGrid.getGameState();
      const size = gameState.grid.length;
      let emptyPosition = null;

      console.log("Looking for random empty position. Grid size:", size);

      // Try random positions for student spawning
      for (let attempts = 0; attempts < 100; attempts++) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);
        const cell = gameState.grid[y][x];
        
        if (cell.type === 'walkable' && (!cell.agent || cell.agent === null)) {
          emptyPosition = { x, y };
          console.log("Found random empty position:", emptyPosition);
          break;
        }
      }

      if (!emptyPosition) {
        console.warn("No empty positions available for new student");
        console.log("Grid state:", gameState.grid.map((row, y) => 
          row.map((cell, x) => ({ x, y, type: cell.type, hasAgent: !!cell.agent }))
        ));
        return false;
      }

      // Create student with resume-based stats
      const studentStats = createStudentStatsFromResume(stats);
      console.log("Creating student with stats:", studentStats);
      
      const agent = gameGrid.addAgent(emptyPosition.x, emptyPosition.y, null, true);
      
      if (agent) {
        // Override the randomly generated stats with resume-based stats
        agent.stats = studentStats;
        console.log("Student created successfully:", agent);
        return true;
      } else {
        console.error("Failed to create agent at position:", emptyPosition);
        return false;
      }

    } catch (error) {
      console.error("Failed to create student from resume:", error);
      return false;
    }
  }

  /**
   * Convert resume analysis stats to student agent stats
   */
  function createStudentStatsFromResume(stats) {
    // Extract skills from resume data - use the actual skill objects with labels/scores
    let skills = ['JavaScript']; // Default skill
    if (stats.skills && Array.isArray(stats.skills)) {
      skills = stats.skills
        .filter(skill => skill && (skill.label || skill.name))
        .map(skill => skill.label || skill.name)
        .slice(0, 4); // Limit to 4 skills
    }

    // Ensure we have at least one skill
    if (skills.length === 0) {
      skills = ['JavaScript'];
    }

    return {
      // Use all the existing resume analysis data
      gpa: stats.gpa || 3.0,
      skills: skills,
      experience: stats.experience || 0,
      major: stats.major || 'Computer Science',
      networking: stats.networking || 0,
      energyScore: stats.energyScore || 50,
      luck: stats.luck || 50,
      internships: stats.internships || 0,
      buzzwords: stats.buzzwords || [],
      summary: stats.summary || '',
      fillerRatio: stats.fillerRatio || 0
    };
  }
}
