import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { LayoutGrid, Medal, MessageCircle, GraduationCap, Package, Upload, TrendingUp, FileText, Files, Activity, Search, XCircle, LogOut, Euro, BarChart2, Mail, Calendar, ChevronDown, Check } from 'lucide-react';
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
import ClassTrendsView from './components/ClassTrendsView';
import CommissionManager from './components/CommissionManager';
import AgentModal from './components/AgentModal';
import FeedbackModal from './components/FeedbackModal';

const App: React.FC = () => {
  const [history, setHistory] = useState<Record<string, MonthSnapshot>>(() => {
    const saved = localStorage.getItem('vkd_history_v6_final');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [customProvisions, setCustomProvisions] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('vkd_custom_provisions');
    return saved ? JSON.parse(saved) : {};
  });

  // Changed to array for multi-selection
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<DashboardTab>('360');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleOpenAgent = useCallback((id: string) => {
    setSelectedAgentId(id);
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('vkd_history_v6_final', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('vkd_custom_provisions', JSON.stringify(customProvisions));
  }, [customProvisions]);

  // Initial month selection
  useEffect(() => {
    if (selectedMonths.length === 0 && Object.keys(history).length > 0) {
      const latest = Object.keys(history).sort().reverse()[0];
      setSelectedMonths([latest]);
    }
  }, [history]);

  const toggleMonth = (month: string) => {
    setSelectedMonths(prev => {
      if (prev.includes(month)) {
        // Prevent deselecting the last month
        if (prev.length === 1) return prev;
        return prev.filter(m => m !== month);
      } else {
        return [...prev, month];
      }
    });
  };

  const handleUpdateProvision = useCallback((identifier: string, value: number, typeContext?: string) => {
    // identifier ist entweder der Code oder die Beschreibung (vom CommissionManager gesteuert)
    // Wenn typeContext vorhanden ist, speichern wir es spezifisch (Identifier#Type)
    // Wenn kein typeContext da ist (oder schon im Key enthalten), nehmen wir den Identifier direkt.
    const storeKey = typeContext && !identifier.includes('#') ? `${identifier}#${typeContext}` : identifier;
    setCustomProvisions(prev => ({ ...prev, [storeKey]: value }));
  }, []);

  const findCommission = useCallback((crocoCode: string, crocoClass: string, crocoProd: string): number => {
    const cCode = String(crocoCode || '').trim();
    const cClass = String(crocoClass || '').trim().toUpperCase();
    const cProd = String(crocoProd || '').trim();

    // 1. Bestimme Produkttyp (BNT vs VVL)
    let type = 'BNT';
    if (cClass.includes('VVL') || cClass.includes('TW') || cClass.includes('UP') || cClass.includes('RET')) type = 'VVL';
    
    // --- BENUTZERDEFINIERTE PROVISIONEN (Prioritäts-Kette) ---

    // Priorität A: Spezifischer Code + Typ (z.B. "ABC:123#BNT")
    const customKeySpecificCode = `${cCode}#${type}`;
    if (customProvisions[customKeySpecificCode] !== undefined) return customProvisions[customKeySpecificCode];
    
    // Priorität B: Globaler Code (z.B. "ABC:123")
    if (customProvisions[cCode] !== undefined) return customProvisions[cCode];

    // Priorität C: Spezifische Beschreibung + Typ (z.B. "Vodafone Smart L#VVL") - FALLBACK wenn Code nicht greift
    const customKeySpecificDesc = `${cProd}#${type}`;
    if (customProvisions[customKeySpecificDesc] !== undefined) return customProvisions[customKeySpecificDesc];

    // Priorität D: Globale Beschreibung (z.B. "Vodafone Smart L") - FALLBACK
    if (customProvisions[cProd] !== undefined) return customProvisions[cProd];


    // --- STANDARD PROVISIONS-LISTE (PROVISIONS Constant) ---

    // Strategie 1: Suche nach Code
    let candidates = PROVISIONS.filter(p => p.code.toUpperCase() === cCode.toUpperCase());

    // Strategie 2: Suche nach Beschreibung (Fallback, falls kein Code-Match oder Code leer)
    if (candidates.length === 0 && cProd) {
        // Exakter Namensvergleich
        candidates = PROVISIONS.filter(p => p.prod.toLowerCase() === cProd.toLowerCase());
        
        // Fuzzy Suche (Beschreibung enthält Produktname aus Liste)
        if (candidates.length === 0) {
             candidates = PROVISIONS.filter(p => cProd.toLowerCase().includes(p.prod.toLowerCase()));
        }
    }

    if (candidates.length === 0) return 0;

    // Auswahl des besten Matches aus den Kandidaten basierend auf Klasse/Typ
    const bestMatch = candidates.reduce((best, candidate) => {
        let score = 0;
        const pClass = candidate.class.toUpperCase();

        // Exakter Klassen-Match
        if (pClass === cClass) score += 100;
        // Enthaltensein
        else if (cClass.includes(pClass)) score += 50;
        else if (pClass.includes(cClass)) score += 40;

        // Typ-Kontext Matching (BNT/VVL)
        const candidateIsVVL = pClass.includes('VVL') || pClass.includes('TW');
        const candidateIsBNT = pClass.includes('BNT');
        const targetIsVVL = type === 'VVL';

        if (targetIsVVL && candidateIsVVL) score += 20;
        if (!targetIsVVL && candidateIsBNT) score += 20;

        // Spezifische Keyword-Boni
        if (cClass.includes('OPTION') && pClass.includes('OPTION')) score += 10;
        if (cClass.includes('NBA') && pClass.includes('NBA')) score += 10;

        if (score > best.score) return { candidate, score };
        return best;
    }, { candidate: null as any, score: -1 });

    // Wenn ein guter Kandidat gefunden wurde
    if (bestMatch.candidate && bestMatch.score > 0) {
        return bestMatch.candidate.value;
    }

    // Notfall-Fallback: Filterung nach Typ
    const typeMatch = candidates.find(p => {
         const pClass = p.class.toUpperCase();
         if (type === 'VVL') return pClass.includes('VVL') || pClass.includes('TW');
         return pClass.includes('BNT');
    });

    return typeMatch ? typeMatch.value : candidates[0].value;
  }, [customProvisions]);

  // Aggregated Data Calculation
  const currentData = useMemo(() => {
    if (selectedMonths.length === 0) return { kpiData: {}, salesData: [] };

    // 1. Collect all sales data from selected months
    let aggregatedSales: SaleRow[] = [];
    selectedMonths.forEach(m => {
      if (history[m]) {
        aggregatedSales = [...aggregatedSales, ...history[m].salesData];
      }
    });

    // Apply commissions
    aggregatedSales = aggregatedSales.map(s => ({
      ...s,
      commission: findCommission(s.code, s.class, s.prod)
    }));

    // 2. Aggregate KPI Data
    const aggregatedKPIs: Record<string, KPIAgent> = {};
    const agentIds = new Set<string>();
    
    selectedMonths.forEach(m => {
      if (history[m]) {
        Object.keys(history[m].kpiData).forEach(id => agentIds.add(id));
      }
    });

    agentIds.forEach(id => {
      let totalCalls = 0;
      let totalMonths = 0; // Max
      let weightedSumCS = 0;
      let weightedSumFF7 = 0;
      let weightedSumBNT = 0;
      let weightedSumVVL = 0;
      let weightedSumAufleger = 0;
      let sumPIX = 0;
      let count = 0;
      let name = '';
      let ebene = '1';
      let deepSum = 0;
      let fbqSum = 0;

      selectedMonths.forEach(m => {
        const agent = history[m]?.kpiData[id];
        if (agent) {
          name = agent.name;
          ebene = agent.ebene;
          totalCalls += agent.calls;
          totalMonths = Math.max(totalMonths, agent.months);
          
          weightedSumCS += (agent.cs_mw * agent.calls);
          weightedSumFF7 += (agent.ff7_mw * agent.calls);
          
          weightedSumBNT += (agent.bnt_mw * agent.calls);
          weightedSumVVL += (agent.vvl_mw * agent.calls);
          weightedSumAufleger += (agent.aufleger * agent.calls);
          
          sumPIX += agent.pix;
          deepSum += agent.deep;
          fbqSum += agent.fbq;
          count++;
        }
      });

      if (count > 0) {
        aggregatedKPIs[id] = {
          id,
          name,
          ebene,
          months: totalMonths,
          calls: totalCalls,
          cs_mw: totalCalls > 0 ? weightedSumCS / totalCalls : 0,
          ff7_mw: totalCalls > 0 ? weightedSumFF7 / totalCalls : 0,
          bnt_mw: totalCalls > 0 ? weightedSumBNT / totalCalls : 0,
          vvl_mw: totalCalls > 0 ? weightedSumVVL / totalCalls : 0,
          aufleger: totalCalls > 0 ? weightedSumAufleger / totalCalls : 0,
          pix: sumPIX / count,
          deep: deepSum / count,
          fbq: fbqSum / count,
          bnt_pix: 0, 
          vvl_pix: 0, 
          cs_pix: 0,
          ff7_pix: 0,
          tnps: 0
        };
      }
    });

    return {
      kpiData: aggregatedKPIs,
      salesData: aggregatedSales
    };
  }, [history, selectedMonths, findCommission]);

  const filteredKpiData = useMemo(() => {
    const kpi = currentData.kpiData as Record<string, KPIAgent>;
    const query = searchQuery.trim().toUpperCase();
    if (!query) return kpi;
    const filtered: Record<string, KPIAgent> = {};
    Object.entries(kpi).forEach(([id, agent]) => {
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
          if (selectedMonths.length === 0) setSelectedMonths([monthKey]);
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
            commission: 0
          };
        }).filter(s => s.id && AGENTS[s.id]);
        if (newSales.length > 0) {
          setHistory(prev => ({ 
            ...prev, 
            [monthKey]: { 
              ...(prev[monthKey] || { id: monthKey, label: monthKey, kpiData: {}, salesData: [] }), 
              salesData: [...(prev[monthKey]?.salesData || []), ...newSales] 
            } 
          }));
          if (selectedMonths.length === 0) setSelectedMonths([monthKey]);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const getAgentSales = useCallback((id: string, monthKeys?: string[] | string): AggregatedSales => {
    const targetMonths = Array.isArray(monthKeys) 
      ? monthKeys 
      : (typeof monthKeys === 'string' ? [monthKeys] : selectedMonths);
    
    let combinedSales: SaleRow[] = [];
    
    targetMonths.forEach(m => {
        if (history[m]) combinedSales = [...combinedSales, ...history[m].salesData];
    });

    const agentSales = combinedSales.filter(s => s.id === id).map(s => ({
      ...s,
      commission: findCommission(s.code, s.class, s.prod)
    }));

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
  }, [history, selectedMonths, findCommission]);

  const clearHistory = () => { if (window.confirm("ACHTUNG: Gesamte Datenbank unwiderruflich löschen?")) { setHistory({}); setSelectedMonths([]); localStorage.removeItem('vkd_history_v6_final'); } };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-inter selection:bg-[#E60000] selection:text-white overflow-x-hidden">
      <header className="glass sticky top-0 z-[100] border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="max-w-[1920px] mx-auto px-6 h-20 flex items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
               <h1 className="text-2xl font-black italic tracking-tighter leading-none flex items-center gap-3 text-white">
                 <div className="w-10 h-10 bg-[#E60000] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(230,0,0,0.5)]">
                    <Activity className="text-white" size={20} />
                 </div>
                 <span>VKD TEC <span className="text-[#E60000]">COMMAND</span></span>
               </h1>
            </div>
            
            <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

            <nav className="flex items-center gap-1">
              {[
                { id: '360', icon: LayoutGrid, label: 'Cockpit' },
                { id: 'wca', icon: Medal, label: 'WCA Liga' },
                { id: 'trends', icon: TrendingUp, label: 'Trends' },
                { id: 'class-trends', icon: BarChart2, label: 'Produkte' },
                { id: 'coaching', icon: GraduationCap, label: 'Mentor' },
                { id: 'products', icon: Package, label: 'Portfolio' },
                { id: 'commissions', icon: Euro, label: 'Provisionen' },
                { id: 'whatsapp', icon: MessageCircle, label: 'Briefing' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DashboardTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${activeTab === tab.id ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-gray-400 border-transparent hover:bg-white/5 hover:text-white'}`}
                >
                  <tab.icon size={14} /> {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 max-w-sm relative hidden 2xl:block group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#E60000] transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="SUCHE AGENT ODER ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-12 py-2.5 text-[11px] font-bold tracking-widest focus:outline-none focus:border-[#E60000] transition-all placeholder:text-gray-600 text-white"
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

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsFeedbackOpen(true)}
              className="p-3 bg-white/5 hover:bg-blue-600/20 hover:text-blue-500 border border-white/10 rounded-xl transition-all"
              title="Feedback senden"
            >
              <Mail size={16} />
            </button>

            <div className="flex gap-2">
               <label title="PIX Upload" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer transition-all group">
                 <FileText size={16} className="text-gray-400 group-hover:text-white" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">PIX</span>
                 <input type="file" multiple onChange={handleKpiUpload} className="hidden" />
               </label>
               <label title="Croco Upload" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer transition-all group">
                 <Files size={16} className="text-gray-400 group-hover:text-white" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">SALES</span>
                 <input type="file" multiple onChange={handleCrocoUpload} className="hidden" />
               </label>
               <button onClick={clearHistory} title="Datenbank Reset" className="p-2 bg-red-600/10 hover:bg-red-600 border border-red-600/20 rounded-xl text-red-500 hover:text-white transition-all">
                 <LogOut size={16} />
               </button>
            </div>

            <div className="h-8 w-[1px] bg-white/10"></div>

            <div className="relative">
              <button 
                onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                className="flex items-center gap-2 bg-black border border-white/20 rounded-xl px-4 py-2 text-[11px] font-black tracking-widest uppercase hover:border-[#E60000] transition-colors"
              >
                <Calendar size={14} className="text-gray-400" />
                <span>{selectedMonths.length > 0 ? (selectedMonths.length === 1 ? selectedMonths[0] : `${selectedMonths.length} Monate`) : 'Zeitraum'}</span>
                <ChevronDown size={14} className={`text-gray-500 transition-transform ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMonthDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-50 p-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {Object.keys(history).sort().reverse().map(m => (
                      <button
                        key={m}
                        onClick={() => toggleMonth(m)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${selectedMonths.includes(m) ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                      >
                        <span>{m}</span>
                        {selectedMonths.includes(m) && <Check size={12} className="text-[#E60000]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {isMonthDropdownOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsMonthDropdownOpen(false)} />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto px-6 py-10">
        {Object.keys(history).length === 0 ? (
          <div className="h-[75vh] flex flex-col items-center justify-center text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-b from-[#E60000]/5 to-transparent pointer-events-none"></div>
             <div className="w-40 h-40 bg-[#E60000] rounded-full flex items-center justify-center text-white mb-10 shadow-[0_0_100px_rgba(230,0,0,0.3)] animate-pulse">
               <Upload size={64} />
             </div>
             <h2 className="text-6xl font-black italic uppercase tracking-tighter mb-6 text-white">System <span className="text-[#E60000]">Offline</span></h2>
             <p className="text-gray-400 max-w-lg mx-auto leading-relaxed font-medium text-lg">
               Das Tactical HUD benötigt aktuelle Einsatzdaten.<br/>
               Bitte importiere die <span className="text-white font-bold">PIX-Matrix</span> und <span className="text-white font-bold">Sales-Reports</span>.
             </p>
          </div>
        ) : (
          <>
            {activeTab === '360' && <DashboardView kpiData={filteredKpiData} getAgentSales={getAgentSales} onOpenAgent={handleOpenAgent} />}
            {activeTab === 'wca' && <WCAView kpiData={filteredKpiData} onOpenAgent={handleOpenAgent} history={history} />}
            {activeTab === 'whatsapp' && <WhatsappView kpiData={filteredKpiData} getAgentSales={getAgentSales} />}
            {activeTab === 'gap' && <GapView kpiData={filteredKpiData} salesData={currentData.salesData} onOpenAgent={handleOpenAgent} />}
            {activeTab === 'coaching' && <CoachingView kpiData={filteredKpiData} getAgentSales={getAgentSales} onOpenAgent={handleOpenAgent} history={history} />}
            {activeTab === 'storno' && <StornoView kpiData={filteredKpiData} getAgentSales={getAgentSales} salesData={currentData.salesData} />}
            {activeTab === 'products' && <ProductsView salesData={currentData.salesData} history={history} onUpdateCommission={handleUpdateProvision} />}
            {activeTab === 'trends' && <TrendsView history={history} getAgentSales={getAgentSales} />}
            {activeTab === 'class-trends' && <ClassTrendsView history={history} />}
            {activeTab === 'commissions' && <CommissionManager history={history} customProvisions={customProvisions} onUpdateProvision={handleUpdateProvision} />}
          </>
        )}
      </main>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

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