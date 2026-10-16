# NeuroCare PWA environment dan batas deployment AI

Dokumen ini adalah daftar environment yang benar-benar dibaca oleh repository
PWA. Nilai rahasia tidak boleh dimasukkan ke source control, `NEXT_PUBLIC_*`,
atau browser.

## Vercel / PWA

| Variable | Wajib | Nilai / catatan |
|---|---:|---|
| `NEXT_PUBLIC_SITE_URL` | Ya, production | URL deployment PWA, misalnya `https://neurocare.example.com`. Tambahkan URL yang sama pada Supabase Auth redirect URLs. |
| `NEXT_PUBLIC_SUPABASE_URL` | Ya | Project URL Supabase. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Ya* | Key browser Supabase. Gunakan `NEXT_PUBLIC_SUPABASE_ANON_KEY` hanya pada project legacy, bukan keduanya. |
| `SUPABASE_SERVICE_ROLE_KEY` | Ya untuk AI/rules persistence | Hanya Route Handler tervalidasi. Tidak boleh `NEXT_PUBLIC_`. |
| `AI_GATEWAY_BASE_URL` | Ya untuk F01/F02/F03/F04 | `https://ai-neurocare-gateway-727279561989.asia-southeast2.run.app` |
| `AI_GATEWAY_API_KEY` | Tergantung Gateway | Isi bila Gateway memakai `GATEWAY_API_KEYS`. PWA mengirimnya server-to-server sebagai `X-API-Key`; tidak pernah ke browser. |
| `PPG_CAPTURE_CONTRACT_VERSION` | Sebelum F03 diaktifkan | `ppg-camera-v1`. |
| `NEXT_PUBLIC_NEUROCARE_DEMO_MODE` | Tidak | Gunakan `false` pada Preview dan Production. |
| `NEXT_PUBLIC_MEDIAPIPE_WASM_PATH` | Hanya F06 | Asset WASM yang disetujui. |
| `NEXT_PUBLIC_POSE_LANDMARKER_MODEL_PATH` | Hanya F06 | Model pose yang disetujui. |
| `FEATURE_F09_COMMUNICATION_REHAB` | Tidak | Biarkan `false`. |
| `FEATURE_F10_COGNITIVE_ACTIVITIES` | Tidak | Biarkan `false`. |
| `FEATURE_F11_CAREGIVER_REMINDERS` | Tidak | Biarkan `false`. |

`CI` disediakan otomatis oleh CI platform dan bukan secret aplikasi. Empat
`RLS_TEST_USER_*` hanya untuk komputer/CI pengujian dengan `npm run test:rls`;
jangan memasangnya di Vercel.

## AI Gateway, bukan PWA

Variabel berikut tidak boleh ditempatkan di Vercel PWA. Variabel tersebut milik
deployment Gateway atau PPG Engine:

| Variable | Pemilik | Fungsi |
|---|---|---|
| `GATEWAY_PORT` | AI Gateway | Port service Gateway. |
| `GATEWAY_API_KEYS` | AI Gateway | Daftar API key Gateway. Jika diisi, salin salah satu nilainya secara aman ke `AI_GATEWAY_API_KEY` di Vercel. |
| `PPG_ENGINE_BASE_URL` | AI Gateway | URL internal/private PPG Engine. Ini yang belum tersedia pada deployment Gateway saat audit. |
| `LLM_API_BASE_URL` | AI Gateway | Endpoint LLM OpenAI-compatible opsional. |
| `LLM_API_KEY` | AI Gateway | Secret LLM, tidak pernah masuk PWA. |
| `LLM_MODEL` | AI Gateway | Model LLM opsional. Tanpanya Gateway menggunakan fallback deterministik. |

## Status probe 16 Oktober 2026

- `GET /health` pada Gateway: HTTP `200`, body `{"status":"ok","service":"ai-neurocare-gateway"}`.
- `POST /api/v1/screening/evaluate` dengan payload kosong sintetis: HTTP `400 ERR_SCHEMA_VALIDATION_FAILED`, sehingga Gateway dapat dijangkau dan validasi kontrak aktif. Respons bukan `401`, jadi deployment saat audit tidak mewajibkan API key.
- `POST /api/v1/biomarkers/ppg/process` dengan payload sintetis kosong: HTTP `502` dengan `ERR_PPG_ENGINE_NOT_CONFIGURED`.
- URL PPG Engine langsung menghasilkan `403 Forbidden` di browser. Ini wajar untuk service privat; browser PWA tidak perlu dan tidak boleh menjadi pemanggilnya.

Sebelum F03 dinyalakan, AI Engineer perlu mengatur `PPG_ENGINE_BASE_URL` pada
Gateway dan memastikan Gateway memiliki akses IAM/network ke PPG Engine. Setelah
itu, lakukan probe Gateway dengan payload sintetis valid dan API key bila auth
diaktifkan. Jangan membuka PPG Engine ke publik hanya untuk memenuhi PWA.
