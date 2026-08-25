import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const sampleTickets = [
  // DATIN Tickets
  {
    incident_id: 'INC-DATIN-001',
    summary: 'Gangguan Link Astinet Kantor Cabang BEK',
    service_area_code: 'BEK',
    customer_name: 'PT Bank Central Bekasi',
    service_id: '1224567890',
    service_type: 'ASTINET',
    category: 'DATIN',
    reported_at: '2026-08-02 08:30:00',
    resolved_at: '2026-08-02 09:05:00',
    ttr_minutes: 35, // Comply K1 (<=43), K2 (<=216), K3 (<=432)
    status: 'CLOSED',
    is_gaul: false,
    is_guarantee: false,
    technician_name: 'Budi Santoso',
  },
  {
    incident_id: 'INC-DATIN-002',
    summary: 'Loss Power Metro-E Tambun',
    service_area_code: 'KLB',
    customer_name: 'PT Auto Parts Indonesia',
    service_id: '1224567891',
    service_type: 'METRONET',
    category: 'DATIN',
    reported_at: '2026-08-09 10:15:00',
    resolved_at: '2026-08-09 12:45:00',
    ttr_minutes: 150, // Comply K2 (<=216), K3 (<=432)
    status: 'CLOSED',
    is_gaul: false,
    is_guarantee: false,
    technician_name: 'Ahmad Faisal',
  },
  {
    incident_id: 'INC-DATIN-003',
    summary: 'Kabel Putus Cikarang Pusat',
    service_area_code: 'CNE',
    customer_name: 'Kawasan Industri Jababeka',
    service_id: '1224567892',
    service_type: 'VPN IP',
    category: 'DATIN',
    reported_at: '2026-08-16 14:00:00',
    resolved_at: '2026-08-16 19:30:00',
    ttr_minutes: 330, // Comply K3 (<=432)
    status: 'CLOSED',
    is_gaul: false,
    is_guarantee: false,
    technician_name: 'Doni Pratama',
  },
  {
    incident_id: 'INC-DATIN-004',
    summary: 'FO Cut Simpang Pondok Gede',
    service_area_code: 'PDE',
    customer_name: 'RS Mitra Bekasi',
    service_id: '1224567893',
    service_type: 'ASTINET',
    category: 'DATIN',
    reported_at: '2026-08-24 11:00:00',
    resolved_at: '2026-08-24 19:00:00',
    ttr_minutes: 480, // Over K3 (>432)
    status: 'CLOSED',
    is_gaul: true,
    is_guarantee: true, // Garansi
    technician_name: 'Eko Wahyudi',
  },

  // HSI Tickets
  {
    incident_id: 'INC-HSI-001',
    summary: 'Loss Signal Red Blinking ONT',
    service_area_code: 'KRA',
    customer_name: 'CV Mandiri Sejahtera',
    service_id: '1213344550',
    service_type: 'HSI HVC',
    category: 'HSI',
    reported_at: '2026-08-04 09:00:00',
    resolved_at: '2026-08-04 11:30:00',
    ttr_minutes: 150, // Comply 4H (<=240) & 24H (<=1440)
    status: 'CLOSED',
    is_gaul: false,
    is_guarantee: false,
    technician_name: 'Fikri Ramadhan',
  },
  {
    incident_id: 'INC-HSI-002',
    summary: 'Redaman Tinggi Dropcore Tertekuk',
    service_area_code: 'PKY',
    customer_name: 'PT Sinar Abadi',
    service_id: '1213344551',
    service_type: 'HSI HVC',
    category: 'HSI',
    reported_at: '2026-08-11 13:00:00',
    resolved_at: '2026-08-11 18:00:00',
    ttr_minutes: 300, // Comply 24H (<=1440)
    status: 'CLOSED',
    is_gaul: false,
    is_guarantee: false,
    technician_name: 'Gunawan',
  },
  {
    incident_id: 'INC-HSI-003',
    summary: 'ONT Hang & Reset Config',
    service_area_code: 'DEP',
    customer_name: 'PT Global Niaga',
    service_id: '1213344552',
    service_type: 'HSI HVC',
    category: 'HSI',
    reported_at: '2026-08-18 10:00:00',
    resolved_at: '2026-08-18 12:00:00',
    ttr_minutes: 120, // Comply 4H & 24H
    status: 'CLOSED',
    is_gaul: false,
    is_guarantee: false,
    technician_name: 'Hadi Saputra',
  },
  {
    incident_id: 'INC-HSI-004',
    summary: 'Kabel Dropcore Putus Tertabrak Truk',
    service_area_code: 'CSL',
    customer_name: 'PT Cikarang Logistik',
    service_id: '1213344553',
    service_type: 'HSI HVC',
    category: 'HSI',
    reported_at: '2026-08-25 08:00:00',
    resolved_at: '2026-08-25 11:30:00',
    ttr_minutes: 210, // Comply 4H & 24H
    status: 'CLOSED',
    is_gaul: false,
    is_guarantee: false,
    technician_name: 'Irwan Setiawan',
  },

  // WIFI Tickets
  {
    incident_id: 'INC-WIFI-001',
    summary: 'AP Offline Venue Mall Metropolitan',
    service_area_code: 'BEK',
    customer_name: 'Mall Metropolitan Bekasi',
    service_id: '1445566770',
    service_type: 'WIFI ID MANAGED',
    category: 'WIFI',
    reported_at: '2026-08-05 14:00:00',
    resolved_at: '2026-08-05 16:30:00',
    ttr_minutes: 150, // Comply (<=360)
    status: 'CLOSED',
    is_gaul: false,
    is_guarantee: false,
    technician_name: 'Joko Widodo',
  },
  {
    incident_id: 'INC-WIFI-002',
    summary: 'SSID Not Broadcasting Kantor Pemda',
    service_area_code: 'SKJ',
    customer_name: 'Dinas Kominfo Bekasi',
    service_id: '1445566771',
    service_type: 'WICO',
    category: 'WIFI',
    reported_at: '2026-08-19 09:00:00',
    resolved_at: '2026-08-19 13:00:00',
    ttr_minutes: 240, // Comply (<=360)
    status: 'CLOSED',
    is_gaul: false,
    is_guarantee: false,
    technician_name: 'Kurniawan',
  }
];

const worksheet = XLSX.utils.json_to_sheet(sampleTickets);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Insera_Aug2026');

const outDir = path.join(process.cwd(), 'sample_data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const filePath = path.join(outDir, 'sample_insera_aug2026.xlsx');
XLSX.writeFile(workbook, filePath);
console.log('✅ Sample Insera dataset created at:', filePath);
