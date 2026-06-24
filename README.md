# ClickSuite Backend

Production-minded **NestJS + Prisma + PostgreSQL** API for **ClickSuite.app** — a booking & studio-management SaaS for photographers, videographers, event teams and small creative studios.

This first release ships two modules: **Auth** and **Bookings**, with a multi-tenant workspace model designed so future modules (payments, team assignment, quotations, calendar sync) drop in cleanly.

- Runtime: NestJS 11 (modular monolith), TypeScript
- DB: PostgreSQL (Neon in production) via Prisma 6
- Auth: JWT (bcrypt password hashing)
- Docs: Swagger / OpenAPI at `/api/docs`
- Deploy target: Railway

---

## Quick start (local)

```bash
# 1. install
npm install            # also runs `prisma generate` via postinstall

# 2. configure environment
cp .env.example .env   # then edit DATABASE_URL + JWT_SECRET

# 3. create the database schema
npm run prisma:migrate # creates tables + the initial migration

# 4. (optional) seed demo data
npm run prisma:seed    # demo@clicksuite.app / Password123!

# 5. run
npm run start:dev
```

API base URL: `http://localhost:4000/api`
Swagger docs: `http://localhost:4000/api/docs`
Health check: `http://localhost:4000/api/health`

> The frontend (separate project) runs on `http://localhost:3000`; CORS is preconfigured for it.

---

## Environment variables

| Variable             | Description                                          | Example |
|----------------------|------------------------------------------------------|---------|
| `NODE_ENV`           | Runtime environment                                  | `development` |
| `PORT`               | HTTP port (Railway injects this)                     | `4000` |
| `DATABASE_URL`       | PostgreSQL connection string (Neon needs `sslmode=require`) | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET`         | Secret used to sign access tokens                    | _a long random string_ |
| `JWT_EXPIRES_IN`     | Token lifetime                                       | `7d` |
| `FRONTEND_URL`       | Allowed CORS origin                                  | `http://localhost:3000` |
| `BCRYPT_SALT_ROUNDS` | bcrypt cost factor                                   | `10` |

The real `.env` is git-ignored — never commit secrets.

---

## NPM scripts

| Script | Purpose |
|--------|---------|
| `npm run start:dev` | Watch-mode dev server |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run compiled server (`node dist/main`) |
| `npm run lint` | ESLint (auto-fix) |
| `npm test` | Jest unit tests |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Create/apply a dev migration |
| `npm run prisma:deploy` | Apply migrations in production (no prompts) |
| `npm run prisma:studio` | Prisma Studio data browser |
| `npm run prisma:seed` | Seed demo user/workspace/bookings |

---

## Data model

```
User ─< WorkspaceMember >─ Workspace ─< Booking
```

- **User** — account holder (`email` unique, `passwordHash`, `isActive`).
- **Workspace** — a photography/videography business.
- **WorkspaceMember** — join table with a `role` (`OWNER | ADMIN | MANAGER | TEAM_MEMBER`); unique per `(userId, workspaceId)`.
- **Booking** — belongs to a workspace; carries client info, event details, money fields and three status enums.

On registration the user is created together with their first workspace, and is made its **OWNER**.

**Multi-tenancy:** every booking belongs to a workspace, and every booking operation verifies the authenticated user is a member of that workspace. Single-resource routes derive the workspace from the booking itself and return `404` for bookings the user can't access, so cross-workspace data is never exposed.

Indexes are defined on: `User.email`, `WorkspaceMember.userId`, `WorkspaceMember.workspaceId`, `Booking.workspaceId`, `Booking.eventDate`, `Booking.bookingStatus`, `Booking.paymentStatus`, `Booking.workProgressStatus`, and a composite `Booking(workspaceId, eventDate)`.

---

## API overview

All routes are prefixed with `/api`. Responses use a consistent envelope:

