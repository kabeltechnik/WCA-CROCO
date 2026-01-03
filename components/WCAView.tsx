
import React from 'react';
import { KPIAgent } from '../types';
import { Trophy, Zap, AlertCircle, CheckCircle2, Shield, Calendar, Phone, MessageSquare, Target } from 'lucide-react';

interface Props {
  kpiData: Record<string, KPIAgent>;
  onOpenAgent: (id: string) => void;
}

const WCAView: React.FC<Props> = ({ kpiData, onOpenAgent }) => {
  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-4xl font-black mb-2 flex items-center gap-4 italic uppercase tracking-tighter">
            <span className="w-2 h-10 bg-yellow-500 rounded-full inline-block shadow-[0_0_15px_rgba(234,179,8,0.5)]"></span>
            World Class Agents Status
          </h2>
          <p className="text-gray-500 text-xs font-black uppercase tracking-[0.4em] ml-6">Zyklus: 01.03.2025 - 31.08.2025</p>
        </div>
        
        <div className="flex gap-4">
          <div className="glass p-4 rounded-2xl border-l-4 border-l-blue-500">
             <div className="text-[9px] font-black text-gray-500 uppercase mb-1">Specialist Bonus</div>
             <div className="text-xl font-black text-white">500 €</div>
          </div>
          <div className="glass p-4 rounded-2xl border-l-4 border-l-yellow-500">
             <div className="text-[9px] font-black text-gray-500 uppercase mb-1">Champion Bonus</div>
             <div className="text-xl font-black text-white">1.000 €</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Fix: Explicitly cast Object.values(kpiData) to KPIAgent[] to avoid "unknown" type errors */}
        {(Object.values(kpiData) as KPIAgent[]).sort((a,b) => b.pix - a.pix).map((k) => {
          // WCA Entry Gates
          const gates = {
            duration: k.months >= 6,
            volume: k.calls >= 100,
            fbq: k.fbq >= 25,
            deep: k.deep <= 4.73,
            aq: k.aufleger >= 85
          };
          
          const passAll = Object.values(gates).every(v => v);
          
          let level = "NEWCOMER";
          let lColor = "text-gray-400";
          let bColor = "border-gray-500/20";
          let gColor = "from-gray-500/10 to-transparent";
          
          if (k.pix >= 8.1) {
            level = "CHAMPION";
            lColor = "text-yellow-500";
            bColor = "border-yellow-500/40";
            gColor = "from-yellow-500/10 to-transparent";
          } else if (k.pix >= 6.1) {
            level = "SPECIALIST";
            lColor = "text-blue-500";
            bColor = "border-blue-500/40";
            gColor = "from-blue-500/10 to-transparent";
          }

          return (
            <div 
              key={k.id} 
              onClick={() => onOpenAgent(k.id)}
              className={`glass rounded-[32px] p-8 border-l-8 ${passAll ? 'border-l-emerald-500' : 'border-l-red-500'} transition-all hover:bg-white/5 cursor-pointer relative group overflow-hidden`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${gColor} opacity-20 pointer-events-none`} />
              
              <div className="flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
                {/* Agent Profile */}
                <div className="flex items-center gap-6 min-w-[300px]">
                   <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center font-black text-3xl shadow-2xl border ${bColor} bg-black/40 ${lColor}`}>
                     {k.name.substring(0, 2).toUpperCase()}
                   </div>
                   <div>
                     <div className="text-2xl font-black text-white uppercase tracking-tighter group-hover:text-[#E60000] transition-colors">{k.name}</div>
                     <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs font-black uppercase tracking-widest ${lColor}`}>{level}</span>
                        <span className="text-gray-600 text-[10px] font-bold tracking-widest uppercase italic">Ebene 0{k.ebene}</span>
                     </div>
                   </div>
                </div>

                {/* Entry Gates Visualizer */}
                <div className="flex-1 grid grid-cols-5 gap-4">
                  {[
                    { label: '6 Monate', status: gates.duration, val: `${k.months} M`, icon: Calendar },
                    { label: '100 Calls', status: gates.volume, val: k.calls, icon: Phone },
                    { label: '25% FBQ', status: gates.fbq, val: `${k.fbq.toFixed(1)}%`, icon: MessageSquare },
                    { label: '4.73% DEEP', status: gates.deep, val: `${k.deep.toFixed(1)}%`, icon: Target },
                    { label: '85% AQ', status: gates.aq, val: `${k.aufleger.toFixed(1)}%`, icon: Shield }
                  ].map((g, i) => (
                    <div key={i} className={`p-4 rounded-2xl border ${g.status ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'} flex flex-col items-center text-center transition-all group-hover:scale-105`}>
                       <g.icon size={16} className={g.status ? 'text-emerald-500' : 'text-red-500'} />
                       <div className="text-[14px] font-black text-white mt-2 leading-none">{g.val}</div>
                       <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">{g.label}</div>
                    </div>
                  ))}
                </div>

                {/* Status Badge */}
                <div className="text-center min-w-[150px]">
                  <div className="text-4xl font-black text-white tracking-tighter mb-1">{k.pix.toFixed(2)}</div>
                  <div className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${passAll ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                    {passAll ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    {passAll ? 'EINGELASSEN' : 'EINLASSSTOP'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WCAView;
