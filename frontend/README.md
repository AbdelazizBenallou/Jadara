# JADARA (جدارة)

> National Competency Verification & Talent Matching Platform — Front-End Application.

---

## 🚀 Tech Stack

- **Core**: React 19, TypeScript, Vite
- **Routing & Framework**: TanStack Start & TanStack Router (File-based routing under `src/routes/`)
- **Styling**: Tailwind CSS v4, Lucide Icons, Shadcn UI Primitives
- **State & API**: TanStack Query (server state) + Axios (`apiClient`) connected to the real Node.js/PostgreSQL backend
- **Localization (i18n)**: `react-i18next` supporting Arabic (RTL, default), English (LTR), and French (LTR)
- **Typography**: Lama Sans (Arabic & Latin display font) + Inter / IBM Plex Sans Arabic (body)

---

## 🛠️ Getting Started

> **Package Manager**: Standardize on **`npm`** (`package-lock.json`). Do not mix with `yarn` or `pnpm`.

### Installation

```bash
npm install
```

### Development Server

Run the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

Verify TypeScript, router tree generation, and asset bundling:

```bash
npm run build
```

---

## 📚 Key Reference Documents

Before making design or content changes, consult:

1. **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** — Source of truth for design tokens, purple color scale (`#4D1B65`), Lama Sans typography rules, surface elevation, and status badge styling.
