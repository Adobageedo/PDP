# 🚀 Installation Instructions for PDP Improvements

## Quick Start

Follow these steps to get the improved PDP system up and running:

### 1. Install Backend Dependencies

```bash
cd /Users/edoardo/PDP/backend
npm install
```

This will install:
- `docxtemplater` - For Word document generation
- `pizzip` - For handling DOCX file format

### 2. Verify Installation

```bash
# Check if packages are installed
npm list docxtemplater pizzip
```

You should see:
```
├── docxtemplater@3.42.3
└── pizzip@3.1.7
```

### 3. Start Backend Server

```bash
# From /Users/edoardo/PDP/backend
npm start
```

You should see:
```
🚀 Backend server running on port 3001
📍 API endpoint: http://localhost:3001/api
💚 Health check: http://localhost:3001/health
🌐 Network access: http://YOUR_IP_ADDRESS:3001/api
```

### 4. Start Frontend

```bash
# From /Users/edoardo/PDP (root folder)
npm run dev
```

You should see:
```
VITE ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: http://YOUR_IP_ADDRESS:5173/
```

### 5. Test Document Generation

1. Open the application: `http://localhost:5173`
2. Navigate to a PDP detail page
3. Look for the "Génération du PDP" section
4. Upload a `.docx` template file
5. Click "Générer le PDP"
6. The document should download automatically

## 📝 Creating Your First Template

### Step 1: Create a Word Document

Open Microsoft Word or LibreOffice and create a new document.

### Step 2: Add Placeholders

Use these placeholders in your document:

```
PLAN DE PRÉVENTION

Entreprise: {company_name}
Adresse: {company_adress}
Représentant légal: {company_legal_representant_name}
Téléphone: {company_legal_representant_phone}
Email: {company_legal_representant_number}

INTERVENANTS:

1. {technician1_surname} {technician1_name}
2. {technician2_surname} {technician2_name}
3. {technician3_surname} {technician3_name}
```

### Step 3: Save as .docx

Save your template as `PDP_Template.docx`

### Step 4: Test It

1. Go to any PDP in the application
2. Upload your template
3. Click "Générer le PDP"
4. Open the downloaded file to verify placeholders were replaced

## 🔧 Troubleshooting

### Issue: "Template file is required" error

**Solution:** Make sure you're selecting a `.docx` file (not `.doc`)

### Issue: Placeholders not replaced

**Solution:** 
1. Check placeholder spelling (case-sensitive)
2. Use curly braces: `{placeholder}` not `{{placeholder}}`
3. No spaces inside braces: `{company_name}` not `{ company_name }`

### Issue: "Cannot find module 'docxtemplater'"

**Solution:**
```bash
cd backend
npm install docxtemplater pizzip --save
```

### Issue: Empty technician rows showing

**Solution:** This is automatic! Empty rows should be removed. If not:
1. Check that technician placeholders follow the pattern: `{technician1_name}`, `{technician2_name}`, etc.
2. Verify you're using the number suffix (1-10)

### Issue: Can't access from another laptop

**Solution:**
1. Find your Mac's IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
2. Use that IP: `http://192.168.1.X:5173`
3. Make sure both devices are on the same WiFi
4. Check Mac firewall settings (System Settings → Network → Firewall)

## 📊 Verification Checklist

- [ ] Backend dependencies installed (`npm install` completed)
- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] Can access frontend from browser
- [ ] Can navigate to PDP detail page
- [ ] See "Génération du PDP" section
- [ ] Can upload template file
- [ ] Document generates successfully
- [ ] Document downloads automatically
- [ ] Placeholders are replaced correctly
- [ ] Empty technician rows removed
- [ ] Can re-download existing document

## 🎯 Testing the Complete Flow

### Test Case 1: New PDP with Document Generation

1. Upload EML file with worker data
2. Select "New PDP"
3. Choose windfarm
4. Wait for extraction
5. Review extracted data
6. Accept data
7. Go to PDP detail page
8. Upload template
9. Generate document
10. Verify placeholders replaced

### Test Case 2: Update Existing PDP

1. Select existing PDP
2. Upload additional files
3. Data automatically updates
4. Regenerate document with new data
5. Verify new workers appear

### Test Case 3: Network Access

1. Get your Mac's IP address
2. On another laptop, go to `http://YOUR_IP:5173`
3. Perform same tests as above
4. Verify everything works remotely

## 📦 Package Versions

```json
{
  "docxtemplater": "^3.42.3",
  "pizzip": "^3.1.7"
}
```

## 🔗 Useful Commands

```bash
# Backend
cd /Users/edoardo/PDP/backend
npm start              # Start backend
npm run dev            # Start with nodemon (auto-reload)

# Frontend
cd /Users/edoardo/PDP
npm run dev            # Start frontend

# Check installation
npm list               # List all packages
npm outdated           # Check for updates

# Clean install (if issues)
rm -rf node_modules package-lock.json
npm install
```

## 📞 Need Help?

If you encounter issues:

1. **Check the logs:**
   - Backend: Terminal where `npm start` is running
   - Frontend: Browser console (F12)

2. **Verify file paths:**
   - Templates must be `.docx`
   - Data folder: `/Users/edoardo/PDP/data`
   - Check folder permissions

3. **Test API directly:**
   ```bash
   # Health check
   curl http://localhost:3001/health
   
   # List PDPs
   curl http://localhost:3001/api/pdp
   ```

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ Backend logs show: `🚀 Backend server running on port 3001`
2. ✅ Frontend shows PDP list
3. ✅ Can view PDP details
4. ✅ "Génération du PDP" section appears
5. ✅ Template upload works
6. ✅ Document generates and downloads
7. ✅ Placeholders are replaced with real data
8. ✅ Can access from other devices on network

---

**Ready to start?** Run `npm install` in the backend folder! 🚀
