
import React from 'react';
import { KPIAgent, AggregatedSales } from '../types';
import { Shield, Zap, TrendingUp, AlertCircle } from 'lucide-react';

interface Props {
  kpiData: Record<string, KPIAgent>;
  getAgentSales: (id: string) => AggregatedSales;
  onOpenAgent: (id: string) => void;
}

const DashboardView: React.FC<Props> = ({ kpiData, getAgentSales, onOpenAgent }) => {
  // Fix: Explicitly cast Object.values(kpiData) to KPIAgent[] to avoid "unknown" type errors
  const sortedAgents = (Object.values(kpiData) as KPIAgent[]).sort((a, b) => b.pix - a.pix);

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex justify-between items-end mb-12 border-b border-white/10 pb-10">
        <div>
          <div className="flex items-center gap-4 mb-4">
             <div className="p-3 bg-red-600/20 rounded-2xl border border-red-600/30 text-red-500 shadow-neon">
               <TrendingUp size={24} />
             </div>
             <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter">
               Strategisches Ranking
             </h2>
          </div>
          <p className="text-gray-500 text-xs font-black uppercase tracking-[0.4em] ml-1">Einsatzdaten Live • Alanya Standort</p>
        </div>
        <div className="flex gap-10">
          <div className="text-right">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Einsatzkräfte</div>
            <div className="text-3xl font-black text-white">{sortedAgents.length} <span className="text-sm text-gray-600">AGENTEN</span></div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Betriebliche Gesundheit</div>
            <div className="text-3xl font-black text-emerald-500">98.4%</div>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-6">
          <thead>
            <tr className="text-left text-[11px] uppercase font-black tracking-[0.3em] text-gray-600 px-4">
              <th className="pb-4 pl-10">Operative Einheit</th>
              <th className="pb-4">Basis Ebene</th>
              <th className="pb-4 text-center">Kern PIX</th>
              <th className="pb-4 text-center">BNT Σ <span className="text-emerald-500 block text-[9px] mt-1">(Netto)</span></th>
              <th className="pb-4 text-center">VVL Σ <span className="text-blue-500 block text-[9px] mt-1">(Netto)</span></th>
              <th className="pb-4 text-center text-blue-400">Smile (CS)</th>
              <th className="pb-4 text-center text-emerald-400">Fix (FF7)</th>
              <th className="pb-4 pr-10 text-center text-red-500">Storno Leak</th>
            </tr>
          </thead>
          <tbody>
            {sortedAgents.map((agent) => {
              const sales = getAgentSales(agent.id);
              const isHighPerformer = agent.pix >= 8.1;
              return (
                <tr 
                  key={agent.id} 
                  onClick={() => onOpenAgent(agent.id)}
                  className={`group relative glass hover:bg-white/[0.07] transition-all cursor-pointer border border-white/5 ${isHighPerformer ? 'hover:shadow-[0_0_40px_rgba(230,0,0,0.1)]' : ''}`}
                >
                  <td className="py-8 pl-10 rounded-l-[32px] border-l border-white/5">
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center font-black text-xl transition-all shadow-2xl border ${isHighPerformer ? 'bg-gradient-to-br from-[#E60000] to-[#800000] text-white border-white/20 group-hover:rotate-6 shadow-[#E60000]/20' : 'bg-white/5 text-gray-400 border-white/5 group-hover:text-white'}`}>
                        {agent.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-white text-xl group-hover:text-[#E60000] transition-colors tracking-tighter uppercase">{agent.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-1 flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-emerald-500"></span> ID: {agent.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                       <Shield size={14} className={isHighPerformer ? 'text-yellow-500' : 'text-gray-700'} />
                       <span className="bg-white/5 text-gray-400 px-4 py-1.5 rounded-full text-[10px] font-black border border-white/5 uppercase tracking-tighter">
                         Level 0{agent.ebene}
                       </span>
                    </div>
                  </td>
                  <td className="text-center">
                    <div className={`text-4xl font-black tracking-tighter leading-none ${isHighPerformer ? 'text-white drop-shadow-neon' : 'text-gray-400'}`}>
                      {agent.pix.toFixed(2)}
                    </div>
                  </td>
                  <td className="text-center">
                    <div className={`font-black text-2xl ${agent.bnt_mw < 3 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {agent.bnt_mw.toFixed(2)}%
                    </div>
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-tighter mt-1">{sales.bntTotal} <span className="text-[8px] opacity-50">SALES</span></div>
                  </td>
                  <td className="text-center">
                    <div className="text-white font-black text-2xl">{agent.vvl_mw.toFixed(2)}%</div>
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-tighter mt-1">{sales.vvlTotal} <span className="text-[8px] opacity-50">SALES</span></div>
                  </td>
                  <td className="text-center">
                    <div className={`font-black text-2xl ${agent.cs_mw < 90 ? 'text-orange-400' : 'text-blue-400'}`}>
                      {agent.cs_mw.toFixed(1)}%
                    </div>
                  </td>
                  <td className="text-center text-emerald-400 font-black text-2xl">{agent.ff7_mw.toFixed(1)}%</td>
                  <td className="text-center pr-10 rounded-r-[32px] border-r border-white/5">
                    <div className={`text-2xl font-black ${sales.stornoTotal > 5 ? 'text-red-500 animate-pulse' : 'text-gray-600'}`}>
                      {sales.stornoTotal}
                    </div>
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1 flex items-center justify-center gap-1">
                      <AlertCircle size={10} /> {sales.stornoRate.toFixed(1)}%
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardView;
