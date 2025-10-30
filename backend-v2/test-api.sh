#!/bin/bash

# PDP Backend v2 - API Test Script

API_URL="http://localhost:3001"

echo "🧪 Testing PDP Backend v2 API"
echo "=============================="
echo ""

# Test 1: Health Check
echo "1️⃣ Health Check"
echo "GET $API_URL/health"
curl -s $API_URL/health | json_pp
echo ""
echo ""

# Test 2: Extract (requires sample files)
# echo "2️⃣ Extract Data"
# echo "POST $API_URL/api/extract"
# curl -X POST $API_URL/api/extract \
#   -F "files=@sample.eml" \
#   | json_pp
# echo ""
# echo ""

# Test 3: Generate PDP (with sample data)
echo "3️⃣ Generate PDP Document"
echo "POST $API_URL/api/generate-pdp"
curl -X POST $API_URL/api/generate-pdp \
  -H "Content-Type: application/json" \
  -d '{
    "windfarmName": "Test Windfarm",
    "data": {
      "company": {
        "name": "Test Company",
        "address": "123 Test Street, Paris",
        "legal_representant_name": "John Doe",
        "legal_representant_phone": "+33 1 23 45 67 89",
        "legal_representant_email": "john@test.com",
        "hse_responsible": "Jane Doe"
      },
      "workers": [
        {
          "first_name": "Alice",
          "last_name": "Smith",
          "phone": "+33 6 11 22 33 44",
          "email": "alice@test.com",
          "certifications": [
            {
              "certification_type": "GWO",
              "certification_name": "GWO Working at Heights",
              "issue_date": "2023-05-15",
              "expiry_date": "2025-05-15"
            }
          ]
        },
        {
          "first_name": "Bob",
          "last_name": "Johnson",
          "phone": "+33 6 55 66 77 88",
          "email": "bob@test.com",
          "certifications": []
        }
      ],
      "risk_analysis": true,
      "operational_mode": false
    }
  }' \
  --output test-generated.docx

if [ -f "test-generated.docx" ]; then
  echo "✅ Document generated: test-generated.docx"
  ls -lh test-generated.docx
else
  echo "❌ Document generation failed"
fi
echo ""
echo ""

echo "=============================="
echo "✅ Tests completed!"
