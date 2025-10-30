const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

class DocumentGeneratorService {
  /**
   * Generate PDP document from template
   */
  async generatePDP(templateBuffer, data, windfarmName) {
    try {
      // Prepare placeholders
      const placeholders = this.preparePlaceholders(data, windfarmName);
      
      // Load template
      const zip = new PizZip(templateBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Set data
      doc.setData(placeholders);

      // Render
      doc.render();

      // Generate buffer
      const buffer = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });

      console.log('✅ PDP document generated successfully');
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
   * Prepare placeholders from extracted data
   */
  preparePlaceholders(data, windfarmName) {
    const placeholders = {
      windfarm_name: windfarmName || '',
    };

    // Company data
    if (data.company) {
      placeholders.company_name = data.company.name || '';
      placeholders.company_adress = data.company.address || ''; // Note: single 'd' as in template
      placeholders.company_legal_representant_name = data.company.legal_representant_name || '';
      placeholders.company_legal_representant_phone = data.company.legal_representant_phone || '';
      placeholders.company_legal_representant_email = data.company.legal_representant_email || '';
      placeholders.company_hse_responsible = data.company.hse_responsible || '';
    }

    // Workers/Technicians data (up to 10)
    const workers = data.workers || [];
    for (let i = 1; i <= 10; i++) {
      if (i <= workers.length) {
        const worker = workers[i - 1];
        placeholders[`technician${i}_name`] = worker.last_name || '';
        placeholders[`technician${i}_surname`] = worker.first_name || '';
      } else {
        // Empty placeholders will be handled by removing rows
        placeholders[`technician${i}_name`] = '';
        placeholders[`technician${i}_surname`] = '';
      }
    }

    // Documents flags
    placeholders.risk_analysis = data.risk_analysis ? 'Oui' : 'Non';
    placeholders.operational_mode = data.operational_mode ? 'Oui' : 'Non';

    // Remove empty technician entries
    return this.cleanEmptyTechnicians(placeholders);
  }

  /**
   * Clean empty technician placeholders
   */
  cleanEmptyTechnicians(placeholders) {
    const cleaned = { ...placeholders };
    
    for (let i = 1; i <= 10; i++) {
      const nameKey = `technician${i}_name`;
      const surnameKey = `technician${i}_surname`;
      
      if (!cleaned[nameKey] || cleaned[nameKey] === '') {
        delete cleaned[nameKey];
        delete cleaned[surnameKey];
      }
    }
    
    return cleaned;
  }

  /**
   * Create filename for generated PDP
   */
  createFilename(windfarmName) {
    const date = new Date().toISOString().split('T')[0];
    const safeName = windfarmName.replace(/[^a-zA-Z0-9]/g, '_');
    return `PDP_${safeName}_${date}.docx`;
  }
}

module.exports = new DocumentGeneratorService();
