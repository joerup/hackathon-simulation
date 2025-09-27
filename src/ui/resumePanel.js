import { requestResumeStats } from "../services/snapdragonClient.js";
import { renderResults } from "./renderResults.js";
import { createElement, createButton, createStatusMessage } from "../utils/domUtils.js";
import { processResumeFile } from "../utils/fileProcessor.js";

export function initResumePanel() {
  // Create main UI structure
  const overlay = createElement("div", { className: "ui-overlay" });
  const panel = createElement("section", { className: "control-panel" });
  document.body.appendChild(overlay);
  overlay.appendChild(panel);

  // Create content elements
  const content = [
    createElement("h1", { textContent: "Interactive Job Hunt Arena" }),
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
        statusMessage.showStatus("Analysis complete. Ready for arena wiring.");
      }
    } catch (error) {
      console.error("Resume analysis failed", error);
      statusMessage.showStatus("API call failed. Check the console and API key.", true);
    } finally {
      analyzeButton.setLoadingState(false);
    }
  }
}
