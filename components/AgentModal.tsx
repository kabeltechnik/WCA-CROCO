
import React, { useState, useMemo } from 'react';
import { X, TrendingUp, Loader2, Bot, ShoppingCart, Smartphone, Tv, Wifi, Shield, Target, AlertCircle, Clock, CheckCircle2, Zap, Brain, Trophy, Euro, MessageSquare, Award, Flame, Timer, BarChart3, ChevronRight } from 'lucide-react';
import { KPIAgent, SaleRow, AggregatedSales, MonthSnapshot } from '../types';
import { generateCoachingPlan } from '../services/gemini';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  agent: KPIAgent;
  sales: SaleRow[];
  getAgentSales: (id: string) => AggregatedSales;
  history?: Record<string, MonthSnapshot>;
}

const AgentModal: React.FC<Props> = ({ isOpen, onClose, agent, sales, getAgentSales, history = {} }) => {
  const [aiCoaching, setAiCoaching] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const stats = useMemo(() => getAgentSales(agent.id), [agent.id, getAgentSales]);

  const handleAiCoaching = async () => {
    setIsAiLoading(true);
    const result = await generateCoachingPlan(agent, stats);
    setAiCoaching(result);
    setIsAiLoading(false);
  };

  const radarData = useMemo(() => [
    { subject: 'BNT', A: Math.min(agent.bnt_pix * 10, 100), fullMark: 100 },
    { subject: 'VVL', A: Math.min(agent.vvl_pix * 10, 100), fullMark: 100 },
    { subject: 'CS', A: agent.cs_mw, fullMark: 100 },
    { subject: 'FF7', A: agent.ff7_mw, fullMark: 100 },
    { subject: 'AQ', A: agent.aufleger, fullMark: 100 }
  ], [agent]);

  const historicalData = useMemo(() => {
    return Object.keys(history).sort().map(key => ({
      month: key,
      pix: history[key].kpiData[agent.id]?.pix || 0
    }));
  }, [history, agent.id]);

  if (!isOpen) return null;

  const isElite = agent.pix >= 8.1;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300" onClick={onClose} />
      
      <div className={`relative w-full max-w-[1600px] h-full max-h-[900px] bg-[#0a0a0a] rounded-[40px] flex flex-col overflow-hidden border border-white/10 shadow-2xl ${isElite ? 'shadow-yellow-500/10' : 'shadow-red-600/10'}`}>
        
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-white/[0.02] to-transparent">
          <div className="flex items-center gap-10">
            <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center text-4xl font-black text-white border transition-all ${isElite ? 'bg-yellow-500/20 border-yellow-500/40 shadow-neon text-yellow-500' : 'bg-red-600/20 border-red-600/40 text-red-500'}`}>
              {agent.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-4">
                <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic">{agent.name}</h2>
                {isElite && <Award className="text-yellow-500 animate-pulse" size={32} />}
              </div>
              <div className="flex items-center gap-6 mt-3 text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">
                <span>Unit 0{agent.ebene}</span>
                <span>•</span>
                <span>Experience: {agent.months} Months</span>
                <span>•</span>
                <span className="text-red-600">Alanya Command</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-red-600 text-white transition-all flex items-center justify-center group border border-white/10">
            <X size={28} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="w-[450px] border-r border-white/5 p-8 overflow-y-auto custom-scrollbar bg-black/30">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
              <BarChart3 size={14} className="text-red-600" /> Performance Matrix
            </h3>
            
            <div className="h-64 mb-10">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#222" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10, fontWeight: 900 }} />
                  <Radar name={agent.name} dataKey="A" stroke={isElite ? "#eab308" : "#dc2626"} fill={isElite ? "#eab308" : "#dc2626"} fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4 mb-10">
              {[
                { label: 'CS Score', val: `${agent.cs_mw.toFixed(1)}%`, icon: Zap, color: 'text-blue-400' },
                { label: 'FF7 Accuracy', val: `${agent.ff7_mw.toFixed(1)}%`, icon: Shield, color: 'text-emerald-400' },
                { label: 'Feedback FQ', val: `${agent.fbq.toFixed(1)}%`, icon: MessageSquare, color: 'text-orange-400' },
                { label: 'Risk Factor', val: `${agent.deep.toFixed(1)}%`, icon: AlertCircle, color: 'text-red-500' }
              ].map((m, i) => (
                <div key={i} className="glass p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <m.icon size={16} className={m.color} />
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{m.label}</span>
                  </div>
                  <div className="text-xl font-black text-white">{m.val}</div>
                </div>
              ))}
            </div>

            <div className="glass rounded-3xl p-6 border border-red-600/20 bg-red-600/5">
              <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Brain size={16} /> Elite Coaching Directive
              </h3>
              <p className="text-sm text-gray-400 italic leading-relaxed">
                {aiCoaching || "Klicken Sie auf den Button, um die taktische Analyse von Veysel Yarba zu generieren."}
              </p>
              {!aiCoaching && (
                <button onClick={handleAiCoaching} disabled={isAiLoading} className="mt-6 w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                  {isAiLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Analyse Starten"}
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-3 gap-6 mb-10">
              <div className="glass p-8 rounded-[32px] border-b-4 border-emerald-500/50 bg-emerald-500/5">
                <div className="text-[10px] font-black text-gray-600 uppercase mb-3">Total Netto Sales</div>
                <div className="text-6xl font-black text-white tracking-tighter">{stats.nettoTotal}</div>
              </div>
              <div className="glass p-8 rounded-[32px] border-b-4 border-red-500/50 bg-red-500/5">
                <div className="text-[10px] font-black text-gray-600 uppercase mb-3">Leakage Rate</div>
                <div className="text-6xl font-black text-red-500 tracking-tighter">{stats.stornoRate.toFixed(1)}%</div>
              </div>
              <div className="glass p-8 rounded-[32px] border-b-4 border-blue-500/50 bg-blue-500/5">
                <div className="text-[10px] font-black text-gray-600 uppercase mb-3">Calculated Bonus</div>
                <div className="text-6xl font-black text-emerald-400 tracking-tighter">{stats.commissionTotal.toFixed(2)}€</div>
              </div>
            </div>

            <div className="glass rounded-[32px] p-8 border border-white/5">
              <h3 className="text-xl font-black text-white mb-8 italic uppercase tracking-tighter">Tactical Chronology</h3>
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[10px] font-black text-gray-700 uppercase tracking-widest border-b border-white/5 pb-4">
                    <th className="pb-4">Asset Type</th>
                    <th className="pb-4">Class</th>
                    <th className="pb-4">Timestamp</th>
                    <th className="pb-4 text-right">Value</th>
                    <th className="pb-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sales.slice().reverse().map((s, i) => (
                    <tr key={i} className="group hover:bg-white/5 transition-all">
                      <td className="py-4">
                        <div className="text-white font-bold text-sm uppercase group-hover:text-red-600 transition-colors">{s.prod}</div>
                        <div className="text-[9px] text-gray-700 font-mono">{s.code}</div>
                      </td>
                      <td className="py-4 text-[10px] font-black text-gray-600">{s.class}</td>
                      <td className="py-4 text-[10px] font-bold text-gray-600">{s.date}</td>
                      <td className="py-4 text-right font-black text-emerald-500">{(s.commission || 0).toFixed(2)}€</td>
                      <td className="py-4 text-right">
                        {s.storno > 0 ? (
                          <span className="bg-red-500/10 text-red-500 text-[9px] font-black px-3 py-1 rounded-lg border border-red-500/20">LEAKAGE</span>
                        ) : (
                          <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black px-3 py-1 rounded-lg border border-emerald-500/20">VALID</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentModal;
