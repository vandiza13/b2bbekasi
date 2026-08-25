import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage, getCurrentTimeWIB } from '@/lib/telegram/bot';
import { db } from '@/db';
import { kpiSnapshots } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const period = body.period || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const snapshots = await db.select().from(kpiSnapshots).where(eq(kpiSnapshots.period, period));

    let reportText = `📊 *Report KPI Assurance BGES Witel Bekasi*\n📅 ${getCurrentTimeWIB()}\n\n`;

    if (snapshots.length === 0) {
      reportText += `_Belum ada data snapshot tersimpan untuk periode ${period}._`;
    } else {
      let achievedCount = 0;
      let totalCount = snapshots.length;

      snapshots.forEach((s) => {
        const isAchieved = s.status === 'ACHIEVED';
        if (isAchieved) achievedCount++;
        const icon = isAchieved ? '✅' : '❌';
        reportText += `${icon} *${s.indicatorCode}*\n`;
        reportText += `   • Real: ${s.realRate}% (Target: ${s.targetRate}%)\n`;
        reportText += `   • Total Tiket: ${s.totalTickets}\n\n`;
      });

      const overall = totalCount > 0 ? ((achievedCount / totalCount) * 100).toFixed(2) : '0.00';
      reportText += `📈 *Overall Achievement*: ${overall}% (${achievedCount}/${totalCount} Indicator)\n`;
    }

    const customChatId = body.chatId;
    await sendTelegramMessage(reportText, customChatId);

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
