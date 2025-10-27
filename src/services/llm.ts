// src/services/llm.ts
import fs from "fs";
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
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.modelText = config.modelText || "gpt-4";
    this.modelVision = config.modelVision || "gpt-4.1-mini";
  }

  /**
   * Extract structured JSON from plain text
   */
  async parseText(text: string, promptInstructions: string): Promise<any> {
    const prompt = `
You are a data extraction assistant. Extract the following fields as JSON:
${promptInstructions}

Text:
${text}
`;

    try {
      const completion = await this.client.chat.completions.create({
        model: this.modelText,
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      });

      const rawContent = completion.choices[0]?.message?.content;
      return JSON.parse(rawContent || "{}");
    } catch (err) {
      console.warn("Text extraction failed, returning raw text:", err);
      return { raw: text };
    }
  }

  /**
   * Extract structured JSON from an image using base64 input
   */
  async parseImage(imagePath: string, promptInstructions: string): Promise<any> {
    const base64Image = fs.readFileSync(imagePath, "base64");

    try {
      const completion = await this.client.chat.completions.create({
        model: this.modelVision,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `Extract the following fields in JSON:\n${promptInstructions}` },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
            ],
          },
        ],
      });

      const rawContent = completion.choices[0]?.message?.content;
      return JSON.parse(rawContent || "{}");
    } catch (err) {
      console.warn("Image extraction failed, returning raw base64:", err);
      return { raw: base64Image };
    }
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
