# 🚀 Getting Started - PDP Backend v2

## Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
cd /Users/edoardo/PDP/backend-v2
npm install
```

Expected output:
```
added 147 packages, and audited 148 packages in 12s
```

### Step 2: Create .env File

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```env
OPENAI_API_KEY=sk-proj-your-key-here
```

### Step 3: Start Server

```bash
npm start
```

You should see:
```
🚀 PDP Backend v2 running on port 3001
📍 API: http://localhost:3001/api
💚 Health: http://localhost:3001/health
🌐 Network: http://YOUR_IP:3001/api
```

### Step 4: Test It!

```bash
# Test health endpoint
curl http://localhost:3001/health

# Run full test suite
./test-api.sh
```

✅ **You're ready!**

---

## 📖 Detailed Guide

### Understanding the Two Routes

#### Route 1: `/api/extract` - Data Extraction

**What it does:**
- Accepts multiple files (EML, PDF, XLSX, TXT)
- Extracts text from all files
- Uses OpenAI LLM to identify:
  - Company information
  - Workers and their certifications
  - Risk analysis presence
  - Operational mode presence

**When to use:**
- Upload worker certification PDFs
- Process email attachments
- Extract data from Excel sheets
- Combine multiple data sources

**Example:**
```bash
curl -X POST http://localhost:3001/api/extract \
  -F "files=@email.eml" \
  -F "files=@cert1.pdf" \
  -F "files=@cert2.pdf"
```

#### Route 2: `/api/generate-pdp` - Document Generation

**What it does:**
- Takes extracted data JSON
- Takes windfarm name
- Takes template file (or uses default)
- Generates filled PDP Word document

**When to use:**
- After extracting data
- To create final PDP documents
- To regenerate with updated data

**Example:**
```bash
curl -X POST http://localhost:3001/api/generate-pdp \
  -F "template=@my-template.docx" \
  -F "windfarmName=Parc Éolien de Fécamp" \
  -F 'data={"company":{...},"workers":[...]}' \
  --output pdp.docx
```

---

## 🎯 Real-World Workflow

### Scenario: Creating a PDP from Email

**Step 1: Receive Email**
You receive an email with:
- Worker certification PDFs attached
- Company information in body
- Risk analysis document

**Step 2: Extract Data**
```bash
curl -X POST http://localhost:3001/api/extract \
  -F "files=@worker-email.eml" \
  > extracted-data.json
```

**Step 3: Review Data**
```bash
cat extracted-data.json | json_pp
```

Check that:
- ✅ Company name is correct
- ✅ All workers are listed
- ✅ Certifications have expiry dates
- ✅ Risk analysis detected

**Step 4: Generate PDP**
```bash
curl -X POST http://localhost:3001/api/generate-pdp \
  -F "template=@my-template.docx" \
  -F "windfarmName=Parc Éolien de Fécamp" \
  -F "data=@extracted-data.json" \
  --output PDP_Fecamp_$(date +%Y-%m-%d).docx
```

**Step 5: Done!**
Open the generated `.docx` file and verify.

---

## 🔧 Customization

### Using a Custom Template

1. Create your `.docx` template with placeholders:
   - `{company_name}`
   - `{technician1_name}`, `{technician1_surname}`
   - etc.

2. Use it in API call:
```bash
curl -X POST http://localhost:3001/api/generate-pdp \
  -F "template=@my-custom-template.docx" \
  -F "windfarmName=My Windfarm" \
  -F 'data={...}'
```

### Modifying LLM Behavior

Edit: `/src/services/llm.service.js`

Change the prompt to:
- Extract additional fields
- Change date parsing logic
- Add new certification types
- Customize output format

### Adding File Type Support

Edit: `/src/services/fileExtractor.service.js`

Add new file type handler:
```javascript
case '.doc':
  return await this.extractFromDOC(buffer, filename);
```

---

## 🧪 Testing

### Manual Testing

**Test Extraction:**
```bash
# Create sample text file
echo "Company: Test Corp
Worker: John Doe
Email: john@test.com
Certification: GWO - Valid until 2025-12-31" > test.txt

# Extract
curl -X POST http://localhost:3001/api/extract \
  -F "files=@test.txt"
```

**Test Generation:**
```bash
./test-api.sh
# Opens generated test-generated.docx
```

### Automated Testing

Create a test script:
```javascript
// test.js
const FormData = require('form-data');
const fs = require('fs');

