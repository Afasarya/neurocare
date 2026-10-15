# NeuroCare Design System

## Document Purpose
This document defines the visual and interaction system for **NeuroCare**, covering:
- the **public landing page**,
- the **installed PWA experience**,
- shared visual tokens,
- reusable UI patterns,
- asset direction,
- implementation guidance for the Software Engineer.

This document is intended for the **Software Engineer** and any AI coding agent working on the frontend. It should be read together with:
- `PROJECT_CONTEXT.md`
- `AGENTS.md`
- `tasks/F12-landing-page-and-design-system.md`

---

## 1. Design Goals

NeuroCare must feel:
1. **Medical but approachable** — trustworthy without feeling cold or overly clinical.
2. **Modern and premium** — clean editorial layout, large typography, calm whitespace.
3. **Accessible and mobile-first** — especially important for health screening and post-stroke monitoring.
4. **Action-oriented** — users should clearly understand what to do next.
5. **Consistent across Landing Page and PWA** — the marketing site and product must feel like one product.

---

## 2. Reference Interpretation

The provided references suggest the following visual direction:

### Observed patterns from references
- Large, clean **hero layouts**.
- Spacious **editorial typography** with strong headings.
- Soft, premium **health-tech palette** using:
  - muted off-white,
  - soft blue,
  - pale green,
  - charcoal text,
  - subtle gray surfaces.
- Rounded cards with gentle shadows and clean borders.
- Visual storytelling with **people-centric health imagery**.
- Modular grid sections for statistics, benefits, features, and product explanation.
- Calm but premium feel, not flashy startup style.
- Desktop-to-mobile layouts that simplify cleanly.

### NeuroCare interpretation
NeuroCare should borrow this **design language**, but its messaging must focus on:
- early stroke risk monitoring,
- health check awareness,
- post-stroke recovery support,
- AI-assisted health insights,
- PWA accessibility.

The UI should feel closer to **health platform / wellness SaaS / digital care product**, not hospital admin software.

---

## 3. Product Tone

### Brand personality
- Caring
- Clear
- Intelligent
- Reassuring
- Calm
- Practical

### Voice in UI copy
Use language that is:
- simple,
- confident,
- non-alarmist,
- benefit-first,
- understandable for Indonesian users.

### Copy style examples
Good:
- “Monitor your stroke risk early.”
- “Track health checks and recovery in one place.”
- “Built for prevention, guidance, and continuity of care.”

Avoid:
- “We diagnose stroke using AI.”
- “Guaranteed prevention.”
- “Clinical claims beyond the implemented system.”

---

## 4. Product Positioning

### Core Positioning
**NeuroCare** is a **PWA health platform** that helps users:
- monitor stroke-related risk factors early,
- identify missing health checks,
- receive AI-supported health explanations,
- track post-stroke recovery and follow-up.

### Two major user paths
1. **NeuroPrevent** — for users who have not had stroke.
2. **NeuroRecovery** — for users in post-stroke follow-up and rehabilitation monitoring.

The landing page and PWA should both clearly communicate these two paths.

---

## 5. Information Architecture

## 5.1 Landing Page Structure
Recommended route: `/`

### Required sections
1. **Top Navigation**
2. **Hero Section**
3. **Trust / Value Highlights**
4. **How NeuroCare Works**
5. **Feature Showcase**
6. **Two User Journeys: NeuroPrevent & NeuroRecovery**
7. **Why Early Monitoring Matters**
8. **Dashboard / Product Preview Section**
9. **PWA / Install App Section**
10. **FAQ Section**
11. **Final CTA Section**
12. **Footer**

## 5.2 PWA Structure
Recommended route root: `/app`

### Major PWA areas
- `/app/dashboard`
- `/app/screening`
- `/app/health-insight`
- `/app/pulse-monitor`
- `/app/recovery`
- `/app/monitoring`
- `/app/profile`

The PWA should visually feel like an extension of the landing page.

---

