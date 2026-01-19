import React, { useMemo } from 'react';
import { KPIAgent, AggregatedSales, MonthSnapshot } from '../types';
import { Brain, Zap, ShieldAlert, Search, Target, MessageSquare } from 'lucide-react';

interface Props {
  kpiData: Record<string, KPIAgent>;
  getAgentSales: (id: string) => AggregatedSales;
  onOpenAgent: (id: string) => void;
  history: Record<string, MonthSnapshot>;
}

const CoachingView: React.FC<Props> = ({ kpiData, getAgentSales, onOpenAgent }) => {
  const agents = (Object.values(kpiData) as KPIAgent[]);
  
  const mentors = useMemo(() => agents.filter(a => a.pix >= 8.1), [agents]);

  const kezPhases = [
    { id: 'connect', title: 'Verbinden', metric: 'cs_mw', icon: Zap, color: 'text-blue-400', desc: 'Empathie & Erwartungsmanagement' },
    { id: 'discover', title: 'Entdecken', metric: 'bnt_mw', icon: Search, color: 'text-orange-400', desc: 'Bedarfsanalyse & Storytelling' },
    { id: 'fix', title: 'Bestätigen', metric: 'ff7_mw', icon: ShieldAlert, color: 'text-emerald-400', desc: 'Lösungssicherheit & Doku' }
  ];

  const criticalCases = useMemo(() => {
    return agents.filter(a => a.pix < 6.5).sort((a,b) => a.pix - b.pix);
  }, [agents]);

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-orange-600/20 rounded-3xl border border-orange-600/30 flex items-center justify-center text-orange-500 shadow-neon">
            <Brain size={32} />
          </div>
          <div>
            <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter">Coaching <span className="text-orange-500">Portal</span></h2>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Regiocom Alanya • Taktische Einsatzsteuerung</p>
          </div>
        </div>
        
        <div className="flex gap-4">
           <div className="glass px-8 py-4 rounded-3xl text-center border-l-4 border-yellow-500">
              <div className="text-[10px] font-black text-gray-500 uppercase">Verfügbare Mentoren</div>
              <div className="text-2xl font-black text-white">{mentors.length}</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
        {kezPhases.map(phase => (
          <div key={phase.id} className="glass rounded-[40px] p-8 border border-white/5 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity ${phase.color}`}>
              <phase.icon size={100} />
            </div>
            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 ${phase.color}`}>
              <phase.icon size={24} />
            </div>
            <h4 className="text-xl font-black text-white uppercase italic mb-2">{phase.title}</h4>
            <p className="text-xs text-gray-500 font-medium mb-6">{phase.desc}</p>
            <div className="space-y-3">
               {agents.filter(a => (a as any)[phase.metric] < 80).slice(0,3).map(a => (
                 <div key={a.id} className="flex justify-between items-center p-3 bg-white/2 rounded-xl border border-white/5">
                   <span className="text-[10px] font-bold text-gray-400 uppercase">{a.name}</span>
                   <span className="text-[10px] font-black text-red-500">{(a as any)[phase.metric].toFixed(1)}%</span>
                 </div>
               ))}
            </div>
          </div>
        ))}
      </div>

      <h3 className="text-xl font-black text-white mb-8 uppercase italic tracking-tighter flex items-center gap-4">
        <Target className="text-red-600" /> Aktive Coaching-Bedarfe
      </h3>

      <div className="grid grid-cols-1 gap-6">
        {criticalCases.map(agent => {
          const mentor = mentors[Math.floor(Math.random() * mentors.length)];
          return (
            <div key={agent.id} className="glass rounded-[32px] p-8 border border-white/5 flex flex-col lg:flex-row items-center justify-between gap-8 hover:bg-white/[0.02] transition-all">
               <div className="flex items-center gap-6 min-w-[250px]">
                  <div className="w-16 h-16 rounded-2xl bg-red-600/10 text-red-500 flex items-center justify-center font-black text-2xl border border-red-600/20">
                    {agent.name.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xl font-black text-white uppercase tracking-tighter">{agent.name}</div>
                    <div className="text-[9px] font-black text-red-500 uppercase tracking-widest">PIX: {agent.pix.toFixed(1)}</div>
                  </div>
               </div>

               <div className="flex-1 flex items-center justify-center gap-8">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <div className="px-6 py-2 bg-orange-600/10 border border-orange-600/20 rounded-full text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">Side-By-Side Pairing</div>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
               </div>

               <div className="flex items-center gap-6 min-w-[250px] text-right">
                  <div>
                    <div className="text-xl font-black text-white uppercase tracking-tighter">{mentor?.name || "Backup Mentor"}</div>
                    <div className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">WCA CHAMPION</div>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center font-black text-2xl border border-yellow-500/20 shadow-neon">
                    {mentor?.name.substring(0,2).toUpperCase() || "BM"}
                  </div>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CoachingView;