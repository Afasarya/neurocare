# NeuroCare

NeuroCare is a mobile-first health monitoring PWA with two guided pathways:

- **NeuroPrevent** for recording stroke-related risk factors, screening gaps, and follow-up actions.
- **NeuroRecovery** for self-reported post-stroke check-ins, activity records, and descriptive progress.

NeuroCare is an educational and monitoring product. It is not a diagnostic tool, emergency triage device, clinical recovery score, or replacement for a health professional.

## Current readiness

The repository currently contains safe UI foundations, strict contracts, and clearly labeled development fixtures. It is **not yet an end-user-ready MVP**: account onboarding, version-controlled Supabase migrations/RLS, and real P0 persistence remain incomplete.

Read [the actual audit](mvp-readiness/ACTUAL_AUDIT_RESULTS.md) before starting implementation. Do not treat a demo fixture as stored user data or a live AI result.

## Required reading

1. [Repository agent rules](AGENTS.md)
2. [NeuroCare engineering rules](NeuroCare_Software_Engineer_Documentation/AGENTS.md)
3. [Project context](NeuroCare_Software_Engineer_Documentation/PROJECT_CONTEXT.md)
4. [Design system](NeuroCare_Software_Engineer_Documentation/DESIGN_SYSTEM.md)
5. The relevant [feature task](NeuroCare_Software_Engineer_Documentation/tasks)
6. [MVP readiness start page](mvp-readiness/00_START_HERE.md) and the remaining files in `mvp-readiness/`

## Stack

- Next.js 16.4.1 App Router, React 19, TypeScript strict mode
- Tailwind CSS 4, shadcn/Base UI Nova, Lucide, Geist
- Supabase Auth/PostgreSQL through `@supabase/ssr`
- React Hook Form and Zod
- TanStack Query, Zustand, Recharts
- Vitest
- Optional MediaPipe boundary for the P1 motion feature

Next.js 16.4.1 requires Node.js `>=20.9.0`. Use an actively supported Node release and keep one package manager/lockfile workflow (`npm` in this repository).

## Local setup

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

If `npm ci` reports `EPERM` on Windows, first stop any running Next.js process that is locking a native dependency, then retry. Do not delete or reset project data as a workaround.

Apply the committed Supabase migrations in order before testing persistence. Follow [`docs/SUPABASE_MIGRATION_AND_RLS.md`](docs/SUPABASE_MIGRATION_AND_RLS.md); do not create production tables manually from undocumented snippets.

## Environment variables

Copy names from `.env.example`; never commit `.env.local` or real values.

| Variable | Runtime | Required | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | browser/server | Ya, production | URL publik PWA, misalnya `https://neurocare.example.com`; dipakai untuk metadata dan callback URL. |
| `NEXT_PUBLIC_SUPABASE_URL` | browser/server | Ya | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser/server | Ya, kecuali memakai legacy key | Publishable key; private tables tetap dilindungi RLS. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser/server | Legacy alternatif | Gunakan hanya bila project masih memakai anon key; jangan definisikan bersama publishable key. |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Ya untuk persistensi AI/rules | Backend-only key bagi Route Handler tervalidasi untuk menulis record derived. Jangan pernah memakai prefix `NEXT_PUBLIC_`. |
| `AI_GATEWAY_BASE_URL` | server | Ya untuk fitur AI | Base URL Gateway, saat ini `https://ai-neurocare-gateway-727279561989.asia-southeast2.run.app`. PWA tidak memanggil PPG Engine langsung. |
| `AI_GATEWAY_API_KEY` | server | Bila Gateway memakai `GATEWAY_API_KEYS` | Credential yang dikirim server lewat `X-API-Key`. Boleh kosong hanya jika Gateway sengaja tanpa API-key auth. |
| `PPG_CAPTURE_CONTRACT_VERSION` | server | Ya sebelum F03 diaktifkan | Nilai kontrak PWA yang disetujui, saat ini `ppg-camera-v1`. |
| `NEXT_PUBLIC_NEUROCARE_DEMO_MODE` | browser/server | Tidak | `false` untuk preview/production. `true` hanya fixture sintetis lokal. |
| `NEXT_PUBLIC_MEDIAPIPE_WASM_PATH` | browser | Hanya F06 | Lokasi asset WASM MediaPipe yang telah disetujui. |
| `NEXT_PUBLIC_POSE_LANDMARKER_MODEL_PATH` | browser | Hanya F06 | Lokasi model pose yang telah disetujui. |
| `FEATURE_F09_COMMUNICATION_REHAB` | server/build | Tidak | Tetap `false` sampai review P2 selesai. |
| `FEATURE_F10_COGNITIVE_ACTIVITIES` | server/build | Tidak | Tetap `false` sampai review P2 selesai. |
| `FEATURE_F11_CAREGIVER_REMINDERS` | server/build | Tidak | Tetap `false` sampai review P2 selesai. |
| `RLS_TEST_USER_A_EMAIL`, `RLS_TEST_USER_A_PASSWORD`, `RLS_TEST_USER_B_EMAIL`, `RLS_TEST_USER_B_PASSWORD` | test-only | Hanya `npm run test:rls` | Dua akun uji Supabase; jangan ditaruh di Vercel. |

