const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const documentGeneratorService = require('../services/documentGenerator.service');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Data folder path
const DATA_FOLDER = process.env.DATA_FOLDER || path.join(__dirname, '../../../data');

/**
 * POST /api/pdp/generate-document
 * Generate a PDP document from a template
 */
router.post('/generate-document', upload.single('template'), async (req, res, next) => {
  try {
    const { pdpId, data: placeholderData } = req.body;
    const templateFile = req.file;

    if (!templateFile) {
      return res.status(400).json({ error: 'Template file is required' });
    }

    if (!pdpId || !placeholderData) {
      return res.status(400).json({ error: 'PDP ID and data are required' });
    }

    // Parse the placeholder data
    const data = JSON.parse(placeholderData);

    // Clean the template data (remove empty technicians)
    const cleanedData = documentGeneratorService.cleanTemplateData(data);

    // Generate the document
    const documentBuffer = await documentGeneratorService.generateDocument(
      templateFile.buffer,
      cleanedData
    );

    // Get PDP details to get windfarm name
    const pdpFolderPath = path.join(DATA_FOLDER, pdpId);
    const pdpMetaPath = path.join(pdpFolderPath, 'pdp_meta.json');
    
    let windfarmName = 'Unknown';
    try {
      const metaContent = await fs.readFile(pdpMetaPath, 'utf-8');
      const meta = JSON.parse(metaContent);
      windfarmName = meta.windfarm_name || 'Unknown';
    } catch (error) {
      console.warn('⚠️ Could not read PDP meta file');
    }

    // Save the generated document
    const savedPath = await documentGeneratorService.saveGeneratedDocument(
      documentBuffer,
      pdpId,
      windfarmName,
      DATA_FOLDER
    );

    // Update PDP meta with generated document path
    try {
      const metaContent = await fs.readFile(pdpMetaPath, 'utf-8');
      const meta = JSON.parse(metaContent);
      meta.generated_document_path = path.basename(savedPath);
      meta.updated_at = new Date().toISOString();
      await fs.writeFile(pdpMetaPath, JSON.stringify(meta, null, 2));
    } catch (error) {
      console.warn('⚠️ Could not update PDP meta file');
    }

    // Send the document back
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="PDP_${windfarmName}_${new Date().toISOString().split('T')[0]}.docx"`);
    res.send(documentBuffer);

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/pdp/:pdpId/download-document
 * Download the generated PDP document
 */
router.get('/:pdpId/download-document', async (req, res, next) => {
  try {
    const { pdpId } = req.params;

    const pdpFolderPath = path.join(DATA_FOLDER, pdpId);
    const pdpMetaPath = path.join(pdpFolderPath, 'pdp_meta.json');

    // Read PDP meta to get generated document path
    const metaContent = await fs.readFile(pdpMetaPath, 'utf-8');
    const meta = JSON.parse(metaContent);

    if (!meta.generated_document_path) {
      return res.status(404).json({ error: 'No generated document found for this PDP' });
    }

    const documentPath = path.join(pdpFolderPath, meta.generated_document_path);

    // Check if file exists
    try {
      await fs.access(documentPath);
    } catch (error) {
      return res.status(404).json({ error: 'Generated document file not found' });
    }

    // Send the file
    res.download(documentPath, path.basename(documentPath));

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/pdp/:pdpId/files
 * Get list of files in a PDP folder
 */
router.get('/:pdpId/files', async (req, res, next) => {
  try {
    const { pdpId } = req.params;
    const pdpFolderPath = path.join(DATA_FOLDER, pdpId);

    // Read directory contents
    const files = await fs.readdir(pdpFolderPath);
    
    // Get file stats
    const fileDetails = await Promise.all(
      files.map(async (filename) => {
        const filepath = path.join(pdpFolderPath, filename);
        const stats = await fs.stat(filepath);
        
        return {
          filename,
          size: stats.size,
          created_at: stats.birthtime,
          modified_at: stats.mtime,
          is_directory: stats.isDirectory(),
        };
      })
    );

    res.json({ files: fileDetails });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
