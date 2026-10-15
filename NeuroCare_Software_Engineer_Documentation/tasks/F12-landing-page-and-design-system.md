# F12 — Landing Page & Design System

## Meta
- **Feature ID:** F12
- **Feature Name:** Landing Page & Design System
- **Area:** Marketing site / shared UI foundation
- **Priority:** P0
- **Owner:** Software Engineer
- **Supporting Docs:**
  - `PROJECT_CONTEXT.md`
  - `AGENTS.md`
  - `DESIGN_SYSTEM.md`

---

## 1. Purpose
This task covers the implementation of the **NeuroCare landing page** and the shared **design system foundation** that will also guide the installed PWA experience.

This is not just a marketing page. It is the public entry point for:
- explaining the product,
- giving judges a high-quality first impression,
- guiding users to try the app or install the PWA,
- visually unifying the public website and the private product experience.

---

## 2. Goals
The landing page must:
1. Clearly explain what NeuroCare is.
2. Show the difference between **NeuroPrevent** and **NeuroRecovery**.
3. Establish visual trust and product clarity.
4. Encourage judges/users to try the app or install the PWA.
5. Provide a reusable UI foundation for the rest of the product.

---

## 3. Scope

## In scope
- Public landing page route `/`
- Shared marketing components
- Shared visual tokens for landing page and PWA
- CTA flow to app/demo/install
- Product explanation sections
- FAQ and footer
- Responsive behavior
- SEO metadata and basic Open Graph setup

## Out of scope
- Actual AI logic
- WHO clinical engine implementation
- Recovery algorithms
- PPG signal processing
- Full CMS or content management

---

## 4. User Stories

### As a judge
I want to understand NeuroCare quickly so that I can immediately see the innovation and relevance to the hackathon theme.

### As a new user
I want to know whether NeuroCare is for prevention or post-stroke recovery so that I can choose the right path.

### As a mobile user
I want a beautiful and clear page that feels installable and easy to access on my phone.

### As the Software Engineer
I want the landing page to establish reusable design patterns so that building the PWA becomes faster and more consistent.

---

## 5. Main Sections to Build

## 5.1 Sticky Header
### Requirements
- Brand/logo: `NeuroCare`
- Nav links: Home, Features, How It Works, NeuroPrevent, NeuroRecovery, FAQ
- CTA buttons:
  - `Try Demo`
  - `Install App` or `Open App`
- Sticky on scroll
- Translucent or subtle blurred background

### Acceptance criteria
- Header is responsive.
- Mobile navigation uses a sheet/drawer.
- CTA remains visible and clear.

---

## 5.2 Hero Section
### Required content
- Main headline
- Supporting paragraph
- Primary CTA
- Secondary CTA
- Trust chips or value highlights
- Product/health image or product mockup visual

### Recommended copy
**Headline:**
`Monitor stroke risk early. Support recovery continuously.`

**Subheadline:**
`NeuroCare is a PWA that helps productive-age users and post-stroke patients stay connected to health screening, AI-guided insight, and recovery follow-up.`

### UI requirements
- Split hero layout on desktop
- Single-column stack on mobile
- At least one supporting image
- At least 2–4 floating or embedded product cards

### Acceptance criteria
- Hero communicates product purpose in under 5 seconds.
- CTAs are visible above the fold.

---

## 5.3 Value Highlights Section
### Goal
Quickly summarize why NeuroCare matters.

### Suggested items
- Early monitoring for stroke-related risk factors
- AI-supported health guidance
- Post-stroke recovery support
- Installable PWA and mobile-first design

### UI requirements
- 3 or 4 cards
- concise copy
- icon support

---

## 5.4 How It Works Section
### Goal
Explain the core workflow simply.

### Suggested steps
1. Choose prevention or recovery path.
2. Complete screening or recovery check-in.
3. Receive AI-supported health insight.
4. Track actions and progress over time.

### UI requirements
- Numbered steps or timeline cards
- concise text
- optional arrows or connectors

---

## 5.5 Feature Showcase Section
### Goal
Introduce the core features.

### Required features to mention
- Smart Stroke Risk Screening
- Screening Gap Intelligence
- AI Personalized Health Insight
- Recovery Assessment & Check-in
- AI Recovery Progress Monitoring
- Health Timeline & Preventive Action Planner
- Optional beta highlights:
  - Camera-Based PPG Monitoring
  - AI Motion Rehabilitation Tracker

