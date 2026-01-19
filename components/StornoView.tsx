import React from 'react';
import { KPIAgent, AggregatedSales, SaleRow } from '../types';
import { AlertTriangle, Calendar } from 'lucide-react';

interface Props {
  kpiData: Record<string, KPIAgent>;
  getAgentSales: (id: string) => AggregatedSales;
  salesData: SaleRow[];
}

const StornoView: React.FC<Props> = ({ kpiData, getAgentSales, salesData }) => {
  const criticalAgents = (Object.values(kpiData) as KPIAgent[])
    .map(k => {
      const s = getAgentSales(k.id);
      const rows = salesData.filter(x => x.id === k.id && x.storno === 1);
      return { agent: k, stats: s, recentStornos: rows.slice(-3).reverse() };
    })
    .filter(x => x.stats.stornoRate > 20)
    .sort((a, b) => b.stats.stornoRate - a.stats.stornoRate);

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-2xl font-black mb-8 flex items-center gap-3 italic text-red-500">
        <AlertTriangle size={32} />
        STORNO RADAR (&gt;20%)
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {criticalAgents.map(({ agent, stats, recentStornos }) => (
          <div key={agent.id} className="glass rounded-[32px] p-8 border border-red-500/20 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
              <AlertTriangle size={120} className="text-red-500" />
            </div>
            
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black text-white">{agent.name}</h3>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Status: Kritisch</div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-red-500 tracking-tighter">{stats.stornoRate.toFixed(1)}%</div>
                <div className="text-[10px] font-black text-gray-500 uppercase">Stornoquote</div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Letzte Problem-Verkäufe</h4>
              {recentStornos.length > 0 ? (
                recentStornos.map((storno, i) => (
                  <div key={i} className="bg-red-500/5 rounded-2xl p-4 border border-red-500/10 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-gray-200">{storno.prod}</div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar size={10} /> {storno.date}
                      </div>
                    </div>
                    <div className="text-[10px] font-black text-red-400 bg-red-400/10 px-2 py-1 rounded">STORNO</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 italic">Keine detaillierten Datensätze gefunden.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StornoView;