## 6. Visual Design Tokens

## 6.1 Color Palette
These are recommended starting values. The Software Engineer may refine them while preserving the overall feel.

### Core colors
- **Background / canvas**: `#F8F8F2`
- **Surface white**: `#FFFFFF`
- **Primary text**: `#1F2A2A`
- **Secondary text**: `#5F6B6B`
- **Border / divider**: `#E5E8E5`

### Brand / accent colors
- **NeuroCare green**: `#DCECC3`
- **NeuroCare blue**: `#D8E6F5`
- **Deep slate**: `#243746`
- **Muted olive accent**: `#C7DB9A`
- **Soft success green**: `#DFF3E3`
- **Soft warning amber**: `#F7E8C6`
- **Soft danger pink-red**: `#F8D7DA`

### CTA colors
- **Primary CTA background**: `#111827`
- **Primary CTA text**: `#FFFFFF`
- **Secondary CTA background**: `#DCECC3`
- **Secondary CTA text**: `#1F2A2A`

### State colors
- Success: `#2E7D32`
- Warning: `#B7791F`
- Error: `#C53030`
- Info: `#2B6CB0`

## 6.2 Recommended usage
- Landing page background uses off-white.
- Some feature and statistic sections may use pale green or soft blue blocks.
- PWA should use mostly white + soft backgrounds for readability.
- Avoid overly saturated neon colors.

---

## 7. Typography

## Primary font
Use **Geist Sans** as the main font.

## Secondary / optional
Use **Geist Mono** sparingly for data chips, metrics, timestamps, or technical values.

## Suggested type scale
### Desktop
- Hero XL: `text-6xl` / `text-7xl`
- Section heading: `text-4xl` / `text-5xl`
- Card title: `text-2xl`
- Body large: `text-lg`
- Body default: `text-base`
- Small helper: `text-sm`
- Caption: `text-xs`

### Mobile
- Hero: `text-4xl` / `text-5xl`
- Section heading: `text-3xl`
- Card title: `text-xl`
- Body: `text-base`

## Typography style rules
- Use bold typography sparingly but intentionally.
- Prefer clean line breaks.
- Use generous line-height in body copy.
- Keep section descriptions short and readable.

---

## 8. Layout System

## Max width
- Main container: `max-w-7xl`
- Reading container for text-heavy blocks: `max-w-3xl` or `max-w-4xl`

## Spacing system
Use Tailwind spacing consistently.
- Vertical section spacing: `py-16`, `py-20`, `py-24`
- Card gap desktop: `gap-6`, `gap-8`
- Internal card padding: `p-6`, `p-8`

## Radius
- Main cards: `rounded-3xl`
- Buttons / pills: `rounded-full`
- Smaller controls: `rounded-2xl`

## Shadow
Keep shadows subtle:
- `shadow-sm`
- `shadow-md` only for emphasis

## Border style
Use very soft borders for premium health-tech look.
- `border border-black/5` or `border border-slate-200`

---

## 9. Component System

### Shared components required
- `SectionHeader`
- `HeroCTAGroup`
- `FeatureCard`
- `MetricCard`
- `JourneyCard`
- `FAQAccordion`
- `InstallPwaCard`
- `PreviewFrame`
- `AppSidebar`
- `EmptyState`
- `StatusBadge`
- `ActionCard`
- `HealthMetricChip`

### Component behavior principles
- Components must be responsive.
- Components should be reusable between landing and PWA when possible.
- Components should support loading, empty, and error states.

---

## 10. Landing Page Section Design Guidance

## 10.1 Header / Navigation
### Desktop
- Left: NeuroCare wordmark/logo.
- Center or right-aligned nav links.
- Right: CTA buttons.

### Suggested nav items
- Home
- Features
- How it Works
- NeuroPrevent
- NeuroRecovery
- FAQ

### CTA buttons
- `Try Demo`
- `Install App` or `Open App`

### Sticky behavior
Use sticky header with subtle blur and translucent background.

