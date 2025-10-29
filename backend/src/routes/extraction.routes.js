const express = require('express');
const router = express.Router();
const multer = require('multer');
const extractionController = require('../controllers/extraction.controller');

// Configure multer for file uploads (store in memory)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

/**
 * POST /api/extraction/process-eml
 * Upload and process an EML file
 * Returns extracted company and worker data
 */
router.post('/process-eml', upload.single('file'), extractionController.processEML);

module.exports = router;
