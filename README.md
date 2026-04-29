# Vidyashaale

An online education platform for educators and students to schedule classes, share learning materials, and manage assignments.

## Overview

Vidyashaale is a full-featured Learning Management System (LMS) built with a microservices architecture. It provides educators with tools to create and manage classes, share resources, create assignments, and communicate with students through integrated notifications. Students can enroll in classes, access learning materials, submit assignments, and join virtual meetings.

## Features

### User Management
- Role-based access control (Admin, Educator, Student)
- Email verification with token-based confirmation
- Password reset functionality
- JWT-based authentication with refresh tokens

### Class Management
- Schedule classes with date, time, and duration
- Support for recurring classes (daily, weekly, custom patterns)
- Class topics and descriptions
- Student enrollment management

### Virtual Meetings
- Google Meet integration for virtual classes
- Automatic meeting link generation
- Manual meeting link option with password protection

### Resource Management
- Upload and share class materials (PDFs, documents, images, videos)
- Multiple resource types: readings, notes, assignments
- 50MB file size limit per upload
- 500MB storage quota per class
- Pluggable storage backend: local filesystem (default), AWS S3, or InsForge object storage

### Assignments
- Create assignments with due dates
- Attach files to assignments
- Student submission tracking
- Late submission detection

### Notifications
- Email notifications for class updates
- Assignment reminders
- Class reminders (15 minutes before start)
- Async job processing via Bull queue

## Technology Stack

### Frontend
- React 18 with TypeScript
- React Router for navigation
- Axios for API communication
- date-fns for date formatting

### Backend
- Node.js with Express.js
- TypeScript
- PostgreSQL 15 (local via Docker by default; InsForge-hosted Postgres also supported)
- Redis 7 (notification queue)

### Infrastructure
- Docker & Docker Compose
- Microservices architecture
- API Gateway pattern

## Architecture

```
┌─────────────┐     ┌─────────────────────────────────────────────────┐
│   Frontend  │────▶│              API Gateway (:8080)                │
│   (:3000)   │     │   (Rate Limiting, JWT Validation, Routing)      │
└─────────────┘     └─────────────────────────────────────────────────┘
                                          │
        ┌─────────────┬─────────────┬─────┴─────┬─────────────┬─────────────┐
        ▼             ▼             ▼           ▼             ▼             ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
   │  Auth   │  │  Class  │  │ Meeting │  │Resource │  │ Notifi- │  │  Redis  │
   │ (:8081) │  │ (:8082) │  │ (:8083) │  │ (:8084) │  │ cation  │  │ (:6379) │
   └────┬────┘  └────┬────┘  └─────────┘  └────┬────┘  │ (:8085) │  └────┬────┘
        │            │                         │       └────┬────┘       │
        └────────────┴─────────────────────────┴────────────┴────────────┘
                                    │
                          ┌─────────┴──────────┐
                          │     PostgreSQL     │
                          │ (local Docker, or  │
                          │  InsForge-hosted)  │
                          └────────────────────┘
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React SPA |
| Gateway | 8080 | API Gateway with rate limiting and JWT validation |
| Auth | 8081 | User registration, login, email verification |
| Class | 8082 | Class and assignment management |
| Meeting | 8083 | Google Meet integration |
| Resource | 8084 | File upload and storage |
| Notification | 8085 | Email notifications via Bull queue |
| Postgres | 5432 | Database (local Docker container) |
| Redis | 6379 | Bull queue backend |

## Project Structure

```
vidyashaale/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context (AuthContext)
│   │   └── api/             # API client
│   └── package.json
├── services/                 # Backend microservices
│   ├── gateway/             # API Gateway
│   ├── auth/                # Authentication service
│   ├── class/               # Class management service
│   ├── meeting/             # Google Meet integration
│   ├── resource/            # File storage service
│   └── notification/        # Email notification service
├── packages/
│   └── shared/              # Shared types and utilities
├── database/
│   └── init.sql             # PostgreSQL schema (auto-applied to local Postgres)
├── docker-compose.yml       # Container orchestration
├── .env.example             # Environment template
└── package.json             # Root workspace config
```

## Prerequisites

- Node.js >= 18.0.0
- Docker & Docker Compose
- Gmail account with App Password (optional, for SMTP-backed email)
- Google Cloud project (optional, for Google Meet integration)

> InsForge is **optional**. The default local setup uses a Postgres container and the local filesystem for storage — no external services required.

## Quick Start

### 1. Clone and configure

```bash
git clone <repository-url>
cd vidyashaale