---

## 10.2 Hero Section
### Objective
Instantly communicate what NeuroCare is.

### Content recommendation
**Headline:**
`Monitor stroke risk early. Support recovery continuously.`

**Subheadline:**
`NeuroCare helps users track stroke-related risk factors, identify missing health checks, receive AI-guided health insight, and support post-stroke follow-up in one accessible PWA.`

### CTAs
- Primary: `Try Demo`
- Secondary: `Install PWA`

### Visual composition
Use split layout:
- Left: text + CTA + mini social proof / trust chips
- Right: product mockup + soft overlapping UI cards + supportive health image

### Recommended micro-cards in hero visual
- “AI Health Insight”
- “Screening Gaps Detected”
- “Recovery Check-in Complete”
- “Installable PWA”

---

## 10.3 Trust / Value Highlights
Use 3–4 compact cards:
- Early monitoring for productive-age adults
- AI-guided health explanation
- Recovery and follow-up support
- Installable PWA, mobile-friendly

---

## 10.4 How NeuroCare Works
Present in 3 or 4 steps:
1. Complete screening or recovery onboarding.
2. Track health checks and follow-up.
3. Receive AI-supported insight and next actions.
4. Continue monitoring over time.

Use timeline cards or icon cards.

---

## 10.5 Feature Showcase
Show the main product features:
- Smart Stroke Risk Screening
- Screening Gap Intelligence
- AI Personalized Health Insight
- Recovery Check-in
- Health Timeline & Action Planner
- Camera PPG (beta / optional)
- Motion Rehabilitation Tracker (beta / optional)

Use card grid or editorial alternating sections.

---

## 10.6 Dual User Journey Section
This section is important.

### Card 1 — NeuroPrevent
For users without stroke history.
- Stroke risk screening
- Missing health check detection
- Follow-up actions
- Monitoring dashboard

### Card 2 — NeuroRecovery
For post-stroke users.
- Recovery check-ins
- Progress summaries
- Recovery follow-up
- Activity tracking

Use two side-by-side large cards.

---

## 10.7 Why Early Monitoring Matters
This section explains the problem simply.
Possible blocks:
- many users do not routinely measure blood pressure,
- health checks are often incomplete,
- recovery continuity is difficult,
- digital access should be easier.

Do not include unverifiable statistics unless properly sourced and reviewed.

---

## 10.8 Dashboard Preview Section
Use stylized app screenshots / mock components.
Suggested previews:
- screening result card,
- action planner card,
- recovery session summary,
- metric timeline chart.

---

## 10.9 PWA Section
Explain:
- installable on phone,
- works like an app,
- easier access for users and judges.

Include a visual card with:
- Add to Home Screen messaging,
- platform badge,
- phone mockup.

---

## 10.10 FAQ
Suggested questions:
- What is NeuroCare?
- Is NeuroCare a medical diagnostic tool?
- Who is it for?
- Can it be installed on mobile?
- Does it support post-stroke recovery tracking?
- Does Camera PPG replace medical devices?

---

## 10.11 Footer
Include:
- Product summary
- navigation links
- legal / disclaimer note
- hackathon / educational prototype note

---

## 11. PWA Design System Guidance

## 11.1 General PWA feel
- More functional and data-focused than landing page.
- Keep the same color language.
- Use soft cards, clear hierarchy, and compact navigation.
- Keep forms highly readable.

## 11.2 Navigation
### Desktop
- Sidebar navigation
### Mobile
- Bottom navigation or compact top navigation + sheet menu

### Required navigation items
- Dashboard
- Screening
- Recovery
- Monitoring
- Health Insight
- Profile

## 11.3 PWA surface patterns
Use consistent cards for:
- summary metrics,
- alerts,
- tasks,
- timelines,
- AI explanations,
- status summaries.

## 11.4 Data visualization
Use simple chart style:
- minimal grid lines,
- soft palette,
- no heavy visual clutter.

