import { parseBrowserEML, extractTextFromParsedEmail } from '../services/browserEmailParser';

export async function parseFile(file: File, apiKey?: string): Promise<string> {
  const fileType = file.name.split('.').pop()?.toLowerCase();

  switch (fileType) {
    case 'txt':
      return await parseTextFile(file);
    case 'eml':
      return await parseEmailFile(file, apiKey);
    case 'pdf':
      return await parsePdfFile(file, apiKey);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

async function parseTextFile(file: File): Promise<string> {
  return await file.text();
}

async function parseEmailFile(file: File, apiKey?: string): Promise<string> {
  try {
    const parsedEmail = await parseBrowserEML(file);
    const fullText = await extractTextFromParsedEmail(parsedEmail);
    return fullText;
  } catch (error) {
    console.error('❌ Error parsing EML file:', error);
    const content = await file.text();
    return cleanText(content);
  }
}

async function parsePdfFile(file: File, apiKey?: string): Promise<string> {
  console.log('📄 PDF file detected:', file.name);
  console.log('⚠️ Direct PDF upload: PDF text extraction in browser is limited');
  console.log('💡 Tip: For best results, extract the PDF data beforehand or use EML with PDF attachments');
  
  // For now, return a note about the PDF
  // In the future, we could:
  // 1. Use pdf.js for text extraction
  // 2. Send directly to Vision GPT API
  // 3. Process on a backend server
  
  return `[PDF Document: ${file.name}]
  
This is a PDF file. For accurate data extraction, please:
1. Extract text from the PDF manually and paste it, or
2. Include the PDF as an email attachment in an EML file

The system will process EML files with PDF attachments automatically.`;
}

function cleanText(text: string): string {
  return text
    .replace(/=\r?\n/g, '')
    .replace(/=[0-9A-F]{2}/g, (match) => {
      const charCode = parseInt(match.substring(1), 16);
      return String.fromCharCode(charCode);
    })
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function getFileType(fileName: string): 'eml' | 'pdf' | 'txt' {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension === 'eml' || extension === 'pdf' || extension === 'txt') {
    return extension;
  }
  return 'txt';
}
