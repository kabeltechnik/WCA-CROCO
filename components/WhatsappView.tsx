
import React, { useMemo } from 'react';
import { KPIAgent, AggregatedSales } from '../types';
import { Copy, Check } from 'lucide-react';

interface Props {
  kpiData: Record<string, KPIAgent>;
  getAgentSales: (id: string) => AggregatedSales;
}

const WhatsappView: React.FC<Props> = ({ kpiData, getAgentSales }) => {
  const [copied, setCopied] = React.useState(false);

  const text = useMemo(() => {
    // Fix: Explicitly cast Object.values(kpiData) to KPIAgent[] to avoid "unknown" type errors
    const agents = Object.values(kpiData) as KPIAgent[];
    const topSales = [...agents]
      // Fix: Accessed nettoTotal instead of netto which was not defined on AggregatedSales
      .map(k => ({ name: k.name, n: getAgentSales(k.id).nettoTotal }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 5);

    const topQuality = [...agents]
      .sort((a, b) => b.cs_mw - a.cs_mw)
      .slice(0, 5);

    return `🚀 *TEAM PERFORMANCE UPDATE* 🚀\n\n👑 *TOP VERKÄUFER (Netto)*\n${topSales.map((x, i) => `${i + 1}. ${x.name} (${x.n} Sales)`).join('\n')}\n\n💎 *TOP QUALITÄT (CS)*\n${topQuality.map((x, i) => `${i + 1}. ${x.name} (${x.cs_mw.toFixed(1)}%)`).join('\n')}\n\n#togetherwecan #vodafone #teamspirit`;
  }, [kpiData, getAgentSales]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-2xl mx-auto py-12">
      <h2 className="text-2xl font-black mb-8 flex items-center justify-center gap-3 italic">
        <span className="w-1.5 h-8 bg-emerald-500 rounded-full inline-block"></span>
        WHATSAPP UPDATE GENERATOR
      </h2>

      <div className="bg-[#0c1510] border border-[#1f352a] rounded-3xl p-8 shadow-2xl relative">
        <div className="absolute top-4 right-4 text-[10px] font-black text-emerald-500 uppercase tracking-widest opacity-30">WhatsApp Preview</div>
        <pre className="whitespace-pre-wrap font-mono text-emerald-100 text-sm md:text-base leading-relaxed">
          {text}
        </pre>
      </div>

      <button 
        onClick={handleCopy}
        className={`w-full mt-8 p-6 rounded-3xl font-black flex items-center justify-center gap-3 transition-all transform active:scale-95 ${copied ? 'bg-emerald-500 text-black' : 'bg-[#E60000] text-white hover:bg-[#ff1a1a] shadow-[0_4px_20px_rgba(230,0,0,0.3)]'}`}
      >
        {copied ? <Check /> : <Copy />}
        {copied ? 'TEXT KOPIERT!' : 'TEXT FÜR WHATSAPP KOPIEREN'}
      </button>
    </div>
  );
};

export default WhatsappView;
