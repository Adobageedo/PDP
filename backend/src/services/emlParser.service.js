const { simpleParser } = require('mailparser');

/**
 * EML Parser Service
 * Parses EML files and extracts email content and attachments
 */
class EMLParserService {
  /**
   * Parse EML buffer and extract structured data
   * @param {Buffer} emlBuffer - EML file buffer
   * @returns {Object} Parsed email data with attachments
   */
  async parseEML(emlBuffer) {
    try {
      const parsed = await simpleParser(emlBuffer);
      
      const result = {
        subject: parsed.subject || '',
        from: parsed.from?.text || '',
        to: parsed.to?.text || '',
        text: parsed.text || '',
        html: parsed.html || undefined,
        attachments: []
      };
      
      // Process attachments
      if (parsed.attachments && parsed.attachments.length > 0) {
        console.log(`📎 Found ${parsed.attachments.length} attachments`);
        
        for (const att of parsed.attachments) {
          // Only process document attachments
          if (this.isDocumentAttachment(att.filename, att.contentType)) {
            result.attachments.push({
              filename: att.filename,
              contentType: att.contentType,
              content: att.content,
              size: att.size
            });
            console.log(`  ✓ ${att.filename} (${att.contentType}) - ${(att.size / 1024).toFixed(1)} KB`);
          } else {
            console.log(`  ⏭️ Skipping: ${att.filename || 'unnamed'} (${att.contentType})`);
          }
        }
      }
      
      console.log(`✅ EML parsed: ${result.subject}`);
      console.log(`   Body length: ${result.text.length} chars`);
      console.log(`   Attachments: ${result.attachments.length}`);
      
      return result;
    } catch (error) {
      console.error('❌ EML parsing error:', error);
      throw new Error(`Failed to parse EML: ${error.message}`);
    }
  }

  /**
   * Check if attachment is a document we want to process
   * @private
   */
  isDocumentAttachment(filename, contentType) {
    if (!filename) return false;
    
    const supportedExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i;
    return supportedExtensions.test(filename);
  }
}

module.exports = new EMLParserService();
