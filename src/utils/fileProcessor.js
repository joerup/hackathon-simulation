/**
 * File processing utilities for resume analysis
 * Handles text extraction from various file formats
 */

import { extractPdfText, isPdfFile } from './pdfProcessor.js';

/**
 * Check if file is text-like based on type and extension
 */
function isTextFile(file) {
  return file.type.startsWith("text/") || /\.(txt|md|rtf|csv)$/i.test(file.name);
}

/**
 * Convert file to base64 string
 */
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

/**
 * Read text file content
 */
function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed to read file: ${reader.error?.message || "unknown error"}`));
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsText(file);
  });
}

/**
 * Process any supported file type and extract text content with base64 fallback
 * @param {File} file - File to process
 * @returns {Promise<{fileName: string, mimeType: string, text: string, base64: string}>}
 */
export async function processResumeFile(file) {
  const basePayload = {
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    text: "",
    base64: ""
  };

  try {
    // Handle text files
    if (isTextFile(file)) {
      basePayload.text = await readTextFile(file);
      basePayload.mimeType = file.type || "text/plain";
      return basePayload;
    }

    // Handle PDF files
    if (isPdfFile(file)) {
      basePayload.mimeType = file.type || "application/pdf";
      basePayload.base64 = await fileToBase64(file);
      
      try {
        basePayload.text = await extractPdfText(file);
      } catch (error) {
        console.warn(`PDF text extraction failed for ${file.name}:`, error.message);
        // Continue with base64 only - text will remain empty
      }
      
      return basePayload;
    }

    // Handle other binary files (DOCX, etc.)
    basePayload.base64 = await fileToBase64(file);
    return basePayload;
    
  } catch (error) {
    throw new Error(`File processing failed for ${file.name}: ${error.message}`);
  }
}
