import React, { useMemo, useState } from 'react';
import { KPIAgent, AggregatedSales } from '../types';
import { MessageCircle, Trophy, Target, Shield, Zap, Copy, Check } from 'lucide-react';

interface Props {
  kpiData: Record<string, KPIAgent>;
  getAgentSales: (id: string) => AggregatedSales;
}

type TemplateType = 'SALES_HUNT' | 'QUALITY_GUARD' | 'ELITE_LEAGUE';

const WhatsappView: React.FC<Props> = ({ kpiData, getAgentSales }) => {
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('ELITE_LEAGUE');
  const [copied, setCopied] = useState(false);

  const generateMessage = useMemo(() => {
    const agents = Object.values(kpiData) as KPIAgent[];
    const activeAgents = agents.filter(a => a.calls > 10); // Noise filter
    const totalSales = activeAgents.reduce((sum, a) => sum + getAgentSales(a.id).nettoTotal, 0);
    const avgPix = activeAgents.reduce((sum, a) => sum + a.pix, 0) / (activeAgents.length || 1);

    // Sort Lists
    const salesRank = [...activeAgents].sort((a,b) => getAgentSales(b.id).nettoTotal - getAgentSales(a.id).nettoTotal);
    const pixRank = [...activeAgents].sort((a,b) => b.pix - a.pix);
    const csRank = [...activeAgents].sort((a,b) => b.cs_mw - a.cs_mw);

    const getProgressBar = (val: number, max: number, length: number = 10) => {
        const percent = Math.min(Math.max(val / max, 0), 1);
        const filled = Math.round(length * percent);
        const empty = length - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    };

    const today = new Date().toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });

    if (activeTemplate === 'SALES_HUNT') {
        return `🔥 *SALES JAGD // ${today}* 🔥
        
🎯 *TEAM STATUS*
Sales: ${totalSales} | Ziel: 150
${getProgressBar(totalSales, 150)} ${Math.round((totalSales/150)*100)}%

🏆 *TOP GUNS (Netto)*
🥇 ${salesRank[0]?.name || '-'} (${getAgentSales(salesRank[0]?.id).nettoTotal})
🥈 ${salesRank[1]?.name || '-'} (${getAgentSales(salesRank[1]?.id).nettoTotal})
🥉 ${salesRank[2]?.name || '-'} (${getAgentSales(salesRank[2]?.id).nettoTotal})

🚀 *MOVERS & SHAKERS*
${salesRank.slice(3,6).map(a => `📈 ${a.name}: ${getAgentSales(a.id).nettoTotal}`).join('\n')}

💡 *FOCUS:*
"Jeder Call ist eine Chance. Abschlussquote hochhalten!"

#SalesMachine #AlanyaElite`;
    }

    if (activeTemplate === 'QUALITY_GUARD') {
        return `🛡️ *QUALITY WATCH // ${today}* 🛡️

💎 *PIX LEVEL:* ${avgPix.toFixed(2)}
${getProgressBar(avgPix, 8.1, 8)} Ziel: 8.1

👑 *QUALITY KINGS (PIX)*
${pixRank.slice(0,5).map((a,i) => `${i+1}. ${a.name} → *${a.pix.toFixed(2)}*`).join('\n')}

💖 *KUNDENLIEBLINGE (CS)*
${csRank.slice(0,3).map(a => `💌 ${a.name} (${a.cs_mw.toFixed(1)}%)`).join('\n')}

🚫 *STORNO ZERO HEROES*
${activeAgents.filter(a => getAgentSales(a.id).stornoRate === 0 && getAgentSales(a.id).nettoTotal > 2).slice(0,5).map(a => `✅ ${a.name}`).join(', ')}

#QualityFirst #NoStorno`;
    }

    // ELITE LEAGUE (Default)
    return `⚡ *VKD ELITE BRIEFING // ${today}* ⚡

📊 *MISSION REPORT*
Sales: *${totalSales}*
Ø PIX: *${avgPix.toFixed(2)}*

🏅 *LEADERBOARD*
${salesRank.slice(0,5).map((a, i) => {
    const sales = getAgentSales(a.id).nettoTotal;
    const badge = sales > 10 ? '🔥' : sales > 5 ? '⚡' : '🔹';
    const rankIcon = i===0 ? '🥇' : i===1 ? '🥈' : i===2 ? '🥉' : `#${i+1}`;
    return `${rankIcon} ${a.name} ${badge} ${sales}`;
}).join('\n')}

