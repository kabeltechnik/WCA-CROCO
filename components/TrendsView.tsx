import React, { useMemo, useState } from 'react';
import { MonthSnapshot, AggregatedSales, KPIAgent } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, Shield, Zap, Target, AlertCircle, ShoppingBag, Smartphone } from 'lucide-react';

interface Props {
  history: Record<string, MonthSnapshot>;
  getAgentSales: (id: string, monthKey: string) => AggregatedSales;
}

const TrendsView: React.FC<Props> = ({ history, getAgentSales }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('TEAM');

  const allAgents = useMemo(() => {
    const agentsMap: Record<string, string> = {};
    (Object.values(history) as MonthSnapshot[]).forEach(snap => {
      Object.values(snap.kpiData).forEach((a: any) => {
        agentsMap[a.id] = a.name;
      });
    });
    return Object.entries(agentsMap).sort((a, b) => a[1].localeCompare(b[1]));
  }, [history]);

  const sortedMonthKeys = useMemo(() => {
      return Object.keys(history).sort((a, b) => {
          const [ma, ya] = a.split('-').map(Number);
          const [mb, yb] = b.split('-').map(Number);
          return new Date(ya, ma - 1).getTime() - new Date(yb, mb - 1).getTime();
      });
  }, [history]);

  const trendData = useMemo(() => {
    return sortedMonthKeys.map(key => {
      const snap = history[key];
      
      if (selectedAgentId === 'TEAM' || selectedAgentId === 'ALL_AGENTS') {
        const agents = Object.values(snap.kpiData) as KPIAgent[];
        const count = agents.length || 1;
        
        // Calculate totals for averaging
        let sumPix = 0;
        let sumCs = 0;
        let sumFf7 = 0;
        let sumAq = 0;
        let sumStornoRate = 0;
        let totalBnt = 0;
        let totalVvl = 0;

        agents.forEach(a => {
            const sales = getAgentSales(a.id, key);
            sumPix += a.pix;
            sumCs += a.cs_mw;
            sumFf7 += a.ff7_mw;
            sumAq += a.aufleger;
            sumStornoRate += sales.stornoRate;
            totalBnt += sales.bntTotal;
            totalVvl += sales.vvlTotal;
        });

        return {
          month: key,
          pix: Number((sumPix / count).toFixed(2)),
          cs: Number((sumCs / count).toFixed(1)),
          ff7: Number((sumFf7 / count).toFixed(1)),
          aq: Number((sumAq / count).toFixed(1)),
          storno: Number((sumStornoRate / count).toFixed(1)),
          bnt: totalBnt, // Total volume for team
          vvl: totalVvl  // Total volume for team
        };
      } else {
        const a = snap.kpiData[selectedAgentId];
        const sales = getAgentSales(selectedAgentId, key);
        
        if (!a) return { month: key, pix: 0, cs: 0, ff7: 0, aq: 0, storno: 0, bnt: 0, vvl: 0 };
        
        return {
          month: key,
          pix: Number(a.pix.toFixed(2)),
          cs: Number(a.cs_mw.toFixed(1)),
          ff7: Number(a.ff7_mw.toFixed(1)),
          aq: Number(a.aufleger.toFixed(1)),
          storno: Number(sales.stornoRate.toFixed(1)),
          bnt: sales.bntTotal,
          vvl: sales.vvlTotal
        };
      }
    });
  }, [history, sortedMonthKeys, getAgentSales, selectedAgentId]);

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter flex items-center gap-4">
            <Activity className="text-blue-500" /> Entwicklungs <span className="text-blue-500">Radar</span>
          </h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] ml-1">Präzise Evolution im Zeitverlauf • Data-Source: Aggregated History</p>
        </div>
        <select 
          value={selectedAgentId}
          onChange={(e) => setSelectedAgentId(e.target.value)}
          className="bg-black text-white border border-white/10 rounded-2xl py-4 px-6 text-[10px] font-black tracking-widest uppercase focus:outline-none focus:border-red-600 transition-all cursor-pointer shadow-2xl appearance-none"
          style={{ backgroundImage: 'linear-gradient(45deg, transparent 50%, #555 50%), linear-gradient(135deg, #555 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
        >
          <option value="TEAM" className="bg-black text-white">GESAMTTEAM DURCHSCHNITT</option>
          {allAgents.map(([id, name]) => <option key={id} value={id} className="bg-black text-white">{name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {[
          { key: 'pix', title: 'PIX Leistung', icon: TrendingUp, color: '#E60000', domain: [0, 10], unit: '' },
          { key: 'bnt', title: 'BNT Volumen (Total)', icon: ShoppingBag, color: '#8b5cf6', domain: ['auto', 'auto'], unit: ' PCS' },
          { key: 'vvl', title: 'VVL Volumen (Total)', icon: Smartphone, color: '#ec4899', domain: ['auto', 'auto'], unit: ' PCS' },
          { key: 'cs', title: 'Smile (CS)', icon: Zap, color: '#3b82f6', domain: [0, 100], unit: '%' },
          { key: 'ff7', title: 'Fix (FF7)', icon: Shield, color: '#10b981', domain: [0, 100], unit: '%' },
          { key: 'storno', title: 'Storno-Quote', icon: AlertCircle, color: '#f43f5e', domain: [0, 50], unit: '%' },
          { key: 'aq', title: 'Aufleger (AQ)', icon: Target, color: '#f59e0b', domain: [0, 100], unit: '%' }
        ].map((chart, idx) => (
          <div key={idx} className="glass rounded-[40px] p-10 border border-white/5 h-[400px] flex flex-col group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                 <chart.icon size={150} style={{ color: chart.color }} />
             </div>
             
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                <chart.icon size={18} style={{ color: chart.color }} />
              </div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest italic">{chart.title}</h3>
            </div>
            
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chart.color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={chart.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="month" stroke="#444" fontSize={10} fontWeight="900" />
                <YAxis domain={chart.domain as any} stroke="#444" fontSize={10} fontWeight="900" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#080808', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: chart.color, fontWeight: '900', fontSize: '12px' }}
                  formatter={(val) => [`${val}${chart.unit}`, chart.title]}
                  labelStyle={{ color: '#888', marginBottom: '0.5rem', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}
                />
                <Area 
                    type="monotone" 
                    dataKey={chart.key} 
                    stroke={chart.color} 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill={`url(#grad-${idx})`}
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendsView;