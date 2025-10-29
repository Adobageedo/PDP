/**
 * Browser-compatible EML parser
 * Manually parses EML files without Node.js dependencies
 */

export interface BrowserParsedEmail {
  text: string;
  html?: string;
  attachments: Array<{
    filename: string;
    content: Uint8Array;
    contentType: string;
  }>;
  subject?: string;
  from?: string;
  to?: string;
}

/**
 * Parse EML file in browser
 */
export async function parseBrowserEML(file: File): Promise<BrowserParsedEmail> {
  
  const text = await file.text();
  const lines = text.split('\n');
  
  let subject = '';
  let from = '';
  let to = '';
  let bodyText = '';
  let bodyHtml = '';
  const attachments: Array<{
    filename: string;
    content: Uint8Array;
    contentType: string;
  }> = [];
  
  // Extract headers
  let headerEnd = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('Subject:')) {
      subject = line.substring(8).trim();
    } else if (line.startsWith('From:')) {
      from = line.substring(5).trim();
    } else if (line.startsWith('To:')) {
      to = line.substring(3).trim();
    }
    
    // Look for empty line that indicates end of headers
    if (line.trim() === '') {
      headerEnd = i;
      break;
    }
  }
  
  // Get body content after headers
  const bodyContent = lines.slice(headerEnd + 1).join('\n');
  
  // Minimal structure analysis for attachments only
  
  // Extract attachments with simpler approach
  console.group('📎 Extracting attachments:');
  
  // Find all Content-Disposition: attachment sections
  const attachmentSections = bodyContent.split(/Content-Disposition: attachment/g);
  console.log(`Found ${attachmentSections.length - 1} attachment sections`);
  
  for (let i = 1; i < attachmentSections.length; i++) {
    const section = 'Content-Disposition: attachment' + attachmentSections[i];
    
    // Extract filename
    const filenameMatch = section.match(/filename="([^"]+)"/);
    const filename = filenameMatch ? filenameMatch[1] : null;
    
    // Skip if no filename or not a supported extension
    if (!filename || !filename.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i)) {
      console.log(`  ⏭️ [${i}] Skipping: ${filename || 'no filename'} (not a document)`);
      continue;
    }
    
    console.log(`  📄 [${i}] Processing: ${filename}`);
    
    // Look backwards in original content to find Content-Type
    const sectionStart = bodyContent.indexOf('Content-Disposition: attachment' + attachmentSections[i].substring(0, 100));
    const beforeSection = bodyContent.substring(Math.max(0, sectionStart - 500), sectionStart);
    const contentTypeMatch = (beforeSection + section).match(/Content-Type:\s*([\w/]+)/);
    const contentType = contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream';
    console.log(`    Content-Type: ${contentType}`);
    
    // Find base64 content after empty line (more flexible pattern)
    const base64Match = section.match(/\r?\n\r?\n([A-Za-z0-9+/=\r\n]{100,})/);
    
    if (base64Match) {
      console.log(`    Found base64 content (${base64Match[1].length} chars)`);
      
      try {
        // Take base64 until we hit a boundary or end
        let base64Data = base64Match[1];
        const boundaryPos = base64Data.search(/\r?\n--/);
        if (boundaryPos > 0) {
          base64Data = base64Data.substring(0, boundaryPos);
        }
        
        // Decode base64
        const cleanBase64 = base64Data.replace(/[\r\n\s]/g, '');
        console.log(`    Decoding ${cleanBase64.length} base64 chars...`);
        
        const binaryString = atob(cleanBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }
        
        attachments.push({
          filename: filename,
          content: bytes,
          contentType: contentType,
        });
        
        console.log(`    ✅ Extracted ${bytes.length} bytes`);
      } catch (error) {
        console.error(`    ❌ Failed to decode attachment:`, error);
      }
    } else {
      console.log(`    ⚠️ Could not find base64 content (section preview: ${section.substring(0, 200)})`);
    }
  }
  
  console.log(`✅ Total attachments extracted: ${attachments.length}`);
  console.groupEnd();
  
  // Look for text/plain with base64 encoding
  const base64Match = bodyContent.match(/Content-Type: text\/plain[^\n]*\r?\nContent-Transfer-Encoding: base64\r?\n\r?\n([A-Za-z0-9+/=\r\n]+)/);
  
  if (base64Match) {
    console.log('✅ Found base64 encoded text/plain content');
    const base64Content = base64Match[1].replace(/[\r\n]/g, '');
    try {
      bodyText = atob(base64Content);
      console.log('✅ Decoded base64 content, length:', bodyText.length);
    } catch (error) {
      console.error('❌ Failed to decode base64:', error);
      bodyText = bodyContent;
    }
  } else {
    // Fallback: try to find readable text
    console.log('⚠️ No base64 text/plain found, using fallback extraction');
    bodyText = bodyContent
      .replace(/_{10,}/g, '\n')
      .replace(/Content-Type:.*?\n/g, '')
      .replace(/Content-Transfer-Encoding:.*?\n/g, '')
      .replace(/boundary=.*?\n/g, '')
      .trim();
  }
  
  // Clean up the text
  bodyText = bodyText
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // Extract first 10000 chars for LLM processing
  const textPreview = bodyText.substring(0, 10000);
  
  
  return {
    text: textPreview,
    html: bodyHtml || undefined,
    attachments,
    subject,
    from,
    to,
  };
}

