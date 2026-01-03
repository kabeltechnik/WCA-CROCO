
import React, { useState, useCallback, useEffect } from 'react';
import { LayoutGrid, Medal, MessageCircle, GitMerge, GraduationCap, AlertTriangle, Package, Upload, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AGENTS, PROVISIONS } from './constants';
import { KPIAgent, SaleRow, DashboardTab, AggregatedSales } from './types';
import DashboardView from './components/DashboardView';
import WCAView from './components/WCAView';
import WhatsappView from './components/WhatsappView';
import GapView from './components/GapView';
import CoachingView from './components/CoachingView';
import StornoView from './components/StornoView';
import ProductsView from './components/ProductsView';
import AgentModal from './components/AgentModal';

const App: React.FC = () => {
  const [kpiData, setKpiData] = useState<Record<string, KPIAgent>>({});
  const [salesData, setSalesData] = useState<SaleRow[]>([]);
  const [activeTab, setActiveTab] = useState<DashboardTab>('360');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Master-Override State (Persistenz über localStorage)
  const [customCommissions, setCustomCommissions] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('vkd_master_overrides');
    return saved ? JSON.parse(saved) : {};
  });

  // Jede Änderung sofort speichern
  useEffect(() => {
    localStorage.setItem('vkd_master_overrides', JSON.stringify(customCommissions));
  }, [customCommissions]);

  const updateCommissionOverride = (code: string, saleClass: string, val: number) => {
    const key = `${code}_${saleClass}`.toUpperCase();
    setCustomCommissions(prev => ({ ...prev, [key]: val }));
  };

  const parseNum = (v: any): number => {
    if (v === undefined || v === null || v === '') return 0;
    if (typeof v === 'number') return v;
    let s = String(v).trim().replace(/[ %€]/g, '').replace(',', '.');
    return parseFloat(s) || 0;
  };

  /**
   * SMART PROVISION ENGINE V13.0 (Code-First & Hard-Persistence)
   */
  const findCommission = (crocoCode: string, crocoClass: string, prodName: string): number => {
    const rawCode = String(crocoCode || '').trim().toUpperCase();
    const rawClass = String(crocoClass || '').trim().toUpperCase();
    const rawName = String(prodName || '').trim().toUpperCase();
    
    if (!rawCode && !rawName) return 0;

    // RULE 0: MASTER OVERRIDE (Deine Eingaben im Browser)
    const overrideKey = `${rawCode}_${rawClass}`;
    if (customCommissions[overrideKey] !== undefined) return customCommissions[overrideKey];

    // Typ-Erkennung
    const isVvl = rawClass.includes('VVL') || rawClass.includes('TW') || 
                  rawClass.includes('UPSELL') || rawClass.includes('PREV') || 
                  rawClass.includes('CHANGE') || rawClass.includes('TAKEOVER') ||
                  rawClass.includes('EQUAL');
    
    const targetType = isVvl ? 'VVL' : 'BNT';

    // RULE 1: DSL BNT Hardlock (User Wunsch: Immer 10€)
    if ((rawName.includes('DSL') || rawClass.includes('DSL')) && targetType === 'BNT') return 10.00;

    // RULE 2: Exakter Match auf Code UND Klasse (Exakte Übereinstimmung)
    let match = PROVISIONS.find(p => p.code.toUpperCase() === rawCode && p.class.toUpperCase() === rawClass);

    // RULE 3: Cross-Match (Code stimmt, aber Klasse leicht abweichend innerhalb der Gruppe)
    if (!match) {
        match = PROVISIONS.find(p => {
            if (p.code.toUpperCase() !== rawCode) return false;
            const isListVvl = p.class.toUpperCase().includes('VVL') || p.class.toUpperCase().includes('TW');
            const isRawVvl = rawClass.includes('VVL') || rawClass.includes('TW');
            return isListVvl === isRawVvl;
        });
    }

    // RULE 4: Suffix-Fallback (Falls nur der Basis-Code gematcht werden kann)
    if (!match && rawCode.includes(':')) {
      const base = rawCode.split(':')[0];
      match = PROVISIONS.find(p => p.code.toUpperCase().startsWith(base) && p.class.toUpperCase().includes(targetType));
    }

    // RULE 5: Name-Match (z.B. für DSL Klartext Codes)
    if (!match) {
      match = PROVISIONS.find(p => p.prod.toUpperCase() === rawName && p.class.toUpperCase().includes(targetType));
    }

    return match ? match.value : 0;
  };

  const enrichedSales = salesData.map(s => ({
    ...s,
    commission: findCommission(s.code, s.class, s.prod)
  }));

  const handleKpiUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result as string;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 'A', range: 4 }) as any[];
      
      const newKpi: Record<string, KPIAgent> = {};
      data.forEach(row => {
        const id = String(row['D'] || '').trim();
        if (!id || id === 'Agent' || isNaN(parseInt(id))) return;
        
        newKpi[id] = {
          id,
          name: AGENTS[id] || ("Agent " + id),
          months: parseNum(row['E']),
          calls: parseNum(row['F']),
          bnt_mw: parseNum(row['H']), bnt_pix: parseNum(row['J']),
          cs_mw: parseNum(row['K']), cs_pix: parseNum(row['M']),
          ff7_mw: parseNum(row['N']), ff7_pix: parseNum(row['P']),
          vvl_mw: parseNum(row['Q']), vvl_pix: parseNum(row['S']),
          aufleger: parseNum(row['W']),
          tnps: parseNum(row['Z']),
          deep: parseNum(row['AC']),
          fbq: parseNum(row['AF']),
          pix: parseNum(row['AI']),
          ebene: String(row['AJ'] || 'Newcomer')
        };
      });
      setKpiData(newKpi);
    };
    reader.readAsBinaryString(file);
  };

  const handleSalesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result as string;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 'A', range: 1 }) as any[];
      
      const newSales = data.map(row => ({
          id: String(row['B'] || '').trim(),
          prod: String(row['G'] || 'Unbekannt').trim(),
          code: String(row['H'] || '').trim(),
          class: String(row['K'] || '').trim(),
          osf: parseNum(row['Z']),
          date: String(row['A'] || 'N/A'),
          netto: parseNum(row['X']),
          storno: parseNum(row['V']),
          brutto: parseNum(row['T']),
      })).filter(s => s.id !== '' && !isNaN(parseInt(s.id)));
      setSalesData(newSales);
    };
    reader.readAsBinaryString(file);
  };

  const getAgentSales = useCallback((id: string): AggregatedSales => {
    const rows = enrichedSales.filter(r => r.id === id);
    let s: AggregatedSales = { 
      nettoTotal: 0, stornoTotal: 0, bruttoTotal: 0, pendingTotal: 0, commissionTotal: 0,
      bntTotal: 0, bntMobil: 0, bntTV: 0, bntKIP: 0,
      vvlTotal: 0, vvlMobil: 0, vvlTV: 0, vvlKIP: 0,
      stornoRate: 0 
    };
    
    rows.forEach(r => {
      const count = r.netto;
      if (count > 0 && r.storno === 0) {
        s.nettoTotal += count; 
        s.commissionTotal += (r.commission || 0) * count;
      }
      s.stornoTotal += r.storno; 
      s.bruttoTotal += r.brutto;
      
      const cls = r.class?.toUpperCase() || "";
      const isBnt = cls.includes('BNT');
      const isVvl = cls.includes('VVL') || cls.includes('TW') || cls.includes('UPSELL') || cls.includes('PREV') || cls.includes('CHANGE') || cls.includes('TAKEOVER') || cls.includes('EQUAL');
      
      const isMob = cls.includes('MOB') || cls.includes('MOBILE');
      const isTV = cls.includes('PTV') || cls.includes('ENV') || cls.includes('TV') || cls.includes('CONNECT');
      const isKIP = cls.includes('KIP') || cls.includes('DSL') || cls.includes('FIB') || cls.includes('I&P') || cls.includes('INTERNET');

      if (isBnt) {
        s.bntTotal += count;
        if (isMob) s.bntMobil += count;
        else if (isTV) s.bntTV += count;
        else if (isKIP) s.bntKIP += count;
      }
      if (isVvl) {
        s.vvlTotal += count;
        if (isMob) s.vvlMobil += count;
        else if (isTV) s.vvlTV += count;
        else if (isKIP) s.vvlKIP += count;
      }
    });
    
    s.pendingTotal = Math.max(0, s.bruttoTotal - (s.nettoTotal + s.stornoTotal));
    s.stornoRate = s.bruttoTotal > 0 ? (s.stornoTotal / s.bruttoTotal * 100) : 0;
    return s;
  }, [enrichedSales]);

  const handleOpenAgent = (id: string) => {
    setSelectedAgentId(id);
    setIsModalOpen(true);
  };

  const isReady = Object.keys(kpiData).length > 0;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#050505] text-white overflow-x-hidden">
      <div className="max-w-[1920px] mx-auto">
        <header className="glass rounded-[32px] p-8 flex flex-col md:flex-row justify-between items-center mb-10 shadow-2xl border-l-8 border-l-[#E60000] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E60000] to-transparent opacity-50" />
          <div className="mb-6 md:mb-0 relative z-10">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
              VKD TEC <span className="text-[#E60000] drop-shadow-[0_0_15px_rgba(230,0,0,0.5)]">ALANYA</span>
            </h1>
            <div className="text-[10px] md:text-xs font-black text-gray-500 tracking-[0.5em] mt-3 uppercase opacity-80">WCA COMMAND HUD V5.5 • REGIOCOM ELITE</div>
          </div>
          <div className="text-right relative z-10">
            <div className="font-black text-2xl tracking-tighter uppercase">Veysel Yarba</div>
            <div className="text-[#E60000] text-sm font-bold italic uppercase tracking-widest">Teamleiter | Performance Coach</div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="glass rounded-[32px] p-8 neon-border-red transition-all group relative overflow-hidden cursor-pointer" onClick={() => document.getElementById('kpi-up')?.click()}>
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><LayoutGrid size={80} /></div>
            <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-red-600/20 rounded-2xl text-red-500 shadow-neon"><Upload size={24} /></div>
                <h3 className="font-black text-xl uppercase italic tracking-tighter">WCA PIX Dashboard</h3>
            </div>
            <p className="text-gray-500 text-sm font-medium mb-4">Lade die aktuelle PIX-Tabelle (ab Zeile 5) hoch.</p>
            <input id="kpi-up" type="file" onChange={handleKpiUpload} className="hidden" />
            <div className={`text-[10px] font-black uppercase tracking-widest ${Object.keys(kpiData).length > 0 ? 'text-emerald-500' : 'text-gray-600'}`}>
                {Object.keys(kpiData).length > 0 ? `✓ ${Object.keys(kpiData).length} Agenten geladen` : 'Warten auf Daten...'}
            </div>
          </div>
          <div className="glass rounded-[32px] p-8 neon-border-red transition-all group relative overflow-hidden cursor-pointer" onClick={() => document.getElementById('sales-up')?.click()}>
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Package size={80} /></div>
            <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-blue-600/20 rounded-2xl text-blue-500 shadow-neon"><Package size={24} /></div>
                <h3 className="font-black text-xl uppercase italic tracking-tighter">Croco Sales Report</h3>
            </div>
            <p className="text-gray-500 text-sm font-medium mb-4">Lade die Verkaufsdaten für das Storno-Radar hoch.</p>
            <input id="sales-up" type="file" onChange={handleSalesUpload} className="hidden" />
            <div className={`text-[10px] font-black uppercase tracking-widest ${salesData.length > 0 ? 'text-emerald-500' : 'text-gray-600'}`}>
                {salesData.length > 0 ? `✓ ${salesData.length} Verkäufe geladen` : 'Warten auf Daten...'}
            </div>
          </div>
        </div>

        {isReady ? (
          <div className="space-y-8">
            <nav className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
              {[
                { id: '360', icon: LayoutGrid, label: 'Performance Rank' },
                { id: 'wca', icon: Medal, label: 'WCA Gate Check' },
                { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp Update' },
                { id: 'gap', icon: GitMerge, label: 'Gap-Prognose' },
                { id: 'coaching', icon: GraduationCap, label: 'Coaching Board' },
                { id: 'storno', icon: AlertTriangle, label: 'Storno Radar' },
                { id: 'products', icon: Package, label: 'Produkt Analyse' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as DashboardTab)}
                  className={`flex items-center gap-3 px-8 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap border ${activeTab === item.id ? 'bg-[#E60000] text-white border-[#E60000] shadow-[0_10px_30px_rgba(230,0,0,0.4)] translate-y-[-4px]' : 'glass text-gray-500 border-white/5 hover:text-white hover:border-white/20'}`}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="glass rounded-[48px] p-10 shadow-3xl min-h-[700px] border border-white/5 relative overflow-hidden">
              {activeTab === '360' && <DashboardView kpiData={kpiData} getAgentSales={getAgentSales} onOpenAgent={handleOpenAgent} />}
              {activeTab === 'wca' && <WCAView kpiData={kpiData} onOpenAgent={handleOpenAgent} />}
              {activeTab === 'whatsapp' && <WhatsappView kpiData={kpiData} getAgentSales={getAgentSales} />}
              {activeTab === 'gap' && <GapView kpiData={kpiData} salesData={enrichedSales} onOpenAgent={handleOpenAgent} />}
              {activeTab === 'coaching' && <CoachingView kpiData={kpiData} getAgentSales={getAgentSales} onOpenAgent={handleOpenAgent} />}
              {activeTab === 'storno' && <StornoView kpiData={kpiData} getAgentSales={getAgentSales} salesData={enrichedSales} />}
              {activeTab === 'products' && <ProductsView salesData={enrichedSales} onUpdateCommission={updateCommissionOverride} />}
            </div>
          </div>
        ) : (
          <div className="glass rounded-[60px] p-32 flex flex-col items-center justify-center text-center border-dashed border-white/10 border-8 animate-pulse">
            <h2 className="text-5xl font-black text-white mb-6 uppercase tracking-tighter italic">System Initialisierung Ausstehend</h2>
            <p className="text-gray-500 max-w-lg text-xl font-bold uppercase tracking-widest opacity-60">Lade die WCA PIX Daten hoch.</p>
          </div>
        )}
      </div>

      {selectedAgentId && kpiData[selectedAgentId] && (
        <AgentModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          agent={kpiData[selectedAgentId]}
          sales={enrichedSales.filter(s => s.id === selectedAgentId)}
          getAgentSales={getAgentSales}
        />
      )}
    </div>
  );
};

export default App;
