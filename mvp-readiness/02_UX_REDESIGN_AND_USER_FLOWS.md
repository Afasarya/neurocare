# NeuroCare UX Redesign — Guided, Accessible User Journeys

## 1. Design problem and principle
**Hypothesis to verify on the running app:** users may see features as unrelated destinations and lack cues about what to do first, what is required, and what happens next. This must be tested; this document describes the intended improved UX, not a verified diagnosis of the current implementation.

Core experience: **one obvious next action per screen**. The user should always know:
1. **Where am I?** (page title, journey label, progress)
2. **Why is this needed?** (one-sentence purpose)
3. **What do I fill in?** (labels, examples, optional markers)
4. **What happens next?** (primary CTA)
5. **Can I change or revisit?** (Back, Save draft, history)

UI language: Indonesian by default. Avoid medical jargon. Put clinically necessary terms behind a short explanation.

## 2. Navigation / information architecture
**Public:** `/` → `Masuk` / `Daftar` / `Lihat cara kerja`.
**First use:** `/app/welcome` → `/app/consent` → `/app/onboarding/path` → path-specific onboarding → `/app/dashboard`.
**Prevent:** `/app/screening/start` → `/app/screening/questions` → `/app/screening/review` → `/app/screening/result` → `/app/actions`.
**Recovery:** `/app/recovery/start` → `/app/recovery/baseline` → `/app/recovery/check-in` → `/app/recovery/progress` → `/app/actions`.
**Shared:** `/app/history`, `/app/insights`, `/app/profile`, `/app/help`, and accessible urgent guidance.

Routes are a *target blueprint*; adapt to existing routes to avoid unnecessary breaking changes. Redirect old routes if renamed.

## 3. First-time flow
1. Landing clearly distinguishes **Belum pernah stroke — NeuroPrevent** and **Pernah stroke — NeuroRecovery**.
2. Register/login (allow exploration of public landing without login).
3. Consent explains data collected, purpose, optional camera/AI sharing; user can decline optional features without being locked out of core flows. Require appropriate core processing consent or explain alternatives.
4. Short path selection card; allow corrections with confirmation later.
5. Progressive onboarding: basic profile → relevant history → dashboard with first CTA.
6. Dashboard **does not open to an empty collection of charts**; show `Mulai skrining pertama` or `Isi check-in pertama`.

## 4. NeuroPrevent screen sequence (P0)
### P0.1 Welcome / safety check
- Screen title: `Mulai pemantauan kesehatanmu`.
- Before screening, check urgent new neurological symptoms (simple understandable copy). If present, show emergency guidance and halt normal workflow.
- Explain `Ini bukan diagnosis medis` without fear messaging.
### P0.2 Profile basics
- Age/date of birth, sex input if required by chart, prior stroke/TIA/CVD, relevant history.
- Explain why each clinically required item is requested; allow `Tidak tahu` where valid.
- Prior CVD route is distinct; do not run primary prevention WHO chart.
### P0.3 Guided question sections
- Stepper `Langkah 2 dari 4` (not percentage without certainty).
- Group: health background → measurements → lifestyle → review.
- For BP provide example in mmHg and date last measured; avoid requiring values unknown to users.
- Inline validation, short supporting hints, save draft.
### P0.4 Review & submit
- Present editable summary and missing data.
- CTA `Lihat hasil pemantauan`.
### P0.5 Results with age-appropriate branch
- Ages 18–39: `Faktor yang perlu diperhatikan` + `Pemeriksaan yang belum lengkap`; **no % score**.
- Eligible ages 40–59: WHO 10-year **CVD** risk if required inputs complete and criteria confirmed; otherwise no score with gap actions.
- Show AI explanation *as separate layer* labeled `Penjelasan AI`/`Contoh hasil (mode simulasi)` as appropriate.
- CTA `Simpan & lihat langkah berikutnya`.
### P0.6 Action planner
- 1–3 actionable recommendations, each with reason and safe follow-up.
- Record when a suggested check was completed; don't auto-label medical compliance.

## 5. NeuroRecovery sequence (P0)
1. Path selection; communicate intended audience and what it can/cannot do.
2. Safety check for **new sudden symptoms** before rehab activities.
3. Baseline self-report: simple function/limitations (not clinically scored unless valid instrument supported).
4. First check-in with date, activity, symptoms, perceived function.
5. Success screen and progress timeline; for one check-in show a first-record empty-state, not a fabricated trend.
6. Repeat check-in from prominent dashboard CTA.
7. Recovery graph uses *stored longitudinal self-reports*, clear time axis and measure definition.
8. If no camera/motion service, manual activity log remains available.

