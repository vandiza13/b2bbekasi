import { google } from 'googleapis';
import { KpiMetric, KpiSummary } from '@/types/kpi';

export async function syncKpiToGoogleSheets(
  period: string,
  summary: KpiSummary,
  metrics: KpiMetric[]
): Promise<{ success: boolean; message?: string }> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!spreadsheetId || !clientEmail || !privateKey) {
    // Graceful bypass if Google Sheets env vars are not set
    console.log('[SheetsSync] Google Sheets credentials not configured. Skipping sync.');
    return { success: true, message: 'Google Sheets sync skipped (not configured).' };
  }

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Prepare rows for sheet
    const rows = [
      ['KPI BGES BEKASI - BACKUP SNAPSHOT', `Period: ${period}`, `Timestamp: ${new Date().toISOString()}`],
      ['Total Indicators', summary.totalIndicators, 'Achieved', summary.achievedCount, 'Below Target', summary.belowTargetCount, 'Overall %', `${summary.overallAchievement}%`],
      [],
      ['Indicator Code', 'Category', 'Indicator Name', 'Target Rate (%)', 'Real Rate (%)', 'Total Tickets', 'Achieved Tickets', 'Achievement Rate (%)', 'Status', 'W1', 'W2', 'W3', 'W4']
    ];

    for (const m of metrics) {
      rows.push([
        m.id,
        m.category,
        m.name,
        m.targetRate.toString(),
        m.realRate.toString(),
        m.totalTickets.toString(),
        m.achievedTickets.toString(),
        m.achievementRate.toString(),
        m.status,
        `${m.weekly[0]?.realRate || 0}%`,
        `${m.weekly[1]?.realRate || 0}%`,
        `${m.weekly[2]?.realRate || 0}%`,
        `${m.weekly[3]?.realRate || 0}%`,
      ]);
    }

    // Append / Write to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'KPI_Snapshots!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rows,
      },
    });

    console.log(`[SheetsSync] Successfully synced period ${period} to Google Sheets.`);
    return { success: true };
  } catch (error) {
    console.error('[SheetsSync] Error syncing to Google Sheets:', error);
    return { success: false, message: (error as Error).message };
  }
}