🎖️ *ACHIEVEMENTS*
🎯 *Sniper (100% CS)*: ${activeAgents.filter(a => a.cs_mw === 100 && a.calls > 20).length} Agents
🚀 *Rocket (>8 PIX)*: ${activeAgents.filter(a => a.pix >= 8).length} Agents

📢 *TAKTISCHE DIREKTIVE*
Fokus auf BNT-Quote legen. GAP schließen.
Wir sind die Spitze. Handeln wir auch so.

#TogetherWeCan #EliteSquad`;

  }, [kpiData, getAgentSales, activeTemplate]);

  const handleCopy = () => {
      navigator.clipboard.writeText(generateMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto py-12 pb-32">
      <div className="flex flex-col items-center mb-12 text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-[30px] flex items-center justify-center text-green-500 mb-6 shadow-neon border border-green-500/30">
          <MessageCircle size={40} />
        </div>
        <h2 className="text-5xl font-black italic uppercase tracking-tighter">Briefing <span className="text-green-500">Studio</span></h2>
        <p className="text-gray-500 text-xs font-black uppercase tracking-[0.4em] mt-3">Visual Gamification Engine v2.0</p>
      </div>

      <div className="flex justify-center gap-4 mb-10">
          {[
              { id: 'ELITE_LEAGUE', label: 'Elite League', icon: Trophy, color: 'text-yellow-400', border: 'border-yellow-500/50' },
              { id: 'SALES_HUNT', label: 'Sales Hunt', icon: Target, color: 'text-red-500', border: 'border-red-500/50' },
              { id: 'QUALITY_GUARD', label: 'Quality Guard', icon: Shield, color: 'text-blue-400', border: 'border-blue-500/50' },
          ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTemplate(t.id as TemplateType)}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all ${activeTemplate === t.id ? `bg-white/10 ${t.border} ${t.color}` : 'bg-black/40 border-white/5 text-gray-500 hover:bg-white/5'}`}
              >
                  <t.icon size={18} />
                  <span className="font-black uppercase tracking-wider text-xs">{t.label}</span>
              </button>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass rounded-[40px] p-1 bg-[#0a0a0a] border border-white/10 shadow-2xl">
            <div className="bg-[#121b22] rounded-[36px] h-full overflow-hidden flex flex-col">
                <div className="p-4 bg-[#202c33] flex items-center gap-4 border-b border-white/5">
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold">VY</div>
                    <div>
                        <div className="text-white font-bold text-sm">Elite Squad Alanya</div>
                        <div className="text-xs text-gray-400">Veysel, Team...</div>
                    </div>
                </div>
                <div className="p-6 flex-1 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-opacity-5">
                    <div className="bg-[#202c33] p-4 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl shadow-lg border border-white/5 inline-block max-w-[90%]">
                         <pre className="whitespace-pre-wrap font-sans text-gray-200 text-sm leading-relaxed">
                             {generateMessage}
                         </pre>
                         <div className="text-[10px] text-gray-500 text-right mt-2 flex justify-end gap-1">
                             {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} <Check size={12} className="text-blue-400" />
                         </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex flex-col justify-center gap-6">
            <div className="glass p-8 rounded-[32px] border border-white/5">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-4 flex items-center gap-2">
                    <Zap size={20} className="text-yellow-500"/> Gamification Treiber
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-2xl">🔥</div>
                        <div>
                            <div className="text-xs font-bold text-white uppercase">Sales Streak</div>
                            <div className="text-[10px] text-gray-500">Wird vergeben ab 5+ Sales</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-2xl">🎯</div>
                        <div>
                            <div className="text-xs font-bold text-white uppercase">Sniper Badge</div>
                            <div className="text-[10px] text-gray-500">Exklusiv für 100% CS Score</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-2xl">👑</div>
                        <div>
                            <div className="text-xs font-bold text-white uppercase">Quality King</div>
                            <div className="text-[10px] text-gray-500">Top 3 PIX Ranking</div>
                        </div>
                    </div>
                </div>
            </div>

            <button 
                onClick={handleCopy}
                className={`w-full py-6 rounded-[24px] font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-neon ${copied ? 'bg-green-500 text-black' : 'bg-white text-black hover:bg-gray-200'}`}
            >
                {copied ? <Check /> : <Copy />}
                {copied ? 'Kopiert!' : 'Text Kopieren'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsappView;