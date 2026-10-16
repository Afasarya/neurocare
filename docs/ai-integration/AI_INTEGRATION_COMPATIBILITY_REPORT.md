# NeuroCare AI Integration Compatibility Report

**Tanggal audit:** 16 Oktober 2026 (Asia/Jakarta)  
**Repository PWA:** `D:\Joints UGM\neurocare`  
**Repository AI (read-only):** `D:\Joints UGM\AI-Neurocare`  
**Panduan AI yang ditemukan:** `D:\Joints UGM\FULLSTACK_GUIDE.md`  
**Status:** `ADAPTER_IMPLEMENTED_PARTIALLY_LIVE` — Gateway health telah diverifikasi; adapter PWA dan pengujiannya selesai, tetapi proxy PPG Gateway belum dikonfigurasi.

## 1. Batasan bukti

Laporan ini membandingkan source PWA yang benar-benar ada dengan panduan dan source AI-Neurocare. Repository AI hanya dibaca dan tidak diubah. Implementasi live tidak boleh dianggap selesai sampai request ke endpoint nyata berhasil, respons tervalidasi, consent ditegakkan, dan hasil tersimpan di Supabase.

Probe tanpa data pengguna pada endpoint PPG yang diberikan:

- URL Gateway baru `GET https://ai-neurocare-gateway-727279561989.asia-southeast2.run.app/health` → `200` dengan body `{"status":"ok","service":"ai-neurocare-gateway"}`.
- `POST` Gateway `/api/v1/screening/evaluate` dengan payload kosong sintetis → `400 ERR_SCHEMA_VALIDATION_FAILED`, membuktikan endpoint dapat dijangkau dan validasi kontrak aktif tanpa mengirim PHI.
- `POST` Gateway `/api/v1/biomarkers/ppg/process` dengan `{}` → `502 ERR_PPG_ENGINE_NOT_CONFIGURED`: Gateway belum memiliki `PPG_ENGINE_BASE_URL`.
- URL PPG Engine langsung pada screenshot → `403 Forbidden`; PPG memang harus tetap privat dan hanya dipanggil Gateway.

Karena itu PPG belum dapat dipakai sebagai bukti F03 live. Panduan menyatakan PPG Engine harus diakses melalui AI Gateway, bukan langsung oleh browser atau PWA.

## 2. Kondisi adapter sebelum implementasi ini

| Domain | Implementasi saat audit awal | Kondisi saat audit awal |
|---|---|---|
| F01 screening | `screening-engine.ts` memanggil URL penuh dari `SCREENING_ENGINE_URL`, `Authorization: Bearer`, lalu mengharapkan envelope NeuroCare. | Tidak kompatibel langsung dengan Gateway (`X-API-Key`, base URL + path, raw response). |
| F02 screening gaps | Route/UI/fixture tersedia, tetapi belum ada HTTP adapter rules engine live. | Belum terhubung ke `/api/v1/screening/gaps`. |
| F03 PPG | `ppg-engine.ts` mengirim capture NeuroCare (`elapsedMs`, `redMean`) dan mengharapkan envelope NeuroCare. | Perlu mapper ke `{ signal, samplingRateHz }` dan mapper response PPG Gateway. Capture browser nyata masih belum lengkap. |
| F04 health insight | Adapter memakai `AI_SERVICE_URL`, Bearer token, dan kontrak `health-insight-v1` milik PWA. Consent append-only sudah diperiksa server-side. | Payload/response berbeda secara material dari `/api/v1/insights/health`. Source UI masih dapat berasal dari demo dan belum selalu diambil dari record owner di DB. |
| F06 pose/rehab | Kontrak simpan aktivitas ada; belum ada adapter ke endpoint pose/session AI. | Bukan P0 dan memerlukan persetujuan latihan. Raw landmark tidak boleh dipersistenkan. |
| F07 recovery progress | Data service membaca `recovery_checkins` dan secara opsional `recovery_activities`; aktivitas yang tidak tersedia tidak memblokir check-in. | Jalur non-AI sudah sesuai kebutuhan dasar. Kontrak recovery AI memerlukan metrik sesi yang tidak tersedia dari F05 saja, sehingga tidak boleh dibuat-buat. |

