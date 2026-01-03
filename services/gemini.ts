
import { GoogleGenAI } from "@google/genai";
import { KPIAgent, AggregatedSales } from "../types";

export async function generateCoachingPlan(agent: KPIAgent, sales: AggregatedSales) {
  // Always create a new instance right before use to ensure the latest API key is used.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Handle als Veysel Yarba, Teamleiter bei Regiocom Alanya (Vodafone VKD TEC). 
    Du bist: Analytisch stark, lösungsorientiert, direkt, ehrlich, ruhig und souverän.
    Dein Motto: "Ruhe. Stärke. Vertrauen. Performance."
    
    Kontext: Regiocom Alanya ist ein Leistungszentrum. Wir wollen europaweit Benchmark sein.
    Führungsstil: Du kontrollierst nicht, du begleitest. Du willst, dass Agenten verstehen, WARUM sie etwas tun.
    
    Analysiere Agent "${agent.name}" (ID: ${agent.id}):
    - PIX Score: ${agent.pix.toFixed(2)} (Ziel: 8.1 für Champion)
    - Entry Gates: ${agent.calls >= 100 && agent.fbq >= 25 && agent.deep <= 4.73 ? 'Passiert' : 'Nicht erfüllt'}
    - BNT MW: ${agent.bnt_mw.toFixed(2)}% (Ziel ≥ 4.5%)
    - CS MW: ${agent.cs_mw.toFixed(1)}% (Ziel ≥ 90%)
    - FF7 MW: ${agent.ff7_mw.toFixed(1)}% (Ziel ≥ 75%)
    - Storno Rate: ${sales.stornoRate.toFixed(1)}%
    
    AUFGABE:
    Erstelle eine kurze Coaching-Direktive (max. 100 Wörter) im Veysel-Stil.
    1. ANALYSE: Wo liegt der Hebel? (Zahlenbasiert)
    2. MINDSET: Eine motivierende Botschaft, die auf Selbstverantwortung zielt.
    3. TOOLS: Erwähne kurz ein passendes Tool (ERA-Modell, AskVodafone, Nutzenargumentation).
    
    Tonalität: Klartext, aber wertschätzend. Keine leeren Phrasen. Antworte auf DEUTSCH.
  `;

  try {
    // Upgraded to gemini-3-pro-preview for complex text tasks involving advanced reasoning.
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        temperature: 0.7
        // Note: thinkingConfig.thinkingBudget = 0 is invalid for gemini-3-pro-preview.
        // We let the model handle thinking automatically by omitting the config.
      }
    });

    // Access the text property directly on the response object.
    return response.text || "Neural Engine offline. Bitte manuell coachen.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Verbindung zur Strategie-Einheit unterbrochen.";
  }
}
