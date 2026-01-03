
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
  commission?: number; // Neu: Berechnete Provision für diesen Sale
}

export interface AggregatedSales {
  nettoTotal: number;
  stornoTotal: number;
  bruttoTotal: number;
  pendingTotal: number;
  commissionTotal: number; // Neu: Gesamtprovision
  // BNT Breakdown
  bntTotal: number;
  bntMobil: number;
  bntTV: number;
  bntKIP: number;
  // VVL Breakdown
  vvlTotal: number;
  vvlMobil: number;
  vvlTV: number;
  vvlKIP: number;
  stornoRate: number;
}

export type DashboardTab = '360' | 'wca' | 'whatsapp' | 'gap' | 'coaching' | 'storno' | 'products';
