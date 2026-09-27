# JADARA Design System — v1 (MVP, Implementation-Ready)

Stack assumed: React + Vite + Tailwind CSS + Lucide Icons. RTL (Arabic default) + LTR (English/French). Brand color fixed: `#4D1B65`.

Every section below is scoped to what JADARA's 26 pages and 4 roles actually need. Anything not needed for MVP is explicitly marked **[Future Version]** instead of being designed — this keeps the system usable today instead of theoretical.

---

## 1. Design Principles (practical, not philosophical)

- **Dashboard-first, not marketing-first.** ~90% of screens are tables, forms, cards, and stat widgets. Optimize the system for density and scanability, not hero sections.
- **One brand color, used sparingly.** Purple = action and identity (primary buttons, active nav, links, focus). Everything else (backgrounds, borders, body text) is neutral. If more than ~15% of a screen is purple, that's a bug, not a style choice.
- **Every token has one job.** No component invents its own color/spacing — it pulls from the token list below. This is what makes 3 developers produce a consistent UI without a designer reviewing every PR.
- **RTL is not an afterthought.** Every spacing/icon/border rule below is written in logical properties (`start`/`end`) specifically so Arabic doesn't break layout later.

---

## 2. Color System

### 2.1 Primary scale (source of truth — do not regenerate, already approved)

```
--purple-50:  #F9F3FC
--purple-100: #F1E3F7
--purple-200: #E2C9EE
--purple-300: #CDA3E0
--purple-400: #B573D3
--purple-500: #9939C6
--purple-600: #752999
--purple-700: #4D1B65   /* brand base */
--purple-800: #381249
--purple-900: #260C32
--purple-950: #190722
```

**Why a scale, not one color**: buttons need a hover state, dark mode needs a different "primary" weight than light mode, disabled states need a washed-out version. One hex code can't do all of that — a scale can.

### 2.2 Neutral scale (new — needed because "avoid an all-purple UI" requires real neutrals)

```
--neutral-0:   #FFFFFF
--neutral-50:  #FAF9FB
--neutral-100: #F3F1F5
--neutral-200: #E5DCEB
--neutral-300: #D3C9DB
--neutral-400: #A99FB0
--neutral-500: #8B7F97
--neutral-600: #5B4F68
--neutral-700: #3D3348
--neutral-800: #211A2B
--neutral-900: #160F1E
```

These are gray tinted very slightly toward purple's hue (not pure gray) so the neutrals don't visually fight the brand color — same reasoning as the earlier palette.

### 2.3 Semantic tokens (what components actually reference — never raw hex)

| Token                | Light         | Dark         | Used for                                |
| -------------------- | ------------- | ------------ | --------------------------------------- |
| `--bg-page`          | `neutral-50`  | `purple-950` | page background                         |
| `--bg-surface`       | `neutral-0`   | `purple-900` | cards, tables, modals                   |
| `--bg-surface-hover` | `neutral-100` | `purple-800` | row/card hover                          |
| `--border`           | `neutral-200` | `#3D2A4A`    | dividers, card borders                  |
| `--text-primary`     | `neutral-800` | `#F3EEF7`    | headings, body                          |
| `--text-secondary`   | `neutral-600` | `#C7B9D1`    | descriptions                            |
| `--text-muted`       | `neutral-500` | `#9483A3`    | timestamps, placeholders                |
| `--brand`            | `purple-700`  | `purple-400` | primary buttons, active states, links   |
| `--brand-hover`      | `purple-600`  | `purple-300` | hover of the above                      |
| `--brand-fg`         | `#FFFFFF`     | `purple-900` | text/icon color **on top of** `--brand` |
| `--focus-ring`       | `purple-500`  | `purple-400` | all focusable elements                  |

**Why `--brand-fg` exists as its own token**: in dark mode the primary button uses a _light_ purple (400), so white text on it would fail contrast — it needs dark text instead. Hardcoding "white text on primary button" is the #1 bug we already found in this project. This token prevents that class of bug permanently.

### 2.4 Status tokens (already approved — reused as-is)

| Status                            | Light bg / fg                 | Dark bg / fg                 |
| --------------------------------- | ----------------------------- | ---------------------------- |
| Success (Verified)                | `#E6F7EF` / `#1B8A5A`         | `#123D2B` / `#4ADE94`        |
| Warning (Pending/In Review)       | `#FDF1DC` / `#B45309`         | `#3D2A0A` / `#F5A742`        |
| Error (Rejected)                  | `#FBE7EC` / `#C0284F`         | `#3D0F1C` / `#F0648C`        |
| Info                              | `#E8ECFB` / `#3A4FC4`         | `#161C3D` / `#8B9CF0`        |
| Neutral (Draft/Disabled/Archived) | `neutral-100` / `neutral-600` | `purple-800` / `neutral-400` |

### 2.5 Naming convention

`--{category}-{role}[-{state}]` → e.g. `--bg-surface-hover`, `--text-muted`, `--brand-fg`. Never name a token after its literal color (`--purple-button`) — name it after its **role**, so the same name still makes sense if the hex value changes later.

### 2.6 Tailwind implementation

```js
// tailwind.config.js
export default {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F9F3FC",
          100: "#F1E3F7",
          200: "#E2C9EE",
          300: "#CDA3E0",
          400: "#B573D3",
          500: "#9939C6",
          600: "#752999",
          700: "#4D1B65",
          800: "#381249",
          900: "#260C32",
          950: "#190722",
        },
        bg: {
          page: "var(--bg-page)",
          surface: "var(--bg-surface)",
          hover: "var(--bg-surface-hover)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        border: { DEFAULT: "var(--border)" },
        status: {
          success: "var(--status-success-fg)",
          warning: "var(--status-warning-fg)",
          error: "var(--status-error-fg)",
          info: "var(--status-info-fg)",
        },
      },
    },
  },
};
```

Usage in components: `bg-bg-surface text-text-primary border-border`, never `bg-purple-700` directly in a page component — only inside the 2–3 core components (Button, Badge) that own the mapping.

---

## 3. Typography

| Role                       | Font                         | Size   | Weight    | Line-height |
| -------------------------- | ---------------------------- | ------ | --------- | ----------- |
| Display / Hero H1          | Lama Sans                    | 40px   | 700 / 800 | 1.15        |
| H1 (page titles)           | Lama Sans                    | 28px   | 700       | 1.25        |
| H2 (section titles)        | Lama Sans                    | 22px   | 600       | 1.3         |
| H3 (card titles)           | Lama Sans                    | 17px   | 600       | 1.4         |
| Body                       | Inter / IBM Plex Sans Arabic | 15px   | 400       | 1.6         |
| Body small / caption       | Inter / IBM Plex Sans Arabic | 13px   | 400       | 1.5         |
| Label (form/table headers) | Inter / IBM Plex Sans Arabic | 12.5px | 600       | 1.4         |
| Button text                | Inter / IBM Plex Sans Arabic | 14px   | 600       | 1           |

**Why Lama Sans for display headings**: Lama Sans (by Baianat Type Design) natively supports both Arabic and Latin scripts with matching weights and proportions, providing visual consistency across Arabic, English, and French display headings.