```jsonc
// success
{ "success": true, "message": "Booking created successfully", "data": { /* ... */ } }

// paginated
{ "success": true, "message": "Bookings fetched successfully",
  "data": [ /* ... */ ],
  "pagination": { "page": 1, "limit": 10, "total": 25, "totalPages": 3 } }

// error
{ "success": false, "message": "Unauthorized access to workspace", "error": "FORBIDDEN" }
```

### Auth
| Method & path | Auth | Body |
|---|---|---|
| `POST /api/auth/register` | – | `fullName, email, password, workspaceName, businessType?, phone?, workspaceEmail?, location?, mainServiceCategory?` |
| `POST /api/auth/login` | – | `email, password` |
| `GET /api/auth/me` | Bearer | – |

JWT payload: `{ sub: userId, email }`. Send it as `Authorization: Bearer <token>`.

### Bookings (all require Bearer auth)
| Method & path | Notes |
|---|---|
| `POST /api/bookings` | Create. Needs `workspaceId`; `balanceAmount` and `paymentStatus` are derived. |
| `GET /api/bookings?workspaceId=…` | List. Supports `page`, `limit`, `search`, `status`, `paymentStatus`, `workProgressStatus`, `eventDate`. |
| `GET /api/bookings/:id` | Single booking (access validated against its workspace). |
| `PATCH /api/bookings/:id` | Update editable fields; money fields + payment status recalculated. |
| `PATCH /api/bookings/:id/status` | Body: `{ bookingStatus }`. |
| `PATCH /api/bookings/:id/work-progress` | Body: `{ workProgressStatus }`. |
| `PATCH /api/bookings/:id/cancel` | Soft-cancel. Body: `{ reason? }` (stored on `cancellationReason`). |

**Payment status rules:** `advance = 0 → UNPAID`, `0 < advance < total → PARTIALLY_PAID`, `advance = total → FULLY_PAID`. Validation rejects `advanceAmount > totalAmount`.

---

## Deploying to Railway

1. Create a Railway project and connect this repo (root = `Backend/`).
2. Add a Neon PostgreSQL database (or Railway's Postgres) and copy its connection string.
3. Set the environment variables in Railway:
   - `DATABASE_URL` (Neon, with `?sslmode=require`)
   - `JWT_SECRET`, `JWT_EXPIRES_IN`
   - `FRONTEND_URL` (e.g. `https://clicksuite.app`)
   - `BCRYPT_SALT_ROUNDS`
   - `NODE_ENV=production`
   - `PORT` is provided automatically by Railway; the app binds to it.
4. Deploy. The included [`railway.json`](railway.json) runs:
   - **build:** `npm run build` (Prisma client is generated on `postinstall`)
   - **start:** `npx prisma migrate deploy && node dist/main`
   - **healthcheck:** `GET /api/health`

`prisma migrate deploy` applies committed migrations on every release without interactive prompts.

---

## Frontend integration

The Next.js frontend swaps from mock data to this API by setting:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

> **Field-name mapping:** the frontend's current domain types use lowercase enum values and slightly different field names (e.g. `status`/`workStatus`, `paidAmount`). This backend follows the documented backend contract (`bookingStatus`/`workProgressStatus`, uppercase enums, `advanceAmount`/`balanceAmount`). A thin mapping layer in the frontend's API service is the intended place to reconcile the two when wiring live calls.

---

## Testing checklist

- ✅ Project builds (`npm run build`)
- ✅ Prisma schema validates (`npx prisma validate`)
- ✅ Lint passes (`npm run lint`)
- ✅ Unit tests pass (`npm test`)
- ✅ App boots and maps all routes (verified; needs a reachable `DATABASE_URL` to fully start)

End-to-end flow (register → login → `me` → create booking → list/filter → update/status/cancel) requires a live PostgreSQL/Neon `DATABASE_URL`; once set, run `npm run prisma:migrate` then exercise the endpoints via Swagger at `/api/docs`.

---

## What's intentionally not built yet

Payment gateway, Google Calendar sync, email sending, team-assignment, and quotation/invoice modules are out of scope for this release. The schema and module layout leave room to add them without rework.
