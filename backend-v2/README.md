# 🚀 PDP Backend v2 - Simplified & Improved

Clean, focused backend with **2 main routes**:
1. **Extract** - Extract data from files using LLM
2. **Generate PDP** - Create Word documents from templates

## 📋 Features

- ✅ Extract from **EML, PDF, XLSX, TXT** files
- ✅ Smart LLM-based data extraction
- ✅ Automatic certification detection
- ✅ Risk analysis & operational mode detection
- ✅ Word document generation from templates
- ✅ Placeholder replacement
- ✅ Empty row removal
- ✅ Network access ready

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd /Users/edoardo/PDP/backend-v2
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 3. Start Server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

Server runs on: `http://localhost:3001`

## 📡 API Routes

### Route 1: Extract Data

**POST** `/api/extract`

Extract structured data from uploaded files.

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `files` (array, max 10 files)
- Accepted formats: `.eml`, `.pdf`, `.xlsx`, `.xls`, `.csv`, `.txt`

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/extract \
  -F "files=@email.eml" \
  -F "files=@certification.pdf" \
  -F "files=@workers.xlsx"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "company": {
      "name": "Supair Vision",
      "address": "12 Rue des Éoliennes, 75015 Paris, France",
      "legal_representant_name": "Elie Amour",
      "legal_representant_phone": "+33 6 44 34 06 88",
      "legal_representant_email": "ea@supairvision.com",
      "hse_responsible": "Claire Dupont"
    },
    "workers": [
      {
        "first_name": "Elie",
        "last_name": "Amour",
        "phone": "+33 6 44 34 06 88",
        "email": "ea@supairvision.com",
        "certifications": [
          {
            "certification_type": "GWO",
            "certification_name": "GWO Working at Heights",
            "issue_date": "2023-05-15",
            "expiry_date": "2025-05-15"
          }
        ]
      }
    ],
    "risk_analysis": true,
    "operational_mode": false
  },
  "metadata": {
    "filesProcessed": 3,
    "textLength": 15234,
    "timestamp": "2025-01-30T14:30:00.000Z"
  }
}
```

### Route 2: Generate PDP

**POST** `/api/generate-pdp`

Generate a Word document from extracted data and template.

**Option A: With Template Upload**

- Content-Type: `multipart/form-data`
- Fields:
  - `template`: .docx file
  - `data`: JSON string (extracted data)
  - `windfarmName`: string

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/generate-pdp \
  -F "template=@my-template.docx" \
  -F "windfarmName=Parc Éolien de Fécamp" \
  -F 'data={"company":{"name":"Supair Vision",...},"workers":[...],...}' \
  --output generated-pdp.docx
```

**Option B: JSON Body (uses default template)**

- Content-Type: `application/json`

```bash
curl -X POST http://localhost:3001/api/generate-pdp \
  -H "Content-Type: application/json" \
  -d '{
    "windfarmName": "Parc Éolien de Fécamp",
    "data": {
      "company": {...},
      "workers": [...],
      "risk_analysis": true,
      "operational_mode": false
    }
  }' \
  --output generated-pdp.docx
```

**Response:**
- Binary .docx file
- Filename: `PDP_{windfarm}_{date}.docx`

## 📄 Template Placeholders

Your `.docx` template should use these placeholders:

### Company
- `{company_name}` - Company name
- `{company_adress}` - Address (note: single 'd')
- `{company_legal_representant_name}` - Legal representative
- `{company_legal_representant_phone}` - Phone
- `{company_legal_representant_email}` - Email
- `{company_hse_responsible}` - HSE responsible

### Workers/Technicians (1-10)
- `{technician1_name}` to `{technician10_name}` - Last names
- `{technician1_surname}` to `{technician10_surname}` - First names

### Windfarm
- `{windfarm_name}` - Windfarm name

### Documents
- `{risk_analysis}` - "Oui" or "Non"
- `{operational_mode}` - "Oui" or "Non"

**Note:** Empty technician rows are automatically removed!

## 🧪 Complete Workflow Example

### Step 1: Extract Data

```javascript
const formData = new FormData();
formData.append('files', emlFile);
formData.append('files', pdfFile);

const response = await fetch('http://localhost:3001/api/extract', {
  method: 'POST',
  body: formData
});

const { data } = await response.json();
```

### Step 2: Generate PDP