**[Future Version]**: monospace font for code/IDs — not needed until an API-keys or developer-facing screen exists.

---

## 4. Spacing

4px base unit. Scale: `1=4px 2=8px 3=12px 4=16px 5=20px 6=24px 8=32px 10=40px 12=48px 16=64px`.

- Card padding: `20px` (5)
- Section vertical gap: `48–64px` (12/16) on marketing pages, `24px` (6) between dashboard widgets
- Table cell padding: `12px 16px`
- Form field gap: `16px` (4)

Use Tailwind's default spacing scale directly (`p-5`, `gap-6`) — no custom spacing scale needed, the default 4px-based scale already matches this.

---

## 5. Radius

| Token         | Value | Used for                      |
| ------------- | ----- | ----------------------------- |
| `radius-sm`   | 6px   | inputs, badges, small buttons |
| `radius-md`   | 10px  | buttons, form fields          |
| `radius-lg`   | 14px  | cards                         |
| `radius-xl`   | 20px  | modals                        |
| `radius-full` | 999px | avatars, status pills         |

---

## 6. Shadows (light mode only — dark mode uses borders instead, see below)

```
--shadow-sm: 0 1px 2px rgba(38,12,50,0.06)
--shadow-md: 0 4px 12px rgba(38,12,50,0.08)
--shadow-lg: 0 12px 32px rgba(38,12,50,0.12)   /* modals, dropdowns */
```

**Why dark mode doesn't use shadows**: shadows are nearly invisible on dark backgrounds and just look like muddy patches. Standard practice (used by Linear/GitHub dark themes too): in dark mode, elevation is communicated by a **lighter surface color + a 1px border** instead of a shadow. Don't try to port light-mode shadows to dark mode — swap the mechanism.

---

## 7. Iconography

