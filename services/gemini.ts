
import { GoogleGenAI } from "@google/genai";
import { KPIAgent, AggregatedSales } from "../types";

// Helper to decode base64 to Uint8Array for raw PCM data
export function decodePCM(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to encode Uint8Array to base64
export function encodePCM(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to decode raw PCM bytes into an AudioBuffer for playback
export async function decodeAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
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

export async function generateCoachingPlan(agent: KPIAgent, sales: AggregatedSales) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Handle als Veysel Yarba, Elite-Coach bei Regiocom Alanya.
    Analysiere "${agent.name}" (PIX: ${agent.pix.toFixed(2)}, Storno: ${sales.stornoRate.toFixed(1)}%).
    Erstelle eine kurze, prägnante taktische Direktive (max 80 Wörter).
    Fokus: Zahlen-Hebel, Mindset-Kick, Tool-Empfehlung.
    Ton: Direkt, wertschätzend, lösungsorientiert.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
    });
    return response.text || "Datenverbindung stabil, aber keine Analyse möglich.";
  } catch (error) {
    return "Strategie-Einheit antwortet nicht.";
  }
}
