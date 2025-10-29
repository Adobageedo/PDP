// Simple Express backend for PDF text extraction
// Install dependencies: npm install express multer pdf-parse cors

const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const cors = require('cors');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS for frontend
app.use(cors());

// PDF text extraction endpoint
app.post('/api/extract-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`📄 Extracting text from: ${req.file.originalname}`);
    
    // Extract text from PDF buffer
    const data = await pdf(req.file.buffer);
    const extractedText = data.text.trim();
    
    console.log(`✅ Extracted ${extractedText.length} chars from ${data.numpages} pages`);
    
    res.json({
      success: true,
      text: extractedText,
      pageCount: data.numpages,
      filename: req.file.originalname
    });
    
  } catch (error) {
    console.error('❌ PDF extraction error:', error);
    res.status(500).json({
      error: 'Failed to extract PDF text',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'PDF extraction backend' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 PDF extraction backend running on port ${PORT}`);
  console.log(`📍 Endpoint: http://localhost:${PORT}/api/extract-pdf`);
});
