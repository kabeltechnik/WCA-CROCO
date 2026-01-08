
import React, { useMemo } from 'react';
import { KPIAgent, AggregatedSales } from '../types';
import { TrendingUp, Award, Zap, Shield, Target, AlertTriangle } from 'lucide-react';

interface Props {
  kpiData: Record<string, KPIAgent>;
  getAgentSales: (id: string) => AggregatedSales;
  onOpenAgent: (id: string) => void;
}

const DashboardView: React.FC<Props> = ({ kpiData, getAgentSales, onOpenAgent }) => {
  const sortedAgents = useMemo(() => {
    return (Object.values(kpiData) as KPIAgent[]).sort((a, b) => b.pix - a.pix);
  }, [kpiData]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end mb-12 border-b border-white/5 pb-10">
        <div>
          <div className="flex items-center gap-4 mb-4">
             <div className="p-3 bg-red-600/20 rounded-2xl border border-red-600/30 text-red-500 shadow-neon">
               <TrendingUp size={24} />
             </div>
             <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter">Ranking <span className="text-red-600">Leaderboard</span></h2>
          </div>
          <p className="text-gray-500 text-xs font-black uppercase tracking-[0.4em] ml-1">Live Performance • Elite Squad Alanya</p>
        </div>
        <div className="flex gap-12">
          <div className="text-right">
            <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Units in View</div>
            <div className="text-3xl font-black text-white">{sortedAgents.length}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Avg PIX</div>
            <div className="text-3xl font-black text-blue-500">
              {(sortedAgents.reduce((acc, curr) => acc + curr.pix, 0) / (sortedAgents.length || 1)).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-10">
        <table className="w-full border-separate border-spacing-y-4">
          <thead>
            <tr className="text-left text-[11px] uppercase font-black tracking-[0.3em] text-gray-600">
              <th className="pb-4 pl-10">Agent Unit</th>
              <th className="pb-4 text-center">Core PIX</th>
              <th className="pb-4 text-center">BNT %</th>
              <th className="pb-4 text-center">VVL %</th>
              <th className="pb-4 text-center">CS</th>
              <th className="pb-4 text-center">FF7</th>
              <th className="pb-4 text-center">Leakage</th>
              <th className="pb-4 pr-10 text-right">Provision</th>
            </tr>
          </thead>
          <tbody>
            {sortedAgents.map((agent) => {
              const sales = getAgentSales(agent.id);
              const isElite = agent.pix >= 8.1;
              const isSpecialist = agent.pix >= 6.1 && agent.pix < 8.1;
              const isCritical = agent.cs_mw < 90 || agent.ff7_mw < 75;

              return (
                <tr 
                  key={agent.id} 
                  onClick={() => onOpenAgent(agent.id)}
                  className={`group transition-all cursor-pointer border relative ${
                    isCritical 
                      ? 'bg-red-900/10 border-red-500/30 hover:bg-red-900/20' 
                      : 'glass border-white/5 hover:bg-white/[0.08]'
                  }`}
                >
                  <td className={`py-6 pl-10 rounded-l-[28px] border-l ${isCritical ? 'border-l-red-500/30' : 'border-l-white/5'}`}>
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border transition-all ${isElite ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/40 shadow-neon' : isSpecialist ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' : 'bg-white/5 text-gray-600 border-white/5'}`}>
                        {agent.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-white text-lg tracking-tighter uppercase flex items-center gap-2">
                          {agent.name}
                          {isElite && <Award size={14} className="text-yellow-500 animate-bounce" />}
                          {isCritical && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-1">Ebene 0{agent.ebene} • ID: {agent.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-center">
                    <div className={`text-3xl font-black tracking-tighter ${isElite ? 'text-white drop-shadow-neon' : isSpecialist ? 'text-blue-400' : 'text-gray-400'}`}>
                      {agent.pix.toFixed(2)}
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="text-emerald-400 font-black text-xl">{agent.bnt_mw.toFixed(1)}%</div>
                    <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1">{sales.bntTotal} PCS</div>
                  </td>
                  <td className="text-center">
                    <div className="text-blue-400 font-black text-xl">{agent.vvl_mw.toFixed(1)}%</div>
                    <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1">{sales.vvlTotal} PCS</div>
                  </td>
                  <td className={`text-center font-bold text-lg ${agent.cs_mw < 90 ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-blue-300'}`}>{agent.cs_mw.toFixed(1)}%</td>
                  <td className={`text-center font-bold text-lg ${agent.ff7_mw < 75 ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'text-emerald-300'}`}>{agent.ff7_mw.toFixed(1)}%</td>
                  <td className="text-center">
                    <div className={`text-lg font-black ${sales.stornoRate > 15 ? 'text-red-500' : 'text-gray-500'}`}>
                      {sales.stornoRate.toFixed(1)}%
                    </div>
                  </td>
                  <td className={`py-6 pr-10 rounded-r-[28px] border-r text-right ${isCritical ? 'border-r-red-500/30' : 'border-r-white/5'}`}>
                    <div className="text-xl font-black text-white tracking-tighter italic">{sales.commissionTotal.toFixed(2)} €</div>
                    <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1">Gerechnet</div>
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