**Library: Lucide** (already in use per the codebase audit — keep it, don't introduce a second icon set).

- Stroke width: `1.75` (default) for a clean, non-heavy dashboard feel
- Size scale: `16px` (inline with text/labels), `20px` (buttons, nav items), `24px` (empty states, page headers)
- Status icons map 1:1 to status tokens: `CheckCircle2` (success), `Clock` (pending), `XCircle` (error), `Info` (info)
- RTL rule: only **directional** icons (arrows, chevrons pointing left/right) must flip in RTL. Icons like a shield, a badge, a document, a bell must **not** flip. Flipping a document icon is a common and easy-to-miss bug — flag it explicitly to whoever wires up RTL.

---

## 8. Status System

| Status              | Token             | Where it appears                      |
| ------------------- | ----------------- | ------------------------------------- |
| Draft               | Neutral           | Skill/document not yet submitted      |
| Pending / In Review | Warning           | Document or skill awaiting reviewer   |
| Verified            | Success           | Skill badge issued, document approved |
| Rejected            | Error             | Reviewer declined, with a note        |
| Active / Inactive   | Success / Neutral | User accounts (admin)                 |

**[Future Version]**: `Archived`, `Suspended`, `Expired` — not part of any of the 26 MVP pages today. Don't design tokens for statuses no screen produces yet.

---

## 9. Component Library (only what JADARA's actual pages use)

For each: purpose, variants/states, and the one implementation rule that matters most. Full accessibility/keyboard behavior is inherited from shadcn/Radix primitives already in the project — only JADARA-specific rules are called out.

### Button

- Variants: `primary` (brand bg), `outline` (brand border, transparent bg), `ghost` (no border/bg, hover only), `destructive` (error color, for reject/delete actions only)
- States: default, hover, focus-visible (ring), disabled, loading (spinner replaces label, width doesn't jump)
- Rule: `destructive` variant is reserved for irreversible or reviewer-reject actions only — don't use error-red for anything else, or it loses meaning.

### Input / Textarea / Select

- States: default, focus (ring), error (border + helper text in error color), disabled
- Rule: error message appears **below** the field, same text size as helper text, never as a tooltip (tooltips are missed in fast form-filling).

### StatusBadge

- One component, driven entirely by the status token table above — never a one-off colored `<span>` in a page file. This is the #1 consistency rule from the earlier code audit.

### FileUpload / Evidence attach

- States: empty (dropzone), uploading (progress), uploaded (filename + remove), error (file too large/wrong type)
- Rule: this component must expose an `onAttachToSkill(skillId)` callback — this is the actual fix for the Skill↔Evidence gap identified earlier, not just a visual button.

### DataTable

- Features: sort, filter (client-side only for MVP), pagination, row status badge, empty state, loading skeleton state
- **[Future Version]**: server-side pagination, bulk row selection/actions, column reordering, export — none of the 26 pages need these yet.

### KpiCard / StatCard

- Just number + label + optional trend icon. **[Future Version]**: sparkline mini-chart inside the card — nice, not needed for MVP stat widgets.

### Card (generic)

- Used for: skill row, document row, candidate result, notification item. One card shell, different internal content — don't build 4 separate "Card" components for these.

### Modal / Dialog

- Used for: Add Skill, Attach Evidence, Confirm reject-with-note, Add experience. Max width `480px` for forms, `640px` for anything with a preview (like Attach Evidence showing a document thumbnail).

### Tabs

- Used for: FAQ categories, maybe Admin settings sections. Simple, no nested tabs needed.

### Accordion

- Used for: FAQ only.

### Toast

- Used for: every mutating action's confirmation (save, upload, approve). Rule: toast text must match the button label's verb exactly (button says "Save changes" → toast says "Changes saved", not "Success!").

### Sidebar / DashboardLayout

- One shell, `role` prop switches which nav items render (already implemented correctly per the audit). RTL rule: the active-item indicator border must use `border-inline-start`, not `border-left` — this was flagged as an actual bug already.

### Avatar

- Sizes: 24px (table rows), 32px (navbar), 64px (profile header). Fallback: initials on a brand-50/800 background, never a broken image icon.

### Empty State

- Icon (24px, muted color) + one-line message in the interface's voice (e.g. "No skills added yet" not "Oops, nothing here!") + a primary action button when applicable ("Add your first skill").

### Loading State

- Skeleton rows for tables (not a spinner) — spinners for buttons/inline actions only.

### Progress bar

- Used for: Learning Pathway completion %. Simple linear bar, brand-colored fill.

### Chart (bar/line only)

- Used for: Skill Gap comparison (bar), Admin platform stats over time (line). Colors: current-level bars use `--brand`, target/market bars use `--purple-300` (light) so the two series are clearly from the same family but distinguishable — this was already flagged as inconsistent in the code audit.

### [Future Version] — explicitly not needed for MVP

Combobox, OTP input, Time Picker, Calendar, Drawer, FAB, Command palette, Data Grid (virtualized), Gauge/Heatmap/Radar charts, Multi-step wizard forms, Autosave indicators, Command+K search. None of the 26 pages call for these — building them now is speculative work.

---

## 10. RTL Rules (concrete, not generic)

1. Use `ms-*` / `me-*` / `ps-*` / `pe-*` (logical) instead of `ml-*` / `mr-*` / `pl-*` / `pr-*` everywhere — no exceptions, this is the single most common source of "works in English, breaks in Arabic" bugs.
2. `border-inline-start` instead of `border-left` for any active-state indicator (sidebar, tabs).
3. Directional icons (arrows, chevrons, "back" icons) flip via a simple `rtl:rotate-180` utility. Non-directional icons (badges, documents, bells, shields) never flip.
4. Numbers, emails, and skill names in Latin script inside RTL text must stay LTR inline (`dir="ltr"` on that inline span) so they don't visually scramble.

---

## 11. Accessibility (WCAG AA baseline — only what applies to this project)

- Text contrast ≥ 4.5:1 body, ≥ 3:1 large text/headings — verify against the actual token pairs above, not assumed.
- Every interactive element has a visible `focus-visible` ring using `--focus-ring` — never `outline: none` without a replacement.
- Status must never be color-only: every StatusBadge also carries an icon + text label (already planned above) — this covers color-blind users automatically.
- All form errors are announced via `aria-describedby`, not just visual red text.
- Minimum touch target 40x40px for icon-only buttons (table row actions, sidebar collapse).

**[Future Version]**: full screen-reader audit / VoiceOver testing pass — recommended before public launch, not blocking for internal team development now.

---

## 12. Motion (minimal, not a full system)

- Hover/focus transitions: `150ms ease`
- Modal/dropdown open: `200ms ease-out`, slight scale (0.98→1) + fade
- Toast: slide-in from top, auto-dismiss 4s
- Respect `prefers-reduced-motion`: disable scale/slide, keep only opacity fade

**[Future Version]**: page transitions, orchestrated scroll-reveal animations on dashboard pages — dashboards are read frequently by returning users; motion there should stay invisible/fast, not decorative.

---

## 13. CSS Variables (drop-in, matches Tailwind config above)

```css
:root {
  --bg-page: #faf9fb;
  --bg-surface: #ffffff;
  --bg-surface-hover: #f3f1f5;
  --border: #e5dceb;
  --text-primary: #211a2b;
  --text-secondary: #5b4f68;
  --text-muted: #8b7f97;
  --brand: #4d1b65;
  --brand-hover: #752999;
  --brand-fg: #ffffff;
  --focus-ring: #9939c6;
  --status-success-bg: #e6f7ef;
  --status-success-fg: #1b8a5a;
  --status-warning-bg: #fdf1dc;
  --status-warning-fg: #b45309;
  --status-error-bg: #fbe7ec;
  --status-error-fg: #c0284f;
  --status-info-bg: #e8ecfb;
  --status-info-fg: #3a4fc4;
}
.dark {
  --bg-page: #190722;
  --bg-surface: #260c32;
  --bg-surface-hover: #381249;
  --border: #3d2a4a;
  --text-primary: #f3eef7;
  --text-secondary: #c7b9d1;
  --text-muted: #9483a3;
  --brand: #b573d3;
  --brand-hover: #cda3e0;
  --brand-fg: #260c32;
  --focus-ring: #b573d3;
  --status-success-bg: #123d2b;
  --status-success-fg: #4ade94;
  --status-warning-bg: #3d2a0a;
  --status-warning-fg: #f5a742;
  --status-error-bg: #3d0f1c;
  --status-error-fg: #f0648c;
  --status-info-bg: #161c3d;
  --status-info-fg: #8b9cf0;
}
```

---

## 14. What's Explicitly Deferred to Future Version (summary)

Design work was intentionally **not** done for: Data Grid virtualization/export, Combobox/OTP/Calendar/Time Picker/Drawer/FAB/Command palette, Gauge/Heatmap/Radar charts, multi-step wizard forms, sparkline mini-charts, page-transition motion, full screen-reader audit, Archived/Suspended/Expired statuses, monospace/code typography. Each is one line to add later once a real page needs it — building them now would be guessing at requirements no page has yet.

---

_This document is the single source of truth for JADARA's frontend team. Any new component or color must be added here first, then implemented — not the other way around._

---

## 15. Component Architecture

Six layers, strictly one-directional dependency (a layer may only import from the layers above it, never sideways or down):

| Layer                 | Definition                                                                                            | Example in JADARA                                             | Lives in                             |
| --------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------ |
| **Primitive**         | Unstyled or minimally-styled building block, no business meaning                                      | `Button`, `Input`, `Dialog`, `Tabs` (shadcn/Radix)            | `src/components/ui/`                 |
| **Shared**            | Primitives composed into a JADARA-specific pattern, used by 3+ features                               | `StatusBadge`, `DataTable`, `KpiCard`, `EmptyState`, `Avatar` | `src/components/common/`             |
| **Layout**            | Structural shell, no page content                                                                     | `DashboardLayout`, `PublicLayout`, `Sidebar`, `Topbar`        | `src/components/layout/`             |
| **Feature/Composite** | Combines Shared + Primitive for one feature's own needs, not reused elsewhere                         | `SkillEvidenceLink`, `ReviewActionModal`, `CvPreview`         | `src/features/{feature}/components/` |
| **Page**              | A route's top-level component; composes Feature + Shared + Layout, holds no visual styling of its own | `SkillsPage`, `AdminDashboardPage`                            | `src/routes/app/{role}/*.tsx`        |
| **Provider**          | Cross-cutting state, not visual                                                                       | `ThemeProvider`, `I18nProvider`, `MockDbProvider`             | `src/lib/{concern}/`                 |

**Why this matters concretely for a 3-person team**: if Developer 2 needs a status pill inside `skills.tsx`, the rule is "check Shared first" — she reuses `StatusBadge`, she does not create `SkillStatusPill`. This one rule is what prevents the exact duplication risk flagged in the earlier code audit.

**Naming convention**:

- Primitive/Shared/Layout components: `PascalCase.tsx`, one component per file, named after what it **is** (`StatusBadge`, not `GreenPill`).
- Feature components: prefixed with their domain when the name alone would be ambiguous outside its folder (`SkillEvidenceLink` not `EvidenceLink`, since "Evidence" alone is used in Documents too).
- Page components: always suffixed `Page` (`SkillsPage`), so grep-ing for `Page.tsx` always yields the exact route list.

**Do**: promote a Feature component to Shared the moment a second feature needs it.
**Don't**: import one feature's component directly into another feature's folder (`features/documents` importing from `features/skills/components/`) — if it's needed in two places, it belongs in `components/common/`, not in either feature.

---

## 16. Developer Rules

Concrete, checkable rules — each one maps to a real bug already found in this codebase, not a hypothetical.

| Rule                                                                     | Why (real bug it prevents)                                                                  | Do                                                                       | Don't                                                           |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Never use a raw hex value in a component                                 | This is exactly how the Hero banner ended up hardcoded dark in light mode                   | `bg-bg-surface`                                                          | `style={{background:'#4D1B65'}}`                                |
| Never hardcode text color assuming a specific background                 | This is exactly why Hero text disappeared in dark mode                                      | `text-text-primary`                                                      | `className="text-white"` on anything not inside a Button        |
| Never create a one-off spacing value                                     | Keeps 3 developers' screens visually aligned without a design review                        | `p-5`, `gap-6`                                                           | `style={{padding:'18px'}}`                                      |
| Never duplicate a Shared component                                       | Prevents 3 different "status pill" implementations (already found once)                     | extend `StatusBadge` with a new status if needed                         | copy-paste `StatusBadge` and rename it                          |
| Never bypass a Shared component to "save time"                           | The Skill↔Evidence gap happened because the real `FileUpload` pattern wasn't reused         | wire the real `FileUpload` component with its `onAttachToSkill` callback | build a local modal that just shows a toast                     |
| Prefer composition over duplication                                      | One `Card` shell, many contents — not four near-identical Card components                   | `<Card><SkillRow/></Card>`                                               | `SkillCard`, `DocumentCard`, `CandidateCard` as separate shells |
| Never commit an auto-generated file that changes on every route addition | `routeTree.gen.ts` being committed was already flagged as a recurring merge-conflict source | add it to `.gitignore`                                                   | `git add routeTree.gen.ts`                                      |
| Never gate a role's UI only in the sidebar                               | Sidebar-only gating is how `/admin` stayed reachable by URL                                 | check role in the route's `beforeLoad` too                               | hide the nav link and assume that's "access control"            |

---

## 17. State & Interaction Guidelines

No specific state library is prescribed — these are rules about **where a piece of state should live**, applicable regardless of the tool.

| State type              | Definition                                                                          | JADARA example                                                      | Rule                                                                                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Local state**         | Belongs to one component, dies when it unmounts                                     | a modal's open/close, an input's current draft value                | Never lift local state higher than the component that needs it "just in case"                                                                           |
| **Server/shared state** | Represents data that multiple screens must agree on                                 | skills, documents, verification status (currently `MockDbProvider`) | Must live in a Provider, never duplicated as local state in two pages — this is the actual fix for the Reviewer→Beneficiary sync gap found in the audit |
| **URL state**           | Represents "what the user is looking at," should survive a refresh and be shareable | active tab, table filters, search query, selected candidate id      | If refreshing the page should not lose it, it belongs in the URL (route params/search params), not in `useState`                                        |
| **Form state**          | Draft values before submission, plus per-field validity                             | Add Skill dialog, Register form                                     | Local to the form until submit; on submit, it becomes Server/shared state                                                                               |
| **Loading state**       | "We're waiting on something"                                                        | table fetch, file upload progress                                   | Always has exactly 3 outcomes to design for: loading → success or error — never leave a 4th silent state                                                |
| **Empty state**         | "The request succeeded, there's just nothing there"                                 | 0 skills, 0 search results                                          | Never render a blank table body — this is a rule, not a suggestion, per the audit's DataTable finding                                                   |
| **Error state**         | "The request failed"                                                                | upload failed, wrong file type                                      | Must be recoverable in place (retry / fix and resubmit) — never a dead end requiring page refresh                                                       |
| **Success state**       | Confirms a mutation happened                                                        | "Skill added", "Document uploaded"                                  | Communicated via Toast (see §9) — never silently update the UI with no confirmation                                                                     |

---

## 18. File Upload Pattern

JADARA is evidence-driven — this is the single most important interaction pattern in the whole product, so it gets its own spec rather than being buried inside the FileUpload component entry in §9.

**States** (every upload instance must implement all of these, not a subset):

1. **Empty / dropzone** — dashed border, upload icon, "Drag a file here or browse," accepted formats and max size shown as helper text (not hidden until an error occurs).
2. **Drag-over** — border switches to `--brand`, background tints to `brand-50` (light) / `brand-900` (dark) — one clear visual state, not a color animation.
3. **Uploading** — filename + determinate progress bar (not an indeterminate spinner — evidence files can be large, users need to know it's moving).
4. **Uploaded** — filename, file-type icon, file size, a **Preview** action (opens the file/thumbnail) and a **Remove** action.
5. **Replace** — same slot as Uploaded, adds a "Replace" action that re-opens the dropzone for that slot specifically, rather than forcing Remove-then-re-add.
6. **Error** — inline below the dropzone (not a toast-only error): wrong file type, file too large, or upload failed. Always paired with a **Retry** action, never a dead end.

**Validation rules (MVP)**:

- Accepted types: `.pdf, .jpg, .png, .docx` — reject anything else client-side before attempting upload.
- Max size: `10MB` per file — shown as static helper text, not only discovered on rejection.
- One file per evidence slot for MVP. **[Future Version]**: multi-file per skill/claim.

**The critical rule (this is the actual fix for the Skill↔Evidence gap)**: every instance of this component must accept and call a callback prop — e.g. `onAttach(entityType, entityId, file)` — and the parent (Skills page, Experience page, Certificates page) is responsible for persisting that link in shared state (see §17). A visually complete upload widget that doesn't call this callback is not "done" — it's the same cosmetic bug already found once.

---

## 19. Search & Filtering Pattern

Applies to: Skills table, Documents table, Reviewer queue, Company talent search.

- **Search input**: debounce **300ms** before filtering/querying — never filter on every keystroke for lists over ~20 rows (visible jank on the Reviewer queue and Talent Search specifically).
- **Filters**: shown as visible chips/selects above the table, never hidden inside a menu the user must open first for MVP's filter count (skill, level, status — at most 3–4 filters per screen).
- **Combining search + filters**: always AND logic (search text AND selected filters), never OR — OR silently returns confusing broad results.
- **Sorting**: click a column header to sort; show a small arrow indicating direction; only one sort column active at a time for MVP.
- **Pagination**: client-side, **10 rows per page** default (matches the mock data volumes already in the project). **[Future Version]**: server-side pagination once real data volume requires it.
- **Empty results** (search/filter returned nothing): distinct from the "no data at all" Empty State — copy must say something like "No skills match 'React'" with a **Reset filters** action, not the generic "No skills yet" copy (these are different states and are frequently conflated).
- **Reset filters**: always available as a single visible action once any filter/search is active — never require clearing each filter individually.

---

## 20. Charts & Data Visualization

Complements the Chart entry in §9 — this section covers the cross-cutting rules that apply wherever a chart appears (Skill Gap bars, Admin platform-growth line, Company sourcing-activity chart).

- **Chart types actually needed**: bar (Skill Gap current-vs-target) and line (Admin stats over time) only. **[Future Version]**: pie/donut, radar, gauge, heatmap — none of the 26 pages need these; do not add "just in case."
- **Color usage**: chart series must pull from the same token set as the rest of the UI (`--brand`, `--purple-300`) as already specified in §9 — a chart using unrelated saturated colors (the exact issue flagged in the second code audit) is a bug, not a style choice.
- **Legends**: only shown when a chart has 2+ series (Skill Gap's "Your Level" vs "Market Target"); a single-series chart (Admin growth line) needs no legend, just an axis label.
- **Tooltips**: on hover/tap, show the exact value + label — never require the user to guess a bar's height by eye.
- **Loading state**: skeleton rectangle matching the chart's aspect ratio — never an empty axis with no indication data is coming.
- **Empty state**: if a user has zero skills to compare (Skill Gap) or zero historical data (Admin, brand-new platform), show the standard Empty State pattern (§9) instead of an empty/broken-looking chart canvas.
- **Accessibility**: every chart needs a text-equivalent summary for screen readers (e.g. a visually-hidden `<caption>` stating "React: your level 74, market target 80") — charts are the single easiest place to accidentally lock out screen-reader users.
- **Responsive behavior**: charts reflow to full container width; below `640px`, the Skill Gap bar chart switches from grouped bars to a stacked mini-list (label + two inline numbers) rather than shrinking bars to unreadable widths.

---

## 21. Theme System

Completes the theme architecture referenced by the tokens in §2 and §13.

- **Modes supported**: Light, Dark, and **System** (follows OS-level `prefers-color-scheme` on first visit, before the user has made an explicit choice).
- **Persistence**: once a user explicitly picks Light or Dark (not System), store that choice and always respect it over the OS setting on future visits — already implemented correctly per the code audit (`localStorage` key, `dark` class toggle); this section only formalizes it as policy so it isn't accidentally changed later.
- **Theme tokens**: exactly the CSS variables defined in §13 — the Theme System has no tokens of its own, it only decides _which value_ each token resolves to.
- **Provider contract**: a single `ThemeProvider` exposes `{ theme, setTheme }` where `theme` is `'light' | 'dark' | 'system'`; components never read `document.documentElement.classList` directly — always through the provider, so the resolution logic (System → OS preference) lives in exactly one place.
- **Switching rule**: the toggle in the navbar is a two-state visual control (sun/moon) that cycles Light ⇄ Dark directly — "System" is available as a third option in Settings only, not in the everyday navbar toggle, since most users want to just pick one and move on.
- **What must never happen**: a component computing its own light/dark branch with a raw `if` check outside the token system (e.g. the Hero background and chart-color bugs already found) — if a value needs to differ by theme, it belongs in §2/§13 as a token, not as inline conditional logic in a page file.

---

## 22. Versioning & Evolution

Lightweight rules sized for a 3-person team — not a formal enterprise RFC process.

- **Versioning**: this document is `v1`. Any change to an existing token's _value_ (not just adding a new one) bumps to `v1.1`, `v1.2`, etc., noted in a one-line changelog at the very top of this file. Adding a net-new component/token that doesn't change existing behavior does not require a version bump.
- **Introducing a new component**: before building it, check §9 and §15 — if something similar already exists, extend it instead. If it's genuinely new, add its entry to §9 in the same format (purpose, variants, one implementation rule) as part of the same PR that introduces it, not as a follow-up "documentation later" task.
- **Deprecation policy**: mark a token/component `@deprecated` in a code comment pointing to its replacement for at least one sprint before deleting it, so in-flight work by another teammate doesn't silently break.
- **Backward compatibility**: renaming a semantic token (`--brand` → something else) requires updating every usage in the same PR — semantic tokens are contracts the whole team relies on; treat a rename like an API breaking change, not a find-and-replace afterthought.
- **Design review process**: for a team this size, "review" means: whoever adds a new token/component pastes the diff of this document in the team chat before merging — no separate design-review meeting needed at MVP scale.
- **Contribution rule**: any of the three frontend developers can propose an addition to this document; nobody edits an existing decision (color values, spacing scale) unilaterally — that requires explicit agreement since it's a shared foundation, not a per-feature decision.

---

_Appended sections 15–22. Sections 1–14 above are unchanged from the original v1 document._

---

## PART II — Landing Page Visual Design System

> **Scope**: Sections 23–34 apply exclusively to JADARA's public-facing landing page (Home, About, How It Works, FAQ, and any future marketing pages). They extend — and never override — the dashboard design system in §1–22 above. The same token layer (§2/§13) is the foundation; these sections layer premium visual effects, motion, and marketing-specific patterns on top of it.
>
> **Design Baseline**: ~95% of the public site is **Light Premium Minimalist** (`#FFFFFF` and soft brand-50 `#F9F3FC` backgrounds with soft purple glows and clean typography), with exactly two deliberate, high-contrast dark exceptions at the end of the page flow: the **Final CTA Section** (`from-brand-700 to-brand-900`) and the **Footer** (`#0F0616`).
>
> **Stack**: React + TanStack Router / Vite + Tailwind CSS v4 + `tw-animate-css` (already installed). No additional animation library is required for MVP.

---

## 23. Overall Visual Style — Landing Page Language

### 23.1 Design Philosophy

JADARA's landing page operates in a market where trust is scarce and attention is short. The visual language must accomplish three things simultaneously: **communicate premium quality** (this platform is serious and high-caliber), **feel clean and approachable** (built for young Algerians entering the workplace), and **establish clear brand authority** (the purple identity `#4D1B65` is unmistakable and purposeful).

The resulting style is **Light Premium Minimalism with Depth** — a light-first design language inspired by the refined light mode aesthetics of **Linear, Stripe, and Notion**, tailored specifically for JADARA's audience:

- **Light-first public canvas** (`#FFFFFF` base alternating gently with `#FAF9FB` and brand-50 tint `#F9F3FC`). Generous whitespace, crisp dark typography, and light purple ambient glows create an airy, trustworthy foundation.
- **Selective dark moments** — contrast is used strategically. The Final CTA and Footer are the only dark surfaces, serving as a powerful visual climax and anchor right before the user commits or leaves.
- **Depth through subtle layering** — soft radial glows in light purple (`rgba(153, 57, 198, 0.12)`), multi-layered soft drop shadows (`shadow-sm` / `shadow-md`), and clean card borders (`border-border/50`), not deep dark canvases.
- **Minimalist restraint** — one gradient accent, one ambient glow, and high-contrast typography per section. Every additional visual effect must earn its place.
- **Warmth through typography** — Lama Sans / IBM Plex Sans Arabic at display sizes brings human warmth. Negative letter-spacing (`-0.02em`) on display headings ensures optical tightness.
- **Trust through precision** — generous padding, pixel-perfect alignment, and clean responsive behavior communicate reliability.

### 23.2 Visual Pillars

| Pillar                  | Implementation                                                                                  | Anti-pattern                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Minimalism**          | Generous padding (`py-24`), whitespace-driven layout, clean structure                           | Crowding elements; heavy borders around every item                        |
| **Light Premium Depth** | White/light-purple base, soft radial glows, subtle elevation shadows                            | Deep black/dark background for hero; neon glows                           |
| **Modern Aesthetics**   | Frosted white glass nav (`backdrop-filter`), soft mesh tints, clean pill badges                 | Pure flat white with zero depth; heavy drop shadows                       |
| **Trust**               | Real statistics counter, institutional partner badges, verified icons                           | Generic stock photos, fake testimonials, misaligned cards                 |
| **Professionalism**     | Strong typographic hierarchy, clear contrast ratios, zero orphaned text                         | Icon clutter, unnecessary floating decorative graphics                    |
| **Accessibility**       | High contrast text on light bg (≥7:1 for body copy), clear focus rings, reduced-motion fallback | Low-contrast gray text on light backgrounds; color-only status indicators |

### 23.3 Light Mode is Default for Public Pages

Unlike the internal dashboard which supports system theme toggling (§21), all public landing routes (Home, About, How It Works) default to **Light Mode**.

- Public sections render with high-contrast dark text (`text-foreground` / `neutral-900`) on white and light-purple tinted surfaces (`bg-background` / `bg-[#F9F3FC]`).
- Dark background tokens are reserved strictly for the two intentional dark exceptions: the **Final CTA Section** and the **Footer**.

---

## 24. Hero Section

### 24.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│  NAV (transparent at top, frosted white blur on scroll)     │
│─────────────────────────────────────────────────────────────│
│                                                             │
│  [Trust Badge — center pill: DZ Young Leaders / Platform]   │
│                                                             │
│  H1 — 2–3 lines, center-aligned, display weight, dark text  │
│                                                             │
│  Description — 1–2 lines, muted text, centered              │
│                                                             │
│  [Primary CTA (Purple)]   [Secondary CTA (Outline)]  (center)  │
│                                                             │
│  ─────── soft radial purple glow layer (behind text) ────── │
│                                                             │
│  [Social proof / stat strip — center]                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
        ↑ full or prominent viewport height (bg-gradient-hero / light bg)
```

JADARA's hero is a **typographic and gradient-glow hero** (per product spec and `HomePage.tsx`). It features crisp text, an institutional partner badge, clear primary/secondary CTAs, and a soft radial purple ambient glow centered behind the heading.

### 24.2 Spacing

```
Section top padding:    120px (desktop) → 80px (tablet) → 64px (mobile)
Section bottom padding: 80px  (desktop) → 64px (tablet) → 48px (mobile)
H1 margin-top (from badge): 20px
Description margin-top:     16px
CTA group margin-top:       36px
CTA group gap:              12px / 16px
Social proof / stats gap:   48px
```

### 24.3 Visual Hierarchy

1. **H1** — largest element, high contrast dark text (`text-foreground` / `neutral-900` = `#160F1E`), `font-display`, 48px–56px desktop / 30px–36px mobile, weight 800.
2. **Trust Badge** — pill badge above heading (`bg-primary/10`, `text-primary/80`, font-semibold). Anchors partner trust immediately.
3. **Description** — secondary text (`text-muted-foreground` / `neutral-600`), 18px–20px desktop / 15px mobile, regular/medium weight, leading-relaxed.
4. **CTAs** — Primary CTA is solid brand purple (`--brand` = `#4D1B65` / `#752999`) with white text and subtle shadow. Secondary CTA is a light outline/surface variant (`variant="outline"`).
5. **Soft Ambient Glow** — radial background blur (`rgba(153, 57, 198, 0.12)`) positioned behind the text, giving subtle depth without darkening the canvas.

### 24.4 CTA Placement

Centered horizontally on desktop and tablet. On mobile (<480px), CTAs stack vertically full-width with the primary button above the secondary button.

- **Primary CTA**: Solid fill `bg-primary` / `brand-700`, text `text-primary-foreground` (`#FFFFFF`). Elevates slightly with soft shadow on hover (`shadow-lg` → `shadow-xl`).
- **Secondary CTA**: Light border `border-input` / `border-neutral-300`, background `bg-background` / `bg-white`, text `text-foreground`. On hover: light background shift (`bg-neutral-100` / `brand-50`).

### 24.5 Responsive Behavior

| Breakpoint     | H1 size | Description | CTA layout        | Top Padding |
| -------------- | ------- | ----------- | ----------------- | ----------- |
| `≥1280px` (xl) | 56px    | 18px–20px   | Row, centered     | 140px       |
| `≥1024px` (lg) | 48px    | 18px        | Row, centered     | 120px       |
| `≥768px` (md)  | 40px    | 16px        | Row, centered     | 96px        |
| `≥480px` (sm)  | 34px    | 15px        | Row, centered     | 80px        |
| `<480px`       | 30px    | 15px        | Stack, full-width | 64px        |

---

## 25. Background System

A layered CSS background system optimized for light-mode rendering with soft depth accents.

### 25.1 Layer Stack (bottom to top)

```
Layer 0 (Base):      Solid Light Canvas  #FFFFFF or #FAF9FB
Layer 1 (Mesh):      Soft purple mesh gradients (brand-50 through brand-200)
Layer 2 (Glow):      Single radial spotlight glow behind hero text (rgba(153,57,198,0.12))
Layer 3 (Grain):     SVG noise texture (barely-there 2% opacity)
Layer 4 (Lines/Dots):Subtle dot grid or accent line (5% opacity) [Optional]
Layer 5 (Content):   All text, buttons, and interactive cards
```

### 25.2 Layer 0 — Base Canvas

```css
.hero-bg-light {
  background-color: #ffffff; /* or linear-gradient to brand-50 (#F9F3FC) */
}
```

The light canvas guarantees high text legibility and clean contrast for all marketing content.

### 25.3 Layer 1 — Mesh Gradient (Light Purple Tints)

Soft, organic mesh orbs using gentle light purple tints rather than dark heavy tones:

```css
.hero-mesh-light {
  background-image:
    /* Orb 1 — soft top-center light purple glow */
    radial-gradient(
      ellipse 70% 50% at 50% 0%,
      rgba(241, 227, 247, 0.7) 0%,
      /* brand-100 tint */ transparent 65%
    ),
    /* Orb 2 — subtle right accent */
    radial-gradient(
        ellipse 50% 40% at 85% 30%,
        rgba(226, 201, 238, 0.4) 0%,
        /* brand-200 tint */ transparent 60%
      ),
    /* Orb 3 — bottom soft lift */
    radial-gradient(
        ellipse 80% 40% at 20% 80%,
        rgba(249, 243, 252, 0.8) 0%,
        /* brand-50 tint */ transparent 70%
      );
}
```

### 25.4 Layer 2 — Hero Spotlight Glow (Light Canvas)

A soft radial purple blur behind the main hero heading (`HomePage.tsx` implementation):

```css
.hero-glow-light {
  background: radial-gradient(
    circle at center,
    rgba(153, 57, 198, 0.12) 0%,
    /* brand-500 at 12% opacity */ transparent 55%
  );
  filter: blur(40px);
}
```

This creates an ambient purple halo behind the dark heading text without obscuring readability.

### 25.5 Layer 3 — Grain Texture (Conservative Opacity)

On light backgrounds, noise must be extremely subtle to avoid looking dirty:

```css
.hero-grain-light {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-size: 256px 256px;
  opacity: 0.02; /* 2% opacity max on light canvas */
  mix-blend-mode: multiply;
}
```

### 25.6 Layer 4 — Dot Grid (Light Mode)

```css
.section-dots-light {
  background-image: radial-gradient(
    circle,
    rgba(117, 41, 153, 0.08) 1px,
    /* brand-600 at 8% */ transparent 1px
  );
  background-size: 32px 32px;
}
```

### 25.7 Section Background Alternation (Rhythm)

The landing page uses ONE continuous light gradient from top to bottom — no dark sections anywhere. Individual sections are transparent, letting the page-level gradient show through:

| Section              | Background                                            | Text Theme    | Notes                                          |
| -------------------- | ----------------------------------------------------- | ------------- | ---------------------------------------------- |
| Hero                 | Transparent (page gradient) + soft purple radial glow | Dark text     | Glow adds depth without separate bg            |
| What is JADARA       | Transparent (page gradient)                           | Dark text     | Clean two-column track layout                  |
| How It Works         | Transparent (page gradient)                           | Dark text     | Timeline on the mid-gradient tint              |
| How JADARA Helps You | Transparent (page gradient)                           | Dark text     | Feature highlights grid                        |
| Final CTA            | Transparent (page gradient)                           | Dark text     | Open section, brand-purple button for contrast |
| **Footer**           | Transparent (page gradient, darkest stop ~brand-200)  | **Dark text** | Continuous — no dark background                |

Page-level gradient: `linear-gradient(to bottom, #FFFFFF 0%, #F9F3FC 25%, #F1E3F7 60%, #E2C9EE 100%)`

---

## 26. Motion Design

Motion design principles apply universally across themes, but hover states and glow animation color tokens are calibrated specifically for light background surfaces.

### 26.1 Motion Philosophy

- **Entrance animations** run once on viewport enter via `IntersectionObserver`.
- **Accessibility**: Full compliance with `prefers-reduced-motion: reduce`.
- **Duration budget**: Total animation time per element ≤ 500ms.

### 26.2 Timeline Reveal (How It Works)

As seen in `HomePage.tsx`, step items fade in and lift smoothly upon scrolling into view:

```css
.step-timeline-item {
  opacity: 0;
  transform: translateY(32px);
  transition:
    opacity 500ms ease-out,
    transform 500ms ease-out;
}

.step-timeline-item.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### 26.3 Light-Theme Hover Animations

**Primary Button hover**

```
duration: 200ms ease-out
effect:   translateY(-1px)
          box-shadow: 0 8px 24px rgba(77, 27, 101, 0.25)
          background: lightens slightly to brand-600 (#752999)
```

**Secondary Button hover**

```
duration: 150ms ease-out
effect:   border-color → brand-300 / brand-400
          background → brand-50 (#F9F3FC)
```

**Feature / Track Card hover (Light Mode)**

```
duration: 300ms ease-out
effect:   translateY(-2px) or scale(1.02)
          border-color → brand-200 / border-border
          box-shadow: 0 10px 30px rgba(38, 12, 50, 0.06)
```

**Help Item Card hover (`HomePage.tsx` pattern)**

```
duration: 300ms ease-out
effect:   scale(1.05)
          background → primary-soft / brand-50
```

---

## 27. Typography — Landing Page Extension

Landing page typography is optimized for maximum impact, scanability, and clarity.

### 27.1 Display Scale & Text Color Baseline

| Role               | Font                         | Desktop Size | Mobile Size | Weight | Color Baseline                                 |
| ------------------ | ---------------------------- | ------------ | ----------- | ------ | ---------------------------------------------- |
| Hero H1            | Lama Sans / Display          | 48–56px      | 30–34px     | 800    | `text-foreground` (`#160F1E`)                  |
| Section Title (H2) | Lama Sans / Display          | 32–40px      | 26–28px     | 800    | `text-foreground` (`#160F1E`)                  |
| Track / Card H3    | Lama Sans / Display          | 20–24px      | 18–20px     | 800    | `text-foreground` (`#160F1E`)                  |
| Body Text          | IBM Plex Sans Arabic / Inter | 16–18px      | 15–16px     | 400    | `text-muted-foreground` (`#5B4F68`)            |
| CTA Heading        | Lama Sans / Display          | 32–40px      | 26–28px     | 800    | **White (`#FFFFFF`)** [CTA Exception]          |
| Footer Text        | IBM Plex Sans Arabic / Inter | 14–15px      | 13–14px     | 400    | **Muted Light (`#C7B9D1`)** [Footer Exception] |

### 27.2 Fluid Typography Scale

```css
.hero-h1 {
  font-size: clamp(30px, 4.5vw + 14px, 56px);
  line-height: 1.12;
  letter-spacing: -0.02em;
  font-weight: 800;
  color: var(--text-primary); /* neutral-900 on light */
}

.section-h2 {
  font-size: clamp(26px, 3vw + 10px, 40px);
  line-height: 1.16;
  letter-spacing: -0.01em;
  font-weight: 800;
  color: var(--text-primary);
}
```

---

## 28. Color System — Landing Page Extension

Adds landing-page-specific derived tokens for light mode surfaces, with clear delineation for the dark CTA/Footer exceptions.

### 28.1 Landing Page Tokens

```css
/* Public site light tokens (default baseline) */
.landing-page {
  /* Light canvas glow colors */
  --glow-hero-light: rgba(153, 57, 198, 0.12); /* brand-500 12% — soft hero halo */
  --glow-card-light: rgba(181, 115, 211, 0.15); /* brand-400 15% — card focus */
  --glow-mesh-light-1: rgba(241, 227, 247, 0.7); /* brand-100 */
  --glow-mesh-light-2: rgba(226, 201, 238, 0.4); /* brand-200 */

  /* Light section backgrounds */
  --bg-landing-hero: #ffffff;
  --bg-landing-alt: #faf9fb; /* neutral-50 */
  --bg-landing-brand-tint: #f9f3fc; /* brand-50 */

  /* Light cards & borders */
  --bg-card-light: #ffffff;
  --border-card-light: rgba(229, 220, 235, 0.6); /* neutral-200/60 */
  --shadow-card-light: 0 4px 20px rgba(38, 12, 50, 0.04);
  --shadow-card-hover-light: 0 10px 30px rgba(77, 27, 101, 0.08);

  /* CONTINUOUS PAGE GRADIENT (replaces the former dark CTA/Footer exception) */
  --gradient-page: linear-gradient(to bottom, #ffffff 0%, #f9f3fc 25%, #f1e3f7 60%, #e2c9ee 100%);
  /* Dark exception tokens retained for reference / future use elsewhere — NOT applied to CTA or Footer */
  --bg-cta-dark-from: #4d1b65; /* brand-700 — reserved, not used on public page */
  --bg-cta-dark-to: #260c32; /* brand-900 — reserved, not used on public page */
  --bg-footer-dark: #0f0616; /* dark ground — reserved, not used on public page */
}
```

### 28.2 Text Gradient Recipe (Light Background)

For accent words on light backgrounds, use a deep purple gradient that retains full contrast against white:

```css
.text-gradient-brand-light {
  background: linear-gradient(135deg, #752999 0%, #4d1b65 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## 29. Component Styles — Landing Page

### 29.1 Navigation (Frosted White Glass)

Sticky navigation with frosted white backdrop blur:

- **At top of page**: `background: transparent`, no border.
- **After scroll**: `background: rgba(255, 255, 255, 0.85)`, `backdrop-filter: blur(12px)`, `border-bottom: 1px solid rgba(229, 220, 235, 0.6)`.
- **Nav links**: `text-neutral-700` (`#3D3348`), hover to `text-brand-700` (`#4D1B65`).

### 29.2 Trust Badge Component

```
Shape:      Pill (border-radius: 999px)
Background: rgba(117, 41, 153, 0.08) (brand-50 / primary-10)
Border:     1px solid rgba(181, 115, 211, 0.3)
Text:       13px, weight 600, color text-primary/80
Partner Logo: Integrated image asset (/images/dz_young_leaders_logo.png)
```

### 29.3 Buttons

- **Primary CTA**: Pill shape (`rounded-full`), solid brand purple (`#4D1B65` / `#752999`), white text, soft shadow.
- **Secondary CTA**: Pill shape (`rounded-full`), white background, subtle neutral border (`border-neutral-300`), dark text. Hover: `bg-brand-50`.

### 29.4 Cards (Track & Feature Cards)

Clean light cards matching `HomePage.tsx` implementation:

```
Background:      #FFFFFF (bg-card)
Border:          1px solid rgba(229, 220, 235, 0.5) (border-border/50)
Border-radius:   24px (rounded-3xl) or 16px (rounded-2xl)
Padding:         32px (p-8)
Shadow:          shadow-sm (0 2px 8px rgba(0,0,0,0.04))
Hover state:     shadow-md, border-brand-200/60, translateY(-2px)
```

---

## 30. CTA & Footer — Continuous Light Gradient (REVISED: no dark exception)

### 30.1 Design Decision

The Final CTA Section and Footer are **no longer dark**. The entire public page — Hero through Footer — uses **one continuous light lavender/purple gradient** (`white → brand-50 → brand-100 → brand-200`) applied at the page-wrapper level. No dark surface exists anywhere on public routes.

This was revised from the earlier "dark exception" approach after reviewing readdy.ai's design side-by-side: a single unbroken soft gradient that flows from hero to footer reads more cohesive and premium than a hard color switch to a dark zone at the bottom.

### 30.2 CTA Section Design (Revised)

The CTA is a simple open section sitting directly on the page gradient — no boxed card, no dark background, no rounded container:

```tsx
<section className="mx-auto max-w-4xl px-6 pb-24 pt-16 text-center">
  <h2 className="text-3xl font-extrabold text-foreground font-display lg:text-4xl">
    {/* CTA Title — dark text on light gradient */}
  </h2>
  <p className="mx-auto mt-4 max-w-lg text-muted-foreground text-base leading-relaxed">
    {/* CTA Subtitle */}
  </p>
  <Button
    asChild
    size="lg"
    variant="default"
    className="mt-8 font-bold shadow-md hover:shadow-xl hover:scale-105 transition-all"
  >
    <Link to="/register">
      {/* Register Button — solid brand-700 (#4D1B65) with white text for contrast on the light bg */}
    </Link>
  </Button>
</section>
```

**Contrast check**: The button (`#4D1B65` on `#E2C9EE` background at the bottom gradient stop) gives ~8:1 contrast ratio — well above WCAG AA. Dark foreground text on the lightest gradient stops gives ≥11:1.

### 30.3 Footer Design (Revised)

```
Background:  Transparent — page gradient continues through the footer (darkest stop: #E2C9EE / brand-200)
Border-top:  1px solid rgba(205, 163, 224, 0.35) — soft brand-tinted separator
Text:        text-foreground (#211a2b / neutral-800) for headings, text-muted-foreground (#8B7F97 / neutral-500) for secondary
Links:       text-muted-foreground, hover to text-primary (#4D1B65)
Logo:        text-primary (brand purple), not white
Socials:     bg-primary/10 icons with text-primary — matches the light surface
Layout:      3-column grid (Logo + description + socials, platform links, contact)
```

---

## 31. Frontend Architecture — Landing Page Components

### 31.1 Component Tree

```
src/
├── features/
│   └── home/
│       └── HomePage.tsx              ← Public Home page component
├── components/
│   ├── layout/
│   │   ├── PublicLayout.tsx          ← Light header, light main wrapper, dark footer
│   │   └── Header.tsx / Footer.tsx
│   └── ui/                           ← Shared UI primitives (Button, Badge, etc.)
```

### 31.2 Light Hero Background Component Example

```tsx
export function LightHeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Light Mesh Layer */}
      <div className="absolute inset-0 hero-mesh-light" />
      {/* Soft Purple Radial Glow behind H1 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(153,57,198,0.12),transparent_55%)] blur-2xl" />
    </div>
  );
}
```

---

## 32. Technologies — Stack Decisions

| Technology                        | Use for                                                                  | Do NOT use for                            |
| --------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------- |
| **Tailwind CSS v4**               | Layout, light background tints (`bg-brand-50`), spacing, typography      | Hardcoded inline hex values in components |
| **CSS Custom Properties**         | Light theme tokens & landing page tokens                                 | Overriding core dashboard tokens in §2    |
| **`tw-animate-css` / Native CSS** | Timeline reveal animations (`opacity`, `translateY`), scroll transitions | Frame-heavy JS animation loops            |
| **SVG Patterns**                  | Low-opacity background texture overlays (`opacity-[0.08]`)               | Large unoptimized graphic assets          |

---

## 33. Performance

### 33.1 Light Mode Performance Guidelines

- **Minimal backdrop-filter usage**: Restricted to sticky header blur (`backdrop-filter: blur(12px)`).
- **GPU compositing**: Animate only GPU-friendly properties (`opacity`, `transform`).
- **Image assets**: Tiled pattern assets (`/images/patterns.png`) kept small and cached.
- **Progressive enhancement**: Content is rendered cleanly without JS dependencies.

---

## 34. Design Tokens — Complete Landing Page Token Set

Complete CSS token declaration for light marketing routes — all sections including CTA and Footer are light (§30 revised):

```css
.landing-page-light {
  /* ── Canvas Backgrounds ── */
  --bg-hero: #ffffff;
  --bg-section-white: #ffffff;
  --bg-section-alt: #faf9fb; /* neutral-50 */
  --bg-section-tint: #f9f3fc; /* brand-50 */

  /* ── Continuous Page Gradient (new — replaces former dark CTA/Footer) ── */
  --gradient-page: linear-gradient(to bottom, #ffffff 0%, #f9f3fc 25%, #f1e3f7 60%, #e2c9ee 100%);

  /* ── Light Mode Glows ── */
  --glow-hero-halo: rgba(153, 57, 198, 0.12);
  --glow-card-soft: rgba(181, 115, 211, 0.15);

  /* ── Light Mode Shadows ── */
  --shadow-card-sm: 0 2px 8px rgba(38, 12, 50, 0.04);
  --shadow-card-md: 0 8px 24px rgba(38, 12, 50, 0.06);
  --shadow-btn-primary: 0 4px 16px rgba(77, 27, 101, 0.2);

  /* ── Typography Colors (uniform across all sections including CTA + Footer) ── */
  --text-landing-main: #160f1e; /* neutral-900 — headings everywhere */
  --text-landing-sub: #5b4f68; /* neutral-600 — body / secondary */
  --text-landing-muted: #8b7f97; /* neutral-500 — captions, footer links */

  /* ── Retained for reference / potential future use (NOT applied to public page) ── */
  --bg-cta-gradient-from: #4d1b65; /* brand-700 — reserved */
  --bg-cta-gradient-to: #260c32; /* brand-900 — reserved */
  --bg-footer-base: #0f0616; /* darkest   — reserved */
  --text-cta-heading-dark: #ffffff; /* white on dark — reserved */
  --text-footer-muted-dark: #c7b9d1; /* muted on dark  — reserved */
}
```

---

_Sections 23–34 updated to Light Premium Minimalism with depth (matching public site implementation). All additions are additive — §1–22 remain completely untouched._