## 3. Mismatch transport dan error

| Area | PWA saat ini | FULLSTACK_GUIDE / source AI | Keputusan integrasi |
|---|---|---|---|
| Konfigurasi | Tiga URL/key terpisah (`SCREENING_ENGINE_*`, `AI_SERVICE_*`, `PPG_ENGINE_*`). | Satu Gateway base URL; `X-API-Key`. | Gunakan `AI_GATEWAY_BASE_URL` dan `AI_GATEWAY_API_KEY` server-only. Adapter menyusun path allowlist; variabel adapter lama telah dihapus dari contoh environment agar tidak terjadi salah konfigurasi. |
| Auth gateway | `Authorization: Bearer`. | `X-API-Key`. | Kirim `X-API-Key` hanya dari module `server-only`; tidak pernah dari browser atau variabel `NEXT_PUBLIC_*`. |
| Success shape | Umumnya `{ data, meta }`. | Raw object per domain. | Parse raw gateway response dengan schema Zod khusus, lalu map ke kontrak UI PWA agar UI tidak dibangun ulang. |
| Error shape | `{ error, meta }`. | RFC 7807 `application/problem+json`. | Parse RFC 7807 dengan Zod, redaksi detail ke browser, dan map 401/400/422/502/504 ke error domain yang stabil. Jangan memantulkan payload mentah. |
| Content-Type | JSON normal. | Source gateway saat ini menulis `application/problem+json` untuk success dan error. | Tentukan success/error berdasarkan HTTP status, bukan Content-Type saja; tetap laporkan bug content-type ke AI Engineer. |
| Request identity | Request ID di body/header bervariasi. | Tidak semua endpoint menerima request ID di body. | Gunakan `X-Request-Id` untuk tracing PWA; jangan menambahkan field ekstra karena schema Gateway strict. |
| Timeout | 8–10 detik per adapter. | Insight memiliki hard timeout sekitar 8 detik; upstream dapat 502/504. | Default 10 detik; timeout diklasifikasikan, tidak retry otomatis untuk request yang dapat memicu side effect. |

## 4. Mapping per fitur

### F01 — `/api/v1/screening/evaluate`

Mismatch request:

- PWA menerima tanggal lahir, enum lowercase, status `unknown`, tanggal BP, consent, pathway, riwayat CVD, emergency flag, dan request ID.
- Gateway menerima usia integer, gender uppercase, SBP integer, status merokok boolean, serta BMI atau berat+tinggi. Schema Gateway strict dan hanya usia 40–59.

Keputusan mapping:

1. Safety gate dan riwayat CVD tetap diputuskan di PWA sebelum request AI.
2. Usia dihitung server-side dari tanggal lahir menggunakan tanggal UTC.
3. Usia 18–39, usia di luar 40–59, prior CVD bukan `no`, gender/smoking/BP/adipositas unknown: tidak memanggil Gateway dan tidak menghasilkan WHO score.
4. `female|male` → `FEMALE|MALE`; string numerik PWA → number tervalidasi.
5. `hasDiabetes` dan `totalCholesterolMmolL` dikirim `null` sampai PWA memiliki data nyata; tidak boleh diasumsikan.
6. Response Gateway disimpan dengan provenance dan dipetakan ke status `ok` PWA dengan `riskScope=cvd_10y`. `riskScoreCategory` adalah kategori CVD 10 tahun, bukan probabilitas stroke.
7. `isHypertensiveCrisis` tidak menggantikan emergency symptom triage. Nilainya dapat diteruskan sebagai fakta engine/provenance untuk flow insight sesuai kontrak AI.

Blocker:

- Gateway base URL live dan API key belum tersedia.
- PWA perlu menyimpan field hasil yang diperlukan F04 (`evaluationId`, `resolvedBmi`, `riskScoreCategory`, `riskLevel`, `isHypertensiveCrisis`) tanpa mempercayai browser.
- Write `screening_sessions` saat ini berpotensi ditolak RLS karena tabel hanya memberi client role akses `SELECT`; route juga menelan error persistensi. Ini harus diperbaiki sebelum klaim persistence.