## 11.5 Form style
- large touch targets,
- clear labels,
- supportive helper text,
- section grouping.

## 11.6 Accessibility
- minimum readable contrast,
- keyboard support,
- visible focus states,
- descriptive labels.

---

## 12. Asset Direction

## 12.1 Asset categories needed
1. **Landing hero image**
2. **Supportive health lifestyle images**
3. **Clinical / telehealth style images**
4. **Dashboard mockup illustrations**
5. **Soft abstract decorative elements**
6. **Device frame mockups**
7. **Iconography**

## 12.2 Asset style
- calm, bright, human-centric photography
- doctors, telehealth, everyday adults, rehabilitation contexts
- modern product UI compositions
- minimal abstract line decorations, soft charts, subtle circles, pill tags

## 12.3 Recommended usage approach
For hackathon speed:
- Use free, license-safe images from approved sources chosen by the team.
- Prefer a **small asset set reused consistently**.
- Do not clutter sections with unrelated stock images.
- Use custom UI screenshots / mock cards for product sections.

## 12.4 Decorative motifs
Inspired by references, acceptable motifs include:
- pale concentric circles,
- floating pills and chips,
- small graph snippets,
- soft highlight blocks,
- rounded photo cards.

Avoid excessive gradients, glassmorphism overload, or generic crypto-style abstract blobs.

---

## 13. Motion and Interaction

## Recommended motion level
Subtle only.

### Good interactions
- hover lift on cards,
- soft fade / slide reveals,
- sticky nav transitions,
- tab / accordion transitions,
- loading skeletons.

### Avoid
- excessive parallax,
- autoplay distracting effects,
- heavy animations that hurt performance.

Use Framer Motion only if necessary and lightweight.

---

## 14. Suggested Copy Blocks

## Hero copy example
**Headline**
Monitor stroke risk early. Support recovery continuously.

**Body**
NeuroCare helps productive-age users and post-stroke patients stay connected to screening, follow-up, and health insight through one accessible digital experience.

## Section labels
- Early monitoring
- Health insight
- Recovery support
- Installable PWA
- Product preview
- Frequently asked questions

## CTA labels
- Try Demo
- Open App
- Install PWA
- See Features
- Start Screening
- Explore Recovery

---

## 15. Implementation Recommendations for Software Engineer

### Core frontend stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide icons
- Recharts
- TanStack Query
- Zustand

### Useful structure
- `src/components/marketing/*`
- `src/components/shared/*`
- `src/components/dashboard/*`
- `src/features/landing/*`
- `src/features/pwa/*`

### Suggested landing page sections as components
- `site-header.tsx`
- `hero-section.tsx`
- `value-highlights.tsx`
- `how-it-works.tsx`
- `feature-showcase.tsx`
- `dual-journey-section.tsx`
- `dashboard-preview.tsx`
- `install-pwa-section.tsx`
- `faq-section.tsx`
- `site-footer.tsx`

---

## 16. Non-Functional Design Requirements

The design system must support:
- responsive layouts from mobile to desktop,
- good Lighthouse scores,
- accessible components,
- clean semantic HTML,
- SEO-friendly landing page structure,
- visual consistency between landing page and app.

---

## 17. Design Boundaries

### Must do
- Keep trust and clarity above novelty.
- Preserve a premium but calm visual language.
- Make CTA hierarchy obvious.
- Reflect both prevention and recovery.

### Must not do
- Make exaggerated medical claims.
- Overload the landing page with too much text.
- Use many unrelated accent colors.
- Make the PWA look visually disconnected from the landing page.

---

## 18. Definition of Done for Design System Adoption

The design system is considered adopted when:
- the landing page visually matches the intended NeuroCare direction,
- the PWA shares the same palette, typography, spacing, and card language,
- all major UI surfaces use consistent visual tokens,
- reusable components are extracted,
- responsive behavior is implemented,
- accessibility basics are met,
- product messaging clearly explains both NeuroPrevent and NeuroRecovery.
