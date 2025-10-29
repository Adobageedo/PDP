# PDF Extraction Backend

Simple Express backend service for extracting text from PDF files.

## Setup

1. **Install dependencies:**
   ```bash
   cd backend-example
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

The server will run on `http://localhost:3001` by default.

## API Endpoints

### POST `/api/extract-pdf`
Extract text from a PDF file.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: PDF file with field name `file`

**Response:**
```json
{
  "success": true,
  "text": "Extracted text content...",
  "pageCount": 5,
  "filename": "document.pdf"
}
```

**Error Response:**
```json
{
  "error": "Failed to extract PDF text",
  "message": "Error details..."
}
```

### GET `/api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "PDF extraction backend"
}
```

## Frontend Configuration

Add to your `.env` file:
```
VITE_BACKEND_URL=http://localhost:3001
```

## Docker Deployment (Optional)

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t pdf-extraction-backend .
docker run -p 3001:3001 pdf-extraction-backend
```

## Dependencies

- **express**: Web framework
- **multer**: File upload handling
- **pdf-parse**: PDF text extraction
- **cors**: Cross-origin resource sharing
