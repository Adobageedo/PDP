// src/services/llm.ts
import OpenAI from "openai";

interface LLMConfig {
  apiKey: string;
  modelText?: string;
  modelVision?: string;
}

export default class LLM {
  private client: OpenAI;
  private modelText: string;
  private modelVision: string;

  constructor(config: LLMConfig) {
    this.client = new OpenAI({ 
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true // Allow OpenAI in browser environment
    });
    this.modelText = config.modelText || "gpt-4o-mini";
    this.modelVision = config.modelVision || "gpt-4o-mini";
  }

  /**
   * Extract structured JSON from plain text
   */
  async parseText(text: string, promptInstructions: string): Promise<any> {
    const prompt = `
You are a data extraction assistant. Extract the following fields as JSON:
${promptInstructions}

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks, no explanations.

Text:
${text}
`;

    let completion;
    console.log(prompt)
    try {
      completion = await this.client.chat.completions.create({
        model: this.modelText,
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        response_format: { type: "json_object" }
      });

      const rawContent = completion.choices[0]?.message?.content || "{}";
      
      // Strip markdown code blocks if present
      const cleanedContent = rawContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      console.log(cleanedContent)
      return JSON.parse(cleanedContent);
    } catch (err) {
      console.error("❌ Text extraction failed:", err);
      if (completion) {
        console.log("Raw response:", completion.choices[0]?.message?.content);
      }
      return { raw: text };
    }
  }

  /**
   * Extract structured JSON from an image using File input
   */
  async parseImage(imageFile: File, promptInstructions: string): Promise<any> {
    const base64Image = await this.fileToBase64(imageFile);
    return this.parseImageBase64(base64Image, promptInstructions);
  }

  /**
   * Extract structured JSON/text from base64 image or PDF
   */
  async parseImageBase64(
    base64Content: string, 
    promptInstructions: string,
    mimeType: string = 'image/jpeg'
  ): Promise<any> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.modelVision,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: promptInstructions },
              { 
                type: "image_url", 
                image_url: { 
                  url: `data:${mimeType};base64,${base64Content}` 
                } 
              },
            ],
          },
        ],
        max_tokens: 4096,
      });

      const rawContent = completion.choices[0]?.message?.content;
      
      // Try to parse as JSON, otherwise return as text
      try {
        return JSON.parse(rawContent || "{}");
      } catch {
        return rawContent || "";
      }
    } catch (err) {
      console.warn("Vision extraction failed:", err);
      throw err;
    }
  }

  /**
   * Helper: Convert File to base64
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove the data URL prefix
        const base64Content = base64.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Alternative text extraction using Responses API (gpt-5)
   */
  async parseTextWithResponsesAPI(text: string, promptInstructions: string): Promise<any> {
    try {
      const response = await this.client.responses.create({
        model: "gpt-5",
        input: `Extract the following fields as JSON:\n${promptInstructions}\n\nText:\n${text}`,
      });

      const rawContent = response.output_text;
      return JSON.parse(rawContent || "{}");
    } catch (err) {
      console.warn("Responses API extraction failed:", err);
      return { raw: text };
    }
  }
}
