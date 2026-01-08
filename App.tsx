
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { LayoutGrid, Medal, MessageCircle, GitMerge, GraduationCap, AlertTriangle, Package, Upload, TrendingUp, FileText, Files, Activity, Search, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AGENTS, PROVISIONS } from './constants';
import { KPIAgent, SaleRow, DashboardTab, AggregatedSales, MonthSnapshot } from './types';
import DashboardView from './components/DashboardView';
import WCAView from './components/WCAView';
import WhatsappView from './components/WhatsappView';
import GapView from './components/GapView';
import CoachingView from './components/CoachingView';
import StornoView from './components/StornoView';
import ProductsView from './components/ProductsView';
import TrendsView from './components/TrendsView';
import AgentModal from './components/AgentModal';

const App: React.FC = () => {
  const [history, setHistory] = useState<Record<string, MonthSnapshot>>(() => {
    const saved = localStorage.getItem('vkd_history_v6_final');
    return saved ? JSON.parse(saved) : {};
  });
  const [activeMonth, setActiveMonth] = useState<string>('');
  const [activeTab, setActiveTab] = useState<DashboardTab>('360');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleOpenAgent = useCallback((id: string) => {
    setSelectedAgentId(id);
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('vkd_history_v6_final', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (!activeMonth && Object.keys(history).length > 0) {
      const latest = Object.keys(history).sort().reverse()[0];
      setActiveMonth(latest);
    }
  }, [history, activeMonth]);

  // Fix: Explicitly type the fallback to match the expected structure and avoid 'unknown' errors later.
  const currentData = useMemo(() => history[activeMonth] || { kpiData: {} as Record<string, KPIAgent>, salesData: [] as SaleRow[] }, [history, activeMonth]);

  // Global Dynamic Filter Logic
  const filteredKpiData = useMemo(() => {
    // Fix: Explicitly cast kpi to Record<string, KPIAgent> to ensure correct type inference for entries.
    const kpi = currentData.kpiData as Record<string, KPIAgent>;
    const query = searchQuery.trim().toUpperCase();
    if (!query) return kpi;

    const filtered: Record<string, KPIAgent> = {};
    Object.entries(kpi).forEach(([id, agent]) => {
      // Fix: Now agent is correctly typed as KPIAgent, resolving property access and assignment errors.
      if (id.includes(query) || agent.name.toUpperCase().includes(query)) {
        filtered[id] = agent;
      }
    });
    return filtered;
  }, [currentData.kpiData, searchQuery]);

  const parseNum = (v: any): number => {
    if (v === undefined || v === null || v === '') return 0;
    if (typeof v === 'number') return v;
    let s = String(v).trim().replace(/[ %€]/g, '').replace(',', '.');
    return parseFloat(s) || 0;
  };

  const findCommission = (crocoCode: string, crocoClass: string): number => {
    const rawCode = String(crocoCode || '').trim().toUpperCase();
    const rawClass = String(crocoClass || '').trim().toUpperCase();
    const isVvl = rawClass.includes('VVL') || rawClass.includes('TW');
    const targetType = isVvl ? 'VVL' : 'BNT';
    let match = PROVISIONS.find(p => p.code.toUpperCase() === rawCode && p.class.toUpperCase().includes(targetType));
    return match ? match.value : 0;
  };

  const normalizeMonthKey = (val: string): string => {
    const matchFilename = val.match(/(\d{2})-(\d{4})/);
    if (matchFilename) return `${matchFilename[2]}-${matchFilename[1]}`;
    const matchIso = val.match(/(\d{4})-(\d{2})/);
    if (matchIso) return `${matchIso[1]}-${matchIso[2]}`;
    return '0000-00';
  };

  const handleKpiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files) as File[]) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result as string;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const b2 = data[1]?.[1];
        const monthKey = normalizeMonthKey(String(b2 || ''));
        const newKpiData: Record<string, KPIAgent> = {};
        data.slice(4).forEach(row => {
          const id = String(row[3] || '').trim();
          if (id && AGENTS[id]) {
            newKpiData[id] = {
              id, name: AGENTS[id], calls: parseNum(row[5]), months: parseNum(row[4]),
              bnt_mw: parseNum(row[7]), bnt_pix: parseNum(row[9]), vvl_mw: parseNum(row[16]),
              vvl_pix: parseNum(row[18]), cs_mw: parseNum(row[10]), cs_pix: parseNum(row[12]),
              ff7_mw: parseNum(row[13]), ff7_pix: parseNum(row[15]), aufleger: parseNum(row[22]),
              tnps: parseNum(row[25]), deep: parseNum(row[28]), fbq: parseNum(row[31]),
              pix: parseNum(row[34]), ebene: String(row[35] || '1')
            };
          }
        });
        if (Object.keys(newKpiData).length > 0) {
          setHistory(prev => ({ ...prev, [monthKey]: { ...(prev[monthKey] || { id: monthKey, label: monthKey, kpiData: {}, salesData: [] }), kpiData: { ...(prev[monthKey]?.kpiData || {}), ...newKpiData } } }));
          setActiveMonth(monthKey);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleCrocoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files) as File[]) {
      const monthKey = normalizeMonthKey(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result as string;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data: any[] = XLSX.utils.sheet_to_json(ws);
        const newSales: SaleRow[] = data.map((row: any) => {
          const id = String(row['CCS: User'] || row['CCS User'] || '').trim();
          const prod = row['Produkt'] || row['Produktname'] || '';
          const code = row['Produktcode'] || row['Produktschlüssel'] || '';
          const cls = row['Produkt Klasse'] || row['Produktklasse'] || '';
          return {
            id, prod, code, class: cls, osf: parseNum(row['OSF Use (#)'] || 0), date: row['Datum'] || '',
            netto: parseNum(row['Netto'] || 0), storno: parseNum(row['Storno'] || 0), brutto: parseNum(row['Brutto'] || 0),
            commission: findCommission(code, cls)
          };
        }).filter(s => s.id && AGENTS[s.id]);
        if (newSales.length > 0) {
          setHistory(prev => ({ ...prev, [monthKey]: { ...(prev[monthKey] || { id: monthKey, label: monthKey, kpiData: {}, salesData: [] }), salesData: newSales } }));
          setActiveMonth(monthKey);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const getAgentSales = useCallback((id: string, monthKey: string = activeMonth): AggregatedSales => {
    const snap = history[monthKey];
    if (!snap) return { nettoTotal: 0, stornoTotal: 0, bruttoTotal: 0, pendingTotal: 0, commissionTotal: 0, bntTotal: 0, bntMobil: 0, bntTV: 0, bntKIP: 0, vvlTotal: 0, vvlMobil: 0, vvlTV: 0, vvlKIP: 0, stornoRate: 0 };
    const agentSales = snap.salesData.filter(s => s.id === id);
    const stats: AggregatedSales = { nettoTotal: 0, stornoTotal: 0, bruttoTotal: 0, pendingTotal: 0, commissionTotal: 0, bntTotal: 0, bntMobil: 0, bntTV: 0, bntKIP: 0, vvlTotal: 0, vvlMobil: 0, vvlTV: 0, vvlKIP: 0, stornoRate: 0 };
    agentSales.forEach(s => {
      stats.nettoTotal += s.netto; stats.stornoTotal += s.storno; stats.bruttoTotal += s.brutto;
      stats.commissionTotal += (s.netto * (s.commission || 0));
      const cls = s.class.toUpperCase();
      if (cls.includes('BNT')) {
        stats.bntTotal += s.netto;
        if (cls.includes('MOB')) stats.bntMobil += s.netto;
        if (cls.includes('PTV')) stats.bntTV += s.netto;
        if (cls.includes('KIP')) stats.bntKIP += s.netto;
      } else if (cls.includes('VVL') || cls.includes('TW')) {
        stats.vvlTotal += s.netto;
        if (cls.includes('MOB')) stats.vvlMobil += s.netto;
        if (cls.includes('PTV')) stats.vvlTV += s.netto;
        if (cls.includes('KIP')) stats.vvlKIP += s.netto;
      }
    });
    const totalTrials = stats.nettoTotal + stats.stornoTotal;
    stats.stornoRate = totalTrials > 0 ? (stats.stornoTotal / totalTrials) * 100 : 0;
    return stats;
  }, [history, activeMonth]);

  const clearHistory = () => { if (window.confirm("Gesamte Historie löschen?")) { setHistory({}); setActiveMonth(''); localStorage.removeItem('vkd_history_v6_final'); } };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-inter selection:bg-red-600 overflow-x-hidden">
      <header className="glass sticky top-0 z-[100] border-b border-white/5">
        <div className="max-w-[1920px] mx-auto px-8 h-24 flex items-center justify-between gap-8">
          <div className="flex items-center gap-12">
            <div className="flex flex-col">
               <h1 className="text-2xl font-black italic tracking-tighter leading-none flex items-center gap-2">
                 <Activity className="text-red-600" size={24} />
                 VKD TEC <span className="text-red-600">ELITE</span>
               </h1>
               <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mt-1">V6.5 Alanya Campus</span>
            </div>
            
            <nav className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
              {[
                { id: '360', icon: LayoutGrid, label: '360°' },
                { id: 'wca', icon: Medal, label: 'WCA' },
                { id: 'trends', icon: TrendingUp, label: 'Trends' },
                { id: 'coaching', icon: GraduationCap, label: 'Mentor' },
                { id: 'gap', icon: GitMerge, label: 'Gap' },
                { id: 'products', icon: Package, label: 'Portfolio' },
                { id: 'whatsapp', icon: MessageCircle, label: 'Share' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DashboardTab)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-red-600 text-white shadow-neon' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                >
                  <tab.icon size={14} /> {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 max-w-md relative hidden xl:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="SEARCH NAME OR ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-3 text-[11px] font-black tracking-widest focus:outline-none focus:border-red-600 transition-all placeholder:text-gray-700"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
              >
                <XCircle size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex gap-2">
               <label title="PIX Upload" className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer transition-all group">
                 <FileText size={16} className="text-red-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest">PIX</span>
                 <input type="file" multiple onChange={handleKpiUpload} className="hidden" />
               </label>
               <label title="Croco Upload" className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer transition-all group">
                 <Files size={16} className="text-blue-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest">CROCO</span>
                 <input type="file" multiple onChange={handleCrocoUpload} className="hidden" />
               </label>
               <button onClick={clearHistory} title="Reset Data" className="p-3 bg-white/5 hover:bg-red-600/20 border border-white/10 rounded-2xl text-gray-500 hover:text-red-500 transition-all">
                 <AlertTriangle size={16} />
               </button>
            </div>

            <select 
              value={activeMonth}
              onChange={(e) => setActiveMonth(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-[10px] font-black tracking-[0.2em] uppercase focus:outline-none cursor-pointer appearance-none text-red-500"
            >
              {Object.keys(history).sort().reverse().map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto px-8 py-12">
        {Object.keys(history).length === 0 ? (
          <div className="h-[70vh] flex flex-col items-center justify-center text-center">
             <div className="w-32 h-32 bg-red-600/10 rounded-[40px] border border-red-600/20 flex items-center justify-center text-red-600 mb-8 shadow-neon animate-pulse">
               <Upload size={48} />
             </div>
             <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4">Einsatzbereitschaft <span className="text-red-600">Herstellen</span></h2>
             <p className="text-gray-500 max-w-md mx-auto leading-relaxed font-medium">Lade PIX- und CROCO-Daten hoch, um das Tactical HUD zu aktivieren.</p>
          </div>
        ) : (
          <>
            {activeTab === '360' && <DashboardView kpiData={filteredKpiData} getAgentSales={getAgentSales} onOpenAgent={handleOpenAgent} />}
            {activeTab === 'wca' && <WCAView kpiData={filteredKpiData} onOpenAgent={handleOpenAgent} history={history} />}
            {activeTab === 'whatsapp' && <WhatsappView kpiData={filteredKpiData} getAgentSales={getAgentSales} />}
            {activeTab === 'gap' && <GapView kpiData={filteredKpiData} salesData={currentData.salesData} onOpenAgent={handleOpenAgent} />}
            {activeTab === 'coaching' && <CoachingView kpiData={filteredKpiData} getAgentSales={getAgentSales} onOpenAgent={handleOpenAgent} history={history} />}
            {activeTab === 'storno' && <StornoView kpiData={filteredKpiData} getAgentSales={getAgentSales} salesData={currentData.salesData} />}
            {activeTab === 'products' && <ProductsView salesData={currentData.salesData} history={history} onUpdateCommission={() => {}} />}
            {activeTab === 'trends' && <TrendsView history={history} getAgentSales={getAgentSales} />}
          </>
        )}
      </main>

      {selectedAgentId && currentData.kpiData[selectedAgentId] && (
        <AgentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          agent={currentData.kpiData[selectedAgentId]}
          sales={currentData.salesData.filter(s => s.id === selectedAgentId)}
          getAgentSales={getAgentSales}
          history={history}
        />
      )}
    </div>
  );
};

export default App;
