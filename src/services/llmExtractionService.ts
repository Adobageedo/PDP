import { ExtractedData } from '../types';
import LLM from "./llm.ts";

const EXTRACTION_PROMPT = `Tu es un assistant spécialisé dans l'extraction de données depuis des documents relatifs à des chantiers de parcs éoliens.

Tu dois extraire les informations suivantes et les retourner sous forme de JSON valide :

1. **Entreprise** (company) :
   - name (nom de l'entreprise)
   - address (adresse complète)
   - phone (numéro de téléphone)
   - email (adresse email)
   - legal_representative (représentant légal)
   - hse_responsible (responsable HSE/sécurité)

2. **Intervenants** (workers) - tableau d'objets contenant :
   - first_name (prénom)
   - last_name (nom)
   - phone (téléphone)
   - email (email)
   - certifications (tableau des habilitations) :
     - certification_type (type d'habilitation : électrique, travaux en hauteur, etc.)
     - certification_name (nom spécifique de l'habilitation)
     - issue_date (date de délivrance au format YYYY-MM-DD)
     - expiry_date (date d'expiration au format YYYY-MM-DD)

3. **Ordre de travail** (work_order) :
   - title (titre de l'intervention)
   - description (description des travaux)
   - start_date (date de début au format YYYY-MM-DD)
   - end_date (date de fin au format YYYY-MM-DD)
   - work_hours (horaires de travail)

Retourne UNIQUEMENT un objet JSON valide, sans commentaires ni texte additionnel.
Si une information n'est pas disponible, utilise null.

Format attendu :
{
  "company": { "name": "...", "address": "...", ... },
  "workers": [
    {
      "first_name": "...",
      "last_name": "...",
      "certifications": [
        { "certification_type": "...", "certification_name": "...", "expiry_date": "..." }
      ]
    }
  ],
  "work_order": { "title": "...", "description": "...", ... }
}`;

export async function extractDataWithLLM(
  text: string,
  apiKey?: string
): Promise<ExtractedData> {
  // fallback simulation if no API key
  if (!apiKey) {
    return simulateExtraction(text);
  }

  try {
    // instantiate the LLM class
    const extractor = new LLM({ apiKey });

    // use the class to parse the text
    const result = await extractor.parseText(text, EXTRACTION_PROMPT);

    return result as ExtractedData;
  } catch (error) {
    console.error("LLM extraction error:", error);
    return simulateExtraction(text);
  }
}


function simulateExtraction(text: string): ExtractedData {
  const lowerText = text.toLowerCase();

  const companyMatch = text.match(/(?:entreprise|société|company)[:\s]+([^\n]+)/i);
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,})/);
  const phoneMatch = text.match(/(?:tél|phone|téléphone)[:\s]*([0-9\s.+-]{10,})/i);

  const extractedData: ExtractedData = {};

  if (companyMatch || emailMatch || phoneMatch) {
    extractedData.company = {
      name: companyMatch ? companyMatch[1].trim() : 'Entreprise non identifiée',
      email: emailMatch ? emailMatch[1] : undefined,
      phone: phoneMatch ? phoneMatch[1].trim() : undefined,
    };
  }

  const nameMatches = text.match(/(?:M\.|Mme|Mr|Madame|Monsieur)\s+([A-Z][a-zéèêàâù]+)\s+([A-Z][A-ZÉÈÊÀÂÙ]+)/g);
  if (nameMatches && nameMatches.length > 0) {
    extractedData.workers = nameMatches.map((match) => {
      const parts = match.split(/\s+/);
      return {
        first_name: parts[1],
        last_name: parts[2],
        certifications: [],
      };
    });
  }

  if (lowerText.includes('travaux') || lowerText.includes('intervention')) {
    extractedData.work_order = {
      title: 'Intervention parc éolien',
      description: 'Extraction automatique - veuillez vérifier et compléter',
      status: 'pending' as const,
    };
  }

  return extractedData;
}

export function validateExtractedData(data: ExtractedData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.company) {
    if (!data.company.name || data.company.name.trim() === '') {
      errors.push('Le nom de l\'entreprise est requis');
    }
  }

  if (data.workers && data.workers.length > 0) {
    data.workers.forEach((worker, index) => {
      if (!worker.first_name || !worker.last_name) {
        errors.push(`Intervenant ${index + 1} : prénom et nom requis`);
      }

      if (worker.certifications && worker.certifications.length > 0) {
        worker.certifications.forEach((cert, certIndex) => {
          if (!cert.certification_name) {
            errors.push(`Intervenant ${index + 1}, certification ${certIndex + 1} : nom requis`);
          }
          if (!cert.expiry_date) {
            errors.push(`Intervenant ${index + 1}, certification ${certIndex + 1} : date d'expiration requise`);
          }
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
