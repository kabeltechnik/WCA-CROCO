
import React, { useState } from 'react';
import { KPIAgent, AggregatedSales } from '../types';
import { COACHING_TIPS } from '../constants';
import { AlertCircle, Brain, Sparkles, Loader2, User, ChevronRight, Target, Tool, MessageSquare, Zap } from 'lucide-react';
import { generateCoachingPlan } from '../services/gemini';

interface Props {
  kpiData: Record<string, KPIAgent>;
  getAgentSales: (id: string) => AggregatedSales;
  onOpenAgent: (id: string) => void;
}

const CoachingView: React.FC<Props> = ({ kpiData, getAgentSales, onOpenAgent }) => {
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
  const [aiInsights, setAiInsights] = useState<Record<string, string>>({});

  const getIssues = (agent: KPIAgent) => {
    const s = getAgentSales(agent.id);
    const issues = [];
    if (agent.cs_mw < 90) issues.push({ ...COACHING_TIPS[0], val: agent.cs_mw, key: 'cs' });
    if (agent.ff7_mw < 75) issues.push({ ...COACHING_TIPS[1], val: agent.ff7_mw, key: 'ff7' });
    if (s.stornoRate > 20) issues.push({ ...COACHING_TIPS[2], val: s.stornoRate, key: 'storno' });
    return issues;
  };

  const handleFetchAiInsight = async (agent: KPIAgent) => {
    setLoadingIds(prev => ({ ...prev, [agent.id]: true }));
    try {
      const sales = getAgentSales(agent.id);
      const insight = await generateCoachingPlan(agent, sales);
      setAiInsights(prev => ({ ...prev, [agent.id]: insight }));
    } catch (err) {
      setAiInsights(prev => ({ ...prev, [agent.id]: "Fehler bei der Strategie-Berechnung." }));
    } finally {
      setLoadingIds(prev => ({ ...prev, [agent.id]: false }));
    }
  };

  const agents = (Object.values(kpiData) as KPIAgent[]).map(k => ({
    agent: k,
    issues: getIssues(k)
  })).filter(x => x.issues.length > 0)
     .sort((a, b) => b.issues.length - a.issues.length);

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex justify-between items-end mb-12">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-600/20 rounded-2xl border border-orange-600/30 text-orange-500 shadow-neon">
              <Brain size={24} />
            </div>
            <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">
              Coaching <span className="text-orange-500">Board</span>
            </h2>
          </div>
          <p className="text-gray-500 text-xs font-black uppercase tracking-[0.4em] ml-1">Einsatzplanung & Strategische Führung</p>
        </div>
        <div className="flex gap-4">
           <div className="glass px-6 py-3 rounded-2xl border-l-4 border-orange-500">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Kritische Fälle</div>
              <div className="text-2xl font-black text-white">{agents.length}</div>
           </div>
        </div>
      </div>

      <div className="space-y-6">
        {agents.map(({ agent, issues }) => (
          <div key={agent.id} className="glass rounded-[40px] border border-white/5 overflow-hidden group hover:border-orange-500/30 transition-all">
            <div className="p-8 flex flex-col xl:flex-row gap-8">
              {/* Profile Section */}
              <div className="w-full xl:w-72 flex flex-col">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-orange-900/20 group-hover:scale-105 transition-transform">
                    {agent.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-black text-white text-xl tracking-tighter uppercase">{agent.name}</h3>
                    <div className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">ID: {agent.id}</div>
                  </div>
                </div>
                
                <div className="mt-auto space-y-2">
                  <button 
                    onClick={() => onOpenAgent(agent.id)}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/5 transition-all flex items-center justify-center gap-2"
                  >
                    Profil <ChevronRight size={14} />
                  </button>
                  <button 
                    onClick={() => handleFetchAiInsight(agent)}
                    disabled={loadingIds[agent.id]}
                    className="w-full py-4 bg-orange-600/10 hover:bg-orange-600 text-orange-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-orange-500/20 transition-all flex items-center justify-center gap-2 shadow-neon-soft disabled:opacity-50"
                  >
                    {loadingIds[agent.id] ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    KI Analyse
                  </button>
                </div>
              </div>

              {/* Issues Section */}
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {issues.map((issue, idx) => (
                    <div key={idx} className="bg-black/40 rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-5"><AlertCircle size={40} /></div>
                       <div className="flex items-center gap-3 mb-3">
                         <AlertCircle size={16} className="text-orange-500" />
                         <span className="text-[11px] font-black text-orange-500 uppercase tracking-widest">{issue.title}</span>
                       </div>
                       <div className="text-white font-bold text-sm mb-3">{issue.text}</div>
                       <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                          <Zap size={12} className="text-gray-500" />
                          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-tight">TOOL: {issue.tools}</span>
                       </div>
                    </div>
                  ))}
                </div>

                {/* AI Insight Box */}
                {(aiInsights[agent.id] || loadingIds[agent.id]) && (
                  <div className="animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-orange-600/5 border border-orange-600/20 rounded-[32px] p-8 relative group/ai">
                      <div className="absolute -top-4 -left-4 w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover/ai:rotate-12 transition-transform">
                        <User size={24} className="text-white" />
                      </div>
                      <div className="flex justify-between items-center mb-6 ml-10">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] italic">Directive by Coach Veysel</span>
                          <div className="h-px w-20 bg-orange-600/30"></div>
                        </div>
                        {aiInsights[agent.id] && (
                           <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest opacity-50">Strategie-Slot: Delta-7</span>
                        )}
                      </div>
                      
                      {loadingIds[agent.id] ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-4">
                           <Loader2 size={32} className="animate-spin text-orange-500" />
                           <span className="text-[10px] font-black text-orange-500 animate-pulse uppercase tracking-[0.4em]">Neural Mapping in Progress...</span>
                        </div>
                      ) : (
                        <div className="text-gray-200 text-base leading-relaxed italic font-medium ml-4 border-l-2 border-orange-600/20 pl-8 py-2">
                          "{aiInsights[agent.id]}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {agents.length === 0 && (
        <div className="glass rounded-[60px] p-32 flex flex-col items-center justify-center text-center border-dashed border-white/10 border-8">
           <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-8 shadow-neon">
             <Zap size={48} />
           </div>
           <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter italic">Alle Einheiten im Zielbereich</h2>
           <p className="text-gray-500 max-w-sm text-sm font-bold uppercase tracking-widest opacity-60">Keine akuten Coaching-Cases identifiziert.</p>
        </div>
      )}
    </div>
  );
};

export default CoachingView;
