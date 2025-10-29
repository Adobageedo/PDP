import { simpleParser, ParsedMail, Attachment } from 'mailparser';

export interface ParsedEmail {
  text: string;
  html?: string;
  attachments: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
  subject?: string;
  from?: string;
  to?: string;
}

/**
 * Parse EML file and extract text content + attachments
 */
export async function parseEMLFile(file: File): Promise<ParsedEmail> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const parsed: ParsedMail = await simpleParser(buffer);
  
  const attachments = parsed.attachments.map((att: Attachment) => ({
    filename: att.filename || 'unnamed',
    content: att.content,
    contentType: att.contentType,
  }));
  
  return {
    text: parsed.text || '',
    html: parsed.html || undefined,
    attachments,
    subject: parsed.subject,
    from: parsed.from?.text,
    to: parsed.to?.text,
  };
}

/**
 * Extract all text from email including body and attachments
 */
export async function extractAllTextFromEmail(
  parsedEmail: ParsedEmail,
  pdfExtractor: (buffer: Buffer, filename: string) => Promise<string>
): Promise<string> {
  let fullText = `Email Subject: ${parsedEmail.subject || 'N/A'}\n`;
  fullText += `From: ${parsedEmail.from || 'N/A'}\n`;
  fullText += `To: ${parsedEmail.to || 'N/A'}\n\n`;
  fullText += `Email Body:\n${parsedEmail.text}\n\n`;
  
  // Process attachments
  if (parsedEmail.attachments.length > 0) {
    fullText += `\n--- ATTACHMENTS (${parsedEmail.attachments.length}) ---\n\n`;
    
    for (const attachment of parsedEmail.attachments) {
      fullText += `\n[Attachment: ${attachment.filename}]\n`;
      
      // Handle PDF attachments
      if (attachment.contentType === 'application/pdf' || attachment.filename.toLowerCase().endsWith('.pdf')) {
        try {
          const pdfText = await pdfExtractor(attachment.content, attachment.filename);
          fullText += pdfText + '\n';
        } catch (error) {
          console.error(`Error extracting PDF ${attachment.filename}:`, error);
          fullText += `[Error extracting PDF: ${attachment.filename}]\n`;
        }
      }
      // Handle text attachments
      else if (attachment.contentType.startsWith('text/')) {
        fullText += attachment.content.toString('utf-8') + '\n';
      }
      // Handle image attachments (will be processed by Vision GPT later if needed)
      else if (attachment.contentType.startsWith('image/')) {
        fullText += `[Image file - will be processed with Vision GPT if needed]\n`;
      }
      else {
        fullText += `[Binary file - type: ${attachment.contentType}]\n`;
      }
    }
  }
  
  return fullText;
}
