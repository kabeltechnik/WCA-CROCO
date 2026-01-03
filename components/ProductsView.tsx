
import React, { useState, useMemo } from 'react';
import { SaleRow } from '../types';
import { Cell, PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts';
import { Wifi, Smartphone, Tv, Home, Zap, AlertCircle, Package, Search, Euro, AlertTriangle, Edit3 } from 'lucide-react';

interface Props {
  salesData: SaleRow[];
  onUpdateCommission: (code: string, saleClass: string, val: number) => void;
}

type CategoryFilter = 'ALL' | 'KIP' | 'MOB' | 'TV' | 'ENV' | 'DSL' | 'MISSING';

const ProductsView: React.FC<Props> = ({ salesData, onUpdateCommission }) => {
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const missingCount = useMemo(() => {
    return salesData.filter(s => s.netto > 0 && s.storno === 0 && (!s.commission || s.commission === 0)).length;
  }, [salesData]);

  const segmentStats = useMemo(() => {
    const segments: Record<string, { 
      name: string, 
      id: CategoryFilter,
      netto: number, 
      brutto: number, 
      storno: number, 
      commission: number,
      icon: any,
      products: Record<string, { name: string, netto: number, baseCommission: number, totalCommission: number, code: string, class: string }>
    }> = {
      'KIP': { id: 'KIP', name: 'Internet & Phone', netto: 0, brutto: 0, storno: 0, commission: 0, icon: Wifi, products: {} },
      'MOB': { id: 'MOB', name: 'Mobilfunk', netto: 0, brutto: 0, storno: 0, commission: 0, icon: Smartphone, products: {} },
      'TV': { id: 'TV', name: 'TV & Entertainment', netto: 0, brutto: 0, storno: 0, commission: 0, icon: Tv, products: {} },
      'ENV': { id: 'ENV', name: 'TV Connect / ENV', netto: 0, brutto: 0, storno: 0, commission: 0, icon: Home, products: {} },
      'DSL': { id: 'DSL', name: 'DSL', netto: 0, brutto: 0, storno: 0, commission: 0, icon: Zap, products: {} },
      'MISSING': { id: 'MISSING', name: 'FEHLENDE PROVISIONEN', netto: 0, brutto: 0, storno: 0, commission: 0, icon: AlertTriangle, products: {} }
    };

    salesData.forEach(x => {
      const cls = (x.class || "").toUpperCase();
      let target: CategoryFilter | 'OTH' = 'OTH';
      
      const isMissing = x.netto > 0 && x.storno === 0 && (!x.commission || x.commission === 0);

      if (cls.includes('MOB') || cls.includes('MOBILE')) target = 'MOB';
      else if (cls.includes('PTV') || (cls.includes('TV') && !cls.includes('ENV'))) target = 'TV';
      else if (cls.includes('ENV') || cls.includes('CONNECT') || cls.includes('VTA') || cls.includes('VTY')) target = 'ENV';
      else if (cls.includes('DSL')) target = 'DSL';
      else if (cls.includes('KIP') || cls.includes('FIBER') || cls.includes('I&P') || cls.includes('INTERNET')) target = 'KIP';

      if (target !== 'OTH' && segments[target]) {
        segments[target].brutto += x.brutto;
        segments[target].netto += x.netto;
        segments[target].storno += x.storno;
        
        const saleComm = x.commission || 0;
        if (x.netto > 0 && x.storno === 0) {
          segments[target].commission += saleComm * x.netto;
        }

        const pKey = `${x.code}_${cls}`;
        const matchesSearch = searchQuery === '' || 
          x.prod.toLowerCase().includes(searchQuery.toLowerCase()) || 
          x.code.toLowerCase().includes(searchQuery.toLowerCase());

        const logicMatch = (activeFilter === 'MISSING') ? isMissing : true;

        if (matchesSearch && logicMatch) {
            if (!segments[target].products[pKey]) {
                segments[target].products[pKey] = { 
                  name: x.prod, netto: 0, baseCommission: saleComm, totalCommission: 0, code: x.code, class: cls
                };
            }
            segments[target].products[pKey].netto += x.netto;
            if (x.netto > 0 && x.storno === 0) {
                segments[target].products[pKey].totalCommission += saleComm * x.netto;
            }

            if (isMissing) {
                if (!segments['MISSING'].products[pKey]) {
                    segments['MISSING'].products[pKey] = { 
                        name: x.prod, netto: 0, baseCommission: 0, totalCommission: 0, code: x.code, class: cls
                    };
                }
                segments['MISSING'].products[pKey].netto += x.netto;
            }
        }
      }
    });

    return segments;
  }, [salesData, searchQuery, activeFilter]);

  const filteredSegments = useMemo(() => {
    if (activeFilter === 'MISSING') return [segmentStats['MISSING']];
    return Object.values(segmentStats).filter(s => {
      if (s.id === 'MISSING') return false;
      const matchesCategory = activeFilter === 'ALL' || s.id === activeFilter;
      return matchesCategory && Object.keys(s.products).length > 0;
    });
  }, [segmentStats, activeFilter]);

  const chartData = useMemo(() => {
    return Object.values(segmentStats)
      .filter(s => s.id !== 'MISSING' && s.netto > 0)
      .map(s => ({ name: s.name, value: s.commission }));
  }, [segmentStats]);

  const COLORS = ['#E60000', '#0070D2', '#FFB03B', '#2ECC71', '#9B59B6'];

  const categoryIcons: Record<string, any> = {
    'ALL': Package, 'KIP': Wifi, 'MOB': Smartphone, 'TV': Tv, 'ENV': Home, 'DSL': Zap, 'MISSING': AlertTriangle
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3 italic uppercase tracking-tighter">
            <Package size={32} className="text-[#E60000]" />
            Asset Portfolio Analyse
          </h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1 ml-1">Klicke auf die Provision zum Korrigieren</p>
        </div>

        <div className="flex items-center gap-4">
            {missingCount > 0 && (
                <div className="bg-red-600/20 border border-red-600/30 px-6 py-3 rounded-2xl flex items-center gap-3 animate-pulse">
                    <AlertCircle size={18} className="text-red-500" />
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{missingCount} MAPPING FEHLER</span>
                </div>
            )}
            <div className="relative w-80 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text"
                placeholder="SUCHE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-12 text-[10px] font-black tracking-widest uppercase focus:outline-none"
              />
            </div>
        </div>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-6 mb-10 no-scrollbar">
        {(['ALL', 'KIP', 'MOB', 'TV', 'ENV', 'DSL', 'MISSING'] as CategoryFilter[]).map((cat) => {
          const Icon = categoryIcons[cat];
          const isActive = activeFilter === cat;
          if (cat === 'MISSING' && missingCount === 0) return null;

          return (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all border ${
                isActive 
                ? (cat === 'MISSING' ? 'bg-orange-500 text-black border-orange-500 shadow-neon' : 'bg-[#E60000] text-white border-[#E60000] shadow-neon')
                : 'glass text-gray-500 border-white/5 hover:border-white/20'
              }`}
            >
              <Icon size={16} />
              {cat === 'ALL' ? 'ALLE' : cat === 'MISSING' ? 'FEHLER' : cat}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <div className="glass rounded-[40px] p-10 flex flex-col items-center h-[500px] border border-white/5">
             <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-12 w-full text-center">Provision nach Segment</h3>
             <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={130} paddingAngle={5} dataKey="value" stroke="none">
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '24px' }} />
                  </PieChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="glass rounded-[32px] p-8 border border-white/5">
             <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Globaler Nettoerfolg</span>
                <Euro size={16} className="text-emerald-500" />
             </div>
             <div className="text-5xl font-black text-white tracking-tighter">
               {Object.values(segmentStats).filter(s => s.id !== 'MISSING').reduce((sum, s) => sum + s.commission, 0).toFixed(2)} €
             </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8 max-h-[850px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredSegments.map((s) => (
            <div key={s.id} className={`glass rounded-[40px] p-10 border border-white/5 mb-8 ${s.id === 'MISSING' ? 'border-orange-500/30 bg-orange-500/5' : ''}`}>
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center border border-white/5 ${s.id === 'MISSING' ? 'bg-orange-500/20 text-orange-500' : 'bg-white/5 text-gray-400'}`}>
                    <s.icon size={28} />
                  </div>
                  <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">{s.name}</h4>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/5 bg-black/20 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-[9px] font-black text-gray-500 uppercase">
                    <tr>
                      <th className="py-5 pl-8">Asset & Code</th>
                      <th className="py-5 text-center">Menge</th>
                      <th className="py-5 text-right pr-8">Provision Pro Stück</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/2">
                    {Object.values(s.products).sort((a,b) => b.netto - a.netto).map((p, i) => (
                      <tr key={i} className="group hover:bg-white/5 transition-all">
                        <td className="py-6 pl-8">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-200">{p.name}</span>
                            <span className="text-[9px] font-black text-gray-500 px-2 py-0.5 rounded bg-white/5">{p.code}</span>
                          </div>
                          <div className="text-[9px] font-bold text-gray-600 mt-1 uppercase tracking-widest">{p.class}</div>
                        </td>
                        <td className="py-6 text-center">
                          <span className="bg-white/5 px-4 py-1.5 rounded-full text-xs font-black text-white">{p.netto}</span>
                        </td>
                        <td className="py-6 text-right pr-8">
                          <div className="flex items-center justify-end gap-2">
                             <div className="relative group/input">
                                <input 
                                  type="number"
                                  defaultValue={p.baseCommission}
                                  onBlur={(e) => onUpdateCommission(p.code, p.class, parseFloat(e.target.value) || 0)}
                                  className={`w-24 bg-white/5 border ${p.baseCommission > 0 ? 'border-emerald-500/30' : 'border-red-500/50'} rounded-lg py-1 px-2 text-right text-sm font-black focus:outline-none focus:border-[#E60000] transition-all`}
                                />
                                <span className="absolute right-[-15px] top-1/2 -translate-y-1/2 text-[10px] font-black">€</span>
                                {p.baseCommission === 0 && (
                                  <div className="absolute top-[-25px] right-0 text-[8px] font-black text-red-500 uppercase whitespace-nowrap animate-bounce">Wert eingeben!</div>
                                )}
                             </div>
                          </div>
                          <div className="text-[10px] font-black text-gray-600 mt-1">Σ {(p.baseCommission * p.netto).toFixed(2)} €</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductsView;
