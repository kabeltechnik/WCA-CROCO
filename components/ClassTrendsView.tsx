import React, { useMemo, useState } from 'react';
import { MonthSnapshot } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart2, TrendingUp, Smartphone, Tv, Wifi } from 'lucide-react';

interface Props {
  history: Record<string, MonthSnapshot>;
}

const ClassTrendsView: React.FC<Props> = ({ history }) => {
  const [viewMode, setViewMode] = useState<'BNT' | 'VVL'>('BNT');

  const trendData = useMemo(() => {
    return Object.keys(history).sort().map(key => {
      const snap = history[key];
      const sales = snap.salesData;

      const data: any = { month: key };
      
      data['KIP_BNT'] = 0;
      data['KIP_VVL'] = 0;
      data['MOB_BNT'] = 0;
      data['MOB_VVL'] = 0;
      data['PTV_BNT'] = 0;
      data['DSL_BNT'] = 0;

      sales.forEach(s => {
        const cls = (s.class || '').toUpperCase();
        if (s.netto > 0) { 
           if (cls.includes('KIP') && cls.includes('BNT')) data['KIP_BNT'] += s.netto;
           else if (cls.includes('KIP') && cls.includes('VVL')) data['KIP_VVL'] += s.netto;
           else if (cls.includes('MOB') && cls.includes('BNT')) data['MOB_BNT'] += s.netto;
           else if (cls.includes('MOB') && (cls.includes('VVL') || cls.includes('TW'))) data['MOB_VVL'] += s.netto;
           else if (cls.includes('PTV') || cls.includes('ENV')) data['PTV_BNT'] += s.netto;
           else if (cls.includes('DSL')) data['DSL_BNT'] += s.netto;
        }
      });
      return data;
    });
  }, [history]);

  const configs = {
      BNT: [
          { key: 'KIP_BNT', color: '#10b981', name: 'Kabel Internet (BNT)', icon: Wifi },
          { key: 'MOB_BNT', color: '#E60000', name: 'Mobilfunk (BNT)', icon: Smartphone },
          { key: 'PTV_BNT', color: '#f59e0b', name: 'TV / Connect (BNT)', icon: Tv },
          { key: 'DSL_BNT', color: '#6366f1', name: 'DSL (BNT)', icon: Wifi },
      ],
      VVL: [
          { key: 'KIP_VVL', color: '#34d399', name: 'Kabel Internet (VVL)', icon: Wifi },
          { key: 'MOB_VVL', color: '#ef4444', name: 'Mobilfunk (VVL)', icon: Smartphone },
      ]
  };

  const activeConfig = configs[viewMode];

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter flex items-center gap-4">
            <BarChart2 className="text-[#E60000]" /> Produktklassen <span className="text-[#E60000]">Entwicklung</span>
          </h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] ml-1">Historische Analyse</p>
        </div>
        
        <div className="flex bg-black/50 p-1 rounded-xl border border-white/10">
            <button 
                onClick={() => setViewMode('BNT')} 
                className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'BNT' ? 'bg-[#E60000] text-white shadow-neon' : 'text-gray-500 hover:text-white'}`}
            >
                Neukunden (BNT)
            </button>
            <button 
                onClick={() => setViewMode('VVL')} 
                className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'VVL' ? 'bg-[#E60000] text-white shadow-neon' : 'text-gray-500 hover:text-white'}`}
            >
                Verlängerung (VVL)
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
         <div className="glass rounded-[40px] p-10 border border-white/5 h-[600px] flex flex-col relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <TrendingUp size={200} className="text-white" />
            </div>
            
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  {activeConfig.map((c, i) => (
                      <linearGradient key={c.key} id={`grad-${c.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={c.color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={c.color} stopOpacity={0}/>
                      </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="month" stroke="#444" fontSize={10} fontWeight="900" />
                <YAxis stroke="#444" fontSize={10} fontWeight="900" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#080808', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                  itemStyle={{ fontWeight: '900', fontSize: '12px', padding: '2px 0' }}
                />
                <Legend 
                    iconType="circle" 
                    wrapperStyle={{ paddingTop: '20px' }}
                />
                {activeConfig.map((c) => (
                    <Area 
                        key={c.key}
                        type="monotone" 
                        dataKey={c.key} 
                        name={c.name}
                        stroke={c.color} 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill={`url(#grad-${c.key})`} 
                        stackId="1"
                    />
                ))}
              </AreaChart>
            </ResponsiveContainer>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {activeConfig.map(c => {
                const latestData = trendData[trendData.length - 1] || {};
                const prevData = trendData[trendData.length - 2] || {};
                const val = latestData[c.key] || 0;
                const prev = prevData[c.key] || 0;
                const delta = val - prev;

                return (
                    <div key={c.key} className="glass rounded-[24px] p-6 border border-white/5 flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: `${c.color}20`, color: c.color }}>
                            <c.icon size={24} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{c.name}</div>
                            <div className="text-3xl font-black text-white">{val}</div>
                            <div className={`text-xs font-bold mt-1 ${delta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {delta >= 0 ? '+' : ''}{delta} vgl. Vormonat
                            </div>
                        </div>
                    </div>
                )
            })}
         </div>
      </div>
    </div>
  );
};

export default ClassTrendsView;