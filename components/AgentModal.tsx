
import React, { useState, useEffect, useMemo } from 'react';
import { X, TrendingUp, Cpu, Loader2, Sparkles, Bot, Package, ShoppingCart, Smartphone, Tv, Wifi, Shield, Target, AlertCircle, Clock, CheckCircle2, Zap, Activity, User, Heart, Brain, ZapOff, Trophy, Euro, HelpCircle } from 'lucide-react';
import { KPIAgent, SaleRow, AggregatedSales } from '../types';
import { generateCoachingPlan } from '../services/gemini';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  agent: KPIAgent;
  sales: SaleRow[];
  getAgentSales: (id: string) => AggregatedSales;
}

const AgentModal: React.FC<Props> = ({ isOpen, onClose, agent, sales, getAgentSales }) => {
  const [simBnt, setSimBnt] = useState(0);
  const [simVvl, setSimVvl] = useState(0);
  const [aiCoaching, setAiCoaching] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAiCoaching(null);
      setSimBnt(0);
      setSimVvl(0);
      setIsAiLoading(false);
    }
  }, [agent.id, isOpen]);

  const handleAiCoaching = async () => {
    setIsAiLoading(true);
    const result = await generateCoachingPlan(agent, getAgentSales(agent.id));
    setAiCoaching(result);
    setIsAiLoading(false);
  };

  const runSimulation = () => {
    const bntImpact = (100 / (agent.calls || 1)) * 2 * 0.3;
    const vvlImpact = (100 / (agent.calls || 1)) * 2 * 0.2;
    const gainedPix = (simBnt * bntImpact) + (simVvl * vvlImpact);
    return Math.min(10, agent.pix + gainedPix);
  };

  const stats = getAgentSales(agent.id);

  const radarData = useMemo(() => [
    { subject: 'Effektivität', A: Math.min(100, agent.ff7_mw), fullMark: 100 },
    { subject: 'Empathie', A: agent.cs_mw, fullMark: 100 },
    { subject: 'Geduld (AQ)', A: agent.aufleger, fullMark: 100 },
    { subject: 'Multi-Tasking', A: Math.min(100, agent.fbq * 3), fullMark: 100 },
    { subject: 'Positive Mindset', A: Math.min(100, agent.tnps), fullMark: 100 },
    { subject: 'Effizienz (AHT)', A: 85, fullMark: 100 },
    { subject: 'Präzision', A: Math.min(100, 100 - (agent.deep * 10)), fullMark: 100 },
    { subject: 'Abschlusskraft', A: Math.min(100, agent.bnt_mw * 15), fullMark: 100 },
  ], [agent]);

  const tacticalRole = useMemo(() => {
    if (agent.pix >= 8.1) return "WCA Champion";
    if (agent.pix >= 6.1) return "WCA Specialist";
    return "WCA Newcomer";
  }, [agent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 overflow-hidden">
      <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-500" onClick={onClose} />
      
      <div className="relative w-full max-w-[1600px] h-full max-h-[950px] bg-[#080808] rounded-[48px] flex flex-col overflow-hidden border border-white/10 animate-in slide-in-from-bottom-10 duration-500 shadow-[0_0_200px_rgba(230,0,0,0.3)]">
        
        {/* UPPER HUD */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-[#E60000]/10 via-transparent to-yellow-500/5">
          <div className="flex items-center gap-10">
            <div className="relative">
              <div className="w-28 h-28 rounded-[38px] bg-gradient-to-br from-[#E60000] to-[#600000] flex items-center justify-center text-5xl font-black text-white shadow-[0_20px_60px_rgba(230,0,0,0.6)] border border-white/20 transform hover:scale-105 transition-all">
                {agent.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="absolute -top-3 -right-3 bg-yellow-500 p-2 rounded-2xl border-4 border-[#080808] shadow-lg animate-pulse">
                <Trophy size={16} fill="black" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-4">
                <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic">{agent.name}</h2>
                <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-gray-400 tracking-widest uppercase">CCS-ID: {agent.id}</div>
              </div>
              <div className="flex items-center gap-6 mt-3">
                <div className={`flex items-center gap-3 px-5 py-2 border rounded-full shadow-neon group cursor-help ${agent.pix >= 8.1 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-red-600/10 text-red-500 border-red-600/20'}`}>
                  <Shield size={18} className="group-hover:rotate-12 transition-transform" />
                  <span className="text-sm font-black uppercase tracking-tighter italic">{tacticalRole}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase tracking-[0.2em]">
                  <Clock size={14} /> Zugehörigkeit: {agent.months} Monate
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
             <div className="text-right mr-10 bg-emerald-500/5 border border-emerald-500/10 rounded-[28px] p-6 flex items-center gap-6">
                <div>
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Provision Σ</div>
                  <div className="text-3xl font-black text-emerald-400 drop-shadow-neon">{stats.commissionTotal.toFixed(2)} €</div>
                </div>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 shadow-neon">
                  <Euro size={24} />
                </div>
             </div>
             <button onClick={onClose} className="w-16 h-16 rounded-[24px] bg-white/5 hover:bg-red-600 text-white transition-all flex items-center justify-center group shadow-2xl border border-white/10">
               <X size={32} className="group-hover:rotate-90 transition-transform duration-300" />
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          
          {/* LEFT HUD */}
          <div className="w-[480px] border-r border-white/5 p-10 overflow-y-auto bg-[#0a0a0a] custom-scrollbar">
            
            <div className="relative mb-12 p-10 glass rounded-[44px] border border-white/10 shadow-inner group overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-[#E60000]/10 to-transparent opacity-50" />
               <div className="relative z-10 text-center">
                 <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-3">WCA Performance Index</div>
                 <div className="text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">{agent.pix.toFixed(2)}</div>
                 <div className="mt-6 h-2 bg-white/5 rounded-full overflow-hidden w-48 mx-auto border border-white/5">
                    <div className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-neon" style={{width: `${(agent.pix / 10) * 100}%`}} />
                 </div>
               </div>
            </div>

            <div className="h-[320px] mb-12 relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#333" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 8, fontWeight: '900', letterSpacing: '1px' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                  <Radar name={agent.name} dataKey="A" stroke="#E60000" strokeWidth={3} fill="#E60000" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
               <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-3">
                 <Activity size={14} className="text-red-500" /> WCA KPI Breakdown
               </h3>
               {[
                 { label: 'Neuverträge (BNT)', val: agent.bnt_pix, icon: ShoppingCart, color: 'text-emerald-400' },
                 { label: 'Kundenbindung (VVL)', val: agent.vvl_pix, icon: Heart, color: 'text-blue-400' },
                 { label: 'Zufriedenheit (CS)', val: agent.cs_pix, icon: Sparkles, color: 'text-orange-400' },
                 { label: 'Nachhaltigkeit (FF7)', val: agent.ff7_mw, icon: Brain, color: 'text-purple-400', unit: '%' },
               ].map((item, idx) => (
                 <div key={idx} className="flex justify-between items-center bg-white/2 p-5 rounded-[24px] border border-white/5 hover:bg-white/5 transition-all group">
                   <div className="flex items-center gap-4">
                     <item.icon size={18} className="text-gray-600 group-hover:text-white transition-colors" />
                     <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-300">{item.label}</span>
                   </div>
                   <span className={`text-xl font-black ${item.color}`}>{item.val.toFixed(2)}{item.unit || ''}</span>
                 </div>
               ))}
            </div>
          </div>

          {/* CENTER HUD */}
          <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-black/40">
            
            <div className="grid grid-cols-4 gap-6 mb-12">
               {[
                 { label: 'Gross Volume', val: stats.bruttoTotal, icon: Package, color: 'border-white/20', sub: 'Brutto Summe' },
                 { label: 'Execution', val: stats.nettoTotal, icon: CheckCircle2, color: 'border-emerald-500/50', sub: 'Netto Erledigt', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.2)]' },
                 { label: 'Operation Leak', val: stats.stornoTotal, icon: ZapOff, color: 'border-red-500/50', sub: 'Storno Verlust', glow: 'shadow-[0_0_30px_rgba(230,0,0,0.2)]' },
                 { label: 'Pending Process', val: stats.pendingTotal, icon: Clock, color: 'border-orange-500/50', sub: 'Offene Posten', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.2)]' }
               ].map((box, i) => (
                 <div key={i} className={`glass rounded-[38px] p-8 border-b-8 ${box.color} ${box.glow} transform hover:translate-y-[-5px] transition-all`}>
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                       <box.icon size={14} /> {box.label}
                    </div>
                    <div className="text-5xl font-black text-white tracking-tighter">{box.val}</div>
                    <div className="text-[10px] font-black text-gray-600 uppercase mt-2 tracking-widest">{box.sub}</div>
                 </div>
               ))}
            </div>

            <div className="glass rounded-[48px] p-10 mb-12 border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none rotate-45"><Target size={150} /></div>
              <h3 className="text-xl font-black text-white mb-10 flex items-center gap-4 italic uppercase tracking-tighter">
                <Target size={24} className="text-[#E60000]" /> WCA Entry Gate Status
              </h3>
              <div className="grid grid-cols-2 gap-x-12 gap-y-10">
                {[
                  { label: 'Anrufvolumen', target: 100, current: agent.calls, unit: ' Calls', status: agent.calls >= 100 },
                  { label: 'Feedbackquote', target: 25, current: agent.fbq, unit: '% FBQ', status: agent.fbq >= 25 },
                  { label: 'Deep Detraktor', target: 4.73, current: agent.deep, unit: '% DEEP', status: agent.deep <= 4.73, inverse: true },
                  { label: 'Auflegerquote', target: 85, current: agent.aufleger, unit: '% AQ', status: agent.aufleger >= 85 }
                ].map((gate, idx) => (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Gate {idx+1}</span>
                        <span className="text-sm font-black text-white uppercase tracking-tighter italic">{gate.label}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-2xl font-black ${gate.status ? 'text-emerald-400 drop-shadow-neon' : 'text-red-500'}`}>
                          {gate.current.toFixed(idx === 2 ? 2 : 1)}{gate.unit}
                        </span>
                        <div className="text-[9px] font-bold text-gray-600 uppercase">Limit: {gate.target}</div>
                      </div>
                    </div>
                    <div className="h-4 w-full bg-white/5 rounded-2xl overflow-hidden border border-white/5 shadow-inner">
                      <div 
                        className={`h-full transition-all duration-[1.5s] ease-out ${gate.status ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-red-600/30'}`}
                        style={{ width: `${Math.min(100, gate.inverse ? (gate.target / gate.current) * 100 : (gate.current / gate.target) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CHRONOLOGY WITH COMMISSIONS */}
            <div className="glass rounded-[48px] p-10 border border-white/5">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.4em]">Einsatz-Chronologie & Ertrag</h3>
              </div>
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-600 font-black border-b border-white/5 text-[10px] uppercase tracking-widest">
                      <th className="pb-5">Asset</th>
                      <th className="pb-5">Menge</th>
                      <th className="pb-5 text-center">Provision (Gesamt)</th>
                      <th className="pb-5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-all group">
                        <td className="py-5">
                          <div className="text-white font-black text-base group-hover:text-[#E60000] transition-colors uppercase italic">{sale.prod}</div>
                          <div className="text-[10px] text-gray-600 font-bold mt-1 tracking-widest uppercase">
                            {sale.date} • Code: <span className="text-white">{sale.code}</span>
                          </div>
                        </td>
                        <td className="py-5 text-center">
                          <div className="text-white font-black">{sale.netto}</div>
                        </td>
                        <td className="text-center py-5">
                          {sale.commission && sale.commission > 0 ? (
                            <div className="text-emerald-400 font-black text-xl">{(sale.commission * sale.netto).toFixed(2)} €</div>
                          ) : (
                            <div className="flex items-center justify-center gap-1 text-gray-700 font-bold italic text-sm group-hover:text-orange-500/50">
                               <HelpCircle size={14} /> 0.00 €
                            </div>
                          )}
                        </td>
                        <td className="text-center py-5">
                          {sale.storno > 0 ? (
                            <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-4 py-1 rounded-full border border-red-500/20">STORNO</span>
                          ) : sale.netto > 0 ? (
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-4 py-1 rounded-full border border-emerald-500/20">GESICHERT</span>
                          ) : (
                            <span className="text-[10px] font-black text-orange-500 bg-orange-500/10 px-4 py-1 rounded-full animate-pulse">OFFEN</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT HUD */}
          <div className="w-[420px] bg-white/2 p-10 overflow-y-auto custom-scrollbar border-l border-white/5">
            <div className="mb-10">
              <h3 className="text-[10px] font-black text-[#E60000] uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                <Sparkles size={16} className="animate-pulse" /> Neural Strategy Engine
              </h3>
              {!aiCoaching ? (
                <button 
                  onClick={handleAiCoaching}
                  disabled={isAiLoading}
                  className="w-full aspect-[4/3] glass rounded-[40px] border border-white/10 flex flex-col items-center justify-center gap-4 hover:bg-[#E60000]/5 transition-all group relative overflow-hidden shadow-3xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#E60000]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {isAiLoading ? <Loader2 className="animate-spin text-[#E60000]" size={48} /> : (
                    <>
                      <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center group-hover:bg-[#E60000]/20 transition-all border border-white/5">
                         <Bot size={48} className="text-gray-500 group-hover:text-[#E60000] transition-colors" />
                      </div>
                      <span className="font-black text-xs text-white tracking-[0.3em] uppercase italic">Coach Veysel initialisieren</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="glass rounded-[40px] p-8 border border-[#E60000]/30 bg-[#E60000]/5 animate-in slide-in-from-right-10 duration-700 shadow-neon-soft relative group">
                  <div className="absolute -top-3 -left-3 w-10 h-10 bg-[#E60000] rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform">
                    <User size={20} fill="white" className="text-white" />
                  </div>
                  <div className="flex justify-between items-center mb-6 ml-10">
                    <span className="text-[10px] font-black text-[#E60000] uppercase tracking-widest italic">Coach Veysel Directive</span>
                    <button onClick={() => setAiCoaching(null)} className="text-[9px] font-black text-gray-600 uppercase hover:text-white transition-colors">Abbruch</button>
                  </div>
                  <div className="text-gray-200 text-sm leading-relaxed font-medium italic">
                    "{aiCoaching}"
                  </div>
                </div>
              )}
            </div>

            <div className="glass rounded-[40px] p-10 border border-white/10 shadow-2xl">
               <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-3"><Zap size={14} className="text-yellow-500" /> PIX Prognose</h3>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <span>Prognose BNT Gain</span>
                      <span className="text-white">+{simBnt}</span>
                    </div>
                    <input type="range" min="0" max="20" value={simBnt} onChange={(e) => setSimBnt(parseInt(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#E60000]" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <span>Prognose VVL Gain</span>
                      <span className="text-white">+{simVvl}</span>
                    </div>
                    <input type="range" min="0" max="20" value={simVvl} onChange={(e) => setSimVvl(parseInt(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500" />
                  </div>
                  <div className="pt-8 border-t border-white/10 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block mb-1">Erwarteter PIX</span>
                      <span className="text-4xl font-black text-emerald-400 drop-shadow-neon">{runSimulation().toFixed(2)}</span>
                    </div>
                    <div className={`p-4 rounded-3xl ${runSimulation() >= 8.1 ? 'bg-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-white/5'} transition-all`}>
                       <Trophy size={32} className={runSimulation() >= 8.1 ? 'text-yellow-500' : 'text-gray-800'} />
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentModal;