async function testExtraction() {
  const form = new FormData();
  form.append('files', fs.createReadStream('test.txt'));
  
  const response = await fetch('http://localhost:3001/api/extract', {
    method: 'POST',
    body: form
  });
  
  const data = await response.json();
  console.log('Extracted:', data);
}

testExtraction();
```

---

## 🐛 Troubleshooting

### Issue: "OPENAI_API_KEY not found"

**Solution:**
```bash
# Check .env file exists
ls -la .env

# Verify content
cat .env | grep OPENAI_API_KEY

# Add if missing
echo "OPENAI_API_KEY=sk-your-key" >> .env
```

### Issue: "Port 3001 already in use"

**Solution:**
```bash
# Find process using port
lsof -i :3001

# Kill it
kill -9 <PID>

# Or use different port
PORT=3002 npm start
```

### Issue: "Template error: Unclosed tag"

**Solution:**
- Check your template for matching `{` and `}`
- Ensure placeholders are exactly: `{placeholder_name}`
- No spaces: `{ placeholder }` ❌ vs `{placeholder}` ✅

### Issue: "LLM extraction failed"

**Solutions:**
1. Check OpenAI API key is valid
2. Verify account has credits
3. Check file contains extractable text
4. Try with simpler test file

### Issue: "PDF extraction failed"

**Possible causes:**
- Scanned PDF (no text layer)
- Encrypted PDF
- Corrupted file

**Solution:**
- LLM will use filename hints instead
- Check logs for specific error
- Try OCR tool first

---

## 📊 Understanding the Output

### Extraction Response

```json
{
  "success": true,
  "data": {
    "company": {...},      // Extracted company
    "workers": [...],      // Array of workers
    "risk_analysis": true, // Document presence
    "operational_mode": false
  },
  "metadata": {
    "filesProcessed": 3,   // Number of files
    "textLength": 15234,   // Total characters
    "timestamp": "..."     // ISO date
  }
}
```

### What each field means:

- **company.name**: Main contractor name
- **company.legal_representant_name**: Person signing PDP
- **workers**: Technicians who will work on site
- **certifications**: Safety/technical certifications
  - **expiry_date**: CRITICAL for compliance
- **risk_analysis**: true if risk document detected
- **operational_mode**: true if procedure document detected

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Add authentication (JWT, API keys)
- [ ] Add rate limiting
- [ ] Validate file types strictly
- [ ] Scan uploads for malware
- [ ] Use HTTPS only
- [ ] Hide error stack traces
- [ ] Add request logging
- [ ] Limit file sizes
- [ ] Add CORS restrictions
- [ ] Encrypt sensitive data

---

## 📈 Performance Tips

### Optimize LLM Calls

- Use `gpt-4o-mini` for cost-effectiveness
- Batch multiple files in one request
- Cache results when possible

### Reduce Memory Usage

- Stream large files
- Delete temp files after processing
- Limit concurrent requests

### Speed Up Processing

- Use `gpt-3.5-turbo` for faster responses
- Process files in parallel
- Pre-process PDFs offline

---

## 🚀 Next Steps

1. **Integrate with Frontend**
   - Build upload UI
   - Display extracted data
   - Download generated PDFs

2. **Add Database**
   - Store extraction history
   - Track PDPs
   - Worker management

3. **Add Features**
   - Email notifications
   - Batch processing
   - PDF export
   - Digital signatures

4. **Deploy**
   - Docker container
   - Cloud hosting (AWS, Azure, etc.)
   - CI/CD pipeline

---

## 📚 Additional Resources

- [Docxtemplater Docs](https://docxtemplater.com/)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [Multer File Uploads](https://github.com/expressjs/multer)

---

## ✅ Checklist

Setup:
- [ ] Dependencies installed
- [ ] .env configured with API key
- [ ] Server starts successfully
- [ ] Health check responds

Testing:
- [ ] Extraction works with sample file
- [ ] Generation creates valid .docx
- [ ] Placeholders are replaced
- [ ] Empty rows removed

Ready for use:
- [ ] Template customized
- [ ] LLM prompt tuned
- [ ] Error handling tested
- [ ] Documentation reviewed

---

**Need help?** Check the logs or create an issue.

**Ready to integrate?** See `README.md` for API details.
