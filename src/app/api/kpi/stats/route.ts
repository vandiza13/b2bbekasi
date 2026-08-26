import { NextRequest, NextResponse } from 'next/server';
import { getStatsResponse } from '@/lib/kpi/stats-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stats = await getStatsResponse(searchParams.get('period') || undefined);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('[StatsAPI] Fatal error:', error);
    return NextResponse.json({
      error: (error as Error).message || 'Failed to fetch KPI stats',
    }, { status: 500 });
  }
}
