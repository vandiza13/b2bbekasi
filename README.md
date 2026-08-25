# KPI BGÈS BEKASI — Dashboard & SLA Engine

Dashboard monitoring performa SLA & Assurance Layanan BGÈS (DATIN, HSI, WIFI) untuk Witel Bekasi berbasis **Next.js 15**, **Drizzle ORM**, **PostgreSQL (Supabase)**, dan **Tailwind CSS**.

---

## 🚀 Fitur Utama

- **Live Aggregated KPI Dashboard**: Menampilkan 8 indikator SLA utama Telkom BGÈS (DATIN K1/K2/K3, Guarantee DATIN & HSI, HSI HVC 4 Jam / 24 Jam, dan WIFI).
- **Weekly Breakdown (W1–W4)**: Analisis performa mingguan per indikator berdasarkan tanggal lapor insiden.
- **In-Memory File Processing**: Unggah file Excel (.xlsx / .xls) & CSV log Insera secara instan tanpa file temporer di disk.
- **Pre-Aggregated Snapshots**: Pembacaan data performa tinggi $O(1)$ dari tabel `kpi_snapshots`.
- **Google Sheets Backup**: Dukungan sinkronisasi otomatis ke Google Sheets via Service Account API v4.
- **Modern Enterprise Dark UI**: Antarmuka responsif dengan identitas visual Telkom Indonesia.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions / Route Handlers)
- **Language**: TypeScript (Strict Mode)
- **Database**: PostgreSQL (Supabase Transaction Pooler)
- **ORM**: Drizzle ORM (`drizzle-kit` for migrations & push)
- **Styling**: Tailwind CSS + Lucide Icons + clsx / tailwind-merge
- **File Parser**: `xlsx`

---

## 📋 Indikator SLA & Target

| Kode Indikator | Nama Indikator | SLA Threshold | Target Rate |
| :--- | :--- | :--- | :--- |
| `TTR_DATIN_K1` | Compliance-TTR DATIN-K1 Recovery (43 Menit) | $\le 43\text{ Menit}$ | $90.00\%$ |
| `TTR_DATIN_K2` | Compliance-TTR DATIN-K2 (3,6 Jam) | $\le 216\text{ Menit}$ | $95.00\%$ |
| `TTR_DATIN_K3` | Compliance-TTR DATIN-K3 (7,2 Jam) | $\le 432\text{ Menit}$ | $92.00\%$ |
| `ASR_GUARANTEE_DATIN` | Assurance Guarantee DATIN | Non-Garansi Valid | $91.00\%$ |
| `TTR_HSI_HVC_4H` | Compliance-TTR HSI-HVC Reguler (4 Jam) | $\le 240\text{ Menit}$ | $65.00\%$ |
| `TTR_HSI_HVC_24H` | Compliance-TTR HSI-HVC Reguler (24 Jam) | $\le 1440\text{ Menit}$ | $95.00\%$ |
| `ASR_GUARANTEE_HSI` | Assurance Guarantee HSI | Non-Garansi Valid | $91.00\%$ |
| `TTR_WIFI` | Compliance-TTR WIFI (6 Jam Logik, 24 Jam Fisik) | $\le 360 / 1440\text{ Menit}$ | $93.00\%$ |

---

## 💻 Menjalankan Proyek

### 1. Install Dependencies (jika belum)
```bash
npm install
```

### 2. Jalankan Database Push & Seed
```bash
npx drizzle-kit push
npm run db:seed
```

### 3. Jalankan Development Server
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

### 4. Build untuk Production
```bash
npm run build
npm run start
```