# Copy environment template
cp .env.example .env
```

The committed `.env.example` is preconfigured for local Docker Postgres + local-filesystem storage. The only thing you may want to change before first run is `JWT_SECRET`:

```bash
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
# paste into .env
```

### 2. Install dependencies

```bash
npm install
```

### 3. Choose how to run

You can run the full stack in containers, or only run infrastructure (Postgres + Redis) in containers and run the Node services locally with hot reload.

#### Option A — Fully containerized

```bash
npm run docker:up      # build (first time) + start all 9 containers
npm run docker:logs    # tail logs
npm run docker:down    # stop and remove
```

This brings up Postgres, Redis, all 6 backend services, and the nginx-served frontend build.

#### Option B — Local dev with hot reload (recommended for development)

```bash
npm run dev            # starts Postgres + Redis in Docker, then runs services + frontend with ts-node-dev / CRA
```

Or break it apart:

```bash
npm run dev:infra      # only Postgres + Redis (Docker)
npm run dev:services   # all 6 backend services with hot reload
npm run dev:frontend   # CRA dev server on :3000
```

### 4. Access the application

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Postgres**: `postgresql://vidyashaale:vidyashaale_dev@localhost:5432/vidyashaale`

## Environment Variables

The committed `.env.example` works out of the box for local development. Key variables:

### Required for local dev
| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `JWT_SECRET` | (placeholder) | Secret for JWT signing — replace before running |
| `POSTGRES_USER` | `vidyashaale` | Postgres user (matches docker volume) |
| `POSTGRES_PASSWORD` | `vidyashaale_dev` | Postgres password |
| `POSTGRES_DB` | `vidyashaale` | Postgres database name |
| `DATABASE_URL` | `postgresql://vidyashaale:vidyashaale_dev@localhost:5432/vidyashaale` | Used by services running on host (dev mode); compose overrides this with the `postgres` service hostname when running containerized |
| `STORAGE_TYPE` | `LOCAL` | `LOCAL`, `S3`, or `INSFORGE` |
| `STORAGE_LOCAL_PATH` | `./data/uploads` | Where uploaded files go on the host (or `/data/uploads` inside the container) |

### Optional integrations

#### SMTP (email notifications)
Leave `SMTP_HOST` blank in development — emails will be logged to the notification service console instead of being sent.

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password    # Gmail App Password, not the account password
FROM_EMAIL=noreply@yourdomain.com
```

#### Google Meet
Leave the four `GOOGLE_*` variables at their placeholder values to disable Google Meet — the meeting service will return a `meetingLink: null` placeholder so educators can paste a link manually.

```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8083/auth/google/callback
GOOGLE_REFRESH_TOKEN=your-refresh-token
```

#### InsForge (optional — managed Postgres + object storage)
To switch from the local Postgres container to InsForge, replace `DATABASE_URL` in `.env` with your InsForge connection string. To use InsForge object storage:

```
STORAGE_TYPE=INSFORGE
INSFORGE_URL=https://your-project.us-east.insforge.app
INSFORGE_ANON_KEY=your-insforge-anon-key
STORAGE_BUCKET=vidyashaale
```

One-time InsForge setup:

```bash
# Link or create the InsForge project (writes .insforge/project.json)
npx @insforge/cli link        # existing project
# or: npx @insforge/cli create

# Get your anon key
npx @insforge/cli secrets get ANON_KEY

# Apply the schema to InsForge-hosted Postgres
psql "$DATABASE_URL" -f database/init.sql

