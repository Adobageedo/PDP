# Wind Farm Data Extraction - Backend API

Clean architecture backend for processing EML files and extracting wind farm worker data using OpenAI GPT-4.

## 🏗️ Architecture

```
backend/
├── src/
│   ├── server.js                 # Application entry point
│   ├── routes/                   # API routes
│   │   ├── index.js
│   │   └── extraction.routes.js
│   ├── controllers/              # Request handlers
│   │   └── extraction.controller.js
│   ├── services/                 # Business logic
│   │   ├── extraction.service.js # Main orchestration
│   │   ├── emlParser.service.js  # EML parsing
│   │   ├── pdfExtractor.service.js # PDF text extraction
│   │   └── llm.service.js        # OpenAI integration
│   └── middleware/               # Express middleware
│       └── errorHandler.js
├── package.json
└── .env.example
```

## 🚀 Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

3. **Start server:**
   ```bash
   # Development (with auto-reload)
   npm run dev
   
   # Production
   npm start
   ```

## 📡 API Endpoints

### POST `/api/extraction/process-eml`

Process an EML file and extract worker/company data.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: EML file with field name `file`

**Response:**
```json
{
  "success": true,
  "data": {
    "company": {
      "name": "Supairvision",
      "address": "2 rue Gustave Eiffel, 10430 Rosière près Troyes, France",
      "phone": "+33 (0)3 25 78 08 53",
      "email": "ml@supairvision.com",
      "legal_representative": "Matthieu Ladoire",
      "hse_responsible": null
    },
    "workers": [
      {
        "first_name": "Elie",
        "last_name": "Amour",
        "phone": "06.44.34.06.88",
        "email": "ea@supairvision.com",
        "certifications": [
          {
            "certification_type": "GWO",
            "certification_name": "Working at Heights",
            "issue_date": null,
            "expiry_date": "2025-12-31"
          }
        ]
      }
    ]
  },
  "metadata": {
    "filename": "Planning.eml",
    "processedAt": "2025-10-29T18:00:00.000Z",
    "attachmentsProcessed": 8,
    "textLength": 15234
  }
}
```

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "Wind Farm Data Extraction API",
  "version": "1.0.0"
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Test with curl
curl -X POST http://localhost:3001/api/extraction/process-eml \
  -F "file=@/path/to/email.eml"
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `OPENAI_MODEL` | Model to use | gpt-4o-mini |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |

## 📦 Dependencies

- **express**: Web framework
- **mailparser**: EML file parsing
- **pdf-parse**: PDF text extraction
- **openai**: OpenAI API client
- **multer**: File upload handling
- **cors**: Cross-origin resource sharing
- **helmet**: Security headers
- **morgan**: HTTP request logger

## 🛡️ Error Handling

All errors are handled centrally and returned in the format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

## 📝 Logging

Console logs provide detailed information about each processing step:
```
📧 Processing EML file: Planning.eml (1245.2 KB)
📧 [1/3] Parsing EML file...
📎 Found 8 attachments
📎 [2/3] Processing 8 attachments...
  📄 Extracting text from: GWO-WAH_Elie Amour.pdf
  ✅ Extracted 1234 chars from 2 pages
🤖 [3/3] Extracting data with LLM...
✅ LLM extraction successful
   Company: Supairvision
   Workers: 4
   Tokens used: 1748
✅ Extraction complete: Supairvision - 4 workers
```
