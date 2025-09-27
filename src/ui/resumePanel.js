import { requestResumeStats } from "../services/snapdragonClient.js";
import { renderResults } from "./renderResults.js";

export function initResumePanel() {
  const overlay = document.createElement("div");
  overlay.className = "ui-overlay";
  document.body.appendChild(overlay);

  const panel = document.createElement("section");
  panel.className = "control-panel";
  overlay.appendChild(panel);

  const heading = document.createElement("h1");
  heading.textContent = "Interactive Job Hunt Arena";
  panel.appendChild(heading);

  const intro = document.createElement("p");
  intro.textContent = "Step 1: Upload your resume and we will pull quick signals for the arena.";
  panel.appendChild(intro);

  const helper = document.createElement("p");
  helper.className = "helper";
  helper.textContent = "We will hand the file to a SnapDragon LLM to detect keywords, GPA hints, internships, clubs, buzzwords, and more.";
  panel.appendChild(helper);

  const uploadLabel = document.createElement("label");
  uploadLabel.setAttribute("for", "resume-upload");
  uploadLabel.textContent = "Resume File";
  panel.appendChild(uploadLabel);

  const fileInputWrapper = document.createElement("div");
  fileInputWrapper.className = "file-input-wrapper";
  panel.appendChild(fileInputWrapper);

  const resumeUpload = document.createElement("input");
  resumeUpload.id = "resume-upload";
  resumeUpload.type = "file";
  resumeUpload.accept = ".pdf,.doc,.docx,.txt,.md,.rtf";
  resumeUpload.className = "file-input";
  fileInputWrapper.appendChild(resumeUpload);

  const fileHint = document.createElement("p");
  fileHint.className = "file-hint";
  fileHint.textContent = "Tip: start with PDF, DOCX, or TXT. We will convert to text or base64 before sending.";
  panel.appendChild(fileHint);

  const fileMeta = document.createElement("p");
  fileMeta.className = "file-meta";
  fileMeta.textContent = "No file selected yet.";
  panel.appendChild(fileMeta);

  const analyzeButton = document.createElement("button");
  analyzeButton.type = "button";
  analyzeButton.textContent = "Analyze Resume";
  panel.appendChild(analyzeButton);

  const statusMessage = document.createElement("p");
  statusMessage.className = "status-message";
  panel.appendChild(statusMessage);

  const resultsContainer = document.createElement("div");
  resultsContainer.className = "results";
  panel.appendChild(resultsContainer);

  resumeUpload.addEventListener("change", () => {
    if (resumeUpload.files && resumeUpload.files[0]) {
      const file = resumeUpload.files[0];
      const displaySize = file.size > 0 ? `${(file.size / 1024).toFixed(1)} KB` : "unknown size";
      fileMeta.textContent = `${file.name} - ${displaySize}`;
    } else {
      fileMeta.textContent = "No file selected yet.";
    }

    showStatus(statusMessage, "");
    resultsContainer.innerHTML = "";
  });

  analyzeButton.addEventListener("click", async () => {
    const file = resumeUpload.files && resumeUpload.files[0];

    if (!file) {
      showStatus(statusMessage, "Upload a resume file before analyzing.", true);
      return;
    }

    try {
      setLoadingState(analyzeButton, true);
      showStatus(statusMessage, "Contacting SnapDragon LLM. Hold tight.");

      const payload = await buildResumePayload(file);
      const stats = await requestResumeStats(payload);

      renderResults(resultsContainer, stats);
      showStatus(statusMessage, "Analysis complete. Ready for arena wiring.");
    } catch (error) {
      console.error("Resume analysis failed", error);
      showStatus(statusMessage, "SnapDragon call failed. Check the console and API key.", true);
    } finally {
      setLoadingState(analyzeButton, false);
    }
  });
}

function setLoadingState(button, isLoading) {
  button.disabled = isLoading;
  button.classList.toggle("loading", isLoading);
  button.textContent = isLoading ? "Analyzing..." : "Analyze Resume";
}

function showStatus(element, message, isWarning = false) {
  element.textContent = message;
  element.classList.toggle("warning", Boolean(isWarning));
}

function buildResumePayload(file) {
  const isTextLike = file.type.startsWith("text/") || /\.(txt|md|rtf|csv)$/i.test(file.name);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${reader.error?.message || "unknown error"}`));
    };

    reader.onload = () => {
      if (isTextLike) {
        resolve({
          fileName: file.name,
          mimeType: file.type || "text/plain",
          text: typeof reader.result === "string" ? reader.result : "",
          base64: null
        });
        return;
      }

      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      const parts = dataUrl.split(",");
      const base64Payload = parts.length > 1 ? parts[1] : "";

      resolve({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        text: "",
        base64: base64Payload
      });
    };

    if (isTextLike) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  });
}
