
import React, { useMemo } from 'react';
import { KPIAgent, MonthSnapshot } from '../types';
import { Trophy, AlertCircle, CheckCircle2, Calendar, Phone, MessageSquare, Target, Shield, History, Lock, Star } from 'lucide-react';

interface Props {
  kpiData: Record<string, KPIAgent>;
  onOpenAgent: (id: string) => void;
  history?: Record<string, MonthSnapshot>;
}

const WCAView: React.FC<Props> = ({ kpiData, onOpenAgent, history = {} }) => {
  const agents = (Object.values(kpiData) as KPIAgent[]).sort((a,b) => b.pix - a.pix);

  // Sorting months chronologically
  const sortedMonths = useMemo(() => {
    return Object.keys(history).sort((a, b) => {
      // Assuming MM-YYYY format
      const [ma, ya] = a.split('-').map(Number);
      const [mb, yb] = b.split('-').map(Number);
      return new Date(ya, ma - 1).getTime() - new Date(yb, mb - 1).getTime();
    });
  }, [history]);

  const getAgentStatus = (agent: KPIAgent | undefined) => {
    if (!agent) return { label: 'N/A', color: 'text-gray-700', bg: 'bg-gray-700/10', border: 'border-gray-700/20' };
    
    const gates = {
      duration: agent.months >= 6,
      volume: agent.calls >= 100,
      fbq: agent.fbq >= 25,
      deep: agent.deep <= 4.73,
      aq: agent.aufleger >= 85
    };
    const passAll = Object.values(gates).every(v => v);

    if (!passAll) return { label: 'LOCKED', color: 'text-red-600', bg: 'bg-red-600/10', border: 'border-red-600/20', icon: Lock };
    if (agent.pix >= 8.1) return { label: 'CHAMPION', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Trophy };
    if (agent.pix >= 6.1) return { label: 'SPECIALIST', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Star };
    return { label: 'NEWCOMER', color: 'text-gray-400', bg: 'bg-white/5', border: 'border-white/10', icon: CheckCircle2 };
  };

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-4xl font-black mb-2 flex items-center gap-4 italic uppercase tracking-tighter">
            <span className="w-2 h-10 bg-yellow-500 rounded-full inline-block shadow-[0_0_20px_rgba(234,179,8,0.5)]"></span>
            World Class Agent <span className="text-yellow-500">Gates</span>
          </h2>
          <p className="text-gray-500 text-xs font-black uppercase tracking-[0.4em] ml-6">Elite Qualification Standard • Alanya Unit</p>
        </div>
        <div className="flex gap-4">
          <div className="glass px-6 py-4 rounded-2xl border-l-4 border-l-blue-500">
             <div className="text-[10px] font-black text-gray-600 uppercase mb-1">Specialist Bonus</div>
             <div className="text-2xl font-black text-white">500 €</div>
          </div>
          <div className="glass px-6 py-4 rounded-2xl border-l-4 border-l-yellow-500">
             <div className="text-[10px] font-black text-gray-600 uppercase mb-1">Champion Bonus</div>
             <div className="text-2xl font-black text-white">1.000 €</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 pb-20">
        {agents.map((k) => {
          const gates = {
            duration: k.months >= 6,
            volume: k.calls >= 100,
            fbq: k.fbq >= 25,
            deep: k.deep <= 4.73, // Striktes Gate-Limit
            aq: k.aufleger >= 85
          };
          
          const passAll = Object.values(gates).every(v => v);
          const isChampion = k.pix >= 8.1;
          const isSpecialist = k.pix >= 6.1 && k.pix < 8.1;

          return (
            <div 
              key={k.id} 
              onClick={() => onOpenAgent(k.id)}
              className={`glass rounded-[32px] p-8 border-l-8 ${passAll ? 'border-l-emerald-500' : 'border-l-red-600'} transition-all hover:bg-white/5 cursor-pointer relative group overflow-hidden`}
            >
              <div className="flex flex-col xl:flex-row items-center justify-between gap-10">
                <div className="flex items-center gap-6 min-w-[320px]">
                   <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center font-black text-3xl border shadow-2xl transition-all ${isChampion ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/40 shadow-neon' : isSpecialist ? 'bg-blue-500/20 text-blue-500 border-blue-500/40' : 'bg-black/40 text-gray-500 border-white/5'}`}>
                     {k.name.substring(0, 2).toUpperCase()}
                   </div>
                   <div>
                     <div className="text-2xl font-black text-white uppercase tracking-tighter group-hover:text-red-600 transition-colors">{k.name}</div>
                     <div className="flex items-center gap-3 mt-1 text-[10px] font-black uppercase tracking-widest">
                        <span className={isChampion ? 'text-yellow-500' : isSpecialist ? 'text-blue-500' : 'text-gray-500'}>{isChampion ? 'CHAMPION' : isSpecialist ? 'SPECIALIST' : 'NEWCOMER'}</span>
                        <span className="text-gray-700 italic">Ebene 0{k.ebene}</span>
                     </div>
                   </div>
                </div>

                <div className="flex-1 grid grid-cols-5 gap-3">
                  {[
                    { label: '6M EXP', status: gates.duration, val: `${k.months}M`, icon: Calendar },
                    { label: '100 CLS', status: gates.volume, val: k.calls, icon: Phone },
                    { label: '25% FBQ', status: gates.fbq, val: `${k.fbq.toFixed(1)}%`, icon: MessageSquare },
                    { label: '4.73% DP', status: gates.deep, val: `${k.deep.toFixed(1)}%`, icon: Target },
                    { label: '85% AQ', status: gates.aq, val: `${k.aufleger.toFixed(1)}%`, icon: Shield }
                  ].map((g, i) => (
                    <div key={i} className={`p-4 rounded-2xl border ${g.status ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-600/20 bg-red-600/5'} flex flex-col items-center text-center`}>
                       <g.icon size={14} className={g.status ? 'text-emerald-500' : 'text-red-500'} />
                       <div className="text-sm font-black text-white mt-2">{g.val}</div>
                       <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-1">{g.label}</div>
                    </div>
                  ))}
                </div>

                <div className="text-center min-w-[150px]">
                  <div className={`text-4xl font-black tracking-tighter mb-2 ${isChampion ? 'text-white shadow-neon' : 'text-gray-400'}`}>{k.pix.toFixed(2)}</div>
                  <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${passAll ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-600/10 text-red-600 border-red-600/20'}`}>
                    {passAll ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    {passAll ? 'QUALIFIZIERT' : 'GESPERRT'}
                  </div>
                </div>
              </div>

              {/* Evolution Trail */}
              {sortedMonths.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-4 overflow-x-auto pb-2">
                   <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
                     <History size={12} /> Status Evolution
                   </div>
                   <div className="flex items-center gap-2 flex-1">
                     {sortedMonths.slice(-6).map((monthKey, idx) => {
                       const monthAgent = history[monthKey]?.kpiData[k.id];
                       const status = getAgentStatus(monthAgent);
                       
                       return (
                         <div key={monthKey} className="flex items-center gap-2">
                           {idx > 0 && <div className="w-4 h-[1px] bg-white/10"></div>}
                           <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 whitespace-nowrap ${status.bg} ${status.border}`}>
                             {status.icon && <status.icon size={10} className={status.color} />}
                             <div>
                               <div className={`text-[8px] font-black uppercase ${status.color}`}>{status.label}</div>
                               <div className="text-[8px] font-mono text-gray-500">{monthKey}</div>
                             </div>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WCAView;
