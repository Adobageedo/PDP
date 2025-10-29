# 🚀 Setup Guide - Wind Farm Data Extraction System

Complete setup instructions for the clean architecture deployment.

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **OpenAI API Key** (get from https://platform.openai.com/)

## 📁 Project Structure

```
PDP/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── server.js       # Entry point
│   │   ├── routes/         # API routes
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   └── middleware/     # Express middleware
│   ├── package.json
│   └── .env                # Backend environment
│
├── src/                    # React frontend
│   ├── components/
│   ├── services/
│   │   └── api.service.ts # Backend API client
│   └── types/
├── package.json
└── .env                    # Frontend environment
```

## 🔧 Backend Setup

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Configure Backend Environment

```bash
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=3001
NODE_ENV=development

# Get your API key from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...your_actual_key_here

OPENAI_MODEL=gpt-4o-mini
FRONTEND_URL=http://localhost:5173
```

### 3. Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Backend will run on **http://localhost:3001**

You should see:
```
🚀 Backend server running on port 3001
📍 API endpoint: http://localhost:3001/api
💚 Health check: http://localhost:3001/health
```

### 4. Test Backend

```bash
# Health check
curl http://localhost:3001/health

# Should return:
# {"status":"ok","service":"Wind Farm Data Extraction API","version":"1.0.0"}
```

## 🎨 Frontend Setup

### 1. Install Frontend Dependencies

```bash
cd ..  # Back to project root
npm install
```

### 2. Configure Frontend Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

### 3. Start Frontend

```bash
npm run dev
```

Frontend will run on **http://localhost:5173**

## ✅ Verify Setup

1. **Backend is running**: http://localhost:3001/health
2. **Frontend is running**: http://localhost:5173
3. **Upload a test EML file** with PDF attachments
4. **Check console logs** in both terminals

## 📤 Usage

1. Open http://localhost:5173
2. Click "Importer" tab
3. Upload an EML file containing worker certifications
4. Wait for processing (backend will parse EML, extract PDFs, call OpenAI)
5. Review extracted data
6. Accept to save to local storage

## 🔍 Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Change PORT in backend/.env
PORT=3002
```

**OpenAI API errors:**
- Check your API key is correct
- Verify you have credits: https://platform.openai.com/usage
- Check rate limits

**PDF extraction fails:**
```bash
# Reinstall pdf-parse
cd backend
npm uninstall pdf-parse
npm install pdf-parse
```

### Frontend Issues

**CORS errors:**
- Ensure backend is running
- Check `FRONTEND_URL` in backend/.env matches your frontend URL

**API connection refused:**
- Verify backend is running on port 3001
- Check `VITE_API_URL` in `.env`

### Common Errors

**"No file uploaded":**
- Ensure you're uploading an .eml file
- Check file size < 50MB

**"LLM extraction failed":**
- Check OpenAI API key
- Check internet connection
- Review backend logs for details

## 📊 Monitoring

### Backend Logs

Backend provides detailed logs for each step:
```
📧 Processing EML file: Planning.eml (1245.2 KB)
📧 [1/3] Parsing EML file...
📎 Found 8 attachments
  ✓ GWO-WAH_Elie Amour.pdf (application/pdf) - 607.1 KB
📎 [2/3] Processing 8 attachments...
  📄 Extracting text from: GWO-WAH_Elie Amour.pdf
  ✅ Extracted 1234 chars from 2 pages
🤖 [3/3] Extracting data with LLM...
✅ LLM extraction successful
   Company: Supairvision
   Workers: 4
   Tokens used: 1748
```

### Frontend Logs

Check browser console (F12) for:
- API request/response
- Extraction metadata
- Errors

## 🚀 Production Deployment

### Backend

1. **Environment:**
   ```env
   NODE_ENV=production
   PORT=3001
   OPENAI_API_KEY=your_production_key
   FRONTEND_URL=https://your-frontend-domain.com
   ```

2. **Process Manager (PM2):**
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name "wind-farm-api"
   pm2 save
   pm2 startup
   ```

3. **Nginx Reverse Proxy:**
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Frontend

1. **Build:**
   ```bash
   npm run build
   ```

2. **Deploy `dist/` folder** to:
   - Netlify
   - Vercel
   - AWS S3 + CloudFront
   - Your web server

3. **Update `.env.production`:**
   ```env
   VITE_API_URL=https://api.yourdomain.com/api
   ```

## 📚 API Documentation

See [backend/README.md](backend/README.md) for complete API documentation.

## 🤝 Support

For issues:
1. Check logs (backend terminal + browser console)
2. Verify all environment variables
3. Test backend health endpoint
4. Review this guide

## 🎯 Next Steps

- [ ] Set up backend with PM2
- [ ] Configure production environment
- [ ] Add error tracking (e.g., Sentry)
- [ ] Set up logging service
- [ ] Configure automated backups
- [ ] Add API rate limiting
- [ ] Implement request caching
