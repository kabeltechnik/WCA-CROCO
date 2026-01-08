
import React, { useMemo } from 'react';
import { KPIAgent, AggregatedSales } from '../types';
import { Copy, Check, MessageCircle } from 'lucide-react';

interface Props {
  kpiData: Record<string, KPIAgent>;
  getAgentSales: (id: string) => AggregatedSales;
}

const WhatsappView: React.FC<Props> = ({ kpiData, getAgentSales }) => {
  const [copied, setCopied] = React.useState(false);

  const stats = useMemo(() => {
    // QUALIFIKATIONS-FILTER: Mindestens 100 Calls
    const agents = (Object.values(kpiData) as KPIAgent[]).filter(a => a.calls >= 100);
    
    const salesRank = [...agents].map(k => ({ name: k.name, n: getAgentSales(k.id).nettoTotal })).sort((a,b) => b.n - a.n).slice(0,5);
    const qualityRank = [...agents].sort((a,b) => b.pix - a.pix).slice(0,5);
    const csRank = [...agents].sort((a,b) => b.cs_mw - a.cs_mw).slice(0,3);
    const lowStorno = [...agents].map(k => ({ name: k.name, s: getAgentSales(k.id).stornoRate, n: getAgentSales(k.id).nettoTotal }))
      .filter(x => x.n >= 5) // Mindestens 5 Sales für Storno-Ranking
      .sort((a,b) => a.s - b.s).slice(0,3);

    return `🚀 *VKD PERFORMANCE RADAR* 🚀
${new Date().toLocaleDateString('de-DE')} • Alanya Campus
(Filter: Nur Einheiten mit >= 100 Calls)

🏆 *SALES KÖNIGE (Netto)*
${salesRank.map((x, i) => `${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} ${x.name} → ${x.n} Sales`).join('\n')}

💎 *WCA ELITE (PIX)*
${qualityRank.map((x, i) => `⭐ ${x.name} → ${x.pix.toFixed(1)} Pkt`).join('\n')}

🎯 *CS CHAMPIONS*
${csRank.map((x, i) => `✅ ${x.name} → ${x.cs_mw.toFixed(1)}%`).join('\n')}

🛡️ *STORNO-WÄCHTER*
${lowStorno.map((x, i) => `🛡️ ${x.name} → ${x.s.toFixed(1)}%`).join('\n')}

*#togetherwecan #elitesquad #performance*`;
  }, [kpiData, getAgentSales]);

  return (
    <div className="animate-in fade-in duration-500 max-w-2xl mx-auto py-12">
      <div className="flex flex-col items-center mb-10">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-[30px] flex items-center justify-center text-emerald-500 mb-6 shadow-neon">
          <MessageCircle size={40} />
        </div>
        <h2 className="text-4xl font-black italic uppercase tracking-tighter">Update <span className="text-emerald-500">Generator</span></h2>
      </div>

      <div className="glass rounded-[40px] p-10 border border-emerald-500/20 bg-[#0a0a0a] relative">
        <div className="absolute top-6 right-8 text-[10px] font-black text-emerald-500/30 uppercase tracking-[0.3em]">Broadcast Ready</div>
        <pre className="whitespace-pre-wrap font-mono text-emerald-100 text-sm leading-relaxed">
          {stats}
        </pre>
      </div>

      <button onClick={() => { navigator.clipboard.writeText(stats); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className={`w-full mt-10 p-8 rounded-[32px] font-black text-xl flex items-center justify-center gap-4 transition-all transform active:scale-95 ${copied ? 'bg-emerald-500 text-black' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-neon'}`}>
        {copied ? 'BEREIT ZUM VERSENDEN!' : 'FÜR WHATSAPP KOPIEREN'}
      </button>
    </div>
  );
};

export default WhatsappView;