### F02 — `/api/v1/screening/gaps`

Mismatch:

- PWA mempunyai model kartu normalized dan endpoint GET.
- Gateway membutuhkan `patientId`, tanggal evaluasi, optional known-risk profile, dan maksimal 20 screening records.

Keputusan mapping:

- `patientId` berasal dari `auth.getUser().id`, bukan request browser.
- Input disusun server-side dari screening session dan health measurements owner yang tersimpan.
- Enum parameter, gap type, severity, dan recommendation divalidasi Zod lalu dipetakan ke kartu PWA.
- `actionCode` menjadi dedupe/source key untuk F08; pembuatan action item tetap melalui write tervalidasi PWA.

Blocker:

- Tidak ada adapter live F02 saat audit.
- `knownRiskProfile` tidak boleh ditebak dari data yang tidak ada.
- Derived table hanya dapat ditulis melalui backend tervalidasi; strategi write aman masih perlu migration/RPC atau server credential terisolasi.

### F04 — `/api/v1/insights/health`

Mismatch:

- Request PWA sekarang berisi label-ringkas dan session ID.
- Gateway memerlukan fakta hasil screening lengkap: evaluation ID, usia, gender, SBP, BMI resolved, smoker, risk category/level, crisis flag, dan ringkasan gap.
- Response PWA menggunakan lima section generik; Gateway memberi headline, narration, risk drivers, action plan bertipe, preparation note, disclaimer, dan model metadata.

Keputusan mapping:

1. Browser hanya mengirim stable screening session ID/request command.
2. Server memverifikasi Supabase user, mengambil session/gaps owner dari DB, dan memeriksa latest append-only `external_ai` consent.
3. Consent withdrawn atau store error → tidak ada call Gateway pada request berikutnya.
4. Raw Gateway response divalidasi lalu dipetakan ke presentational contract. `mandatoryDisclaimer` selalu dipertahankan; `isFallbackTemplate` disimpan sebagai provenance, bukan disamarkan sebagai live LLM.
5. Hasil tervalidasi disimpan ke `insight_records` dan tampil di Health Timeline hanya sebagai record owner.

Blocker:

- UI F04 belum sepenuhnya memilih screening session nyata.
- Current `insight_records` hanya memberi role authenticated `SELECT`; jalur write trusted backend belum tersedia.
- Gateway health insight hanya menerima usia 40–59 dengan hasil screening WHO. Untuk usia 18–39, PWA tetap menampilkan guidance/gap non-WHO dan tidak memanggil endpoint ini.

### F03 — `/api/v1/biomarkers/ppg/process`

Mismatch:

- PWA capture contract: sampel `{ elapsedMs, redMean }`, duration, observed mean interval.
- Gateway: `{ signal: number[32..100000], samplingRateHz: 10..240 }`.
- PWA output: `ok|poor_signal|unavailable`; Gateway output: `PROCESSED|REJECTED` dengan SQI/IBI internal.

Keputusan mapping:

- `signal = samples.map(redMean)`; `samplingRateHz = 1000 / observedMeanIntervalMs`, divalidasi 10–240.
- `PROCESSED` hanya menjadi `ok` bila BPM valid; SQI dan IBI tidak ditampilkan atau disimpan.
- `REJECTED` menjadi `poor_signal`; `rejectionReason` dipetakan ke pesan aman.
- Raw frame/video tidak dikirim atau disimpan. Raw signal hanya berada di memori selama request dan segera dilepas.
- PWA memanggil AI Gateway server-side, bukan Cloud Run PPG langsung. Gateway health sudah live; proxy PPG masih menunggu konfigurasi internal.

Blocker:

