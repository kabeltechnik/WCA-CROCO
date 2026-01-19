import React, { useMemo } from 'react';
import { KPIAgent, MonthSnapshot } from '../types';
import { Trophy, Lock, Star, ShieldCheck, BookOpen, UserCheck, Calendar, Phone, MessageSquare, Target, Shield, History, Info, Download } from 'lucide-react';

interface Props {
  kpiData: Record<string, KPIAgent>;
  onOpenAgent: (id: string) => void;
  history?: Record<string, MonthSnapshot>;
}

const WCAView: React.FC<Props> = ({ kpiData, onOpenAgent, history = {} }) => {
  const agents = (Object.values(kpiData) as KPIAgent[]).sort((a,b) => b.pix - a.pix);

  const sortedMonths = useMemo(() => {
    return Object.keys(history).sort((a, b) => {
      const [ma, ya] = a.split('-').map(Number);
      const [mb, yb] = b.split('-').map(Number);
      return new Date(ya, ma - 1).getTime() - new Date(yb, mb - 1).getTime();
    });
  }, [history]);

  const getWcaStatus = (agent: KPIAgent | undefined) => {
    const styles = {
      CHAMPION: { 
        label: 'CHAMPION', 
        color: 'text-[#e60000]', 
        bg: 'bg-[#e60000]/10', 
        border: 'border-[#e60000]', 
        icon: Trophy, 
        shadow: 'shadow-[0_0_15px_rgba(230,0,0,0.4)]'
      },
      SPECIALIST: { 
        label: 'SPECIALIST', 
        color: 'text-white', 
        bg: 'bg-white/10', 
        border: 'border-white', 
        icon: Star, 
        shadow: ''
      },
      NEWCOMER: { 
        label: 'NEWCOMER', 
        color: 'text-gray-500', 
        bg: 'bg-gray-800/50', 
        border: 'border-gray-700', 
        icon: ShieldCheck, 
        shadow: ''
      },
      NA: {
        label: 'N/A',
        color: 'text-gray-700',
        bg: 'bg-transparent',
        border: 'border-gray-800',
        icon: Info,
        shadow: ''
      }
    };

    if (!agent) {
        return { 
          level: 'N/A', 
          config: styles.NA, 
          gates: { duration: false, volume: false, fbq: false, deep: false, aq: false }, 
          gate1Passed: false 
        };
    }
    
    const gates = {
      duration: agent.months >= 6,
      volume: agent.calls >= 100,
      fbq: agent.fbq >= 25,
      deep: agent.deep <= 6.83,
      aq: agent.aufleger >= 85
    };
    const gate1Passed = Object.values(gates).every(v => v);

    let level = 'NEWCOMER';
    if (gate1Passed) {
       if (agent.pix >= 8.1) level = 'CHAMPION';
       else if (agent.pix >= 6.1) level = 'SPECIALIST';
    }

    return { 
      level, 
      config: styles[level as keyof typeof styles], 
      gates, 
      gate1Passed 
    };
  };

  const stats = useMemo(() => {
    let champions = 0;
    let bonusPot = 0;
    agents.forEach(a => {
      const s = getWcaStatus(a);
      if (s.level === 'CHAMPION') {
        champions++;
        bonusPot += 1000;
      } else if (s.level === 'SPECIALIST') {
        bonusPot += 500;
      }
    });
    return { champions, bonusPot };
  }, [agents]);

  const handleExport = () => {
    const headers = ['ID', 'Name', 'Level', 'Gate 1 Passed', 'PIX', 'Bonus'];
    const rows = agents.map(a => {
      const s = getWcaStatus(a);
      const bonus = s.level === 'CHAMPION' ? '1000' : s.level === 'SPECIALIST' ? '500' : '0';
      return [
        a.id,
        `"${a.name}"`,
        s.level,
        s.gate1Passed ? 'JA' : 'NEIN',
        a.pix.toFixed(2),
        bonus
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `VKD_WCA_LEAGUE_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-16 gap-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Trophy className="text-[#e60000]" size={24} />
            </div>
            <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">
              WCA <span className="text-[#e60000]">Liga</span>
            </h2>
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.4em] ml-16">World Class Agent Programm • Saison 2025</p>
        </div>

        <div className="flex gap-6 items-center">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all group mr-4"
          >
            <Download size={14} className="text-gray-400 group-hover:text-white" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">CSV Export</span>
          </button>

          <div className="glass px-8 py-5 rounded-2xl border-l-4 border-l-[#e60000] relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={64} className="text-[#e60000]" /></div>
             <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Aktive Champions</div>
             <div className="text-3xl font-black text-white">{stats.champions} <span className="text-sm text-gray-500 font-normal">Agents</span></div>
          </div>
          <div className="glass px-8 py-5 rounded-2xl border-l-4 border-l-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Star size={64} className="text-white" /></div>
             <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Zyklus Bonus-Topf</div>
             <div className="text-3xl font-black text-white">{stats.bonusPot.toLocaleString()} €</div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {agents.map((agent) => {
          const status = getWcaStatus(agent);
          const { gates, gate1Passed, config } = status;

          return (
            <div 
              key={agent.id} 
              onClick={() => onOpenAgent(agent.id)}
              className={`glass rounded-[32px] p-0 border hover:bg-white/[0.02] transition-all cursor-pointer group relative overflow-hidden ${gate1Passed ? 'border-white/10' : 'border-red-900/30'}`}
            >
              <div className={`h-1 w-full ${gate1Passed ? (status.level === 'CHAMPION' ? 'bg-[#e60000]' : 'bg-white') : 'bg-gray-800'}`}></div>

              <div className="p-8 flex flex-col xl:flex-row gap-10">
                <div className="flex items-start gap-6 min-w-[300px]">
                   <div className={`w-24 h-24 rounded-3xl flex items-center justify-center font-black text-3xl border-2 transition-all ${config.bg} ${config.color} ${config.border} ${config.shadow}`}>
                     {agent.name.substring(0, 2).toUpperCase()}
                   </div>
                   <div className="flex-1">
                     <div className="text-2xl font-black text-white uppercase tracking-tighter italic group-hover:text-[#e60000] transition-colors">{agent.name}</div>
                     <div className="text-[10px] font-mono text-gray-500 mb-3">ID: {agent.id}</div>
                     
                     <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${config.color} ${config.border} bg-black`}>
                        <config.icon size={12} /> {config.label}
                     </div>
                   </div>
                </div>

                <div className="flex-1 bg-black/40 rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Lock size={12} /> Tor 1: Qualifikation
                    </h4>
                    {!gate1Passed && <span className="text-[9px] font-black text-red-500 uppercase bg-red-500/10 px-2 py-0.5 rounded">ZUGRIFF VERWEIGERT</span>}
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { l: '6M EXP', v: `${agent.months}M`, s: gates.duration, i: Calendar },
                      { l: '100 CLS', v: agent.calls, s: gates.volume, i: Phone },
                      { l: '25% FBQ', v: `${agent.fbq.toFixed(0)}%`, s: gates.fbq, i: MessageSquare },
                      { l: '6.83% DDS', v: `${agent.deep.toFixed(2)}%`, s: gates.deep, i: Target }, 
                      { l: '85% AQ', v: `${agent.aufleger.toFixed(0)}%`, s: gates.aq, i: Shield },
                    ].map((g, idx) => (
                      <div key={idx} className={`flex flex-col items-center justify-center p-3 rounded-xl border ${g.s ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                         <g.i size={14} className={`mb-2 ${g.s ? 'text-emerald-500' : 'text-red-500'}`} />
                         <div className={`text-xs font-bold ${g.s ? 'text-white' : 'text-red-500'}`}>{g.v}</div>
                         <div className="text-[8px] text-gray-600 font-black mt-1">{g.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-[280px] flex flex-col gap-2">
                   <div className={`flex items-center justify-between p-3 rounded-xl border ${gate1Passed ? 'bg-white/5 border-white/10' : 'opacity-30 bg-black border-white/5'}`}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-black border border-white/10"><BookOpen size={14} className="text-blue-400"/></div>
                        <div>
                          <div className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Tor 2: Training</div>
                          <div className="text-[10px] font-bold text-white">Lernpfad & Quiz</div>
                        </div>
                      </div>
                      {gate1Passed ? <div className="text-[9px] font-black text-blue-400 uppercase">AUSSTEHEND</div> : <Lock size={12} className="text-gray-600"/>}
                   </div>

                   <div className={`flex items-center justify-between p-3 rounded-xl border ${gate1Passed ? 'bg-white/5 border-white/10' : 'opacity-30 bg-black border-white/5'}`}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-black border border-white/10"><UserCheck size={14} className="text-purple-400"/></div>
                        <div>
                          <div className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Tor 3: Live Audit</div>
                          <div className="text-[10px] font-bold text-white">KEZ Check</div>
                        </div>
                      </div>
                      {gate1Passed ? <div className="text-[9px] font-black text-purple-400 uppercase">AUSSTEHEND</div> : <Lock size={12} className="text-gray-600"/>}
                   </div>
                </div>

                <div className="min-w-[120px] text-right flex flex-col justify-center border-l border-white/10 pl-8">
                  <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Gesamt-Score</div>
                  <div className={`text-5xl font-black italic tracking-tighter ${status.config.color}`}>{agent.pix.toFixed(2)}</div>
                  {gate1Passed && (
                     <div className="text-[9px] font-bold text-gray-400 mt-2 flex justify-end gap-1">
                       Nächster Bonus: <span className="text-white">{status.level === 'NEWCOMER' ? '500€' : status.level === 'SPECIALIST' ? '1.000€' : 'MAX'}</span>
                     </div>
                  )}
                </div>

              </div>
              
              {sortedMonths.length > 0 && (
                <div className="bg-black/40 border-t border-white/5 px-8 py-3 flex items-center gap-4 overflow-x-auto custom-scrollbar">
                   <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest whitespace-nowrap flex items-center gap-2">
                     <History size={10} /> Verlauf
                   </div>
                   {sortedMonths.slice(-6).map((monthKey) => {
                     const mAgent = history[monthKey]?.kpiData[agent.id];
                     const mStatus = getWcaStatus(mAgent);
                     return (
                       <div key={monthKey} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                         <div className="w-[1px] h-3 bg-white/10"></div>
                         <div className="flex flex-col">
                           <span className="text-[8px] font-mono text-gray-500">{monthKey}</span>
                           <span className={`text-[8px] font-black uppercase ${mStatus.config.color}`}>{mStatus.level}</span>
                         </div>
                       </div>
                     )
                   })}
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