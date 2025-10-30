const OpenAI = require('openai');

class LLMService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  /**
   * Extract PDP data from text using LLM
   */
  async extractPDPData(text) {
    const prompt = `Tu es un assistant spécialisé dans l'extraction de données depuis des documents relatifs à des chantiers de parcs éoliens (Plan de Prévention).

INSTRUCTIONS IMPORTANTES :

Les certifications sont dans des PDF joints (ex : "GWO-WAH_Elie Amour.pdf", "H0B0_ELIE_2025.pdf").

CHERCHE les informations indiquées par le nom du fichier (Filename indicates).

Les dates d'expiration sont CRITIQUES : cherche "Valid until", "Expiry", "Expire le", "Valable jusqu'au", "Valid to", "Validity" ou des années seules (2025, 2026…). Si aucune date n'est présente, renvoie null.

Si une année seule est mentionnée (ex : "2025"), utilise le 31 décembre de cette année (2025-12-31).

Les noms de certifications incluent : GWO (Global Wind Organization), H0B0 (habilitation électrique), First Aid, Working at Heights (WAH), BST, IRATA, etc.

CHERCHE si un document "Analyse de Risques" ou "Risk Analysis" est mentionné, renvoie true/false.

CHERCHE si un document "Mode Opératoire" ou "Operational Mode" est mentionné, renvoie true/false.

EXTRACTION REQUISE (JSON) :

Entreprise (company) :
- name
- address
- legal_representant_name
- legal_representant_phone
- legal_representant_email
- hse_responsible

Intervenants (workers) - tableau d'objets :
- first_name
- last_name
- phone
- email
- certifications (tableau) :
  - certification_type (ex: "GWO", "H0B0")
  - certification_name (ex: "GWO Working at Heights")
  - issue_date (YYYY-MM-DD ou null)
  - expiry_date (YYYY-MM-DD ou null)

Documents requis :
- risk_analysis (true/false)
- operational_mode (true/false)

IMPORTANT POUR LES DATES :
Cherche explicitement "Valid until", "Expiry", "Expire", "Valable jusqu'au", "Valid to", "Validity".
Formats possibles : "31/12/2025", "2025-12-31", "December 31, 2025".
Si seule l'année est présente, utiliser 31 décembre.
Ne devine jamais une date si elle n'est pas explicitement mentionnée.

Retourne UNIQUEMENT un objet JSON valide, sans texte additionnel, sans commentaires, sans markdown.

EXEMPLE JSON :
{
  "company": {
    "name": "Supair Vision",
    "address": "12 Rue des Éoliennes, 75015 Paris, France",
    "legal_representant_name": "Elie Amour",
    "legal_representant_phone": "+33 6 44 34 06 88",
    "legal_representant_email": "ea@supairvision.com",
    "hse_responsible": "Claire Dupont"
  },
  "workers": [
    {
      "first_name": "Elie",
      "last_name": "Amour",
      "phone": "+33 6 44 34 06 88",
      "email": "ea@supairvision.com",
      "certifications": [
        {
          "certification_type": "GWO",
          "certification_name": "GWO Working at Heights",
          "issue_date": "2023-05-15",
          "expiry_date": "2025-05-15"
        }
      ]
    }
  ],
  "risk_analysis": true,
  "operational_mode": false
}`;

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'user', content: `${prompt}\n\nTEXTE À ANALYSER:\n${text}` }
        ],
        temperature: 0,
        response_format: { type: 'json_object' }
      });

      const rawContent = completion.choices[0]?.message?.content || '{}';
      const cleanedContent = rawContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const result = JSON.parse(cleanedContent);
      
      console.log('✅ LLM extraction successful');
      console.log(`   Company: ${result.company?.name || 'N/A'}`);
      console.log(`   Workers: ${result.workers?.length || 0}`);
      console.log(`   Tokens: ${completion.usage?.total_tokens || 0}`);
      
      return result;
    } catch (error) {
      console.error('❌ LLM extraction error:', error);
      throw new Error(`LLM extraction failed: ${error.message}`);
    }
  }
}

module.exports = new LLMService();
