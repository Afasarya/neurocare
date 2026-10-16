# 🧠 NeuroCare PWA — Mobile-First Stroke Care & Prevention Platform

> **NeuroCare** adalah Progressive Web Application (PWA) kesehatan terintegrasi berbasis kecerdasan buatan (AI) yang dirancang khusus untuk pencegahan stroke primer (**NeuroPrevent**) dan pendampingan rehabilitasi pascastroke (**NeuroRecovery**).

Aplikasi ini menggabungkan integrasi komputasi klinis **WHO Cardiovascular Disease (CVD) Risk Engine**, **Photoplethysmography (PPG) Camera Pulse Monitoring**, **Computer Vision Motion Tracking**, dan **Generative AI Health Insights** yang terhubung langsung ke layanan microservices Cloud Run.

##Untuk REPO AI SERVICE ENGINE BISA CEK PADA : https://github.com/zelphyx/AI-Neurocare
---

## 🔑 Akun Demo & Pengujian (Testing Credentials)

Untuk penguji, penilai, atau developer yang ingin langsung menguji seluruh fitur end-to-end tanpa perlu mendaftar dari awal:

| Parameter | Kredensial Pengujian |
| :--- | :--- |
| **Email** | `aryafas123@gmail.com` |
| **Password** | `23Maret2007#` |
| **Peran / Akses** | Akun Pengguna Aktif (Akses Penuh: NeuroPrevent & NeuroRecovery) |

---

## 🚀 Fitur Utama

NeuroCare membagi alur penggunanya ke dalam dua pilar utama:

### 1. 🛡️ NeuroPrevent (Pencegahan Stroke Primer)
* **F01 · Skrining Risiko Kardiovaskular (WHO CVD Risk Engine)**
  * Menghitung estimasi risiko penyakit kardiovaskular 10 tahun berdasarkan pedoman World Health Organization (WHO) South-East Asia Region (SEAR).
  * Terhubung secara live ke microservice AI Gateway untuk perhitungan kategori risiko, BMI teresolusi, dan peringatan krisis hipertensi.
  * Mendukung estimasi adaptif untuk semua rentang usia.
* **F02 · Evaluasi Gap Pemeriksaan (Screening Gaps)**
  * Mendeteksi parameter kesehatan yang belum lengkap (seperti tekanan darah, berat/tinggi badan) dan merekomendasikan tindakan pencegahan terarah.
* **F03 · Monitor Detak Jantung Kamera (PPG Biomarkers)**
  * Mengukur detak jantung (*Beats Per Minute* / BPM) secara mandiri hanya menggunakan kamera belakang ponsel dan flash/cahaya ruangan selama 10 detik.
  * Dilengkapi algoritma pemrosesan sinyal digital (*Digital Signal Processing* / DSP) adaptif dan deteksi puncak pulsa real-time.
* **F04 · Insight Kesehatan Personal (AI Health Insights)**
  * Narasi dan rangkuman risiko personal yang ditenagai oleh model AI LLM (*Ixora Studio / gpt-5.6-luna*).
  * Menghasilkan rencana aksi gaya hidup konkret, langkah medis lanjutan, dan catatan persiapan pemulihan secara terstruktur.

---

### 2. 🌿 NeuroRecovery (Rehabilitasi & Pemulihan Pascastroke)
* **F05 · Check-in Pemulihan Harian (Post-Stroke Check-in)**
  * Evaluasi mandiri berkala terkait tingkat kemandirian fungsional, mobilitas fisik, kemampuan komunikasi, dan suasana hati pascastroke.
* **F06 · Pelacak Gerak Rehabilitasi (Computer Vision Motion Tracker)**
  * Pelacak latihan motorik berbasis kamera depan secara *on-device* di browser.
  * Dilengkapi penghitung repetisi (*repetition counter*) otomatis dan timer durasi latihan real-time untuk latihan rentang gerak bahu dan lengan.
* **F07 · Grafik Progres & Tren Pemulihan**
  * Visualisasi riwayat check-in dan aktivitas fisik untuk memantau tren perbaikan motorik dari waktu ke waktu.
