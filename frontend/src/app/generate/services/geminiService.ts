// Frontend image generation using Google GenAI SDK
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private static getClient() {
    // Use the API key from environment variable
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("NEXT_PUBLIC_GEMINI_API_KEY not configured");
      return null;
    }
    return new GoogleGenAI({ apiKey });
  }

  /**
   * Generates a visual aid using gemini-2.5-flash-image
   */
  static async generateVisual(prompt: string): Promise<string | null> {
    const ai = this.getClient();
    if (!ai) return null;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `Highly educational diagram or illustration showing: ${prompt}. Clean aesthetic, white background, scientific style.` }],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
          }
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    } catch (e) {
      console.error("Image generation failed", e);
    }
    return null;
  }
}

