export type ServiceCategory = 'DATIN' | 'HSI' | 'WIFI';
export type FilterCategory = 'ALL' | ServiceCategory;

export interface TicketItem {
  incidentId: string;
  customerName: string;
  serviceAreaCode: string;
  workzone?: string;
  serviceType?: string;
  category: ServiceCategory;
  reportedAt: string;
  resolvedAt?: string | null;
  ttrMinutes?: number | null;
  status: string;
  isComply: boolean;
  isGaul?: boolean;
  isGuarantee?: boolean;
  summary?: string;
}

export interface StoBreakdown {
  sto: string;
  total: number;
  comply: number;
  below: number;
  realRate: number;
}

export interface WeeklyStat {
  week: 'W1' | 'W2' | 'W3' | 'W4';
  realRate: number;
  ticketCount: number;
  achievedCount?: number;
  belowCount?: number;
  tickets?: TicketItem[];
  stoBreakdown?: StoBreakdown[];
}

export interface KpiMetric {
  id: string;
  category: ServiceCategory;
  name: string;
  targetRate: number;
  realRate: number;
  totalTickets: number;
  achievedTickets: number;
  belowTargetTickets: number;
  achievementRate: number;
  status: 'ACHIEVED' | 'BELOW_TARGET';
  direction?: 'higher' | 'lower';
  weekly: WeeklyStat[];
  allTickets?: TicketItem[];
  stoBreakdown?: StoBreakdown[];
}

export interface KpiSummary {
  totalIndicators: number;
  achievedCount: number;
  belowTargetCount: number;
  overallAchievement: number;
}

export interface QualityTicketItem {
  tiket: string;
  sto: string;
  sa: string;
  tanggal: string;
}

export interface QualityWeekData {
  q: number;
  real: number;
  totalTiket: number;
  listBilled: number;
  startDate?: string;
  endDate?: string;
  allTickets?: QualityTicketItem[];
}

export interface QualityData {
  indicator: string;
  source?: string;
  real: number;
  target: string | number;
  totalTiket: number;
  listBilled: number;
  weeks?: Record<string, QualityWeekData>;
  branches?: Record<string, {
    totalTiket: number;
    listBilled: number;
    q: number;
  }>;
}

export interface StatsResponse {
  period: string;
  rawPeriod?: string;
  branch: string;
  summary: KpiSummary;
  metrics: KpiMetric[];
  qHsi?: QualityData | null;
  qDatin?: QualityData | null;
}

export interface UploadResponse {
  success: boolean;
  processedRows: number;
  period: string;
  executionTimeMs: number;
  message?: string;
}

export interface IndicatorDefinition {
  code: string;
  name: string;
  category: ServiceCategory;
  targetRate: number;
  slaMinutesThreshold?: number;
  description: string;
  direction?: 'higher' | 'lower';
}
