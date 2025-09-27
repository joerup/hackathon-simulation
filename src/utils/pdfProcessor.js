/**
 * PDF processing utilities using PDF.js
 * Handles PDF text extraction with proper error handling and fallbacks
 */

let pdfLibLoaded = false;

/**
 * Ensures PDF.js library is loaded and configured
 */
async function ensurePdfLibLoaded() {
  if (pdfLibLoaded && typeof window.pdfjsLib !== 'undefined') {
    return;
  }

  // Load PDF.js dynamically
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  document.head.appendChild(script);
  
  await new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load PDF.js library'));
  });

  // Set worker source
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  
  pdfLibLoaded = true;
}

/**
 * Convert file to ArrayBuffer for PDF.js processing
 */
function fileToArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read PDF file'));
    reader.onload = () => resolve(reader.result);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Extract text from a single PDF page
 */
async function extractPageText(page) {
  const textContent = await page.getTextContent();
  const pageText = textContent.items
    .map(item => item.str)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  
  return pageText;
}

/**
 * Extract text from PDF file
 * @param {File} file - PDF file to process
 * @param {number} maxPages - Maximum number of pages to process (default: 10)
 * @returns {Promise<string>} Extracted text content
 */
export async function extractPdfText(file, maxPages = 10) {
  try {
    await ensurePdfLibLoaded();
    
    const arrayBuffer = await fileToArrayBuffer(file);
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = "";
    const pagesToProcess = Math.min(pdf.numPages, maxPages);
    
    // Process pages sequentially to avoid overwhelming the system
    for (let i = 1; i <= pagesToProcess; i++) {
      const page = await pdf.getPage(i);
      const pageText = await extractPageText(page);
      
      if (pageText) {
        fullText += pageText + "\n\n";
      }
    }
    
    return fullText.trim();
  } catch (error) {
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
}

/**
 * Check if a file is a PDF based on type and extension
 */
export function isPdfFile(file) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}