### UI requirements
- Card grid or alternating content blocks
- feature title + short description
- status badge for optional beta features if included

---

## 5.6 Dual User Journey Section
### Goal
Make the two paths obvious.

### Required sub-sections
#### NeuroPrevent
- target: productive-age adults with no stroke history
- value: early monitoring, screening gaps, follow-up

#### NeuroRecovery
- target: post-stroke users and caregivers
- value: recovery check-ins, progress monitoring, continuity support

### UI requirements
- two large cards or panels
- distinct visual emphasis while staying stylistically aligned

---

## 5.7 Why Early Monitoring Matters Section
### Goal
Frame the problem and relevance.

### Content guidance
Explain that many users:
- do not routinely measure blood pressure,
- have incomplete health data,
- need simpler digital access,
- may struggle to maintain continuity after stroke.

### Warning
Do not include medical claims or statistics unless reviewed and approved by the team.

---

## 5.8 Product Preview / Dashboard Preview Section
### Goal
Make the product feel real.

### Suggested preview blocks
- Screening result card
- AI Health Insight card
- Action Planner / next steps card
- Recovery session summary card
- Timeline chart card

### UI requirements
- Use product-style cards or mock screenshots
- should look consistent with eventual PWA

---

## 5.9 Install PWA Section
### Goal
Explain the PWA nature clearly.

### Required content
- Can be opened in browser
- Can be installed to home screen
- Designed for easy access on mobile
- Friendly for judges/demo use

### CTA suggestions
- `Install App`
- `Open App`

### UI requirements
- mobile device mockup or install card
- clear visual hierarchy

---

## 5.10 FAQ Section
### Suggested questions
- What is NeuroCare?
- Who is NeuroCare for?
- Is NeuroCare a medical diagnostic tool?
- Can I install it on my phone?
- Does NeuroCare support recovery tracking?
- Does Camera PPG replace medical devices?

### UI requirements
- Accordion interaction
- concise answers

---

## 5.11 Final CTA Section
### Goal
Close the page with a strong call to action.

### Suggested CTA pair
- `Try Demo`
- `Open App`

### Suggested message
`Start with prevention. Continue with support.`

---

## 5.12 Footer
### Requirements
- Brand summary
- nav links
- product links
- optional contact / team links
- prototype / educational disclaimer

---

## 6. Design System Implementation Requirements

## 6.1 Shared visual tokens
The Software Engineer must implement reusable tokens for:
- colors
- spacing
- radius
- shadows
- typography styles
- button variants
- cards
- badges

These tokens must follow `DESIGN_SYSTEM.md`.

## 6.2 Shared component library
Create or prepare reusable components such as:
- `SectionHeader`
- `FeatureCard`
- `MetricCard`
- `JourneyCard`
- `FAQAccordion`
- `InstallPwaCard`
- `PreviewFrame`
- `HeroCTAGroup`

## 6.3 PWA consistency
The landing page should serve as visual foundation for the PWA:
- same fonts
- same color palette
- same card language
- same button hierarchy

---

## 7. Asset Plan

## 7.1 Asset categories needed
- Hero lifestyle / health image
- Telehealth / clinical support image
- Rehabilitation-oriented image if possible
- Product UI preview assets (can be built from app components)
- Soft decorative shapes and cards
- Device mockups

## 7.2 Asset guidance
For the hackathon build:
- Prefer a limited, curated visual set.
- Use high-quality free assets or team-owned visuals.
- Avoid clutter and random stock-photo inconsistency.

## 7.3 Implementation note
Software Engineer should structure assets under:
- `public/images/landing/*`
- `public/images/mockups/*`
- `public/icons/*`

---

## 8. Technical Requirements

## 8.1 Route
- `/` = landing page

## 8.2 Suggested file structure
```text
src/
├── app/
│   └── page.tsx
├── components/
│   ├── marketing/
│   │   ├── site-header.tsx
│   │   ├── hero-section.tsx
│   │   ├── value-highlights.tsx
│   │   ├── how-it-works.tsx
│   │   ├── feature-showcase.tsx
│   │   ├── dual-journey-section.tsx
│   │   ├── why-it-matters-section.tsx
│   │   ├── dashboard-preview-section.tsx
│   │   ├── install-pwa-section.tsx
│   │   ├── faq-section.tsx
│   │   ├── final-cta-section.tsx
│   │   └── site-footer.tsx
│   └── shared/
│       ├── section-header.tsx
│       ├── feature-card.tsx
│       ├── metric-card.tsx
│       └── journey-card.tsx
```