Provider credentials and service-role keys must never use a `NEXT_PUBLIC_` prefix.

Konfigurasi di atas hanya untuk PWA. `PPG_ENGINE_BASE_URL`, `GATEWAY_API_KEYS`, dan konfigurasi LLM merupakan environment milik deployment **AI Gateway**, bukan Vercel PWA. Rincian pemisahan dan diagnosis integrasi ada di [`docs/ai-integration/AI_PWA_ENVIRONMENT.md`](docs/ai-integration/AI_PWA_ENVIRONMENT.md).

## Fixture and live behavior

- Development screens currently use explicit synthetic fixture headers for unfinished integrations and display `Data demo (simulasi)`.
- Production routes do not silently fall back to fixtures. They require a verified Supabase user and either call the configured, schema-gated service or return a typed `unavailable` state.
- A fixture must never be stored as a real patient measurement, risk result, check-in, or activity.
- F09-F11 remain disabled P2 prototypes unless their review, privacy, schema, and RLS gates are explicitly completed.

The target integration architecture is UI -> authenticated Next.js Route Handler -> validated repository/service -> Supabase or a server-only AI adapter. AI providers must not require UI changes when replacing a fixture adapter.

## Project structure

```text
src/app/                 App Router pages and Route Handlers
src/features/            Feature UI, contracts, adapters, fixtures, and tests
src/components/          Shared UI, providers, and marketing components
src/lib/supabase/        Cookie-aware Supabase helpers
public/                  Icons and landing assets
NeuroCare_Software_Engineer_Documentation/
                         Canonical product/design/feature specifications
mvp-readiness/           Audit, target UX, AI contracts, backlog, playbook
```

## Verification

Run all available gates before reporting a stage complete:

```bash
npm run lint
npx tsc --noEmit
npm test -- --run
npm run build
npx playwright install chromium # one-time on a new machine
npm run test:e2e              # runs against the production build
```

The public/auth smoke suite runs on desktop and mobile Chromium. It does not yet prove authenticated persistence, session expiry, RLS isolation, full mobile accessibility, or live AI correctness. Those require dedicated integration/E2E evidence and two independent Supabase identities.

## Security and data rules

- Derive ownership from the verified server session, never a browser `userId`.
- Add each private table and its RLS policies in the same migration.
- Keep PHI out of local/session storage, persisted Zustand, logs, analytics, and PWA caches.
- Private APIs use `Cache-Control: private, no-store`; an eventual service worker must exclude auth, private pages, and `/api` health responses.
- Never invent WHO risk, BPM, diagnosis, recovery grade, exercise prescription, or successful persistence.
- Emergency guidance must short-circuit routine AI and rehabilitation flows.

## Deployment

The intended application host is Vercel with Supabase hosted separately. Deployment is blocked until migrations/RLS, authentication, environment configuration, P0 E2E journeys, and release gates in `mvp-readiness/04_MVP_IMPLEMENTATION_BACKLOG.md` have verified evidence.
