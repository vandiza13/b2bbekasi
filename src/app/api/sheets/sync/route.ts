import { NextRequest, NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/db';
import { sheetSyncJobs } from '@/db/schema';
import { assertApiAuth } from '@/lib/auth';
import { createOrCoalesceJob, pumpPendingJobs } from '@/lib/sheets/mirror-writer';
import { VALID_CATEGORIES, UploadCategory } from '@/types/ingestion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET() {
  try {
    await pumpPendingJobs(1);

    const jobs = await db
      .select()
      .from(sheetSyncJobs)
      .orderBy(desc(sheetSyncJobs.createdAt))
      .limit(40);

    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    console.error('[SheetsSyncAPI] GET error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await assertApiAuth(req))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const requested = String(body.category || 'all').toUpperCase();
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const categories: UploadCategory[] =
      requested === 'all'
        ? [...VALID_CATEGORIES]
        : VALID_CATEGORIES.includes(requested as UploadCategory)
          ? [requested as UploadCategory]
          : [];

    if (categories.length === 0) {
      return NextResponse.json({
        success: false,
        error: `Kategori tidak valid. Pilihan: all, ${VALID_CATEGORIES.join(', ')}`,
      }, { status: 400 });
    }

    const created = [];
    for (const category of categories) {
      const job = await createOrCoalesceJob(category, period);
      if (job) created.push({ id: job.id, category: job.category, status: job.status });
    }

    return NextResponse.json({ success: true, created });
  } catch (error) {
    console.error('[SheetsSyncAPI] POST error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
