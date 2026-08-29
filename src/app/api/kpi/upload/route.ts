import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { db } from '@/db';
import { incidentTickets, kpiSnapshots, sqmTickets, outstandingTickets, qIndexTickets } from '@/db/schema';
import { computeKpiMetrics, RawTicketInput } from '@/lib/kpi/engine';
import { syncKpiToGoogleSheets } from '@/lib/sheets/sync';
import { VALID_CATEGORIES, UploadCategory, UploadPayloadSchema, CATEGORY_ROUTING_MAP } from '@/types/ingestion';
import { parseExcelRowsUniversally } from '@/lib/kpi/parser';
import { assertApiAuth } from '@/lib/auth';
import { createOrCoalesceJob } from '@/lib/sheets/mirror-writer';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function deduplicateByKey<T, K>(arr: T[], keyFn: (item: T) => K): T[] {
  const map = new Map<K, T>();
  for (const item of arr) {
    const key = keyFn(item);
    map.set(key, item);
  }
  return Array.from(map.values());
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    if (!(await assertApiAuth(req))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const categoryRaw = formData.get('category') as string | null;
    const periodRaw = (formData.get('period') as string | null) || undefined;

    if (!categoryRaw) {
      return NextResponse.json({
        success: false,
        error: `Parameter 'category' wajib diisi. Pilihan resmi: ${VALID_CATEGORIES.join(', ')}`
      }, { status: 400 });
    }

    const parseResult = UploadPayloadSchema.safeParse({
      category: categoryRaw,
      period: periodRaw,
    });

    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      return NextResponse.json({
        success: false,
        error: errorMsg
      }, { status: 400 });
    }

    const category = parseResult.data.category as UploadCategory;
    const routingInfo = CATEGORY_ROUTING_MAP[category];

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'File Excel (.xlsx, .xls, .csv) wajib disertakan'
      }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

    const { parsedRows, detectedPeriod } = parseExcelRowsUniversally(
      workbook,
      category,
      parseResult.data.period
    );

    let calculatedMetrics: unknown[] = [];
    let calculatedSummary: unknown = null;

    await db.transaction(async (tx) => {
      if (routingInfo.targetTable === 'incident_tickets' && parsedRows.length > 0) {
        const uniqueTickets = deduplicateByKey(parsedRows, t => t.incidentId);
        const CHUNK_SIZE = 100;

        for (let i = 0; i < uniqueTickets.length; i += CHUNK_SIZE) {
          const chunk = uniqueTickets.slice(i, i + CHUNK_SIZE);
          await tx.insert(incidentTickets).values(
            chunk.map(t => ({
              incidentId: t.incidentId,
              summary: t.summary,
              serviceAreaCode: t.serviceAreaCode,
              customerName: t.customerName,
              serviceId: t.serviceId,
              serviceType: t.serviceType,
              category: t.category,
              uploadCategory: category,
              reportedAt: t.reportedAt,
              resolvedAt: t.resolvedAt,
              ttrMinutes: t.ttrMinutes !== null ? String(t.ttrMinutes) : null,
              status: t.status,
              isGaul: t.isGaul,
              isGuarantee: t.isGuarantee,
              technicianName: t.technicianName,
              telegramId: t.telegramId,
              rawPayload: t.rawPayload,
            }))
          ).onConflictDoUpdate({
            target: incidentTickets.incidentId,
            set: {
              summary: sql`EXCLUDED.summary`,
              serviceAreaCode: sql`EXCLUDED.service_area_code`,
              customerName: sql`EXCLUDED.customer_name`,
              serviceId: sql`EXCLUDED.service_id`,
              serviceType: sql`EXCLUDED.service_type`,
              category: sql`EXCLUDED.category`,
              uploadCategory: sql`EXCLUDED.upload_category`,
              reportedAt: sql`EXCLUDED.reported_at`,
              resolvedAt: sql`EXCLUDED.resolved_at`,
              ttrMinutes: sql`EXCLUDED.ttr_minutes`,
              status: sql`EXCLUDED.status`,
              isGaul: sql`EXCLUDED.is_gaul`,
              isGuarantee: sql`EXCLUDED.is_guarantee`,
              technicianName: sql`EXCLUDED.technician_name`,
              telegramId: sql`EXCLUDED.telegram_id`,
              rawPayload: sql`EXCLUDED.raw_payload`,
            }
          });
        }
      }

      if (routingInfo.targetTable === 'sqm_tickets' && parsedRows.length > 0) {
        const uniqueSqm = deduplicateByKey(parsedRows, t => t.incidentId);
        const CHUNK_SIZE = 100;
        for (let i = 0; i < uniqueSqm.length; i += CHUNK_SIZE) {
          const chunk = uniqueSqm.slice(i, i + CHUNK_SIZE);
          await tx.insert(sqmTickets).values(
            chunk.map(t => ({
              incidentId: t.incidentId,
              serviceAreaCode: t.serviceAreaCode,
              customerName: t.customerName,
              serviceId: t.serviceId,
              serviceType: t.serviceType,
              category: t.category as 'HSI' | 'DATIN',
              reportedAt: t.reportedAt,
              ttrMinutes: t.ttrMinutes !== null ? String(t.ttrMinutes) : null,
              status: t.status,
              rawPayload: t.rawPayload,
            }))
          ).onConflictDoUpdate({
            target: sqmTickets.incidentId,
            set: {
              serviceAreaCode: sql`EXCLUDED.service_area_code`,
              customerName: sql`EXCLUDED.customer_name`,
              serviceId: sql`EXCLUDED.service_id`,
              serviceType: sql`EXCLUDED.service_type`,
              category: sql`EXCLUDED.category`,
              reportedAt: sql`EXCLUDED.reported_at`,
              ttrMinutes: sql`EXCLUDED.ttr_minutes`,
              status: sql`EXCLUDED.status`,
              rawPayload: sql`EXCLUDED.raw_payload`,
            }
          });
        }
      }

      if (routingInfo.targetTable === 'outstanding_tickets' && parsedRows.length > 0) {
        const uniqueOut = deduplicateByKey(parsedRows, t => t.incidentId);
        const CHUNK_SIZE = 100;
        for (let i = 0; i < uniqueOut.length; i += CHUNK_SIZE) {
          const chunk = uniqueOut.slice(i, i + CHUNK_SIZE);
          await tx.insert(outstandingTickets).values(
            chunk.map(t => ({
              incidentId: t.incidentId,
              serviceAreaCode: t.serviceAreaCode,
              customerName: t.customerName,
              serviceId: t.serviceId,
              serviceType: t.serviceType,
              category: t.category as 'HSI' | 'DATIN',
              reportedAt: t.reportedAt,
              status: t.status,
              rawPayload: t.rawPayload,
            }))
          ).onConflictDoUpdate({
            target: outstandingTickets.incidentId,
            set: {
              serviceAreaCode: sql`EXCLUDED.service_area_code`,
              customerName: sql`EXCLUDED.customer_name`,
              serviceId: sql`EXCLUDED.service_id`,
              serviceType: sql`EXCLUDED.service_type`,
              category: sql`EXCLUDED.category`,
              reportedAt: sql`EXCLUDED.reported_at`,
              status: sql`EXCLUDED.status`,
              rawPayload: sql`EXCLUDED.raw_payload`,
            }
          });
        }
      }

      if (routingInfo.targetTable === 'q_index_tickets' && parsedRows.length > 0) {
        const uniqueQ = deduplicateByKey(parsedRows, t => `${t.serviceAreaCode}_${t.incidentId}`);
        const CHUNK_SIZE = 100;
        for (let i = 0; i < uniqueQ.length; i += CHUNK_SIZE) {
          const chunk = uniqueQ.slice(i, i + CHUNK_SIZE);
          await tx.insert(qIndexTickets).values(
            chunk.map(t => ({
              id: `${t.serviceAreaCode}_${t.incidentId}`,
              incidentId: t.incidentId,
              serviceAreaCode: t.serviceAreaCode,
              customerName: t.customerName,
              category: t.category as 'HSI' | 'DATIN',
              reportedAt: t.reportedAt,
              rawPayload: t.rawPayload,
            }))
          ).onConflictDoUpdate({
            target: qIndexTickets.id,
            set: {
              incidentId: sql`EXCLUDED.incident_id`,
              serviceAreaCode: sql`EXCLUDED.service_area_code`,
              customerName: sql`EXCLUDED.customer_name`,
              category: sql`EXCLUDED.category`,
              reportedAt: sql`EXCLUDED.reported_at`,
              rawPayload: sql`EXCLUDED.raw_payload`,
            }
          });
        }
      }

      // Recompute KPI untuk periode yang di-upload
      const existingTickets = await tx.select().from(incidentTickets).where(
        sql`TO_CHAR(${incidentTickets.reportedAt}, 'YYYY-MM') = ${detectedPeriod}`
      );
      const mappedAllTickets: RawTicketInput[] = existingTickets.map(t => ({
        incidentId: t.incidentId,
        summary: t.summary,
        serviceAreaCode: t.serviceAreaCode || 'BEK',
        customerName: t.customerName,
        serviceId: t.serviceId,
        serviceType: t.serviceType,
        category: t.category as 'DATIN' | 'HSI' | 'WIFI',
        uploadCategory: t.uploadCategory,
        reportedAt: t.reportedAt,
        resolvedAt: t.resolvedAt,
        ttrMinutes: t.ttrMinutes ? Number(t.ttrMinutes) : null,
        status: t.status,
        isGaul: t.isGaul || false,
        isGuarantee: t.isGuarantee || false,
        technicianName: t.technicianName,
        telegramId: t.telegramId,
        rawPayload: t.rawPayload as Record<string, unknown>,
      }));

      const existingSqm = await tx.select().from(sqmTickets).where(
        sql`TO_CHAR(${sqmTickets.reportedAt}, 'YYYY-MM') = ${detectedPeriod}`
      );
      const mappedSqmTickets: RawTicketInput[] = existingSqm.map(t => ({
        incidentId: t.incidentId,
        serviceAreaCode: t.serviceAreaCode || 'BEK',
        customerName: t.customerName,
        serviceId: t.serviceId,
        serviceType: t.serviceType,
        category: t.category as 'HSI' | 'DATIN',
        uploadCategory: `SQM ${t.category}`,
        reportedAt: t.reportedAt,
        status: t.status,
        isGaul: false,
        isGuarantee: false,
        rawPayload: t.rawPayload as Record<string, unknown>,
      }));

      const combinedTickets = [...mappedAllTickets, ...mappedSqmTickets];

      const { metrics, summary } = computeKpiMetrics(combinedTickets);
      calculatedMetrics = metrics;
      calculatedSummary = summary;

      for (const m of metrics) {
        const snapshotId = `${detectedPeriod}_${m.id}`;
        await tx.insert(kpiSnapshots).values({
          id: snapshotId,
          period: detectedPeriod,
          indicatorCode: m.id,
          category: m.category,
          targetRate: String(m.targetRate),
          realRate: String(m.realRate),
          totalTickets: m.totalTickets,
          achievedTickets: m.achievedTickets,
          achievementRate: String(m.achievementRate),
          status: m.status,
          weeklyBreakdown: m.weekly,
          syncedToSheets: false,
        }).onConflictDoUpdate({
          target: kpiSnapshots.id,
          set: {
            period: sql`EXCLUDED.period`,
            indicatorCode: sql`EXCLUDED.indicator_code`,
            category: sql`EXCLUDED.category`,
            targetRate: sql`EXCLUDED.target_rate`,
            realRate: sql`EXCLUDED.real_rate`,
            totalTickets: sql`EXCLUDED.total_tickets`,
            achievedTickets: sql`EXCLUDED.achieved_tickets`,
            achievementRate: sql`EXCLUDED.achievement_rate`,
            status: sql`EXCLUDED.status`,
            weeklyBreakdown: sql`EXCLUDED.weekly_breakdown`,
            updatedAt: new Date(),
          }
        });
      }
    });

    const executionTimeMs = Date.now() - startTime;

    let syncJobId: string | null = null;
    try {
      const job = await createOrCoalesceJob(category, detectedPeriod);
      syncJobId = job?.id ?? null;
    } catch (syncErr) {
      console.warn('[UploadAPI] Gagal membuat job sync sheet:', syncErr);
    }

    if (calculatedSummary && Array.isArray(calculatedMetrics)) {
      syncKpiToGoogleSheets(detectedPeriod, calculatedSummary as any, calculatedMetrics as any).catch((err) => {
        console.error('[UploadAPI] Asynchronous Sheets Sync error:', err);
      });
    }

    return NextResponse.json({
      success: true,
      category,
      targetTable: routingInfo.targetTable,
      targetSheet: routingInfo.targetSheet,
      processedRows: parsedRows.length,
      period: detectedPeriod,
      fileName: file.name,
      executionTimeMs,
      syncJobId,
      metrics: calculatedMetrics,
      summary: calculatedSummary,
    });
  } catch (error) {
    console.error('[UploadAPI] Ingestion Pipeline Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message || 'Gagal memproses file pada Ingestion Pipeline'
    }, { status: 500 });
  }
}
