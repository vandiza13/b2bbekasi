import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram/bot';
import { assertApiAuth } from '@/lib/auth';
import { getStatsResponse } from '@/lib/kpi/stats-service';
import { formatTelegramReport } from '@/lib/telegram/report-formatter';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    if (!(await assertApiAuth(req))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || undefined;

    const stats = await getStatsResponse(period);
    const report = formatTelegramReport(stats);

    return NextResponse.json({
      success: true,
      period: stats.period,
      report,
    });
  } catch (error) {
    console.error('[TelegramAPI Preview] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message || 'Gagal memuat preview laporan Telegram',
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await assertApiAuth(req))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const period = body.period || undefined;
    const customMessage = body.customMessage as string | undefined;

    let textToSend = customMessage;

    if (!textToSend) {
      const stats = await getStatsResponse(period);
      const report = formatTelegramReport(stats);
      textToSend = report.message;
    }

    const sent = await sendTelegramMessage(textToSend, body.chatId);
    if (!sent) {
      return NextResponse.json({
        success: false,
        error: 'TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID belum dikonfigurasi di environment',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Laporan KPI Assurance Branch Bekasi berhasil dikirim ke Telegram',
      period,
    });
  } catch (error) {
    console.error('[TelegramAPI Broadcast] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message || 'Gagal mengirim laporan Telegram',
    }, { status: 500 });
  }
}
