const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs').promises;
const path = require('path');

/**
 * Document Generator Service
 * Generates Word documents from templates
 */
class DocumentGeneratorService {
  /**
   * Generate a PDP document from a template
   * @param {Buffer} templateBuffer - Word template file buffer
   * @param {Object} data - Placeholder data
   * @returns {Buffer} Generated document buffer
   */
  async generateDocument(templateBuffer, data) {
    try {
      // Load the template
      const zip = new PizZip(templateBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Set the template data
      doc.setData(data);

      // Render the document
      doc.render();

      // Get the generated document as a buffer
      const buffer = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });

      console.log('✅ Document generated successfully');
      return buffer;
    } catch (error) {
      console.error('❌ Document generation error:', error);
      
      if (error.properties && error.properties.errors) {
        const detailedError = error.properties.errors.map(e => 
          `${e.message} at ${e.stack}`
        ).join(', ');
        throw new Error(`Template error: ${detailedError}`);
      }
      
      throw new Error(`Document generation failed: ${error.message}`);
    }
  }

  /**
   * Remove empty technician rows from template data
   * @param {Object} data - Template data
   * @returns {Object} Cleaned data
   */
  cleanTemplateData(data) {
    const cleanedData = { ...data };
    
    // Remove empty technician placeholders
    for (let i = 1; i <= 10; i++) {
      const nameKey = `technician${i}_name`;
      const surnameKey = `technician${i}_surname`;
      
      if (!cleanedData[nameKey] || cleanedData[nameKey] === '') {
        delete cleanedData[nameKey];
        delete cleanedData[surnameKey];
      }
    }
    
    return cleanedData;
  }

  /**
   * Save generated document to PDP folder
   * @param {Buffer} documentBuffer - Generated document
   * @param {String} pdpId - PDP ID
   * @param {String} windfarmName - Windfarm name
   * @param {String} dataFolder - Data folder path
   * @returns {String} Saved file path
   */
  async saveGeneratedDocument(documentBuffer, pdpId, windfarmName, dataFolder) {
    try {
      const pdpFolder = path.join(dataFolder, pdpId);
      
      // Ensure PDP folder exists
      await fs.mkdir(pdpFolder, { recursive: true });
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `PDP_${windfarmName}_${timestamp}.docx`;
      const filepath = path.join(pdpFolder, filename);
      
      // Save the document
      await fs.writeFile(filepath, documentBuffer);
      
      console.log(`✅ Document saved: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('❌ Error saving document:', error);
      throw new Error(`Failed to save document: ${error.message}`);
    }
  }
}

module.exports = new DocumentGeneratorService();
