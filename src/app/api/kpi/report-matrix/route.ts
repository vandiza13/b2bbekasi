import { NextRequest, NextResponse } from 'next/server';
import { assertApiAuth } from '@/lib/auth';
import { getStatsResponse } from '@/lib/kpi/stats-service';
import { buildReportMatrix } from '@/lib/kpi/report-matrix';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    if (!(await assertApiAuth(req))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || undefined;

    const stats = await getStatsResponse(period);
    const matrix = buildReportMatrix(stats);

    return NextResponse.json({
      success: true,
      period: stats.period,
      matrix,
    });
  } catch (error) {
    console.error('[ReportMatrixAPI] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message || 'Gagal memuat data matrix report',
    }, { status: 500 });
  }
}