- Gateway PPG proxy kini dapat dijangkau, tetapi mengembalikan `502 ERR_PPG_ENGINE_NOT_CONFIGURED` karena `PPG_ENGINE_BASE_URL` belum diatur pada deployment Gateway.
- Capture browser PWA belum menghasilkan rangkaian sampel production-ready.
- Belum ada migration minimal `ppg_sessions`; hanya derived BPM/quality/time/provenance yang boleh dipertimbangkan untuk penyimpanan dengan consent.

### F07 — `/api/v1/recovery/insight`

Mismatch:

- F07 PWA saat ini dapat membangun tren dari F05 check-in tanpa F03/F06.
- Gateway recovery membutuhkan session duration, completion, dan optional ROM/BPM; juga `prescribedSessionsPerWeek` yang belum memiliki sumber produk yang disetujui.

Keputusan mapping:

- F07 descriptive progress dari Recovery Check-in tetap selalu berfungsi tanpa PPG dan Motion Tracker.
- Missing F03/F06 bukan nol; status aktivitas adalah unavailable/absent.
- Jangan memanggil recovery AI sampai field wajib mempunyai sumber tersimpan dan `prescribedSessionsPerWeek` disetujui. Jangan mengubah F05 menjadi data motion palsu.
- Safety triage PWA tetap berjalan sebelum narasi AI. `SAFETY_PAUSE` dari engine adalah lapisan tambahan, bukan pengganti triage lokal.

Blocker:

- Kontrak Gateway tidak dapat dipenuhi secara jujur dari F05 check-in saja.
- Belum ada consent/persistensi khusus recovery insight yang tervalidasi.

## 5. Database, ownership, dan timeline

- Supabase Auth adalah satu-satunya sumber `user_id`/`patientId` pada PWA.
- Browser tidak boleh memilih owner atau mengirim API key Gateway.
- Derived AI records harus ditulis melalui fungsi backend yang memverifikasi auth, consent, source ownership, response schema, dan idempotency.
- Existing RLS untuk `screening_sessions`, `screening_gaps`, `insight_records`, dan `recovery_activities` sengaja read-only bagi authenticated role. Derived writes sekarang memakai client admin server-only setelah Route Handler memverifikasi auth, consent, source ownership, dan schema respons.
- Timeline aggregator saat audit hanya mencakup measurements dan action items. Tambahkan reference event terstruktur untuk screening/insight/PPG/recovery tanpa menduplikasi raw payload atau PHI yang tidak perlu.
- Jangan menyimpan raw video, raw audio, raw PPG waveform, atau pose landmarks secara default.

## 6. Rencana integrasi incremental

### Tahap A — transport foundation

1. Tambah env server-only `AI_GATEWAY_BASE_URL` dan `AI_GATEWAY_API_KEY`.
2. Buat shared `server-only` HTTP client dengan path allowlist, timeout, `X-API-Key`, request ID, Zod success parsing, dan RFC 7807 parsing.
3. Tambah unit/integration transport tests: success, timeout, 401, 422, 502, invalid JSON/schema, dan redaction.

### Tahap B — F01 gateway mapping

1. Implement schema Gateway screening dan pure request/response mappers.
2. Pertahankan early branch untuk emergency, prior CVD, missing data, serta usia 18–39 tanpa WHO call.
3. Integrasikan adapter pada route F01.
4. Perbaiki persistence agar kegagalan DB tidak dilaporkan sebagai sukses tersimpan.

### Tahap C — F02/F04 linkage dan persistence

1. Load session/measurement owner dari Supabase.
2. Implement gap adapter dan mapping action dedupe.
3. Ubah F04 command menjadi stable source ID; server membangun payload Gateway dari DB.
4. Enforce latest consent, persist insight tervalidasi, dan expose ke timeline.

### Tahap D — F03 PPG

1. Tunggu endpoint AI Gateway live; jangan bypass ke direct public DSP endpoint sebagai arsitektur final.
2. Implement in-memory browser sampler sesuai capture contract yang disepakati.
3. Map signal/result di server; simpan derived result saja setelah consent.
4. Uji HTTPS phone, permission, cancel/unmount, poor signal, timeout, dan reference measurement sebagai prototype non-klinis.

