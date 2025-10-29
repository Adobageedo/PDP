const PDFParser = require('pdf2json');
const pdfjsLib = require('pdfjs-dist');
const { fromBuffer } = require('pdf2pic');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * PDF Text Extraction Service with 3-tier fallback:
 * 1. pdf2json (fast, text-based PDFs)
 * 2. pdfjs-dist (Mozilla's PDF.js - more robust)
 * 3. GPT-4 Vision (paid, scanned/complex docs)
 */
class PDFExtractorService {
  constructor() {
    this.openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  /**
   * Extract text from PDF buffer
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {String} filename - PDF filename for logging
   * @returns {String} Extracted text
   */
  async extractText(pdfBuffer, filename) {
    return new Promise((resolve, reject) => {
      try {
        console.log(`  📄 Extracting text from: ${filename}`);
        
        // Create temporary file (pdf2json works with files)
        const tempFilePath = path.join(os.tmpdir(), `temp_${Date.now()}_${filename}`);
        fs.writeFileSync(tempFilePath, pdfBuffer);
        
        const pdfParser = new PDFParser(this, 1);
        
        pdfParser.on('pdfParser_dataError', (errData) => {
          // Clean up temp file
          try { fs.unlinkSync(tempFilePath); } catch (e) {}
          console.error(`  ❌ PDF extraction failed for ${filename}:`, errData.parserError);
          reject(new Error(`Failed to extract PDF text: ${errData.parserError}`));
        });
        
        pdfParser.on('pdfParser_dataReady', (pdfData) => {
          try {
            // Extract text from JSON structure
            let extractedText = '';
            let pageCount = 0;
            
            if (pdfData.Pages) {
              pageCount = pdfData.Pages.length;
              
              pdfData.Pages.forEach((page) => {
                if (page.Texts) {
                  page.Texts.forEach((text) => {
                    if (text.R) {
                      text.R.forEach((r) => {
                        if (r.T) {
                          // Decode URI encoded text
                          const decodedText = decodeURIComponent(r.T);
                          extractedText += decodedText + ' ';
                        }
                      });
                    }
                  });
                  extractedText += '\n'; // New line after each text block
                }
              });
            }
            
            extractedText = extractedText.trim();
            
            // Check if text extraction was successful
            if (extractedText.length < 100) {
              console.log(`  ⚠️ Low text extraction (${extractedText.length} chars), trying PDF.js...`);
              
              // Tier 2: Try PDF.js (more robust)
              this.extractTextWithPDFJS(pdfBuffer, filename)
                .then((pdfjsText) => {
                  // Clean up temp file
                  try { fs.unlinkSync(tempFilePath); } catch (e) {}
                  resolve(pdfjsText);
                })
                .catch((pdfjsError) => {
                  console.error(`  ⚠️ PDF.js failed:`, pdfjsError.message);
                  console.log(`  🔄 Trying GPT-4 Vision as last resort...`);
                  
                  // Tier 3: Try GPT-4 Vision as last resort
                  this.extractTextWithVision(pdfBuffer, filename)
                    .then((visionText) => {
                      // Clean up temp file
                      try { fs.unlinkSync(tempFilePath); } catch (e) {}
                      resolve(visionText);
                    })
                    .catch((visionError) => {
                      console.error(`  ⚠️ Vision OCR also failed:`, visionError.message);
                      // Clean up temp file
                      try { fs.unlinkSync(tempFilePath); } catch (e) {}
                      // Return what we have, even if minimal
                      resolve(extractedText || `[PDF: ${filename} - All extraction methods failed]`);
                    });
                });
              return;
            }
            
            // Clean up temp file
            try { fs.unlinkSync(tempFilePath); } catch (e) {}
            
            console.log(`  ✅ Extracted ${extractedText.length} chars from ${pageCount} pages`);
            resolve(extractedText);
          } catch (error) {
            // Clean up temp file
            try { fs.unlinkSync(tempFilePath); } catch (e) {}
            console.error(`  ❌ Error processing PDF data:`, error.message);
            reject(new Error(`Failed to process PDF text: ${error.message}`));
          }
        });
        
        pdfParser.loadPDF(tempFilePath);
        
      } catch (error) {
        console.error(`  ❌ PDF extraction failed for ${filename}:`, error.message);
        reject(new Error(`Failed to extract PDF text: ${error.message}`));
      }
    });
  }

  /**
   * Tier 2: Extract text using PDF.js (Mozilla's library - more robust)
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {String} filename - PDF filename for logging
   * @returns {String} Extracted text via PDF.js
   */
  async extractTextWithPDFJS(pdfBuffer, filename) {
    try {
      console.log(`  📚 Using PDF.js for text extraction...`);
      
      // Load PDF with pdfjs
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
      const pdf = await loadingTask.promise;
      
      const numPages = pdf.numPages;
      console.log(`  📄 PDF has ${numPages} pages`);
      
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= Math.min(numPages, 10); pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
        
        console.log(`  ✅ Page ${pageNum}: ${pageText.length} chars`);
      }
      
      fullText = fullText.trim();
      
      // Check if extraction was successful
      if (fullText.length < 100) {
        throw new Error(`PDF.js extracted only ${fullText.length} chars`);
      }
      
      console.log(`  🎉 PDF.js complete: ${fullText.length} total chars from ${numPages} pages`);
      return fullText;
      
    } catch (error) {
      console.error(`  ❌ PDF.js failed:`, error.message);
      throw error;
    }
  }

  /**
   * Tier 3: Extract text from scanned PDFs using GPT-4 Vision OCR
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {String} filename - PDF filename for logging
   * @returns {String} Extracted text via GPT-4 Vision
   */
  async extractTextWithVision(pdfBuffer, filename) {
    try {
      console.log(`  🤖 Using GPT-4 Vision for OCR (scanned PDF)...`);
      console.log(`  ⚠️  This will consume API credits`);
      console.log(`  💡 Note: pdf2pic requires GraphicsMagick and Ghostscript installed`);
      console.log(`     Mac: brew install graphicsmagick ghostscript`);
      
      // Convert PDF to images using pdf2pic
      const options = {
        density: 200,           // DPI - higher = better quality
        saveFilename: "temp",
        savePath: os.tmpdir(),
        format: "png",
        width: 2000,
        height: 2000
      };
      
      console.log(`  🔍 DEBUG - pdf2pic options:`, options);
      const convert = fromBuffer(pdfBuffer, options);
      console.log(`  🔍 DEBUG - Convert function created`);
      
      // Convert first 3 pages (to limit API costs)
      const pagesToConvert = Math.min(3, 1); // Start with just page 1
      const images = [];
      
      console.log(`  📄 Converting PDF pages to images...`);
      
      for (let pageNum = 1; pageNum <= pagesToConvert; pageNum++) {
        try {
          const result = await convert(pageNum, { responseType: "base64" });
          console.log(`  🔍 DEBUG - Conversion result for page ${pageNum}:`, {
            hasBase64: !!result.base64,
            base64Length: result.base64?.length,
            base64Preview: result.base64?.substring(0, 50),
            resultKeys: Object.keys(result)
          });
          images.push(result.base64);
          console.log(`  ✅ Converted page ${pageNum} to image`);
        } catch (pageError) {
          console.log(`  ⚠️  Could not convert page ${pageNum}:`, pageError.message);
        }
      }
      
      if (images.length === 0) {
        throw new Error('No images could be converted from PDF');
      }
      
      // Prepare images for GPT-4 Vision API
      const imageContent = images.map((base64Image, idx) => {
        // Clean base64 string - remove any whitespace or newlines
        const cleanBase64 = base64Image.replace(/\s/g, '');
        
        console.log(`  🔍 DEBUG - Image ${idx + 1} base64 info:`, {
          originalLength: base64Image.length,
          cleanedLength: cleanBase64.length,
          startsWithData: base64Image.startsWith('data:'),
          firstChars: cleanBase64.substring(0, 30),
          isValidBase64: /^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64.substring(0, 100))
        });
        
        return {
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${cleanBase64}`
          }
        };
      });
      
      console.log(`  🤖 Sending ${images.length} image(s) to GPT-4 Vision...`);
      
      // Call GPT-4 Vision API
      const response = await this.openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',  // gpt-4o has vision capabilities
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract ALL text from this certification document image. Be thorough and include:

- Person names (first name and last name)
- Certification names and types (GWO, H0B0, First Aid, Working at Heights, etc.)
- **ALL DATES** especially:
  - Expiry dates (look for "Valid until", "Expiry", "Expire le", "Valable jusqu'au")
  - Issue dates
  - Any dates in format DD/MM/YYYY, YYYY-MM-DD, or Month Day, Year
- Company names
- Any other visible text

Return the extracted text in a clear format. Be extremely careful to capture all dates accurately.

Document: ${filename}`
              },
              ...imageContent
            ]
          }
        ],
        max_tokens: 15000
      });
      
      const extractedText = response.choices[0]?.message?.content || '';
      
      if (extractedText.length < 50) {
        throw new Error('GPT-4 Vision returned minimal text');
      }
      
      console.log(`  🎉 Vision OCR complete: ${extractedText.length} chars extracted`);
      console.log(`  Preview: ${extractedText.substring(0, 200)}...`);
      
      return extractedText.trim();
      
    } catch (error) {
      console.error(`  ❌ Vision OCR failed:`, error.message);
      console.error(`  🔍 DEBUG - Full error:`, {
        message: error.message,
        status: error.status,
        code: error.code,
        type: error.type,
        response: error.response?.data
      });
      console.log(`  💡 Falling back to filename parsing for: ${filename}`);
      // Return minimal info so filename parsing can take over
      return `[Vision OCR failed. Filename: ${filename}]`;
    }
  }
}

module.exports = new PDFExtractorService();
