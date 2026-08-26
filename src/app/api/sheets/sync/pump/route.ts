import { NextRequest, NextResponse } from 'next/server';
import { assertApiAuth } from '@/lib/auth';
import { pumpPendingJobs } from '@/lib/sheets/mirror-writer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = req.headers.get('x-cron-secret');
    const viaCron = Boolean(cronSecret && providedSecret === cronSecret);

    if (!viaCron && !(await assertApiAuth(req))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const processed = await pumpPendingJobs(3);
    return NextResponse.json({
      success: true,
      processed: processed.map(j => ({ id: j.id, category: j.category })),
    });
  } catch (error) {
    console.error('[SheetsSyncPump] Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
