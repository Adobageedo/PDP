const express = require('express');
const router = express.Router();
const multer = require('multer');
const fileExtractor = require('../services/fileExtractor.service');
const llmService = require('../services/llm.service');
const documentGenerator = require('../services/documentGenerator.service');
const fs = require('fs').promises;
const path = require('path');

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

/**
 * POST /api/extract
 * Extract data from uploaded files using LLM
 * 
 * Accepts: Multiple files (.eml, .pdf, .xlsx, .txt)
 * Returns: Extracted JSON data
 */
router.post('/extract', upload.array('files', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log(`📥 Extracting data from ${req.files.length} file(s)...`);

    // Extract text from all files
    let combinedText = '';
    
    for (const file of req.files) {
      console.log(`📄 Processing: ${file.originalname}`);
      
      try {
        const extractedText = await fileExtractor.extractFromFile(
          file.buffer,
          file.originalname
        );
        combinedText += `\n\n=== FILE: ${file.originalname} ===\n${extractedText}\n`;
      } catch (error) {
        console.error(`⚠️ Error extracting ${file.originalname}:`, error.message);
        combinedText += `\n\n=== FILE: ${file.originalname} ===\n[Extraction failed: ${error.message}]\n`;
      }
    }

    // Use LLM to extract structured data
    console.log('🤖 Analyzing with LLM...');
    const extractedData = await llmService.extractPDPData(combinedText);

    // Return extracted data
    res.json({
      success: true,
      data: extractedData,
      metadata: {
        filesProcessed: req.files.length,
        textLength: combinedText.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/generate-pdp
 * Generate PDP Word document from template
 * 
 * Body: {
 *   data: { extracted data JSON },
 *   windfarmName: string,
 *   templatePath: string (optional)
 * }
 * 
 * OR with file upload:
 * - template: .docx file
 * - data: JSON string
 * - windfarmName: string
 * 
 * Returns: Generated .docx file
 */
router.post('/generate-pdp', upload.single('template'), async (req, res, next) => {
  try {
    let data, windfarmName, templateBuffer;

    // Check if template file was uploaded
    if (req.file) {
      // Multipart form data
      data = JSON.parse(req.body.data);
      windfarmName = req.body.windfarmName;
      templateBuffer = req.file.buffer;
    } else {
      // JSON body
      data = req.body.data;
      windfarmName = req.body.windfarmName;
      
      // Use provided template path or default
      const templatePath = req.body.templatePath || path.join(__dirname, '../../templates/default-template.docx');
      templateBuffer = await fs.readFile(templatePath);
    }

    if (!data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (!windfarmName) {
      return res.status(400).json({ error: 'Missing windfarmName' });
    }

    console.log(`📝 Generating PDP for: ${windfarmName}`);

    // Generate document
    const docBuffer = await documentGenerator.generatePDP(
      templateBuffer,
      data,
      windfarmName
    );

    // Create filename
    const filename = documentGenerator.createFilename(windfarmName);

    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(docBuffer);

    console.log(`✅ PDP generated: ${filename}`);

  } catch (error) {
    next(error);
  }
});

module.exports = router;