### Tahap E — F07 optional AI

1. Pertahankan F05-only descriptive dashboard sebagai baseline P0.
2. Tambahkan AI recovery narrative hanya jika input session nyata lengkap dan consent aktif.
3. Jangan menjadikan F03/F06 wajib untuk F07.

### Tahap F — acceptance

1. Jalankan lint, typecheck, unit/integration, build, dan browser E2E.
2. Jalankan live endpoint tests tanpa PHI dengan test account/data sintetis.
3. Verifikasi consent withdrawal memblokir request berikutnya.
4. Verifikasi hasil tersimpan setelah refresh/login ulang dan tidak dapat dibaca akun kedua.
5. Baru setelah itu ubah status dari `BLOCKED_EXTERNAL_AI` menjadi terintegrasi.

## 7. Blocker yang perlu AI Engineer/deployment selesaikan

1. Atur `PPG_ENGINE_BASE_URL` pada deployment Gateway ke endpoint PPG internal/private yang benar.
2. Bila Gateway memakai `GATEWAY_API_KEYS`, berikan satu key melalui secret manager Vercel sebagai `AI_GATEWAY_API_KEY`, bukan source/chat/browser.
3. Pastikan runtime Gateway memiliki IAM/network permission untuk memanggil PPG Engine yang privat.
4. Jalankan probe valid PPG lewat Gateway setelah konfigurasi; jangan menguji PPG Engine dari browser.
5. Konfirmasi apakah Gateway memang mengirim `application/problem+json` pada response sukses; source saat audit melakukan itu.
6. Sediakan golden payload/response live tanpa PHI untuk setiap endpoint yang diaktifkan.

## 8. Verdict

**Compatibility:** dapat diintegrasikan melalui adapter tanpa membangun ulang UI atau mengganti Next.js + Supabase.  
**Live integration:** `PARTIALLY_VERIFIED` (`/health` Gateway berhasil; domain AI dan PPG end-to-end belum berhasil).  
**Paling siap:** F01/F02/F04 pada level kontrak dan F07 non-AI descriptive path.  
**Paling terblokir:** F03 live endpoint/capture dan F07 AI input completeness.  
**Safety:** jalur emergency dan usia 18–39 harus tetap diputuskan sebelum AI Gateway.

## 9. Progres implementasi di repository PWA

Status pada 16 Oktober 2026:

- Selesai: transport Gateway server-only dengan path allowlist, timeout, batas response, `X-API-Key`, request ID, Zod strict parsing, dan RFC 7807 parsing.
- Selesai: adapter F01 screening dengan early local branch untuk emergency, prior CVD, data tidak lengkap, dan usia 18–39 tanpa WHO score.
- Selesai: adapter F02 gap berbasis screening milik user yang dimuat ulang dari Supabase.
- Selesai: adapter F04 health insight; browser hanya memilih source ID, sedangkan fakta Gateway dibangun ulang dari record owner di server.
- Selesai: persistence hasil screening/gap/insight melalui backend tervalidasi dan reference event insight pada Health Timeline.
- Selesai: adapter kontrak F03 PPG dari sample merah ke Gateway tanpa mengekspos SQI/IBI dan tanpa menyimpan waveform mentah.
- Selesai: pencabutan consent `external_ai` memblokir request berikutnya secara fail-closed; PPG juga mensyaratkan consent kamera.
- Dipertahankan: F07 tetap berjalan deterministik dari Recovery Check-in ketika PPG dan motion tidak tersedia.
- Belum selesai: capture kamera F03 tetap dinonaktifkan sampai endpoint/contract live lulus uji perangkat.
- Belum diaktifkan: recovery AI karena source wajib dari kontrak Gateway belum tersedia secara jujur dari F05 saja.
- Terverifikasi live: Gateway health mengembalikan HTTP 200. PPG Gateway saat ini mengembalikan HTTP 502 karena `PPG_ENGINE_BASE_URL` belum tersedia pada deployment Gateway.

Tidak ada file pada repository `AI-Neurocare` yang diubah selama pekerjaan ini.
