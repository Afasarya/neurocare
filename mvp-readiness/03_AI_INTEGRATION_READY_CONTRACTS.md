# AI Integration-Ready Architecture & Contracts

## Goal
Software Engineer completes *all UI, validation, persistence, loading/error states, and transport adapters* before AI Engineer delivers live algorithms. The AI Engineer must only need to implement agreed contracts or provide a compatible URL: **no UI rewrites**.

## 1. Architecture
```
Next.js App Router (UI)
    ↓ validated form / command
Next.js Route Handler (auth, validation, rate limit, security)
    ↓ domain services / repository
Supabase PostgreSQL (RLS, per-user persistence)
    ↓ optional AI request from server only
AI Service Adapter interface
    ├─ FixtureAdapter (synthetic, dev/staging, clearly labeled)
    └─ HttpAdapter (live AI Engineer service; secrets server-only)
```
MediaPipe may execute locally in browser for approved movement tracking. Camera frames and health/audio data must not be uploaded by default. Any third-party AI request requires appropriate disclosure and permission.

## 2. AI vs Software ownership
**Software Engineer:** forms, routing, accessibility, storage, validation, API endpoints, request/response schemas, adapters, timeouts/retries, lifecycle, display, errors, feature flags, tests.
**AI Engineer:** clinical eligibility and WHO lookup logic, risk-factor/gap rules when jointly assigned, structured insights, PPG signal processing, pose landmark/repetition algorithms, clinical/signal fixture cases and validation.
**Shared sign-off:** request schemas, enum sets, accuracy of model labels, unit conventions, safety boundaries, QA examples.

## 3. API envelope standard
Use JSON and Zod strict validation. Recommended shape (agree with AI Engineer before freezing):
```ts
interface ApiEnvelope<T> {
  requestId: string;
  mode: 'live' | 'fixture';
  version: 'v1';
  data: T | null;
  error: { code: string; message: string; retryable: boolean } | null;
}
```
Every fixture must carry `mode: 'fixture'` and show a visible `Data simulasi` tag. The client must never infer correctness merely from HTTP 200; validate result schema.

## 4. Required integrations (initial proposed contracts)
All endpoint names below are **proposals matching prior planning**, not proof these currently exist in the repository.

### A. `POST /api/screening/analyze`
**Request:** age, sex where required by method, prior stroke/TIA/CVD flag, smoking, systolic BP, BMI/height/weight, diabetes/other risk-factor metadata where applicable, country/region, dates and completeness flags. `null` for unknown; do not fabricate.
**Result:**
- `path`: `PREVENT` | `RECOVERY_REDIRECT`
- `method`: `RISK_FACTOR_REVIEW` | `WHO_CVD_NON_LAB` | `NOT_ELIGIBLE`
- `eligibility`: { eligible, reasons[] }
- `cvd10yRisk`: **nullable**, with explicit chart/region/source/version; only if eligible
- `identifiedFactors[]`, `missingChecks[]`, `recommendedNextSteps[]`
- `urgent`: boolean and non-AI triage result
**Guards:** 18–39 no WHO score. Prior CVD/stroke no primary-prevention score. Do not label WHO CVD number as stroke probability.

### B. `POST /api/ai/health-insight`
**Request:** structured, minimized and consented screening result, user language (`id`), context; no unneeded personal identifiers.
**Result:** `summary`, `factors[]`, `explanations[]`, `nextSteps[]`, `limitations[]`, `disclaimer`, `modelVersion`; content is advisory only, cannot override clinical rules.
**Fallback:** deterministic plain-language summary of known findings; label AI unavailable. Do not imitate AI or claim live processing.

### C. `POST /api/ppg/analyze` (P1)
**Request:** time series of red-channel intensity and timestamps, device/sample metadata, signal quality context, consent. Never store raw camera footage by default.
**Result:** `bpm: number | null`, `signalQuality`, `qualityReasons[]`, `durationSeconds`, `methodVersion`; not BP/AF/stroke inference.
**Failure:** unsupported flash/camera, permission refused, quality insufficient; show manual fallback/help.

### D. `POST /api/recovery/activity` (P1)
**Request:** activity ID approved by team, timestamped landmarks or derived rep events and duration, session metadata; prefer on-device pose processing.
**Result:** `repetitionCount`, `durationSeconds`, `signalQuality`, `warnings[]`, `algorithmVersion`.
**Constraint:** no automatic diagnosis or prescription; urgent new symptoms stop exercise.

### E. `POST /api/ai/recovery-insight`
**Request:** verified longitudinal recovery check-in summaries and activity records, explicit dates, no invented clinical scale.
**Result:** `summary`, `observedChanges[]`, `missingFollowups[]`, `limitations[]`, `nextSteps[]`.
**Guard:** Only describe recorded measures; no fabricated improvement, recovery prognosis, diagnosis or normative clinical score.

## 5. Adapters
```ts
interface NeuroCareAiGateway {
  analyzeScreening(input: ScreeningInput): Promise<ScreeningAnalysis>;
  explainHealth(input: HealthInsightInput): Promise<HealthInsight>;
  analyzePpg(input: PpgInput): Promise<PpgAnalysis>;
  analyzeRecovery(input: RecoveryInsightInput): Promise<RecoveryInsight>;
}
```
- `FixtureGateway` consumes deterministic, synthetic fixtures committed alongside tests.
- `HttpGateway` sends validated JSON from **server** to AI Engineer service, with server-only URL and credentials.
- Select via `AI_MODE=fixture|live` on server; default safe failure when misconfigured; never silently switch live to synthetic in production.
- Add request ID, sane timeout, bounded retries only for idempotent calls, error codes, no sensitive payload logs.
- Treat all returned text as untrusted UI data (escape/render as text).

## 6. Persistence ownership
Persist:
- questionnaire responses and method eligibility,
- confirmed deterministic findings,
- optional AI insight with `source_mode`, `model_version`, timestamps,
- recovery check-ins and activity logs,
- action plans and completion timestamps.
Do not persist AI fixture output as if it were a real health measurement. Synthetic demo data must be isolated and clearly labeled; do not contaminate production patient histories.

## 7. Contract test suite
For each endpoint test:
1. Valid minimum request → parseable response matching schema.
2. Missing optional clinical data → no fabricated score; gaps indicated.
3. Invalid units/enum → 400 with human-readable errors.
4. Not logged in → 401 (where authorization required).
5. Another user's ID → 403/404; no disclosure.
6. Slow AI → timeout + retryable error and intact saved form.
7. Invalid AI JSON → safely rejected and fallback text.
8. Live/fixture mode always visible and persisted correctly.
9. No sensitive logging or third-party transfer absent permission.
10. Emergency red flag short-circuits AI analysis.

## 8. Handoff from AI Engineer — minimum checklist
- [ ] Endpoint base URL or in-process module path.
- [ ] Auth method, example environment variable names (never share raw secrets).
- [ ] Versioned JSON schemas + units, enums, required vs optional.
- [ ] 3+ golden request/response pairs for each applicable endpoint.
- [ ] Expected null/unknown behavior.
- [ ] Timeout/performance limits.
- [ ] Known scientific limitations; supported age and population.
- [ ] Error codes and retry guidance.
- [ ] Safety escalation behavior and review agreement.

## 9. Definition of integration-ready
- Feature has UI + persistence + stable validated adapter.
- Fixture path passes E2E tests; visibly marked as simulation.
- Adapter switch requires server configuration only; no UI edits.
- Live integration acceptance test is documented but stays `BLOCKED_EXTERNAL_AI` until actually executed.
