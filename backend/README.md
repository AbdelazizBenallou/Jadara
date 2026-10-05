# Jadara API

RESTful backend API built with Node.js, TypeScript, Express 5, PostgreSQL, Prisma ORM, and MinIO (S3) object storage.

---

## Tech Stack

- **Runtime** — Node.js 18+
- **Language** — TypeScript 6
- **Framework** — Express 5
- **Database** — PostgreSQL 16+
- **ORM** — Prisma 6
- **Object Storage** — MinIO (S3-compatible): avatars, uploaded documents, project evidence, certifications, generated CVs
- **Auth** — JWT (access + refresh tokens) with rotation, httpOnly cookies or Bearer header
- **Password** — Argon2id hashing
- **Validation** — Zod v4
- **Rate Limiting** — rate-limiter-flexible (in-memory)
- **CV generation** — Mustache templates → LaTeX → `pdflatex` PDF, stored in MinIO
- **Logging** — Pino
- **Process Manager** — PM2
- **API Docs** — Swagger / OpenAPI

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or higher
- [PostgreSQL](https://www.postgresql.org/) 16 or higher
- [MinIO](https://min.io/) (or any S3-compatible store) for uploads/CV files
- `pdflatex` on the PATH (only needed for CV PDF generation)
- npm (comes with Node.js)

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/your-username/jadara.git
cd jadara/backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your database credentials, JWT secrets, and MinIO connection:

```env
DATABASE_URL=postgresql://jadara_user:your_password@localhost:5432/jadara
ACCESS_SECRET=your-access-secret-min-16-chars
REFRESH_SECRET=your-refresh-secret-min-16-chars
PORT=3001
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=jadara
```

### 3. Setup database

```bash
# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# If you have an existing dev database that has drifted, push instead:
npx prisma db push

# Seed default data (domains, sub-domains, skills, languages, social platforms)
npx prisma db seed

# Seed roles, permissions, role permissions and default users
npm run db:seed:users
```

> `npx prisma db seed` runs `prisma/seed.ts`, which already calls the users
> seed at the end. Run `npm run db:seed:users` on its own to re-apply only
> roles, permissions, role permissions and default users (idempotent).
>
> Note: on a database that has been modified outside of the migration folder
> (`prisma migrate dev` reports drift), use `npx prisma migrate deploy` or
> `npx prisma db push` on top of the manual SQL.

### 4. Start the server

```bash
# Development (with hot reload)
npm run dev

# Production
npm run build
npm start
```

The server runs at `http://localhost:3001` (configurable via `PORT`).

---

## Default Accounts

Seeded by `prisma/seed_users.ts` — all with status `active`.

| Role          | Email                       | Password             |
| ------------- | --------------------------- | -------------------- |
| Admin         | `admin@jadara.com`          | `Admin@12345`        |
| Reviewer      | `reviewer@jadara.com`       | `Reviewer@12345`     |
| Company       | `company@jadara.com`        | `Company@12345`      |
| Beneficiary   | `beneficiary@jadara.com`    | `Beneficiary@12345`  |
| Organization  | `organization@jadara.com`   | `Organization@12345` |

> These are development credentials only — change or remove them before any
> shared deployment.

The seed also creates the **Beneficiary**, **Reviewer**, **Company**, and
**Organization** roles as selectable at registration (the Admin role is _not_
selectable), assigns each role its baseline permissions, plus the domain
catalog, skills linked to domains, and the common languages.

---

## Environment Variables

| Variable                 | Required | Default                 | Description                             |
| ------------------------ | -------- | ----------------------- | --------------------------------------- |
| `NODE_ENV`               | No       | `development`           | `development` or `production`           |
| `PORT`                   | No       | `3000`                  | Server port (project runs on 3001)      |
| `API_URL`                | No       | `http://localhost:3000` | Public API URL                          |
| `CORS_ORIGINS`           | No       | `*`                     | Comma-separated allowed origins         |
| `SWAGGER_ENABLED`        | No       | `true` in dev           | Enable Swagger UI                       |
| `DATABASE_URL`           | **Yes**  | —                       | PostgreSQL connection string            |
| `ACCESS_SECRET`          | **Yes**  | —                       | JWT access token secret (min 16 chars)  |
| `REFRESH_SECRET`         | **Yes**  | —                       | JWT refresh token secret (min 16 chars) |
| `ACCESS_EXPIRY`          | No       | `15m`                   | Access token lifetime                   |
| `REFRESH_EXPIRY`         | No       | `7d`                    | Refresh token lifetime                  |
| `MINIO_ENDPOINT`         | No       | `localhost`             | MinIO endpoint                          |
| `MINIO_PORT`             | No       | `9000`                  | MinIO port                              |
| `MINIO_ACCESS_KEY`       | No       | `minioadmin`            | MinIO access key                        |
| `MINIO_SECRET_KEY`       | No       | `minioadmin`            | MinIO secret key                        |
| `MINIO_BUCKET`           | No       | `jadara`                | MinIO root bucket                       |
| `MINIO_USE_SSL`          | No       | `false`                 | Use TLS for MinIO                       |
| `UPLOAD_DIR`             | No       | `uploads`               | Local fallback upload directory         |
| `UPLOAD_MAX_FILE_SIZE`   | No       | `10485760`              | Max file size (10MB)                    |
| `UPLOAD_MAX_AVATAR_SIZE` | No       | `2097152`               | Max avatar size (2MB)                   |

---

## Response Conventions

Every response uses one envelope:

```json
// success
{ "success": true, "message": "...", "data": ... }

// paginated lists additionally include meta
{
  "success": true,
  "message": "...",
  "data": [...],
  "meta": { "total": 35, "page": 1, "limit": 10, "totalPages": 4, "nextCursor": 2 }
}

// error
{ "success": false, "message": "why it failed" }

// validation error (422)
{ "success": false, "message": "Validation failed", "errors": { "field": ["problem"] } }
```

Common status codes: `201` created · `200` ok · `400` bad id/body · `401` no/expired token · `403` missing permission or inactive account · `404` not found · `409` conflict · `422` validation failed · `429` rate limited.

Auth tokens are delivered as httpOnly cookies by default; a `Bearer` header is also accepted. File references (avatars, documents, evidence, CVs) are returned as **short-lived presigned MinIO URLs** (`download_url` / `avatar_url`).

---

## Registration Flow

Registering goes through `POST /v1/auth/register` (limit: **30/hour** per IP). Behaviour depends on the selected role:

| Role        | Body                               | Result                                                                            |
| ----------- | ---------------------------------- | --------------------------------------------------------------------------------- |
| Beneficiary | JSON (`role_id=1`)                 | `201`, account **active immediately**, auth cookies set                           |
| Reviewer    | multipart `files[]` + `domain_ids` | `201`, status **pending**, a demand is created for admin approval, **no cookies** |
| Company     | multipart `files[]`                | `201`, status **pending**, a demand is created for admin approval, **no cookies** |

- Reviewer without at least one domain → `400 "Reviewer must select at least one domain"`.
- Reviewer/Company without an uploaded document → `400 "At least one document is required"`.
- Logging in while pending → `403 "Account is not active"`.
- Approval happens via the admin-facing `GET /v1/demands` → `POST /v1/demands/:id/approve` (see Demands).

---

## API Endpoints

### Auth

| Method | Path                       | Auth | Description                                                              |
| ------ | -------------------------- | ---- | ------------------------------------------------------------------------ |
| POST   | `/v1/auth/register`        | No   | Register (role-dependent flow, see above — `role_id` must be selectable) |
| POST   | `/v1/auth/login`           | No   | Login (records login history + device fingerprint)                       |
| POST   | `/v1/auth/refresh-token`   | No   | Refresh access token (token rotation)                                    |
| POST   | `/v1/auth/change-password` | Yes  | Change password                                                          |
| POST   | `/v1/auth/logout`          | Yes  | Logout, revoke refresh token                                             |

### Users

Self-service routes work for any authenticated user on their own account. Admin routes require the `manage_users` permission.

| Method | Path                             | Who   | Description                                                                                                                      |
| ------ | -------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/v1/users/me/profile`           | Self  | My profile (avatar_url presigned)                                                                                                |
| PATCH  | `/v1/users/me/profile`           | Self  | Update my profile                                                                                                                |
| GET    | `/v1/users/me/activity`          | Self  | My login history + devices                                                                                                       |
| GET    | `/v1/users/me/socials/platforms` | Self  | Social platform catalog (id + name) to pick from                                                                               |
| POST   | `/v1/users/me/socials`           | Self  | Add/update a social link (`platform_id` + `url`)                                                                               |
| DELETE | `/v1/users/me/socials/:socialId` | Self  | Remove a social link                                                                                                             |
| GET    | `/v1/users/:id/profile`          | Any   | **Public profile** of any user (profile, role, socials, work experience, education, certifications, languages, skills, projects) |
| GET    | `/v1/users`                      | Admin | List users (paginated)                                                                                                           |
| GET    | `/v1/users/:id`                  | Admin | Get user by ID                                                                                                                   |
| PATCH  | `/v1/users/:id`                  | Admin | Update user (status, role, names)                                                                                                |
| DELETE | `/v1/users/:id`                  | Admin | Delete user                                                                                                                      |

### CV Data (self-service, under `/v1/users/me`)

| Method                | Path                           | Description                                     |
| --------------------- | ------------------------------ | ----------------------------------------------- |
| GET/POST/PATCH/DELETE | `/v1/users/me/work-experience` | Work experience CRUD                            |
| GET/POST/PATCH/DELETE | `/v1/users/me/education`       | Education CRUD                                  |
| GET/POST/PATCH/DELETE | `/v1/users/me/certifications`  | Certifications CRUD (file upload, MinIO)        |
| GET/POST/PATCH/DELETE | `/v1/users/me/languages`       | Languages CRUD (from catalog, with proficiency) |
| POST                  | `/v1/users/me/pdf-generate`    | Generate CV PDF from profile data               |
| GET                   | `/v1/users/me/pdf-status`      | Latest generation status + download_url         |
| GET                   | `/v1/users/me/pdf-history`     | Generation history (paginated)                  |

`pdf-generate` returns `"status": "completed"` with a `download_url`, or
`"status": "incomplete"` with `missing_fields` (`education`, `languages`,
`skills`, `work_experience`). The generated CV includes experience, education,
**projects** (title, domain, URL, status, bullets), skills, certifications, and
languages.

### User Skills

Users pick skills from the existing catalog and attach a proficiency level. Levels are a DB enum: `beginner`, `intermediate`, `advanced`, `expert`.

| Method | Path                            | Who   | Description               |
| ------ | ------------------------------- | ----- | ------------------------- |
| GET    | `/v1/users/me/skills`           | Self  | My skills with levels     |
| POST   | `/v1/users/me/skills`           | Self  | Add skills (bulk)         |
| PATCH  | `/v1/users/me/skills/:skillId`  | Self  | Change one level          |
| DELETE | `/v1/users/me/skills/:skillId`  | Self  | Remove one skill          |
| GET    | `/v1/users/:id/skills`          | Admin | Any user's skills         |
| POST   | `/v1/users/:id/skills`          | Admin | Bulk-add for any user     |
| PATCH  | `/v1/users/:id/skills/:skillId` | Admin | Change level for any user |
| DELETE | `/v1/users/:id/skills/:skillId` | Admin | Remove from any user      |

Bulk add body and response (partial mode):

```json
// request
{ "skills": [ { "skill_id": 13, "level": "advanced" }, { "skill_id": 4, "level": "beginner" } ] }

// response — every id lands in exactly ONE bucket
{
  "success": true,
  "message": "Skills assigned successfully",
  "data": {
    "added":          [ { "skill_id": 13, "level": "advanced" } ],  // inserted
    "already_linked": [ { "skill_id": 4,  "level": "expert" } ],    // skipped, old level kept
    "not_found":      [777],                                        // refused & reported
    "skills":         [ ...full refreshed list... ]
  }
}
```

Duplicate `skill_id`s in one request are deduped (first level wins).

### Demands (Admin — registration reviews)

Company/Reviewer registrations create a pending demand that admins approve or reject. Approving a Reviewer activates the account and assigns the requested domains.

| Method | Path                      | Description                                                            |
| ------ | ------------------------- | ---------------------------------------------------------------------- |
| GET    | `/v1/demands`             | List demands (paginated; documents include `download_url`)             |
| GET    | `/v1/demands/:id`         | Demand detail with applicant info + documents                          |
| POST   | `/v1/demands/:id/approve` | Approve — activates the user, `reviewer_domains` written for reviewers |
| POST   | `/v1/demands/:id/reject`  | Reject with optional reason                                            |

Re-reviewing an already-decided demand → `409 "Demand is already reviewed"`.

### Domains

Skill categories (e.g. Web Development, AI/ML). CRUD requires domain permissions; viewing requires `view_domains`.

| Method | Path                        | Permission      | Description                      |
| ------ | --------------------------- | --------------- | -------------------------------- |
| GET    | `/v1/domains`               | `view_domains`  | List (paginated)                 |
| GET    | `/v1/domains/reviewers`     | `manage_users`  | All reviewers grouped by domain  |
| GET    | `/v1/domains/:id`           | `view_domains`  | Get one                          |
| PATCH  | `/v1/domains/:id`           | `update_domain` | Update                           |
| DELETE | `/v1/domains/:id`           | `delete_domain` | Delete (409 if skills linked)    |
| GET    | `/v1/domains/:id/reviewers` | `manage_users`  | Reviewers assigned to one domain |
| GET    | `/v1/domains/:id/skills`    | `view_domains`  | All skills in this domain        |
| POST   | `/v1/domains/:id/skills`    | `update_domain` | Link 1..many skills (bulk)       |

### Skills

The skill catalog. Only Admin manages it; all authenticated users can browse.

| Method | Path             | Permission     | Description                                      |
| ------ | ---------------- | -------------- | ------------------------------------------------ |
| GET    | `/v1/skills`     | `view_skills`  | List (paginated)                                 |
| GET    | `/v1/skills/:id` | `view_skills`  | Get one                                          |
| POST   | `/v1/skills`     | `create_skill` | Create                                           |
| PATCH  | `/v1/skills/:id` | `update_skill` | Update (name, description, `active`/`inactive`)  |
| DELETE | `/v1/skills/:id` | `delete_skill` | Delete (409 if linked to users/projects/domains) |

### Languages

| Method | Path                | Description                           |
| ------ | ------------------- | ------------------------------------- |
| GET    | `/v1/languages`     | List catalog (id, name, code, status) |
| POST   | `/v1/languages`     | Create language (Admin)               |
| GET    | `/v1/languages/:id` | Get one                               |
| PATCH  | `/v1/languages/:id` | Update language (Admin)               |
| DELETE | `/v1/languages/:id` | Delete language (Admin)               |

### Projects

A project belongs to a user, carries one domain, links evidence files (MinIO), and goes through `draft → submitted → under_review → verified`. Only `draft`/`submitted` projects can be edited/deleted.

| Method | Path                                    | Description                                  |
| ------ | --------------------------------------- | -------------------------------------------- |
| GET    | `/v1/projects`                          | My projects (paginated)                      |
| POST   | `/v1/projects`                          | Create (title, description, domain_id, URLs) |
| GET    | `/v1/projects/:id`                      | Project detail with evidence                 |
| PATCH  | `/v1/projects/:id`                      | Update (draft/submitted only)                |
| DELETE | `/v1/projects/:id`                      | Delete (draft/submitted only)                |
| POST   | `/v1/projects/:id/submit`               | Submit for review → `submitted`              |
| GET    | `/v1/projects/:id/evidence`             | Evidence files with presigned URLs           |
| POST   | `/v1/projects/:id/evidence/link`        | Attach an uploaded document as evidence      |
| DELETE | `/v1/projects/:id/evidence/:evidenceId` | Detach evidence                              |
| GET    | `/v1/projects/all`                      | Admin: all projects (paginated)              |
| GET    | `/v1/projects/user/:userId`             | Admin: projects of a specific user           |
| GET    | `/v1/projects/:id/admin`                | Admin: single project                        |
| PATCH  | `/v1/projects/:id/admin`                | Admin: update any project                    |
| PATCH  | `/v1/projects/:id/status`               | Admin: set status manually                   |

### Reviews (Reviewer — rating flow)

Reviewers are assigned one or more domains (at approval or later by admin via `PUT /v1/users/:id/review-domains`). They can then rate **other users'** projects inside their domains.

| Method | Path                          | Description                                                               |
| ------ | ----------------------------- | ------------------------------------------------------------------------- |
| GET    | `/v1/reviews/available`       | Projects in my domains that need a rating                                 |
| GET    | `/v1/reviews/history`         | Projects I've already rated (with averages)                               |
| GET    | `/v1/reviews/domains`         | My assigned domains                                                       |
| GET    | `/v1/reviews/:id`             | Project detail with ratings + evidence                                    |
| POST   | `/v1/reviews/:projectId/rate` | Rate a project (`rating` 1–10, `feedback`?) ; `under_review` → `verified` |
| PUT    | `/v1/reviews/:projectId/rate` | Update my rating for a project                                            |

### Reviewer domain management (Admin)

| Method | Path                                     | Description                                   |
| ------ | ---------------------------------------- | --------------------------------------------- |
| GET    | `/v1/users/:id/review-domains`           | Domains assigned to a reviewer                |
| PUT    | `/v1/users/:id/review-domains`           | Replace the reviewer's domains (`domain_ids`) |
| DELETE | `/v1/users/:id/review-domains/:domainId` | Remove one domain                             |

### Roles & Permissions

Roles gate every module via granular permissions (`view_domains`, `create_skill`, `manage_users`, `review_projects`, ...). The Admin role holds everything and cannot be selected at registration.

| Method | Path                                      | Description                                                 |
| ------ | ----------------------------------------- | ----------------------------------------------------------- |
| GET    | `/v1/roles`                               | Public list of selectable roles (for registration dropdown) |
| GET    | `/v1/roles/:id`                           | Get role                                                    |
| POST   | `/v1/roles`                               | Create role                                                 |
| PATCH  | `/v1/roles/:id`                           | Update role                                                 |
| DELETE | `/v1/roles/:id`                           | Delete role                                                 |
| GET    | `/v1/roles/:id/permissions`               | Role's permissions                                          |
| POST   | `/v1/roles/:id/permissions`               | Assign permission to role                                   |
| DELETE | `/v1/roles/:id/permissions/:permissionId` | Remove permission                                           |
| GET    | `/v1/roles/:id/users`                     | Users having this role                                      |
| GET    | `/v1/permissions`                         | List permissions                                            |
| POST   | `/v1/permissions`                         | Create permission                                           |
| PATCH  | `/v1/permissions/:id`                     | Update permission                                           |
| DELETE | `/v1/permissions/:id`                     | Delete permission                                           |

Roles/permissions management requires `manage_roles` / `manage_permissions`.

### Documents

| Method | Path                   | Auth | Description                                  |
| ------ | ---------------------- | ---- | -------------------------------------------- |
| POST   | `/v1/documents/upload` | Yes  | Upload a file to MinIO (`file` multipart)    |
| GET    | `/v1/documents/:id`    | Yes  | Document metadata + presigned `download_url` |
| DELETE | `/v1/documents/:id`    | Yes  | Delete document (owner or admin)             |

### Health

| Method | Path      | Auth | Description                 |
| ------ | --------- | ---- | --------------------------- |
| GET    | `/health` | No   | Database connectivity check |

---

## Curl Examples

### Login (stores auth cookie)

```bash
curl -s -c cookies.txt -X POST http://localhost:3001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "admin@jadara.com", "password": "Admin@12345" }'
```

### Register as a Beneficiary (JSON — active immediately)

```bash
curl -s -c cookies.txt -X POST http://localhost:3001/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ben@example.com",
    "password": "Secret123!",
    "first_name": "John",
    "last_name": "Doe",
    "role_id": 1
  }'
```

### Register as a Reviewer (multipart — pending until approved)

```bash
curl -s -X POST http://localhost:3001/v1/auth/register \
  -F "email=rev@example.com" -F "password=Secret123!" \
  -F "first_name=Reviewer" -F "last_name=One" -F "role_id=2" \
  -F "domain_ids[]=1" -F "domain_ids[]=3" \
  -F "files=@/path/to/cv.pdf"
```

### Approve a registration demand (Admin)

```bash
# 1. list pending demands, 2. approve the one you want
curl -s -b cookies.txt http://localhost:3001/v1/demands
curl -s -b cookies.txt -X POST http://localhost:3001/v1/demands/6/approve
```

### Generate a CV PDF

```bash
curl -s -b cookies.txt -X POST http://localhost:3001/v1/users/me/pdf-generate
# → completed + download_url, or incomplete + missing_fields
curl -s -b cookies.txt http://localhost:3001/v1/users/me/pdf-status
```

### Create a project → upload evidence → submit

```bash
curl -s -b cookies.txt -X POST http://localhost:3001/v1/projects \
  -H "Content-Type: application/json" \
  -d '{ "title": "My App", "description": "A demo", "domain_id": 1, "github_url": "https://github.com/me/app" }'

curl -s -b cookies.txt -X POST http://localhost:3001/v1/documents/upload \
  -F "file=@/path/to/screenshot.png"

curl -s -b cookies.txt -X POST http://localhost:3001/v1/projects/9/evidence/link \
  -H "Content-Type: application/json" \
  -d '{ "document_id": 21 }'

curl -s -b cookies.txt -X POST http://localhost:3001/v1/projects/9/submit
```

### Rate a project (Reviewer)

```bash
curl -s -b cookies.txt http://localhost:3001/v1/reviews/available
curl -s -b cookies.txt -X POST http://localhost:3001/v1/reviews/8/rate \
  -H "Content-Type: application/json" \
  -d '{ "rating": 9, "feedback": "Great work" }'
```

### Browse catalog → attach my skills

```bash
# 1. list domains, 2. see its skills, 3. attach mine with levels
curl -s -b cookies.txt http://localhost:3001/v1/domains
curl -s -b cookies.txt http://localhost:3001/v1/domains/1/skills

curl -s -b cookies.txt -X POST http://localhost:3001/v1/users/me/skills \
  -H "Content-Type: application/json" \
  -d '{ "skills": [ { "skill_id": 6, "level": "advanced" }, { "skill_id": 25, "level": "expert" } ] }'
```

### Access a public profile

```bash
curl -s -b cookies.txt http://localhost:3001/v1/users/10/profile
```

### Refresh token / change password / logout

```bash
curl -s -X POST http://localhost:3001/v1/auth/refresh-token -b cookies.txt
curl -s -X POST http://localhost:3001/v1/auth/change-password -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{ "oldPassword": "Secret123!", "newPassword": "NewSecret456!" }'
curl -s -X POST http://localhost:3001/v1/auth/logout -b cookies.txt
```

---

## Project Structure

```
backend/
├── src/
│   ├── app.ts                     # Express app setup & route mounting
│   ├── index.ts                   # Server entry point
│   └── modules/
│       ├── auth/                  # Register (role-based), login, refresh, logout + device tracking
│       │   ├── auth.{controller,routes,service,validator}.ts
│       │   ├── refresh-token.repository.ts
│       │   ├── login-history.repository.ts
│       │   └── device.repository.ts
│       ├── users/                 # User CRUD + profile + public profile + socials + skills
│       │   ├── user.repository.ts
│       │   ├── users.{controller,routes,service,validator}.ts
│       │   ├── user-skills.{controller,repository,service,validator}.ts
│       │   └── users-cv.{controller,routes,repository,service,validator}.ts  # experience/education/certs/languages
│       ├── cv-pdf/                # CV PDF generation (Mustache → LaTeX → MinIO)
│       ├── demands/               # Registration demands (admin list/approve/reject)
│       ├── domains/               # Skill categories + reviewer assignments
│       ├── skills/                # Skill catalog CRUD
│       ├── languages/             # Language catalog CRUD
│       ├── documents/             # File upload/retrieval (MinIO)
│       ├── projects/              # Project CRUD + submit + evidence
│       ├── reviews/               # Rating flow (available/history/rate) + reviewer domains
│       ├── roles/                 # Roles, RBAC assignment
│       └── permissions/           # Permission CRUD
├── framework/
│   ├── config/                    # Prisma, env, logger, Swagger, MinIO buckets
│   ├── middleware/                # verifyAccessToken, checkPermission,
│   │                              # zodValidate(zodValidateQuery), rateLimiter,
│   │                              # errorHandler, upload, requestId, originCheck...
│   ├── types/                     # TypeScript type extensions
│   └── utils/                     # JWT, hash, AppError, response, storage (MinIO)
├── templates/
│   └── ats-cv.tex                 # LaTeX CV template (Mustache variables)
├── prisma/
│   ├── schema.prisma              # Database schema (27 models + enums)
│   ├── migrations/                # Versioned SQL migrations
│   ├── seed.ts                    # Domains, sub-domains, skills, languages, social platforms
│   └── seed_users.ts              # Roles, permissions, role permissions, default users
├── doc/
│   ├── schema.puml / schema.png   # ER diagram
│   ├── architecture.md            # Architecture notes
│   ├── auth/                      # Per-endpoint curl case docs
│   ├── domains/ skills/ users/    #   ...one .txt per endpoint group
│   ├── demands/ projects/ reviews/#
│   └── ...
├── tests/                         # Vitest tests
├── uploads/                       # Local fallback uploads (gitignored)
└── logs/                          # Application logs (gitignored)
```

Each module follows the same layering: `routes → controller → service → repository`, with Zod validators and per-route rate limits + permission checks.

---

## Scripts

| Command                 | Description                            |
| ----------------------- | -------------------------------------- |
| `npm run dev`           | Start dev server with hot reload       |
| `npm run build`         | Compile TypeScript                     |
| `npm start`             | Start production server                |
| `npm run db:generate`   | Generate Prisma client                 |
| `npm run db:migrate`    | Run Prisma migrations                  |
| `npm run db:seed`       | Seed database with default data        |
| `npm run db:seed:users` | Seed roles, permissions and users only |
| `npm run db:studio`     | Open Prisma Studio (DB browser)        |
| `npm run db:push`       | Push schema to database (no migration) |
| `npm run lint`          | Run ESLint                             |
| `npm run lint:fix`      | Run ESLint with auto-fix               |
| `npm run format`        | Format code with Prettier              |
| `npm test`              | Run tests with Vitest                  |
| `npm run test:coverage` | Run tests with coverage                |

---

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

---

## Swagger Documentation

When server is running:

- **UI**: http://localhost:3001/api-docs
- **JSON**: http://localhost:3001/api-json

---

## ER Diagram

Generated diagram lives at `doc/schema.png` (source: `doc/schema.puml`). Covers users, profiles, roles, permissions, login history, refresh tokens, devices, domains, skills, user skills, projects (with domain), project evidence, project reviews, reviewer domains, registration demands, documents, CV data (work experience, education, certifications, languages), user socials, and CV generation requests.

---

## Deployment with PM2

```bash
# Build
npm run build

# Start with PM2
pm2 start ecosystem.config.cjs --env production

# Useful commands
pm2 status
pm2 logs jadara-api
pm2 restart jadara-api
pm2 stop jadara-api
```

---

## License

ISC
