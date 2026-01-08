
import React, { useState, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, Radio, Loader2, Square } from 'lucide-react';
import { MonthSnapshot, AggregatedSales, KPIAgent } from '../types';
import { encodePCM, decodePCM, decodeAudioBuffer } from '../services/gemini';

interface Props {
  history: Record<string, MonthSnapshot>;
  activeMonth: string;
  getAgentSales: (id: string) => AggregatedSales;
}

const VoiceBriefing: React.FC<Props> = ({ history, activeMonth, getAgentSales }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sessionRef = useRef<any>(null);

  const startBriefing = async () => {
    setIsConnecting(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Daten für Kontext zusammenfassen
    const snap = history[activeMonth];
    // Explicitly cast result of Object.values to KPIAgent[] to avoid "unknown" type errors
    const agents = Object.values(snap?.kpiData || {}) as KPIAgent[];
    const totalSales = agents.reduce((sum, a) => sum + getAgentSales(a.id).nettoTotal, 0);
    const topAgent = agents.sort((a,b) => b.pix - a.pix)[0]?.name || "Niemand";

    const systemInstruction = `
      Du bist Veysel Yarba, der Performance-Lead. 
      Kontext für heute (${activeMonth}):
      - Gesamt-Sales: ${totalSales}
      - Top Performer: ${topAgent}
      Antworte kurz, motivierend und im "Elite-Style". Nutze keine langen Erklärungen. 
      Du sprichst gerade zu deinem Team oder analysierst für dich selbst.
    `;

    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    try {
      const sessionPromise = ai.live.connect({
        // Fix: Use the correct model name for native audio tasks.
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioCtxRef.current) {
              const buffer = await decodeAudioBuffer(decodePCM(base64Audio), audioCtxRef.current, 24000);
              const source = audioCtxRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(audioCtxRef.current.destination);
              const start = Math.max(audioCtxRef.current.currentTime, nextStartTimeRef.current);
              source.start(start);
              nextStartTimeRef.current = start + buffer.duration;
            }
          },
          onerror: (e) => console.error(e),
          onclose: () => stopBriefing()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction,
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
        }
      });

      sessionRef.current = await sessionPromise;
      
      // CRITICAL: Solely rely on sessionPromise resolves and then call `session.sendRealtimeInput`, 
      // following guidelines to initiate sendRealtimeInput after live.connect call resolves.
      sessionPromise.then((session) => {
        session.sendRealtimeInput({ 
          text: "Gib mir ein kurzes, knackiges Briefing zur aktuellen Performance!" 
        });
      });
    } catch (err) {
      setIsConnecting(false);
    }
  };

  const stopBriefing = () => {
    sessionRef.current?.close();
    setIsActive(false);
    setIsConnecting(false);
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={isActive ? stopBriefing : startBriefing}
        disabled={isConnecting}
        className={`relative flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border shadow-2xl ${
          isActive 
          ? 'bg-red-600 text-white border-red-500 animate-pulse' 
          : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:border-red-600'
        }`}
      >
        {isConnecting ? <Loader2 size={16} className="animate-spin" /> : isActive ? <Square size={16} /> : <Mic size={16} />}
        {isActive ? 'Live Briefing...' : isConnecting ? 'Verbinde...' : 'KI Voice Briefing'}
        {isActive && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />}
      </button>
    </div>
  );
};

export default VoiceBriefing;
