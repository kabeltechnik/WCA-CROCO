import React, { useMemo, useState } from 'react';
import { KPIAgent, AggregatedSales } from '../types';
import { TrendingUp, Award, Zap, Shield, Target, AlertTriangle, CheckSquare, Square, Download, Users, Brain, ArrowUpDown, Search, XCircle } from 'lucide-react';

interface Props {
  kpiData: Record<string, KPIAgent>;
  getAgentSales: (id: string) => AggregatedSales;
  onOpenAgent: (id: string) => void;
}

type SortField = 'name' | 'pix' | 'bnt_mw' | 'vvl_mw' | 'cs_mw' | 'ff7_mw' | 'storno' | 'commission';

const DashboardView: React.FC<Props> = ({ kpiData, getAgentSales, onOpenAgent }) => {
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ field: SortField, direction: 'asc' | 'desc' }>({ field: 'pix', direction: 'desc' });
  const [localSearch, setLocalSearch] = useState('');

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const processedAgents = useMemo(() => {
    let agents: KPIAgent[] = Object.values(kpiData);

    // 1. Local Filter
    if (localSearch) {
      const q = localSearch.toUpperCase();
      agents = agents.filter(a => a.name.toUpperCase().includes(q) || a.id.includes(q));
    }

    // 2. Sorting
    return agents.sort((a, b) => {
      const salesA = getAgentSales(a.id);
      const salesB = getAgentSales(b.id);
      
      let valA: number | string = 0;
      let valB: number | string = 0;

      switch (sortConfig.field) {
        case 'name': valA = a.name; valB = b.name; break;
        case 'pix': valA = a.pix; valB = b.pix; break;
        case 'bnt_mw': valA = a.bnt_mw; valB = b.bnt_mw; break;
        case 'vvl_mw': valA = a.vvl_mw; valB = b.vvl_mw; break;
        case 'cs_mw': valA = a.cs_mw; valB = b.cs_mw; break;
        case 'ff7_mw': valA = a.ff7_mw; valB = b.ff7_mw; break;
        case 'storno': valA = salesA.stornoRate; valB = salesB.stornoRate; break;
        case 'commission': valA = salesA.commissionTotal; valB = salesB.commissionTotal; break;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [kpiData, getAgentSales, sortConfig, localSearch]);

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedAgents);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedAgents(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedAgents.size === processedAgents.length) {
      setSelectedAgents(new Set());
    } else {
      setSelectedAgents(new Set(processedAgents.map(a => a.id)));
    }
  };

  const handleExport = () => {
    const headers = ['ID', 'Name', 'PIX', 'BNT %', 'VVL %', 'CS %', 'FF7 %', 'Netto Sales', 'Storno %', 'Commission'];
    const rows = processedAgents.map(a => {
      const s = getAgentSales(a.id);
      return [
        a.id,
        `"${a.name}"`,
        a.pix.toFixed(2),
        a.bnt_mw.toFixed(2),
        a.vvl_mw.toFixed(2),
        a.cs_mw.toFixed(2),
        a.ff7_mw.toFixed(2),
        s.nettoTotal,
        s.stornoRate.toFixed(2),
        s.commissionTotal.toFixed(2)
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `VKD_ELITE_DASHBOARD_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const handleBulkAction = (action: string) => {
    if (action === 'coaching') {
      const agentNames = processedAgents.filter(a => selectedAgents.has(a.id)).map(a => a.name);
      alert(`COACHING SESSION INITIATED\n\nTeilnehmer (${selectedAgents.size}):\n${agentNames.join('\n')}\n\nTermin: Automatisch vorgeschlagen für morgen 09:00 Uhr.`);
    } else if (action === 'group') {
      alert(`Neue Leistungsgruppe erstellt mit ${selectedAgents.size} Agenten.`);
    }
    setSelectedAgents(new Set());
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown 
      size={12} 
      className={`ml-1 transition-opacity ${sortConfig.field === field ? 'opacity-100 text-[#e60000]' : 'opacity-30 group-hover:opacity-60'}`} 
    />
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 relative pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/5 pb-10 gap-6">
        <div>
          <div className="flex items-center gap-4 mb-4">
             <div className="p-3 bg-[#e60000] rounded-xl shadow-[0_0_15px_rgba(230,0,0,0.5)] text-white">
               <TrendingUp size={24} />
             </div>
             <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter">Leistungs <span className="text-[#e60000]">Cockpit</span></h2>
          </div>
          <p className="text-gray-500 text-xs font-black uppercase tracking-[0.4em] ml-1">Live Rangliste • Elite Squad Alanya</p>
        </div>
        
        <div className="flex flex-col gap-4 w-full md:w-auto">
          {/* Dashboard Local Search */}
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#E60000] transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Filter..." 
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-2.5 text-[11px] font-bold tracking-widest focus:outline-none focus:border-[#E60000] transition-all placeholder:text-gray-600 text-white"
            />
            {localSearch && (
              <button onClick={() => setLocalSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors">
                <XCircle size={16} />
              </button>
            )}
          </div>

          <div className="flex gap-8 items-center justify-end">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all group"
            >
              <Download size={14} className="text-gray-400 group-hover:text-white" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">CSV Export</span>
            </button>

            <div className="h-10 w-[1px] bg-white/10"></div>

            <div className="text-right">
              <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Angezeigte Einheiten</div>
              <div className="text-3xl font-black text-white">{processedAgents.length}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Ø PIX</div>
              <div className="text-3xl font-black text-[#e60000]">
                {(processedAgents.reduce((acc, curr) => acc + curr.pix, 0) / (processedAgents.length || 1)).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-10">
        <table className="w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left text-[10px] uppercase font-black tracking-[0.2em] text-gray-600 cursor-pointer">
              <th className="pb-4 pl-4 w-10 cursor-default">
                <button onClick={toggleSelectAll} className="hover:text-white transition-colors">
                  {selectedAgents.size > 0 && selectedAgents.size === processedAgents.length ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              </th>
              <th className="pb-4 pl-4 group" onClick={() => handleSort('name')}>
                <div className="flex items-center">Agent / Einheit <SortIcon field="name"/></div>
              </th>
              <th className="pb-4 text-center group" onClick={() => handleSort('pix')}>
                <div className="flex items-center justify-center">Basis PIX <SortIcon field="pix"/></div>
              </th>
              <th className="pb-4 text-center group" onClick={() => handleSort('bnt_mw')}>
                <div className="flex items-center justify-center">BNT % <SortIcon field="bnt_mw"/></div>
              </th>
              <th className="pb-4 text-center group" onClick={() => handleSort('vvl_mw')}>
                <div className="flex items-center justify-center">VVL % <SortIcon field="vvl_mw"/></div>
              </th>
              <th className="pb-4 text-center group" onClick={() => handleSort('cs_mw')}>
                <div className="flex items-center justify-center">CS <SortIcon field="cs_mw"/></div>
              </th>
              <th className="pb-4 text-center group" onClick={() => handleSort('ff7_mw')}>
                <div className="flex items-center justify-center">FF7 <SortIcon field="ff7_mw"/></div>
              </th>
              <th className="pb-4 text-center group" onClick={() => handleSort('storno')}>
                <div className="flex items-center justify-center">Storno <SortIcon field="storno"/></div>
              </th>
              <th className="pb-4 pr-8 text-right group" onClick={() => handleSort('commission')}>
                <div className="flex items-center justify-end">Provision <SortIcon field="commission"/></div>
              </th>
            </tr>
          </thead>
          <tbody>
            {processedAgents.map((agent) => {
              const sales = getAgentSales(agent.id);
              const isElite = agent.pix >= 8.1;
              const isSpecialist = agent.pix >= 6.1 && agent.pix < 8.1;
              const csCrit = agent.cs_mw < 90;
              const ff7Crit = agent.ff7_mw < 75;
              const isCriticalMetric = csCrit || ff7Crit;
              const isSelected = selectedAgents.has(agent.id);

              // Progress Bar Logic
              const pixTarget = 8.1;
              const pixProgress = Math.min((agent.pix / pixTarget) * 100, 100);
              const pixGap = (pixTarget - agent.pix).toFixed(1);

              return (
                <tr 
                  key={agent.id} 
                  onClick={() => onOpenAgent(agent.id)}
                  className={`group transition-all cursor-pointer border relative hover:scale-[1.01] duration-300 ${
                    isSelected ? 'bg-white/5 border-white/20' :
                    isCriticalMetric 
                      ? 'bg-red-950/20 border-red-600/40 shadow-[0_0_10px_rgba(220,38,38,0.1)]' 
                      : 'glass border-white/5 hover:bg-white/10'
                  }`}
                >
                  <td className={`py-5 pl-4 rounded-l-2xl border-l ${isCriticalMetric ? 'border-l-red-600' : isSelected ? 'border-l-white' : 'border-l-white/5'}`}>
                     <button onClick={(e) => toggleSelection(agent.id, e)} className={`transition-colors ${isSelected ? 'text-white' : 'text-gray-600 hover:text-white'}`}>
                       {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                     </button>
                  </td>
                  <td className="pl-4">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border transition-all ${isElite ? 'bg-white text-black border-white' : isSpecialist ? 'bg-[#333] text-white border-white/20' : 'bg-black text-gray-500 border-white/10'}`}>
                        {agent.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-white text-base tracking-tight uppercase flex items-center gap-2 group-hover:text-[#e60000] transition-colors">
                          {agent.name}
                          {isElite && <Award size={14} className="text-[#e60000]" />}
                          {isCriticalMetric && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                        </div>
                        <div className="text-[9px] text-gray-500 font-mono tracking-widest uppercase mt-0.5">ID: {agent.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-center w-32 px-4">
                    <div className={`text-2xl font-black tracking-tighter ${isElite ? 'text-white' : isSpecialist ? 'text-gray-300' : 'text-gray-500'}`}>
                      {agent.pix.toFixed(2)}
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-1.5 bg-gray-800 rounded-full mt-2 overflow-hidden relative">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isElite ? 'bg-yellow-500' : 'bg-[#e60000]'}`} 
                        style={{ width: `${pixProgress}%` }}
                      />
                    </div>
                    {!isElite && <div className="text-[8px] font-bold text-gray-600 mt-1 uppercase text-right">noch {pixGap}</div>}
                  </td>
                  <td className="text-center">
                    <div className="text-white font-bold text-sm">{agent.bnt_mw.toFixed(1)}%</div>
                    <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{sales.bntTotal} PCS</div>
                  </td>
                  <td className="text-center">
                    <div className="text-white font-bold text-sm">{agent.vvl_mw.toFixed(1)}%</div>
                    <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{sales.vvlTotal} PCS</div>
                  </td>
                  <td className="text-center">
                    <div className={`font-bold text-sm flex items-center justify-center gap-1 ${csCrit ? 'text-[#e60000] bg-red-600/10 px-2 py-1 rounded-lg' : 'text-emerald-400'}`}>
                      {csCrit && <AlertTriangle size={10} />}
                      {agent.cs_mw.toFixed(1)}%
                    </div>
                  </td>
                  <td className="text-center">
                    <div className={`font-bold text-sm flex items-center justify-center gap-1 ${ff7Crit ? 'text-[#e60000] bg-red-600/10 px-2 py-1 rounded-lg' : 'text-emerald-400'}`}>
                      {ff7Crit && <AlertTriangle size={10} />}
                      {agent.ff7_mw.toFixed(1)}%
                    </div>
                  </td>
                  <td className="text-center">
                    <div className={`text-sm font-black ${sales.stornoRate > 15 ? 'text-[#e60000]' : 'text-gray-500'}`}>
                      {sales.stornoRate.toFixed(1)}%
                    </div>
                  </td>
                  <td className={`py-5 pr-8 rounded-r-2xl border-r text-right ${isCriticalMetric ? 'border-r-red-600/30' : 'border-r-white/5'}`}>
                    <div className="text-lg font-black text-white tracking-tighter italic">{sales.commissionTotal.toFixed(2)} €</div>
                    <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Berechnet</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* BULK ACTION BAR */}
      {selectedAgents.size > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#111] border border-white/20 rounded-2xl p-4 shadow-2xl flex items-center gap-6 z-[900] animate-in slide-in-from-bottom-10 fade-in">
          <div className="flex items-center gap-3 px-4 border-r border-white/10">
            <div className="bg-white text-black font-black w-6 h-6 rounded-md flex items-center justify-center text-xs">
              {selectedAgents.size}
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ausgewählt</span>
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => handleBulkAction('coaching')} className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-500 hover:text-white rounded-xl font-bold text-xs transition-all border border-blue-600/30">
              <Brain size={14} /> Coaching Zuweisen
            </button>
            <button onClick={() => handleBulkAction('group')} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/20 text-white rounded-xl font-bold text-xs transition-all border border-white/10">
              <Users size={14} /> Gruppe Erstellen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;