/**
 * Extract text from PDF by sending to backend
 */
async function extractPDFText(pdfBytes: Uint8Array, filename: string): Promise<string> {
  try {
    // Get backend URL from environment or use default
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    
    // Create form data with PDF file
    const formData = new FormData();
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    formData.append('file', blob, filename);
    
    console.log(`  ⏳ Sending ${filename} to backend for text extraction...`);
    
    const response = await fetch(`${backendUrl}/api/extract-pdf`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`  ✅ Extracted ${result.text?.length || 0} chars from ${filename}`);
    
    return result.text || '';
  } catch (error) {
    console.error(`  ❌ Failed to extract text from ${filename}:`, error);
    return `[Could not extract text from ${filename} - backend error]`;
  }
}

/**
 * Extract all text from email for LLM processing
 * Limits: 10000 chars for email body, 10000 chars per PDF attachment
 */
export async function extractTextFromParsedEmail(parsedEmail: BrowserParsedEmail): Promise<string> {
  let fullText = '';
  
  // Email headers
  if (parsedEmail.subject) {
    fullText += `Subject: ${parsedEmail.subject}\n`;
  }
  if (parsedEmail.from) {
    fullText += `From: ${parsedEmail.from}\n`;
  }
  if (parsedEmail.to) {
    fullText += `To: ${parsedEmail.to}\n`;
  }
  
  // Email body (already limited to 10000 chars)
  fullText += `\nEmail Body:\n${parsedEmail.text}\n`;
  
  // Process attachments
  if (parsedEmail.attachments.length > 0) {
    fullText += `\n\n--- ATTACHMENTS (${parsedEmail.attachments.length}) ---\n`;
    
    for (let idx = 0; idx < parsedEmail.attachments.length; idx++) {
      const att = parsedEmail.attachments[idx];
      fullText += `\n[${idx + 1}] ${att.filename} (${att.contentType}) - ${(att.content.length / 1024).toFixed(1)} KB\n`;
      
      // Extract text from PDF attachments
      if (att.contentType.includes('pdf')) {
        const pdfText = await extractPDFText(att.content, att.filename);
        const limitedText = pdfText.substring(0, 10000);
        fullText += `\nExtracted text from ${att.filename}:\n${limitedText}\n`;
        if (pdfText.length > 10000) {
          fullText += `... (truncated from ${pdfText.length} chars)\n`;
        }
      }
      // Extract text from text attachments
      else if (att.contentType.startsWith('text/')) {
        const textContent = new TextDecoder().decode(att.content);
        const limitedText = textContent.substring(0, 10000);
        fullText += `\nContent of ${att.filename}:\n${limitedText}\n`;
        if (textContent.length > 10000) {
          fullText += `... (truncated from ${textContent.length} chars)\n`;
        }
      }
    }
  }
  
  console.log(`📝 Final text for LLM: ${fullText.length} chars total`);
  
  return fullText;
}
