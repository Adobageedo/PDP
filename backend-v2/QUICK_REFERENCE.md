# ⚡ Quick Reference - PDP Backend v2

## 🚀 Start Server

```bash
cd /Users/edoardo/PDP/backend-v2
npm start
```

Server: `http://localhost:3001`

---

## 📡 API Endpoints

### 1. Extract Data

```bash
POST http://localhost:3001/api/extract
```

**Upload files:**
```bash
curl -X POST http://localhost:3001/api/extract \
  -F "files=@file1.eml" \
  -F "files=@file2.pdf"
```

**Supported formats:** `.eml`, `.pdf`, `.xlsx`, `.xls`, `.csv`, `.txt`

---

### 2. Generate PDP

```bash
POST http://localhost:3001/api/generate-pdp
```

**With custom template:**
```bash
curl -X POST http://localhost:3001/api/generate-pdp \
  -F "template=@template.docx" \
  -F "windfarmName=My Windfarm" \
  -F 'data={"company":{...},"workers":[...]}' \
  --output pdp.docx
```

**With default template:**
```bash
curl -X POST http://localhost:3001/api/generate-pdp \
  -H "Content-Type: application/json" \
  -d '{
    "windfarmName": "My Windfarm",
    "data": {...}
  }' \
  --output pdp.docx
```

---

## 📄 Template Placeholders

### Company
- `{company_name}`
- `{company_adress}`
- `{company_legal_representant_name}`
- `{company_legal_representant_phone}`
- `{company_legal_representant_email}`
- `{company_hse_responsible}`

### Workers (1-10)
- `{technician1_name}`, `{technician1_surname}`
- `{technician2_name}`, `{technician2_surname}`
- ... up to 10

### Windfarm
- `{windfarm_name}`

### Documents
- `{risk_analysis}` → "Oui"/"Non"
- `{operational_mode}` → "Oui"/"Non"

---

## 🔧 Common Commands

### Health Check
```bash
curl http://localhost:3001/health
```

### Test Everything
```bash
./test-api.sh
```

### View Logs
Server logs show real-time processing

### Stop Server
`Ctrl + C` in terminal

---

## 📊 JSON Structure

### Input (Extract)
Files → Upload

### Output (Extract)
```json
{
  "company": {
    "name": "...",
    "address": "...",
    "legal_representant_name": "...",
    "legal_representant_phone": "...",
    "legal_representant_email": "...",
    "hse_responsible": "..."
  },
  "workers": [
    {
      "first_name": "...",
      "last_name": "...",
      "phone": "...",
      "email": "...",
      "certifications": [...]
    }
  ],
  "risk_analysis": true/false,
  "operational_mode": true/false
}
```

### Input (Generate)
JSON + windfarmName + template

### Output (Generate)
.docx file

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port in use | `lsof -i :3001` then `kill -9 PID` |
| API key error | Check `.env` has `OPENAI_API_KEY` |
| Template error | Check placeholders: `{name}` not `{ name }` |
| PDF failed | Scanned PDFs use filename hints |

---

## 📁 File Locations

| Item | Path |
|------|------|
| Server | `/src/server.js` |
| Routes | `/src/routes/index.js` |
| LLM Service | `/src/services/llm.service.js` |
| File Extractor | `/src/services/fileExtractor.service.js` |
| Doc Generator | `/src/services/documentGenerator.service.js` |
| Template | `/templates/default-template.docx` |
| Config | `/.env` |

---

## ⚙️ Configuration

### .env Variables
```env
PORT=3001
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

### Change Port
```bash
PORT=3002 npm start
```

### Change Model
Edit `.env`: `OPENAI_MODEL=gpt-4`

---

## 🎯 Workflow

1. **Upload** files → `/api/extract`
2. **Review** JSON response
3. **Generate** document → `/api/generate-pdp`
4. **Download** .docx file

---

## 📞 Quick Help

- **Setup:** See `GETTING_STARTED.md`
- **API Docs:** See `README.md`
- **Test:** Run `./test-api.sh`
- **Logs:** Watch terminal output

---

**Server URL:** `http://localhost:3001`  
**Version:** 2.0.0  
**Status:** Ready ✅