## 6. Dashboard: next action, not feature warehouse
### Prevent dashboard hierarchy
1. Greeting + path label (`Mode NeuroPrevent`).
2. Contextual primary CTA: `Mulai skrining` / `Lanjutkan skrining` / `Perbarui pemantauan`.
3. `Langkah berikutnya` card (missing BP, plan, follow-ups).
4. Latest screening summary (with timestamp + model label).
5. Recent history, optional modules.
### Recovery dashboard hierarchy
1. Path label (`Mode NeuroRecovery`).
2. Primary CTA `Isi check-in hari ini`.
3. Follow-up and safety notice.
4. Progress card (requires 2+ records; otherwise onboarding empty state).
5. Timeline, optional rehab exercises.

## 7. UI states for EVERY screen
- **First use:** guided illustration + clear CTA.
- **Loading:** skeleton or concise progress message, disable duplicate submissions.
- **Empty:** explain what is missing and how to create first record.
- **Success:** confirm exactly what was saved, with next CTA.
- **Validation:** field-level error and reachable error summary for long forms.
- **Offline:** preserve local non-sensitive draft only when appropriate, no false server-save claim, provide retry.
- **Network error:** `Data belum tersimpan. Periksa koneksi lalu coba lagi.`
- **AI unavailable:** `Analisis AI belum tersedia. Hasil pemeriksaan dan data yang kamu isi tetap bisa dilihat.`
- **Permission denied (camera):** show explicit instructions and alternative flow.
- **Emergency:** urgent guidance, no normal form continuation.

## 8. Microcopy dictionary
| Situation | Recommended Indonesian copy |
|---|---|
| Path choice | `Apa tujuan utama kamu menggunakan NeuroCare?` |
| Prevent path | `Saya ingin memantau faktor risiko sejak dini` |
| Recovery path | `Saya sedang memantau pemulihan pascastroke` |
| Unknown BP | `Belum tahu tekanan darah? Pilih “Belum pernah cek / Tidak tahu”.` |
| Stepper | `Langkah 2 dari 4 — Riwayat kesehatan` |
| Submit | `Simpan dan lihat ringkasan` |
| AI fixture | `Contoh keluaran AI — data simulasi, bukan analisis langsung` |
| AI error | `Penjelasan AI belum dapat ditampilkan. Coba lagi nanti.` |
| No trend | `Belum cukup data untuk menunjukkan perubahan. Isi check-in berikutnya.` |
| Back | `Kembali` |
| Saved | `Berhasil disimpan` |
| Prevent score description | `Estimasi risiko kejadian penyakit kardiovaskular dalam 10 tahun` |
| Help | `Butuh bantuan? Lihat panduan penggunaan` |

## 9. Visual direction
Keep earlier design-system theme (soft green/blue, Geist, rounded cards) but emphasize function over decoration in authenticated app.
- Desktop: sidebar, breadcrumb, progress, clear active route.
- Mobile: bottom navigation for 3–5 primary destinations; secondary features via More; visible Back where appropriate.
- Maintain 44×44 CSS pixel touch targets as a practical target, visible focus rings, sufficient contrast, no color-only status meaning.
- Avoid huge cards with tiny text and scroll fatigue.
- Charts require accessible textual summary and units.
- Respect `prefers-reduced-motion`.
- Use `aria-live` for save/error notifications; avoid auto-dismiss-only warnings.

## 10. Onboarding & help requirements
- First-run one-time walkthrough of **3 screens max** with `Lewati`.
- Contextual inline hints at the moment of need, not a wall of instructions.
- Persistent `Panduan` in user menu; each flow has `Apa itu?` disclosure.
- Provide `Mulai lagi` only with confirmation and draft protection.
- Support `Lihat contoh` using mock values visibly labeled as examples.
- Do not put tutorial overlays over emergency instructions.

## 11. User testing protocol (5 people if possible)
Ask first-time participants to perform without assistance:
A. Register, select Prevent, enter a missing BP, save screening, find action.
B. Select Recovery, submit a check-in, find past history.
C. Find what to do when new stroke-like symptoms occur.
Observe: where they pause >5s, wrong taps, confusing labels, task completion, whether they can explain what the result means. Revise top blockers. Test with one phone and keyboard; if possible an accessibility user.

## 12. UX Definition of Done
- Complete flow shown as ordered steps, with Back and next action.
- No unexplained clinical jargon.
- Clear branch for prevention vs recovery.
- All empty/error/loading/save states implemented.
- No dead CTA.
- Path-aware dashboard.
- Tested on mobile, keyboard, at least three novice tasks; document findings.
