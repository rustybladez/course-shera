
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { LearningMaterials, Slide, LabExercise } from "../types";

export class GeminiService {
  private static getClient() {
    // Exclusively use process.env.API_KEY as per instructions
    return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  /**
   * Generates structured learning materials using gemini-3-pro-preview with thinking mode
   */
  static async generateMaterials(prompt: string, context?: string): Promise<LearningMaterials> {
    const ai = this.getClient();
    const systemInstruction = `
      You are an expert educational content creator.
      Generate comprehensive learning materials based on the topic: "${prompt}".
      Use the provided internal context if available: "${context || 'No specific internal context provided'}".
      
      You MUST provide:
      1. Reading Notes (Markdown format).
      2. A sequence of 5 Slides (Title and bulleted content).
      3. A Lab Exercise with high-quality, syntactically correct code in a relevant programming language.
      
      Structure your response as a JSON object matching the LearningMaterials interface.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Generate learning materials for: ${prompt}`,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            readingNotes: { type: Type.STRING },
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  visualPrompt: { type: Type.STRING, description: "Prompt for an image generator to create a diagram for this slide" }
                },
                required: ["title", "content"]
              }
            },
            lab: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                language: { type: Type.STRING },
                code: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["title", "description", "language", "code", "explanation"]
            }
          },
          required: ["topic", "readingNotes", "slides", "lab"]
        },
        tools: [{ googleSearch: {} }]
      },
    });

    const data = JSON.parse(response.text || "{}");
    const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Source",
      uri: chunk.web?.uri || "#"
    }));

    return { ...data, groundingSources };
  }

  /**
   * Generates a visual aid using gemini-2.5-flash-image
   */
  static async generateVisual(prompt: string): Promise<string | null> {
    const ai = this.getClient();
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

  /**
   * Text-to-Speech using gemini-2.5-flash-preview-tts
   * Fixed 500 error by ensuring clean prompt structure and proper buffer handling.
   */
  static async speakText(text: string): Promise<void> {
    const ai = this.getClient();
    try {
      // Limit text length and sanitize for TTS model compatibility
      const sanitizedText = text.replace(/[*#_`]/g, '').substring(0, 500);
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: sanitizedText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const bytes = this.base64ToUint8Array(base64Audio);
        const audioBuffer = await this.decodeAudioData(bytes, audioContext, 24000, 1);
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
      }
    } catch (e) {
      console.error("TTS failed", e);
      throw e;
    }
  }

  private static base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private static async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    // Fixed: Ensure the buffer is interpreted correctly as Int16 even if byteOffset is present
    const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
}
