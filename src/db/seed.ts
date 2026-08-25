import { db } from './index';
import { serviceAreas } from './schema';

const INITIAL_STOS = [
  { code: 'BEK', name: 'Bekasi', branch: 'BEKASI' },
  { code: 'KLB', name: 'Kaliabang', branch: 'BEKASI' },
  { code: 'KRA', name: 'Kranji', branch: 'BEKASI' },
  { code: 'PDE', name: 'Pondok Gede', branch: 'BEKASI' },
  { code: 'PKY', name: 'Pekayon', branch: 'BEKASI' },
  { code: 'DEP', name: 'Depok', branch: 'BEKASI' },
  { code: 'CNE', name: 'Cikarang', branch: 'BEKASI' },
  { code: 'SKJ', name: 'Sukatani', branch: 'BEKASI' },
  { code: 'CSL', name: 'Cibarusah', branch: 'BEKASI' },
  { code: 'PCM', name: 'Pondok Cipta Makmur', branch: 'BEKASI' },
];

export async function seed() {
  console.log('Seeding master service areas (STOs)...');
  try {
    for (const sto of INITIAL_STOS) {
      await db.insert(serviceAreas).values(sto).onConflictDoNothing();
    }
    console.log('✅ Master STOs successfully seeded!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

if (require.main === module || process.argv[1]?.includes('seed.ts')) {
  seed().then(() => process.exit(0));
}
