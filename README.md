<div align="center">

# JADARA · جدارة

**National Competency Verification & Talent Matching Platform**

An end-to-end platform where Algerian candidates build verified competency profiles
(CV, skills, projects, evidence), reviewers validate them against domain rubrics,
and companies discover pre-vetted talent across all 69 wilayas.

[![Node](https://img.shields.io/badge/Node-24-5FA04E?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-087EA4?logo=react&logoColor=white)](https://react.dev)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![License](https://img.shields.io/badge/License-UNLICENSED-lightgrey.svg)](#license)

`Arabic (RTL) · English · French`

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Repository Layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
  - [Option A — Docker Compose (recommended)](#option-a--docker-compose-recommended)
  - [Option B — Local development](#option-b--local-development)
- [Default Accounts](#default-accounts)
- [Environment Variables](#environment-variables)
- [Database & Prisma](#database--prisma)
- [npm Scripts Reference](#npm-scripts-reference)
- [API Reference](#api-reference)
- [Frontend](#frontend)
- [Production Deployment](#production-deployment)
- [Security Notes](#security-notes)
- [Known Limitations & Roadmap](#known-limitations--roadmap)
- [Documentation Index](#documentation-index)

---

## Overview

JADARA replaces unverified CVs with a **competency verification loop**:

```
Candidate  →  builds profile, skills & projects  →  submits for review
Reviewer   →  validates against a domain rubric  →  rates with evidence
Company    →  browses verified talent only
Admin      →  approves registrations, manages RBAC, catalog & domains
```

The API issues **JWT access/refresh pairs in `httpOnly` cookies** with rotation,
enforces a **role → permission** RBAC matrix, stores all binary assets in **MinIO**
(S3-compatible) with presigned download URLs, and renders **ATS-friendly CV PDFs**
from a LaTeX template. The frontend is an **RTL-first** React SPA with a full
bilingual/trilingual design system.

---

## Features

| Area | Capabilities |
|---|---|
| **Authentication** | Register / login / logout / refresh-token rotation / change-password, argon2id hashing, rate limiting, login history & device fingerprinting, origin-check CSRF defence |
| **RBAC** | 4 roles (`Admin`, `Reviewer`, `Company`, `Beneficiary`) × 19 granular permissions, 60 s permission cache |
| **Registration workflow** | Beneficiary = instant activation; Reviewer / Company = pending demand requiring admin approval (with e-mail notification on approve/reject) |
| **Profile & CV** | Profile, avatar upload, work experience, education, certifications, languages with proficiency, social links |
| **CV PDF engine** | LaTeX (`ats-cv.tex`) → PDF, versioned per language (`AR`/`EN`/`FR`), generation status polling & history |
| **Projects & evidence** | Project CRUD → submit → review, evidence upload (file or external link), reviewer rating (1–5 + feedback) |
| **Catalog** | Domains, sub-domains, skills, skill levels, skill↔domain mapping, 69 wilayas |
| **Documents** | Generic upload/download/delete with presigned URLs |
| **Platform** | Swagger/OpenAPI docs, structured response envelopes, pagination metadata, Pino logging, helmet, CORS, Zod validation, health endpoint, PM2 process management |

---

## Tech Stack

### Frontend — `frontend/`

| Layer | Technology |
|---|---|
| Framework | **React 19** on **TanStack Start** (SSR via Nitro) |
| Routing | **TanStack Router** — file-based, auto-generated route tree |
| Build | **Vite 8** |
| Language | **TypeScript 5.8** (strict) |
| Styling | **Tailwind CSS v4** (CSS-first config) + `tw-animate-css` |
| Components | **shadcn/ui** (new-york) on **Radix UI** — 47 primitives |
| Server state | **TanStack Query 5** |
| HTTP | **Axios** with `withCredentials` + 401 auto-refresh queue |
| i18n | **i18next / react-i18next** — `ar` (default, RTL), `en`, `fr` |
| Forms | **react-hook-form** + **Zod** resolvers |
| Charts / UI | **Recharts**, **Lucide**, **sonner**, **date-fns** |
| Package manager | **npm** (do not mix with yarn/pnpm) |

### Backend — `backend/`

| Layer | Technology |
|---|---|
| Runtime | **Node.js 24** (ESM) |
| Framework | **Express 5** |
| Language | **TypeScript 5.9** (strict, ES2022) |
| ORM | **Prisma 6** → **PostgreSQL** |
| Auth | **jsonwebtoken** + **argon2** (argon2id, cost 64 MiB / t=3 / p=4) |
| Validation | **Zod 4** (env schema + request bodies/queries) |
| Storage | **MinIO** (S3-compatible) via `minio` client + **multer** (memory) |
| Mail | **Nodemailer** (SMTP) |
| Security | `helmet`, `cors`, `rate-limiter-flexible`, origin-check middleware |
| Observability | **Pino** (+ `pino-pretty` in dev) |
| Docs | **swagger-jsdoc** + **swagger-ui-express** |
| Process manager | **PM2** (`ecosystem.config.cjs`) |

### Infrastructure

| Service | Image | Host port | Purpose |
|---|---|---|---|
| `database` | `postgres:18` | internal only | Primary datastore, volume `postgres_data` |
| `api` | built from `backend/Dockerfile` | **3001** → 3000 | Express REST API |
| `minio` | `quay.io/minio/minio` | **9000** (console 9001) | Object storage, volume `minio_data` |
| `frontend` | built from `frontend/Dockerfile` | **3000** | React app *(commented out in compose by default)* |

> **Container-to-container addressing:** services address each other by **service name**
> (`database:5432`, `minio:9000`) — **never** `localhost`. Only the browser uses `localhost`.

---

## Architecture

```
┌──────────────┐        HTTPS         ┌───────────────────────┐
│   Browser    │  ─────────────────►  │  Nginx (TLS term.)     │
│  RTL / SPA   │  ◄─────────────────  │  jadara / api / files │
└──────────────┘                      └───────────┬───────────┘
                                                   │
              ┌────────────────────────────────────┼─────────────────────────┐
              │                                    │                         │
      ┌───────▼────────┐                ┌──────────▼─────────┐     ┌─────────▼────────┐
      │  Frontend :3000│                │     API :3001      │     │  MinIO :9000     │
      │ React/Start    │───  /v1  ─────►│  Express 5         │────►│  S3 buckets      │
      │ Vite + Nitro   │                │  /v1/*  /health    │     │  avatars         │
      └────────────────┘                └──────────┬─────────┘     │  documents       │
                                                  │               │  evidence         │
                                       ┌──────────▼─────────┐     │  certifications  │
                                       │  PostgreSQL :5432  │     └──────────────────┘
                                       │  Prisma ORM        │
                                       └────────────────────┘
```

**Backend layering** — every request flows `Routes → Controller → Service → Repository → Prisma`:

```
backend/
├── framework/
│   ├── config/       env (Zod) · logger (Pino) · minio · prisma · swagger
│   ├── middleware/   verifyAccessToken · checkPermission · zodValidate · upload
│   │                 rateLimiter · originCheck · errorHandler · requestId …
│   ├── types/        Express type augmentation
│   └── utils/        AppError · jwt · hash · storage · email · cache · pagination
├── prisma/           schema.prisma · migrations/ · seed.ts
├── src/
│   ├── app.ts        middleware pipeline, /v1 mounts, /health, Swagger
│   ├── index.ts      bootstrap: env → logger → prisma → bucket creation → listen
│   └── modules/      auth · users · roles · permissions · domains · skills
│                     languages · projects · reviews · demands · documents · cv-pdf
└── templates/        ats-cv.tex   (LaTeX CV source)
```

> Each module keeps its own `*.routes.ts` → `*.controller.ts` → `*.service.ts` →
> `*.repository.ts` → `*.schema.ts` (Zod) → `*.types.ts` chain.

---

## Repository Layout

```
jadara/
├── docker-compose.yml          # database + api + minio (+ optional frontend)
├── .env.db                     # Postgres credentials
├── .env.minio                  # MinIO root credentials
├── backend/
│   ├── Dockerfile
│   ├── ecosystem.config.cjs    # PM2 (dev + production env blocks)
│   ├── prisma/                 # schema.prisma, 14 migrations, seed.ts, ER diagrams
│   ├── framework/              # config · middleware · utils · types
│   ├── src/modules/            # 11 feature modules
│   ├── templates/ats-cv.tex    # CV → PDF template
│   └── doc/                    # architecture.md + per-endpoint docs + diagrams
├── frontend/
│   ├── Dockerfile
│   ├── DESIGN_SYSTEM.md        # 34-section design source of truth
│   ├── components.json         # shadcn/ui config
│   ├── copy_assets.cjs         # predev / prebuild asset step
│   └── src/
│       ├── routes/             # 43 TanStack Router route files
│       ├── features/           # home · auth · profile · cv-builder · projects
│       │                       # reviewer · company · admin · about · faq
│       ├── components/         # ui/ (shadcn) · common/ · layout/ · table/ · feedback/
│       ├── context/            # Auth · Language · Theme
│       ├── i18n/               # ar.json · en.json · fr.json
│       └── api/client.ts       # Axios instance + refresh interceptor
└── Production_env/             # production env reference
```

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| **Node.js** | ≥ 20 (24 recommended) | Matches `node:24-alpine` images |
| **npm** | ≥ 10 | Ships with Node; **npm only** — no yarn/pnpm |
| **Docker + Docker Compose** | v2 / v5+ | Easiest path — brings Postgres & MinIO with it |
| **PostgreSQL** | 16+ (18 in compose) | Only needed for Option B |
| **MinIO** | latest | Only needed for Option B |
| **TeX Live** (`pdflatex`) | any recent | **Required for CV → PDF.** Not installed in the API image |

```bash
node -v    # v22+ / v24
npm -v     # 10+
docker compose version
pdflatex --version   # only for CV PDF generation
```

---

## Quick Start

### Option A — Docker Compose (recommended)

Brings up **PostgreSQL + API + MinIO** in one command.

```bash
# 0. Clone
git clone <repo-url> jadara
cd jadara

# 1. Review the resolved Compose config (catches syntax errors early)
docker compose config

# 2. Create your local env files (they are git-ignored)
cp backend/.env.example backend/.env        # then edit it — see Environment Variables

# 3. Build images
docker compose build

# 4. Start the stack in the background
docker compose up -d
docker compose ps
```

```bash
# 5. Apply database migrations
docker compose exec api npm run db:migrate

# 6. Seed roles, permissions, domains, skills, languages, admin users
docker compose exec api npm run db:seed
```

```bash
# 7. Verify everything is healthy
curl http://localhost:3001/health
# {"status":"ok","database":"connected",...}
```

| URL | What |
|---|---|
| `http://localhost:3001/health` | API health + DB connectivity |
| `http://localhost:3001/api-docs` | **Swagger UI** — full interactive API reference |
| `http://localhost:3001/api-json` | Raw OpenAPI 3 spec |
| `http://localhost:9000` | MinIO S3 API (console on `:9001`, not published) |
| `http://localhost:3000` | Frontend (see below) |

**Start the frontend in Docker** — the `frontend` service is commented out in
`docker-compose.yml` by default. Either uncomment it (lines 24–34) or run it locally:

```bash
docker compose build frontend
docker compose up -d frontend
```

**Lifecycle & diagnostics:**

```bash
docker compose ps                          # container states
docker compose logs -f                     # all logs
docker compose logs -f api                 # one service
docker compose logs -f --tail=200 minio    # last 200 lines
docker stats                               # live CPU / RAM / IO

docker compose down                        # stop (keeps volumes)
docker compose down -v                     # stop and DELETE all data
docker compose restart api                 # restart one service
docker compose build api && docker compose up -d api   # rebuild one service
```

> **Note:** no source directories are volume-mounted, so code changes require a
> rebuild (`docker compose build api && docker compose up -d api`). For live-reload
> development prefer **Option B**.

---

### Option B — Local development

Run Postgres and MinIO in Docker, the API and frontend on your host (hot reload).

```bash
git clone <repo-url> jadara
cd jadara

# ── 1. Infrastructure only ────────────────────────────────────────────────
# Expose Postgres to the host by adding a ports mapping to the
# `database` service in docker-compose.yml:
#
#   database:
#     ports:
#       - "5432:5432"
docker compose up -d database minio
```

```bash
# ── 2. Backend ────────────────────────────────────────────────────────────
cd backend
npm install

cp .env.example .env
# Edit .env — for host-based development use localhost, not service names:
#   DATABASE_URL=postgresql://jadara_user:YOUR_PASSWORD@localhost:5432/jadara
#   MINIO_ENDPOINT=localhost
#   API_URL=http://localhost:3001
#   CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:3001
#   ACCESS_SECRET=<random string, min 16 chars>
#   REFRESH_SECRET=<random string, min 16 chars>

npm run db:generate     # generate the Prisma client
npm run db:migrate      # create + apply migrations
npm run db:seed         # seed roles, permissions, catalog, admin users

npm run dev             # nodemon + tsx watch  →  http://localhost:3001
```

```bash
# ── 3. Frontend (second terminal) ─────────────────────────────────────────
cd frontend
npm install

# Frontend reads VITE_API_URL; without a .env it defaults to http://localhost:3000
#   echo 'VITE_API_URL=http://localhost:3001' > .env
npm run dev             # → http://localhost:3000
```

```bash
# ── 4. Sanity check ───────────────────────────────────────────────────────
curl http://localhost:3001/health
open http://localhost:3001/api-docs
open http://localhost:3000
```

---

## Default Accounts

Created by `npm run db:seed` (idempotent — safe to re-run).

| Email | Password | Role |
|---|---|---|
| `admin@jadara.com` | `Admin@12345` | `Admin` — full access, not publicly selectable |
| `reviewer@jadara.com` | `Reviewer@12345` | `Reviewer` — reviews projects in assigned domains |

> **Change these immediately in any shared or production environment.**

The seed also provisions **19 permissions**, **3 selectable roles**
(`Beneficiary`, `Reviewer`, `Company`), **8 domains**, **32 skills** mapped to those
domains, and **27 languages**.

---

## Environment Variables

All backend variables are **validated by a Zod schema at boot** — a missing required
value or a short JWT secret prints `❌ Invalid environment variables:` and exits.

### `backend/.env` — core

| Variable | Required | Default | Purpose |
|---|:---:|---|---|
| `NODE_ENV` | — | `development` | `development` \| `production` \| `test` |
| `PORT` | — | `3000` | API listen port (host-mapped to `3001`) |
| `API_URL` | — | `http://localhost:3000` | Public API base URL; Swagger `servers[0]` |
| `CORS_ORIGINS` | — | `*` | Comma-separated allow-list; also drives the origin/CSRF check |
| `SWAGGER_ENABLED` | — | `true` (`false` in prod) | Mounts `/api-docs` + `/api-json` |
| `DATABASE_URL` | ✅ | — | `postgresql://user:pass@host:5432/db` |
| `ACCESS_SECRET` | ✅ (≥16) | — | JWT access-token signing secret |
| `REFRESH_SECRET` | ✅ (≥16) | — | JWT refresh-token signing secret |
| `ACCESS_EXPIRY` | — | `15m` | Access-token TTL |
| `REFRESH_EXPIRY` | — | `7d` | Refresh-token TTL |
| `FRONTEND_URL` | — | — | Absolute web URL, used in e-mail links |

### `backend/.env` — uploads & storage

| Variable | Required | Default | Purpose |
|---|:---:|---|---|
| `UPLOAD_DIR` | — | `uploads` | Local fallback directory |
| `UPLOAD_MAX_FILE_SIZE` | — | `10485760` (10 MB) | Multer limit — documents, evidence, CVs |
| `UPLOAD_MAX_AVATAR_SIZE` | — | `2097152` (2 MB) | Multer limit — avatars |
| `MINIO_ENDPOINT` | — | `localhost` | `minio` in Docker, `localhost` on host |
| `MINIO_PORT` | — | `9000` | |
| `MINIO_ACCESS_KEY` | — | `minioadmin` | |
| `MINIO_SECRET_KEY` | — | `minioadmin` | |
| `MINIO_BUCKET` | — | `jadara` | Note: buckets are hard-coded in `framework/config/minio.ts` |
| `MINIO_USE_SSL` | — | `false` | Set `true` in production |

Buckets `avatars`, `documents`, `evidence`, `certifications` are created
automatically at startup.

### `backend/.env` — e-mail (SMTP)

| Variable | Required | Default | Purpose |
|---|:---:|---|---|
| `SMTP_HOST` | — | `127.0.0.1` | |
| `SMTP_PORT` | — | `25` | |
| `SMTP_SECURE` | — | `false` | `true` for implicit TLS (port 465) |
| `SMTP_USER` | — | — | Optional, for authenticated relay |
| `SMTP_PASS` | — | — | Optional |
| `SMTP_FROM` | — | — | `From:` header |

### `frontend/.env`

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Base URL; the client appends `/v1` and sends cookies |

### `docker-compose.yml` service env files

| File | Keys |
|---|---|
| `.env.db` | `POSTGRES_HOST` · `POSTGRES_USER` · `POSTGRES_PASSWORD` · `POSTGRES_DB` |
| `.env.minio` | `MINIO_ROOT_USER` · `MINIO_ROOT_PASSWORD` |
| `backend/.env` | Loaded by the `api` service |

---

## Database & Prisma

31 models / 6 enums, snake_case tables, explicit `@@index` on every foreign key,
`onDelete: Cascade` on user-owned relations.

<details>
<summary><b>Model groups</b></summary>

| Group | Models |
|---|---|
| Identity & auth | `users` · `profiles` · `roles` · `permissions` · `role_permissions` · `refresh_tokens` |
| Security telemetry | `login_history` · `devices` · `audit_logs` |
| CV & profile | `work_experience` · `education` · `certifications` · `user_languages` · `languages` · `user_socials` · `social_platforms` |
| CV generation | `cv_generation_requests` · `cv_versions` |
| Catalog | `domains` · `sub_domains` · `skill_categories` · `skills` · `skill_domains` · `user_skills` |
| Verification | `projects` · `evidence` · `project_reviews` · `reviewer_domains` |
| Workflow | `demands` · `demand_domains` · `documents` |

Enums: `UserStatus` · `DemandStatus` · `ProjectStatus` · `SkillLevel` ·
`LanguageProficiency` · `AuditAction` · `CVLanguage`

</details>

### Commands

```bash
npm run db:generate    # regenerate the Prisma client after schema edits
npm run db:migrate     # create + apply a migration (dev)
npx prisma migrate deploy   # apply existing migrations (production — never generates)
npm run db:push        # push the schema directly, skipping migrations (prototyping)
npm run db:studio      # open Prisma Studio
npm run db:seed        # idempotent seed
npm run seed           # alias of the above
```

In Docker, prefix with `docker compose exec api`.

**Diagrams:** `backend/prisma/schema_er.svg` · `backend/prisma/schema_er.puml` ·
`backend/doc/diagrams/schema.png` · `use_case_diagram` · `sequence_login` ·
`sequence_registration` · class diagrams.

---

## npm Scripts Reference

### Backend (`backend/`)

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `nodemon --exec tsx src/index.ts` | Dev server with hot reload |
| `npm run build` | `tsc -p tsconfig.build.json` | Compile TypeScript → `dist/` |
| `npm start` | `node dist/src/index.js` | Run the compiled build |
| `npm run db:migrate` | `prisma migrate dev` | Create + apply a migration |
| `npm run db:generate` | `prisma generate` | Regenerate the Prisma client |
| `npm run db:push` | `prisma db push` | Sync schema without a migration |
| `npm run db:studio` | `prisma studio` | Prisma Studio GUI |
| `npm run seed` / `npm run db:seed` | `tsx prisma/seed.ts` | Seed baseline data |
| `npm run lint` / `lint:fix` | `eslint` | Lint (see [limitations](#known-limitations--roadmap)) |
| `npm run format` | `prettier --write` | Format |
| `npm test` / `test:coverage` | `vitest` | Tests (runner not yet installed) |

### Frontend (`frontend/`)

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `vite dev` | Dev server with HMR (runs `predev` → `copy_assets.cjs`) |
| `npm run build` | `vite build` | Production build (runs `prebuild`) |
| `npm run build:dev` | `vite build --mode development` | Dev-mode production build |
| `npm run preview` | `vite preview` | Serve the production build locally |
| `npm run lint` | `eslint .` | Lint |
| `npm run format` | `prettier --write .` | Format |

---

## API Reference

Base path **`/v1`**. Interactive docs at **`/api-docs`**, OpenAPI spec at **`/api-json`**.

<details>
<summary><b>Endpoint overview</b></summary>

| Module | Base path | Guard | Highlights |
|---|---|---|---|
| Auth | `/v1/auth` | public + rate-limited | `register` · `login` · `refresh-token` · `change-password` · `logout` |
| Users | `/v1/users` | access token | `/me/profile` · `/me/activity` · `/me/socials` · `/me/skills` · `/me/work-experience` · `/me/education` · `/me/certifications` · `/me/languages` · `/me/pdf-generate` · `/me/pdf-status` · `/me/pdf-history` · `/:id/profile` (public) · admin CRUD |
| Roles | `/v1/roles` | public list, `manage_roles` otherwise | CRUD · `/:id/permissions` · `/:id/users` |
| Permissions | `/v1/permissions` | `manage_roles` | CRUD · `/:id/roles` |
| Domains | `/v1/domains` | public list, `view_domains` / `manage_users` | CRUD · `/:id/skills` · `/reviewers` · `/:id/reviewers` |
| Skills | `/v1/skills` | `view_skills` / `create_skill` / … | CRUD |
| Languages | `/v1/languages` | reuses skill permissions | CRUD |
| Projects | `/v1/projects` | access token | CRUD · `/:id/submit` · `/:id/evidence` · `/all` · `/user/:userId` · `/:id/status` (admin) |
| Reviews | `/v1/reviews` | `review_projects` | `/available` · `/history` · `/:id` · `/:projectId/rate` |
| Demands | `/v1/demands` | `manage_users` | list · `/:id` · `/:id/approve` · `/:id/reject` |
| Documents | `/v1/documents` | access token | list · `/:id` · `/upload` · `DELETE /:id` |
| Health | `/health` | public | `SELECT 1` + uptime (503 if the DB is down) |

</details>

### Response envelope

```jsonc
// success
{ "success": true, "data": { /* … */ }, "message": "OK" }

// paginated
{ "success": true, "data": [ /* … */ ],
  "meta": { "total": 120, "page": 1, "limit": 20, "totalPages": 6, "nextCursor": null } }

// error
{ "success": false, "message": "Access token expired", "errors": [ /* … */ ] }
```

| Code | Meaning |
|---|---|
| `200` / `201` | Success / created |
| `400` | Bad request |
| `401` | Unauthenticated, or invalid/expired token |
| `403` | Authenticated but lacking permission, account inactive, or origin rejected |
| `404` | Not found |
| `409` | Conflict |
| `422` | Validation failure (Zod field errors) |
| `429` | Rate limit exceeded |

### Authentication

Tokens are delivered as **`httpOnly` cookies** (`sameSite: strict`; `secure` in
production) — a `Bearer` header is also accepted.

| Cookie | Path | Max age |
|---|---|---|
| `accessToken` | `/` | 15 min |
| `refreshToken` | `/v1/auth` | 7 days |

Refresh tokens are stored **argon2id-hashed** and rotated on every refresh (all
prior tokens are revoked). Refresh tokens are read and sent with `credentials: "include"`,
and the frontend transparently retries failed requests after a refresh.

```bash
# quick smoke test
curl -c cookies.txt -X POST http://localhost:3001/v1/auth/login \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3000' \
  -d '{"email":"admin@jadara.com","password":"Admin@12345"}'

curl -b cookies.txt http://localhost:3001/v1/users/me/profile
```

> Mutation requests (`POST` / `PUT` / `PATCH` / `DELETE`) must carry an
> `Origin` or `Referer` header present in `CORS_ORIGINS`, otherwise the
> `originCheck` middleware answers `403 Origin not allowed`.

---

## Frontend

**File-based routing** — the only root layout is `src/routes/__root.tsx`.
`src/routeTree.gen.ts` is auto-generated by the TanStack Router plugin; never edit it.

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
npm run build
npm run preview
```

| Area | Routes |
|---|---|
| Public | `/` · `/about` · `/faq` · `/login` · `/register` (+ `beneficiary`, `reviewer`, `company`) · `/sitemap.xml` (SSR) |
| Beneficiary | `/dashboard` · `/dashboard/profile` · `/dashboard/settings` · `/dashboard/skills` · `/dashboard/cv-builder` · `/dashboard/projects/*` |
| Reviewer | `/reviewer` · `/reviewer/queue` · `/reviewer/domains` · `/reviewer/reviewed` · `/reviewer/project/:id` · `/reviewer/review-details/:reviewId` · `/reviewer/talent/:id` |
| Company | `/company` · `/company/talent/:id` |
| Admin | `/admin` · `/admin/users` · `/admin/roles` · `/admin/skills` · `/admin/domains` · `/admin/projects` · `/admin/requests` |

Provider order in `__root.tsx`: `QueryClientProvider` → `LanguageProvider` →
`ThemeProvider` → `AuthProvider`.

**Conventions to respect:**
- `npm` only, never yarn/pnpm.
- Consult [`frontend/DESIGN_SYSTEM.md`](./frontend/DESIGN_SYSTEM.md) before any visual change — purple scale `#4D1B65`, Lama Sans display / Inter body, RTL via logical properties (`ms-*` / `me-*` / `border-inline-start`).
- Reference docs live in [`backend/README.md`](./backend/README.md) and [`frontend/README.md`](./frontend/README.md).

---

## Production Deployment

### Build

```bash
# API
cd backend
npm ci
npm run build                     # → dist/
npx prisma migrate deploy        # apply migrations, never generate in prod
npm run db:seed                  # optional: first boot only

# Frontend
cd ../frontend
npm ci
npm run build                     # → .output/  (Nitro SSR)
```

### Run with PM2

```bash
cd backend
npm i -g pm2
pm2 start ecosystem.config.cjs --env production
pm2 reload ecosystem.config.cjs --env production --update-env   # zero-downtime reload
pm2 logs jadara-api
pm2 monit
pm2 save && pm2 startup
```

The PM2 config runs `dist/src/index.js` in `fork` mode with a 500 MB
`max_memory_restart`, logging to `logs/out.log` and `logs/err.log`.

### Nginx / TLS topology

```
https://jadara.sytes.net      →  Frontend (Nitro / static build)
https://api.jadara.com        →  API  :3001
https://files.jadara.com      →  MinIO :9000
```

- Nginx terminates TLS (Let's Encrypt) and reverse-proxies all three.
- **PostgreSQL and the MinIO console must never be exposed publicly.**
- Presigned object URLs must be minted with the public HTTPS origin
  (`https://files.jadara.com/...`), never `http://minio:9000/...`.
- Set `MINIO_USE_SSL=true`, `CORS_ORIGINS=https://jadara.sytes.net`,
  `SWAGGER_ENABLED=false`, and a strong unique `ACCESS_SECRET` / `REFRESH_SECRET`.
- Hashed Vite assets under `assets/` are immutable — cache them for a year.
  Never cache `/auth/*`, profile, or any private API response.
- Run **at most** one frontend instance at a time: PM2/Docker restart counters and
  port conflicts come from starting duplicate stacks on the same host.

---

## Security Notes

- `.gitignore` already excludes `.env`, `.env.*`, `backend/.env.production`,
  `.env.db`, `.env.minio`, and credential-bearing docs.
- **`Production_env/env.txt` and `backend/.env.production` contain real
  production credentials in this working tree. Rotate the database password,
  both JWT secrets, and the MinIO keys, then purge them from git history.**
- Never commit `.env`; use `backend/.env.example` as the template.
- Generate strong secrets: `openssl rand -base64 48`.
- Argon2id parameters (`memoryCost: 65536`, `timeCost: 3`, `parallelism: 4`) are
  tuned for this workload — do not lower them for speed.
- A Nikto scan of the production host is in `backend/tests/nikto_report.txt`:
  outdated Nginx and missing `Referrer-Policy`, `Content-Security-Policy`,
  `X-Content-Type-Options`, `Strict-Transport-Security`, `Permissions-Policy`.
  Close these at the Nginx layer.
- Planned hardening backlog: refresh-token reuse detection, account lockout after
  5 failures, e-mail verification, CSRF tokens, password history, session limits,
  +213 phone validation, 2FA — see `backend/doc/important/auth-v2.txt`.

---

## Known Limitations & Roadmap

**Worth fixing before scaling further:**

1. `backend/package.json` scripts `test`, `lint`, `format` reference `vitest`,
   `eslint`, and `prettier`, but those packages and their configs are absent —
   those commands currently fail. `frontend` lint/format are configured correctly.
2. Zero automated tests. `backend/tests/` holds only text artifacts. Add Vitest
   plus a config, then cover auth, RBAC, and the project-review flow.
3. `docker-compose.yml` has no `depends_on` or `healthcheck` — migrations can race
   Postgres at startup. Add both.
4. The `frontend` service is commented out; no volume mounts, so Docker-based
   development has no hot reload.
5. `pdflatex` is a documented prerequisite but is missing from `backend/Dockerfile`
   — CV → PDF fails inside the container. Add a TeX Live layer or a sidecar.
6. `frontend/src/assets/` is absent in this checkout, so `copy_assets.cjs` cannot
   populate `public/fonts` (`LamaSans-*.woff2`) — the display font will fall back.
7. `audit_logs` exists in the schema with no code writing to it, and
   `src/modules/permissions/` is an empty stub (permissions live inside `roles`).
8. `MINIO_BUCKET` is read by the env schema but the actual buckets are hard-coded
   in `framework/config/minio.ts`.
9. No CI (`.github/` does not exist), no `LICENSE`, no `CONTRIBUTING.md`, no
   `CHANGELOG.md`.
10. Docker Compose is the right orchestration layer for four services. Kubernetes
    only becomes justified with multiple replicas, auto-scaling, or rolling
    zero-downtime deploys.

**Next up:** production frontend pipeline (`vite build` → static assets → Nginx),
password-reset endpoints (the frontend pages exist, the API does not), and e-mail
verification.

---

## Documentation Index

| Document | Contents |
|---|---|
| [`backend/README.md`](./backend/README.md) | Full API reference: endpoints, curl examples, env table, registration flows, response conventions |
| [`backend/doc/architecture.md`](./backend/doc/architecture.md) | Layering, request flows, JWT/RBAC diagrams, rate-limit table |
| [`backend/doc/important/auth-v2.txt`](./backend/doc/important/auth-v2.txt) | Prioritised auth-hardening backlog |
| [`backend/doc/{auth,users,domains,skills,projects,reviews,demands,db_mang}/`](./backend/doc) | Per-endpoint reference and curl recipes |
| [`backend/prisma/schema_er.svg`](./backend/prisma/schema_er.svg) | Entity-relationship diagram |
| [`frontend/DESIGN_SYSTEM.md`](./frontend/DESIGN_SYSTEM.md) | Design tokens, components, RTL rules, WCAG AA |
| [`frontend/src/routes/README.md`](./frontend/src/routes/README.md) | File-based routing conventions |
| [`Exp.md`](./Exp.md) | Docker & production notes: topology, caching, scaling, monitoring |

---

## License

**UNLICENSED — All rights reserved.** This repository is proprietary and
confidential. No permission is granted to use, copy, modify, or distribute it
without prior written authorization from the copyright holder.

---

<div align="center">
Built with care in Algeria · <sub>JADARA — جدارة</sub>
</div>
