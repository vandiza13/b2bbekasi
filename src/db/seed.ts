import { db } from './index';
import { serviceAreas, billedCustomers } from './schema';

const INITIAL_STOS = [
  { code: 'BEK', name: 'Bekasi', branch: 'BEKASI' },
  { code: 'KLB', name: 'Kaliabang', branch: 'BEKASI' },
  { code: 'KRA', name: 'Kranji', branch: 'BEKASI' },
  { code: 'PDE', name: 'Pondok Gede', branch: 'BEKASI' },
  { code: 'PKY', name: 'Pekayon', branch: 'BEKASI' },
  { code: 'DEP', name: 'Depok', branch: 'BEKASI' },
  { code: 'CNE', name: 'Cikarang', branch: 'BEKASI' },
  { code: 'SKJ', name: 'Sukmajaya', branch: 'BEKASI' },
  { code: 'CSL', name: 'Cibarusah', branch: 'BEKASI' },
  { code: 'PCM', name: 'Pancoran Mas', branch: 'BEKASI' },
];

// List Berbilled resmi per-STO dari blok "Dashboard Branch Bekasi" BI6:BQ15
const Q_BILLED_SEED: Record<'DATIN' | 'HSI', Record<string, number>> = {
  DATIN: {
    BEK: 250, KRA: 508, KLB: 227, PKY: 387, PDE: 286,
    DEP: 257, CSL: 74, PCM: 64, SKJ: 76, CNE: 91,
  },
  HSI: {
    BEK: 1978, KRA: 2667, KLB: 1785, PKY: 2743, PDE: 1402,
    DEP: 1446, CSL: 352, PCM: 355, SKJ: 1024, CNE: 568,
  },
};

export async function seed() {
  console.log('Seeding master service areas & billed customers...');
  try {
    for (const sto of INITIAL_STOS) {
      await db.insert(serviceAreas).values(sto).onConflictDoNothing();
    }

    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;

    for (const [serviceType, stos] of Object.entries(Q_BILLED_SEED)) {
      for (const [stoCode, totalBilled] of Object.entries(stos)) {
        await db
          .insert(billedCustomers)
          .values({
            id: `${stoCode}_${serviceType}_${y}_${m}`,
            serviceAreaCode: stoCode,
            serviceType,
            periodYear: y,
            periodMonth: m,
            totalBilled,
          })
          .onConflictDoUpdate({
            target: billedCustomers.id,
            set: { totalBilled, updatedAt: new Date() },
          });
      }
    }

    console.log('✅ Master STOs & billed customers berhasil di-seed!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

if (require.main === module || process.argv[1]?.includes('seed.ts')) {
  seed().then(() => process.exit(0));
}