## 8.3 Recommended tools
- Next.js App Router
- Tailwind CSS
- shadcn/ui
- Lucide Icons
- optional Framer Motion (lightweight usage only)

## 8.4 SEO
Include:
- page title
- description
- Open Graph title/description/image placeholder
- proper semantic sections

---

## 9. Responsive Requirements

### Desktop
- editorial, grid-based layout
- split hero
- wide spacing

### Tablet
- simplified grids
- stacked content blocks where needed

### Mobile
- single-column flow where practical
- mobile sheet menu
- touch-friendly CTA buttons
- no text overflow

---

## 10. Accessibility Requirements
- semantic headings in correct order
- sufficient contrast
- alt text on images
- keyboard-accessible navigation
- clear focus states
- accordion accessibility support

---

## 11. Dependencies

### Upstream dependencies
- Base project setup
- Tailwind and shadcn/ui ready
- design tokens / globals available

### Downstream dependencies
This task provides UI foundation for:
- F01 Smart Stroke Risk Screening
- F04 AI Personalized Health Insight
- F05 Recovery Assessment & Check-in
- F08 Health Timeline & Preventive Action Planner

---

## 12. Implementation Checklist

## Foundation
- [ ] Create landing page route `/`
- [ ] Add metadata for landing page
- [ ] Implement shared visual tokens
- [ ] Create core reusable marketing/shared components

## Header and Hero
- [ ] Implement sticky header
- [ ] Implement desktop navigation
- [ ] Implement mobile menu/sheet
- [ ] Implement hero section with CTA
- [ ] Add hero visual composition

## Content Sections
- [ ] Implement value highlights section
- [ ] Implement how-it-works section
- [ ] Implement feature showcase section
- [ ] Implement NeuroPrevent / NeuroRecovery section
- [ ] Implement why early monitoring matters section
- [ ] Implement dashboard preview section
- [ ] Implement install PWA section
- [ ] Implement FAQ section
- [ ] Implement final CTA section
- [ ] Implement footer

## Assets and Styling
- [ ] Add and organize landing page assets
- [ ] Apply consistent palette and spacing
- [ ] Ensure design aligns with `DESIGN_SYSTEM.md`

## Quality
- [ ] Responsive behavior checked on desktop/tablet/mobile
- [ ] Accessibility basics checked
- [ ] Performance/lighthouse pass reviewed
- [ ] All CTA buttons have real or placeholder routes

---

## 13. Testing Scenarios

### Functional
- User can open `/`
- User can navigate sections via header
- User can open mobile menu
- CTA buttons route correctly
- FAQ accordion works

### Visual
- Layout remains clean across breakpoints
- Hero does not break on smaller screens
- Cards and sections preserve spacing consistency

### Accessibility
- Keyboard navigation works in header and FAQ
- Buttons have visible focus states
- Images have alt text

### Performance
- No unnecessarily large images
- Hero section remains performant

---

## 14. Acceptance Criteria
The task is complete when:
1. A complete landing page exists at `/`.
2. It clearly communicates the NeuroCare product.
3. NeuroPrevent and NeuroRecovery are both represented.
4. The page has a premium, health-tech visual style consistent with the provided references.
5. The page is responsive and mobile-friendly.
6. It provides clear CTA paths to demo/app install.
7. Shared design system foundations are established for future PWA work.

---

## 15. Nice-to-Have Enhancements
- small subtle reveal animations
- screenshot carousel or product preview tabs
- mock install prompt visual
- section anchor scrolling
- active nav highlighting

These are optional and must not delay the core page completion.

---

## 16. Notes for AI Coding Agents
- Read `DESIGN_SYSTEM.md` before implementing this task.
- Do not invent medical claims in copy.
- Prioritize clean structure and reusable components.
- Keep the landing page visually strong but implementation-friendly.
- If real assets are not yet available, use clear placeholders with correct structure and alt text.
