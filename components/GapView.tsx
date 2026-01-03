
import React from 'react';
import { KPIAgent, SaleRow } from '../types';
import { PIX_CONFIG } from '../constants';
import { ArrowUpRight, Target, Trophy, Sparkles } from 'lucide-react';

interface Props {
  kpiData: Record<string, KPIAgent>;
  salesData: SaleRow[];
  onOpenAgent: (id: string) => void;
}

const GapView: React.FC<Props> = ({ kpiData, salesData, onOpenAgent }) => {
  const calculateNeededBnt = (agent: KPIAgent) => {
    // Finde alle BNT-Verkäufe des Agenten, die kein Storno sind
    const s = salesData.filter(x => x.id === agent.id);
    const currentBntCount = s.reduce((sum, x) => {
      const cls = (x.class || "").toUpperCase();
      return (cls.includes('BNT') && x.storno === 0) ? sum + x.netto : sum;
    }, 0);
    
    // Ziel-PIX basierend auf WCA-Levels (6.1 Specialist, 8.1 Champion)
    let targetPix = 8.1;
    if (agent.pix < 6.1) targetPix = 6.1;
    else if (agent.pix < 8.1) targetPix = 8.1;

    let neededBNT = 0;
    const calls = agent.calls || 1; // Division durch Null verhindern

    if (agent.pix < targetPix) {
      const getPoints = (rate: number) => {
        const arr = PIX_CONFIG.BNT;
        const pts = PIX_CONFIG.BNT_P;
        for (let i = 0; i < arr.length - 1; i++) {
          if (rate >= arr[i] && rate < arr[i + 1]) return pts[i];
        }
        return 10.0;
      };

      // Simulation: Wie viele BNTs fehlen bis zum Ziel?
      for (let i = 1; i < 200; i++) {
        const simCount = currentBntCount + i;
        const newRate = (simCount / calls) * 100;
        const newPts = getPoints(newRate);
        
        // BNT macht laut WCA ca. 30% des PIX aus (PIX = ... + BNT_PIX * 0.3)
        const newTotalPix = (agent.pix - (agent.bnt_pix * 0.3)) + (newPts * 0.3);
        
        if (newTotalPix >= targetPix) {
          neededBNT = i;
          break;
        }
      }
    }
    return { neededBNT, targetPix, currentBntCount };
  };

  const agents = (Object.values(kpiData) as KPIAgent[]).sort((a,b) => b.pix - a.pix);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3 italic uppercase tracking-tighter">
            <span className="w-1.5 h-10 bg-blue-500 rounded-full inline-block shadow-neon"></span>
            GAP-ANALYSE & WACHSTUM
          </h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1 ml-1">Simulierte BNT-Ziele für den nächsten Level-Up</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {agents.map(agent => {
          const { neededBNT, targetPix, currentBntCount } = calculateNeededBnt(agent);
          const isAtMax = agent.pix >= 8.1;

          return (
            <div 
              key={agent.id} 
              onClick={() => onOpenAgent(agent.id)}
              className={`glass rounded-[32px] p-8 border border-white/5 transition-all cursor-pointer group relative overflow-hidden ${isAtMax ? 'hover:border-yellow-500/50' : 'hover:border-blue-500/50'}`}
            >
              <div className={`absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none ${isAtMax ? 'text-yellow-500' : 'text-blue-500'}`}>
                {isAtMax ? <Trophy size={100} /> : <ArrowUpRight size={100} />}
              </div>

              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="font-black text-xl text-white group-hover:text-[#E60000] transition-colors uppercase italic tracking-tighter">{agent.name}</div>
                  <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-1">ID: {agent.id}</div>
                </div>
                <div className={`px-4 py-1.5 rounded-2xl text-[10px] font-black border uppercase tracking-tighter ${isAtMax ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                  Lvl 0{agent.ebene}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 rounded-[24px] p-5 border border-white/5">
                   <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Status PIX</div>
                   <div className="text-2xl font-black text-white">{agent.pix.toFixed(2)}</div>
                </div>
                <div className="bg-white/5 rounded-[24px] p-5 border border-white/5">
                   <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Ziel PIX</div>
                   <div className={`text-2xl font-black ${isAtMax ? 'text-yellow-500' : 'text-blue-400'}`}>{isAtMax ? 'MAX' : targetPix.toFixed(1)}</div>
                </div>
              </div>

              {!isAtMax ? (
                <div className="flex items-center gap-5 p-6 bg-emerald-500/5 rounded-[28px] border border-emerald-500/10 group-hover:bg-emerald-500/10 transition-all">
                  <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 shadow-neon">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-emerald-400">+{neededBNT} BNT</div>
                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Für Lvl-Up nötig</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-5 p-6 bg-yellow-500/5 rounded-[28px] border border-yellow-500/10">
                  <div className="w-14 h-14 bg-yellow-500/20 rounded-2xl flex items-center justify-center text-yellow-500 shadow-neon">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <div className="text-xl font-black text-yellow-500">CHAMPION</div>
                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Ziel erreicht</div>
                  </div>
                </div>
              )}
              
              <div className="mt-6 text-[9px] font-bold text-gray-600 uppercase tracking-widest text-center italic">
                Aktueller BNT Stock: {currentBntCount} Netto Sales
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GapView;
