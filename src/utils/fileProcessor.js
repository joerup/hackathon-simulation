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
  console.log(`🔄 [FILE PROCESSOR] Starting file processing for: ${file.name}`);
  console.log(`📝 [FILE PROCESSOR] File details:`, {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : 'unknown'
  });

  const basePayload = {
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    text: "",
    base64: ""
  };

  try {
    const startTime = Date.now();

    // Handle text files
    if (isTextFile(file)) {
      console.log(`📄 [FILE PROCESSOR] Processing as text file (${file.type})`);
      const textStartTime = Date.now();
      basePayload.text = await readTextFile(file);
      const textTime = Date.now() - textStartTime;
      basePayload.mimeType = file.type || "text/plain";
      
      console.log(`✅ [FILE PROCESSOR] Text extraction completed in ${textTime}ms`);
      console.log(`📊 [FILE PROCESSOR] Extracted text length: ${basePayload.text.length} characters`);
      console.log(`📋 [FILE PROCESSOR] Text preview (first 200 chars):`, basePayload.text.substring(0, 200) + (basePayload.text.length > 200 ? '...' : ''));
      
      return basePayload;
    }

    // Handle PDF files
    if (isPdfFile(file)) {
      console.log(`📄 [FILE PROCESSOR] Processing as PDF file`);
      basePayload.mimeType = file.type || "application/pdf";
      
      // Convert to base64
      const base64StartTime = Date.now();
      basePayload.base64 = await fileToBase64(file);
      const base64Time = Date.now() - base64StartTime;
      console.log(`🔗 [FILE PROCESSOR] Base64 encoding completed in ${base64Time}ms`);
      console.log(`📊 [FILE PROCESSOR] Base64 length: ${basePayload.base64.length} characters`);
      
      // Extract text
      try {
        console.log(`🔍 [FILE PROCESSOR] Attempting PDF text extraction...`);
        const textStartTime = Date.now();
        basePayload.text = await extractPdfText(file);
        const textTime = Date.now() - textStartTime;
        
        console.log(`✅ [FILE PROCESSOR] PDF text extraction completed in ${textTime}ms`);
        console.log(`📊 [FILE PROCESSOR] Extracted text length: ${basePayload.text.length} characters`);
        console.log(`📋 [FILE PROCESSOR] Text preview (first 200 chars):`, basePayload.text.substring(0, 200) + (basePayload.text.length > 200 ? '...' : ''));
      } catch (error) {
        console.warn(`⚠️ [FILE PROCESSOR] PDF text extraction failed for ${file.name}:`, error.message);
        console.warn(`⚠️ [FILE PROCESSOR] Will proceed with base64 only - LLM can handle this`);
        // Continue with base64 only - text will remain empty
      }
      
      const totalTime = Date.now() - startTime;
      console.log(`⚡ [FILE PROCESSOR] PDF processing completed in ${totalTime}ms`);
      return basePayload;
    }

    // Handle other binary files (DOCX, etc.)
    console.log(`📄 [FILE PROCESSOR] Processing as binary file (${file.type || 'unknown type'})`);
    const binaryStartTime = Date.now();
    basePayload.base64 = await fileToBase64(file);
    const binaryTime = Date.now() - binaryStartTime;
    
    console.log(`🔗 [FILE PROCESSOR] Binary file base64 encoding completed in ${binaryTime}ms`);
    console.log(`📊 [FILE PROCESSOR] Base64 length: ${basePayload.base64.length} characters`);
    
    const totalTime = Date.now() - startTime;
    console.log(`⚡ [FILE PROCESSOR] Binary file processing completed in ${totalTime}ms`);
    return basePayload;
    
  } catch (error) {
    console.error(`❌ [FILE PROCESSOR] File processing failed for ${file.name}:`, error);
    console.error(`❌ [FILE PROCESSOR] Error details:`, {
      message: error.message,
      stack: error.stack,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    throw new Error(`File processing failed for ${file.name}: ${error.message}`);
  }
}
