import React, { useState, useMemo } from 'react';
import { MonthSnapshot } from '../types';
import { Euro, Save, Search, Filter, AlertCircle, CheckCircle2, FileText, Hash, Plus, X } from 'lucide-react';
import { PROVISIONS } from '../constants';

interface Props {
  history: Record<string, MonthSnapshot>;
  customProvisions: Record<string, number>;
  onUpdateProvision: (key: string, value: number, typeContext?: string) => void;
}

const CommissionManager: React.FC<Props> = ({ history, customProvisions, onUpdateProvision }) => {
  const [filterZero, setFilterZero] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  
  // Manual Entry State
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualType, setManualType] = useState('BNT');
  const [manualValue, setManualValue] = useState('');

  const getProductType = (cls: string) => {
    const upper = (cls || '').toUpperCase();
    if (upper.includes('VVL') || upper.includes('TW') || upper.includes('UP') || upper.includes('RET')) return 'VVL';
    return 'BNT';
  };

  const uniqueProducts = useMemo(() => {
    const map = new Map<string, { prod: string, code: string, class: string, lastSeen: string, type: string }>();
    
    // 1. From History
    Object.keys(history).forEach(month => {
      history[month].salesData.forEach(sale => {
        const type = getProductType(sale.class);
        const uniqueKey = `${sale.code}#${type}`;
        const mapKey = sale.code ? uniqueKey : `${sale.prod}#${type}`;
        
        if (!map.has(mapKey)) {
          map.set(mapKey, { prod: sale.prod, code: sale.code, class: sale.class, lastSeen: month, type });
        } else {
             const existing = map.get(mapKey)!;
             if (month > existing.lastSeen) existing.lastSeen = month;
        }
      });
    });

    // 2. From Custom Provisions (ensure manually added rules appear)
    Object.keys(customProvisions).forEach(key => {
        const [identifier, typeSuffix] = key.split('#');
        // Simple heuristic: if typeSuffix exists use it, else default BNT. 
        // Note: This is a visual representation only.
        const type = typeSuffix || 'BNT'; 
        const mapKey = key; 
        
        if (!map.has(mapKey)) {
             map.set(mapKey, { 
                 prod: identifier, // We use identifier as name for manual entries without history
                 code: identifier, 
                 class: `MANUAL_${type}`, 
                 lastSeen: 'MANUAL', 
                 type 
             });
        }
    });

    return Array.from(map.values()).map(p => {
       // Determine Current Value based on priority
       const specificKey = `${p.code}#${p.type}`;
       const descKey = `${p.prod}#${p.type}`;
       
       let val = customProvisions[specificKey]; // Priority 1: Code + Type

       if (val === undefined) {
          val = customProvisions[p.code]; // Priority 2: Code Global
       }

       if (val === undefined) {
           val = customProvisions[descKey]; // Priority 3: Description + Type
       }

       if (val === undefined) {
           val = customProvisions[p.prod]; // Priority 4: Description Global
       }

       if (val === undefined) {
           // Static List Fallback
           const match = PROVISIONS.find(prov => {
               const provClass = prov.class.toUpperCase();
               const codeMatch = p.code && prov.code.toUpperCase() === p.code.toUpperCase();
               const contextMatch = provClass.includes(p.type);
               const descMatch = !p.code && p.prod === prov.prod;
               return (codeMatch || descMatch) && contextMatch;
           });
           
           if (match) {
             val = match.value;
           } else {
             const loose = PROVISIONS.find(prov => (p.code && prov.code.toUpperCase() === p.code.toUpperCase()) || p.prod === prov.prod);
             val = loose ? loose.value : 0;
           }
       }
       
       return { ...p, currentValue: val, listId: p.code ? specificKey : descKey };
    });
  }, [history, customProvisions]);

  const filteredProducts = useMemo(() => {
    let list = uniqueProducts;

    if (filterZero) {
        list = list.filter(p => p.currentValue === 0);
    }

    if (searchQuery) {
        const q = searchQuery.toUpperCase();
        list = list.filter(p => p.prod.toUpperCase().includes(q) || p.code.toUpperCase().includes(q) || p.class.toUpperCase().includes(q));
    }

    return list.sort((a,b) => {
        if (a.currentValue === 0 && b.currentValue !== 0) return -1;
        if (a.currentValue !== 0 && b.currentValue === 0) return 1;
        return a.class.localeCompare(b.class);
    });
  }, [uniqueProducts, filterZero, searchQuery]);

  const handleInputChange = (listId: string, val: string) => {
    setEditingValues(prev => ({ ...prev, [listId]: val }));
  };

  const handleSave = (product: typeof uniqueProducts[0]) => {
    const valStr = editingValues[product.listId];
    if (valStr === undefined) return;
    const val = parseFloat(valStr.replace(',', '.'));
    
    if (!isNaN(val)) {
        const useCode = product.code && product.code.length > 2;
        const key = useCode ? product.code : product.prod;
        onUpdateProvision(key, val, product.type);
        setEditingValues(prev => {
            const next = { ...prev };
            delete next[product.listId];
            return next;
        });
    }
  };

  const handleManualAdd = () => {
      if (!manualCode || !manualValue) return;
      const val = parseFloat(manualValue.replace(',', '.'));
      if (isNaN(val)) return;

      onUpdateProvision(manualCode, val, manualType);
      
      setManualCode('');
      setManualValue('');
      setShowManualAdd(false);
  };

  return (
    <div className="animate-in fade-in duration-700 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter flex items-center gap-4">
            <Euro className="text-emerald-500" /> Provisions <span className="text-emerald-500">Manager</span>
          </h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] ml-1">Kontext-Steuerung (BNT/VVL) • Fallback: Beschreibung</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
            <button 
                onClick={() => setShowManualAdd(!showManualAdd)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${showManualAdd ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'}`}
            >
                <Plus size={14} /> Neu
            </button>
            <div className="h-8 w-[1px] bg-white/10 hidden lg:block"></div>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <input 
                    type="text" 
                    placeholder="Produkt oder Code suchen..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-black border border-white/20 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-white focus:border-emerald-500 outline-none w-64"
                />
            </div>
            <button 
                onClick={() => setFilterZero(!filterZero)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${filterZero ? 'bg-red-600/20 border-red-600 text-red-500' : 'bg-white/5 border-white/10 text-gray-400'}`}
            >
                <Filter size={14} />
                {filterZero ? 'Nur 0€ Artikel' : 'Alle Anzeigen'}
            </button>
        </div>
      </div>

      {showManualAdd && (
          <div className="mb-8 p-6 bg-emerald-900/10 border border-emerald-500/30 rounded-3xl animate-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-black text-emerald-500 uppercase tracking-widest">Manuelle Provision hinzufügen</h3>
                  <button onClick={() => setShowManualAdd(false)} className="text-gray-500 hover:text-white"><X size={16}/></button>
              </div>
              <div className="flex flex-col lg:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Produkt Code / Name</label>
                      <input 
                          type="text" 
                          value={manualCode}
                          onChange={(e) => setManualCode(e.target.value)}
                          className="w-full bg-black border border-white/20 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                          placeholder="z.B. 12345 oder 'GigaZuhause...'"
                      />
                  </div>
                  <div className="w-full lg:w-32">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Typ</label>
                      <select 
                          value={manualType}
                          onChange={(e) => setManualType(e.target.value)}
                          className="w-full bg-black border border-white/20 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                      >
                          <option value="BNT">BNT</option>
                          <option value="VVL">VVL</option>
                      </select>
                  </div>
                  <div className="w-full lg:w-32">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Betrag (€)</label>
                      <input 
                          type="number" 
                          value={manualValue}
                          onChange={(e) => setManualValue(e.target.value)}
                          className="w-full bg-black border border-white/20 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                          placeholder="0.00"
                      />
                  </div>
                  <button 
                      onClick={handleManualAdd}
                      className="w-full lg:w-auto px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl uppercase tracking-widest transition-all"
                  >
                      Speichern
                  </button>
              </div>
          </div>
      )}

      <div className="glass rounded-[32px] border border-white/5 overflow-hidden">
        <div className="bg-white/5 px-6 py-4 flex justify-between items-center border-b border-white/5">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={14} /> {filteredProducts.length} Datensätze gefunden
            </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
                <thead className="bg-black sticky top-0 z-10">
                    <tr>
                        <th className="p-5 text-[10px] font-black text-gray-600 uppercase tracking-widest">Typ</th>
                        <th className="p-5 text-[10px] font-black text-gray-600 uppercase tracking-widest">Klasse</th>
                        <th className="p-5 text-[10px] font-black text-gray-600 uppercase tracking-widest">Identifikator</th>
                        <th className="p-5 text-[10px] font-black text-gray-600 uppercase tracking-widest">Produkt Name</th>
                        <th className="p-5 text-[10px] font-black text-gray-600 uppercase tracking-widest text-right">Provision (€)</th>
                        <th className="p-5 w-24"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {filteredProducts.map((p) => {
                        const isEditing = editingValues[p.listId] !== undefined;
                        const displayVal = isEditing ? editingValues[p.listId] : p.currentValue.toFixed(2);
                        
                        // Check override status
                        const specificKey = `${p.code}#${p.type}`;
                        const descKey = `${p.prod}#${p.type}`;
                        const isSpecificCode = customProvisions[specificKey] !== undefined;
                        const isGlobalCode = !isSpecificCode && customProvisions[p.code] !== undefined;
                        const isSpecificDesc = customProvisions[descKey] !== undefined;
                        const isGlobalDesc = !isSpecificDesc && customProvisions[p.prod] !== undefined;

                        return (
                            <tr key={p.listId} className="hover:bg-white/[0.02] group transition-colors">
                                <td className="p-5">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${p.type === 'BNT' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                        {p.type}
                                    </span>
                                </td>
                                <td className="p-5">
                                    <span className="text-[10px] font-bold text-gray-400 font-mono">
                                        {p.class}
                                    </span>
                                </td>
                                <td className="p-5">
                                   <div className="flex items-center gap-2">
                                     {p.code && p.code.length > 2 ? <Hash size={12} className="text-gray-600" /> : <FileText size={12} className="text-orange-500" />}
                                     <span className="text-xs font-mono text-gray-300">{p.code || "N/A"}</span>
                                   </div>
                                </td>
                                <td className="p-5 text-sm font-bold text-white">{p.prod}</td>
                                <td className="p-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <input 
                                            type="text" 
                                            value={displayVal}
                                            onChange={(e) => handleInputChange(p.listId, e.target.value)}
                                            className={`w-24 bg-black border rounded-lg px-3 py-2 text-right font-black text-white focus:outline-none focus:border-emerald-500 transition-all ${p.currentValue === 0 && !isEditing ? 'border-red-500/50 text-red-500' : 'border-white/10'}`}
                                        />
                                    </div>
                                </td>
                                <td className="p-5 text-right">
                                    {isEditing ? (
                                        <button 
                                            onClick={() => handleSave(p)}
                                            className="p-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg shadow-neon transition-all"
                                            title="Speichern"
                                        >
                                            <Save size={16} />
                                        </button>
                                    ) : (
                                        <div className="flex justify-end gap-1">
                                            {(isSpecificCode || isSpecificDesc) && <span title="Manuell (Spezifisch)" className="text-emerald-500"><CheckCircle2 size={16} /></span>}
                                            {(isGlobalCode || isGlobalDesc) && <span title="Manuell (Global)" className="text-yellow-500"><CheckCircle2 size={16} /></span>}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default CommissionManager;