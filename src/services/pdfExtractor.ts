import pdf from 'pdf-parse';
import LLM from './llm';

export interface PDFExtractionResult {
  text: string;
  method: 'text' | 'vision';
  pageCount?: number;
}

/**
 * Extract text from PDF buffer
 * Falls back to Vision GPT if text extraction fails or returns minimal text
 */
export async function extractTextFromPDF(
  pdfBuffer: Buffer,
  filename: string,
  llmApiKey?: string
): Promise<string> {
  try {
    // Try standard text extraction first
    const data = await pdf(pdfBuffer);
    const extractedText = data.text.trim();
    
    // Check if we got meaningful text (more than 100 characters)
    if (extractedText.length > 100) {
      console.log(`✓ PDF text extraction successful for ${filename} (${data.numpages} pages, ${extractedText.length} chars)`);
      return `[PDF: ${filename} - ${data.numpages} pages]\n\n${extractedText}`;
    }
    
    console.warn(`⚠ PDF ${filename} has minimal text (${extractedText.length} chars), trying Vision GPT...`);
    
    // If text extraction failed or returned minimal text, use Vision GPT
    if (llmApiKey) {
      const visionText = await extractPDFWithVision(pdfBuffer, filename, llmApiKey);
      return visionText;
    } else {
      console.warn('No API key provided, skipping Vision GPT fallback');
      return `[PDF: ${filename} - Text extraction returned minimal content]\n${extractedText}`;
    }
    
  } catch (error) {
    console.error(`Error extracting text from PDF ${filename}:`, error);
    
    // Try Vision GPT as fallback
    if (llmApiKey) {
      try {
        console.log(`Attempting Vision GPT extraction for ${filename}...`);
        return await extractPDFWithVision(pdfBuffer, filename, llmApiKey);
      } catch (visionError) {
        console.error('Vision GPT extraction also failed:', visionError);
      }
    }
    
    return `[PDF: ${filename} - Extraction failed: ${error}]`;
  }
}

/**
 * Extract text from PDF using Vision GPT (for scanned documents or images)
 * Converts PDF pages to images and processes with GPT-4 Vision
 */
async function extractPDFWithVision(
  pdfBuffer: Buffer,
  filename: string,
  apiKey: string
): Promise<string> {
  // For browser environment, we need to convert PDF to images
  // This is a simplified version - in production you might want to use pdf.js
  const base64Pdf = pdfBuffer.toString('base64');
  
  const llm = new LLM({ apiKey });
  
  const prompt = `Extract all visible text from this PDF document. 
Include:
- Company names and contact information
- Worker/employee names
- Certification names and types
- Dates (issue dates, expiry dates)
- Any other relevant information

Return the extracted text in a clear, structured format.`;

  try {
    // Note: GPT-4 Vision can handle PDF pages as images
    // For now, we'll send the base64 PDF directly
    const result = await llm.parseImageBase64(base64Pdf, prompt, 'application/pdf');
    
    if (typeof result === 'string') {
      console.log(`✓ Vision GPT extraction successful for ${filename}`);
      return `[PDF: ${filename} - Extracted via Vision GPT]\n\n${result}`;
    } else if (result.text) {
      return `[PDF: ${filename} - Extracted via Vision GPT]\n\n${result.text}`;
    } else {
      return `[PDF: ${filename} - Vision GPT returned structured data]\n\n${JSON.stringify(result, null, 2)}`;
    }
  } catch (error) {
    console.error('Vision GPT extraction failed:', error);
    throw error;
  }
}

/**
 * Check if a PDF is likely scanned (image-based) vs text-based
 */
export async function isPDFScanned(pdfBuffer: Buffer): Promise<boolean> {
  try {
    const data = await pdf(pdfBuffer);
    const textLength = data.text.trim().length;
    const pageCount = data.numpages;
    
    // Heuristic: if less than 50 characters per page, it's likely scanned
    const avgCharsPerPage = textLength / pageCount;
    return avgCharsPerPage < 50;
  } catch {
    return true; // If we can't parse it, assume it might be scanned
  }
}
