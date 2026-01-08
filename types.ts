
export interface KPIAgent {
  id: string;
  name: string;
  calls: number;
  months: number;
  bnt_mw: number;
  bnt_pix: number;
  vvl_mw: number;
  vvl_pix: number;
  cs_mw: number;
  cs_pix: number;
  ff7_mw: number;
  ff7_pix: number;
  aufleger: number;
  tnps: number;
  deep: number;
  fbq: number;
  pix: number;
  ebene: string;
}

export interface SaleRow {
  id: string;
  prod: string;
  code: string;
  class: string;
  osf: number;
  date: string;
  netto: number;
  storno: number;
  brutto: number;
  commission?: number;
}

export interface AggregatedSales {
  nettoTotal: number;
  stornoTotal: number;
  bruttoTotal: number;
  pendingTotal: number;
  commissionTotal: number;
  bntTotal: number;
  bntMobil: number;
  bntTV: number;
  bntKIP: number;
  vvlTotal: number;
  vvlMobil: number;
  vvlTV: number;
  vvlKIP: number;
  stornoRate: number;
}

export interface MonthSnapshot {
  id: string; // z.B. "11-2025"
  label: string; // z.B. "November 2025"
  kpiData: Record<string, KPIAgent>;
  salesData: SaleRow[];
}

export type DashboardTab = '360' | 'wca' | 'trends' | 'whatsapp' | 'gap' | 'coaching' | 'storno' | 'products';
