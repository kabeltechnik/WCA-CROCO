
import React, { useMemo } from 'react';
import { KPIAgent, SaleRow } from '../types';
import { PIX_CONFIG } from '../constants';
import { ArrowUpRight, Target, Trophy, Sparkles, Zap } from 'lucide-react';

interface Props {
  kpiData: Record<string, KPIAgent>;
  salesData: SaleRow[];
  onOpenAgent: (id: string) => void;
}

const GapView: React.FC<Props> = ({ kpiData, salesData, onOpenAgent }) => {
  const calculateNeededBnt = (agent: KPIAgent) => {
    const s = salesData.filter(x => x.id === agent.id);
    const currentBntCount = s.reduce((sum, x) => {
      const cls = (x.class || "").toUpperCase();
      return (cls.includes('BNT') && x.storno === 0) ? sum + x.netto : sum;
    }, 0);
    
    let targetPix = 8.1;
    if (agent.pix < 6.1) targetPix = 6.1;
    else if (agent.pix < 8.1) targetPix = 8.1;

    let neededBNT = 0;
    const calls = agent.calls || 1; 

    if (agent.pix < targetPix) {
      const getPoints = (rate: number) => {
        const arr = PIX_CONFIG.BNT;
        const pts = PIX_CONFIG.BNT_P;
        for (let i = 0; i < arr.length - 1; i++) {
          if (rate >= arr[i] && rate < arr[i + 1]) return pts[i];
        }
        return 10.0;
      };

      // 30% BNT Gewichtung: Wir entfernen den aktuellen BNT-Anteil und simulieren das Delta
      const currentBntContribution = agent.bnt_pix * 0.3;
      const basePix = agent.pix - currentBntContribution;

      for (let i = 1; i <= 150; i++) {
        const simCount = currentBntCount + i;
        const simRate = (simCount / calls) * 100;
        const simPoints = getPoints(simRate);
        const simTotalPix = basePix + (simPoints * 0.3);
        
        if (simTotalPix >= targetPix) {
          neededBNT = i;
          break;
        }
      }
    }
    return { neededBNT, targetPix, currentBntCount };
  };

  const agents = useMemo(() => (Object.values(kpiData) as KPIAgent[]).sort((a,b) => b.pix - a.pix), [kpiData]);

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-4xl font-black flex items-center gap-4 italic uppercase tracking-tighter">
            <span className="w-2 h-10 bg-red-600 rounded-full inline-block shadow-neon"></span>
            Tactical <span className="text-red-600">Gap Analysis</span>
          </h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2 ml-6">Simulation Engine • Precision: 0.3 Weighting Factor</p>
        </div>
        <div className="flex gap-4">
          <div className="glass px-6 py-4 rounded-2xl border-l-4 border-emerald-500">
             <div className="text-[10px] font-black text-gray-600 uppercase">Team BNT Target</div>
             <div className="text-2xl font-black text-white">READY</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {agents.map(agent => {
          const { neededBNT, targetPix, currentBntCount } = calculateNeededBnt(agent);
          const isAtMax = agent.pix >= 8.1;
          const isSpecialist = agent.pix >= 6.1 && agent.pix < 8.1;

          return (
            <div 
              key={agent.id} 
              onClick={() => onOpenAgent(agent.id)}
              className={`glass rounded-[32px] p-8 border border-white/5 transition-all cursor-pointer group relative overflow-hidden ${isAtMax ? 'hover:border-yellow-500/50' : isSpecialist ? 'hover:border-blue-500/50' : 'hover:border-red-600/30'}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="font-black text-xl text-white group-hover:text-red-600 transition-colors uppercase tracking-tighter italic">{agent.name}</div>
                  <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Unit ID {agent.id}</div>
                </div>
                <div className={`px-3 py-1 rounded-xl text-[9px] font-black border uppercase tracking-tighter ${isAtMax ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/40' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                  LVL 0{agent.ebene}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                   <div className="text-[8px] font-black text-gray-600 uppercase mb-1">Status</div>
                   <div className="text-xl font-black text-white">{agent.pix.toFixed(2)}</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                   <div className="text-[8px] font-black text-gray-600 uppercase mb-1">Target</div>
                   <div className={`text-xl font-black ${isAtMax ? 'text-yellow-500' : 'text-blue-400'}`}>{isAtMax ? 'MAX' : targetPix.toFixed(1)}</div>
                </div>
              </div>

              <div className="relative">
                {!isAtMax ? (
                  <div className="flex items-center gap-4 p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 group-hover:bg-emerald-500/10 transition-all">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500 shadow-neon">
                      <Zap size={20} />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-emerald-400">+{neededBNT} BNT</div>
                      <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Next Milestone</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-5 bg-yellow-500/5 rounded-2xl border border-yellow-500/10">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-500 shadow-neon">
                      <Trophy size={20} />
                    </div>
                    <div>
                      <div className="text-lg font-black text-yellow-500 uppercase">CHAMPION</div>
                      <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Elite Status Active</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GapView;
