import { ExtractedData } from '../types';

export interface TemplateData {
  company_name?: string;
  company_address?: string;
  company_legal_representant_name?: string;
  company_legal_representant_phone?: string;
  company_legal_representant_email?: string;
  technicians: Array<{
    name: string;
    surname: string;
  }>;
}

/**
 * Convert extracted data to template data format
 */
export function prepareTemplateData(extractedData: ExtractedData): TemplateData {
  const technicians = (extractedData.workers || []).map(worker => ({
    name: worker.last_name,
    surname: worker.first_name,
  }));

  return {
    company_name: extractedData.company?.name || '',
    company_address: extractedData.company?.address || '',
    company_legal_representant_name: extractedData.company?.legal_representative || '',
    company_legal_representant_phone: extractedData.company?.phone || '',
    company_legal_representant_email: extractedData.company?.email || '',
    technicians,
  };
}

/**
 * Generate placeholder replacements for template
 */
export function generatePlaceholders(data: TemplateData): Record<string, string> {
  const placeholders: Record<string, string> = {
    '{company_name}': data.company_name || '',
    '{company_adress}': data.company_address || '',
    '{company_legal_representant_name}': data.company_legal_representant_name || '',
    '{company_legal_representant_phone}': data.company_legal_representant_phone || '',
    '{company_legal_representant_number}': data.company_legal_representant_email || '',
  };

  // Add technician placeholders (up to 10)
  for (let i = 0; i < 10; i++) {
    const technicianIndex = i + 1;
    if (i < data.technicians.length) {
      placeholders[`{technician${technicianIndex}_name}`] = data.technicians[i].name;
      placeholders[`{technician${technicianIndex}_surname}`] = data.technicians[i].surname;
    } else {
      // Mark for deletion if technician doesn't exist
      placeholders[`{technician${technicianIndex}_name}`] = '';
      placeholders[`{technician${technicianIndex}_surname}`] = '';
    }
  }

  return placeholders;
}

/**
 * Request backend to generate PDP document from template
 */
export async function generatePDPDocument(
  pdpId: string,
  templateFile: File,
  extractedData: ExtractedData
): Promise<Blob> {
  const formData = new FormData();
  formData.append('template', templateFile);
  formData.append('pdpId', pdpId);
  
  const templateData = prepareTemplateData(extractedData);
  const placeholders = generatePlaceholders(templateData);
  formData.append('data', JSON.stringify(placeholders));

  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/pdp/generate-document`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to generate PDP document');
  }

  return await response.blob();
}

/**
 * Download generated PDP document
 */
export async function downloadPDPDocument(pdpId: string, windfarmName: string): Promise<void> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/pdp/${pdpId}/download-document`
  );

  if (!response.ok) {
    throw new Error('Failed to download PDP document');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PDP_${windfarmName}_${new Date().toISOString().split('T')[0]}.docx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
