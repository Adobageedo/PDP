# System Dependencies for PDF-to-Image Conversion

The backend uses `pdf2pic` which requires **GraphicsMagick** and **Ghostscript** to convert scanned PDFs to images for GPT-4 Vision OCR.

## Mac (using Homebrew)

```bash
brew install graphicsmagick ghostscript
```

## Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install -y graphicsmagick ghostscript
```

## Linux (CentOS/RHEL)

```bash
sudo yum install -y GraphicsMagick ghostscript
```

## Verify Installation

After installing, verify the tools are available:

```bash
gm version
gs --version
```

## Then Install Node Dependencies

```bash
cd backend
npm install
```

## Without System Dependencies

If you cannot install GraphicsMagick/Ghostscript, the system will fall back to:
1. Filename parsing (extracts dates/names from filenames like "GWO-WAH_Elie_2025.pdf")
2. Limited extraction for scanned PDFs

## Production Deployment

For production (Docker/Cloud):

### Dockerfile Example:
```dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache graphicsmagick ghostscript

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 3001
CMD ["node", "src/server.js"]
```

### Docker Compose:
```yaml
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
```

## Cost Warning ⚠️

GPT-4 Vision OCR is used as a **last resort** for scanned PDFs and **consumes API credits**.

- Each page image sent to GPT-4o costs tokens
- Default: Processes only first page of each scanned PDF
- To process more pages, edit `pdfExtractor.service.js` line 199
