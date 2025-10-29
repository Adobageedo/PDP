import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { ExtractedData, Worker, Certification } from '../types';

export interface TemplateData {
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    legal_representative: string;
    hse_responsible: string;
  };
  workers: Array<{
    first_name: string;
    last_name: string;
    full_name: string;
    phone: string;
    email: string;
    certifications: Array<{
      certification_type: string;
      certification_name: string;
      issue_date: string;
      expiry_date: string;
      status: string;
    }>;
  }>;
  generation_date: string;
}

/**
 * Load Word template from file
 */
export async function loadTemplate(templateFile: File): Promise<ArrayBuffer> {
  return await templateFile.arrayBuffer();
}

/**
 * Generate Word document from template and extracted data
 */
export async function generateDocumentFromTemplate(
  templateBuffer: ArrayBuffer,
  extractedData: ExtractedData
): Promise<Blob> {
  try {
    // Load the template
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Prepare data for template
    const templateData = prepareTemplateData(extractedData);

    // Render the document
    doc.render(templateData);

    // Generate the output
    const output = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    return output;
  } catch (error) {
    console.error('Error generating document:', error);
    throw new Error(`Failed to generate document: ${error}`);
  }
}

/**
 * Prepare extracted data for Word template
 */
function prepareTemplateData(extractedData: ExtractedData): TemplateData {
  const company = extractedData.company || {
    name: '',
    address: '',
    phone: '',
    email: '',
    legal_representative: '',
    hse_responsible: '',
  };

  const workers = (extractedData.workers || []).map((worker) => ({
    first_name: worker.first_name || '',
    last_name: worker.last_name || '',
    full_name: `${worker.first_name || ''} ${worker.last_name || ''}`.trim(),
    phone: worker.phone || '',
    email: worker.email || '',
    certifications: (worker.certifications || []).map((cert) => ({
      certification_type: cert.certification_type || '',
      certification_name: cert.certification_name || '',
      issue_date: formatDate(cert.issue_date),
      expiry_date: formatDate(cert.expiry_date),
      status: getStatusLabel(cert.status),
    })),
  }));

  return {
    company,
    workers,
    generation_date: new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  };
}

/**
 * Format date for display
 */
function formatDate(dateString?: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Get status label in French
 */
function getStatusLabel(status?: string): string {
  switch (status) {
    case 'valid':
      return 'Valide';
    case 'expired':
      return 'Expirée';
    case 'expiring_soon':
      return 'Expire bientôt';
    default:
      return '';
  }
}

/**
 * Download generated document
 */
export function downloadDocument(blob: Blob, filename: string = 'document_genere.docx'): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Preview template variables
 * Returns a list of all variables found in the template
 */
export async function previewTemplateVariables(templateBuffer: ArrayBuffer): Promise<string[]> {
  try {
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip);
    
    // Get all tags/variables from the template
    const tags = doc.getFullText().match(/\{[^}]+\}/g) || [];
    return [...new Set(tags)]; // Remove duplicates
  } catch (error) {
    console.error('Error reading template:', error);
    return [];
  }
}
