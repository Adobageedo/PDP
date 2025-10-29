const emlParser = require('./emlParser.service');
const pdfExtractor = require('./pdfExtractor.service');
const llmService = require('./llm.service');
const { AppError } = require('../middleware/errorHandler');

/**
 * Main extraction service - orchestrates the entire pipeline
 */
class ExtractionService {
  /**
   * Process an EML file and extract structured data
   * @param {Buffer} emlBuffer - EML file buffer
   * @param {String} filename - Original filename
   * @param {Function} onProgress - Optional progress callback (step, message, data)
   * @returns {Object} Extracted data and metadata
   */
  async processEMLFile(emlBuffer, filename, onProgress = null) {
    try {
      // Step 1: Parse EML file
      console.log('📧 [1/3] Parsing EML file...');
      if (onProgress) onProgress('parsing', 'Parsing EML file...');
      
      const parsedEmail = await emlParser.parseEML(emlBuffer);
      
      if (onProgress) onProgress('parsed', `Found ${parsedEmail.attachments.length} attachments`, {
        attachmentCount: parsedEmail.attachments.length
      });
      
      // Step 2: Extract text from PDF attachments
      console.log(`📎 [2/3] Processing ${parsedEmail.attachments.length} attachments...`);
      if (onProgress) onProgress('extracting', `Processing ${parsedEmail.attachments.length} attachments...`);
      
      const fullText = await this.buildFullText(parsedEmail, onProgress);
      
      if (onProgress) onProgress('extracting_body', 'Extracting data from email body...');
      
      // Step 3: Extract structured data using LLM
      console.log('🤖 [3/3] Extracting data with LLM...');
      if (onProgress) onProgress('llm_thinking', 'LLM is analyzing the data...');
      
      const extractedData = await llmService.extractWindFarmData(fullText);
      
      return {
        data: extractedData,
        metadata: {
          attachmentsProcessed: parsedEmail.attachments.length,
          textLength: fullText.length,
          emailSubject: parsedEmail.subject,
          emailFrom: parsedEmail.from
        }
      };
    } catch (error) {
      console.error('❌ Extraction service error:', error);
      throw new AppError(`Failed to process EML file: ${error.message}`, 500);
    }
  }

  /**
   * Build full text from email and attachments
   * @private
   */
  async buildFullText(parsedEmail, onProgress = null) {
    let fullText = '';
    
    // Email headers
    if (parsedEmail.subject) fullText += `Subject: ${parsedEmail.subject}\n`;
    if (parsedEmail.from) fullText += `From: ${parsedEmail.from}\n`;
    if (parsedEmail.to) fullText += `To: ${parsedEmail.to}\n`;
    
    // Email body (limited to 10000 chars)
    fullText += `\nEmail Body:\n${parsedEmail.text.substring(0, 10000)}\n`;
    
    // Process attachments
    if (parsedEmail.attachments.length > 0) {
      fullText += `\n\n--- ATTACHMENTS (${parsedEmail.attachments.length}) ---\n`;
      
      let processedCount = 0;
      for (const att of parsedEmail.attachments) {
        fullText += `\n[${att.filename}] (${att.contentType}) - ${(att.content.length / 1024).toFixed(1)} KB\n`;
        
        // Extract text from PDF
        if (att.contentType.includes('pdf')) {
          if (onProgress) onProgress('attachment', `Extracting text from: ${att.filename}`, {
            filename: att.filename,
            current: processedCount + 1,
            total: parsedEmail.attachments.length
          });
          
          try {
            const pdfText = await pdfExtractor.extractText(att.content, att.filename);
            const limitedText = pdfText.substring(0, 10000);
            fullText += `\nExtracted text from ${att.filename}:\n${limitedText}\n`;
            if (pdfText.length > 10000) {
              fullText += `... (truncated from ${pdfText.length} chars)\n`;
            }
          } catch (error) {
            console.error(` Failed to extract PDF ${att.filename}:`, error.message);
            fullText += `[PDF extraction failed]\n`;
          }
        }
        // Extract text from text files
        else if (att.contentType.startsWith('text/')) {
          const textContent = att.content.toString('utf-8');
          const limitedText = textContent.substring(0, 10000);
          fullText += `\nContent:\n${limitedText}\n`;
        }
        
        processedCount++;
      }
    }
    
    return fullText;
  }
}

module.exports = new ExtractionService();
