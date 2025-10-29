# Wind Farm Data Extraction System

**Clean Architecture** - Professional full-stack application for automated extraction of worker and company data from EML files with PDF attachments using AI (OpenAI GPT-4).

## 🏗️ Architecture Overview

```
┌─────────────────┐         ┌──────────────────────────┐
│                 │   EML   │                          │
│    FRONTEND     │─────────▶    BACKEND API          │
│   (React/Vite)  │         │    (Express/Node.js)     │
│                 │◀─────────│                          │
└─────────────────┘  JSON   │  ┌────────────────────┐  │
                             │  │  EML Parser        │  │
                             │  │  PDF Extractor     │  │
                             │  │  LLM Service       │  │
                             │  └────────────────────┘  │
                             │           │              │
                             │           ▼              │
                             │    OpenAI GPT-4o-mini    │
                             └──────────────────────────┘
```

### Why This Architecture?

✅ **Separation of Concerns**: Frontend handles UI, backend handles business logic
✅ **Security**: OpenAI API key stays on server
✅ **Performance**: Heavy processing (PDF extraction, LLM) happens server-side
✅ **Scalability**: Can easily add caching, queues, multiple workers
✅ **Maintainability**: Clean service-oriented architecture

## Features

### 📧 Email Processing
- **EML file upload** - Extract email content and attachments
- **Attachment processing** - Automatically extract text from PDF attachments
- **Multi-format support** - Handle text, PDF, and image attachments

### 🤖 AI-Powered Extraction
- **OpenAI GPT-4** - Intelligent data extraction from documents
- **Vision GPT** - OCR for scanned PDFs and images
- **Structured JSON output** - Company info, workers, and certifications

### 👷 Worker & Certification Management
- **Company tracking** - Store company details and contact information
- **Worker profiles** - Manage worker information and assignments
- **Certification monitoring** - Track expiry dates and status
- **Alert system** - Automatic alerts for expired/expiring certifications

### 📄 Word Template Generation
- **Auto-fill templates** - Replace placeholders with extracted data
- **Custom templates** - Upload your own .docx templates
- **Professional output** - Generate formatted PDP documents

### 💾 Data Storage
- **LocalStorage JSON** - No database required, runs entirely in browser
- **Export functionality** - Export to Excel format
- **Data persistence** - All data stored locally

## Tech Stack

- **Frontend**: React 18.3 + TypeScript
- **Build**: Vite 5.4
- **Styling**: TailwindCSS 3.4
- **Icons**: Lucide React
- **AI**: OpenAI API (GPT-4, GPT-4 Vision)
- **PDF**: pdf-parse
- **Email**: mailparser
- **Word**: docxtemplater + pizzip

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file:

```bash
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

Get your OpenAI API key from: https://platform.openai.com/api-keys

### 3. Prepare Word Template

Create a `.docx` template with placeholders using this format:

```
Entreprise: {company.name}
Adresse: {company.address}
Téléphone: {company.phone}
Email: {company.email}
Représentant légal: {company.legal_representative}
Responsable HSE: {company.hse_responsible}

Intervenants:
{#workers}
- {full_name} ({phone}, {email})
  Habilitations:
  {#certifications}
  * {certification_name} ({certification_type})
    Délivrée le: {issue_date}
    Expire le: {expiry_date}
    Statut: {status}
  {/certifications}
{/workers}

Document généré le: {generation_date}
```

### 4. Run Development Server

```bash
npm run dev
```

## Usage Workflow

### Step 1: Upload EML File
1. Click "Import" tab
2. Drag & drop or select an `.eml` file
3. System will:
   - Extract email body text
   - Extract all attachments
   - Parse PDF attachments
   - Use Vision GPT for scanned/image PDFs
   - Send all content to GPT-4 for structured extraction

### Step 2: Review Extracted Data
1. Review company information
2. Check worker names and details
3. Verify certification names and expiry dates
4. Make manual corrections if needed
5. Click "Accepter" to save data

### Step 3: Generate Word Document
1. Upload your Word template (.docx)
2. Click "Générer Document"
3. System will:
   - Replace all placeholders with extracted data
   - Format dates in French locale
   - Generate downloadable .docx file

### Step 4: Monitor Certifications
1. View all workers and certifications in "Intervenants" tab
2. Check alert panel for expired/expiring certifications
3. Export data to Excel if needed

## Project Structure

```
src/
├── components/          # React components
│   ├── AlertPanel.tsx          # Certification alerts display
│   ├── CertificationTable.tsx  # Workers & certifications table
│   ├── DataReview.tsx          # Review extracted data
│   └── FileUpload.tsx          # File upload interface
├── services/           # Business logic
│   ├── dataService.ts          # LocalStorage JSON operations
│   ├── emailParser.ts          # EML parsing + attachments
│   ├── pdfExtractor.ts         # PDF text + Vision GPT fallback
│   ├── llm.ts                  # OpenAI API wrapper
│   ├── llmExtractionService.ts # Data extraction orchestration
│   └── wordTemplateGenerator.ts # Word doc generation
├── utils/              # Utilities
│   ├── certificationValidator.ts  # Validation & status
│   ├── exportUtils.ts             # Excel export
│   └── fileParser.ts              # File type routing
└── types/              # TypeScript interfaces
    └── index.ts
```

## Data Model

### Company
```typescript
{
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  legal_representative?: string;
  hse_responsible?: string;
}
```

### Worker
```typescript
{
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  certifications: Certification[];
}
```

### Certification
```typescript
{
  id: string;
  worker_id: string;
  certification_type: string;
  certification_name: string;
  issue_date?: string;
  expiry_date: string;
  status: 'valid' | 'expired' | 'expiring_soon';
}
```

## Development

### Available Scripts

```bash
npm run dev         # Start dev server
npm run build       # Build for production
npm run lint        # Run ESLint
npm run typecheck   # TypeScript validation
npm run preview     # Preview production build
```

### Adding Custom Extraction Logic

Edit `src/services/llmExtractionService.ts`:

```typescript
const EXTRACTION_PROMPT = `...your custom instructions...`;
```

### Customizing Template Variables

Modify `src/services/wordTemplateGenerator.ts` > `prepareTemplateData()` function.

## Troubleshooting

### PDF Extraction Fails
- Ensure OpenAI API key is set
- Check if PDF is text-based or scanned (system auto-detects)
- For scanned PDFs, Vision GPT will be used automatically

### Template Generation Errors
- Verify template placeholders match data structure
- Check console for specific errors
- Ensure all required fields have values

### Data Not Saving
- Check browser console for errors
- Verify LocalStorage is not full
- Clear browser storage if needed: `localStorage.clear()`

## API Costs

- **GPT-4**: ~$0.03-0.06 per request (varies by content length)
- **GPT-4 Vision**: ~$0.01-0.05 per image/PDF page
- Monitor usage at: https://platform.openai.com/usage

## Security Notes

- ⚠️ API key is exposed in browser (use for internal tools only)
- All data stored in browser LocalStorage
- No server-side storage
- Consider implementing backend API for production use

## License

MIT

## Support

For issues or questions, contact the development team.
