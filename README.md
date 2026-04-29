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
- InsForge-hosted object storage (private bucket, downloads streamed via service)

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
- InsForge (managed PostgreSQL + object storage)
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
                            ┌───────┴────────────┐
                            │  InsForge          │
                            │ (Postgres + Object │
                            │       Storage)     │
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
│   └── init.sql             # PostgreSQL schema
├── docker-compose.yml       # Container orchestration
├── .env.example             # Environment template
└── package.json             # Root workspace config
```

## Prerequisites

- Node.js >= 18.0.0
- Docker & Docker Compose
- An InsForge project (for Postgres + storage) — see https://insforge.dev
- Gmail account with App Password (for SMTP)
- Google Cloud project (for Meet integration, optional)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd vidyashaale
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Generate JWT secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Edit .env with your values
nano .env
```

### 3. Required Environment Variables

```bash
# JWT (required)
JWT_SECRET=<generated-secret>

# InsForge: Postgres connection string (required)
DATABASE_URL=postgresql://postgres:edb7cdfa3497e271ae4576e3eaaf58d1@wk73xmua.ap-southeast.database.insforge.app:5432/insforge?sslmode=require

# InsForge: object storage (required for resource uploads)
STORAGE_TYPE=INSFORGE
INSFORGE_URL=https://your-project.us-east.insforge.app
INSFORGE_ANON_KEY=your-insforge-anon-key
STORAGE_BUCKET=vidyashaale

# SMTP for email notifications (required for production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password    # Gmail App Password, not regular password
FROM_EMAIL=noreply@yourdomain.com

# Google Meet (optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
```

### 3a. One-Time InsForge Setup

```bash
# Link or create the InsForge project (writes .insforge/project.json)
npx @insforge/cli link        # existing project
# or: npx @insforge/cli create

# Get your anon key
npx @insforge/cli secrets get ANON_KEY

# Apply the schema to the InsForge-hosted Postgres
psql "$DATABASE_URL" -f database/init.sql

# Create the private storage bucket (must match STORAGE_BUCKET)
# via the InsForge dashboard or admin API
```

### 4. Start with Docker

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:8080

## Development Setup

### Install Dependencies

```bash
# Install all dependencies (root + all workspaces)
npm install
```

### Run in Development Mode

```bash
# Start all services with hot reload
npm run dev

# Or start specific services
npm run dev:frontend    # Frontend only
npm run dev:services    # All backend services
```

### Database Setup

The database is hosted on InsForge. Apply the schema once:

```bash
psql "$DATABASE_URL" -f database/init.sql
```

## Configuration Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | Environment mode |
| `JWT_SECRET` | - | Secret for JWT signing (required) |
| `DATABASE_URL` | - | InsForge Postgres connection string (required) |
| `REDIS_PORT` | 6379 | Redis port |
| `STORAGE_TYPE` | INSFORGE | Storage backend (INSFORGE, LOCAL, S3) |
| `INSFORGE_URL` | - | InsForge project base URL (when STORAGE_TYPE=INSFORGE) |
| `INSFORGE_ANON_KEY` | - | InsForge anon key (when STORAGE_TYPE=INSFORGE) |
| `STORAGE_BUCKET` | vidyashaale | Object storage bucket name |
| `STORAGE_LOCAL_PATH` | /data/uploads | Local storage path (when STORAGE_TYPE=LOCAL) |
| `MAX_FILE_SIZE` | 52428800 | Max upload size (50MB) |
| `RATE_LIMIT_MAX` | 100 | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | 60000 | Rate limit window (1 minute) |

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
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Code Quality

```bash
# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format
```

## Troubleshooting

### SMTP Not Working
1. Ensure you're using a Gmail App Password, not your regular password
2. Enable 2-Step Verification on your Google account
3. Generate App Password at https://myaccount.google.com/apppasswords

### Files Not Uploading
1. Verify `INSFORGE_URL`, `INSFORGE_ANON_KEY`, and `STORAGE_BUCKET` are set
2. Confirm the bucket exists in the InsForge dashboard
3. Check container logs: `docker logs vidyashaale-resource`

### Database Connection Issues
1. Verify `DATABASE_URL` is set and reachable: `psql "$DATABASE_URL" -c "select 1"`
2. Check connection string in service logs
3. Ensure schema was applied: `psql "$DATABASE_URL" -f database/init.sql`

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