# Create the private storage bucket (must match STORAGE_BUCKET) via the
# InsForge dashboard or admin API
```

#### S3
```
STORAGE_TYPE=S3
AWS_REGION=us-east-1
STORAGE_ACCESS_KEY=...
STORAGE_SECRET_KEY=...
STORAGE_BUCKET=vidyashaale
```

## Database

The local Postgres container automatically runs `database/init.sql` on first start, so you should not need to do anything manually. To re-apply the schema to an existing database (e.g. when using InsForge):

```bash
npm run db:migrate
```

(`db:migrate` reads `DATABASE_URL` from `.env` and runs `psql <url> -f database/init.sql`.)

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Local dev: Docker infra + all services + frontend with hot reload |
| `npm run dev:infra` | Postgres + Redis containers only |
| `npm run dev:infra:down` | Stop infra containers |
| `npm run dev:services` | All 6 backend services with hot reload (no frontend) |
| `npm run dev:frontend` | CRA dev server only |
| `npm run docker:up` | Build (if needed) and start the fully containerized stack |
| `npm run docker:down` | Stop the containerized stack |
| `npm run docker:logs` | Tail logs from all containers |
| `npm run db:migrate` | Apply `database/init.sql` to `$DATABASE_URL` |
| `npm run build` | Build all workspaces |
| `npm run test` | Run tests in all workspaces |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` | Prettier |

## Docker Compose Profiles

The application services and frontend are gated behind a `containerized` Compose profile so that `docker compose up` (no profile) only brings up infrastructure (Postgres + Redis):

```bash
docker compose up -d                          # postgres + redis only
docker compose --profile containerized up -d  # everything
```

`npm run dev:infra` and `npm run docker:up` wrap these for you.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/refresh` - Refresh access token

### Classes
- `GET /api/classes` - List classes
- `POST /api/classes` - Create class (educator)
- `GET /api/classes/:id` - Get class details
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class
- `POST /api/classes/:id/enroll` - Enroll in class

### Assignments
- `GET /api/assignments/class/:classId` - List class assignments
- `POST /api/assignments` - Create assignment
- `PUT /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment

### Resources
- `GET /api/resources/class/:classId` - List class resources
- `GET /api/resources/assignment/:assignmentId` - List assignment resources
- `POST /api/resources/upload` - Upload resource
- `GET /api/resources/:id/download` - Download resource
- `DELETE /api/resources/:id` - Delete resource

## Testing

```bash
npm test                 # run all workspace tests
npm run test:coverage    # with coverage (per-workspace)
npm run test:watch       # watch mode (per-workspace)
```

## Code Quality

```bash
npm run lint
npm run lint:fix
npm run format
```

## Troubleshooting

### Port already in use (`EADDRINUSE`)
Another instance of `npm run dev` is still running. Kill orphans:

```bash
pkill -f ts-node-dev
pkill -f react-scripts
```

### Postgres container fails with "incompatible data directory"
A previously-initialized volume from a different Postgres major version exists. Either pin the image to the matching major in `docker-compose.yml` or remove the stale volume (this destroys local data):

```bash
docker compose down
docker volume rm vidyashaale_postgres_data
```

### SMTP not working
1. In dev, leave `SMTP_HOST` blank — the notification service will log emails to the console instead of attempting to send.
2. For Gmail: enable 2-Step Verification, then generate an App Password at https://myaccount.google.com/apppasswords.

### Files not uploading
1. With `STORAGE_TYPE=LOCAL`, ensure `STORAGE_LOCAL_PATH` is writable by the service.
2. With `STORAGE_TYPE=INSFORGE`, verify `INSFORGE_URL`, `INSFORGE_ANON_KEY`, and `STORAGE_BUCKET`, and that the bucket exists in the InsForge dashboard.
3. Check service logs: `docker logs vidyashaale-resource` (containerized) or the `[resource]` lines from `npm run dev:services`.

### Database connection issues
1. Check Postgres is up: `docker ps | grep postgres`.
2. Verify reachability: `psql "$DATABASE_URL" -c 'select 1'`.
3. Re-apply schema if needed: `npm run db:migrate`.

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
