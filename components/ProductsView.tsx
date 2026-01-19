import React, { useState, useMemo } from 'react';
import { SaleRow, MonthSnapshot, KPIAgent } from '../types';
import { TrendingDown, TrendingUp, ArrowRight } from 'lucide-react';
import { AGENTS } from '../constants';

interface Props {
  salesData: SaleRow[];
  history: Record<string, MonthSnapshot>;
  onUpdateCommission: (code: string, saleClass: string, val: number) => void;
}

const ProductsView: React.FC<Props> = ({ salesData, history }) => {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const productStats = useMemo(() => {
    const stats: Record<string, { name: string, netto: number, storno: number, class: string, agents: Record<string, number> }> = {};
    salesData.forEach(s => {
      if (!stats[s.prod]) stats[s.prod] = { name: s.prod, netto: 0, storno: 0, class: s.class, agents: {} };
      stats[s.prod].netto += s.netto;
      stats[s.prod].storno += s.storno;
      if (s.netto > 0) {
        stats[s.prod].agents[s.id] = (stats[s.prod].agents[s.id] || 0) + s.netto;
      }
    });
    return Object.values(stats);
  }, [salesData]);

  const topProducts = [...productStats].sort((a, b) => b.netto - a.netto).slice(0, 8);
  const stornoProducts = [...productStats].sort((a, b) => b.storno - a.storno).slice(0, 8);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* TOP ASSETS */}
        <div className="glass rounded-[40px] p-10 border border-white/5">
          <h3 className="text-xl font-black text-white mb-8 uppercase italic tracking-tighter flex items-center gap-3">
            <TrendingUp className="text-emerald-500" /> Top Verkaufsprodukte
          </h3>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <button key={i} onClick={() => setSelectedProduct(p.name)} className="w-full p-6 bg-white/5 hover:bg-white/10 rounded-3xl flex justify-between items-center border border-white/5 transition-all group">
                <div className="text-left">
                  <div className="text-white font-black uppercase text-sm group-hover:text-emerald-400 transition-colors">{p.name}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">{p.class}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-black text-emerald-500">{p.netto}</div>
                  <ArrowRight size={16} className="text-gray-700 group-hover:text-white transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* STORNO TREIBER */}
        <div className="glass rounded-[40px] p-10 border border-white/5">
          <h3 className="text-xl font-black text-white mb-8 uppercase italic tracking-tighter flex items-center gap-3">
            <TrendingDown className="text-red-500" /> Storno-Treiber (Schwund)
          </h3>
          <div className="space-y-3">
            {stornoProducts.map((p, i) => (
              <button key={i} onClick={() => setSelectedProduct(p.name)} className="w-full p-6 bg-red-500/5 hover:bg-red-500/10 rounded-3xl flex justify-between items-center border border-red-500/10 transition-all group">
                <div className="text-left">
                  <div className="text-white font-black uppercase text-sm group-hover:text-red-500 transition-colors">{p.name}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">{p.class}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-black text-red-500">{p.storno}</div>
                  <ArrowRight size={16} className="text-gray-700 group-hover:text-white transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setSelectedProduct(null)} />
          <div className="relative w-full max-w-2xl bg-[#111] rounded-[40px] border border-white/10 p-10 shadow-2xl">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">{selectedProduct}</h4>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mt-1">Verteilungs-Analyse</p>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-4">
              {Object.entries(productStats.find(p => p.name === selectedProduct)?.agents || {})
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .map(([id, count]) => (
                  <div key={id} className="p-5 bg-white/5 rounded-2xl flex justify-between items-center border border-white/5">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center font-black text-xs">
                         {AGENTS[id]?.substring(0,2).toUpperCase() || '??'}
                       </div>
                       <span className="font-black text-white uppercase text-sm">{AGENTS[id] || id}</span>
                    </div>
                    <span className="text-xl font-black text-emerald-400">{count} PCS</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const X = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;

export default ProductsView;