```javascript
const formData = new FormData();
formData.append('template', templateFile);
formData.append('windfarmName', 'Parc Éolien de Fécamp');
formData.append('data', JSON.stringify(data));

const response = await fetch('http://localhost:3001/api/generate-pdp', {
  method: 'POST',
  body: formData
});

const blob = await response.blob();
// Download or save the generated file
```

## 📁 Project Structure

```
backend-v2/
├── src/
│   ├── server.js                      # Express server
│   ├── routes/
│   │   └── index.js                   # API routes
│   └── services/
│       ├── llm.service.js             # LLM extraction
│       ├── fileExtractor.service.js   # File text extraction
│       └── documentGenerator.service.js # Word generation
├── templates/
│   └── default-template.docx          # Default PDP template
├── .env                               # Environment variables
├── package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables (.env)

```env
PORT=3001
NODE_ENV=development
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

## 📊 Supported File Types

| Type | Extensions | Processing |
|------|-----------|-----------|
| Email | `.eml` | Parse + extract attachments |
| PDF | `.pdf` | Text extraction + filename analysis |
| Excel | `.xlsx`, `.xls`, `.csv` | Sheet data extraction |
| Text | `.txt` | Direct read |

## 🤖 LLM Extraction Details

The LLM is instructed to:
- ✅ Extract company information
- ✅ Identify workers and certifications
- ✅ Parse expiry dates (multiple formats)
- ✅ Detect risk analysis documents
- ✅ Detect operational mode documents
- ✅ Use filename hints for scanned PDFs
- ✅ Handle missing data gracefully (null values)

### Date Formats Supported

- `31/12/2025`
- `2025-12-31`
- `December 31, 2025`
- `2025` (becomes `2025-12-31`)
- Various text patterns: "Valid until", "Expiry", "Valable jusqu'au", etc.

## 🧪 Testing

### Test Extraction

```bash
# Create test files in /tmp
echo "Test content" > /tmp/test.txt

# Test extraction
curl -X POST http://localhost:3001/api/extract \
  -F "files=@/tmp/test.txt"
```

### Test Generation

```bash
# Test with default template
curl -X POST http://localhost:3001/api/generate-pdp \
  -H "Content-Type: application/json" \
  -d '{
    "windfarmName": "Test Windfarm",
    "data": {
      "company": {
        "name": "Test Company",
        "address": "123 Test St",
        "legal_representant_name": "John Doe",
        "legal_representant_phone": "+33 1 23 45 67 89",
        "legal_representant_email": "john@test.com",
        "hse_responsible": "Jane Doe"
      },
      "workers": [
        {
          "first_name": "John",
          "last_name": "Smith",
          "phone": "+33 6 12 34 56 78",
          "email": "john.smith@test.com",
          "certifications": []
        }
      ],
      "risk_analysis": true,
      "operational_mode": false
    }
  }' \
  --output test-pdp.docx
```

## 🚨 Error Handling

All errors return JSON:

```json
{
  "error": "Error message here",
  "stack": "..." // Only in development mode
}
```

Common errors:
- `400` - Bad request (missing files/data)
- `500` - Server error (LLM failure, template error, etc.)

## 🌐 Network Access

Server listens on `0.0.0.0`, accessible from any device on your network:

```
http://YOUR_IP_ADDRESS:3001/api/extract
http://YOUR_IP_ADDRESS:3001/api/generate-pdp
```

## 🔒 Security Notes

- ⚠️ No authentication implemented (add if deploying publicly)
- ⚠️ No rate limiting (add for production)
- ⚠️ File size limited to 50MB per request
- ⚠️ Maximum 10 files per extraction request

## 📝 Logs

Server logs show:
- File processing status
- LLM token usage
- Extraction success/failure
- Document generation status

Example:
```
📥 Extracting data from 2 file(s)...
📄 Processing: email.eml
📄 Processing: cert.pdf
🤖 Analyzing with LLM...
✅ LLM extraction successful
   Company: Supair Vision
   Workers: 2
   Tokens: 3542
```

## 🎯 Next Steps

1. **Install**: `npm install`
2. **Configure**: Add OPENAI_API_KEY to `.env`
3. **Start**: `npm start`
4. **Test**: Use cURL examples above
5. **Integrate**: Connect your frontend

## 📞 Health Check

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "service": "PDP Backend v2",
  "version": "2.0.0"
}
```

---

**Version:** 2.0.0  
**Status:** ✅ Ready for Production  
**Dependencies:** Node.js ≥18, OpenAI API Key
