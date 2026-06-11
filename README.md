# NCF Research Nexus — Backend

Academic research repository backend for **Naga College Foundation**. Built with NestJS, PostgreSQL, DrizzleORM, and Cloudflare R2.

## System Overview

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 + NestJS 11 |
| Database | PostgreSQL 16 + DrizzleORM |
| File Storage | Cloudflare R2 (S3-compatible) |
| Auth | Passport.js + JWT (access + refresh tokens) |
| Validation | Zod |
| Email | Nodemailer + Handlebars templates |
| Rate Limiting | @nestjs/throttler (60 req/min) |
| Security | Helmet, CORS, global auth guard |
| Docs | Swagger/OpenAPI at `/api/docs` |

## Prerequisites

- Node.js 22+
- PostgreSQL 16 (or Docker)
- Cloudflare R2 bucket + API tokens (for file uploads)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL
docker compose up -d

# 3. Copy and configure environment
cp .env.example .env
# Edit .env with your database and R2 credentials

# 4. Generate and apply database migrations
npm run db:generate
npm run db:migrate

# 5. Start development server
npm run start:dev
```

Server runs at `http://localhost:3000`  
Swagger docs at `http://localhost:3000/api/docs`

## Project Structure

```
src/
├── common/              # Guards, decorators, filters, pipes
│   ├── guards/          # JwtAuthGuard, RolesGuard
│   ├── decorators/      # @Public(), @CurrentUser(), @Roles()
│   └── filters/         # Global exception filter
├── config/              # Configuration modules
├── database/
│   ├── schema/          # 19 DrizzleORM table definitions
│   ├── drizzle.module.ts
│   └── drizzle.provider.ts
└── modules/
    ├── auth/            # Register, login, refresh, verify email, password reset
    ├── users/           # User CRUD, heartbeat, online status
    ├── research/        # Research CRUD, authors/categories/keywords, analytics counters
    ├── file/            # Cloudflare R2 PDF streaming, profile picture upload
    ├── search/          # Full-text search (PostgreSQL tsvector)
    ├── analytics/       # Top downloads, trending, totals, time-series
    ├── notifications/   # User notifications, mark read
    ├── collections/     # Bookmark/collection management
    ├── requests/        # PDF access requests
    ├── admin/           # Approve/reject researches, CRUD categories/keywords/institutions
    ├── reference/       # Public lookup: roles, programs, authors
    └── email/           # Nodemailer + Handlebars templates
```

## API Endpoints

Full API reference with request/response samples: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Quick Reference

| Module | Public | Authenticated | Admin |
|---|---|---|---|
| Auth | register, login, refresh, verify-email, forgot-password, reset-password | me | — |
| Users | — | get, update, heartbeat | list, delete, online |
| Research | list, get, download, cite, view | create, update, delete, privacy | — |
| Files | stream PDF, profile picture | replace PDF, upload profile pic | — |
| Search | search | log search | — |
| Analytics | top-downloads, trending, most-cited, most-viewed, totals, time-series | user stats | — |
| Notifications | — | list, mark read | — |
| Collections | — | list, add, remove | — |
| Requests | create PDF request | list, approve, reject | — |
| Admin | — | — | pending/rejected, approve/reject, CRUD categories/keywords/institutions, uploader-stats |
| Reference | roles, programs, authors | — | — |

## Available Scripts

```bash
npm run start:dev     # Development with hot-reload
npm run build         # TypeScript compilation
npm run start:prod    # Production
npm run lint          # ESLint
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
npm run db:generate   # Generate Drizzle migrations
npm run db:migrate    # Apply migrations
npm run db:push       # Push schema (dev only)
npm run db:studio     # Drizzle Studio (GUI)
npm run seed          # Seed database
```

## Auth Flow

1. `POST /auth/register` → creates user, sends verification email
2. `POST /auth/login` → returns `{ accessToken, refreshToken, user }`
3. `accessToken` (15min) in `Authorization: Bearer <token>` header
4. `refreshToken` (7 day) used at `POST /auth/refresh`
5. All endpoints protected by default — use `@Public()` decorator to bypass
6. `@Roles('admin')` restricts to admin users

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | 3000 | Server port |
| `POSTGRES_HOST` | localhost | PostgreSQL host |
| `POSTGRES_PORT` | 5432 | PostgreSQL port |
| `POSTGRES_DB` | ncfresearch | Database name |
| `JWT_SECRET` | — | Access token signing key |
| `JWT_REFRESH_SECRET` | — | Refresh token signing key |
| `R2_ACCOUNT_ID` | — | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | — | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | — | R2 API token secret |
| `EMAIL_USER` | — | SMTP username |
| `EMAIL_PASS` | — | SMTP password |

## Migration from Legacy

This backend replaces the legacy Express.js + MySQL + Google Drive system.  
See [MIGRATION_ROADMAP.md](./MIGRATION_ROADMAP.md) for the full migration plan.
