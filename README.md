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

The current repository has no committed Supabase migrations, so configuring credentials alone does not make persistence available. Database setup instructions will be added together with reviewed migrations and RLS policies; do not create production tables manually from undocumented snippets.

## Environment variables

Copy names from `.env.example`; never commit `.env.local` or real values.

| Variable | Runtime | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser/server | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser/server | Publishable key; private tables still require restrictive RLS. |
| `SCREENING_ENGINE_URL` | server | Approved F01 clinical/rules service endpoint. |
| `SCREENING_ENGINE_API_KEY` | server | Optional F01 service credential. |
| `AI_SERVICE_URL` | server | Approved F04 structured insight endpoint. |
| `AI_SERVICE_API_KEY` | server | Optional F04 provider credential. |
| `AI_HEALTH_INSIGHT_SCHEMA_VERSION` | server | Must match the approved F04 schema before forwarding. |
| `PPG_ENGINE_URL` | server | P1 PPG processing endpoint. |
| `PPG_ENGINE_API_KEY` | server | Optional PPG service credential. |
| `PPG_CAPTURE_CONTRACT_VERSION` | server | Approved capture contract gate. |
| `NEXT_PUBLIC_MEDIAPIPE_WASM_PATH` | browser | P1 MediaPipe WASM asset location. |
| `NEXT_PUBLIC_POSE_LANDMARKER_MODEL_PATH` | browser | P1 approved model asset location. |
| `FEATURE_F09_COMMUNICATION_REHAB` | server/build | Default-off P2 feature flag. |
| `FEATURE_F10_COGNITIVE_ACTIVITIES` | server/build | Default-off P2 feature flag. |
| `FEATURE_F11_CAREGIVER_REMINDERS` | server/build | Default-off P2 feature flag. |

Provider credentials and service-role keys must never use a `NEXT_PUBLIC_` prefix.

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