* **F08 · Rencana Aksi & Tindakan Terjadwal**
  * Manajemen tugas harian yang terintegrasi langsung dengan hasil gap skrining dan riwayat latihan pasien.
* **F09 · Modul Rehabilitasi Komunikasi (Aphasia Support)**
  * Latihan stimulasi komunikasi verbal dan kartu asosiasi kata untuk pasien afasia pascastroke.
* **F10 · Aktivitas Latihan Kognitif**
  * Latihan pengenalan pola, memori kerja, dan konsentrasi interaktif.
* **F11 · Pendamping Pasien (Caregiver Support)**
  * Catatan dan panduan praktis bagi keluarga atau pendamping dalam merawat pasien pascastroke di rumah.

---

## 🛠️ Arsitektur Teknologi

```text
┌────────────────────────────────────────────────────────┐
│               NeuroCare PWA (Frontend)                 │
│    Next.js 16 (App Router) + React 19 + Tailwind CSS   │
│         TanStack Query + Zustand + Lucide Icons        │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
      Supabase Auth & Database       Server-Side API Route
   (PostgreSQL + RLS Protection)     (Edge & Node.js Handlers)
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │      AI-Neurocare Gateway Engine      │
                      │         (Google Cloud Run)            │
                      └───────┬───────────────────────┬───────┘
                              │                       │
                              ▼                       ▼
                   ┌─────────────────────┐ ┌─────────────────────┐
                   │  PPG Signal Engine  │ │  Ixora LLM Studio   │
                   │ (Python DSP Service)│ │  (gpt-5.6-luna AI)  │
                   └─────────────────────┘ └─────────────────────┘
```

* **Frontend Framework**: Next.js 16 (App Router), React 19, TypeScript (Strict Mode).
* **Styling & UI**: Tailwind CSS 4, Lucide Icons, Glassmorphic Modern Aesthetic.
* **PWA & Offline**: Web App Manifest, Service Worker caching, Mobile Touch Optimized.
* **Database & Auth**: Supabase Authentication, PostgreSQL, Row-Level Security (RLS).
* **AI & DSP Gateway**: Google Cloud Run Microservices (`ai-neurocare-gateway` & `ppg-engine`).
* **LLM Intelligence**: Ixora Studio Provider (`gpt-5.6-luna`).
* **Testing & Quality Assurance**: Vitest (160 automated unit tests), TypeScript Static Analysis.

---

## 📲 Cara Menjalankan & Menguji Aplikasi

### A. Membuka di Smartphone (Pengalaman Terbaik)
Aplikasi ini dioptimalkan penuh sebagai **Progressive Web Application (PWA)**:
1. Buka browser di ponsel Anda (direkomendasikan **Google Chrome** di Android atau **Safari** di iOS).
2. Akses URL deployment produksi (Vercel).
3. **Login** menggunakan akun demo di atas:
   * Email: `aryafas123@gmail.com`
   * Password: `23Maret2007#`
4. Untuk menginstal aplikasi ke layar utama ponsel:
   * **Android (Chrome)**: Ketuk menu titik tiga (⋮) di kanan atas > pilih **"Tambahkan ke Layar Utama"** / **"Install App"**.
   * **iOS (Safari)**: Ketuk tombol Share (ikon kotak dengan panah ke atas) > pilih **"Add to Home Screen"**.
5. Buka NeuroCare langsung dari homescreen smartphone Anda.

---

### B. Menjalankan di Lokal (Local Development)

#### 1. Prasyarat
* Node.js versi `>= 20.9.0`
* npm versi `>= 10.0.0`

#### 2. Kloning dan Instalasi Dependensi
```bash
git clone https://github.com/Afasarya/neurocare.git
cd neurocare
npm install
```

#### 3. Konfigurasi Environment Variables
Salin template konfigurasi:
```bash
cp .env.example .env.local
```

