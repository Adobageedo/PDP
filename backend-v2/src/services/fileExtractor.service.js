const { simpleParser } = require('mailparser');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf');
const xlsx = require('xlsx');

class FileExtractorService {
  /**
   * Extract text from EML file
   */
  async extractFromEML(buffer) {
    try {
      const parsed = await simpleParser(buffer);
      
      let fullText = `Email Subject: ${parsed.subject || ''}\n`;
      fullText += `From: ${parsed.from?.text || ''}\n\n`;
      fullText += `Body:\n${parsed.text || parsed.html || ''}\n\n`;
      
      // Process attachments
      if (parsed.attachments && parsed.attachments.length > 0) {
        fullText += `\n=== ATTACHMENTS (${parsed.attachments.length}) ===\n`;
        
        for (const attachment of parsed.attachments) {
          const filename = attachment.filename;
          fullText += `\n--- Attachment: ${filename} ---\n`;
          
          // Extract from PDF attachments
          if (filename.toLowerCase().endsWith('.pdf')) {
            try {
              const pdfText = await this.extractFromPDF(attachment.content, filename);
              fullText += pdfText;
            } catch (error) {
              console.error(`Error extracting PDF ${filename}:`, error.message);
              fullText += `[PDF extraction failed]\n`;
              fullText += `Filename indicates: ${this.extractInfoFromFilename(filename)}\n`;
            }
          } else if (filename.toLowerCase().match(/\.(xlsx?|csv)$/)) {
            try {
              const xlsxText = await this.extractFromExcel(attachment.content);
              fullText += xlsxText;
            } catch (error) {
              console.error(`Error extracting Excel ${filename}:`, error.message);
              fullText += `[Excel extraction failed]\n`;
            }
          } else {
            fullText += `Filename indicates: ${this.extractInfoFromFilename(filename)}\n`;
          }
        }
      }
      
      return fullText;
    } catch (error) {
      throw new Error(`EML extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF
   */
  async extractFromPDF(buffer, filename = 'document.pdf') {
    try {
      const uint8Array = new Uint8Array(buffer);
      const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
      const pdf = await loadingTask.promise;
      
      let fullText = `PDF: ${filename}\n`;
      fullText += `Filename indicates: ${this.extractInfoFromFilename(filename)}\n\n`;
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += `Page ${pageNum}:\n${pageText}\n\n`;
      }
      
      return fullText;
    } catch (error) {
      console.error(`PDF extraction error for ${filename}:`, error.message);
      return `[Scanned PDF - text extraction not possible]\nFilename indicates: ${this.extractInfoFromFilename(filename)}\n`;
    }
  }

  /**
   * Extract text from Excel/CSV
   */
  async extractFromExcel(buffer) {
    try {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      let text = '';
      
      workbook.SheetNames.forEach(sheetName => {
        text += `\n=== Sheet: ${sheetName} ===\n`;
        const sheet = workbook.Sheets[sheetName];
        const csv = xlsx.utils.sheet_to_csv(sheet);
        text += csv + '\n';
      });
      
      return text;
    } catch (error) {
      throw new Error(`Excel extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from TXT file
   */
  async extractFromTXT(buffer) {
    return buffer.toString('utf-8');
  }

  /**
   * Extract information from filename
   */
  extractInfoFromFilename(filename) {
    const parts = filename.split(/[_\-\.]/);
    const info = [];
    
    // Look for certification types
    if (filename.match(/GWO/i)) info.push('GWO certification');
    if (filename.match(/H0B0|H0V|B0V/i)) info.push('Electrical habilitation');
    if (filename.match(/First.*Aid|SST/i)) info.push('First Aid');
    if (filename.match(/WAH|Working.*at.*Heights/i)) info.push('Working at Heights');
    if (filename.match(/BST/i)) info.push('BST Safety Training');
    if (filename.match(/IRATA/i)) info.push('IRATA');
    
    // Look for years (possible expiry dates)
    const years = filename.match(/20\d{2}/g);
    if (years) {
      info.push(`Implied expiry year: ${years[years.length - 1]}`);
    }
    
    // Look for names
    const nameParts = parts.filter(p => p.length > 2 && /^[a-zA-Z]+$/.test(p));
    if (nameParts.length > 0) {
      info.push(`Possible name: ${nameParts.join(' ')}`);
    }
    
    return info.join(', ') || 'No specific information extracted from filename';
  }

  /**
   * Route files to appropriate extractor
   */
  async extractFromFile(buffer, filename) {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    switch (ext) {
      case '.eml':
        return await this.extractFromEML(buffer);
      case '.pdf':
        return await this.extractFromPDF(buffer, filename);
      case '.xlsx':
      case '.xls':
      case '.csv':
        return await this.extractFromExcel(buffer);
      case '.txt':
        return await this.extractFromTXT(buffer);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }
}

module.exports = new FileExtractorService();
