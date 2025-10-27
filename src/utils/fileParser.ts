export async function parseFile(file: File): Promise<string> {
  const fileType = file.name.split('.').pop()?.toLowerCase();

  switch (fileType) {
    case 'txt':
      return await parseTextFile(file);
    case 'eml':
      return await parseEmailFile(file);
    case 'pdf':
      return await parsePdfFile(file);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

async function parseTextFile(file: File): Promise<string> {
  return await file.text();
}

async function parseEmailFile(file: File): Promise<string> {
  const content = await file.text();

  const bodyMatch = content.match(/Content-Type: text\/plain[\s\S]*?\n\n([\s\S]*?)(?=\n--|\n\nContent-Type:|$)/i);
  if (bodyMatch) {
    return cleanText(bodyMatch[1]);
  }

  const simpleBodyMatch = content.match(/\n\n([\s\S]+)$/);
  if (simpleBodyMatch) {
    return cleanText(simpleBodyMatch[1]);
  }

  return cleanText(content);
}

async function parsePdfFile(file: File): Promise<string> {
  return `[PDF FILE: ${file.name}]\nPDF parsing requires server-side processing. Please use the LLM extraction for PDF content analysis.`;
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