Isi variabel lingkungan pada `.env.local`:
```env
# URL Aplikasi
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_NEUROCARE_DEMO_MODE=false

# Supabase Auth & Database
NEXT_PUBLIC_SUPABASE_URL=https://vfokyjpmkkgwwfroccf.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# AI Microservices (Google Cloud Run)
AI_GATEWAY_BASE_URL=https://ai-neurocare-gateway-727279561989.asia-southeast2.run.app
AI_GATEWAY_API_KEY=
```

#### 4. Menjalankan Server Lokal
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

#### 5. Menjalankan Pengujian (Testing Suite)
```bash
# Menjalankan 160 unit test otomatis
npm test

# Type checking TypeScript
npx tsc --noEmit
```

---

## 📋 Panduan Pengujian Fitur Khusus

### 1. Pengujian Skrining Kardiovaskular (F01)
1. Buka menu **Skrining** (`/app/screening`).
2. Masukkan tanggal lahir, jenis kelamin, dan riwayat kesehatan.
3. Masukkan data tekanan darah sistolik, tinggi, dan berat badan (atau pilih opsi yang diketahui).
4. Klik **Kirim Skrining**; server akan memanggil AI Gateway dan menampilkan skor estimasi risiko kardiovaskular 10 tahun WHO secara langsung.

### 2. Pengujian Monitor Detak Jantung Kamera (F03)
1. Buka menu **Monitor Detak** (`/app/screening/pulse`).
2. Gunakan ponsel pintar (disarankan Chrome di Android dengan lampu flash).
3. Klik **Aktifkan kamera** dan berikan izin akses kamera.
4. Lampu kamera akan menyala otomatis. Tempelkan ujung jari telunjuk Anda menutupi lensa kamera dan lampu.
5. Klik **Mulai pengukuran**; tahan jari dengan tenang selama 10 detik.
6. Hasil estimasi detak jantung (BPM) akan langsung ditampilkan pada kartu hasil hijau.

### 3. Pengujian Insight Kesehatan Personal (F04)
1. Buka menu **Insight** (`/app/insights`).
2. Data skrining aktif Anda sudah otomatis disiapkan.
3. Klik tombol **Buat insight**.
4. Model AI LLM akan memproses analisis dan menyajikan ringkasan naratif, faktor pemicu risiko, serta rencana aksi terstruktur.

### 4. Pengujian Pelacak Gerak Rehabilitasi (F06)
1. Buka menu **Pelacak Gerak** (`/app/recovery/activity`).
2. Klik **Nyalakan kamera** untuk mengaktifkan kamera depan (selfie).
3. Posisikan tubuh Anda tegak di depan kamera.
4. Klik **Mulai aktivitas**; timer latihan akan mulai berjalan.
5. Lakukan gerakan mengangkat tangan/lengan secara perlahan; sistem akan otomatis mendeteksi gerakan dan menambah angka repetisi latihan secara real-time.
6. Klik **Selesaikan sesi** untuk melihat ringkasan total repetisi dan durasi latihan.

---

## 🔒 Kebijakan Privasi & Keamanan Data Medis

* **On-Device Camera Processing**: Seluruh pemrosesan video pada Monitor Detak (PPG) dan Pelacak Gerak (Motion Tracker) diolah sementara di memori perangkat browser. **Tidak ada rekaman video, foto, atau frame kamera yang diunggah ke server maupun disimpan di cloud**.
* **Row-Level Security (RLS)**: Data kesehatan pengguna pada database Supabase dilindungi oleh RLS; setiap pengguna hanya memiliki otorisasi untuk membaca dan memodifikasi datanya sendiri.
* **Disclaimer Klinis**: NeuroCare adalah platform edukasi dan pemantauan mandiri, bukan pengganti diagnosis medis, penilaian gawat darurat, atau resep pengobatan dokter. Jika terjadi gejala stroke akut (FAST), pengguna diarahkan segera mencari pertolongan medis darurat.

---

## 👥 Tim Pengembang

Dikembangkan dengan dedikasi untuk kompetisi **JOINTS UGM**.
