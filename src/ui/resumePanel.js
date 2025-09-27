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
  helper.textContent = "We will hand the file to a Snapdragon-powered LLM to detect keywords, GPA hints, internships, clubs, buzzwords, and more.";
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
      showStatus(statusMessage, "Extracting text from resume...");

      const payload = await buildResumePayload(file);
      console.log(`📄 Extracted text from ${file.name}:`, payload.text?.slice(0, 500) + (payload.text?.length > 500 ? '...' : ''));
      
      showStatus(statusMessage, "Generating professional summary with AI...");
      const stats = await requestResumeStats(payload);

      renderResults(resultsContainer, stats);
      
      // Check if the summary indicates an error
      if (stats.summary.startsWith("❌") || stats.summary.startsWith("⚠️")) {
        showStatus(statusMessage, "Analysis completed with issues. See summary for details.", true);
      } else {
        showStatus(statusMessage, "Analysis complete. Ready for arena wiring.");
      }
    } catch (error) {
      console.error("Resume analysis failed", error);
      showStatus(statusMessage, "API call failed. Check the console and API key.", true);
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

async function buildResumePayload(file) {
  const isTextLike = file.type.startsWith("text/") || /\.(txt|md|rtf|csv)$/i.test(file.name);
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  // Handle text files
  if (isTextLike) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(`Failed to read file: ${reader.error?.message || "unknown error"}`));
      reader.onload = () => {
        resolve({
          fileName: file.name,
          mimeType: file.type || "text/plain",
          text: typeof reader.result === "string" ? reader.result : "",
          base64: null
        });
      };
      reader.readAsText(file);
    });
  }

  // Handle PDF files with text extraction
  if (isPdf) {
    try {
      const text = await extractPdfText(file);
      const base64 = await fileToBase64(file);
      return {
        fileName: file.name,
        mimeType: file.type || "application/pdf",
        text: text || "", // Fallback to empty string if extraction fails
        base64: base64
      };
    } catch (error) {
      console.warn(`PDF text extraction failed for ${file.name}:`, error.message);
      // Fallback to base64 only
      const base64 = await fileToBase64(file);
      return {
        fileName: file.name,
        mimeType: file.type || "application/pdf",
        text: "",
        base64: base64
      };
    }
  }

  // Handle other binary files
  const base64 = await fileToBase64(file);
  return {
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    text: "",
    base64: base64
  };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed to read file: ${reader.error?.message || "unknown error"}`));
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      const parts = dataUrl.split(",");
      const base64Payload = parts.length > 1 ? parts[1] : "";
      resolve(base64Payload);
    };
    reader.readAsDataURL(file);
  });
}

function extractPdfText(file) {
  return new Promise(async (resolve, reject) => {
    try {
      // Load PDF.js dynamically if not already loaded
      if (typeof window.pdfjsLib === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        document.head.appendChild(script);
        
        await new Promise((resolveScript) => {
          script.onload = resolveScript;
          script.onerror = () => reject(new Error('Failed to load PDF.js library'));
        });
      }

      // Set worker source
      if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }

      const arrayBuffer = await new Promise((resolveBuffer, rejectBuffer) => {
        const reader = new FileReader();
        reader.onerror = () => rejectBuffer(new Error('Failed to read PDF file'));
        reader.onload = () => resolveBuffer(reader.result);
        reader.readAsArrayBuffer(file);
      });

      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      
      // Extract text from each page
      for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) { // Limit to 10 pages for performance
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map(item => item.str)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        
        if (pageText) {
          fullText += pageText + "\n\n";
        }
      }
      
      resolve(fullText.trim());
    } catch (error) {
      reject(new Error(`PDF parsing failed: ${error.message}`));
    }
  });
}
