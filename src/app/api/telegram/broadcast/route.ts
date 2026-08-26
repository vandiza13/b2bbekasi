import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage, getCurrentTimeWIB } from '@/lib/telegram/bot';
import { assertApiAuth } from '@/lib/auth';
import { getStatsResponse } from '@/lib/kpi/stats-service';

export const dynamic = 'force-dynamic';

function parseTargetNumber(target: string | number): number {
  if (typeof target === 'number') return target;
  const match = String(target || '').replace(',', '.').match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

export async function POST(req: NextRequest) {
  try {
    if (!(await assertApiAuth(req))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const period = body.period || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const stats = await getStatsResponse(period);

    let reportText = `📊 *Report KPI Assurance BGES Witel Bekasi*\n📅 ${getCurrentTimeWIB()}\n\n`;

    const hasData = stats.metrics.some(m => m.totalTickets > 0) || stats.qHsi || stats.qDatin;
    if (!hasData) {
      reportText += `_Belum ada data tersimpan untuk periode ${period}._`;
    } else {
      for (const m of stats.metrics) {
        if (m.totalTickets === 0) continue;
        const icon = m.status === 'ACHIEVED' ? '✅' : '❌';
        reportText += `${icon} *${m.id}*\n`;
        reportText += `   • Real: ${m.realRate}% (Target: ${m.targetRate}%)\n`;
        reportText += `   • Total Tiket: ${m.totalTickets}\n\n`;
      }

      for (const q of [stats.qHsi, stats.qDatin]) {
        if (!q) continue;
        const targetVal = parseTargetNumber(q.target);
        const icon = q.real <= targetVal ? '✅' : '❌';
        reportText += `${icon} *${q.indicator}*\n`;
        reportText += `   • Real: ${q.real}% (Target: ${q.target}%)\n`;
        reportText += `   • Total Tiket: ${q.totalTiket}\n\n`;
      }

      reportText += `📈 *Overall Achievement*: ${stats.summary.overallAchievement}% (${stats.summary.achievedCount}/${stats.summary.totalIndicators} Indicator)\n`;
    }

    const sent = await sendTelegramMessage(reportText, body.chatId);
    if (!sent) {
      return NextResponse.json({
        success: false,
        error: 'TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID belum dikonfigurasi di environment',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Laporan KPI berhasil dikirim ke Telegram',
      period,
    });
  } catch (error) {
    console.error('[TelegramAPI] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message || 'Gagal mengirim laporan Telegram',
    }, { status: 500 });
  }
}
