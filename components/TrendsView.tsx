
import React, { useMemo, useState } from 'react';
import { MonthSnapshot, AggregatedSales, KPIAgent } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, Shield, Zap, MessageSquare, Target, AlertCircle, Timer } from 'lucide-react';

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

  const trendData = useMemo(() => {
    return Object.keys(history).sort().map(key => {
      const snap = history[key];
      if (selectedAgentId === 'TEAM' || selectedAgentId === 'ALL_AGENTS') {
        const agents = Object.values(snap.kpiData) as KPIAgent[];
        const count = agents.length || 1;
        return {
          month: key,
          pix: Number((agents.reduce((s, a) => s + a.pix, 0) / count).toFixed(1)),
          cs: Number((agents.reduce((s, a) => s + a.cs_mw, 0) / count).toFixed(1)),
          ff7: Number((agents.reduce((s, a) => s + a.ff7_mw, 0) / count).toFixed(1)),
          aq: Number((agents.reduce((s, a) => s + a.aufleger, 0) / count).toFixed(1)),
          storno: Number((agents.reduce((s, a) => s + getAgentSales(a.id, key).stornoRate, 0) / count).toFixed(1))
        };
      } else {
        const a = snap.kpiData[selectedAgentId];
        if (!a) return { month: key, pix: 0, cs: 0, ff7: 0, aq: 0, storno: 0 };
        return {
          month: key,
          pix: Number(a.pix.toFixed(1)),
          cs: Number(a.cs_mw.toFixed(1)),
          ff7: Number(a.ff7_mw.toFixed(1)),
          aq: Number(a.aufleger.toFixed(1)),
          storno: Number(getAgentSales(selectedAgentId, key).stornoRate.toFixed(1))
        };
      }
    });
  }, [history, getAgentSales, selectedAgentId]);

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter flex items-center gap-4">
            <Activity className="text-blue-500" /> Evolution <span className="text-blue-500">Radar</span>
          </h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] ml-1">Präzise Evolution im Zeitverlauf (Strikte Rundung: 0.1)</p>
        </div>
        <select 
          value={selectedAgentId}
          onChange={(e) => setSelectedAgentId(e.target.value)}
          className="bg-black text-white border border-white/10 rounded-2xl py-4 px-6 text-[10px] font-black tracking-widest uppercase focus:outline-none focus:border-red-600 transition-all cursor-pointer shadow-2xl appearance-none"
          style={{ backgroundImage: 'linear-gradient(45deg, transparent 50%, #555 50%), linear-gradient(135deg, #555 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
        >
          <option value="TEAM" className="bg-black text-white">GESAMTTEAM DURCHSCHNITT</option>
          <option value="ALL_AGENTS" className="bg-black text-white">ALL AGENTS</option>
          {allAgents.map(([id, name]) => <option key={id} value={id} className="bg-black text-white">{name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {[
          { key: 'pix', title: 'PIX Performance', icon: TrendingUp, color: '#E60000', domain: [0, 10], unit: '' },
          { key: 'cs', title: 'Smile (CS)', icon: Zap, color: '#3b82f6', domain: [0, 100], unit: '%' },
          { key: 'ff7', title: 'Fix (FF7)', icon: Shield, color: '#10b981', domain: [0, 100], unit: '%' },
          { key: 'storno', title: 'Leakage Rate', icon: AlertCircle, color: '#f43f5e', domain: [0, 50], unit: '%' },
          { key: 'aq', title: 'Aufleger (AQ)', icon: Target, color: '#f59e0b', domain: [0, 100], unit: '%' }
        ].map((chart, idx) => (
          <div key={idx} className="glass rounded-[40px] p-10 border border-white/5 h-[400px] flex flex-col group">
            <div className="flex items-center gap-3 mb-6">
              <chart.icon size={18} style={{ color: chart.color }} />
              <h3 className="text-xs font-black text-white uppercase tracking-widest italic">{chart.title}</h3>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chart.color} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={chart.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="month" stroke="#444" fontSize={10} fontWeight="900" />
                <YAxis domain={chart.domain} stroke="#444" fontSize={10} fontWeight="900" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#080808', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: chart.color, fontWeight: '900' }}
                  formatter={(val) => [`${val}${chart.unit}`, chart.title]}
                />
                <Area type="monotone" dataKey={chart.key} stroke={chart.color} strokeWidth={4} fillOpacity={1} fill={`url(#grad-${idx})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendsView;
