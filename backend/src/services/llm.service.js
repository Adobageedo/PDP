const OpenAI = require('openai');

/**
 * LLM Service - Handles all OpenAI interactions
 */
class LLMService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  /**
   * Extract wind farm worker and company data from text
   * @param {String} text - Full text to analyze
   * @returns {Object} Structured data
   */
  async extractWindFarmData(text) {
    const prompt = this.buildExtractionPrompt();
    
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'user', content: `${prompt}\n\nText:\n${text}` }
        ],
        temperature: 0,
        response_format: { type: 'json_object' }
      });

      const rawContent = completion.choices[0]?.message?.content || '{}';
      
      // Clean and parse response
      const cleanedContent = rawContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const result = JSON.parse(cleanedContent);
      
      console.log(`✅ LLM extraction successful`);
      console.log(`   Company: ${result.company?.name || 'N/A'}`);
      console.log(`   Workers: ${result.workers?.length || 0}`);
      console.log(`   Tokens used: ${completion.usage?.total_tokens || 0}`);
      
      return result;
    } catch (error) {
      console.error('❌ LLM extraction error:', error);
      throw new Error(`LLM extraction failed: ${error.message}`);
    }
  }

  /**
   * Build the extraction prompt
   * @private
   */
  buildExtractionPrompt() {
    return `Tu es un assistant spécialisé dans l'extraction de données depuis des documents relatifs à des chantiers de parcs éoliens.

INSTRUCTIONS IMPORTANTES :
- Les certifications sont souvent dans des PDF joints (noms de fichiers comme "GWO-WAH_Elie Amour.pdf", "H0B0_ELIE_2025.pdf")
- CHERCHE les informations "Filename indicates" qui contiennent des indices extraits des noms de fichiers
- Les dates d'expiration sont CRITIQUES - cherche des dates comme "Valid until", "Expiry", "Expire le", "Valable jusqu'au", ou des années (2025, 2026, 2027)
- Si tu vois "implied_expiry_date" dans les métadonnées de fichier, UTILISE cette date comme date d'expiration
- Si tu vois une année seule (ex: "2025"), utilise le 31 décembre de cette année (2025-12-31)
- Les noms de certifications incluent : GWO (Global Wind Organization), H0B0 (habilitation électrique), First Aid, Working at Heights (WAH), BST, etc.
- Si un PDF est marqué "[Scanned PDF - text extraction not possible]", utilise UNIQUEMENT les informations du filename

Tu dois extraire les informations suivantes et les retourner sous forme de JSON valide :

1. **Entreprise** (company) qui réalisera les travaux:
   - name (nom de l'entreprise)
   - address (adresse complète)
   - phone (numéro de téléphone)
   - email (adresse email)
   - legal_representative (représentant légal)
   - hse_responsible (responsable HSE/sécurité)

2. **Intervenants** (workers) - tableau d'objets contenant qui vont intervenir sur site:
   - first_name (prénom)
   - last_name (nom)
   - phone (téléphone)
   - email (email)
   - certifications (tableau des habilitations) - CHERCHE LES DATES ATTENTIVEMENT :
     - certification_type (type : "GWO", "H0B0", "First Aid", "IRATA", etc.)
     - certification_name (nom complet : "GWO Working at Heights", "H0B0 Habilitation Électrique", etc.)
     - issue_date (date de délivrance au format YYYY-MM-DD ou null si non trouvée)
     - expiry_date (date d'expiration au format YYYY-MM-DD ou null si non trouvée)

IMPORTANT POUR LES DATES D'EXPIRATION :
- Cherche "Valid until", "Expiry", "Expire", "Valable jusqu'au", "Valid to", "Validity"
- Cherche des patterns comme "31/12/2025", "2025-12-31", "December 31, 2025"
- Si seulement une année est mentionnée (ex: "2025"), utilise "2025-12-31"
- **SI AUCUNE DATE D'EXPIRATION N'EST TROUVÉE, METS NULL** (certaines certifications n'ont pas de date d'expiration)
- Ne devine JAMAIS une date d'expiration - utilise uniquement ce qui est explicitement écrit

Retourne UNIQUEMENT un objet JSON valide, sans commentaires ni texte additionnel.

Format attendu :
{
  "company": { "name": "...", "address": "...", ... },
  "workers": [
    {
      "first_name": "Elie",
      "last_name": "Amour",
      "phone": "06.44.34.06.88",
      "email": "ea@supairvision.com",
      "certifications": [
        { 
          "certification_type": "GWO",
          "certification_name": "GWO Working at Heights",
          "issue_date": "2023-05-15",
          "expiry_date": "2025-05-15"
        },
        { 
          "certification_type": "H0B0",
          "certification_name": "Habilitation Électrique H0B0",
          "issue_date": null,
          "expiry_date": "2025-12-31"
        }
      ]
    }
  ]
}

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks, no explanations.`;
  }
}

module.exports = new LLMService();
