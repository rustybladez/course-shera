// Backend-integrated service - no client-side Gemini SDK
// Visual generation uses backend API endpoint

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class GeminiService {
  /**
   * Generate visual aids using backend API endpoint
   */
  static async generateVisual(prompt: string): Promise<string | null> {
    try {
      const response = await fetch(`${API_URL}/generate/image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        console.error("Image generation failed:", response.status);
        return null;
      }

      const data = await response.json();
      return data.image_url || null;
    } catch (error) {
      console.error("Image generation error:", error);
      return null;
    }
  }
}

