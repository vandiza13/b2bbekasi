import { IndicatorDefinition } from '@/types/kpi';

export const SA_MAPPING: Record<string, string[]> = {
  Bekasi: ['BEK'],
  Kaliabang: ['KLB'],
  Kranji: ['KRA'],
  Pekayon: ['PKY'],
  'Pondok Gede': ['PDE'],
  Depok: ['DEP'],
  Cinere: ['CNE', 'PCM'],
  Sukmajaya: ['SKJ', 'CSL']
};

export const MASTER_STOS = [
  'BEK', 'KLB', 'KRA', 'PKY', 'PDE', 'DEP', 'CNE', 'PCM', 'SKJ', 'CSL'
];

// Master List Berbilled resmi dari Dashboard Branch Bekasi (GAS)
export const LIST_BILLED_DATIN_STOS: Record<string, number> = {
  BEK: 250,
  KRA: 508,
  KLB: 227,
  PKY: 387,
  PDE: 286,
  DEP: 257,
  CSL: 74,
  PCM: 64,
  SKJ: 76,
  CNE: 91,
};
export const TOTAL_LIST_BILLED_DATIN = 2220;

export const LIST_BILLED_HSI_STOS: Record<string, number> = {
  BEK: 1978,
  KRA: 2667,
  KLB: 1785,
  PKY: 2743,
  PDE: 1402,
  DEP: 1446,
  CSL: 352,
  PCM: 355,
  SKJ: 1024,
  CNE: 568,
};
export const TOTAL_LIST_BILLED_HSI = 14320;

export function getSalesAreaForSto(sto: string): string {
  const norm = sto.trim().toUpperCase();
  for (const [sa, stos] of Object.entries(SA_MAPPING)) {
    if (stos.map(s => s.toUpperCase()).includes(norm)) {
      return sa;
    }
  }
  return 'Bekasi';
}

export function isValidBranchSto(sto: string): boolean {
  const norm = sto.trim().toUpperCase();
  return MASTER_STOS.includes(norm);
}

export const INDICATORS: IndicatorDefinition[] = [
  {
    code: 'TTR_DATIN_K1',
    name: 'Compliance-TTR DATIN-K1 Recovery (43 Menit)',
    category: 'DATIN',
    slaMinutesThreshold: 43,
    targetRate: 90.00,
    description: 'SLA TTR DATIN K1 Recovery <= 43 Menit'
  },
  {
    code: 'TTR_DATIN_K2',
    name: 'Compliance-TTR DATIN-K2 (3,6 Jam)',
    category: 'DATIN',
    slaMinutesThreshold: 216,
    targetRate: 95.00,
    description: 'SLA TTR DATIN K2 <= 216 Menit (3.6 Jam)'
  },
  {
    code: 'TTR_DATIN_K3',
    name: 'Compliance-TTR DATIN-K3 (7,2 Jam)',
    category: 'DATIN',
    slaMinutesThreshold: 432,
    targetRate: 92.00,
    description: 'SLA TTR DATIN K3 <= 432 Menit (7.2 Jam)'
  },
  {
    code: 'ASR_GUARANTEE_DATIN',
    name: 'Assurance Guarantee DATIN',
    category: 'DATIN',
    targetRate: 91.00,
    description: 'Non-Garansi Valid DATIN'
  },
  {
    code: 'TTR_HSI_HVC_4H',
    name: 'Compliance-TTR HSI-HVC Reguler (4 jam)',
    category: 'HSI',
    slaMinutesThreshold: 240,
    targetRate: 65.00,
    description: 'SLA TTR HSI HVC Reguler <= 240 Menit (4 Jam)'
  },
  {
    code: 'TTR_HSI_HVC_24H',
    name: 'Compliance-TTR HSI-HVC Reguler (24 jam)',
    category: 'HSI',
    slaMinutesThreshold: 1440,
    targetRate: 95.00,
    description: 'SLA TTR HSI HVC Reguler <= 1440 Menit (24 Jam)'
  },
  {
    code: 'ASR_GUARANTEE_HSI',
    name: 'Assurance Guarantee HSI',
    category: 'HSI',
    targetRate: 91.00,
    description: 'Non-Garansi Valid HSI'
  },
  {
    code: 'TTR_WIFI',
    name: 'Compliance-TTR WIFI (6 Jam Logik, 24 Jam Fisik)',
    category: 'WIFI',
    slaMinutesThreshold: 360,
    targetRate: 93.00,
    description: 'SLA TTR WIFI <= 360 Menit (Logik) / 1440 Menit (Fisik)'
  },
  {
    code: 'ASR_GUARANTEE_WIFI',
    name: 'Assurance Guarantee WIFI',
    category: 'WIFI',
    targetRate: 90.50,
    description: 'Non-Garansi Valid WIFI'
  }
];

export function getWeekBucket(date: Date): 'W1' | 'W2' | 'W3' | 'W4' {
  const day = date.getDate();
  if (day <= 7) return 'W1';
  if (day <= 14) return 'W2';
  if (day <= 21) return 'W3';
  return 'W4';
}

export function formatPeriodDisplay(periodStr: string): string {
  try {
    const [year, month] = periodStr.split('-');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    const monthIdx = parseInt(month, 10) - 1;
    const yearShort = year.slice(-2);
    return `${monthNames[monthIdx] || month} '${yearShort}`;
  } catch {
    return periodStr;
  }
}
