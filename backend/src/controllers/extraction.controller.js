const extractionService = require('../services/extraction.service');
const { AppError } = require('../middleware/errorHandler');

/**
 * Process EML file and extract worker/company data
 */
exports.processEML = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    if (req.file.mimetype !== 'message/rfc822' && !req.file.originalname.endsWith('.eml')) {
      throw new AppError('File must be an EML file', 400);
    }

    console.log(`📧 Processing EML file: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);

    // Check if client wants SSE streaming
    const useStreaming = req.query.stream === 'true';

    if (useStreaming) {
      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Progress callback
      const sendProgress = (step, message, data = {}) => {
        res.write(`data: ${JSON.stringify({ step, message, ...data })}\n\n`);
      };

      try {
        // Process with progress updates
        const result = await extractionService.processEMLFile(
          req.file.buffer, 
          req.file.originalname,
          sendProgress
        );

        // Send final result
        res.write(`data: ${JSON.stringify({
          step: 'complete',
          success: true,
          data: result.data,
          metadata: {
            filename: req.file.originalname,
            processedAt: new Date().toISOString(),
            attachmentsProcessed: result.metadata.attachmentsProcessed,
            textLength: result.metadata.textLength
          }
        })}\n\n`);
        
        res.end();
      } catch (error) {
        res.write(`data: ${JSON.stringify({
          step: 'error',
          success: false,
          error: error.message
        })}\n\n`);
        res.end();
      }
    } else {
      // Regular JSON response (backwards compatible)
      const result = await extractionService.processEMLFile(req.file.buffer, req.file.originalname);

      console.log(`✅ Extraction complete: ${result.data.company?.name || 'N/A'} - ${result.data.workers?.length || 0} workers`);

      res.json({
        success: true,
        data: result.data,
        metadata: {
          filename: req.file.originalname,
          processedAt: new Date().toISOString(),
          attachmentsProcessed: result.metadata.attachmentsProcessed,
          textLength: result.metadata.textLength
        }
      });
    }

  } catch (error) {
    next(error);
  }
};
